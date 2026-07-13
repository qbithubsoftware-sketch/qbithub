/**
 * PATCH /api/notifications/[id] — mark single notification as read / unread / archived
 *
 * Body: { action: "mark-read" | "mark-unread" | "archive" | "unarchive" }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "Missing 'action' field" }, { status: 400 });
  }

  const action: string = body.action;
  const updateData: Record<string, unknown> = {};
  switch (action) {
    case "mark-read":
      updateData.readAt = new Date();
      break;
    case "mark-unread":
      updateData.readAt = null;
      break;
    case "archive":
      updateData.archivedAt = new Date();
      break;
    case "unarchive":
      updateData.archivedAt = null;
      break;
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  // Verify ownership
  const existing = await db.notification.findUnique({
    where: { id },
    select: { recipientId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.recipientId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.notification.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ id, action });
}
