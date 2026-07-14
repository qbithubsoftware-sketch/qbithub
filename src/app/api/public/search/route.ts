/**
 * GET /api/public/search?q=<query>&limit=<n>
 *
 * Global product search across name, model, brand, sku, serialPattern,
 * category, and tags. Returns a flat ranked list of product matches.
 *
 * Public endpoint — no auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

    if (!q) {
      return NextResponse.json({ items: [], total: 0, query: q });
    }

    // Free-text search across every relevant field. SQLite's default
    // contains() is case-insensitive, which matches what users expect.
    const where = {
      isActive: true,
      OR: [
        { name: { contains: q } },
        { model: { contains: q } },
        { brand: { contains: q } },
        { sku: { contains: q } },
        { serialPattern: { contains: q } },
        { category: { contains: q } },
        { tags: { contains: q } },
        { description: { contains: q } },
      ],
    };

    const products = await db.qbitProduct.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }, { name: "asc" }],
      take: limit,
      select: {
        id: true, name: true, slug: true, brand: true, model: true,
        category: true, deviceType: true, description: true, imageUrl: true,
        startingPrice: true, badgeLabel: true,
      },
    });

    return NextResponse.json({
      items: products,
      total: products.length,
      query: q,
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/public/search:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
