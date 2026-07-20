/**
 * Storage Service — Type definitions.
 *
 * RE-EXPORTS from file-type-registry.ts for backward compatibility.
 * All validation logic and configuration now lives in the FileTypeRegistry.
 *
 * If you're importing ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, BLOCKED_EXTENSIONS,
 * MAGIC_BYTES, sanitizeFileName, getExtension, etc. — your code still works.
 *
 * For NEW code, prefer importing directly from file-type-registry.ts:
 *   import { isExtensionAllowed, validateMimeForExtension, ... } from "./file-type-registry";
 */

// ---------------------------------------------------------------------------
// Core interfaces — still defined here (not validation-related)
// ---------------------------------------------------------------------------

/** Result of a successful file upload. */
export interface UploadResult {
  /** Relative storage key (e.g. "resources/1700000000-abc123-driver.exe"). */
  storageKey: string;
  /** Generated unique filename on disk. */
  fileName: string;
  /** Original filename from the user's upload. */
  originalFileName: string;
  /** MIME type of the file. */
  mimeType: string;
  /** File size in bytes. */
  fileSize: number;
}

/** Result of a successful file download/read. */
export interface DownloadResult {
  /** File contents as a Buffer. */
  buffer: Buffer;
  /** MIME type. */
  mimeType: string;
  /** File size in bytes. */
  fileSize: number;
  /** Original filename (for Content-Disposition header). */
  fileName: string;
}

/** Metadata for a stored file. */
export interface FileMetadata {
  storageKey: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
}

/**
 * StorageProvider — abstract interface for file storage backends.
 *
 * Implementations:
 *   - LocalStorageProvider (writes to data/uploads/resources/ — NOT public/)
 *   - VercelBlobStorageProvider (Vercel Blob, CDN-backed)
 *   - Future: S3StorageProvider, CloudflareR2Provider, etc.
 */
export interface StorageProvider {
  /** Provider name (e.g. "local", "vercel-blob", "s3"). */
  readonly name: string;

  upload(buffer: Buffer, originalFileName: string, mimeType: string): Promise<UploadResult>;
  download(storageKey: string): Promise<DownloadResult>;
  delete(storageKey: string): Promise<boolean>;
  exists(storageKey: string): Promise<boolean>;
  list?(): Promise<string[]>;
}

// ---------------------------------------------------------------------------
// Re-exports from FileTypeRegistry for backward compatibility
// ---------------------------------------------------------------------------

export {
  // Validation functions (new — prefer these)
  isExtensionAllowed,
  isExtensionBlocked,
  validateMimeForExtension,
  verifyMagicBytes,
  getCanonicalMimeType,
  getFileTypeLabel,
  getAllowedExtensions,
  getBlockedExtensions,
  getAllMimeTypes,

  // Constants
  FILE_TYPE_REGISTRY,
  BLOCKED_EXTENSIONS,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAGIC_BYTES,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
  MIME_FROM_EXT,

  // Utility functions
  sanitizeFileName,
  getExtension,
} from "./file-type-registry";
