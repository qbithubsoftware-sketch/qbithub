/**
 * Admin Audit Logs API — `/api/admin/audit-logs`.
 *
 * GET: list audit logs (admin only).
 * POST: create a new audit log entry (admin only).
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
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden — administrator role required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const offset = Number(searchParams.get("offset") ?? "0");
  const action = searchParams.get("action");

  const where = action ? { action } : {};
  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json({ logs, total: logs.length });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden — administrator role required" }, { status: 403 });
  }

  const body = await req.json();
  const { action, entity, entityId, entityName, description, ipAddress, userAgent } = body;

  if (!action || !entity) {
    return NextResponse.json({ error: "Missing required fields: action, entity" }, { status: 400 });
  }

  const log = await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name ?? "Unknown",
      action,
      entity,
      entityId: entityId ?? null,
      entityName: entityName ?? null,
      description: description ?? null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    },
  });

  return NextResponse.json({ log }, { status: 201 });
}
