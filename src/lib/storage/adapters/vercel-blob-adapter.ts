/**
 * Vercel Blob Storage Adapter — implements StorageAdapter for Vercel Blob.
 *
 * This adapter wraps the existing VercelBlobStorageProvider functionality
 * into the new StorageAdapter interface. It delegates to the @vercel/blob
 * SDK (put, head, del) for all operations.
 *
 * AUTHENTICATION:
 *   Two auth methods supported:
 *     1. OIDC + BLOB_STORE_ID (recommended) — auto on Vercel runtime
 *     2. BLOB_READ_WRITE_TOKEN (legacy) — explicit token
 *
 * STORAGE KEY RESOLUTION:
 *   The database may contain storageKeys in two formats:
 *     A. Full Blob URL: https://store_xxx.public.blob.vercel-storage.com/resources/...
 *     B. Relative path:  resources/1784559605570-abc123-driver.exe
 *   Both formats are handled — relative paths are resolved to full URLs.
 *
 * NO FILESYSTEM API — all operations go through the Vercel Blob HTTP API.
 */

import type { StorageAdapter, FileMetadata, UploadResult } from "./storage-adapter";
import { StorageAdapterError } from "./storage-adapter";
import { MIME_FROM_EXT, sanitizeFileName, getExtension } from "../types";
import {
  detectBlobAuth,
  buildBlobCommandOptions,
  type BlobAuthDetection,
  StorageConfigurationError,
} from "../vercel-blob-storage";
import { put, head, del } from "@vercel/blob";
import crypto from "crypto";
import path from "path";

// ---------------------------------------------------------------------------
// Helper functions (reused from vercel-blob-storage.ts)
// ---------------------------------------------------------------------------

function isBlobUrl(key: string): boolean {
  try {
    const parsed = new URL(key);
    return parsed.hostname.includes("blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function readEnv(name: string): string | undefined {
  try {
    const value = process.env[name];
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  } catch {
    return undefined;
  }
}

function normalizeStoreId(storeId: string): string {
  return storeId.startsWith("store_") ? storeId.slice("store_".length) : storeId;
}

function parseStoreIdFromToken(token: string): string | null {
  try {
    const parts = token.split("_");
    if (parts.length >= 4 && parts[0] === "vercel" && parts[1] === "blob" && parts[2] === "rw") {
      return parts[3];
    }
    return null;
  } catch {
    return null;
  }
}

function resolveBlobUrl(storageKey: string, auth: BlobAuthDetection): string {
  if (isBlobUrl(storageKey)) return storageKey;

  const pathname = storageKey.replace(/^\//, "");

  if (!auth.storeId) {
    throw new StorageConfigurationError(
      "STORAGE_CONFIGURATION_ERROR",
      `Cannot resolve relative storage key "${storageKey}" — no store ID available.`,
      { storageKey, hasStoreId: false },
    );
  }

  return `https://${auth.storeId}.public.blob.vercel-storage.com/${pathname}`;
}

function extractFileName(key: string): string {
  try {
    if (isBlobUrl(key) || key.startsWith("http://") || key.startsWith("https://")) {
      return path.basename(new URL(key).pathname);
    }
    return path.basename(key);
  } catch {
    return path.basename(key);
  }
}

// ---------------------------------------------------------------------------
// VercelBlobAdapter
// ---------------------------------------------------------------------------

export class VercelBlobAdapter implements StorageAdapter {
  readonly name = "vercel-blob";

  private requireAuth(): BlobAuthDetection {
    const auth = detectBlobAuth();
    if (auth.method === "none") {
      throw new StorageConfigurationError(
        "STORAGE_CONFIGURATION_ERROR",
        "No Vercel Blob credentials found. Set BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN.",
        { envVar: "BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN" },
      );
    }
    return auth;
  }

  async upload(key: string, data: Buffer, metadata?: FileMetadata): Promise<UploadResult> {
    const auth = this.requireAuth();
    const blobOptions = buildBlobCommandOptions(auth);

    const originalName = metadata?.originalName ?? key;
    const sanitized = sanitizeFileName(originalName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${sanitized}`;
    const blobKey = `resources/${uniqueName}`;

    const mimeType = metadata?.contentType ?? MIME_FROM_EXT[getExtension(originalName)] ?? "application/octet-stream";

    console.log(`[VercelBlobAdapter] UPLOAD: ${originalName} → ${blobKey} (${data.length} bytes)`);

    let blob;
    try {
      const putOptions: Parameters<typeof put>[2] = {
        access: "public",
        contentType: mimeType,
        addRandomSuffix: false,
        ...blobOptions as Partial<Parameters<typeof put>[2]>,
      };

      blob = await put(blobKey, data, putOptions);

      console.log(`[VercelBlobAdapter] UPLOAD SUCCESS: ${blob.url}`);
    } catch (sdkError) {
      const errorMessage = sdkError instanceof Error ? sdkError.message : String(sdkError);
      console.error(`[VercelBlobAdapter] UPLOAD FAILED: ${errorMessage}`);
      throw new StorageAdapterError(
        "UPLOAD_FAILED",
        `Vercel Blob upload failed: ${errorMessage}`,
        { key: blobKey, authMethod: auth.method, originalError: errorMessage },
      );
    }

    // Compute checksum
    const checksum = crypto.createHash("sha256").update(data).digest("hex");

    return {
      key: blob.url,
      url: blob.url,
      size: data.length,
      contentType: mimeType,
      checksum,
      originalName,
      provider: this.name,
    };
  }

  async download(key: string): Promise<Buffer | null> {
    const auth = detectBlobAuth();

    let resolvedUrl: string;
    try {
      resolvedUrl = resolveBlobUrl(key, auth);
    } catch (resolveError) {
      console.error(`[VercelBlobAdapter] Key resolution failed: ${key}`);
      return null;
    }

    try {
      const response = await fetch(resolvedUrl, { method: "GET" });
      if (!response.ok) {
        console.error(`[VercelBlobAdapter] Download failed: HTTP ${response.status} for ${resolvedUrl.slice(0, 100)}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[VercelBlobAdapter] DOWNLOAD SUCCESS: ${key.slice(0, 60)} (${buffer.length} bytes)`);
      return buffer;
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error(`[VercelBlobAdapter] Download fetch error: ${errorMessage}`);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    const auth = detectBlobAuth();
    const blobOptions = buildBlobCommandOptions(auth);

    let resolvedKey = key;
    if (!isBlobUrl(key)) {
      try {
        resolvedKey = resolveBlobUrl(key, auth);
      } catch {
        console.warn(`[VercelBlobAdapter] Cannot resolve key for delete: ${key}`);
        return false;
      }
    }

    try {
      await del(resolvedKey, blobOptions as Parameters<typeof del>[1] | undefined);
      console.log(`[VercelBlobAdapter] DELETED: ${key.slice(0, 60)}`);
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const auth = detectBlobAuth();
    const blobOptions = buildBlobCommandOptions(auth);

    let resolvedKey = key;
    if (!isBlobUrl(key)) {
      try {
        resolvedKey = resolveBlobUrl(key, auth);
      } catch {
        return false;
      }
    }

    try {
      const blobDetails = await head(resolvedKey, blobOptions as Parameters<typeof head>[1] | undefined);
      return !!blobDetails;
    } catch {
      return false;
    }
  }

  async signedUrl(key: string, expiresIn?: number): Promise<string> {
    const auth = detectBlobAuth();

    let resolvedUrl: string;
    try {
      resolvedUrl = resolveBlobUrl(key, auth);
    } catch {
      throw new StorageAdapterError(
        "KEY_RESOLUTION_FAILED",
        `Cannot resolve storage key "${key}" to a Blob URL.`,
        { key },
      );
    }

    // For public blobs, the resolved URL is already accessible — no signing needed
    // For private blobs, the @vercel/blob SDK would generate a signed URL
    // Since we upload with access: "public", we return the URL directly
    return resolvedUrl;
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    const auth = detectBlobAuth();
    const blobOptions = buildBlobCommandOptions(auth);

    let resolvedKey = key;
    if (!isBlobUrl(key)) {
      try {
        resolvedKey = resolveBlobUrl(key, auth);
      } catch {
        return null;
      }
    }

    try {
      const blobDetails = await head(resolvedKey, blobOptions as Parameters<typeof head>[1] | undefined);
      if (!blobDetails) return null;

      return {
        contentType: blobDetails.contentType ?? undefined,
        size: blobDetails.size,
        originalName: extractFileName(resolvedKey),
        extension: getExtension(extractFileName(resolvedKey)).replace(/^\./, ""),
        uploadedAt: blobDetails.uploadedAt.toISOString(),
        storageProvider: this.name,
      };
    } catch {
      return null;
    }
  }
}
