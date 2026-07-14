/**
 * GET  /api/notifications          — list current user's in-app notifications
 * POST /api/notifications          — bulk action (mark-read, archive)
 * PATCH /api/notifications/[id]    — single notification action (handled via POST here)
 *
 * Query params for GET:
 *   - filter: "unread" | "all" | "archived"  (default: "all")
 *   - category: "system" | "job" | "reminder" | "alert"
 *   - limit: number (default 50, max 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import { sanitizeText } from "@/lib/security/validation";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const category = url.searchParams.get("category");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);

  const where: Record<string, unknown> = {
    recipientId: session.user.id,
  };

  if (filter === "unread") {
    where.readAt = null;
    where.archivedAt = null;
  } else if (filter === "archived") {
    where.archivedAt = { not: null };
  } else if (filter === "all") {
    // Show all except archived
    where.archivedAt = null;
  }

  if (category) {
    where.category = category;
  }

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unreadCount = await db.notification.count({
    where: {
      recipientId: session.user.id,
      readAt: null,
      archivedAt: null,
    },
  });

  return NextResponse.json({
    items: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      category: n.category,
      priority: n.priority,
      actionUrl: n.actionUrl,
      actionLabel: n.actionLabel,
      readAt: n.readAt?.toISOString() ?? null,
      archivedAt: n.archivedAt?.toISOString() ?? null,
      workOrderId: n.workOrderId,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
    total: notifications.length,
  });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action: string = body.action;
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

  if (!action || !ids.length) {
    return NextResponse.json(
      { error: "Missing 'action' or 'ids[]'" },
      { status: 400 },
    );
  }

  // Verify all notifications belong to the current user
  const owned = await db.notification.findMany({
    where: {
      id: { in: ids },
      recipientId: session.user.id,
    },
    select: { id: true },
  });
  if (owned.length !== ids.length) {
    return NextResponse.json(
      { error: "Some notification IDs do not belong to the current user" },
      { status: 403 },
    );
  }

  let updated = 0;
  switch (action) {
    case "mark-read":
      updated = await db.notification.updateMany({
        where: { id: { in: ids }, recipientId: session.user.id },
        data: { readAt: new Date() },
      }).then((r) => r.count);
      break;
    case "mark-unread":
      updated = await db.notification.updateMany({
        where: { id: { in: ids }, recipientId: session.user.id },
        data: { readAt: null },
      }).then((r) => r.count);
      break;
    case "archive":
      updated = await db.notification.updateMany({
        where: { id: { in: ids }, recipientId: session.user.id },
        data: { archivedAt: new Date() },
      }).then((r) => r.count);
      break;
    case "unarchive":
      updated = await db.notification.updateMany({
        where: { id: { in: ids }, recipientId: session.user.id },
        data: { archivedAt: null },
      }).then((r) => r.count);
      break;
    default:
      return NextResponse.json(
        { error: `Unknown action: ${sanitizeText(action, 50)}` },
        { status: 400 },
      );
  }

  return NextResponse.json({ action, updated });
}
