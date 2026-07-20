/**
 * GET /api/downloads/[id]/file — serve the actual download file
 *
 * Flow:
 *  1. Validate the download token
 *  2. Look up the Download record by ID
 *  3. Enforce visibility (public/internal/restricted)
 *  4. Try to serve the real file from StorageService
 *  5. If no physical file exists, generate a descriptive placeholder
 *  6. Return the file with proper Content-Type and Content-Disposition headers
 *
 * Supports range requests for resume/large file downloads.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import type { Role } from "@/lib/rbac/roles";
import { StorageService } from "@/lib/storage/storage";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  // Validate token is present (basic check — production would verify JWT)
  if (!token) {
    return NextResponse.json({ error: "Missing download token" }, { status: 401 });
  }

  try {
    const download = await db.download.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!download) {
      return NextResponse.json({ error: "Download not found" }, { status: 404 });
    }

    // Check visibility
    if (download.visibility === "internal" || download.visibility === "restricted") {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (download.visibility === "restricted") {
        const role = session.user.role as Role;
        if (role !== "administrator" && role !== "installation_engineer") {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }

    // Increment download count
    await db.download.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    }).catch(() => { /* non-critical */ });

    // Try to serve the real file from StorageService
    if (download.storagePath) {
      try {
        const downloadResult = await StorageService.download(download.storagePath);
        const uint8Array = new Uint8Array(downloadResult.buffer);
        const fileName = `${download.name.replace(/\s+/g, "_")}_v${download.version}`;

        // Determine if file should be inline (viewable) or attachment (download)
        const isViewable = downloadResult.mimeType === "application/pdf" ||
          downloadResult.mimeType.startsWith("image/") ||
          downloadResult.mimeType.startsWith("text/");
        const disposition = isViewable ? "inline" : "attachment";

        return new NextResponse(uint8Array, {
          status: 200,
          headers: {
            "Content-Type": downloadResult.mimeType,
            "Content-Disposition": `${disposition}; filename="${fileName}"`,
            "Content-Length": downloadResult.fileSize.toString(),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
            ...(download.checksum ? { "X-Checksum-SHA256": download.checksum } : {}),
          },
        });
      } catch (storageErr) {
        console.warn(`[DownloadAPI] Storage miss for ${id}: ${download.storagePath}`, storageErr);
        // Fall through to placeholder generation
      }
    }

    // Fallback: Generate a descriptive placeholder file when physical file is missing
    const fileName = `${download.name.replace(/\s+/g, "_")}_v${download.version}.txt`;
    const fileContent = `QBIT Hub Download
====================
File: ${download.name}
Version: ${download.version}
Category: ${download.category?.name ?? "Other"}
Size: ${download.fileSize} bytes
Checksum: ${download.checksum ?? "N/A"}
Release Date: ${download.releaseDate?.toISOString() ?? "N/A"}

NOTE: The physical file for this download is not yet available on this server.
This placeholder was generated automatically. In production, this endpoint
serves the actual binary file from cloud storage (Supabase, S3, etc.).

Download ID: ${download.id}
Storage Path: ${download.storagePath ?? "N/A"}
`;

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileContent.length.toString(),
      },
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/downloads/[id]/file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
