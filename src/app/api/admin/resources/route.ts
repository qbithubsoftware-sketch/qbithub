/**
 * GET  /api/admin/resources — list all resources (with optional type filter + search)
 * POST /api/admin/resources — create a new global resource
 *
 * Security: requireSuperAdminOrAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";

const VALID_TYPES = new Set([
  "windows_driver", "windows_software", "android_software", "firmware",
  "sdk", "manual", "installation_guide", "troubleshooting", "video",
  "browser_utility", "maintenance_tool", "pos_utility", "other",
]);

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
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { version: { contains: search, mode: "insensitive" } },
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
  const session = await requireSuperAdminOrAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const { name, type, version, description, supportedCategories, url, mimeType, fileSize, thumbnailUrl, releaseDate, visibility, createdBy } = body;

  if (!name || !type || !url) {
    return NextResponse.json({ error: "name, type, and url are required" }, { status: 400 });
  }
  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: `Invalid type. Valid: ${Array.from(VALID_TYPES).join(", ")}` }, { status: 400 });
  }

  // ===== Duplicate Protection =====
  // Check if a resource with the same name + version already exists
  const existing = await db.resource.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, version: version ?? null },
  });
  if (existing) {
    return NextResponse.json({
      error: "This resource already exists in the Global Resource Library. Please link it to the product instead of uploading a duplicate copy.",
      existingResourceId: existing.id,
    }, { status: 409 });
  }

  const resource = await db.resource.create({
    data: {
      name,
      type,
      version: version || null,
      description: description || null,
      supportedCategories: supportedCategories || null,
      url,
      mimeType: mimeType || null,
      fileSize: fileSize || null,
      thumbnailUrl: thumbnailUrl || null,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      visibility: visibility ?? "public",
      createdBy: createdBy ?? session.user?.name ?? null,
      updatedBy: createdBy ?? session.user?.name ?? null,
    },
  });

  return NextResponse.json({ resource }, { status: 201 });
}
