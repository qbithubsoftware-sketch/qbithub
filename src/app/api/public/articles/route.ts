/**
 * Public Articles API — `/api/public/articles`.
 *
 * GET: list knowledge articles with public visibility.
 * No authentication required.
 *
 * Query params:
 *   - search: filter by title/excerpt/category (case-insensitive)
 *   - category: filter by category slug
 *   - page: pagination offset (default 1)
 *   - limit: results per page (default 50, max 100)
 *
 * SECURITY: Only returns articles whose publishedAt date is in the past
 * (i.e. actually published). Drafts/future-dated articles are hidden.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const categorySlug = url.searchParams.get("category")?.trim() || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      publishedAt: { lte: new Date() },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (categorySlug) {
      where.category = { ...(where.category as Record<string, unknown> ?? {}), slug: categorySlug };
    }

    // SECURITY: Only return published articles (publishedAt <= now).
    // Future-dated or null publishedAt articles are hidden from public.
    const articles = await db.knowledgeArticle.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        readingTime: true,
        difficulty: true,
        viewCount: true,
        updatedAt: true,
        featured: true,
        popular: true,
        latest: true,
        author: true,
        authorAvatar: true,
        helpfulCount: true,
        notHelpfulCount: true,
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await db.knowledgeArticle.count({ where });

    return NextResponse.json({
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      public: true,
    });

  } catch (error) {
    console.error("[API ERROR] GET /api/public/articles:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
