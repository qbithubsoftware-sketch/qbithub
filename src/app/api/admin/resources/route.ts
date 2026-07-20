/**
 * GET  /api/admin/resources — list all resources (with optional type filter + search)
 * POST /api/admin/resources — create a new global resource
 *
 * Security: requireSuperAdminOrAdmin
 *
 * POST flow:
 *  1. Authenticate
 *  2. Parse JSON body — log all received keys
 *  3. Validate required fields (name, type, url) — field-level errors
 *  4. Validate type against allowlist — field-level errors
 *  5. Auto-detect urlType
 *  6. Duplicate protection (name + version unique)
 *  7. Insert into database (ONLY after upload succeeded — upload is a separate step)
 *  8. Return created resource
 *
 * ALL validation errors include: { success, code, field, expected, received, message, stage }
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

/**
 * Field-level validation error — matches the upload endpoint's format.
 */
function validationError(
  code: string,
  field: string,
  expected: string,
  received: string,
  message: string,
  stage: string = "validation",
  extra?: Record<string, unknown>,
) {
  return {
    success: false as const,
    code,
    field,
    expected,
    received,
    message,
    stage,
    details: extra ?? {},
  };
}

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

  // ---- Parse JSON body ----
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    logger.failed("PARSE_ERROR", "Invalid JSON body", { userId });
    return NextResponse.json(
      validationError(
        "PARSE_ERROR",
        "body",
        "valid JSON object",
        "non-parseable body",
        "Request body must be valid JSON.",
        "parsing",
      ),
      { status: 400 },
    );
  }

  // ---- Log ALL received keys ----
  const bodyKeys = Object.keys(body);
  console.log(`[RESOURCE-CREATE] === RECEIVED BODY KEYS ===`);
  console.log(`[RESOURCE-CREATE] Keys (${bodyKeys.length}): [${bodyKeys.map(k => `"${k}"`).join(", ")}]`);
  for (const key of bodyKeys) {
    const val = body[key];
    const summary = val === null ? "null"
      : val === undefined ? "undefined"
      : typeof val === "string" ? `"${val.length > 100 ? val.slice(0, 100) + "…" : val}"`
      : typeof val === "number" ? String(val)
      : Array.isArray(val) ? `Array[${val.length}]`
      : typeof val === "object" ? JSON.stringify(val).slice(0, 100)
      : String(val);
    console.log(`[RESOURCE-CREATE]   "${key}": ${summary}`);
  }

  // ---- Expected keys for reference ----
  const expectedKeys = [
    "name", "type", "version", "description", "supportedCategories",
    "url", "urlType", "mimeType", "fileSize", "originalFileName",
    "checksum", "thumbnailUrl", "releaseDate", "visibility", "status",
  ];
  const missingKeys = expectedKeys.filter(k => !(k in body));
  const extraKeys = bodyKeys.filter(k => !expectedKeys.includes(k));
  console.log(`[RESOURCE-CREATE] Expected keys: [${expectedKeys.join(", ")}]`);
  console.log(`[RESOURCE-CREATE] Missing keys: [${missingKeys.join(", ")}]`);
  console.log(`[RESOURCE-CREATE] Extra keys: [${extraKeys.join(", ")}]`);

  const {
    name, type, version, description, supportedCategories,
    url, urlType, mimeType, fileSize, originalFileName,
    checksum, thumbnailUrl, releaseDate, visibility, status, createdBy,
  } = body as Record<string, unknown>;

  // ---- Validate required fields — ONE AT A TIME for precise error messages ----
  if (!name || typeof name !== "string" || !name.trim()) {
    console.error(`[RESOURCE-CREATE] Missing/invalid "name": received "${name}" (type: ${typeof name})`);
    logger.failed("MISSING_FIELD", "name is required", { userId, errorDetails: { field: "name", received: String(name) } });
    return NextResponse.json(
      validationError(
        "MISSING_FIELD",
        "name",
        "non-empty string",
        name === null ? "null" : name === undefined ? "undefined" : `"${String(name).slice(0, 50)}"`,
        `Resource name is required and must be a non-empty string.`,
        "validation",
      ),
      { status: 400 },
    );
  }

  if (!type || typeof type !== "string") {
    console.error(`[RESOURCE-CREATE] Missing/invalid "type": received "${type}" (type: ${typeof type})`);
    logger.failed("MISSING_FIELD", "type is required", { userId, errorDetails: { field: "type", received: String(type) } });
    return NextResponse.json(
      validationError(
        "MISSING_FIELD",
        "type",
        `one of: ${Array.from(VALID_TYPES).join(", ")}`,
        type === null ? "null" : type === undefined ? "undefined" : `"${String(type)}"`,
        `Resource type is required. Valid types: ${Array.from(VALID_TYPES).join(", ")}.`,
        "validation",
      ),
      { status: 400 },
    );
  }

  if (!VALID_TYPES.has(type as string)) {
    console.error(`[RESOURCE-CREATE] Invalid "type": "${type}" not in VALID_TYPES`);
    logger.failed("INVALID_TYPE", `Invalid resource type: ${type}`, { userId });
    return NextResponse.json(
      validationError(
        "INVALID_TYPE",
        "type",
        `one of: ${Array.from(VALID_TYPES).join(", ")}`,
        `"${type}"`,
        `"${type}" is not a valid resource type. Valid types: ${Array.from(VALID_TYPES).join(", ")}.`,
        "validation",
      ),
      { status: 400 },
    );
  }

  if (!url || typeof url !== "string" || !url.trim()) {
    console.error(`[RESOURCE-CREATE] Missing/invalid "url": received "${url}" (type: ${typeof url})`);
    logger.failed("MISSING_FIELD", "url is required", { userId, errorDetails: { field: "url", received: String(url) } });
    return NextResponse.json(
      validationError(
        "MISSING_FIELD",
        "url",
        "non-empty string (storage key, data URL, or external URL)",
        url === null ? "null" : url === undefined ? "undefined" : `"${String(url).slice(0, 50)}"`,
        `Resource URL is required. This should be the storage key returned from the upload step, a data URL, or an external URL.`,
        "validation",
      ),
      { status: 400 },
    );
  }

  // ---- Validate optional fields if present ----
  if (visibility !== undefined && visibility !== null && typeof visibility === "string") {
    const validVisibilities = ["public", "admin_only", "restricted"];
    if (!validVisibilities.includes(visibility)) {
      console.error(`[RESOURCE-CREATE] Invalid "visibility": "${visibility}"`);
      return NextResponse.json(
        validationError(
          "INVALID_FIELD",
          "visibility",
          `one of: ${validVisibilities.join(", ")}`,
          `"${visibility}"`,
          `"${visibility}" is not a valid visibility value.`,
          "validation",
        ),
        { status: 400 },
      );
    }
  }

  if (status !== undefined && status !== null && typeof status === "string") {
    const validStatuses = ["active", "deprecated", "draft"];
    if (!validStatuses.includes(status)) {
      console.error(`[RESOURCE-CREATE] Invalid "status": "${status}"`);
      return NextResponse.json(
        validationError(
          "INVALID_FIELD",
          "status",
          `one of: ${validStatuses.join(", ")}`,
          `"${status}"`,
          `"${status}" is not a valid status value.`,
          "validation",
        ),
        { status: 400 },
      );
    }
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
      success: false,
      code: "DUPLICATE_RESOURCE",
      field: "name+version",
      expected: "unique name+version combination",
      received: `"${name}" v${version ?? "(none)"} already exists (id: ${existing.id})`,
      message: "This resource already exists in the Global Resource Library. Please link it to the product instead of uploading a duplicate copy.",
      stage: "validation",
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
        status: (status as string) ?? "active",
        createdBy: (createdBy as string) ?? session.user?.name ?? null,
        updatedBy: (createdBy as string) ?? session.user?.name ?? null,
      },
    });

    console.log(`[RESOURCE-CREATE] Resource created: id=${resource.id}, name="${resource.name}", type="${resource.type}"`);
    logger.completed({ userId, resourceId: resource.id, fileName: resource.name });

    return NextResponse.json({ success: true, resource }, { status: 201 });
  } catch (dbError) {
    const errMsg = dbError instanceof Error ? dbError.message : "Database insert failed";
    console.error(`[RESOURCE-CREATE] DB error: ${errMsg}`);
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
