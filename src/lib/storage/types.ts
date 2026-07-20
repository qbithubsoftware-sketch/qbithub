/**
 * Storage Service — Type definitions & configuration.
 *
 * Provider-agnostic types for file upload, download, and metadata.
 * All storage providers implement the StorageProvider interface.
 *
 * DESIGN PRINCIPLES:
 *   - Files are NEVER stored in public/ — they go to data/uploads/resources/
 *   - Files are served ONLY through authenticated/authorized API routes
 *   - Storage keys are relative paths, NOT public URLs
 *   - Changing providers requires only changing STORAGE_PROVIDER env var
 */

// ---------------------------------------------------------------------------
// Core interfaces
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
 *
 * Switching providers only requires changing the STORAGE_PROVIDER env var
 * in provider.ts — no UI or API changes needed.
 */
export interface StorageProvider {
  /** Provider name (e.g. "local", "vercel-blob", "s3"). */
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

  /**
   * List all files in storage (for health checking / orphan detection).
   * @returns Array of storage keys
   */
  list?(): Promise<string[]>;
}

// ---------------------------------------------------------------------------
// Allowed MIME types — enterprise resource file support
// ---------------------------------------------------------------------------

/**
 * Supported file types for the Global Resources Library.
 *
 * Maps MIME type → expected file extension.
 * Used for MIME validation on upload.
 *
 * Covers: executables, installers, archives, documents, firmware,
 * images, code, video, and enterprise-specific formats.
 */
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  // Executables & installers
  "application/vnd.microsoft.portable-executable": ".exe",
  "application/x-msi": ".msi",
  "application/x-msdos-program": ".exe", // alternate MIME for .exe
  "application/vnd.android.package-archive": ".apk",
  "application/x-apple-diskimage": ".dmg",
  "application/x-cab": ".cab",

  // Archives
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
  "application/x-rar-compressed": ".rar",
  "application/vnd.rar": ".rar", // alternate MIME for .rar
  "application/x-tar": ".tar",
  "application/gzip": ".gz",
  "application/x-gzip": ".gz", // alternate MIME for .gz
  "application/x-7z-compressed": ".7z",

  // Documents
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/csv": ".csv",
  "text/plain": ".txt",
  "text/markdown": ".md",

  // Firmware & binaries
  "application/octet-stream": ".bin",
  "application/x-hex": ".hex",
  "application/x-img": ".img",
  "application/x-iso9660-image": ".iso",

  // Images
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/bmp": ".bmp",
  "image/tiff": ".tiff",

  // Code & SDK
  "application/javascript": ".js",
  "application/typescript": ".ts",
  "application/json": ".json",
  "text/html": ".html",
  "text/css": ".css",
  "application/xml": ".xml",
  "text/xml": ".xml",
  "text/yaml": ".yaml",
  "application/x-yaml": ".yaml",

  // Video
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/x-msvideo": ".avi",

  // Info files
  "application/x-info": ".inf",
};

/**
 * Extension → MIME type mapping (reverse of ALLOWED_MIME_TYPES).
 * Used for content type detection on download when MIME is not stored.
 */
export const MIME_FROM_EXT: Record<string, string> = {
  // Executables & installers
  ".exe": "application/vnd.microsoft.portable-executable",
  ".msi": "application/x-msi",
  ".cab": "application/x-cab",
  ".apk": "application/vnd.android.package-archive",
  ".dmg": "application/x-apple-diskimage",
  ".ipa": "application/octet-stream",
  // Archives
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  // Documents
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".md": "text/markdown",
  // Firmware & binaries
  ".bin": "application/octet-stream",
  ".hex": "application/x-hex",
  ".img": "application/x-img",
  ".iso": "application/x-iso9660-image",
  ".firmware": "application/octet-stream",
  ".fls": "application/octet-stream",
  ".fw": "application/octet-stream",
  ".inf": "application/x-info",
  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  // Code & SDK
  ".js": "application/javascript",
  ".json": "application/json",
  ".html": "text/html",
  ".css": "text/css",
  ".xml": "application/xml",
  ".yaml": "application/x-yaml",
  ".yml": "application/x-yaml",
  // Video
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
};

// ---------------------------------------------------------------------------
// Size limits
// ---------------------------------------------------------------------------

/** Maximum file size: 100MB (enterprise resources — large firmware, SDKs, ISOs). */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** Minimum file size: 1 byte (reject empty files). */
export const MIN_FILE_SIZE = 1;

// ---------------------------------------------------------------------------
// Allowed extensions (used for extension-based validation)
// ---------------------------------------------------------------------------

/**
 * Set of allowed file extensions.
 * Files with extensions NOT in this set are rejected.
 * This provides defense-in-depth alongside MIME validation.
 */
export const ALLOWED_EXTENSIONS = new Set([
  // Executables & installers
  ".exe", ".msi", ".cab", ".apk", ".ipa", ".dmg",
  // Archives
  ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2",
  // Documents
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".md",
  // Firmware & binaries
  ".bin", ".hex", ".img", ".iso", ".firmware", ".fls", ".fw", ".inf",
  // Images
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".tiff",
  // Code & SDK
  ".js", ".ts", ".json", ".html", ".css", ".xml", ".yaml", ".yml",
  // Video
  ".mp4", ".mov", ".webm", ".avi",
]);

/**
 * Blocked extensions — NEVER allow these even if MIME type is valid.
 * These extensions represent executable scripts that can be directly
 * executed by the OS or runtime, posing severe security risks.
 */
export const BLOCKED_EXTENSIONS = new Set([
  ".bat", ".cmd", ".ps1", ".vbs", ".vbe", ".wsf", ".wsh",
  ".scr", ".pif", ".com", ".hta", ".cpl",
  ".sh", ".bash", ".zsh", ".fish",
  ".php", ".asp", ".aspx", ".jsp", ".cgi",
  ".py", ".rb", ".pl", ".pm",
  ".reg", ".lnk", ".url",
  ".desktop", ".service",
]);

// ---------------------------------------------------------------------------
// Magic bytes signatures for file type verification
// ---------------------------------------------------------------------------

/**
 * Magic byte signatures for common file types.
 * Used to verify that the file content matches the claimed extension.
 * This prevents MIME spoofing — e.g. renaming malware.exe to document.pdf
 */
export const MAGIC_BYTES: Array<{
  /** Offset where the signature appears */
  offset: number;
  /** Byte signature to match */
  signature: number[];
  /** Human-readable name for the file type */
  name: string;
  /** Associated file extensions */
  extensions: string[];
}> = [
  // Archives
  { offset: 0, signature: [0x50, 0x4B, 0x03, 0x04], name: "ZIP archive", extensions: [".zip", ".docx", ".xlsx", ".apk", ".jar"] },
  { offset: 0, signature: [0x52, 0x61, 0x72, 0x21], name: "RAR archive", extensions: [".rar"] },
  { offset: 0, signature: [0x37, 0x7A, 0xBC, 0xAF], name: "7-Zip archive", extensions: [".7z"] },
  { offset: 0, signature: [0x1F, 0x8B], name: "GZIP archive", extensions: [".gz"] },

  // Documents
  { offset: 0, signature: [0x25, 0x50, 0x44, 0x46], name: "PDF document", extensions: [".pdf"] },

  // Images
  { offset: 0, signature: [0xFF, 0xD8, 0xFF], name: "JPEG image", extensions: [".jpg", ".jpeg"] },
  { offset: 0, signature: [0x89, 0x50, 0x4E, 0x47], name: "PNG image", extensions: [".png"] },
  { offset: 0, signature: [0x47, 0x49, 0x46, 0x38], name: "GIF image", extensions: [".gif"] },
  { offset: 0, signature: [0x52, 0x49, 0x46, 0x46], name: "WEBP image", extensions: [".webp"] },
  { offset: 0, signature: [0x42, 0x4D], name: "BMP image", extensions: [".bmp"] },
  { offset: 0, signature: [0x3C, 0x3F, 0x78, 0x6D], name: "SVG/XML", extensions: [".svg", ".xml"] },

  // Executables
  { offset: 0, signature: [0x4D, 0x5A], name: "Windows PE executable", extensions: [".exe", ".dll", ".msi", ".cab"] },

  // Video
  { offset: 0, signature: [0x00, 0x00, 0x00], name: "MP4 video", extensions: [".mp4", ".mov"] },
  { offset: 0, signature: [0x1A, 0x45, 0xDF, 0xA3], name: "MKV/WebM video", extensions: [".webm", ".mkv"] },

  // Android APK (ZIP-based)
  // Already covered by ZIP signature

  // ISO images
  { offset: 0x8001, signature: [0x43, 0x44, 0x30, 0x30, 0x31], name: "ISO image", extensions: [".iso"] },
];

// ---------------------------------------------------------------------------
// Unified filename sanitizer
// ---------------------------------------------------------------------------

/**
 * Sanitize a filename to remove dangerous characters.
 * SINGLE SOURCE OF TRUTH — used by all storage providers and download handlers.
 *
 * Rules:
 *  - Remove null bytes
 *  - Remove path traversal sequences (..)
 *  - Replace OS-reserved characters with underscore
 *  - Collapse multiple underscores
 *  - Remove leading dots (hidden files)
 *  - Limit length to 200 characters
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/\0/g, "")
    .replace(/\.\./g, "")
    .replace(/[<>:"|?*\\\/]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 200);
}

// ---------------------------------------------------------------------------
// Extension helper
// ---------------------------------------------------------------------------

/** Get the lowercase file extension including the dot. Returns "" if no extension. */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}
