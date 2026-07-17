/**
 * PUT    /api/admin/products/[id]/resources/[resourceId]
 *   Updates a ProductMedia row (title, url, version, visibility, sortIndex, etc.)
 *
 * DELETE /api/admin/products/[id]/resources/[resourceId]
 *   Deletes a ProductMedia row.
 *
 * SECURITY: requireAdmin (super_administrator or administrator only).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";

const VALID_VISIBILITY = new Set(["public", "employee", "engineer", "admin"]);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> },
) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id, resourceId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify resource belongs to product
  const existing = await db.productMedia.findFirst({
    where: { id: resourceId, productId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const {
    title, url, mimeType, fileSize, sortIndex, visibility, thumbnailUrl,
    altText, provider, externalId, type, meta,
  } = body;

  if (visibility && !VALID_VISIBILITY.has(visibility)) {
    return NextResponse.json(
      { error: `Invalid visibility. Valid: ${Array.from(VALID_VISIBILITY).join(", ")}` },
      { status: 400 },
    );
  }

  // Preserve existing altText meta if not provided
  let altTextWithMeta = altText;
  if (meta !== undefined) {
    // Re-encode meta JSON
    const existingParsed = (() => {
      try { return JSON.parse(existing.altText ?? "{}"); } catch { return {}; }
    })();
    const existingAlt = existingParsed.altText ?? existing.altText ?? null;
    altTextWithMeta = JSON.stringify({ altText: altText ?? existingAlt, meta });
  }

  const updated = await db.productMedia.update({
    where: { id: resourceId },
    data: {
      ...(title !== undefined && { title }),
      ...(url !== undefined && { url }),
      ...(type !== undefined && { type }),
      ...(mimeType !== undefined && { mimeType }),
      ...(fileSize !== undefined && { fileSize }),
      ...(sortIndex !== undefined && { sortIndex }),
      ...(visibility !== undefined && { visibility }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      ...(altTextWithMeta !== undefined && { altText: altTextWithMeta }),
      ...(provider !== undefined && { provider }),
      ...(externalId !== undefined && { externalId }),
    },
  });

  return NextResponse.json({ resource: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> },
) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id, resourceId } = await params;

  const existing = await db.productMedia.findFirst({
    where: { id: resourceId, productId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  await db.productMedia.delete({ where: { id: resourceId } });

  return NextResponse.json({ success: true, deleted: resourceId });
}
