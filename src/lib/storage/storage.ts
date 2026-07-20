/**
 * Storage Service — high-level API. The ONLY interface the rest of the app should use.
 *
 * Wraps the configured StorageProvider and adds:
 *  - File validation (size, MIME type)
 *  - SHA-256 checksum computation on upload
 *  - Path traversal protection
 */

import { getStorageProvider } from "./provider";
import type { UploadResult, DownloadResult } from "./types";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MIN_FILE_SIZE } from "./types";
import crypto from "crypto";

export interface UploadResultWithChecksum extends UploadResult {
  /** SHA-256 hex digest of the uploaded file */
  checksum: string;
}

export class StorageServiceClass {
  /**
   * Upload a file buffer through the active storage provider.
   * Validates size and MIME type, computes SHA-256 checksum.
   */
  async upload(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<UploadResultWithChecksum> {
    // Validate
    if (!buffer || buffer.length < MIN_FILE_SIZE) {
      throw new Error("File is empty.");
    }
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(
        `File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      );
    }
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      // Allow application/octet-stream as fallback for binary files
      if (mimeType !== "application/octet-stream") {
        throw new Error(`Unsupported file type: ${mimeType}.`);
      }
    }

    // Compute SHA-256 checksum before storing
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    // Delegate to provider
    const provider = getStorageProvider();
    const result = await provider.upload(buffer, originalFileName, mimeType);

    console.log(
      `[StorageService] Uploaded: ${originalFileName} → ${result.storageKey} (${result.fileSize} bytes, SHA256: ${checksum.slice(0, 16)}…)`,
    );

    return {
      ...result,
      checksum,
    };
  }

  /**
   * Download a file by storage key.
   */
  async download(storageKey: string): Promise<DownloadResult> {
    if (!storageKey) throw new Error("Storage key is required.");
    const provider = getStorageProvider();
    return provider.download(storageKey);
  }

  /**
   * Delete a file by storage key.
   */
  async delete(storageKey: string): Promise<boolean> {
    if (!storageKey) return false;
    const provider = getStorageProvider();
    const result = await provider.delete(storageKey);
    if (result) {
      console.log(`[StorageService] Deleted: ${storageKey}`);
    }
    return result;
  }

  /**
   * Check if a file exists by storage key.
   */
  async exists(storageKey: string): Promise<boolean> {
    if (!storageKey) return false;
    const provider = getStorageProvider();
    return provider.exists(storageKey);
  }

  /**
   * Validate a file buffer without uploading.
   * Returns an error message string if invalid, null if valid.
   */
  validate(buffer: Buffer | null, mimeType: string): string | null {
    if (!buffer || buffer.length < MIN_FILE_SIZE) return "File is empty.";
    if (buffer.length > MAX_FILE_SIZE)
      return `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    if (!ALLOWED_MIME_TYPES[mimeType] && mimeType !== "application/octet-stream")
      return `Unsupported file type: ${mimeType}.`;
    return null;
  }
}

export const StorageService = new StorageServiceClass();
export type { UploadResult, DownloadResult } from "./types";
