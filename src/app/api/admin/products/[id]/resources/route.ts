/**
 * GET  /api/admin/products/[id]/resources
 *   Returns all ProductMedia rows for a product, grouped by type.
 *
 * POST /api/admin/products/[id]/resources
 *   Creates a new ProductMedia row linked to the product.
 *   Body: { type, title, url, mimeType?, fileSize?, sortIndex?, visibility?, meta? }
 *   Where meta is an optional JSON object with extra fields like:
 *     { version, releaseDate, supportedOS, language, duration, thumbnailUrl,
 *       compatibleModels, releaseNotes, description, minAndroidVersion,
 *       playStoreLink, category, ... }
 *
 * SECURITY: requireAdmin (super_administrator or administrator only).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";

// Valid ProductMedia types — extended per V4 Product Resource Upload Center spec
const VALID_TYPES = new Set([
  "image",            // gallery image
  "brochure",
  "datasheet",
  "warranty",
  "sdk",
  "utility",
  "video",
  "manual",
  "firmware",
  "driver",
  // V4 extended types
  "windows_driver",       // Windows-specific driver
  "windows_software",     // Windows utility/software (POS Utility, Printer Tool, etc.)
  "android_software",     // APK / Play Store link
  "troubleshooting",      // PDF/ZIP/Excel troubleshooting docs
  "gallery_image",        // Product gallery image (front/back/side/ports/inside/packaging)
  "other",
]);

const VALID_VISIBILITY = new Set(["public", "employee", "engineer", "admin"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id } = await params;

  const product = await db.qbitProduct.findUnique({
    where: { id },
    select: {
      id: true, name: true, brand: true, model: true, slug: true,
      category: true, imageUrl: true, sku: true, serialPattern: true,
      warrantyDuration: true,
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const media = await db.productMedia.findMany({
    where: { productId: id },
    orderBy: [{ type: "asc" }, { sortIndex: "asc" }],
  });

  // Group by type for the UI
  const grouped: Record<string, typeof media> = {};
  for (const m of media) {
    if (!grouped[m.type]) grouped[m.type] = [];
    grouped[m.type].push(m);
  }

  // Resource counter
  const counters: Record<string, number> = {};
  for (const m of media) {
    counters[m.type] = (counters[m.type] ?? 0) + 1;
  }

  return NextResponse.json({
    product,
    resources: media,
    grouped,
    counters,
    total: media.length,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id } = await params;

  const product = await db.qbitProduct.findUnique({ where: { id }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    type, title, url, mimeType, fileSize, sortIndex, visibility, thumbnailUrl,
    altText, provider, externalId,
    // V4 meta fields (stored as JSON in title's sibling — we use a `meta` JSON column
    // which doesn't exist, so we'll store as JSON string in a description-like field.
    // For now, we encode meta into `altText` as JSON. Future: add `meta` column.)
    meta,
  } = body;

  if (!type || !title || !url) {
    return NextResponse.json(
      { error: "type, title, and url are required" },
      { status: 400 },
    );
  }

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: `Invalid type. Valid types: ${Array.from(VALID_TYPES).join(", ")}` },
      { status: 400 },
    );
  }

  if (visibility && !VALID_VISIBILITY.has(visibility)) {
    return NextResponse.json(
      { error: `Invalid visibility. Valid: ${Array.from(VALID_VISIBILITY).join(", ")}` },
      { status: 400 },
    );
  }

  // Encode meta into altText as JSON (workaround until schema adds a `meta` column)
  const altTextWithMeta = meta
    ? JSON.stringify({ altText: altText ?? null, meta })
    : (altText ?? null);

  const created = await db.productMedia.create({
    data: {
      productId: id,
      type,
      title,
      url,
      thumbnailUrl: thumbnailUrl ?? null,
      mimeType: mimeType ?? null,
      fileSize: fileSize ?? null,
      provider: provider ?? null,
      externalId: externalId ?? null,
      altText: altTextWithMeta,
      sortIndex: typeof sortIndex === "number" ? sortIndex : 0,
      visibility: visibility ?? "public",
    },
  });

  return NextResponse.json({ resource: created }, { status: 201 });
}
