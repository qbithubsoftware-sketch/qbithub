/**
 * GET  /api/admin/users — list all users
 * POST /api/admin/users — create a new user (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";
import { sanitizeText, validateRequired } from "@/lib/security/validation";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, image: true, role: true,
        createdAt: true, updatedAt: true,
        _count: { select: { assignedWorkOrders: true } },
      },
    });

    return NextResponse.json({
      items: users.map((u) => ({
        id: u.id, email: u.email, name: u.name, image: u.image, role: u.role,
        assignedJobsCount: u._count.assignedWorkOrders,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      total: users.length,
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const missing = validateRequired(body, ["email", "name", "role", "password"]);
    if (missing.length > 0) return NextResponse.json({ error: `Missing: ${missing.join(", ")}` }, { status: 400 });

    // Check email uniqueness
    const existing = await db.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await db.user.create({
      data: {
        email: sanitizeText(body.email.toLowerCase(), 200),
        name: sanitizeText(body.name, 200),
        role: sanitizeText(body.role, 50),
        passwordHash,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
