/**
 * Vercel Blob Storage Provider — stores files in Vercel Blob Storage.
 *
 * FULL STORAGE-LAYER AUDIT LOGGING:
 *   Every method logs before AND after each operation:
 *     - Token presence check
 *     - SDK function call (put/head/del/fetch)
 *     - Response details
 *     - Exception class + stack trace on failure
 *
 * ERROR HANDLING:
 *   - Missing BLOB_READ_WRITE_TOKEN → STORAGE_CONFIGURATION_ERROR
 *   - Vercel SDK errors (BlobAccessError, BlobStoreNotFoundError, etc.)
 *     are caught, their original class preserved, and re-thrown with
 *     full stack traces — NEVER wrapped as generic "Access denied"
 *   - Network errors are caught with their original class
 *
 * Configuration:
 *   STORAGE_PROVIDER="vercel-blob" (or "auto" with BLOB_READ_WRITE_TOKEN)
 *   BLOB_READ_WRITE_TOKEN="<token>"  (auto-set by Vercel)
 *   BLOB_STORE_ID="<store-id>"       (optional — targets a specific Blob store)
 */

import type { StorageProvider, UploadResult, DownloadResult } from "./types";
import { MIME_FROM_EXT, sanitizeFileName, getExtension } from "./types";
import { put, head, del } from "@vercel/blob";
import path from "path";
import crypto from "crypto";

export class VercelBlobStorageProvider implements StorageProvider {
  readonly name = "vercel-blob";

  /**
   * Check that BLOB_READ_WRITE_TOKEN is present before any operation.
   * Returns the token if present, throws STORAGE_CONFIGURATION_ERROR if missing.
   */
  private requireToken(): string {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      const error = new StorageConfigurationError(
        "STORAGE_CONFIGURATION_ERROR",
        "BLOB_READ_WRITE_TOKEN is not set. The Vercel Blob SDK requires this token to authenticate. Set it in your Vercel project settings under Environment Variables, or switch STORAGE_PROVIDER to 'local'.",
        { envVar: "BLOB_READ_WRITE_TOKEN", provider: "vercel-blob" },
      );
      console.error(`[VercelBlob] CONFIGURATION ERROR: BLOB_READ_WRITE_TOKEN is undefined.`);
      console.error(`[VercelBlob] The @vercel/blob SDK requires this token to authenticate with the Vercel Blob API.`);
      console.error(`[VercelBlob] To fix:`);
      console.error(`[VercelBlob]   1. Go to Vercel Dashboard → Settings → Environment Variables`);
      console.error(`[VercelBlob]   2. Ensure BLOB_READ_WRITE_TOKEN is set (auto-created when you create a Blob store)`);
      console.error(`[VercelBlob]   3. Or set STORAGE_PROVIDER="local" to use filesystem storage`);
      throw error;
    }
    return token;
  }

  async upload(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    // ---- Pre-flight: verify token ----
    const token = this.requireToken();
    const tokenPrefix = token.slice(0, 8) + "...";

    const sanitized = sanitizeFileName(originalFileName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${sanitized}`;
    const blobKey = `resources/${uniqueName}`;

    console.log(`[VercelBlob] === UPLOAD START ===`);
    console.log(`[VercelBlob]   Token present:    yes (${tokenPrefix})`);
    console.log(`[VercelBlob]   Blob key:         ${blobKey}`);
    console.log(`[VercelBlob]   File name:        ${originalFileName}`);
    console.log(`[VercelBlob]   MIME type:        ${mimeType}`);
    console.log(`[VercelBlob]   Buffer size:      ${buffer.length} bytes`);
    console.log(`[VercelBlob]   BLOB_STORE_ID:    ${process.env.BLOB_STORE_ID ?? "(not set)"}`);
    console.log(`[VercelBlob]   Access:           public`);
    console.log(`[VercelBlob]   Calling put()...`);

    let blob;
    try {
      const putOptions: Parameters<typeof put>[2] = {
        access: "public",
        contentType: mimeType,
        addRandomSuffix: false,
        // Use the specific Blob store if BLOB_STORE_ID is set
        ...(process.env.BLOB_STORE_ID ? { storeId: process.env.BLOB_STORE_ID } : {}),
      };

      console.log(`[VercelBlob]   put() args: key="${blobKey}", body=Buffer(${buffer.length}), options=${JSON.stringify(putOptions)}`);

      blob = await put(blobKey, buffer, putOptions);

      console.log(`[VercelBlob] === UPLOAD SUCCESS ===`);
      console.log(`[VercelBlob]   Blob URL:         ${blob.url}`);
      console.log(`[VercelBlob]   Blob pathname:    ${blob.pathname}`);
      console.log(`[VercelBlob]   Content-Type:     ${blob.contentType ?? "(unknown)"}`);
      console.log(`[VercelBlob]   Download URL:     ${blob.downloadUrl ?? "N/A"}`);
    } catch (sdkError) {
      // ---- Capture the EXACT SDK error class and message ----
      const errorClass = sdkError instanceof Error ? sdkError.constructor.name : typeof sdkError;
      const errorMessage = sdkError instanceof Error ? sdkError.message : String(sdkError);
      const errorStack = sdkError instanceof Error ? sdkError.stack : "N/A";

      console.error(`[VercelBlob] === UPLOAD FAILED ===`);
      console.error(`[VercelBlob]   Error class:       ${errorClass}`);
      console.error(`[VercelBlob]   Error message:     ${errorMessage}`);
      console.error(`[VercelBlob]   Stack trace:`);
      console.error(errorStack);

      // Known Vercel Blob error classes — provide specific guidance
      const className = String(errorClass);
      if (className.includes("BlobAccessError") || errorMessage.includes("Access denied")) {
        console.error(`[VercelBlob] DIAGNOSIS: BlobAccessError — the token does not have permission to write to this Blob store.`);
        console.error(`[VercelBlob]   Possible causes:`);
        console.error(`[VercelBlob]   1. BLOB_READ_WRITE_TOKEN is for a DIFFERENT Vercel project or store`);
        console.error(`[VercelBlob]   2. The token has been revoked or expired`);
        console.error(`[VercelBlob]   3. The Blob store has been deleted`);
        console.error(`[VercelBlob]   4. BLOB_STORE_ID points to a store that doesn't match the token`);
        console.error(`[VercelBlob]   FIX: Go to Vercel Dashboard → Storage → Blob and verify the store exists and the token matches.`);
      } else if (className.includes("BlobStoreNotFoundError")) {
        console.error(`[VercelBlob] DIAGNOSIS: BlobStoreNotFoundError — the Blob store doesn't exist.`);
        console.error(`[VercelBlob]   FIX: Create a Blob store in the Vercel Dashboard, or remove BLOB_STORE_ID from env.`);
      } else if (className.includes("BlobStoreSuspendedError")) {
        console.error(`[VercelBlob] DIAGNOSIS: BlobStoreSuspendedError — the Blob store has been suspended (billing issue?).`);
      } else if (className.includes("BlobFileTooLargeError")) {
        console.error(`[VercelBlob] DIAGNOSIS: BlobFileTooLargeError — file exceeds Vercel Blob plan limits.`);
      }

      // Re-throw the ORIGINAL error — do NOT wrap it
      // The caller (StorageService) will handle it
      throw sdkError;
    }

    return {
      storageKey: blob.url,
      fileName: uniqueName,
      originalFileName,
      mimeType,
      fileSize: buffer.length,
    };
  }

  async download(storageKey: string): Promise<DownloadResult> {
    console.log(`[VercelBlob] === DOWNLOAD START ===`);
    console.log(`[VercelBlob]   Storage key (URL): ${storageKey.slice(0, 80)}...`);

    let response: Response;
    try {
      response = await fetch(storageKey, { method: "GET" });
      console.log(`[VercelBlob]   Fetch response: ${response.status} ${response.statusText}`);
    } catch (fetchError) {
      const errorClass = fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError;
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error(`[VercelBlob] === DOWNLOAD FAILED (fetch error) ===`);
      console.error(`[VercelBlob]   Error class: ${errorClass}`);
      console.error(`[VercelBlob]   Error message: ${errorMessage}`);
      console.error(`[VercelBlob]   Stack: ${fetchError instanceof Error ? fetchError.stack : "N/A"}`);
      throw fetchError;
    }

    if (!response.ok) {
      const errMsg = `Failed to download from Vercel Blob: HTTP ${response.status} ${response.statusText}`;
      console.error(`[VercelBlob] === DOWNLOAD FAILED (HTTP error) ===`);
      console.error(`[VercelBlob]   ${errMsg}`);
      console.error(`[VercelBlob]   URL: ${storageKey.slice(0, 80)}...`);
      throw new Error(errMsg);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const urlPath = new URL(storageKey).pathname;
    const fileName = path.basename(urlPath);
    const ext = getExtension(fileName);
    const mimeType = MIME_FROM_EXT[ext] || contentType;

    console.log(`[VercelBlob] === DOWNLOAD SUCCESS ===`);
    console.log(`[VercelBlob]   Bytes: ${buffer.length}, MIME: ${mimeType}`);

    return { buffer, mimeType, fileSize: buffer.length, fileName };
  }

  async delete(storageKey: string): Promise<boolean> {
    console.log(`[VercelBlob] === DELETE START ===`);
    console.log(`[VercelBlob]   Storage key: ${storageKey.slice(0, 80)}...`);
    try {
      await del(storageKey);
      console.log(`[VercelBlob] === DELETE SUCCESS ===`);
      return true;
    } catch (delError) {
      const errorClass = delError instanceof Error ? delError.constructor.name : typeof delError;
      const errorMessage = delError instanceof Error ? delError.message : String(delError);
      console.error(`[VercelBlob] === DELETE FAILED ===`);
      console.error(`[VercelBlob]   Error class: ${errorClass}`);
      console.error(`[VercelBlob]   Error message: ${errorMessage}`);
      console.error(`[VercelBlob]   Stack: ${delError instanceof Error ? delError.stack : "N/A"}`);
      return false;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    console.log(`[VercelBlob] === EXISTS CHECK ===`);
    console.log(`[VercelBlob]   Storage key: ${storageKey.slice(0, 80)}...`);
    try {
      const blobDetails = await head(storageKey);
      const exists = !!blobDetails;
      console.log(`[VercelBlob]   Result: ${exists}`);
      return exists;
    } catch (headError) {
      const errorClass = headError instanceof Error ? headError.constructor.name : typeof headError;
      const errorMessage = headError instanceof Error ? headError.message : String(headError);
      console.error(`[VercelBlob]   EXISTS CHECK FAILED: ${errorClass}: ${errorMessage}`);
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Storage Configuration Error — missing env vars, invalid setup
// ---------------------------------------------------------------------------

export class StorageConfigurationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "StorageConfigurationError";
  }

  toJSON() {
    return {
      success: false,
      code: this.code,
      message: this.message,
      details: this.details ?? {},
    };
  }
}
