/**
 * Public Products API — `/api/public/products`.
 *
 * GET: list products with optional filters.
 *   ?category=<slug>     filter by category slug (e.g. "windows-pos", "thermal-printer")
 *   ?search=<query>      fuzzy match on name, model, brand, sku, tags
 *   ?featured=true       only featured products
 *   ?trending=true       only trending products
 *   ?limit=<n>           max items (default 100, max 500)
 *
 * No authentication required — this is a public endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const featured = url.searchParams.get("featured") === "true";
    const trending = url.searchParams.get("trending") === "true";
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

    const where: Record<string, unknown> = { isActive: true, status: "active" };
    if (category) where.category = category;
    if (featured) where.isFeatured = true;
    if (trending) where.isTrending = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { model: { contains: search } },
        { brand: { contains: search } },
        { sku: { contains: search } },
        { tags: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const products = await db.qbitProduct.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { isTrending: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        brand: true,
        manufacturer: true,
        model: true,
        slug: true,
        deviceType: true,
        category: true,
        description: true,
        longDescription: true,
        imageUrl: true,
        galleryImages: true,
        startingPrice: true,
        sku: true,
        badgeLabel: true,
        isFeatured: true,
        isTrending: true,
        status: true,
        operatingSystems: true,
        tags: true,
        // Get latest driver/firmware version strings + view count for trending sort
        latestDriverVersion: true,
        latestFirmwareVersion: true,
        viewCount: true,
        downloadCount: true,
        aiDiagnosticsSupported: true,
        drQbitSupported: true,
        createdAt: true,
        updatedAt: true,
        lastUpdated: true,
      },
    });

    return NextResponse.json({
      items: products.map((p) => ({
        ...p,
        galleryImages: p.galleryImages ? safeJsonParse(p.galleryImages, []) : [],
        operatingSystems: p.operatingSystems ? safeJsonParse(p.operatingSystems, []) : [],
        tags: p.tags ? p.tags.split(",") : [],
      })),
      total: products.length,
      public: true,
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/public/products:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

function safeJsonParse<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}
