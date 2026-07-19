/**
 * GET /api/admin/resources/[id]/products
 *   Lists all products linked to this resource (usage information).
 *   Returns: { products: [{id, name, model, brand, category, imageUrl, mappingId}] }
 *
 * Security: requireSuperAdminOrAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const { id } = await params;

  const resource = await db.resource.findUnique({
    where: { id },
    select: { id: true, name: true, type: true, version: true },
  });
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const mappings = await db.productResourceMapping.findMany({
    where: { resourceId: id },
    include: {
      product: {
        select: { id: true, name: true, model: true, brand: true, category: true, imageUrl: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    resource,
    products: mappings.map((m) => ({
      mappingId: m.id,
      ...m.product,
    })),
    total: mappings.length,
  });
}
