/**
 * POST /api/admin/products/bulk-delete — bulk delete products
 * Body: { ids: string[] }
 * Query: ?hard=true  →  permanently delete (irreversible)
 *        (default)   →  soft delete (deactivate, reversible via /bulk-restore)
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

    const url = new URL(req.url);
    const hardDelete = url.searchParams.get("hard") === "true";

    if (hardDelete) {
      // Permanent bulk delete — nullify nullable FK references first, then
      // delete the products. HardwareSignature cascades automatically.
      const ops: ReturnType<typeof db.unknownDevice.updateMany>[] = [
        db.unknownDevice.updateMany({ where: { mappedProductId: { in: body.ids } }, data: { mappedProductId: null, mappedAt: null, mappedBy: null, mappedByName: null } }),
        db.devicePassport.updateMany({ where: { productId: { in: body.ids } }, data: { productId: null } }),
        db.firmwareCompatibility.updateMany({ where: { productId: { in: body.ids } }, data: { productId: null } }),
        db.qbitProduct.deleteMany({ where: { id: { in: body.ids } } }),
      ];
      const results = await db.$transaction(ops);
      const deletedCount = results[results.length - 1].count;
      return NextResponse.json({ deleted: deletedCount, requested: body.ids.length, permanent: true });
    }

    // Default: soft delete (deactivate)
    const result = await db.qbitProduct.updateMany({
      where: { id: { in: body.ids } },
      data: { isActive: false },
    });

    return NextResponse.json({ deactivated: result.count, requested: body.ids.length, permanent: false });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/products/bulk-delete:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
