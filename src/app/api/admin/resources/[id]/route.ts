/**
 * PUT    /api/admin/resources/[id] — update a global resource
 * DELETE /api/admin/resources/[id] — delete a global resource (cascade-deletes mappings)
 *
 * Security: requireSuperAdminOrAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { StorageService } from "@/lib/storage/storage";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const existing = await db.resource.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const { name, type, version, description, supportedCategories, url, mimeType, fileSize, thumbnailUrl, releaseDate, status, visibility, updatedBy } = body;

  const updated = await db.resource.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(version !== undefined && { version: version || null }),
      ...(description !== undefined && { description: description || null }),
      ...(supportedCategories !== undefined && { supportedCategories: supportedCategories || null }),
      ...(url !== undefined && { url }),
      ...(mimeType !== undefined && { mimeType: mimeType || null }),
      ...(fileSize !== undefined && { fileSize: fileSize || null }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl || null }),
      ...(releaseDate !== undefined && { releaseDate: releaseDate ? new Date(releaseDate) : null }),
      ...(status !== undefined && { status }),
      ...(visibility !== undefined && { visibility }),
      updatedBy: updatedBy ?? session.user?.name ?? null,
    },
  });

  return NextResponse.json({ resource: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const { id } = await params;
  const existing = await db.resource.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  // ===== Delete physical file from Storage Service =====
  // (only if URL is a storage key, not a data URL or external URL)
  if (existing.url && !existing.url.startsWith("data:") && !existing.url.startsWith("http")) {
    try {
      await StorageService.delete(existing.url);
      console.log(`[ResourceDelete] Physical file deleted: ${existing.url}`);
    } catch (err) {
      console.warn(`[ResourceDelete] Physical file deletion failed: ${existing.url}`, err);
      // Don't fail the DB delete if file deletion fails — just log it
    }
  }

  // ===== Delete database metadata (cascade-deletes ProductResourceMapping) =====
  await db.resource.delete({ where: { id } });

  console.log(`[ResourceDelete] Resource deleted: ${id} (${existing.name})`);

  return NextResponse.json({ success: true, deleted: id });
}
