/**
 * GET    /api/admin/resources/[id]?download=true — download resource file (PUBLIC for public resources)
 * PUT    /api/admin/resources/[id] — update a global resource
 * DELETE /api/admin/resources/[id] — delete a global resource (cascade-deletes mappings)
 *
 * Security:
 *   - GET ?download=true: PUBLIC for visibility=public resources, admin auth for non-public
 *   - PUT/DELETE: requireSuperAdminOrAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { StorageService } from "@/lib/storage/storage";

// ===== GET handler — download resource file =====
// Uses ?download=true query parameter to trigger file download.
// This avoids creating a new route file (which Vercel's catch-all intercepts).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "true";

    if (!isDownload) {
      // Return resource metadata (JSON)
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

    // ===== Download mode =====
    const resource = await db.resource.findUnique({
      where: { id },
      select: { id: true, name: true, url: true, mimeType: true, visibility: true },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // Check visibility (RBAC) — public resources are downloadable by anyone
    if (resource.visibility !== "public") {
      const session = await requireSuperAdminOrAdmin();
      if (!session) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    // Handle data URLs (legacy base64)
    if (resource.url.startsWith("data:")) {
      const base64Data = resource.url.split(",")[1];
      if (!base64Data) return NextResponse.json({ error: "Invalid file data." }, { status: 500 });
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = resource.name.replace(/[^a-zA-Z0-9-_]/g, "_") || "download";
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": resource.mimeType ?? "application/octet-stream",
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    // Handle external URLs (YouTube etc.)
    if (resource.url.startsWith("http://") || resource.url.startsWith("https://")) {
      return NextResponse.redirect(resource.url, { status: 302 });
    }

    // Download from Storage Service
    try {
      const downloadResult = await StorageService.download(resource.url);
      const fileName = resource.name.replace(/[^a-zA-Z0-9-_\.]/g, "_");
      const uint8Array = new Uint8Array(downloadResult.buffer);
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": downloadResult.mimeType,
          "Content-Length": downloadResult.fileSize.toString(),
          "Cache-Control": "no-cache",
        },
      });
    } catch {
      return NextResponse.json({ error: "File not found in storage." }, { status: 404 });
    }
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/resources/[id]:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

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
