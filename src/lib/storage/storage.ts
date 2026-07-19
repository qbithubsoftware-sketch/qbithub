/**
 * Storage Service — high-level API for file upload, download, and delete.
 *
 * This is the ONLY interface the rest of the application should use.
 * It delegates to the active StorageProvider (from provider.ts).
 *
 * Usage:
 *   import { StorageService } from "@/lib/storage/storage";
 *
 *   // Upload
 *   const result = await StorageService.upload(buffer, "driver.exe", "application/vnd.microsoft.portable-executable");
 *   // result.storageKey → "/uploads/resources/1700000000-abc123-driver.exe"
 *
 *   // Download
 *   const data = await StorageService.download(storageKey);
 *   // data.buffer → Buffer, data.mimeType, data.fileSize, data.fileName
 *
 *   // Delete
 *   await StorageService.delete(storageKey);
 */

import { getStorageProvider } from "./provider";
import type { UploadResult, DownloadResult } from "./types";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
} from "./types";

export class StorageServiceClass {
  /**
   * Upload a file to storage.
   * Validates file type, size, and generates a unique filename.
   *
   * @param buffer — File contents as a Buffer
   * @param originalFileName — User's original filename
   * @param mimeType — File MIME type
   * @returns UploadResult with storageKey + metadata
   * @throws Error if validation fails
   */
  async upload(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    // ===== Validate file size =====
    if (!buffer || buffer.length < MIN_FILE_SIZE) {
      throw new Error("File is empty. Please select a valid file.");
    }
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(
        `File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Maximum allowed: 50MB.`,
      );
    }

    // ===== Validate file type =====
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      const allowed = Object.keys(ALLOWED_MIME_TYPES).join(", ");
      throw new Error(
        `Unsupported file type: ${mimeType}. Allowed types: ${allowed}`,
      );
    }

    // ===== Delegate to provider =====
    const provider = getStorageProvider();
    return provider.upload(buffer, originalFileName, mimeType);
  }

  /**
   * Download a file from storage.
   *
   * @param storageKey — Relative storage key (e.g. "/uploads/resources/xxx.exe")
   * @returns DownloadResult with buffer + metadata
   * @throws Error if file not found
   */
  async download(storageKey: string): Promise<DownloadResult> {
    if (!storageKey) {
      throw new Error("Storage key is required.");
    }

    const provider = getStorageProvider();
    return provider.download(storageKey);
  }

  /**
   * Delete a file from storage.
   * Returns true if file was deleted, false if file didn't exist.
   *
   * @param storageKey — Relative storage key
   */
  async delete(storageKey: string): Promise<boolean> {
    if (!storageKey) return false;

    const provider = getStorageProvider();
    return provider.delete(storageKey);
  }

  /**
   * Check if a file exists in storage.
   *
   * @param storageKey — Relative storage key
   */
  async exists(storageKey: string): Promise<boolean> {
    if (!storageKey) return false;

    const provider = getStorageProvider();
    return provider.exists(storageKey);
  }

  /**
   * Validate a file before upload (without actually uploading).
   * Returns an error message string if invalid, null if valid.
   */
  validate(
    buffer: Buffer | null,
    mimeType: string,
  ): string | null {
    if (!buffer || buffer.length < MIN_FILE_SIZE) {
      return "File is empty. Please select a valid file.";
    }
    if (buffer.length > MAX_FILE_SIZE) {
      return `File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Maximum allowed: 50MB.`;
    }
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return `Unsupported file type: ${mimeType}.`;
    }
    return null;
  }
}

/** Singleton instance — use this throughout the app. */
export const StorageService = new StorageServiceClass();

// Re-export types for convenience
export type { UploadResult, DownloadResult } from "./types";
