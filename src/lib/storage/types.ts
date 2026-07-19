/**
 * Storage Service — Type definitions.
 *
 * Provider-agnostic types for file upload, download, and metadata.
 * All storage providers implement the StorageProvider interface.
 */

/** Result of a successful file upload. */
export interface UploadResult {
  /** Relative storage key (e.g. "/uploads/resources/1700000000-abc123-driver.exe"). */
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
 *   - LocalStorageProvider (writes to public/uploads/resources/)
 *   - Future: SupabaseStorageProvider, S3StorageProvider, CloudflareR2Provider, etc.
 *
 * Switching providers only requires changing the STORAGE_PROVIDER env var
 * in provider.ts — no UI or API changes needed.
 */
export interface StorageProvider {
  /** Provider name (e.g. "local", "supabase", "s3"). */
  readonly name: string;

  /**
   * Upload a file to storage.
   * @param buffer — File contents
   * @param originalFileName — User's original filename
   * @param mimeType — File MIME type
   * @returns Upload result with storageKey + metadata
   */
  upload(buffer: Buffer, originalFileName: string, mimeType: string): Promise<UploadResult>;

  /**
   * Download/read a file from storage.
   * @param storageKey — Relative storage key returned by upload()
   * @returns Download result with buffer + metadata
   */
  download(storageKey: string): Promise<DownloadResult>;

  /**
   * Delete a file from storage.
   * @param storageKey — Relative storage key
   * @returns true if file was deleted, false if file didn't exist
   */
  delete(storageKey: string): Promise<boolean>;

  /**
   * Check if a file exists in storage.
   * @param storageKey — Relative storage key
   */
  exists(storageKey: string): Promise<boolean>;
}

/** Supported file types for the Global Resources Library. */
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  // Executables & installers
  "application/vnd.microsoft.portable-executable": ".exe",
  "application/x-msi": ".msi",
  "application/vnd.android.package-archive": ".apk",
  // Archives
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
  "application/x-rar-compressed": ".rar",
  "application/x-tar": ".tar",
  "application/gzip": ".gz",
  "application/x-7z-compressed": ".7z",
  // Documents
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/csv": ".csv",
  "text/plain": ".txt",
  // Firmware & binaries
  "application/octet-stream": ".bin",
  "application/x-hex": ".hex",
  "application/x-img": ".img",
  "application/iso": ".iso",
  // Images (for thumbnails, brochures)
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  // Code & SDK
  "application/javascript": ".js",
  "application/typescript": ".ts",
  "application/json": ".json",
  "text/html": ".html",
  "text/css": ".css",
  "application/xml": ".xml",
  // Video (rare — usually YouTube links, but support direct upload too)
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

/** Maximum file size: 50MB (resources can be large — drivers, firmware, SDKs). */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Minimum file size: 1 byte (reject empty files). */
export const MIN_FILE_SIZE = 1;
