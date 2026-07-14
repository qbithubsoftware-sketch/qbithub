/**
 * Admin Media API — `/api/admin/media`.
 * GET: list media files (admin only).
 * POST: upload media file (admin only).
 * DELETE: delete media file (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { log } from "@/lib/monitoring/logger";
import { sanitizeText } from "@/lib/security/validation";
import { badRequest, forbidden, internalError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "administrator") return forbidden();

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder");
  const query = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (folder && folder !== "all") where.folder = folder;
  if (query) where.fileName = { contains: query };

  try {
    const files = await db.mediaFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ files, total: files.length });
  } catch (err) {
    return internalError(err as Error, { route: "media-list" });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "administrator") return forbidden();

  const body = await req.json();
  const { fileName, originalName, mimeType, fileSize, storagePath, thumbnailPath, webpPath, folder, tags, altText } = body;

  if (!fileName || !mimeType || !storagePath) {
    return badRequest("Missing required fields: fileName, mimeType, storagePath");
  }

  try {
    const file = await db.mediaFile.create({
      data: {
        fileName: sanitizeText(fileName, 255),
        originalName: sanitizeText(originalName ?? fileName, 255),
        mimeType: sanitizeText(mimeType, 100),
        fileSize: Number(fileSize) || 0,
        storagePath: sanitizeText(storagePath, 500),
        thumbnailPath: thumbnailPath ? sanitizeText(thumbnailPath, 500) : null,
        webpPath: webpPath ? sanitizeText(webpPath, 500) : null,
        folder: sanitizeText(folder ?? "general", 50),
        tags: tags ? JSON.stringify(tags) : null,
        altText: altText ? sanitizeText(altText, 500) : null,
        uploadedBy: session.user.id,
      },
    });
    log.info("Media file uploaded", { fileId: file.id, fileName: file.fileName, user: session.user.id });
    return NextResponse.json({ file }, { status: 201 });
  } catch (err) {
    return internalError(err as Error, { route: "media-upload" });
  }
}
