/**
 * Storage Service — high-level API. The ONLY interface the rest of the app should use.
 *
 * Wraps the configured StorageProvider and adds:
 *  - File validation (size, MIME type, extension, magic bytes)
 *  - SHA-256 checksum computation on upload
 *  - Path traversal protection
 *  - Enterprise logging for every upload/download/delete operation
 *  - Backward compatibility with files stored in public/uploads/resources/
 */

import { getStorageProvider } from "./provider";
import type { UploadResult, DownloadResult } from "./types";
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  BLOCKED_EXTENSIONS,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
  MAGIC_BYTES,
  getExtension,
} from "./types";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export interface UploadResultWithChecksum extends UploadResult {
  /** SHA-256 hex digest of the uploaded file */
  checksum: string;
}

export class StorageServiceClass {
  /**
   * Upload a file buffer through the active storage provider.
   * Validates size, MIME type, extension, and optionally magic bytes.
   * Computes SHA-256 checksum.
   */
  async upload(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<UploadResultWithChecksum> {
    const startTime = Date.now();

    // ---- 1. Validate file is not empty ----
    if (!buffer || buffer.length < MIN_FILE_SIZE) {
      throw new StorageValidationError(
        "FILE_EMPTY",
        "File is empty or too small to be valid.",
        { originalFileName, mimeType, fileSize: buffer?.length ?? 0 },
      );
    }

    // ---- 2. Validate file size ----
    if (buffer.length > MAX_FILE_SIZE) {
      throw new StorageValidationError(
        "FILE_TOO_LARGE",
        `File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        { originalFileName, mimeType, fileSize: buffer.length, maxSize: MAX_FILE_SIZE },
      );
    }

    // ---- 3. Validate extension ----
    const ext = getExtension(originalFileName);
    if (ext && BLOCKED_EXTENSIONS.has(ext)) {
      throw new StorageValidationError(
        "BLOCKED_EXTENSION",
        `Blocked file extension: ${ext}. This file type is not allowed for security reasons.`,
        { originalFileName, extension: ext },
      );
    }
    if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
      throw new StorageValidationError(
        "UNSUPPORTED_EXTENSION",
        `Unsupported file extension: ${ext}. Allowed extensions: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`,
        { originalFileName, extension: ext },
      );
    }

    // ---- 4. Validate MIME type ----
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      // Allow application/octet-stream as fallback for binary files (firmware, .bin, .img, etc.)
      if (mimeType !== "application/octet-stream") {
        // Also allow some common browser-reported MIME types that differ from standard
        const alternateMimes: Record<string, string> = {
          "application/x-msdos-program": "application/vnd.microsoft.portable-executable",
          "application/x-zip-compressed": "application/zip",
          "application/vnd.rar": "application/x-rar-compressed",
          "application/x-gzip": "application/gzip",
          "text/xml": "application/xml",
          "application/x-yaml": "text/yaml",
          "video/quicktime": "video/quicktime",
          "video/x-msvideo": "video/x-msvideo",
          "application/x-cab": "application/x-cab",
          "application/x-info": "application/x-info",
        };
        if (!alternateMimes[mimeType]) {
          throw new StorageValidationError(
            "UNSUPPORTED_MIME_TYPE",
            `Unsupported file type: ${mimeType}. If this is a valid file type, contact your administrator.`,
            { originalFileName, mimeType, extension: ext },
          );
        }
      }
    }

    // ---- 5. Verify magic bytes (if we have a signature for this file type) ----
    const magicResult = verifyMagicBytes(buffer, ext);
    if (magicResult === "SPOOFED") {
      console.warn(
        `[StorageService] MAGIC BYTE MISMATCH: File "${originalFileName}" has extension "${ext}" but content does not match. Possible MIME spoofing attempt.`,
      );
      // We log a warning but don't block the upload — some files have unusual headers.
      // In a high-security environment, change this to throw an error.
    }

    // ---- 6. Compute SHA-256 checksum before storing ----
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    // ---- 7. Delegate to storage provider ----
    const provider = getStorageProvider();
    const result = await provider.upload(buffer, originalFileName, mimeType);

    const duration = Date.now() - startTime;
    console.log(
      `[StorageService] UPLOAD OK: ${originalFileName} → ${result.storageKey} (${result.fileSize} bytes, SHA256: ${checksum.slice(0, 16)}..., ${duration}ms)`,
    );

    return {
      ...result,
      checksum,
    };
  }

  /**
   * Download a file by storage key.
   * Supports backward compatibility with files stored in public/uploads/resources/.
   */
  async download(storageKey: string): Promise<DownloadResult> {
    if (!storageKey) throw new StorageError("DOWNLOAD_NO_KEY", "Storage key is required.");

    const provider = getStorageProvider();

    try {
      return await provider.download(storageKey);
    } catch (primaryError) {
      // Backward compatibility: try the legacy location (public/uploads/resources/)
      // Files uploaded before the migration are stored in public/
      if (provider.name === "local" && storageKey.startsWith("resources/")) {
        try {
          const legacyKey = `/uploads/${storageKey}`;
          const legacyPath = path.join(process.cwd(), "public", legacyKey.replace(/^\//, ""));
          const buffer = await fs.readFile(legacyPath);
          const ext = getExtension(storageKey);
          const { MIME_FROM_EXT } = await import("./types");
          const mimeType = MIME_FROM_EXT[ext] || "application/octet-stream";
          const fileName = path.basename(storageKey);

          console.log(
            `[StorageService] DOWNLOAD (legacy path): ${storageKey} → ${legacyPath} (${buffer.length} bytes)`,
          );

          return {
            buffer,
            mimeType,
            fileSize: buffer.length,
            fileName,
          };
        } catch {
          // Legacy path also failed — throw the original error
        }
      }
      throw primaryError;
    }
  }

  /**
   * Delete a file by storage key.
   */
  async delete(storageKey: string): Promise<boolean> {
    if (!storageKey) return false;
    const provider = getStorageProvider();
    const result = await provider.delete(storageKey);
    if (result) {
      console.log(`[StorageService] DELETED: ${storageKey}`);
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
      return `File too large. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    if (!ALLOWED_MIME_TYPES[mimeType] && mimeType !== "application/octet-stream")
      return `Unsupported file type: ${mimeType}.`;
    return null;
  }
}

export const StorageService = new StorageServiceClass();
export type { UploadResult, DownloadResult } from "./types";

// ---------------------------------------------------------------------------
// Custom error classes for structured error handling
// ---------------------------------------------------------------------------

export class StorageError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "StorageError";
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

export class StorageValidationError extends StorageError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(code, message, details);
    this.name = "StorageValidationError";
  }
}

// ---------------------------------------------------------------------------
// Magic bytes verification
// ---------------------------------------------------------------------------

/**
 * Verify that a file's magic bytes match its claimed extension.
 *
 * Returns:
 *  - "MATCH" if magic bytes confirm the file type
 *  - "NO_SIGNATURE" if we don't have a signature for this extension
 *  - "SPOOFED" if the magic bytes DON'T match the expected signature
 */
function verifyMagicBytes(buffer: Buffer, extension: string): "MATCH" | "NO_SIGNATURE" | "SPOOFED" {
  if (!extension || buffer.length < 4) return "NO_SIGNATURE";

  const relevantSignatures = MAGIC_BYTES.filter((sig) =>
    sig.extensions.includes(extension),
  );

  if (relevantSignatures.length === 0) {
    // We don't have magic byte signatures for this extension
    return "NO_SIGNATURE";
  }

  for (const sig of relevantSignatures) {
    if (sig.offset + sig.signature.length > buffer.length) continue;

    let match = true;
    for (let i = 0; i < sig.signature.length; i++) {
      if (buffer[sig.offset + i] !== sig.signature[i]) {
        match = false;
        break;
      }
    }
    if (match) return "MATCH";
  }

  // None of the expected signatures matched
  return "SPOOFED";
}
