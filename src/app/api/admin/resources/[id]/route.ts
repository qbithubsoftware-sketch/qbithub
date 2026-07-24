/**
 * GET /api/admin/resources/[id]?download=true — Download resource file
 * GET /api/admin/resources/[id]               — Get resource metadata
 * PUT  /api/admin/resources/[id]               — Update resource metadata
 * DELETE /api/admin/resources/[id]             — Delete resource + physical file
 *
 * V5 Enterprise Redesign:
 *   - Download uses storageKey for storage lookup — NEVER publicUrl
 *   - urlType mismatches are auto-corrected at runtime
 *   - All errors are structured — never "UNKNOWN"
 *   - External URLs → 302 redirect
 *   - Uploaded files → proxied through API (with download counting)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { StorageService } from "@/lib/storage/storage";
import {
  serveResourceDownload,
  createResource,
  createError,
  resolveUrlType,
  detectUrlType,
  VALID_RESOURCE_TYPES,
  VALID_URL_TYPES,
  VALID_VISIBILITIES,
  VALID_STATUSES,
  type ResourceError,
} from "@/lib/resource-service";
import { sanitizeFileName } from "@/lib/storage/file-type-registry";

function isResourceError(result: unknown): result is ResourceError {
  return result !== null && typeof result === "object" && "success" in result && result.success === false && "code" in result;
}

// ---------------------------------------------------------------------------
// GET — Download or Metadata
// ---------------------------------------------------------------------------

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
      if (!resource) return NextResponse.json(createError("RESOURCE_NOT_FOUND", "download", "Resource not found.", { resourceId: id }), { status: 404 });
      return NextResponse.json({
        resource: {
          ...resource,
          releaseDate: resource.releaseDate?.toISOString() ?? null,
          createdAt: resource.createdAt.toISOString(),
          updatedAt: resource.updatedAt.toISOString(),
          usedByCount: resource._count.productMappings,
          // Expose new fields for admin UI
          storageKey: resource.storageKey,
          publicUrl: resource.publicUrl,
          storageProvider: resource.storageProvider,
          extension: resource.extension,
          urlType: resource.urlType,
          legacyUrl: resource.url,
        },
      });
    }

    // ---- Download mode ----
    // Visibility enforcement for non-public resources
    const resourceCheck = await db.resource.findUnique({
      where: { id },
      select: { visibility: true },
    });

    if (resourceCheck && resourceCheck.visibility !== "public") {
      const session = await requireSuperAdminOrAdmin();
      if (!session) {
        return NextResponse.json(
          createError("ACCESS_DENIED", "authorization", "This resource is not public.", { resourceId: id }),
          { status: 403 },
        );
      }
    }

    const result = await serveResourceDownload({ resourceId: id });

    if (isResourceError(result)) {
      const statusMap: Record<string, number> = {
        RESOURCE_NOT_FOUND: 404,
        FILE_NOT_FOUND: 404,
        ACCESS_DENIED: 403,
      };
      return NextResponse.json(result, { status: statusMap[result.code] ?? 500 });
    }

    // Handle external redirect
    if (result.mimeType === "redirect") {
      const redirectUrl = result.buffer.toString("utf-8");
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    // Serve the file with proper headers
    const fileName = sanitizeFileName(result.fileName);
    const isViewable = result.mimeType === "application/pdf" || result.mimeType.startsWith("image/") || result.mimeType.startsWith("text/");
    const disposition = isViewable ? "inline" : "attachment";

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "Content-Type": result.mimeType,
        "Content-Length": result.fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        ...(result.checksum ? { "X-Checksum-SHA256": result.checksum } : {}),
      },
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/resources/[id]:", error);
    return NextResponse.json(
      createError("DATABASE_ERROR", "download", "Internal server error.", { originalError: error instanceof Error ? error.message : String(error) }),
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — Update resource metadata
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json(createError("ACCESS_DENIED", "authorization", "Administrator access required.", {}), { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(createError("PARSE_ERROR", "validation", "Invalid JSON body.", {}), { status: 400 });
  }

  const existing = await db.resource.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(createError("RESOURCE_NOT_FOUND", "validation", "Resource not found.", { resourceId: id }), { status: 404 });
  }

  const {
    name, type, version, description, supportedCategories,
    storageKey, publicUrl, storageProvider, urlType,
    mimeType, fileSize, originalFileName, extension, checksum,
    thumbnailUrl, releaseDate, status, visibility, updatedBy,
  } = body;

  // Auto-detect urlType if storageKey or publicUrl changed
  const newStorageKey = storageKey ?? existing.storageKey;
  const newPublicUrl = publicUrl ?? existing.publicUrl;
  const effectiveUrl = newStorageKey ?? newPublicUrl ?? existing.url ?? "";
  const resolvedUrlType = urlType && VALID_URL_TYPES.has(urlType)
    ? urlType
    : detectUrlType(effectiveUrl);

  // If URL changed and old file was a storage_key, clean up old file
  const oldKey = existing.storageKey ?? existing.url;
  if (newStorageKey !== undefined && oldKey && newStorageKey !== oldKey && resolveUrlType(existing) === "uploaded") {
    try {
      await StorageService.delete(oldKey);
    } catch {
      // Non-critical — old file might already be deleted
    }
  }

  const updated = await db.resource.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && VALID_RESOURCE_TYPES.has(type) && { type }),
      ...(version !== undefined && { version: version || null }),
      ...(description !== undefined && { description: description || null }),
      ...(supportedCategories !== undefined && { supportedCategories: supportedCategories || null }),
      ...(storageKey !== undefined && { storageKey: storageKey || null }),
      ...(publicUrl !== undefined && { publicUrl: publicUrl || null }),
      ...(storageProvider !== undefined && { storageProvider: storageProvider || null }),
      ...(resolvedUrlType !== undefined && { urlType: resolvedUrlType }),
      ...(mimeType !== undefined && { mimeType: mimeType || null }),
      ...(fileSize !== undefined && { fileSize: fileSize || null }),
      ...(originalFileName !== undefined && { originalFileName: originalFileName || null }),
      ...(extension !== undefined && { extension: extension || null }),
      ...(checksum !== undefined && { checksum: checksum || null }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl || null }),
      ...(releaseDate !== undefined && { releaseDate: releaseDate ? new Date(releaseDate) : null }),
      ...(status !== undefined && VALID_STATUSES.has(status) && { status }),
      ...(visibility !== undefined && VALID_VISIBILITIES.has(visibility) && { visibility }),
      updatedBy: updatedBy ?? session.user?.name ?? null,
      // Update legacy url field for backward compatibility
      url: storageKey ?? publicUrl ?? existing.url ?? null,
    },
  });

  return NextResponse.json({ resource: updated });
}

// ---------------------------------------------------------------------------
// DELETE — Delete resource + physical file
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json(createError("ACCESS_DENIED", "authorization", "Administrator access required.", {}), { status: 403 });
  }

  const { id } = await params;
  const existing = await db.resource.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(createError("RESOURCE_NOT_FOUND", "validation", "Resource not found.", { resourceId: id }), { status: 404 });
  }

  // Delete physical file from storage (only for uploaded type)
  const urlType = resolveUrlType(existing);
  if (urlType === "uploaded") {
    const storageKey = existing.storageKey ?? existing.url ?? "";
    if (storageKey) {
      try {
        await StorageService.delete(storageKey);
      } catch (err) {
        console.warn(`[ResourceDelete] Physical file deletion failed: ${storageKey}`, err);
      }
    }
  }

  await db.resource.delete({ where: { id } });
  return NextResponse.json({ success: true, deleted: id });
}
