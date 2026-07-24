/**
 * Unified Resource Download Service — V5 Enterprise
 *
 * SINGLE SOURCE OF TRUTH for serving downloadable files.
 * All download API routes MUST use this module — never implement
 * download logic directly in route handlers.
 *
 * KEY PRINCIPLES (aligned with resource-service.ts):
 *   1. storageKey is ALWAYS used for storage lookup — NEVER publicUrl
 *   2. publicUrl is NEVER used for storage lookup — only for display/redirects
 *   3. urlType is validated and auto-corrected at runtime via resolveUrlType()
 *   4. All errors are structured — never "UNKNOWN"
 *   5. Backward compatibility — legacy `url` field is handled gracefully
 *
 * Handles:
 *  - External URL → redirect
 *  - Data URL → base64 decode
 *  - Storage key → StorageService.download() (storageKey ONLY, never publicUrl)
 *  - File integrity check (checksum)
 *  - Download count increment
 *  - Proper Content-Type / Content-Disposition headers
 *  - Graceful error responses (structured JSON, never generic HTML)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StorageService } from "@/lib/storage/storage";
import { getStorageAdapter } from "@/lib/storage/adapters/storage-factory";
import { sanitizeFileName, getExtension, MIME_FROM_EXT } from "@/lib/storage/types";
import { createResourceLogger, createErrorResponse } from "@/lib/storage/resource-logger";
import { resolveUrlType, detectUrlType } from "@/lib/resource-service";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types — aligned with V5 Resource model
// ---------------------------------------------------------------------------

interface ResourceRecord {
  id: string;
  name: string;
  // V5 fields (preferred)
  storageKey: string | null;
  publicUrl: string | null;
  storageProvider: string | null;
  urlType: string | null;
  // File metadata
  mimeType: string | null;
  fileSize: number | null;
  checksum: string | null;
  originalFileName: string | null;
  extension: string | null;
  // Display / lifecycle
  visibility: string;
  downloadCount: number;
  // Legacy backward compat
  url: string | null;
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
// URL type detection (aligned with resource-service.ts)
// ---------------------------------------------------------------------------

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
 * This is the ONLY function that should produce file-download responses
 * from the legacy download routes ([id]/download).
 * The admin resource route ([id]?download=true) uses serveResourceDownload()
 * from resource-service.ts instead.
 *
 * Both paths share the SAME principles:
 *   - storageKey for storage lookup
 *   - publicUrl for redirects only
 *   - Auto-correct urlType mismatches
 */
export async function serveResourceFile(
  resource: ResourceRecord,
  options: DownloadOptions = {},
): Promise<NextResponse> {
  const logger = createResourceLogger("download");

  // Resolve effective urlType — auto-corrects mismatches at runtime
  const urlType = resolveUrlType({
    urlType: resource.urlType,
    storageKey: resource.storageKey,
    publicUrl: resource.publicUrl,
    url: resource.url,
  });

  // Determine the effective URL for the resource
  const effectiveStorageKey = resource.storageKey ?? resource.url ?? "";
  const effectivePublicUrl = resource.publicUrl ?? resource.url ?? "";

  // ---- 1. External URL → redirect ----
  if (urlType === "external") {
    const redirectUrl = effectivePublicUrl || effectiveStorageKey;
    if (!redirectUrl) {
      logger.failed("FILE_NOT_FOUND", `External resource "${resource.name}" has no URL.`, { resourceId: resource.id });
      return NextResponse.json(
        createErrorResponse("FILE_NOT_FOUND", `The resource "${resource.name}" has no valid URL for redirect.`, "download", { resourceId: resource.id }),
        { status: 404 },
      );
    }
    logger.completed({ resourceId: resource.id, fileName: resource.originalFileName ?? undefined, mimeType: resource.mimeType ?? undefined });
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }

  // ---- 2. Data URL → base64 decode ----
  if (urlType === "data_url") {
    const dataUrl = effectiveStorageKey;
    const base64Data = dataUrl.split(",")[1];
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

  // ---- 3. Uploaded / Storage key → StorageService ----
  // CRITICAL: Use storageKey for lookup. NEVER use publicUrl.
  const storageKey = effectiveStorageKey;
  if (!storageKey) {
    logger.failed("PENDING_UPLOAD", `Resource "${resource.name}" has no storage key or URL.`, { resourceId: resource.id });
    return NextResponse.json(
      createErrorResponse("PENDING_UPLOAD", `This resource "${resource.name}" is pending upload — no file or URL has been assigned yet. Please contact the administrator or try again later.`, "download", { resourceId: resource.id, name: resource.name }),
      { status: 404 },
    );
  }

  // SAFETY CHECK: If storageKey is an HTTP URL (but NOT a Vercel Blob URL),
  // it's a broken record — auto-correct to redirect
  if ((storageKey.startsWith("http://") || storageKey.startsWith("https://")) && !isVercelBlobUrl(storageKey)) {
    console.warn(`[ResourceDownload] SAFETY: storageKey for "${resource.name}" is HTTP URL. Redirecting instead.`);
    logger.completed({ resourceId: resource.id, fileName: resource.originalFileName ?? undefined });
    return NextResponse.redirect(storageKey, { status: 302 });
  }

  console.log(`[ResourceDownload] Download: id=${resource.id}, key="${storageKey.slice(0, 60)}", type=${urlType}, provider=${resource.storageProvider ?? "auto"}`);

  try {
    // Try the new StorageAdapter first for hosting-agnostic download
    const adapter = getStorageAdapter();
    let downloadBuffer: Buffer | null = null;
    let downloadMimeType: string;

    try {
      downloadBuffer = await adapter.download(storageKey);
    } catch {
      downloadBuffer = null;
    }

    // If adapter didn't find it, fallback to legacy StorageService
    if (!downloadBuffer) {
      try {
        const legacyResult = await StorageService.download(storageKey);
        downloadBuffer = legacyResult.buffer;
        downloadMimeType = legacyResult.mimeType;
      } catch {
        // Both failed — throw to enter the catch block below
        throw new Error("File not found via StorageAdapter or StorageService");
      }
    } else {
      // Determine MIME type from extension for adapter result
      const ext = getExtension(storageKey);
      downloadMimeType = MIME_FROM_EXT[ext] || resource.mimeType || "application/octet-stream";
    }

    // Build a unified download result from whichever source succeeded
    const downloadResult = {
      buffer: downloadBuffer,
      mimeType: downloadMimeType,
      fileSize: downloadBuffer.length,
      fileName: sanitizeFileName(resource.originalFileName || resource.name),
    };
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
      `[ResourceDownload] Storage error for key="${storageKey}" resource="${resource.name}" (id=${resource.id}):`,
      storageErr,
    );
    logger.failed("PENDING_UPLOAD", `Physical file not found: ${storageKey.slice(0, 60)}`, {
      resourceId: resource.id,
      storageKey: storageKey.slice(0, 60),
      fileName: resource.originalFileName ?? undefined,
      storageProvider: resource.storageProvider ?? "auto",
    });

    // Determine the most helpful error message based on context
    const errMsg = resource.storageProvider === "local"
      ? `This resource "${resource.name}" is pending upload — the physical file has not been stored yet. Please contact the administrator or try again later.`
      : `This resource "${resource.name}" could not be retrieved from ${resource.storageProvider ?? "storage"}. The file may have been moved, deleted, or is still pending upload. Please contact the administrator.`;

    return NextResponse.json(
      createErrorResponse(
        "PENDING_UPLOAD",
        errMsg,
        "download",
        { resourceId: resource.id, storageKey: storageKey.slice(0, 60), storageProvider: resource.storageProvider ?? "auto" },
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
 * Fetch a resource record with ALL download-relevant fields.
 * V5: Selects storageKey, publicUrl, storageProvider (not just legacy url).
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
        // V5 fields (preferred)
        storageKey: true,
        publicUrl: true,
        storageProvider: true,
        urlType: true,
        // File metadata
        mimeType: true,
        fileSize: true,
        checksum: true,
        originalFileName: true,
        extension: true,
        // Display / lifecycle
        visibility: true,
        downloadCount: true,
        // Legacy backward compat
        url: true,
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
    storageKey: d.storagePath,
    publicUrl: null,
    storageProvider: "local",
    urlType: "uploaded",
    mimeType: null,
    fileSize: d.fileSize,
    checksum: d.checksum,
    originalFileName: null,
    extension: null,
    visibility: d.visibility,
    downloadCount: d.downloadCount,
    url: d.storagePath,
  };
}

// Re-export detectUrlType for backward compat with any importers
export { detectUrlType };
