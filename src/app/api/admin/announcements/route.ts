/**
 * Admin Announcements API — `/api/admin/announcements`.
 *
 * GET: list announcements (admin only).
 * POST: create a new announcement (admin only).
 *
 * Protected by RBAC — only administrators can access.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import type { Role } from "@/lib/rbac/roles";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = session.user.role as Role;
  if (role !== "administrator") return null;
  return session;
}

export async function GET(req: NextRequest) {
  try {

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "true";

  const where = activeOnly ? { active: true } : {};
  const announcements = await db.announcement.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ announcements });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/admin/announcements/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, body: annBody, type, severity, visibility, startsAt, endsAt } = body;

  if (!title || !annBody) {
    return NextResponse.json({ error: "Missing required fields: title, body" }, { status: 400 });
  }

  const announcement = await db.announcement.create({
    data: {
      title,
      body: annBody,
      type: type ?? "info",
      severity: severity ?? "info",
      visibility: visibility ?? "public",
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      createdBy: session.user.id,
    },
  });

  // Record audit log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name ?? "Unknown",
      action: "create",
      entity: "announcement",
      entityId: announcement.id,
      entityName: title,
      description: `Created announcement: ${title}`,
    },
  });

  return NextResponse.json({ announcement }, { status: 201 });

  } catch (error) {
    console.error("[API ERROR] POST src/app/api/admin/announcements/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
