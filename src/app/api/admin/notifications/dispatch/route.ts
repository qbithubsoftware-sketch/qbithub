/**
 * POST /api/admin/notifications/dispatch — manually dispatch a notification
 *
 * Admin-only — used by TemplateManager "Send Test" feature.
 *
 * Body: {
 *   event: NotificationEvent,
 *   recipientType: "admin" | "engineer" | "customer",
 *   recipientId?: string,
 *   recipientContact?: string,
 *   workOrderId?: string,
 *   variables: Record<string, string>,
 *   channels?: NotificationChannel[],
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/notifications/auth";
import { dispatch } from "@/lib/notifications/dispatcher";
import { DEFAULT_CHANNEL_ROUTING, type NotificationEvent } from "@/lib/notifications/types";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.event || !body.recipientType) {
    return NextResponse.json(
      { error: "Missing 'event' or 'recipientType' field" },
      { status: 400 },
    );
  }

  const event = body.event as NotificationEvent;
  if (!DEFAULT_CHANNEL_ROUTING[event]) {
    return NextResponse.json(
      { error: `Unknown event: ${event}` },
      { status: 400 },
    );
  }

  const results = await dispatch({
    event,
    recipientType: body.recipientType,
    recipientId: body.recipientId,
    recipientContact: body.recipientContact,
    recipientName: body.recipientName,
    workOrderId: body.workOrderId,
    variables: body.variables ?? {},
    channels: body.channels,
    priority: body.priority ?? "normal",
  });

  return NextResponse.json({
    event,
    results,
    summary: {
      total: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      queued: results.filter((r) => r.status === "queued").length,
      failed: results.filter((r) => r.status === "failed").length,
    },
  });
}
