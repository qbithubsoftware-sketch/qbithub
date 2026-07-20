/**
 * Enterprise File Type Registry — SINGLE SOURCE OF TRUTH for file validation.
 *
 * DESIGN PRINCIPLES:
 *   1. Extension is the PRIMARY signal (user chose the file, OS assigns extension)
 *   2. MIME type is a CROSS-CHECK (browsers report inconsistent MIME types)
 *   3. Magic bytes are VERIFICATION (file content matches claimed type)
 *   4. NEVER reject a file because the browser reported an unexpected MIME type
 *   5. Adding a new file type = adding ONE entry to this registry
 *
 * VALIDATION STRATEGY:
 *   - Extension MUST be in the allowlist (defense-in-depth)
 *   - Extension MUST NOT be in the blocklist (security)
 *   - MIME type is ACCEPTED if it's ANY of the known MIME types for that extension,
 *     OR if it's application/octet-stream (universal binary fallback)
 *   - Magic bytes are checked but NOT enforced (log warning on mismatch only)
 *
 * BROWSER MIME INCONSISTENCY:
 *   Different browsers and OSes report different MIME types for the same file.
 *   For example, .exe may arrive as:
 *     - application/x-msdownload          (Chrome on Windows)
 *     - application/x-msdos-program       (Firefox on Linux)
 *     - application/vnd.microsoft.portable-executable  (some browsers)
 *     - application/octet-stream           (generic fallback)
 *     - application/x-dosexec             (some Linux distros)
 *
 *   The registry lists ALL known MIME variants per extension.
 *   If the browser reports an unknown MIME for a known extension, we STILL accept
 *   the file — the extension and magic bytes provide sufficient validation.
 */

// ---------------------------------------------------------------------------
// File Type Definition
// ---------------------------------------------------------------------------

/**
 * A single file type entry in the registry.
 * Each entry defines the validation rules for one file extension.
 */
export interface FileTypeEntry {
  /** File extension including dot (e.g. ".exe") */
  extension: string;
  /** Human-readable name for display and error messages */
  label: string;
  /** Category for grouping in the UI */
  category: "windows" | "firmware" | "android" | "archive" | "document" | "image" | "video" | "code" | "data";
  /**
   * ALL known MIME types for this extension.
   * Includes browser-specific and OS-specific variants.
   * The FIRST entry is the "canonical" MIME type used for downloads.
   */
  mimeTypes: string[];
  /**
   * Magic byte signatures for this file type.
   * Multiple signatures are OR'd (any match = pass).
   * If empty, magic bytes check returns "NO_SIGNATURE" (not enforced).
   */
  magicBytes?: MagicByteSignature[];
  /** Maximum file size override in bytes (null = use global MAX_FILE_SIZE) */
  maxSize?: number;
}

/**
 * Magic byte signature for file content verification.
 */
export interface MagicByteSignature {
  /** Offset where the signature appears (default: 0) */
  offset: number;
  /** Byte signature to match */
  signature: number[];
  /** Human-readable name for the signature */
  name: string;
}

// ---------------------------------------------------------------------------
// Enterprise File Type Registry
// ---------------------------------------------------------------------------

/**
 * COMPLETE file type registry for the Global Resources Library.
 *
 * Adding a new file type:
 *   1. Add a FileTypeEntry to this array
 *   2. That's it — validation, MIME mapping, and download content-type
 *      are all derived from this single entry.
 */
export const FILE_TYPE_REGISTRY: FileTypeEntry[] = [
  // ===================================================================
  // WINDOWS — Drivers, Installers, System Files
  // ===================================================================
  {
    extension: ".exe",
    label: "Windows Executable",
    category: "windows",
    mimeTypes: [
      "application/vnd.microsoft.portable-executable",  // IANA standard
      "application/x-msdownload",                        // Chrome on Windows
      "application/x-msdos-program",                     // Firefox on Linux
      "application/x-dosexec",                           // Some Linux distros
      "application/x-winexe",                            // Older browsers
      "application/x-executable",                        // Generic Unix
      "application/octet-stream",                        // Universal fallback
    ],
    magicBytes: [
      { offset: 0, signature: [0x4D, 0x5A], name: "MZ header (Windows PE)" },
    ],
  },
  {
    extension: ".msi",
    label: "Windows Installer Package",
    category: "windows",
    mimeTypes: [
      "application/x-msi",
      "application/x-ole-storage",                       // MSI is OLE compound doc
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0xD0, 0xCF, 0x11, 0xE0], name: "OLE Compound Document (MSI)" },
      // MSI files are also PE format sometimes — MZ header
      { offset: 0, signature: [0x4D, 0x5A], name: "MZ header (Windows PE)" },
    ],
  },
  {
    extension: ".cab",
    label: "Windows Cabinet Archive",
    category: "windows",
    mimeTypes: [
      "application/x-cab",
      "application/vnd.ms-cab-compressed",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x4D, 0x53, 0x43, 0x46], name: "MSCF header (CAB)" },
    ],
  },
  {
    extension: ".inf",
    label: "Windows Driver Information File",
    category: "windows",
    mimeTypes: [
      "application/x-info",
      "text/plain",                                      // INF files are text
      "application/octet-stream",
    ],
    // No magic bytes — INF files are plain text with variable content
  },
  {
    extension: ".sys",
    label: "Windows System Driver File",
    category: "windows",
    mimeTypes: [
      "application/x-msdownload",                        // Same as .exe in browsers
      "application/vnd.microsoft.portable-executable",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x4D, 0x5A], name: "MZ header (Windows PE)" },
    ],
  },
  {
    extension: ".cat",
    label: "Windows Security Catalog",
    category: "windows",
    mimeTypes: [
      "application/vnd.ms-pki.seccat",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x30], name: "ASN.1 SEQUENCE (CAT)" },
    ],
  },

  // ===================================================================
  // FIRMWARE — Binary, Hex, Disk Images
  // ===================================================================
  {
    extension: ".bin",
    label: "Binary Firmware File",
    category: "firmware",
    mimeTypes: [
      "application/octet-stream",
    ],
    // No reliable magic bytes — binary firmware has arbitrary formats
  },
  {
    extension: ".hex",
    label: "Intel HEX Firmware File",
    category: "firmware",
    mimeTypes: [
      "application/x-hex",
      "text/plain",                                      // HEX files are text
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x3A], name: "Intel HEX start code (:)" },
    ],
  },
  {
    extension: ".img",
    label: "Disk Image",
    category: "firmware",
    mimeTypes: [
      "application/x-img",
      "application/octet-stream",
    ],
    // No reliable magic bytes — IMG files vary by format
  },
  {
    extension: ".iso",
    label: "ISO Disk Image",
    category: "firmware",
    mimeTypes: [
      "application/x-iso9660-image",
      "application/x-cd-image",                          // Some browsers
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0x8001, signature: [0x43, 0x44, 0x30, 0x30, 0x31], name: "CD001 (ISO 9660)" },
    ],
  },

  // ===================================================================
  // ANDROID — APK, AAB
  // ===================================================================
  {
    extension: ".apk",
    label: "Android Package",
    category: "android",
    mimeTypes: [
      "application/vnd.android.package-archive",
      "application/x-android-apk",                       // Some browsers
      "application/java-archive",                        // Firefox sometimes
      "application/zip",                                 // APK is ZIP-based
      "application/x-zip-compressed",                    // Chrome sometimes
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x50, 0x4B, 0x03, 0x04], name: "ZIP header (APK)" },
    ],
  },
  {
    extension: ".aab",
    label: "Android App Bundle",
    category: "android",
    mimeTypes: [
      "application/x-android-aab",
      "application/zip",                                 // AAB is ZIP-based
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x50, 0x4B, 0x03, 0x04], name: "ZIP header (AAB)" },
    ],
  },

  // ===================================================================
  // ARCHIVES — ZIP, RAR, 7Z, TAR.GZ
  // ===================================================================
  {
    extension: ".zip",
    label: "ZIP Archive",
    category: "archive",
    mimeTypes: [
      "application/zip",
      "application/x-zip-compressed",                    // Windows/Chrome
      "application/x-zip",                               // Some browsers
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x50, 0x4B, 0x03, 0x04], name: "ZIP header" },
    ],
  },
  {
    extension: ".rar",
    label: "RAR Archive",
    category: "archive",
    mimeTypes: [
      "application/x-rar-compressed",
      "application/vnd.rar",                             // Some browsers
      "application/x-rar",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x52, 0x61, 0x72, 0x21], name: "RAR header" },
    ],
  },
  {
    extension: ".7z",
    label: "7-Zip Archive",
    category: "archive",
    mimeTypes: [
      "application/x-7z-compressed",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], name: "7Z header" },
    ],
  },
  {
    extension: ".gz",
    label: "GZIP Archive",
    category: "archive",
    mimeTypes: [
      "application/gzip",
      "application/x-gzip",                              // Some browsers
      "application/x-gunzip",                            // Rare
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x1F, 0x8B], name: "GZIP header" },
    ],
  },
  {
    extension: ".tar",
    label: "TAR Archive",
    category: "archive",
    mimeTypes: [
      "application/x-tar",
      "application/gzip",                                // Often .tar.gz
      "application/octet-stream",
    ],
    // TAR magic is at offset 257 — not reliable for all variants
    magicBytes: [
      { offset: 257, signature: [0x75, 0x73, 0x74, 0x61, 0x72], name: "ustar (TAR)" },
    ],
  },

  // ===================================================================
  // DOCUMENTS — PDF, Office, Text
  // ===================================================================
  {
    extension: ".pdf",
    label: "PDF Document",
    category: "document",
    mimeTypes: [
      "application/pdf",
      "application/x-pdf",                               // Rare
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x25, 0x50, 0x44, 0x46], name: "PDF header (%PDF)" },
    ],
  },
  {
    extension: ".docx",
    label: "Microsoft Word Document",
    category: "document",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",                                 // DOCX is ZIP-based
      "application/x-zip-compressed",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x50, 0x4B, 0x03, 0x04], name: "ZIP header (DOCX)" },
    ],
  },
  {
    extension: ".xlsx",
    label: "Microsoft Excel Spreadsheet",
    category: "document",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",                                 // XLSX is ZIP-based
      "application/x-zip-compressed",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x50, 0x4B, 0x03, 0x04], name: "ZIP header (XLSX)" },
    ],
  },
  {
    extension: ".csv",
    label: "CSV Spreadsheet",
    category: "document",
    mimeTypes: [
      "text/csv",
      "text/plain",                                      // Some browsers
      "application/vnd.ms-excel",                        // Windows
      "application/octet-stream",
    ],
    // No reliable magic bytes — CSV is plain text
  },
  {
    extension: ".txt",
    label: "Plain Text File",
    category: "document",
    mimeTypes: [
      "text/plain",
      "application/octet-stream",
    ],
    // No reliable magic bytes — text files vary
  },
  {
    extension: ".xml",
    label: "XML Document",
    category: "document",
    mimeTypes: [
      "application/xml",
      "text/xml",                                        // Some browsers
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x3C, 0x3F, 0x78, 0x6D], name: "XML declaration (<?xml)" },
    ],
  },
  {
    extension: ".json",
    label: "JSON Data File",
    category: "data",
    mimeTypes: [
      "application/json",
      "text/plain",                                      // Some browsers
      "application/octet-stream",
    ],
    // No reliable magic bytes — JSON starts with { or [
  },

  // ===================================================================
  // IMAGES — PNG, JPEG, WebP, SVG
  // ===================================================================
  {
    extension: ".png",
    label: "PNG Image",
    category: "image",
    mimeTypes: [
      "image/png",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], name: "PNG header" },
    ],
  },
  {
    extension: ".jpg",
    label: "JPEG Image",
    category: "image",
    mimeTypes: [
      "image/jpeg",
      "image/pjpeg",                                     // IE/Edge legacy
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0xFF, 0xD8, 0xFF], name: "JPEG header" },
    ],
  },
  {
    extension: ".jpeg",
    label: "JPEG Image",
    category: "image",
    mimeTypes: [
      "image/jpeg",
      "image/pjpeg",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0xFF, 0xD8, 0xFF], name: "JPEG header" },
    ],
  },
  {
    extension: ".webp",
    label: "WebP Image",
    category: "image",
    mimeTypes: [
      "image/webp",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x52, 0x49, 0x46, 0x46], name: "RIFF header (WebP)" },
    ],
  },
  {
    extension: ".svg",
    label: "SVG Image",
    category: "image",
    mimeTypes: [
      "image/svg+xml",
      "application/xml",                                 // Some browsers
      "text/xml",
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 0, signature: [0x3C, 0x3F, 0x78, 0x6D], name: "XML declaration (SVG)" },
      { offset: 0, signature: [0x3C, 0x73, 0x76, 0x67], name: "SVG tag (<svg)" },
    ],
  },

  // ===================================================================
  // VIDEOS — MP4, MOV
  // ===================================================================
  {
    extension: ".mp4",
    label: "MP4 Video",
    category: "video",
    mimeTypes: [
      "video/mp4",
      "application/mp4",                                 // Some browsers
      "application/octet-stream",
    ],
    magicBytes: [
      // ftyp box at offset 4 — multiple brands possible
      { offset: 0, signature: [0x00, 0x00, 0x00], name: "MP4 ftyp box" },
      { offset: 4, signature: [0x66, 0x74, 0x79, 0x70], name: "ftyp marker (MP4)" },
    ],
  },
  {
    extension: ".mov",
    label: "QuickTime Video",
    category: "video",
    mimeTypes: [
      "video/quicktime",
      "video/mp4",                                       // Some browsers
      "application/octet-stream",
    ],
    magicBytes: [
      { offset: 4, signature: [0x6D, 0x6F, 0x6F, 0x76], name: "moov atom (MOV)" },
      { offset: 4, signature: [0x6D, 0x64, 0x61, 0x74], name: "mdat atom (MOV)" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Derived lookup structures (built once at module load)
// ---------------------------------------------------------------------------

/** Extension → FileTypeEntry (fast lookup) */
const byExtension = new Map<string, FileTypeEntry>();

/** MIME type → FileTypeEntry[] (one MIME can map to multiple extensions) */
const byMimeType = new Map<string, FileTypeEntry[]>();

/** Set of all allowed extensions */
const allowedExtensions = new Set<string>();

/** Build the lookup structures from the registry */
function buildLookups(): void {
  for (const entry of FILE_TYPE_REGISTRY) {
    byExtension.set(entry.extension, entry);
    allowedExtensions.add(entry.extension);

    for (const mime of entry.mimeTypes) {
      const existing = byMimeType.get(mime) ?? [];
      existing.push(entry);
      byMimeType.set(mime, existing);
    }
  }
}

// Build on module load
buildLookups();

// ---------------------------------------------------------------------------
// Blocked extensions — security hard-stop
// ---------------------------------------------------------------------------

/**
 * Extensions that are ALWAYS blocked regardless of MIME or magic bytes.
 * These are directly executable scripts that pose severe security risks.
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
// Size limits
// ---------------------------------------------------------------------------

/** Maximum file size: 100MB (enterprise resources — large firmware, SDKs, ISOs). */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** Minimum file size: 1 byte (reject empty files). */
export const MIN_FILE_SIZE = 1;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up a file type by its extension.
 * Returns the FileTypeEntry or undefined if the extension is not in the registry.
 */
export function getFileTypeByExtension(ext: string): FileTypeEntry | undefined {
  return byExtension.get(ext);
}

/**
 * Check if a file extension is allowed.
 */
export function isExtensionAllowed(ext: string): boolean {
  return allowedExtensions.has(ext);
}

/**
 * Check if a file extension is blocked (security hard-stop).
 */
export function isExtensionBlocked(ext: string): boolean {
  return BLOCKED_EXTENSIONS.has(ext);
}

/**
 * Validate a MIME type against the registry for a given extension.
 *
 * Returns:
 *   - { valid: true } if the MIME type is known for this extension
 *   - { valid: true, note: "..." } if MIME is application/octet-stream (universal fallback)
 *   - { valid: true, note: "..." } if MIME is unknown but extension is registered
 *   - { valid: false } if extension is not in registry at all
 *
 * IMPORTANT: We NEVER reject a file solely because of MIME type mismatch.
 * If the extension is registered, we accept the file regardless of what
 * MIME the browser reports. The MIME type is informational, not a gate.
 */
export function validateMimeForExtension(
  mimeType: string,
  ext: string,
): { valid: boolean; note?: string; canonicalMime?: string } {
  const entry = byExtension.get(ext);
  if (!entry) {
    return { valid: false, note: `Extension "${ext}" is not in the registry` };
  }

  // application/octet-stream is always accepted for any registered extension
  if (mimeType === "application/octet-stream") {
    return { valid: true, note: "octet-stream fallback accepted", canonicalMime: entry.mimeTypes[0] };
  }

  // Check if the reported MIME is one of the known variants for this extension
  if (entry.mimeTypes.includes(mimeType)) {
    return { valid: true, canonicalMime: entry.mimeTypes[0] };
  }

  // Extension is registered but MIME is unknown — still accept.
  // Browsers are inconsistent; we trust the extension + magic bytes.
  return {
    valid: true,
    note: `MIME "${mimeType}" not in known variants for ${ext}, but extension is registered. Accepting based on extension.`,
    canonicalMime: entry.mimeTypes[0],
  };
}

/**
 * Verify magic bytes for a given extension.
 *
 * Returns:
 *   - "MATCH" if any magic byte signature matches
 *   - "NO_SIGNATURE" if no signatures are defined for this extension
 *   - "SPOOFED" if signatures exist but none match
 */
export function verifyMagicBytes(buffer: Buffer, ext: string): "MATCH" | "NO_SIGNATURE" | "SPOOFED" {
  const entry = byExtension.get(ext);
  if (!entry || !entry.magicBytes || entry.magicBytes.length === 0) {
    return "NO_SIGNATURE";
  }

  if (buffer.length < 4) return "NO_SIGNATURE";

  for (const sig of entry.magicBytes) {
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

  return "SPOOFED";
}

/**
 * Get the canonical MIME type for a given extension.
 * Returns "application/octet-stream" as fallback.
 */
export function getCanonicalMimeType(ext: string): string {
  const entry = byExtension.get(ext);
  return entry?.mimeTypes[0] ?? "application/octet-stream";
}

/**
 * Get the FileTypeEntry label for a given extension.
 */
export function getFileTypeLabel(ext: string): string {
  return byExtension.get(ext)?.label ?? "Unknown file type";
}

/**
 * Get all allowed extensions as a sorted array.
 */
export function getAllowedExtensions(): string[] {
  return [...allowedExtensions].sort();
}

/**
 * Get all blocked extensions as a sorted array.
 */
export function getBlockedExtensions(): string[] {
  return [...BLOCKED_EXTENSIONS].sort();
}

/**
 * Get all known MIME types across all file types.
 * Used for backward compatibility with the old ALLOWED_MIME_TYPES map.
 */
export function getAllMimeTypes(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of FILE_TYPE_REGISTRY) {
    for (const mime of entry.mimeTypes) {
      result[mime] = entry.extension;
    }
  }
  return result;
}

/**
 * Extension → canonical MIME type mapping.
 * Used for content type detection on download.
 */
export const MIME_FROM_EXT: Record<string, string> = (() => {
  const result: Record<string, string> = {};
  for (const entry of FILE_TYPE_REGISTRY) {
    result[entry.extension] = entry.mimeTypes[0];
  }
  return result;
})();

// ---------------------------------------------------------------------------
// Backward compatibility aliases
// ---------------------------------------------------------------------------

/**
 * @deprecated Use the FileTypeRegistry API instead.
 * Kept for backward compatibility with code that still imports this.
 */
export const ALLOWED_MIME_TYPES = getAllMimeTypes();

/**
 * @deprecated Use isExtensionAllowed() instead.
 */
export const ALLOWED_EXTENSIONS = allowedExtensions;

/**
 * @deprecated Use getFileTypeByExtension().magicBytes instead.
 * Kept for backward compatibility with the old MAGIC_BYTES array.
 */
export const MAGIC_BYTES: Array<{
  offset: number;
  signature: number[];
  name: string;
  extensions: string[];
}> = (() => {
  const result: typeof MAGIC_BYTES = [];
  for (const entry of FILE_TYPE_REGISTRY) {
    if (entry.magicBytes) {
      for (const sig of entry.magicBytes) {
        // Check if we already have this signature for these extensions
        const existing = result.find(
          (r) => r.offset === sig.offset &&
                 r.signature.length === sig.signature.length &&
                 r.signature.every((b, i) => b === sig.signature[i]),
        );
        if (existing) {
          // Add this extension to the existing entry
          if (!existing.extensions.includes(entry.extension)) {
            existing.extensions.push(entry.extension);
          }
        } else {
          result.push({
            offset: sig.offset,
            signature: sig.signature,
            name: sig.name,
            extensions: [entry.extension],
          });
        }
      }
    }
  }
  return result;
})();

// ---------------------------------------------------------------------------
// Filename sanitizer (unchanged — single source of truth)
// ---------------------------------------------------------------------------

/**
 * Sanitize a filename to remove dangerous characters.
 * SINGLE SOURCE OF TRUTH — used by all storage providers and download handlers.
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
