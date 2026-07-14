/**
 * PUT    /api/admin/users/[id] — update user (name, role, password)
 * DELETE /api/admin/users/[id] — delete user
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";
import { sanitizeText } from "@/lib/security/validation";
import bcrypt from "bcryptjs";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = sanitizeText(body.name, 200);
    if (body.role !== undefined) updateData.role = sanitizeText(body.role, 50);
    if (body.email !== undefined) {
      const email = body.email.toLowerCase();
      const dup = await db.user.findUnique({ where: { email } });
      if (dup && dup.id !== id) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      updateData.email = email;
    }
    if (body.password) {
      updateData.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, updatedAt: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[API ERROR] PUT /api/admin/users/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const { id } = await params;
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    console.error("[API ERROR] DELETE /api/admin/users/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
