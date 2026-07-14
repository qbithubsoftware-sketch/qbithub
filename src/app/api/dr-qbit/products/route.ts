/**
 * GET  /api/dr-qbit/products — list all QBIT products (for DeviceMapper dropdown)
 * POST /api/dr-qbit/products — create a new product (admin only)
 *
 * Query params for GET:
 *   - deviceType: filter by device type
 *   - search: fuzzy match on name/model/brand
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/notifications/auth";
import { sanitizeText, validateRequired } from "@/lib/security/validation";
import { generateUniqueSlug } from "@/lib/products/slug";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const deviceType = url.searchParams.get("deviceType");
  const search = url.searchParams.get("search");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

  const where: Record<string, unknown> = { isActive: true };
  if (deviceType) where.deviceType = deviceType;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { model: { contains: search } },
      { brand: { contains: search } },
      { manufacturer: { contains: search } },
    ];
  }

  const products = await db.qbitProduct.findMany({
    where,
    orderBy: { name: "asc" },
    take: limit,
    include: {
      _count: { select: { hardwareSignatures: true } },
    },
  });

  return NextResponse.json({
    items: products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      manufacturer: p.manufacturer,
      model: p.model,
      deviceType: p.deviceType,
      description: p.description,
      driverDownloadUrl: p.driverDownloadUrl,
      manualUrl: p.manualUrl,
      installationGuideUrl: p.installationGuideUrl,
      knowledgeBaseUrl: p.knowledgeBaseUrl,
      signatureCount: p._count.hardwareSignatures,
    })),
    total: products.length,
  });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const missing = validateRequired(body, ["name", "model", "deviceType"]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  // Check model uniqueness
  const existing = await db.qbitProduct.findUnique({ where: { model: body.model } });
  if (existing) {
    return NextResponse.json(
      { error: `Product with model "${body.model}" already exists` },
      { status: 409 },
    );
  }

  // Auto-generate slug
  const slug = await generateUniqueSlug(body.model);

  const product = await db.qbitProduct.create({
    data: {
      name: sanitizeText(body.name, 200),
      brand: sanitizeText(body.brand ?? "QBIT", 50),
      manufacturer: body.manufacturer ? sanitizeText(body.manufacturer, 200) : null,
      model: sanitizeText(body.model, 100),
      slug,
      deviceType: sanitizeText(body.deviceType, 50),
      description: body.description ? sanitizeText(body.description, 1000) : null,
      driverDownloadUrl: body.driverDownloadUrl ?? null,
      manualUrl: body.manualUrl ?? null,
      installationGuideUrl: body.installationGuideUrl ?? null,
      knowledgeBaseUrl: body.knowledgeBaseUrl ?? null,
      qrCodeUrl: `https://hub.qbit.com/products/${slug}`,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
