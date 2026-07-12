/**
 * Admin System Metrics API — `/api/admin/metrics`.
 *
 * GET: list aggregated system metrics (admin only).
 * POST: record a new metric (admin only).
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const where = category ? { category } : {};
  const metrics = await db.systemMetric.findMany({
    where,
    orderBy: { recordedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ metrics });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { metric, value, unit, category } = body;

  if (!metric || value === undefined) {
    return NextResponse.json({ error: "Missing required fields: metric, value" }, { status: 400 });
  }

  const systemMetric = await db.systemMetric.create({
    data: {
      metric,
      value: Number(value),
      unit: unit ?? "count",
      category: category ?? "inventory",
    },
  });

  return NextResponse.json({ metric: systemMetric }, { status: 201 });
}
