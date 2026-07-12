/**
 * Public Downloads API — `/api/public/downloads`.
 *
 * GET: list all downloads with visibility="public".
 * No authentication required — internal and restricted downloads
 * are NEVER returned by this endpoint.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  // Only return PUBLIC downloads — internal and restricted are filtered out.
  const downloads = await db.download.findMany({
    where: { visibility: "public" },
    select: {
      id: true,
      name: true,
      version: true,
      fileSize: true,
      releaseDate: true,
      downloadCount: true,
      // NEVER select storagePath — that's only used server-side.
      category: { select: { name: true, slug: true, icon: true } },
      operatingSystems: { include: { os: { select: { name: true, slug: true, icon: true } } } },
    },
    orderBy: { releaseDate: "desc" },
  });

  return NextResponse.json({ downloads, total: downloads.length, public: true });
}
