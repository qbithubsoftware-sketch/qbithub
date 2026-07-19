/**
 * GET    /api/admin/products/[id]/resource-mappings
 *   Lists all resources mapped to a product, grouped by type.
 *   Returns: { mappings: [{id, resourceId, type, name, version, url, ...}], grouped: {type: [...]}, counters: {type: count} }
 *
 * POST   /api/admin/products/[id]/resource-mappings
 *   Maps a resource to this product. Body: { resourceId }
 *   If already mapped (unique constraint), returns 409 with a friendly message.
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

  const product = await db.qbitProduct.findUnique({ where: { id }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const mappings = await db.productResourceMapping.findMany({
    where: { productId: id },
    include: {
      resource: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = mappings.map((m) => ({
    mappingId: m.id,
    resourceId: m.resource.id,
    type: m.overrideType ?? m.resource.type,
    name: m.resource.name,
    version: m.resource.version,
    description: m.resource.description,
    url: m.resource.url,
    mimeType: m.resource.mimeType,
    fileSize: m.resource.fileSize,
    thumbnailUrl: m.resource.thumbnailUrl,
    status: m.resource.status,
    visibility: m.resource.visibility,
    releaseDate: m.resource.releaseDate?.toISOString() ?? null,
    downloadCount: m.resource.downloadCount,
  }));

  // Group by type
  const grouped: Record<string, typeof formatted> = {};
  const counters: Record<string, number> = {};
  for (const f of formatted) {
    if (!grouped[f.type]) grouped[f.type] = [];
    grouped[f.type].push(f);
    counters[f.type] = (counters[f.type] ?? 0) + 1;
  }

  return NextResponse.json({
    mappings: formatted,
    grouped,
    counters,
    total: formatted.length,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.resourceId) return NextResponse.json({ error: "resourceId is required" }, { status: 400 });

  // Verify product exists
  const product = await db.qbitProduct.findUnique({ where: { id }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Verify resource exists
  const resource = await db.resource.findUnique({ where: { id: body.resourceId } });
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  // Check for duplicate mapping (unique constraint on [productId, resourceId])
  const existing = await db.productResourceMapping.findUnique({
    where: { productId_resourceId: { productId: id, resourceId: body.resourceId } },
  });
  if (existing) {
    return NextResponse.json({
      error: "This resource is already linked to this product.",
      mappingId: existing.id,
    }, { status: 409 });
  }

  const mapping = await db.productResourceMapping.create({
    data: {
      productId: id,
      resourceId: body.resourceId,
      sortIndex: body.sortIndex ?? 0,
    },
  });

  return NextResponse.json({ mapping }, { status: 201 });
}
