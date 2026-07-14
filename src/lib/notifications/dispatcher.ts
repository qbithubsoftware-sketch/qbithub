/**
 * Notification dispatcher — the central entry point.
 *
 * Single function `dispatch()` routes a notification event to all relevant
 * channels (in-app, email, WhatsApp) using:
 *   1. Default channel routing (per event)
 *   2. Template lookup from DB
 *   3. Variable substitution
 *   4. Queue insertion (EmailQueue / WhatsAppQueue) or direct write (in-app)
 *   5. NotificationLog audit trail (one row per channel attempt)
 *
 * Queue workers (cron) later pick up queued items and call the provider.
 * In-app notifications are written directly (no queue needed).
 */

import { db } from "@/lib/db";
import {
  type DispatchRequest,
  type DispatchResult,
  type NotificationChannel,
  type InAppPayload,
  type EmailPayload,
  type WhatsAppPayload,
  DEFAULT_CHANNEL_ROUTING,
} from "./types";
import { renderTemplate, DEFAULT_BRAND_VARIABLES, type TemplateRecord } from "./template-engine";
import { getEmailProvider, getWhatsAppProvider } from "./providers";

/** Branding defaults applied to every dispatch. */
const BRAND_DEFAULTS = {
  fromEmail: process.env.EMAIL_FROM_ADDRESS ?? "noreply@qbithub.com",
};

/**
 * Dispatches a notification event to all relevant channels.
 *
 * This is the ONLY function the rest of the codebase should call to send
 * notifications. It handles:
 *   - Channel routing (event → channels)
 *   - Template lookup (event × channel → template)
 *   - Variable substitution
 *   - Queue insertion
 *   - Audit log creation
 *
 * @returns Array of DispatchResult, one per channel.
 */
export async function dispatch(request: DispatchRequest): Promise<DispatchResult[]> {
  const channels = request.channels ?? DEFAULT_CHANNEL_ROUTING[request.event] ?? [];
  const variables: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...DEFAULT_BRAND_VARIABLES, ...request.variables })) {
    if (v !== undefined && v !== null) variables[k] = v;
  }

  // Fetch all active templates for this event
  const templates = await db.notificationTemplate.findMany({
    where: { event: request.event, isActive: true },
  });

  const results: DispatchResult[] = [];

  for (const channel of channels) {
    try {
      const template = findTemplate(templates, channel, request.recipientType);
      if (!template) {
        // No template configured for this channel — skip silently.
        results.push({
          channel,
          status: "failed",
          error: `No active template for event=${request.event}, channel=${channel}, recipient=${request.recipientType}`,
        });
        continue;
      }

      const rendered = renderTemplate(template, variables);
      const result = await dispatchToChannel(channel, template, rendered, request, variables);
      results.push(result);
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`[dispatch] Failed for channel=${channel}, event=${request.event}:`, error);
      results.push({ channel, status: "failed", error });
    }
  }

  return results;
}

/** Finds the matching template for (event, channel, recipientType). */
function findTemplate(
  templates: TemplateRecord[],
  channel: NotificationChannel,
  recipientType: string,
): TemplateRecord | null {
  // Try exact match first
  const exact = templates.find(
    (t) => t.channel === channel && t.recipientType === recipientType,
  );
  if (exact) return exact;

  // Fallback: match on channel only (recipient-agnostic template)
  const fallback = templates.find((t) => t.channel === channel);
  return fallback ?? null;
}

/** Dispatches to a single channel — writes to queue or Notification table. */
async function dispatchToChannel(
  channel: NotificationChannel,
  template: TemplateRecord,
  rendered: { subject: string | null; body: string; htmlBody: string | null },
  request: DispatchRequest,
  variables: Record<string, string>,
): Promise<DispatchResult> {
  switch (channel) {
    case "in_app":
      return dispatchInApp(template, rendered, request);
    case "email":
      return dispatchEmail(template, rendered, request);
    case "whatsapp":
      return dispatchWhatsApp(template, rendered, request);
    case "sms":
      // SMS provider stub — same as WhatsApp path but uses SmsPayload
      return dispatchWhatsApp(template, rendered, request); // temp: route through WhatsApp for now
    case "push":
      // Push notifications — future-ready, log only
      return {
        channel,
        status: "queued",
        messageId: `push-stub-${Date.now()}`,
      };
  }
}

/** Writes an in-app notification directly to the Notification table. */
async function dispatchInApp(
  template: TemplateRecord,
  rendered: { subject: string | null; body: string; htmlBody: string | null },
  request: DispatchRequest,
): Promise<DispatchResult> {
  if (!request.recipientId) {
    return {
      channel: "in_app",
      status: "failed",
      error: "recipientId is required for in-app notifications",
    };
  }

  const payload: InAppPayload = {
    recipientId: request.recipientId,
    recipientType: request.recipientType,
    title: rendered.subject ?? template.name,
    message: rendered.body,
    category: request.workOrderId ? "job" : "system",
    priority: request.priority ?? "normal",
    actionUrl: request.workOrderId ? `/api/fsm/work-orders/${request.workOrderId}` : undefined,
    actionLabel: request.workOrderId ? "View Work Order" : undefined,
    templateId: template.id,
    workOrderId: request.workOrderId,
  };

  const notification = await db.notification.create({
    data: {
      recipientId: payload.recipientId,
      recipientType: payload.recipientType,
      title: payload.title,
      message: payload.message,
      category: payload.category ?? "system",
      priority: payload.priority ?? "normal",
      actionUrl: payload.actionUrl ?? null,
      actionLabel: payload.actionLabel ?? null,
      templateId: payload.templateId ?? null,
      workOrderId: payload.workOrderId ?? null,
    },
  });

  // Also write to NotificationLog for unified audit
  const log = await db.notificationLog.create({
    data: {
      workOrderId: payload.workOrderId ?? "",
      channel: "in_app",
      templateCode: template.code,
      templateId: template.id,
      recipient: payload.recipientId,
      recipientRole: payload.recipientType,
      subject: payload.title,
      body: payload.message,
      status: "sent",
      providerName: "in-app",
      providerMessageId: notification.id,
    },
  });

  return {
    channel: "in_app",
    status: "sent",
    messageId: notification.id,
    logId: log.id,
  };
}

/** Queues an email + writes NotificationLog entry. */
async function dispatchEmail(
  template: TemplateRecord,
  rendered: { subject: string | null; body: string; htmlBody: string | null },
  request: DispatchRequest,
): Promise<DispatchResult> {
  const toAddress = request.recipientContact ?? "";
  if (!toAddress || !toAddress.includes("@")) {
    return {
      channel: "email",
      status: "failed",
      error: `Valid email address required (got: "${toAddress}")`,
    };
  }

  const provider = getEmailProvider();
  const queueRow = await db.emailQueue.create({
    data: {
      toAddress,
      fromAddress: BRAND_DEFAULTS.fromEmail,
      subject: rendered.subject ?? template.name,
      textBody: rendered.body,
      htmlBody: rendered.htmlBody ?? null,
      status: "queued",
      templateId: template.id,
      workOrderId: request.workOrderId ?? null,
      recipientUserId: request.recipientId ?? null,
      providerName: provider.name,
    },
  });

  // Immediate dispatch attempt (serverless-friendly — no separate worker needed)
  try {
    const payload: EmailPayload = {
      to: toAddress,
      from: BRAND_DEFAULTS.fromEmail,
      subject: rendered.subject ?? template.name,
      textBody: rendered.body,
      htmlBody: rendered.htmlBody ?? undefined,
      templateId: template.id,
      workOrderId: request.workOrderId,
      recipientUserId: request.recipientId,
    };
    const result = await provider.send(payload);

    await db.emailQueue.update({
      where: { id: queueRow.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        providerMessageId: result.messageId,
        attempts: { increment: 1 },
      },
    });

    const log = await db.notificationLog.create({
      data: {
        workOrderId: request.workOrderId ?? "",
        channel: "email",
        templateCode: template.code,
        templateId: template.id,
        recipient: toAddress,
        recipientRole: request.recipientType,
        subject: rendered.subject ?? template.name,
        body: rendered.body,
        status: "sent",
        providerName: provider.name,
        providerMessageId: result.messageId,
      },
    });

    return {
      channel: "email",
      status: "sent",
      messageId: result.messageId,
      logId: log.id,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await db.emailQueue.update({
      where: { id: queueRow.id },
      data: {
        status: "failed",
        lastError: error,
        attempts: { increment: 1 },
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // retry in 5min
      },
    });

    const log = await db.notificationLog.create({
      data: {
        workOrderId: request.workOrderId ?? "",
        channel: "email",
        templateCode: template.code,
        templateId: template.id,
        recipient: toAddress,
        recipientRole: request.recipientType,
        subject: rendered.subject ?? template.name,
        body: rendered.body,
        status: "failed",
        error,
        providerName: provider.name,
      },
    });

    return { channel: "email", status: "failed", error, logId: log.id };
  }
}

/** Queues a WhatsApp message + writes NotificationLog entry. */
async function dispatchWhatsApp(
  template: TemplateRecord,
  rendered: { subject: string | null; body: string; htmlBody: string | null },
  request: DispatchRequest,
): Promise<DispatchResult> {
  const toPhone = request.recipientContact ?? "";
  if (!toPhone || !toPhone.match(/^\+?\d{10,15}$/)) {
    return {
      channel: "whatsapp",
      status: "failed",
      error: `Valid phone number required (got: "${toPhone}")`,
    };
  }

  const provider = getWhatsAppProvider();
  const queueRow = await db.whatsAppQueue.create({
    data: {
      toPhone,
      body: rendered.body,
      templateName: template.code,
      status: "queued",
      templateId: template.id,
      workOrderId: request.workOrderId ?? null,
      recipientUserId: request.recipientId ?? null,
      providerName: provider.name,
    },
  });

  try {
    const payload: WhatsAppPayload = {
      toPhone,
      body: rendered.body,
      templateName: template.code,
      templateId: template.id,
      workOrderId: request.workOrderId,
      recipientUserId: request.recipientId,
    };
    const result = await provider.send(payload);

    await db.whatsAppQueue.update({
      where: { id: queueRow.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        providerMessageId: result.messageId,
        attempts: { increment: 1 },
      },
    });

    const log = await db.notificationLog.create({
      data: {
        workOrderId: request.workOrderId ?? "",
        channel: "whatsapp",
        templateCode: template.code,
        templateId: template.id,
        recipient: toPhone,
        recipientRole: request.recipientType,
        subject: rendered.subject ?? "",
        body: rendered.body,
        status: "sent",
        providerName: provider.name,
        providerMessageId: result.messageId,
      },
    });

    return {
      channel: "whatsapp",
      status: "sent",
      messageId: result.messageId,
      logId: log.id,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await db.whatsAppQueue.update({
      where: { id: queueRow.id },
      data: {
        status: "failed",
        lastError: error,
        attempts: { increment: 1 },
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const log = await db.notificationLog.create({
      data: {
        workOrderId: request.workOrderId ?? "",
        channel: "whatsapp",
        templateCode: template.code,
        templateId: template.id,
        recipient: toPhone,
        recipientRole: request.recipientType,
        subject: "",
        body: rendered.body,
        status: "failed",
        error,
        providerName: provider.name,
      },
    });

    return { channel: "whatsapp", status: "failed", error, logId: log.id };
  }
}

/**
 * Retries failed queue items.
 * Called by the cron endpoint /api/cron/process-queues.
 */
export async function retryFailedQueues(): Promise<{
  emailRetried: number;
  whatsappRetried: number;
}> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 5 * 60 * 1000); // only retry items older than 5min

  // Retry eligible emails
  const emailsToRetry = await db.emailQueue.findMany({
    where: {
      status: "failed",
      nextRetryAt: { lte: now },
      attempts: { lt: 3 },
      updatedAt: { lt: cutoff },
    },
    take: 20,
  });

  let emailRetried = 0;
  for (const item of emailsToRetry) {
    try {
      const provider = getEmailProvider();
      const result = await provider.send({
        to: item.toAddress,
        from: item.fromAddress,
        subject: item.subject,
        textBody: item.textBody,
        htmlBody: item.htmlBody ?? undefined,
        templateId: item.templateId ?? undefined,
        workOrderId: item.workOrderId ?? undefined,
        recipientUserId: item.recipientUserId ?? undefined,
      });
      await db.emailQueue.update({
        where: { id: item.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          providerMessageId: result.messageId,
          attempts: { increment: 1 },
          lastError: null,
        },
      });
      emailRetried++;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      await db.emailQueue.update({
        where: { id: item.id },
        data: {
          status: item.attempts + 1 >= 3 ? "failed" : "retried",
          lastError: error,
          attempts: { increment: 1 },
          nextRetryAt: new Date(Date.now() + 15 * 60 * 1000), // back off to 15min
        },
      });
      // Notify admin if max attempts reached
      if (item.attempts + 1 >= 3) {
        await notifyAdminOfFailure("email", item.toAddress, error, item.workOrderId);
      }
    }
  }

  // Retry eligible WhatsApps (same logic)
  const wasToRetry = await db.whatsAppQueue.findMany({
    where: {
      status: "failed",
      nextRetryAt: { lte: now },
      attempts: { lt: 3 },
      updatedAt: { lt: cutoff },
    },
    take: 20,
  });

  let whatsappRetried = 0;
  for (const item of wasToRetry) {
    try {
      const provider = getWhatsAppProvider();
      const result = await provider.send({
        toPhone: item.toPhone,
        body: item.body,
        templateName: item.templateName ?? undefined,
        templateId: item.templateId ?? undefined,
        workOrderId: item.workOrderId ?? undefined,
        recipientUserId: item.recipientUserId ?? undefined,
      });
      await db.whatsAppQueue.update({
        where: { id: item.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          providerMessageId: result.messageId,
          attempts: { increment: 1 },
          lastError: null,
        },
      });
      whatsappRetried++;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      await db.whatsAppQueue.update({
        where: { id: item.id },
        data: {
          status: item.attempts + 1 >= 3 ? "failed" : "retried",
          lastError: error,
          attempts: { increment: 1 },
          nextRetryAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      if (item.attempts + 1 >= 3) {
        await notifyAdminOfFailure("whatsapp", item.toPhone, error, item.workOrderId);
      }
    }
  }

  return { emailRetried, whatsappRetried };
}

/** Sends an in-app failure notification to all admins. */
async function notifyAdminOfFailure(
  channel: string,
  recipient: string,
  error: string,
  workOrderId: string | null,
): Promise<void> {
  const admins = await db.user.findMany({
    where: { role: "administrator" },
    select: { id: true },
  });

  for (const admin of admins) {
    await db.notification.create({
      data: {
        recipientId: admin.id,
        recipientType: "admin",
        title: `Delivery failure: ${channel}`,
        message: `A ${channel} notification to ${recipient} failed after 3 attempts. Error: ${error}. Work order: ${workOrderId ?? "n/a"}`,
        category: "alert",
        priority: "high",
        actionUrl: workOrderId ? `/api/fsm/work-orders/${workOrderId}` : null,
        actionLabel: workOrderId ? "View Work Order" : null,
      },
    });
  }
}
