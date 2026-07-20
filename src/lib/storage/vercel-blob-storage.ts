/**
 * Vercel Blob Storage Provider — stores files in Vercel Blob Storage.
 *
 * This is the PRODUCTION storage provider for the Global Resources module.
 * Local storage is ephemeral on Vercel's serverless functions — files written
 * to public/ are lost on cold starts. Vercel Blob provides persistent,
 * CDN-backed object storage.
 *
 * Configuration:
 *   STORAGE_PROVIDER="vercel-blob"
 *   BLOB_READ_WRITE_TOKEN="<vercel-blob-token>"  (auto-set by Vercel)
 *
 * Storage keys follow the format: resources/<timestamp>-<random6>-<sanitized-name>
 * The Vercel Blob URL is stored in the Resource.url field as an external URL.
 */

import type { StorageProvider, UploadResult, DownloadResult } from "./types";
import { put, head, del } from "@vercel/blob";
import path from "path";
import crypto from "crypto";

export class VercelBlobStorageProvider implements StorageProvider {
  readonly name = "vercel-blob";

  async upload(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    const sanitized = sanitizeFileName(originalFileName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${sanitized}`;
    const blobKey = `resources/${uniqueName}`;

    const blob = await put(blobKey, buffer, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
      // Use the specific Blob store if BLOB_STORE_ID is set
      ...(process.env.BLOB_STORE_ID ? { storeId: process.env.BLOB_STORE_ID } : {}),
    });

    return {
      storageKey: blob.url,
      fileName: uniqueName,
      originalFileName,
      mimeType,
      fileSize: buffer.length,
    };
  }

  async download(storageKey: string): Promise<DownloadResult> {
    // storageKey is the full Vercel Blob URL
    const response = await fetch(storageKey, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download from Vercel Blob: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    // Extract filename from URL path
    const urlPath = new URL(storageKey).pathname;
    const fileName = path.basename(urlPath);

    const mimeType = MIME_FROM_EXT[path.extname(fileName).toLowerCase()] || contentType;

    return {
      buffer,
      mimeType,
      fileSize: buffer.length,
      fileName,
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      await del(storageKey);
      return true;
    } catch {
      return false;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      const blobDetails = await head(storageKey);
      return !!blobDetails;
    } catch {
      return false;
    }
  }
}

/** Sanitize a filename to remove dangerous characters */
function sanitizeFileName(name: string): string {
  return name
    .replace(/\0/g, "")
    .replace(/\.\./g, "")
    .replace(/[<>:"|?*\\\/]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+/, "");
}

/** Extension → MIME type mapping */
const MIME_FROM_EXT: Record<string, string> = {
  ".exe": "application/vnd.microsoft.portable-executable",
  ".msi": "application/x-msi",
  ".apk": "application/vnd.android.package-archive",
  ".dmg": "application/x-apple-diskimage",
  ".deb": "application/x-debian-package",
  ".rpm": "application/x-rpm",
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".md": "text/markdown",
  ".bin": "application/octet-stream",
  ".hex": "application/x-hex",
  ".img": "application/x-img",
  ".iso": "application/x-iso9660-image",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".js": "application/javascript",
  ".json": "application/json",
  ".html": "text/html",
  ".css": "text/css",
  ".xml": "application/xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".firmware": "application/octet-stream",
  ".fls": "application/octet-stream",
  ".fw": "application/octet-stream",
};
