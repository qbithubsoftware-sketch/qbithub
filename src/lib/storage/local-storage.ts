/**
 * Local Storage Provider — stores files on the local filesystem.
 *
 * ARCHITECTURE:
 *   Files are stored OUTSIDE the public/ directory for security:
 *     1. Files are NOT directly accessible via URL
 *     2. All downloads MUST go through the API route (authenticated, counted, logged)
 *     3. No bypass of RBAC or download counting
 *
 * HOSTING-AGNOSTIC DIRECTORY DETECTION:
 *   This provider automatically detects the appropriate writable directory:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Environment          │ Writable Directory                    │
 *   ├──────────────────────┼───────────────────────────────────────┤
 *   │ VPS / Docker / Bare  │ <cwd>/data/uploads/resources/        │
 *   │ Metal / Shared Host  │ (persistent across restarts)          │
 *   ├──────────────────────┼───────────────────────────────────────┤
 *   │ Vercel / AWS Lambda  │ /tmp/qbit-uploads/resources/         │
 *   │ / Serverless         │ (ephemeral — use cloud provider for  │
 *   │                      │  production persistence)              │
 *   └──────────────────────┴───────────────────────────────────────┘
 *
 *   On serverless platforms (Vercel, AWS Lambda, etc.), the filesystem
 *   is READ-ONLY except /tmp. This provider detects the read-only FS
 *   and automatically falls back to /tmp.
 *
 *   IMPORTANT: On serverless, files in /tmp are EPHEMERAL — they don't
 *   persist across cold starts. For production on serverless, use a
 *   persistent provider (vercel-blob, S3, Cloudflare R2, etc.).
 *   On VPS/Docker/bare metal, data/ persists across restarts.
 *
 * Storage keys: resources/<timestamp>-<random6>-<sanitized-filename>
 *
 * MIGRATION NOTE:
 *   Files previously stored in public/uploads/resources/ continue to work
 *   because the download handler checks all known locations.
 */

import type { StorageProvider, UploadResult, DownloadResult } from "./types";
import { MIME_FROM_EXT, sanitizeFileName, getExtension } from "./types";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Writable directory detection
// ---------------------------------------------------------------------------

/** Detected base directory for file storage (lazily initialized) */
let _resolvedBaseDir: string | null = null;

/**
 * Detect the appropriate writable base directory for the current environment.
 *
 * Priority:
 *  1. UPLOAD_DIR env var (explicit override — highest priority)
 *  2. <cwd>/data/uploads/ (VPS / Docker / bare metal — persistent)
 *  3. /tmp/qbit-uploads/ (serverless — Vercel / Lambda — ephemeral but writable)
 *
 * The function tests writability by creating a temp file and deleting it.
 */
async function detectWritableBaseDir(): Promise<string> {
  if (_resolvedBaseDir) return _resolvedBaseDir;

  // 1. Explicit override via env var
  const envDir = process.env.UPLOAD_DIR;
  if (envDir) {
    const abs = path.isAbsolute(envDir) ? envDir : path.join(process.cwd(), envDir);
    if (await isWritableDir(abs)) {
      _resolvedBaseDir = abs;
      console.log(`[LocalStorage] Upload directory (env override): ${abs}`);
      return abs;
    }
    console.warn(`[LocalStorage] UPLOAD_DIR="${abs}" is not writable, falling back.`);
  }

  // 2. Default: <cwd>/data/uploads/ (persistent on VPS/Docker)
  const defaultDir = path.join(process.cwd(), "data", "uploads");
  if (await isWritableDir(defaultDir)) {
    _resolvedBaseDir = defaultDir;
    console.log(`[LocalStorage] Upload directory (persistent): ${defaultDir}`);
    return defaultDir;
  }

  // 3. Fallback: /tmp/qbit-uploads/ (writable on serverless)
  const tmpDir = path.join("/tmp", "qbit-uploads");
  if (await isWritableDir(tmpDir)) {
    _resolvedBaseDir = tmpDir;
    console.log(`[LocalStorage] Upload directory (serverless /tmp): ${tmpDir}`);
    return tmpDir;
  }

  // 4. Last resort: try home dir
  const homeDir = process.env.HOME || process.env.USERPROFILE || "/tmp";
  const fallbackDir = path.join(homeDir, ".qbit-uploads");
  _resolvedBaseDir = fallbackDir;
  console.warn(`[LocalStorage] No standard writable directory found. Using: ${fallbackDir}`);
  return fallbackDir;
}

/**
 * Test if a directory is writable by creating and deleting a temp file.
 * Creates the directory if it doesn't exist.
 */
async function isWritableDir(dirPath: string): Promise<boolean> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    const testFile = path.join(dirPath, `.write-test-${Date.now()}.tmp`);
    await fs.writeFile(testFile, Buffer.from("writable-check"));
    await fs.unlink(testFile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset the cached base directory (for testing).
 */
export function resetBaseDir(): void {
  _resolvedBaseDir = null;
}

// ---------------------------------------------------------------------------
// LocalStorageProvider
// ---------------------------------------------------------------------------

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";

  async upload(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    // Resolve the writable base directory (auto-detects environment)
    const baseDir = await detectWritableBaseDir();
    const resourceDir = path.join(baseDir, "resources");

    // Ensure upload directory exists
    await fs.mkdir(resourceDir, { recursive: true });

    // Generate unique filename: <timestamp>-<random6>-<sanitized-name>
    const sanitized = sanitizeFileName(originalFileName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${sanitized}`;
    const storageKey = `resources/${uniqueName}`;
    const absPath = path.join(resourceDir, uniqueName);

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
    const absPath = await this.resolvePath(storageKey);

    // Security: prevent path traversal
    const resolved = path.resolve(absPath);
    const baseDir = await detectWritableBaseDir();
    const allowedDirs = [
      path.resolve(baseDir),
      path.resolve(path.join(process.cwd(), "data", "uploads")),
      path.resolve(path.join(process.cwd(), "public", "uploads")),
      "/tmp/qbit-uploads",
    ];
    const isAllowed = allowedDirs.some((d) => resolved.startsWith(d));
    if (!isAllowed) {
      throw new Error("Access denied: path traversal detected");
    }

    // Read file
    const buffer = await fs.readFile(resolved);

    // Determine MIME type from extension
    const ext = getExtension(storageKey);
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
      const absPath = await this.resolvePath(storageKey);

      // Security: prevent path traversal
      const resolved = path.resolve(absPath);
      const baseDir = await detectWritableBaseDir();
      const allowedDirs = [
        path.resolve(baseDir),
        path.resolve(path.join(process.cwd(), "data", "uploads")),
        path.resolve(path.join(process.cwd(), "public", "uploads")),
        "/tmp/qbit-uploads",
      ];
      const isAllowed = allowedDirs.some((d) => resolved.startsWith(d));
      if (!isAllowed) {
        return false;
      }

      await fs.unlink(resolved);
      return true;
    } catch {
      return false;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const candidates = await this.getAllPossiblePaths(storageKey);
    for (const p of candidates) {
      try {
        await fs.access(p);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  async list(): Promise<string[]> {
    const baseDir = await detectWritableBaseDir();
    try {
      const resourceDir = path.join(baseDir, "resources");
      const files = await fs.readdir(resourceDir);
      return files.map((f) => `resources/${f}`);
    } catch {
      return [];
    }
  }

  /**
   * Resolve a storage key to an absolute filesystem path.
   * Tries all known locations in order:
   *   1. Auto-detected base dir (data/uploads or /tmp/qbit-uploads)
   *   2. <cwd>/data/uploads/ (VPS persistent)
   *   3. <cwd>/public/uploads/ (legacy — backward compatibility)
   *   4. /tmp/qbit-uploads/ (serverless)
   *
   * Throws ENOENT if file not found in any location.
   */
  private async resolvePath(storageKey: string): Promise<string> {
    const candidates = await this.getAllPossiblePaths(storageKey);

    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }

    // File not found in any location — throw with helpful message
    throw new Error(
      `File not found: "${storageKey}". Searched: ${candidates.join(", ")}`,
    );
  }

  /**
   * Get all possible filesystem paths for a storage key.
   * Used for exists() checking and resolvePath() fallback.
   */
  private async getAllPossiblePaths(storageKey: string): Promise<string[]> {
    // Normalize the storage key (remove leading slash)
    const normalizedKey = storageKey.replace(/^\//, "");
    // Strip "uploads/" prefix if present (legacy format: /uploads/resources/file.exe)
    const strippedKey = normalizedKey.replace(/^uploads\//, "");

    const baseDir = await detectWritableBaseDir();

    return [
      // 1. Auto-detected base dir (primary)
      path.join(baseDir, strippedKey),
      // 2. <cwd>/data/uploads/ (VPS persistent — in case auto-detect resolved differently)
      path.join(process.cwd(), "data", "uploads", strippedKey),
      // 3. <cwd>/public/uploads/ (legacy — backward compatibility)
      path.join(process.cwd(), "public", "uploads", strippedKey),
      // 4. /tmp/qbit-uploads/ (serverless — in case we're on Vercel)
      path.join("/tmp", "qbit-uploads", strippedKey),
    ];
  }
}
