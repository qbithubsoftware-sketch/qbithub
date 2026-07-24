/**
 * GET  /api/admin/resources — list all resources (with optional type filter + search)
 * POST /api/admin/resources — create a new global resource
 *
 * V5 Enterprise Redesign:
 *   - Uses resource-service.ts for all business logic
 *   - Accepts both new fields (storageKey, publicUrl) and legacy (url)
 *   - Auto-detects urlType and prevents HTTP URLs in storageKey
 *   - All errors are structured — never "UNKNOWN"
 *   - Backward compatible with legacy `url` field
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import {
  createResource,
  createError,
  VALID_RESOURCE_TYPES,
  VALID_URL_TYPES,
  detectUrlType,
} from "@/lib/resource-service";

// ---------------------------------------------------------------------------
// GET — List resources
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) return NextResponse.json(createError("ACCESS_DENIED", "authorization", "Administrator access required.", {}), { status: 403 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const typeFilter = url.searchParams.get("type") ?? "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10), 500);

  const where: Record<string, unknown> = {};
  if (typeFilter && VALID_RESOURCE_TYPES.has(typeFilter)) where.type = typeFilter;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { version: { contains: search } },
    ];
  }

  const resources = await db.resource.findMany({
    where,
    orderBy: [{ type: "asc" }, { name: "asc" }],
    take: limit,
    include: {
      _count: { select: { productMappings: true } },
    },
  });

  return NextResponse.json({
    items: resources.map((r) => ({
      ...r,
      releaseDate: r.releaseDate?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      usedByCount: r._count.productMappings,
    })),
    total: resources.length,
  });
}

// ---------------------------------------------------------------------------
// POST — Create resource (metadata only, after file upload completed)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json(createError("ACCESS_DENIED", "authorization", "Administrator access required.", {}), { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(createError("PARSE_ERROR", "validation", "Invalid JSON body.", {}), { status: 400 });
  }

  // Delegate to the enterprise resource service
  const result = await createResource({
    name: body.name,
    type: body.type,
    version: body.version ?? null,
    description: body.description ?? null,
    supportedCategories: body.supportedCategories ?? null,
    // New fields (preferred)
    storageKey: body.storageKey ?? null,
    publicUrl: body.publicUrl ?? null,
    storageProvider: body.storageProvider ?? null,
    urlType: body.urlType ?? null,
    mimeType: body.mimeType ?? null,
    fileSize: body.fileSize ?? null,
    originalFileName: body.originalFileName ?? null,
    extension: body.extension ?? null,
    checksum: body.checksum ?? null,
    thumbnailUrl: body.thumbnailUrl ?? null,
    releaseDate: body.releaseDate ?? null,
    visibility: body.visibility ?? "public",
    status: body.status ?? "active",
    createdBy: body.createdBy ?? session.user?.name ?? null,
    // Legacy field (backward compat)
    url: body.url ?? null,
  });

  if (result.success === false) {
    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      MISSING_FIELD: 400,
      INVALID_FIELD: 400,
      DUPLICATE_RESOURCE: 409,
      PARSE_ERROR: 400,
      VALIDATION_FAILED: 400,
    };
    return NextResponse.json(result, { status: statusMap[result.code] ?? 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
