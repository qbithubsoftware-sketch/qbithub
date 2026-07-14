/**
 * GET /api/admin/notifications/reminders — list all reminders
 *
 * Query params:
 *   - status: scheduled | sent | skipped | cancelled | failed
 *   - workOrderId
 *   - recipientType: engineer | customer
 *   - upcoming: "true" — only show dueAt > now
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";
import { safeJsonParse, safeJsonArray } from "@/lib/utils/safe-json";

export async function GET(req: NextRequest) {
  try {

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const workOrderId = url.searchParams.get("workOrderId");
  const recipientType = url.searchParams.get("recipientType");
  const upcoming = url.searchParams.get("upcoming");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (workOrderId) where.workOrderId = workOrderId;
  if (recipientType) where.recipientType = recipientType;
  if (upcoming === "true") {
    where.dueAt = { gt: new Date() };
    where.status = "scheduled";
  }

  const reminders = await db.reminder.findMany({
    where,
    include: {
      workOrder: {
        select: {
          id: true,
          jobNumber: true,
          type: true,
          status: true,
          scheduledDate: true,
          scheduledTime: true,
          customer: { select: { name: true, phone: true } },
          assignedEngineer: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { dueAt: "asc" },
    take: 200,
  });

  const stats = {
    total: reminders.length,
    scheduled: reminders.filter((r) => r.status === "scheduled").length,
    sent: reminders.filter((r) => r.status === "sent").length,
    skipped: reminders.filter((r) => r.status === "skipped").length,
    failed: reminders.filter((r) => r.status === "failed").length,
    nextDue: reminders
      .filter((r) => r.status === "scheduled")
      .map((r) => r.dueAt)
      .sort((a, b) => a.getTime() - b.getTime())[0]?.toISOString() ?? null,
  };

  return NextResponse.json({
    items: reminders.map((r) => ({
      id: r.id,
      workOrderId: r.workOrderId,
      jobNumber: r.workOrder?.jobNumber,
      jobType: r.workOrder?.type,
      workOrderStatus: r.workOrder?.status,
      scheduledDate: r.workOrder?.scheduledDate.toISOString(),
      scheduledTime: r.workOrder?.scheduledTime,
      customerName: r.workOrder?.customer.name,
      engineerName: r.workOrder?.assignedEngineer?.name ?? null,
      recipientType: r.recipientType,
      recipientContact: r.recipientContact,
      offsetMinutes: r.offsetMinutes,
      offsetLabel: r.offsetLabel,
      channels: safeJsonParse(r.channels, []),
      status: r.status,
      dueAt: r.dueAt.toISOString(),
      sentAt: r.sentAt?.toISOString() ?? null,
    })),
    stats,
  });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/admin/notifications/reminders/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
