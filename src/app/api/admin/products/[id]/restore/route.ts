/**
 * POST /api/admin/products/[id]/restore — reactivate a soft-deleted product
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const { id } = await params;
    const existing = await db.qbitProduct.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const restored = await db.qbitProduct.update({
      where: { id },
      data: { isActive: true },
    });

    return NextResponse.json({ product: restored, restored: true, message: "Product reactivated" });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/products/[id]/restore:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
