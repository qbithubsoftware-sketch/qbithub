/**
 * GET  /api/admin/products — list all products (with pagination + search)
 * POST /api/admin/products — create a new product
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";
import { sanitizeText, validateRequired } from "@/lib/security/validation";
import { generateUniqueSlug } from "@/lib/products/slug";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);
    // Default: hide soft-deleted (inactive) products.
    // Pass ?includeInactive=true to see all products including deactivated ones.
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    const where: Record<string, unknown> = {};
    if (!includeInactive) where.isActive = true;
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
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { _count: { select: { hardwareSignatures: true, detectedDevices: true, devicePassports: true } } },
    });

    return NextResponse.json({
      items: products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        manufacturer: p.manufacturer,
        model: p.model,
        slug: p.slug,
        deviceType: p.deviceType,
        category: p.category,
        description: p.description,
        longDescription: p.longDescription,
        imageUrl: p.imageUrl,
        sku: p.sku,
        startingPrice: p.startingPrice,
        badgeLabel: p.badgeLabel,
        isFeatured: p.isFeatured,
        isTrending: p.isTrending,
        status: p.status,
        tags: p.tags,
        driverDownloadUrl: p.driverDownloadUrl,
        manualUrl: p.manualUrl,
        installationGuideUrl: p.installationGuideUrl,
        knowledgeBaseUrl: p.knowledgeBaseUrl,
        brochureUrl: p.brochureUrl,
        datasheetUrl: p.datasheetUrl,
        warrantyUrl: p.warrantyUrl,
        sdkUrl: p.sdkUrl,
        utilityUrl: p.utilityUrl,
        qrCodeUrl: p.qrCodeUrl,
        viewCount: p.viewCount,
        downloadCount: p.downloadCount,
        latestDriverVersion: p.latestDriverVersion,
        latestFirmwareVersion: p.latestFirmwareVersion,
        lastUpdated: p.lastUpdated?.toISOString() ?? null,
        isActive: p.isActive,
        signatureCount: p._count.hardwareSignatures,
        detectedCount: p._count.detectedDevices,
        passportCount: p._count.devicePassports,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      total: products.length,
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/products:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const missing = validateRequired(body, ["name", "model", "deviceType"]);
    if (missing.length > 0) return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });


    // Auto-generate a unique slug for /products/[slug] deep links
    const slug = await generateUniqueSlug(body.model, undefined, body.slug);

    const product = await db.qbitProduct.create({
      data: {
        name: sanitizeText(body.name, 200),
        brand: sanitizeText(body.brand ?? "QBIT", 50),
        manufacturer: body.manufacturer ? sanitizeText(body.manufacturer, 200) : null,
        model: sanitizeText(body.model, 100),
        slug,
        deviceType: sanitizeText(body.deviceType, 50),
        category: body.category ?? null,
        description: body.description ? sanitizeText(body.description, 1000) : null,
        longDescription: body.longDescription ?? null,
        imageUrl: body.imageUrl ?? null,
        galleryImages: body.galleryImages ? JSON.stringify(body.galleryImages) : null,
        sku: body.sku ?? null,
        serialPattern: body.serialPattern ?? null,
        startingPrice: body.startingPrice ?? null,
        badgeLabel: body.badgeLabel ?? null,
        isFeatured: !!body.isFeatured,
        isTrending: !!body.isTrending,
        driverDownloadUrl: body.driverDownloadUrl ?? null,
        manualUrl: body.manualUrl ?? null,
        installationGuideUrl: body.installationGuideUrl ?? null,
        knowledgeBaseUrl: body.knowledgeBaseUrl ?? null,
        brochureUrl: body.brochureUrl ?? null,
        datasheetUrl: body.datasheetUrl ?? null,
        warrantyUrl: body.warrantyUrl ?? null,
        sdkUrl: body.sdkUrl ?? null,
        utilityUrl: body.utilityUrl ?? null,
        qrCodeUrl: `https://hub.qbit.com/products/${slug}`,
        seoTitle: body.seoTitle ?? null,
        seoDescription: body.seoDescription ?? null,
        seoKeywords: body.seoKeywords ?? null,
        tags: Array.isArray(body.tags) ? body.tags.join(",") : (body.tags ?? null),
        compatibleDevices: Array.isArray(body.compatibleDevices) ? body.compatibleDevices.join(",") : (body.compatibleDevices ?? null),
        status: body.status ?? "active",
        aiDiagnosticsSupported: body.aiDiagnosticsSupported ?? true,
        drQbitSupported: body.drQbitSupported ?? true,
        latestDriverVersion: body.latestDriverVersion ?? null,
        latestFirmwareVersion: body.latestFirmwareVersion ?? null,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/products:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
