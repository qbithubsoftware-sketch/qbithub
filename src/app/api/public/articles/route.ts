/**
 * Public Articles API — `/api/public/articles`.
 *
 * GET: list knowledge articles with public visibility.
 * No authentication required.
 *
 * SECURITY: Only returns articles whose publishedAt date is in the past
 * (i.e. actually published). Drafts/future-dated articles are hidden.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {

  // SECURITY: Only return published articles (publishedAt <= now).
  // Future-dated or null publishedAt articles are hidden from public.
  const articles = await db.knowledgeArticle.findMany({
    where: {
      publishedAt: { lte: new Date() },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      readingTime: true,
      difficulty: true,
      viewCount: true,
      updatedAt: true,
      category: { select: { name: true, slug: true, icon: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ articles, total: articles.length, public: true });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/public/articles/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
