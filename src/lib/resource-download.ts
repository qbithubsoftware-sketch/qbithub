/**
 * Unified Resource Download Service
 *
 * SINGLE SOURCE OF TRUTH for serving downloadable files.
 * All download API routes MUST use this module — never implement
 * download logic directly in route handlers.
 *
 * Handles:
 *  - Storage key → StorageService.download()
 *  - Data URL → base64 decode
 *  - External URL → redirect
 *  - File integrity check (checksum)
 *  - Download count increment
 *  - Proper Content-Type / Content-Disposition headers
 *  - Graceful error responses (never HTML where JSON expected)
 *  - Signed URL generation for the legacy Download model
 *  - Backward compatibility with files stored in public/uploads/resources/
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StorageService } from "@/lib/storage/storage";
import { sanitizeFileName, getExtension, MIME_FROM_EXT } from "@/lib/storage/types";
import { createResourceLogger, createErrorResponse } from "@/lib/storage/resource-logger";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResourceRecord {
  id: string;
  name: string;
  url: string;
  urlType?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  checksum?: string | null;
  originalFileName?: string | null;
  visibility: string;
  downloadCount: number;
}

interface DownloadOptions {
  /** If true, increment downloadCount on success */
  incrementCount?: boolean;
  /** Model name for the Prisma query: "resource" or "download" */
  modelName?: "resource" | "download";
}

// ---------------------------------------------------------------------------
// Signed token generation / validation (for legacy Download model)
// ---------------------------------------------------------------------------

const TOKEN_SECRET = () => process.env.NEXTAUTH_SECRET || "download-token-secret";
const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function generateDownloadToken(resourceId: string): string {
  const secret = TOKEN_SECRET();
  const expiry = Date.now() + TOKEN_TTL_MS;
  const payload = `${resourceId}:${expiry}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
    .slice(0, 16);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function validateDownloadToken(
  token: string,
  expectedId: string,
): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [downloadId, expiryStr, sig] = parts;
    if (downloadId !== expectedId) return false;

    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Date.now() > expiry) return false;

    const secret = TOKEN_SECRET();
    const payload = `${downloadId}:${expiryStr}`;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")
      .slice(0, 16);

    return sig === expectedSig;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// URL type detection (replaces fragile startsWith heuristics)
// ---------------------------------------------------------------------------

export function detectUrlType(url: string): "storage_key" | "data_url" | "external" {
  if (url.startsWith("data:")) return "data_url";
  // Vercel Blob URLs are storage keys (not external redirects)
  // They look like: https://xxx.public.blob.vercel-storage.com/resources/...
  if (isVercelBlobUrl(url)) return "storage_key";
  if (url.startsWith("http://") || url.startsWith("https://")) return "external";
  // Local storage keys (new format): "resources/..." or legacy: "/uploads/resources/..."
  return "storage_key";
}

/**
 * Check if a URL is a Vercel Blob storage URL.
 * These are persistent CDN URLs that should be treated as storage keys,
 * not external redirects, because we want to proxy the download
 * (increment count, check visibility, add headers).
 */
export function isVercelBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("blob.vercel-storage.com");
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Core: serve a resource file
// ---------------------------------------------------------------------------

/**
 * Serve a resource file as a downloadable response.
 *
 * This is the ONLY function that should produce file-download responses.
 * All download API routes call this instead of implementing their own logic.
 */
export async function serveResourceFile(
  resource: ResourceRecord,
  options: DownloadOptions = {},
): Promise<NextResponse> {
  const logger = createResourceLogger("download");
  const urlType = resource.urlType || detectUrlType(resource.url);

  // ---- 1. External URL → redirect ----
  if (urlType === "external") {
    logger.completed({ resourceId: resource.id, fileName: resource.originalFileName ?? undefined, mimeType: resource.mimeType ?? undefined });
    return NextResponse.redirect(resource.url, { status: 302 });
  }

  // ---- 2. Data URL → base64 decode ----
  if (urlType === "data_url") {
    const base64Data = resource.url.split(",")[1];
    if (!base64Data) {
      logger.failed("INVALID_DATA_URL", "Data URL has no base64 payload", { resourceId: resource.id });
      return NextResponse.json(
        createErrorResponse("INVALID_DATA_URL", "Invalid file data. The resource data URL is corrupted.", "download"),
        { status: 500 },
      );
    }
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = sanitizeFileName(resource.originalFileName || resource.name);

    // Increment download count
    if (options.incrementCount !== false) {
      await incrementDownloadCount(resource.id, options.modelName || "resource");
    }

    logger.completed({ resourceId: resource.id, fileName, fileSize: buffer.length });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": resource.mimeType || "application/octet-stream",
        "Content-Length": buffer.length.toString(),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      },
    });
  }

  // ---- 3. Storage key → StorageService ----
  console.log(`[ResourceDownload] === OBJECT LIFECYCLE: DB → Download ===`);
  console.log(`[ResourceDownload]   resource.id:       ${resource.id}`);
  console.log(`[ResourceDownload]   resource.url:      ${resource.url}`);
  console.log(`[ResourceDownload]   resource.urlType:  ${urlType}`);
  console.log(`[ResourceDownload]   Calling StorageService.download("${resource.url.slice(0, 60)}...")`);

  try {
    const downloadResult = await StorageService.download(resource.url);
    const uint8Array = new Uint8Array(downloadResult.buffer);
    const fileName = sanitizeFileName(
      resource.originalFileName || resource.name,
    );

    // Verify checksum if available
    if (resource.checksum) {
      const actualHash = computeSHA256(downloadResult.buffer);
      if (actualHash !== resource.checksum) {
        console.error(
          `[ResourceDownload] CHECKSUM MISMATCH: expected=${resource.checksum} actual=${actualHash} resource="${resource.name}" (id=${resource.id})`,
        );
        // Still serve the file but add warning headers
        if (options.incrementCount !== false) {
          await incrementDownloadCount(resource.id, options.modelName || "resource");
        }

        const isViewable =
          downloadResult.mimeType === "application/pdf" ||
          downloadResult.mimeType.startsWith("image/") ||
          downloadResult.mimeType.startsWith("text/");
        const disposition = isViewable ? "inline" : "attachment";

        return new NextResponse(uint8Array, {
          status: 200,
          headers: {
            "Content-Disposition": `${disposition}; filename="${fileName}"`,
            "Content-Type": downloadResult.mimeType,
            "Content-Length": downloadResult.fileSize.toString(),
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-cache",
            "X-Checksum-Warning": "Integrity check failed — file may be corrupted",
            "X-Checksum-Expected": resource.checksum,
            "X-Checksum-Actual": actualHash,
          },
        });
      }
    }

    // Increment download count
    if (options.incrementCount !== false) {
      await incrementDownloadCount(resource.id, options.modelName || "resource");
    }

    // Determine if viewable inline or attachment
    const isViewable =
      downloadResult.mimeType === "application/pdf" ||
      downloadResult.mimeType.startsWith("image/") ||
      downloadResult.mimeType.startsWith("text/");
    const disposition = isViewable ? "inline" : "attachment";

    logger.completed({
      resourceId: resource.id,
      fileName,
      fileSize: downloadResult.fileSize,
      mimeType: downloadResult.mimeType,
    });

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "Content-Type": downloadResult.mimeType,
        "Content-Length": downloadResult.fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        ...(resource.checksum
          ? { "X-Checksum-SHA256": resource.checksum }
          : {}),
      },
    });
  } catch (storageErr) {
    console.error(
      `[ResourceDownload] Storage error for key="${resource.url}" resource="${resource.name}" (id=${resource.id}):`,
      storageErr,
    );
    logger.failed("FILE_NOT_FOUND", `Physical file not found: ${resource.url}`, {
      resourceId: resource.id,
      storageKey: resource.url,
      fileName: resource.originalFileName ?? undefined,
    });

    return NextResponse.json(
      createErrorResponse(
        "FILE_NOT_FOUND",
        `The physical file for "${resource.name}" could not be read. It may have been moved or deleted.`,
        "download",
        { resourceId: resource.id, storageKey: resource.url },
      ),
      { status: 404 },
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeSHA256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function incrementDownloadCount(
  id: string,
  modelName: "resource" | "download",
): Promise<void> {
  try {
    if (modelName === "resource") {
      await db.resource.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      });
    } else {
      await db.download.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      });
    }
  } catch {
    // Non-critical — don't block the download
  }
}

/**
 * Fetch a resource record with all download-relevant fields.
 * Returns null if not found.
 */
export async function findResourceForDownload(
  id: string,
  modelName: "resource" | "download" = "resource",
): Promise<ResourceRecord | null> {
  if (modelName === "resource") {
    const r = await db.resource.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        url: true,
        urlType: true,
        mimeType: true,
        fileSize: true,
        checksum: true,
        originalFileName: true,
        visibility: true,
        downloadCount: true,
      },
    });
    return r;
  }

  // Legacy Download model
  const d = await db.download.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!d) return null;

  return {
    id: d.id,
    name: d.name,
    url: d.storagePath,
    urlType: "storage_key",
    mimeType: null,
    fileSize: d.fileSize,
    checksum: d.checksum,
    originalFileName: null,
    visibility: d.visibility,
    downloadCount: d.downloadCount,
  };
}
