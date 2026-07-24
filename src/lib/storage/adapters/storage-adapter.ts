/**
 * Storage Adapter — abstract interface for hosting-agnostic file storage.
 *
 * This is the NEW formal interface for the storage abstraction layer.
 * It extends the concept of the existing StorageProvider with additional
 * capabilities: signedUrl generation, metadata retrieval, and structured
 * FileMetadata.
 *
 * BACKWARD COMPATIBILITY:
 *   The existing StorageProvider interface (in types.ts) continues to work.
 *   StorageAdapter adds methods that cloud providers (S3, R2, Blob) support
 *   natively but that the local filesystem provider implements with simple
 *   path-based equivalents.
 *
 * ADAPTERS:
 *   - LocalStorageAdapter — local filesystem (default for dev/self-hosted)
 *   - VercelBlobAdapter    — Vercel Blob CDN storage
 *   - S3StorageAdapter     — AWS S3 / Cloudflare R2 / DigitalOcean Spaces / MinIO
 *
 * SWITCHING HOSTING:
 *   Changing storage hosting requires ONLY env var changes:
 *     STORAGE_PROVIDER=local    → local filesystem
 *     STORAGE_PROVIDER=vercel-blob → Vercel Blob
 *     STORAGE_PROVIDER=s3       → any S3-compatible provider
 */

// ---------------------------------------------------------------------------
// Core Interfaces
// ---------------------------------------------------------------------------

/** Metadata for a stored file. */
export interface FileMetadata {
  /** MIME content type (e.g. "application/pdf") */
  contentType?: string;
  /** File size in bytes */
  size?: number;
  /** Original filename from upload */
  originalName?: string;
  /** File extension (e.g. "exe", "pdf") */
  extension?: string;
  /** SHA-256 checksum (hex digest) */
  checksum?: string;
  /** Upload timestamp */
  uploadedAt?: string;
  /** Storage provider that holds this file */
  storageProvider?: string;
  /** Arbitrary extra metadata */
  [key: string]: unknown;
}

/** Result of a successful file upload. */
export interface UploadResult {
  /** Relative storage key (e.g. "resources/1700000000-abc123-driver.exe") */
  key: string;
  /** Public URL (if available — null for local/private storage) */
  url: string | null;
  /** File size in bytes */
  size: number;
  /** MIME content type */
  contentType: string;
  /** SHA-256 checksum (hex digest) */
  checksum?: string;
  /** Original filename from upload */
  originalName?: string;
  /** Storage provider name */
  provider?: string;
}

// ---------------------------------------------------------------------------
// StorageAdapter — the abstract interface
// ---------------------------------------------------------------------------

/**
 * StorageAdapter — hosting-agnostic file storage interface.
 *
 * Every storage backend (local, Vercel Blob, S3, R2, Spaces, MinIO)
 * implements this interface. The factory (storage-factory.ts) selects
 * the active adapter based on STORAGE_PROVIDER env var.
 *
 * Key design principles:
 *   1. upload() returns a storage key — NEVER a public URL as key
 *   2. download() uses the storage key — NEVER the public URL
 *   3. signedUrl() generates temporary access URLs for private files
 *   4. All methods return structured results or throw StorageAdapterError
 */
export interface StorageAdapter {
  /** Adapter name (e.g. "local", "vercel-blob", "s3") */
  readonly name: string;

  /**
   * Upload a file buffer to storage.
   * Returns UploadResult with storage key, size, content type.
   */
  upload(key: string, data: Buffer, metadata?: FileMetadata): Promise<UploadResult>;

  /**
   * Download a file from storage by key.
   * Returns the file Buffer, or null if not found.
   */
  download(key: string): Promise<Buffer | null>;

  /**
   * Delete a file from storage by key.
   * Returns true if the file was deleted, false if not found.
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a file exists in storage by key.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Generate a signed/temporary URL for private file access.
   * For local storage, returns the direct file path/URL.
   * For cloud storage, returns a time-limited signed URL.
   */
  signedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Get metadata for a stored file.
   * Returns null if the file doesn't exist.
   */
  getMetadata(key: string): Promise<FileMetadata | null>;
}

// ---------------------------------------------------------------------------
// Error Classes
// ---------------------------------------------------------------------------

/**
 * StorageAdapterError — structured error for storage operations.
 */
export class StorageAdapterError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "StorageAdapterError";
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
