/**
 * GET    /api/admin/resources/[id]?download=true — download resource file
 * GET    /api/admin/resources/[id] — get resource metadata
 * PUT    /api/admin/resources/[id] — update a global resource
 * DELETE /api/admin/resources/[id] — delete a global resource
 *
 * Security:
 *  GET ?download=true: PUBLIC for visibility=public resources, admin for non-public
 *  GET (metadata): requireSuperAdminOrAdmin
 *  PUT/DELETE: requireSuperAdminOrAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { StorageService } from "@/lib/storage/storage";
import { findResourceForDownload, serveResourceFile, detectUrlType } from "@/lib/resource-download";
import { createResourceLogger, createErrorResponse } from "@/lib/storage/resource-logger";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "true";

    // ---- Metadata mode ----
    if (!isDownload) {
      const session = await requireSuperAdminOrAdmin();
      if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
      const resource = await db.resource.findUnique({
        where: { id },
        include: { _count: { select: { productMappings: true } } },
      });
      if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
      return NextResponse.json({
        resource: {
          ...resource,
          releaseDate: resource.releaseDate?.toISOString() ?? null,
          createdAt: resource.createdAt.toISOString(),
          updatedAt: resource.updatedAt.toISOString(),
          usedByCount: resource._count.productMappings,
        },
      });
    }

    // ---- Download mode ----
    const resource = await findResourceForDownload(id, "resource");
    if (!resource) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", "Resource not found.", "download", { resourceId: id }),
        { status: 404 },
      );
    }

    // Visibility enforcement
    if (resource.visibility !== "public") {
      const session = await requireSuperAdminOrAdmin();
      if (!session) {
        return NextResponse.json(
          createErrorResponse("ACCESS_DENIED", "This resource is not public.", "authorization", { resourceId: id }),
          { status: 403 },
        );
      }
    }

    return serveResourceFile(resource, { modelName: "resource" });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/resources/[id]:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", "Internal server error.", "unknown"),
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const logger = createResourceLogger("upload");
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json(
      createErrorResponse("AUTH_REQUIRED", "Administrator access required", "authentication"),
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json(
    createErrorResponse("PARSE_ERROR", "Invalid JSON body", "parsing"),
    { status: 400 },
  );

  const existing = await db.resource.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const {
    name, type, version, description, supportedCategories,
    url, urlType, mimeType, fileSize, originalFileName,
    checksum, thumbnailUrl, releaseDate, status, visibility, updatedBy,
  } = body;

  // Auto-detect urlType if url changed
  const resolvedUrlType = url !== undefined
    ? (urlType || detectUrlType(url))
    : undefined;

  // If the URL changed and the old file was a storage_key, clean up the old file
  if (url !== undefined && existing.urlType === "storage_key" && existing.url !== url) {
    try {
      await StorageService.delete(existing.url);
      logger.completed({ resourceId: id, details: { note: "Old storage file cleaned up", oldStorageKey: existing.url } });
    } catch {
      // Non-critical — old file might already be deleted
    }
  }

  const updated = await db.resource.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(version !== undefined && { version: version || null }),
      ...(description !== undefined && { description: description || null }),
      ...(supportedCategories !== undefined && { supportedCategories: supportedCategories || null }),
      ...(url !== undefined && { url }),
      ...(resolvedUrlType !== undefined && { urlType: resolvedUrlType }),
      ...(mimeType !== undefined && { mimeType: mimeType || null }),
      ...(fileSize !== undefined && { fileSize: fileSize || null }),
      ...(originalFileName !== undefined && { originalFileName: originalFileName || null }),
      ...(checksum !== undefined && { checksum: checksum || null }),
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
  if (!session) {
    return NextResponse.json(
      createErrorResponse("AUTH_REQUIRED", "Administrator access required", "authentication"),
      { status: 403 },
    );
  }

  const { id } = await params;
  const existing = await db.resource.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  // Delete physical file from Storage Service (only for storage_key type)
  const urlType = existing.urlType || detectUrlType(existing.url);
  if (urlType === "storage_key" && existing.url) {
    try {
      await StorageService.delete(existing.url);
    } catch (err) {
      console.warn(`[ResourceDelete] Physical file deletion failed: ${existing.url}`, err);
    }
  }

  await db.resource.delete({ where: { id } });
  return NextResponse.json({ success: true, deleted: id });
}
