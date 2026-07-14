/**
 * POST /api/admin/products/bulk-delete — bulk soft-delete products
 * Body: { ids: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    if (!body?.ids || !Array.isArray(body.ids)) {
      return NextResponse.json({ error: "Missing 'ids' array" }, { status: 400 });
    }

    const result = await db.qbitProduct.updateMany({
      where: { id: { in: body.ids } },
      data: { isActive: false },
    });

    return NextResponse.json({ deactivated: result.count, requested: body.ids.length });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/products/bulk-delete:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
