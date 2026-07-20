/**
 * Vercel Blob Storage Provider — stores files in Vercel Blob Storage.
 *
 * This is the production storage provider for Vercel deployments.
 * Local storage is ephemeral on Vercel's serverless functions — files written
 * to data/ are lost on cold starts. Vercel Blob provides persistent,
 * CDN-backed object storage.
 *
 * Configuration:
 *   STORAGE_PROVIDER="vercel-blob"
 *   BLOB_READ_WRITE_TOKEN="<vercel-blob-token>"  (auto-set by Vercel)
 *   BLOB_STORE_ID="<store-id>" (optional — targets a specific Blob store)
 *
 * HOSTING NOTE:
 *   This provider is Vercel-specific. It is NOT required — the app works
 *   with STORAGE_PROVIDER="local" on any Node.js host. Use this provider
 *   only when deploying to Vercel's serverless platform.
 *
 * Storage keys follow the format: resources/<timestamp>-<random6>-<sanitized-name>
 * The Vercel Blob URL is stored in the Resource.url field as an external URL.
 */

import type { StorageProvider, UploadResult, DownloadResult } from "./types";
import { MIME_FROM_EXT, sanitizeFileName, getExtension } from "./types";
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

    const ext = getExtension(fileName);
    const mimeType = MIME_FROM_EXT[ext] || contentType;

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
