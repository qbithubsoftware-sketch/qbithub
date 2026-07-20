/**
 * GET  /api/admin/resources — list all resources (with optional type filter + search)
 * POST /api/admin/resources — create a new global resource
 *
 * Security: requireSuperAdminOrAdmin
 *
 * POST flow:
 *  1. Authenticate
 *  2. Validate required fields (name, type, url)
 *  3. Validate type against allowlist
 *  4. Auto-detect urlType
 *  5. Duplicate protection (name + version unique)
 *  6. Insert into database (ONLY after upload succeeded — upload is a separate step)
 *  7. Return created resource
 *
 * Database inserts happen ONLY after a successful upload.
 * If the upload step failed, no database record is created.
 * If the database insert fails, the uploaded file remains (can be cleaned up by health checker).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { detectUrlType } from "@/lib/resource-download";
import { createResourceLogger, createErrorResponse } from "@/lib/storage/resource-logger";

const VALID_TYPES = new Set([
  "windows_driver", "windows_software", "android_software", "firmware",
  "sdk", "manual", "installation_guide", "troubleshooting", "video",
  "browser_utility", "maintenance_tool", "pos_utility", "other",
]);

const VALID_URL_TYPES = new Set(["storage_key", "data_url", "external"]);

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const typeFilter = url.searchParams.get("type") ?? "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10), 500);

  const where: Record<string, unknown> = {};
  if (typeFilter && VALID_TYPES.has(typeFilter)) where.type = typeFilter;
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

export async function POST(req: NextRequest) {
  const logger = createResourceLogger("upload");
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    logger.failed("AUTH_REQUIRED", "Administrator access required");
    return NextResponse.json(
      createErrorResponse("AUTH_REQUIRED", "Administrator access required", "authentication"),
      { status: 403 },
    );
  }

  const userId = session.user?.id ?? session.user?.email ?? "unknown";

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    logger.failed("PARSE_ERROR", "Invalid JSON body", { userId });
    return NextResponse.json(
      createErrorResponse("PARSE_ERROR", "Invalid JSON body", "parsing"),
      { status: 400 },
    );
  }

  const {
    name, type, version, description, supportedCategories,
    url, urlType, mimeType, fileSize, originalFileName,
    checksum, thumbnailUrl, releaseDate, visibility, createdBy,
  } = body as Record<string, unknown>;

  if (!name || !type || !url) {
    logger.failed("MISSING_FIELDS", "name, type, and url are required", { userId });
    return NextResponse.json(
      createErrorResponse("MISSING_FIELDS", "name, type, and url are required", "validation"),
      { status: 400 },
    );
  }

  if (!VALID_TYPES.has(type as string)) {
    logger.failed("INVALID_TYPE", `Invalid resource type: ${type}`, { userId });
    return NextResponse.json(
      createErrorResponse("INVALID_TYPE", `Invalid type. Valid: ${Array.from(VALID_TYPES).join(", ")}`, "validation"),
      { status: 400 },
    );
  }

  // Auto-detect urlType if not provided
  const resolvedUrlType = urlType && VALID_URL_TYPES.has(urlType as string)
    ? (urlType as string)
    : detectUrlType(url as string);

  // Duplicate Protection
  const existing = await db.resource.findFirst({
    where: { name: { equals: name as string }, version: version ? { equals: version as string } : null },
  });
  if (existing) {
    logger.failed("DUPLICATE_RESOURCE", `Resource "${name}" already exists`, { userId, fileName: name as string });
    return NextResponse.json({
      error: "This resource already exists in the Global Resource Library. Please link it to the product instead of uploading a duplicate copy.",
      existingResourceId: existing.id,
    }, { status: 409 });
  }

  // Database insert — only after successful upload (upload is a separate step)
  try {
    logger.databaseInsert({ userId, fileName: name as string });

    const resource = await db.resource.create({
      data: {
        name: name as string,
        type: type as string,
        version: (version as string) || null,
        description: (description as string) || null,
        supportedCategories: (supportedCategories as string) || null,
        url: url as string,
        urlType: resolvedUrlType,
        mimeType: (mimeType as string) || null,
        fileSize: (fileSize as number) || null,
        originalFileName: (originalFileName as string) || null,
        checksum: (checksum as string) || null,
        thumbnailUrl: (thumbnailUrl as string) || null,
        releaseDate: releaseDate ? new Date(releaseDate as string) : null,
        visibility: (visibility as string) ?? "public",
        createdBy: (createdBy as string) ?? session.user?.name ?? null,
        updatedBy: (createdBy as string) ?? session.user?.name ?? null,
      },
    });

    logger.completed({ userId, resourceId: resource.id, fileName: resource.name });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (dbError) {
    const errMsg = dbError instanceof Error ? dbError.message : "Database insert failed";
    logger.failed("DB_INSERT_ERROR", errMsg, {
      userId, fileName: name as string,
      stack: dbError instanceof Error ? dbError.stack : undefined,
    });
    return NextResponse.json(
      createErrorResponse("DB_INSERT_ERROR", `Failed to create resource: ${errMsg}`, "database"),
      { status: 500 },
    );
  }
}
