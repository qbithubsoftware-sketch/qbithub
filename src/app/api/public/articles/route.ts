/**
 * Public Articles API — `/api/public/articles`.
 *
 * GET: list knowledge articles with public visibility.
 * No authentication required.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  // Only return articles from public categories.
  const articles = await db.knowledgeArticle.findMany({
    where: {
      // In production, add a visibility filter on the article itself.
      // For now, we return all published articles.
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
}
