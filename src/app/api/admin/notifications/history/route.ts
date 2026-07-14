/**
 * GET /api/admin/notifications/history — full notification log with filters
 *
 * Query params:
 *   - channel: email | whatsapp | sms | in_app
 *   - status: sent | failed | queued | read
 *   - recipientRole: admin | engineer | customer
 *   - workOrderId: filter by work order
 *   - from: ISO date
 *   - to: ISO date
 *   - limit: number (default 100, max 500)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const channel = url.searchParams.get("channel");
  const status = url.searchParams.get("status");
  const recipientRole = url.searchParams.get("recipientRole");
  const workOrderId = url.searchParams.get("workOrderId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

  const where: Record<string, unknown> = {};
  if (channel) where.channel = channel;
  if (status) where.status = status;
  if (recipientRole) where.recipientRole = recipientRole;
  if (workOrderId) where.workOrderId = workOrderId;
  if (from || to) {
    where.sentAt = {};
    if (from) (where.sentAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.sentAt as Record<string, unknown>).lte = new Date(to);
  }

  const [logs, totalCount] = await Promise.all([
    db.notificationLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
      take: limit,
    }),
    db.notificationLog.count({ where }),
  ]);

  // Aggregate stats
  const stats = {
    total: totalCount,
    sent: await db.notificationLog.count({ where: { ...where, status: "sent" } }),
    failed: await db.notificationLog.count({ where: { ...where, status: "failed" } }),
    queued: await db.notificationLog.count({ where: { ...where, status: "queued" } }),
    byChannel: {
      email: await db.notificationLog.count({ where: { ...where, channel: "email" } }),
      whatsapp: await db.notificationLog.count({ where: { ...where, channel: "whatsapp" } }),
      in_app: await db.notificationLog.count({ where: { ...where, channel: "in_app" } }),
      sms: await db.notificationLog.count({ where: { ...where, channel: "sms" } }),
    },
  };

  return NextResponse.json({
    items: logs.map((l) => ({
      id: l.id,
      workOrderId: l.workOrderId,
      channel: l.channel,
      templateCode: l.templateCode,
      recipient: l.recipient,
      recipientRole: l.recipientRole,
      subject: l.subject,
      body: l.body,
      status: l.status,
      attempts: l.attempts,
      sentAt: l.sentAt.toISOString(),
      deliveredAt: l.deliveredAt?.toISOString() ?? null,
      readAt: l.readAt?.toISOString() ?? null,
      error: l.error,
      providerName: l.providerName,
      providerMessageId: l.providerMessageId,
    })),
    stats,
  });
}
