/**
 * DELETE /api/admin/products/[id]/resource-mappings/[mappingId]
 *   Unmaps a resource from a product (does NOT delete the resource itself).
 *
 * Security: requireSuperAdminOrAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; mappingId: string }> }) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const { id, mappingId } = await params;

  const existing = await db.productResourceMapping.findFirst({
    where: { id: mappingId, productId: id },
  });
  if (!existing) return NextResponse.json({ error: "Mapping not found" }, { status: 404 });

  await db.productResourceMapping.delete({ where: { id: mappingId } });

  return NextResponse.json({ success: true, deleted: mappingId });
}
