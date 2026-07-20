/**
 * Local Storage Provider — stores files on the local filesystem.
 *
 * Files are written to `public/uploads/resources/` and served
 * directly or via the Storage Service download API.
 *
 * Storage keys follow the format: /uploads/resources/<timestamp>-<random>-<sanitized-filename>
 */

import type { StorageProvider, UploadResult, DownloadResult } from "./types";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const UPLOAD_DIR = "public/uploads/resources";

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";

  async upload(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    // Ensure upload directory exists
    const absDir = path.join(process.cwd(), UPLOAD_DIR);
    await fs.mkdir(absDir, { recursive: true });

    // Generate unique filename: <timestamp>-<random6>-<sanitized-name>
    const sanitized = sanitizeFileName(originalFileName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${sanitized}`;
    const storageKey = `/uploads/resources/${uniqueName}`;
    const absPath = path.join(process.cwd(), storageKey);

    // Write file
    await fs.writeFile(absPath, buffer);

    return {
      storageKey,
      fileName: uniqueName,
      originalFileName,
      mimeType,
      fileSize: buffer.length,
    };
  }

  async download(storageKey: string): Promise<DownloadResult> {
    // Resolve the absolute path from the storage key
    const absPath = path.join(process.cwd(), "public", storageKey.replace(/^\//, ""));

    // Security: prevent path traversal
    const resolved = path.resolve(absPath);
    const publicDir = path.resolve(path.join(process.cwd(), "public"));
    if (!resolved.startsWith(publicDir)) {
      throw new Error("Access denied: path traversal detected");
    }

    // Read file
    const buffer = await fs.readFile(resolved);

    // Determine MIME type from extension
    const ext = path.extname(storageKey).toLowerCase();
    const mimeType = MIME_FROM_EXT[ext] || "application/octet-stream";

    // Extract original filename from the storage key
    const fileName = path.basename(storageKey);

    return {
      buffer,
      mimeType,
      fileSize: buffer.length,
      fileName,
    };
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const absPath = path.join(process.cwd(), "public", storageKey.replace(/^\//, ""));

      // Security: prevent path traversal
      const resolved = path.resolve(absPath);
      const publicDir = path.resolve(path.join(process.cwd(), "public"));
      if (!resolved.startsWith(publicDir)) {
        return false;
      }

      await fs.unlink(resolved);
      return true;
    } catch {
      return false;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      const absPath = path.join(process.cwd(), "public", storageKey.replace(/^\//, ""));
      await fs.access(absPath);
      return true;
    } catch {
      return false;
    }
  }
}

/** Sanitize a filename to remove dangerous characters */
function sanitizeFileName(name: string): string {
  return name
    .replace(/\0/g, "")
    .replace(/\.\./g, "")
    .replace(/[<>:"|?*\\\/]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+/, "");
}

/** Extension → MIME type mapping */
const MIME_FROM_EXT: Record<string, string> = {
  ".exe": "application/vnd.microsoft.portable-executable",
  ".msi": "application/x-msi",
  ".apk": "application/vnd.android.package-archive",
  ".dmg": "application/x-apple-diskimage",
  ".deb": "application/x-debian-package",
  ".rpm": "application/x-rpm",
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".md": "text/markdown",
  ".bin": "application/octet-stream",
  ".hex": "application/x-hex",
  ".img": "application/x-img",
  ".iso": "application/x-iso9660-image",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".js": "application/javascript",
  ".json": "application/json",
  ".html": "text/html",
  ".css": "text/css",
  ".xml": "application/xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".firmware": "application/octet-stream",
  ".fls": "application/octet-stream",
  ".fw": "application/octet-stream",
};
