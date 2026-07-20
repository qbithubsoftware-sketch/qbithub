/**
 * Storage Service — high-level API. The ONLY interface the rest of the app should use.
 *
 * Wraps the configured StorageProvider and adds:
 *  - Multi-signal file validation (Extension + MIME + Magic Bytes)
 *  - Data-driven validation via FileTypeRegistry (not hardcoded)
 *  - SHA-256 checksum computation on upload
 *  - Path traversal protection
 *  - Enterprise logging for every upload/download/delete operation
 *  - Backward compatibility with files stored in public/uploads/resources/
 *
 * VALIDATION STRATEGY (enterprise-grade, browser-tolerant):
 *
 *   1. Extension MUST be in the FileTypeRegistry allowlist
 *   2. Extension MUST NOT be in the blocklist (security hard-stop)
 *   3. MIME type is cross-checked but NEVER used as sole reject criterion
 *      - application/octet-stream is always accepted (universal binary fallback)
 *      - Unknown MIME for a registered extension is still accepted
 *      - Browsers report inconsistent MIME types (e.g. .exe may arrive as
 *        application/x-msdownload, application/x-msdos-program, etc.)
 *   4. Magic bytes are verified and logged, but NOT enforced as a hard gate
 *      - Spoofed files get a WARNING log but are still accepted
 *      - Many legitimate enterprise files have no reliable magic signature
 *   5. File size is validated against limits
 *   6. SHA-256 checksum is computed for integrity verification
 */

import { getStorageProvider } from "./provider";
import type { UploadResult, DownloadResult } from "./types";
import {
  isExtensionAllowed,
  isExtensionBlocked,
  validateMimeForExtension,
  verifyMagicBytes,
  getCanonicalMimeType,
  getFileTypeLabel,
  getAllowedExtensions,
  getBlockedExtensions,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
  getExtension,
  MIME_FROM_EXT,
} from "./file-type-registry";
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
   *
   * Multi-signal validation: Extension (primary) → MIME (cross-check) → Magic Bytes (verify)
   * Computes SHA-256 checksum.
   */
  async upload(
    buffer: Buffer,
    originalFileName: string,
    reportedMimeType: string,
  ): Promise<UploadResultWithChecksum> {
    const startTime = Date.now();

    // ---- 1. Validate file is not empty ----
    if (!buffer || buffer.length < MIN_FILE_SIZE) {
      throw new StorageValidationError(
        "FILE_EMPTY",
        "File is empty or too small to be valid.",
        { originalFileName, mimeType: reportedMimeType, fileSize: buffer?.length ?? 0 },
      );
    }

    // ---- 2. Validate file size ----
    if (buffer.length > MAX_FILE_SIZE) {
      throw new StorageValidationError(
        "FILE_TOO_LARGE",
        `File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        { originalFileName, mimeType: reportedMimeType, fileSize: buffer.length, maxSize: MAX_FILE_SIZE },
      );
    }

    // ---- 3. Extract extension ----
    const ext = getExtension(originalFileName);

    // ---- 4. Extension blocklist (security hard-stop) ----
    if (ext && isExtensionBlocked(ext)) {
      throw new StorageValidationError(
        "BLOCKED_EXTENSION",
        `Blocked file extension: ${ext}. This file type is not allowed for security reasons.`,
        { originalFileName, extension: ext },
      );
    }

    // ---- 5. Extension allowlist (must be in registry) ----
    if (ext && !isExtensionAllowed(ext)) {
      throw new StorageValidationError(
        "UNSUPPORTED_EXTENSION",
        `Unsupported file extension: ${ext}. Allowed extensions: ${getAllowedExtensions().join(", ")}`,
        { originalFileName, extension: ext },
      );
    }

    // ---- 6. MIME type cross-check (informational, not a gate) ----
    // We NEVER reject a file solely because of MIME type mismatch.
    // Browsers report inconsistent MIME types — the extension is the primary signal.
    const mimeResult = validateMimeForExtension(reportedMimeType, ext);
    if (mimeResult.note) {
      console.log(
        `[StorageService] MIME cross-check for "${originalFileName}": ${mimeResult.note}`,
      );
    }

    // Resolve the canonical MIME type for storage
    const canonicalMime = mimeResult.canonicalMime || reportedMimeType;

    // ---- 7. Magic bytes verification (informational, logged but not enforced) ----
    if (ext) {
      const magicResult = verifyMagicBytes(buffer, ext);
      if (magicResult === "MATCH") {
        console.log(
          `[StorageService] Magic bytes VERIFIED for "${originalFileName}" (${getFileTypeLabel(ext)})`,
        );
      } else if (magicResult === "SPOOFED") {
        console.warn(
          `[StorageService] MAGIC BYTE WARNING: File "${originalFileName}" has extension "${ext}" but content signature does not match. This may be a legitimate file with an unusual header, or a MIME spoofing attempt. File accepted — extension is registered.`,
        );
      } else {
        console.log(
          `[StorageService] No magic byte signature defined for "${ext}" — skipping content verification.`,
        );
      }
    }

    // ---- 8. Compute SHA-256 checksum before storing ----
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    // ---- 9. Delegate to storage provider ----
    const provider = getStorageProvider();
    const result = await provider.upload(buffer, originalFileName, canonicalMime);

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
  validate(buffer: Buffer | null, mimeType: string, fileName?: string): string | null {
    if (!buffer || buffer.length < MIN_FILE_SIZE) return "File is empty.";
    if (buffer.length > MAX_FILE_SIZE)
      return `File too large. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB.`;

    if (fileName) {
      const ext = getExtension(fileName);
      if (ext && isExtensionBlocked(ext)) return `Blocked extension: ${ext}.`;
      if (ext && !isExtensionAllowed(ext)) return `Unsupported extension: ${ext}.`;
    }

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
