/**
 * Reminder scheduler.
 *
 * When a work order is created or rescheduled, reminders are seeded for
 * the engineer (1 day, 2 hours, 30 minutes before) and the customer
 * (1 day, 2 hours before). A cron endpoint /api/cron/reminders polls for
 * due reminders and dispatches them.
 */

import { db } from "@/lib/db";
import { dispatch } from "./dispatcher";
import {
  type NotificationEvent,
  REMINDER_OFFSETS,
} from "./types";

/** Standard reminder offset config. */
export const ENGINEER_REMINDERS = REMINDER_OFFSETS;
export const CUSTOMER_REMINDERS = REMINDER_OFFSETS.slice(0, 2); // 1d + 2h only

interface CreateRemindersArgs {
  workOrderId: string;
  scheduledDate: Date;
  engineerId: string;
  engineerContact: string; // email
  customerContact: string; // phone
  customerName: string;
  jobNumber: string;
  jobType: string;
  product?: string;
  trackingCode?: string;
}

/**
 * Seeds reminder rows for a work order.
 * Call this when a work order is created or rescheduled.
 */
export async function createWorkOrderReminders(args: CreateRemindersArgs): Promise<{
  engineerReminders: number;
  customerReminders: number;
}> {
  // Cancel any existing scheduled reminders for this work order
  // (in case of reschedule)
  await db.reminder.updateMany({
    where: { workOrderId: args.workOrderId, status: "scheduled" },
    data: { status: "cancelled" },
  });

  // Engineer reminders (3: 1d, 2h, 30min before)
  const engineerEventMap: Record<number, NotificationEvent> = {
    [-1440]: "reminder_engineer_1d",
    [-120]: "reminder_engineer_2h",
    [-30]: "reminder_engineer_30m",
  };

  let engineerReminders = 0;
  for (const offset of ENGINEER_REMINDERS) {
    const dueAt = new Date(args.scheduledDate.getTime() + offset.minutes * 60 * 1000);
    // Skip if due time is already in the past
    if (dueAt.getTime() < Date.now()) continue;

    await db.reminder.create({
      data: {
        workOrderId: args.workOrderId,
        recipientType: "engineer",
        recipientId: args.engineerId,
        recipientContact: args.engineerContact,
        offsetMinutes: offset.minutes,
        offsetLabel: offset.label,
        channels: JSON.stringify(["in_app", "email"]),
        status: "scheduled",
        dueAt,
      },
    });
    engineerReminders++;
  }

  // Customer reminders (2: 1d, 2h before)
  let customerReminders = 0;
  for (const offset of CUSTOMER_REMINDERS) {
    const dueAt = new Date(args.scheduledDate.getTime() + offset.minutes * 60 * 1000);
    if (dueAt.getTime() < Date.now()) continue;

    await db.reminder.create({
      data: {
        workOrderId: args.workOrderId,
        recipientType: "customer",
        recipientId: null,
        recipientContact: args.customerContact,
        offsetMinutes: offset.minutes,
        offsetLabel: offset.label,
        channels: JSON.stringify(["whatsapp", "email"]),
        status: "scheduled",
        dueAt,
      },
    });
    customerReminders++;
  }

  return { engineerReminders, customerReminders };
}

/**
 * Processes due reminders — called by cron endpoint.
 * Returns counts of dispatched + skipped reminders.
 */
export async function processDueReminders(): Promise<{
  dispatched: number;
  skipped: number;
  failed: number;
}> {
  const now = new Date();
  const dueReminders = await db.reminder.findMany({
    where: {
      status: "scheduled",
      dueAt: { lte: now },
    },
    include: {
      workOrder: {
        include: {
          customer: true,
          asset: true,
          assignedEngineer: true,
        },
      },
    },
    take: 50,
  });

  let dispatched = 0;
  let skipped = 0;
  let failed = 0;

  for (const reminder of dueReminders) {
    try {
      const wo = reminder.workOrder;
      if (!wo) {
        skipped++;
        await db.reminder.update({
          where: { id: reminder.id },
          data: { status: "skipped" },
        });
        continue;
      }

      // Skip if work order is no longer in an active state
      if (wo.status === "completed" || wo.status === "cancelled") {
        skipped++;
        await db.reminder.update({
          where: { id: reminder.id },
          data: { status: "skipped" },
        });
        continue;
      }

      // Pick the right event based on recipient type + offset
      let event: NotificationEvent;
      if (reminder.recipientType === "engineer") {
        if (reminder.offsetMinutes === -1440) event = "reminder_engineer_1d";
        else if (reminder.offsetMinutes === -120) event = "reminder_engineer_2h";
        else event = "reminder_engineer_30m";
      } else {
        // Customer
        if (reminder.offsetMinutes === -1440) event = "customer_reminder_1d";
        else event = "customer_reminder_2h";
      }

      const variables = {
        CustomerName: wo.customer.name,
        CustomerPhone: wo.customer.phone,
        EngineerName: wo.assignedEngineer?.name ?? "your engineer",
        JobNumber: wo.jobNumber,
        JobType: wo.type.replace(/_/g, " "),
        Date: wo.scheduledDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        Time: wo.scheduledTime ?? "",
        ProductName: wo.asset?.productName ?? "",
        TrackingURL: `https://qbithub.vercel.app/?track=${wo.publicTrackingCode}`,
      };

      const results = await dispatch({
        event,
        recipientType: reminder.recipientType as "engineer" | "customer",
        recipientId: reminder.recipientId ?? undefined,
        recipientContact: reminder.recipientContact,
        recipientName: reminder.recipientType === "engineer" ? (wo.assignedEngineer?.name ?? "") : wo.customer.name,
        workOrderId: wo.id,
        variables,
      });

      const anySent = results.some((r) => r.status === "sent" || r.status === "queued");
      await db.reminder.update({
        where: { id: reminder.id },
        data: {
          status: anySent ? "sent" : "failed",
          sentAt: new Date(),
          notificationLogIds: JSON.stringify(results.map((r) => r.logId).filter(Boolean)),
        },
      });

      if (anySent) dispatched++;
      else failed++;
    } catch (e) {
      console.error(`[reminders] Failed to process reminder ${reminder.id}:`, e);
      failed++;
      await db.reminder.update({
        where: { id: reminder.id },
        data: { status: "failed" },
      });
    }
  }

  return { dispatched, skipped, failed };
}
