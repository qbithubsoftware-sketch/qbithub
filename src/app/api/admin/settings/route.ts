/**
 * Admin System Settings API — `/api/admin/settings`.
 *
 * GET: list all system settings (admin only).
 * PUT: update a system setting (admin only).
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

export async function GET() {
  try {

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await db.systemSetting.findMany({
    orderBy: { category: "asc" },
  });

  return NextResponse.json({ settings });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/admin/settings/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json({ error: "Missing required fields: key, value" }, { status: 400 });
  }

  const setting = await db.systemSetting.upsert({
    where: { key },
    update: { value: String(value), updatedBy: session.user.id },
    create: { key, value: String(value), updatedBy: session.user.id },
  });

  // Record audit log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name ?? "Unknown",
      action: "settings_change",
      entity: "setting",
      entityId: setting.id,
      entityName: key,
      description: `Updated setting ${key} = ${value}`,
    },
  });

  return NextResponse.json({ setting });
}
