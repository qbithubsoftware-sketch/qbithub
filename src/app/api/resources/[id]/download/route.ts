/**
 * GET /api/resources/[id]/download
 *
 * Downloads a resource file. Streams the file directly to the browser
 * with proper Content-Disposition: attachment header.
 *
 * Flow:
 *   1. Find resource by ID
 *   2. Resolve file using Storage Service
 *   3. Verify file exists
 *   4. Return file with proper headers
 *
 * Headers:
 *   Content-Disposition: attachment; filename="<original-name>"
 *   Content-Type: <correct MIME type>
 *   Content-Length: <file size>
 *
 * No redirects. No details page. No 404 (returns JSON error only if file missing).
 * Browser starts downloading immediately.
 *
 * Security: PUBLIC endpoint (customers need to download resources).
 * If visibility is not "public", requires admin auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StorageService } from "@/lib/storage/storage";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // ===== 1. Find resource =====
    const resource = await db.resource.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        url: true, // This is the storageKey
        mimeType: true,
        status: true,
        visibility: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 },
      );
    }

    // ===== 2. Check visibility (RBAC) =====
    if (resource.visibility !== "public") {
      const session = await requireSuperAdminOrAdmin();
      if (!session) {
        return NextResponse.json(
          { error: "Access denied. This resource is not public." },
          { status: 403 },
        );
      }
    }

    // ===== 3. Check if URL is a data URL (base64) — handle legacy resources =====
    if (resource.url.startsWith("data:")) {
      // Legacy base64 data URL — return directly
      const base64Data = resource.url.split(",")[1];
      if (!base64Data) {
        return NextResponse.json(
          { error: "Invalid file data." },
          { status: 500 },
        );
      }
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = resource.name.replace(/[^a-zA-Z0-9-_]/g, "_") || "download";

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": resource.mimeType ?? "application/octet-stream",
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    // ===== 4. Check if URL is external (http/https) — redirect =====
    if (resource.url.startsWith("http://") || resource.url.startsWith("https://")) {
      // External URL (YouTube, etc.) — redirect
      return NextResponse.redirect(resource.url, { status: 302 });
    }

    // ===== 5. Download from Storage Service =====
    try {
      const downloadResult = await StorageService.download(resource.url);

      // ===== 6. Return file with proper headers =====
      const fileName = resource.name.replace(/[^a-zA-Z0-9-_\.]/g, "_") + (resource.mimeType ? getExtensionFromMime(resource.mimeType) : "");

      console.log(`[DownloadAPI] Resource ${id} (${resource.name}) downloaded (${downloadResult.fileSize} bytes)`);

      // Convert Buffer to Uint8Array for NextResponse body
      const uint8Array = new Uint8Array(downloadResult.buffer);

      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": downloadResult.mimeType,
          "Content-Length": downloadResult.fileSize.toString(),
          "Cache-Control": "no-cache",
        },
      });
    } catch (downloadErr) {
      console.error(`[DownloadAPI] File not found for resource ${id}: ${resource.url}`);
      return NextResponse.json(
        { error: "File not found on storage. The physical file may have been deleted." },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("[API ERROR] GET /api/resources/[id]/download:", error);
    return NextResponse.json(
      { error: "Internal server error during download." },
      { status: 500 },
    );
  }
}

function getExtensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    "application/vnd.microsoft.portable-executable": ".exe",
    "application/x-msi": ".msi",
    "application/vnd.android.package-archive": ".apk",
    "application/zip": ".zip",
    "application/pdf": ".pdf",
    "application/octet-stream": ".bin",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  return map[mime] ?? "";
}
// force rebuild
// Download API route
