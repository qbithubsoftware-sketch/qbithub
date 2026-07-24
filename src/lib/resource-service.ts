/**
 * Enterprise Resource Service — SINGLE SOURCE OF TRUTH for all resource operations.
 *
 * KEY PRINCIPLES:
 *   1. storageKey is ALWAYS used for storage lookup — NEVER publicUrl
 *   2. publicUrl is NEVER used for storage lookup — only for display/redirects
 *   3. urlType is validated at write time AND auto-corrected at read time
 *   4. All errors are structured — never "UNKNOWN"
 *   5. Backward compatibility — legacy `url` field is handled gracefully
 */

import { db } from "@/lib/db";
import { StorageService } from "@/lib/storage/storage";
import { getStorageProvider } from "@/lib/storage/provider";
import { getStorageAdapter } from "@/lib/storage/adapters/storage-factory";
import type { StorageAdapter, FileMetadata, UploadResult as AdapterUploadResult } from "@/lib/storage/adapters/storage-adapter";
import {
  isExtensionAllowed,
  isExtensionBlocked,
  validateMimeForExtension,
  getCanonicalMimeType,
  getExtension,
  MIME_FROM_EXT,
  sanitizeFileName,
} from "@/lib/storage/file-type-registry";
import crypto from "crypto";
import path from "path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_UPLOAD_SIZE = 1 * 1024 * 1024 * 1024;
export const MIN_UPLOAD_SIZE = 1024;
export const VALID_URL_TYPES = new Set(["uploaded", "external", "data_url", "storage_key"]);
export const VALID_RESOURCE_TYPES = new Set([
  "windows_driver", "windows_software", "android_software",
  "firmware", "sdk", "manual", "installation_guide",
  "troubleshooting", "video", "browser_utility",
  "maintenance_tool", "pos_utility", "other",
]);
export const VALID_VISIBILITIES = new Set(["public", "internal", "partner", "dealer", "engineer", "admin"]);
export const VALID_STATUSES = new Set(["active", "deprecated", "draft"]);

// ---------------------------------------------------------------------------
// Structured Error System
// ---------------------------------------------------------------------------

export interface ResourceError {
  success: false;
  code: string;
  stage: string;
  message: string;
  details: Record<string, unknown>;
}

export function createError(
  code: string,
  stage: string,
  message: string,
  details: Record<string, unknown> = {},
): ResourceError {
  return { success: false, code, stage, message, details };
}

// ---------------------------------------------------------------------------
// URL Type Detection
// ---------------------------------------------------------------------------

export function detectUrlType(url: string): "uploaded" | "external" | "data_url" {
  if (!url) return "uploaded";
  if (url.startsWith("data:")) return "data_url";
  if (isVercelBlobUrl(url)) return "uploaded";
  if (url.startsWith("http://") || url.startsWith("https://")) return "external";
  return "uploaded";
}

function isVercelBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Resolve effective urlType — auto-corrects mismatches at runtime.
 * This is the SAFETY NET that prevents FILE_NOT_FOUND from urlType mismatches.
 */
export function resolveUrlType(resource: {
  urlType: string | null;
  storageKey: string | null;
  publicUrl: string | null;
  url: string | null;
}): "uploaded" | "external" | "data_url" {
  const storedType: string = resource.urlType ?? "uploaded";
  const effectiveUrl = resource.storageKey ?? resource.url ?? resource.publicUrl ?? "";
  const detectedType = detectUrlType(effectiveUrl);

  if (storedType === detectedType) return detectedType;
  if (storedType === "storage_key" && detectedType === "uploaded") return "uploaded";

  // CRITICAL SAFETY NET: If stored "uploaded"/"storage_key" but URL is actually "external"
  // → override to "external" (this fixes the FILE_NOT_FOUND bug)
  if ((storedType === "uploaded" || storedType === "storage_key") && detectedType === "external") {
    console.warn("[ResourceService] URL_TYPE_MISMATCH: stored=" + storedType + " but URL is actually " + detectedType + ". Auto-correcting.");
    return "external";
  }

  // Default: return detected type if it's valid, otherwise "uploaded"
  if (detectedType === "uploaded" || detectedType === "external" || detectedType === "data_url") return detectedType;
  return "uploaded";
}

// ---------------------------------------------------------------------------
// File Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error: ResourceError | null;
  canonicalMime: string;
  extension: string;
  category: string;
}

export function validateFileForUpload(
  fileName: string,
  reportedMimeType: string,
  fileSize: number,
): ValidationResult {
  const ext = getExtension(fileName) || "";
  const normalizedExt = ext.startsWith(".") ? ext.slice(1).toLowerCase() : ext.toLowerCase();

  if (fileSize < MIN_UPLOAD_SIZE) {
    return {
      valid: false,
      error: createError("FILE_TOO_SMALL", "validation",
        "File is too small (" + fileSize + " bytes). Minimum size is " + MIN_UPLOAD_SIZE + " bytes.",
        { fileSize, minSize: MIN_UPLOAD_SIZE }),
      canonicalMime: reportedMimeType,
      extension: normalizedExt,
      category: "",
    };
  }

  if (fileSize > MAX_UPLOAD_SIZE) {
    const sizeGB = (fileSize / 1024 / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: createError("FILE_TOO_LARGE", "validation",
        "Maximum upload size is 1 GB. Your file is " + sizeGB + " GB.",
        { fileSize, maxSize: MAX_UPLOAD_SIZE }),
      canonicalMime: reportedMimeType,
      extension: normalizedExt,
      category: "",
    };
  }

  if (normalizedExt && isExtensionBlocked("." + normalizedExt)) {
    return {
      valid: false,
      error: createError("BLOCKED_EXTENSION", "validation",
        "Blocked extension: ." + normalizedExt + ". This file type is not allowed for security reasons.",
        { extension: normalizedExt }),
      canonicalMime: "",
      extension: normalizedExt,
      category: "",
    };
  }

  if (normalizedExt && !isExtensionAllowed("." + normalizedExt)) {
    return {
      valid: false,
      error: createError("INVALID_EXTENSION", "validation",
        "Extension ." + normalizedExt + " is not in the allowed file type registry.",
        { extension: normalizedExt }),
      canonicalMime: "",
      extension: normalizedExt,
      category: "",
    };
  }

  const mimeResult = validateMimeForExtension(reportedMimeType, "." + normalizedExt);
  const canonicalMime = mimeResult.canonicalMime || reportedMimeType;

  return {
    valid: true,
    error: null,
    canonicalMime,
    extension: normalizedExt,
    category: mimeResult.category ?? "",
  };
}

// ---------------------------------------------------------------------------
// Upload Pipeline — Sessions + Chunked Upload
// ---------------------------------------------------------------------------

export interface UploadSession {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  extension: string;
  status: "pending" | "uploading" | "completed" | "failed" | "expired";
  createdAt: Date;
  expiresAt: Date;
  receivedChunks: number[];
  totalChunks: number;
  chunkSize: number;
  checksum: string | null;
  storageKey: string | null;
  storageProvider: string | null;
}

const uploadSessions = new Map<string, UploadSession>();
const UPLOAD_SESSION_TTL = 24 * 60 * 60 * 1000;
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

export function createUploadSession(
  fileName: string,
  mimeType: string,
  fileSize: number,
): UploadSession | ResourceError {
  const validation = validateFileForUpload(fileName, mimeType, fileSize);
  if (!validation.valid) return validation.error!;

  const totalChunks = Math.ceil(fileSize / DEFAULT_CHUNK_SIZE);
  const sessionId = crypto.randomUUID();
  const now = new Date();

  const session: UploadSession = {
    id: sessionId,
    fileName,
    mimeType: validation.canonicalMime,
    fileSize,
    extension: validation.extension,
    status: "pending",
    createdAt: now,
    expiresAt: new Date(now.getTime() + UPLOAD_SESSION_TTL),
    receivedChunks: [],
    totalChunks,
    chunkSize: DEFAULT_CHUNK_SIZE,
    checksum: null,
    storageKey: null,
    storageProvider: null,
  };

  uploadSessions.set(sessionId, session);
  console.log("[UploadSession] Created: id=" + sessionId + ", file=" + fileName + ", size=" + fileSize + ", chunks=" + totalChunks);
  return session;
}

export function getUploadSession(id: string): UploadSession | null {
  const session = uploadSessions.get(id);
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    uploadSessions.delete(id);
    return null;
  }
  return session;
}

export async function writeUploadChunk(
  sessionId: string,
  chunkIndex: number,
  chunkBuffer: Buffer,
): Promise<{ accepted: true; chunkIndex: number; progress: number } | ResourceError> {
  const session = getUploadSession(sessionId);
  if (!session) return createError("UPLOAD_SESSION_NOT_FOUND", "upload", "Upload session not found or expired.", { sessionId });
  if (session.status === "completed") return createError("UPLOAD_NOT_RESUMABLE", "upload", "This upload is already completed.", { sessionId });

  if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
    return createError("CHUNK_OUT_OF_ORDER", "upload",
      "Chunk index " + chunkIndex + " is out of range (0-" + (session.totalChunks - 1) + ").",
      { chunkIndex, totalChunks: session.totalChunks });
  }

  const expectedSize = chunkIndex === session.totalChunks - 1
    ? session.fileSize - chunkIndex * session.chunkSize
    : session.chunkSize;

  if (chunkBuffer.length > expectedSize + 1024) {
    return createError("CHUNK_SIZE_INVALID", "upload",
      "Chunk " + chunkIndex + " size " + chunkBuffer.length + " exceeds expected " + expectedSize + ".",
      { chunkIndex, receivedSize: chunkBuffer.length, expectedSize });
  }

  const fs = await import("fs/promises");
  const tempDir = path.join(process.cwd(), "data", "uploads", "temp");
  const tempPath = path.join(tempDir, sessionId + ".part");
  await fs.mkdir(tempDir, { recursive: true });

  const offset = chunkIndex * session.chunkSize;
  const fileHandle = await fs.open(tempPath, "r+").catch(async () => {
    // If file doesn't exist yet, create it with the correct size
    const fh = await fs.open(tempPath, "w+");
    // Extend the file to the expected total size
    if (session.fileSize > 0) {
      await fh.writeFile(Buffer.alloc(session.fileSize));
    }
    return fh;
  });

  try {
    await fileHandle.write(chunkBuffer, 0, chunkBuffer.length, offset);
  } catch (writeErr) {
    await fileHandle.close();
    return createError("STORAGE_ERROR", "upload",
      "Failed to write chunk " + chunkIndex + " to temp file.",
      { chunkIndex, error: String(writeErr) });
  }
  await fileHandle.close();

  if (!session.receivedChunks.includes(chunkIndex)) {
    session.receivedChunks.push(chunkIndex);
  }
  session.status = "uploading";

  const progress = session.receivedChunks.length / session.totalChunks;
  console.log("[UploadChunk] Session " + sessionId + ": chunk " + chunkIndex + "/" + (session.totalChunks - 1) + " (" + Math.round(progress * 100) + "%)");

  return { accepted: true, chunkIndex, progress };
}

export async function completeUploadSession(
  sessionId: string,
): Promise<{
  success: true;
  storageKey: string;
  storageProvider: string;
  mimeType: string;
  fileSize: number;
  originalFileName: string;
  extension: string;
  checksum: string;
  publicUrl: string | null;
} | ResourceError> {
  const session = getUploadSession(sessionId);
  if (!session) return createError("UPLOAD_SESSION_NOT_FOUND", "upload", "Upload session not found or expired.", { sessionId });

  if (session.receivedChunks.length < session.totalChunks) {
    const missingChunks = Array.from({ length: session.totalChunks }, (_, i) => i)
      .filter(i => !session.receivedChunks.includes(i));
    return createError("UPLOAD_FAILED", "upload",
      "Upload incomplete. Missing chunks: " + missingChunks.join(", ") + ".",
      { missingChunks, received: session.receivedChunks.length, total: session.totalChunks });
  }

  const fs = await import("fs/promises");
  const tempPath = path.join(process.cwd(), "data", "uploads", "temp", sessionId + ".part");

  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(tempPath);
  } catch {
    return createError("FILE_NOT_FOUND", "upload", "Temporary upload file not found.", { sessionId });
  }

  const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  // Use the new StorageAdapter for hosting-agnostic upload
  const adapter = getStorageAdapter();
  const metadata: FileMetadata = {
    contentType: session.mimeType,
    size: fileBuffer.length,
    originalName: session.fileName,
    extension: session.extension,
  };

  let adapterResult: AdapterUploadResult | null = null;
  let storageResult: { storageKey: string; mimeType: string; fileSize: number };

  try {
    // Use the new StorageAdapter for hosting-agnostic upload
    adapterResult = await adapter.upload(session.fileName, fileBuffer, metadata);
    // Map adapter result to legacy shape for backward compatibility
    storageResult = {
      storageKey: adapterResult.key,
      mimeType: adapterResult.contentType,
      fileSize: adapterResult.size,
    };
  } catch (adapterErr) {
    // Fallback to legacy StorageService if adapter fails
    const adapterErrMsg = adapterErr instanceof Error ? adapterErr.message : String(adapterErr);
    console.warn("[ResourceService] StorageAdapter upload failed (" + adapter.name + "), falling back to StorageService: " + adapterErrMsg);
    try {
      const legacyResult = await StorageService.upload(fileBuffer, session.fileName, session.mimeType);
      storageResult = {
        storageKey: legacyResult.storageKey,
        mimeType: legacyResult.mimeType,
        fileSize: legacyResult.fileSize,
      };
    } catch (legacyErr) {
      const errMsg = legacyErr instanceof Error ? legacyErr.message : String(legacyErr);
      return createError("STORAGE_ERROR", "upload", "Storage upload failed. Adapter: " + adapterErrMsg + ". Legacy: " + errMsg, {
        adapter: adapter.name,
        provider: getStorageProvider().name,
        fileName: session.fileName,
        fileSize: session.fileSize,
      });
    }
  }

  try { await fs.unlink(tempPath); } catch { /* non-critical */ }

  session.status = "completed";
  session.storageKey = storageResult.storageKey;
  session.storageProvider = adapter.name;
  session.checksum = checksum;

  // Determine publicUrl based on adapter result
  let publicUrl: string | null = null;
  if (adapterResult && adapterResult.url) {
    publicUrl = adapterResult.url;
  } else if (storageResult.storageKey.startsWith("https://")) {
    publicUrl = storageResult.storageKey;
  }

  console.log("[UploadComplete] Session " + sessionId + ": storageKey=" + storageResult.storageKey + ", adapter=" + adapter.name);

  return {
    success: true,
    storageKey: storageResult.storageKey,
    storageProvider: adapter.name,
    mimeType: session.mimeType,
    fileSize: fileBuffer.length,
    originalFileName: session.fileName,
    extension: session.extension,
    checksum: checksum,
    publicUrl,
  };
}

export function cleanupExpiredSessions(): number {
  const now = new Date();
  let cleaned = 0;
  for (const [id, session] of uploadSessions.entries()) {
    if (session.expiresAt < now) { uploadSessions.delete(id); cleaned++; }
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// Resource CRUD
// ---------------------------------------------------------------------------

export interface CreateResourceInput {
  name: string;
  type: string;
  version?: string | null;
  description?: string | null;
  supportedCategories?: string | null;
  storageKey?: string | null;
  publicUrl?: string | null;
  storageProvider?: string | null;
  urlType?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  originalFileName?: string | null;
  extension?: string | null;
  checksum?: string | null;
  thumbnailUrl?: string | null;
  releaseDate?: string | null;
  visibility?: string;
  status?: string;
  createdBy?: string | null;
  url?: string | null;
}

export async function createResource(input: CreateResourceInput): Promise<{
  success: true;
  resource: Record<string, unknown>;
} | ResourceError> {
  if (!input.name || !input.name.trim()) {
    return createError("MISSING_FIELD", "validation", "Resource name is required.", { field: "name" });
  }
  if (!input.type) {
    return createError("MISSING_FIELD", "validation", "Resource type is required.", { field: "type" });
  }
  if (!VALID_RESOURCE_TYPES.has(input.type)) {
    return createError("INVALID_FIELD", "validation",
      input.type + " is not a valid resource type.",
      { field: "type", value: input.type, validTypes: Array.from(VALID_RESOURCE_TYPES) });
  }

  // Resolve urlType — ALWAYS auto-detect if not provided
  const effectiveUrl = input.storageKey ?? input.url ?? input.publicUrl ?? "";
  const urlType = (input.urlType && VALID_URL_TYPES.has(input.urlType))
    ? input.urlType
    : detectUrlType(effectiveUrl);

  let resolvedStorageKey = input.storageKey ?? null;
  let resolvedPublicUrl = input.publicUrl ?? null;

  // CRITICAL: If urlType is "uploaded", ensure storageKey is a LOCAL key
  if (urlType === "uploaded" && resolvedStorageKey) {
    const detected = detectUrlType(resolvedStorageKey);
    if (detected === "external") {
      console.warn("[ResourceService] MIGRATION: Resource " + input.name + " has storageKey=" + resolvedStorageKey.slice(0, 60) + " which is an external URL. Moving to publicUrl.");
      resolvedPublicUrl = resolvedStorageKey;
      resolvedStorageKey = null;
      // Re-call with corrected data
      return createResource({
        ...input,
        storageKey: null,
        publicUrl: resolvedPublicUrl,
        urlType: "external",
      });
    }
  }

  if (urlType === "external" && !resolvedPublicUrl && !input.url) {
    return createError("MISSING_FIELD", "validation", "External resources require a publicUrl.", { field: "publicUrl", urlType });
  }

  // Duplicate protection
  const existing = await db.resource.findFirst({
    where: { name: input.name, version: input.version ?? null },
  });
  if (existing) {
    return createError("DUPLICATE_RESOURCE", "validation",
      "Resource " + input.name + " v" + (input.version ?? "(none)") + " already exists.",
      { existingId: existing.id, name: input.name, version: input.version });
  }

  const resolvedStorageProvider = input.storageProvider ?? (resolvedStorageKey ? getStorageProvider().name : null);

  try {
    const resource = await db.resource.create({
      data: {
        name: input.name,
        type: input.type,
        version: input.version ?? null,
        description: input.description ?? null,
        supportedCategories: input.supportedCategories ?? null,
        storageKey: resolvedStorageKey,
        publicUrl: resolvedPublicUrl,
        storageProvider: resolvedStorageProvider,
        urlType: urlType,
        mimeType: input.mimeType ?? null,
        fileSize: input.fileSize ?? null,
        originalFileName: input.originalFileName ?? null,
        extension: input.extension ?? null,
        checksum: input.checksum ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
        visibility: input.visibility ?? "public",
        status: input.status ?? "active",
        createdBy: input.createdBy ?? null,
        updatedBy: input.createdBy ?? null,
        url: resolvedStorageKey ?? resolvedPublicUrl ?? input.url ?? null,
      },
    });

    console.log("[ResourceCreate] id=" + resource.id + ", name=" + resource.name + ", urlType=" + urlType);
    return { success: true, resource };
  } catch (dbErr) {
    const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
    return createError("DATABASE_ERROR", "database", "Failed to create resource: " + errMsg, { originalError: errMsg });
  }
}

// ---------------------------------------------------------------------------
// Download Pipeline — storageKey lookup only
// ---------------------------------------------------------------------------

export async function serveResourceDownload(
  resourceId: string,
  incrementCount: boolean = true,
): Promise<{
  success: true;
  buffer: Buffer;
  mimeType: string;
  fileSize: number;
  fileName: string;
  checksum: string | null;
} | ResourceError> {
  const resource = await db.resource.findUnique({
    where: { id: resourceId },
    select: {
      id: true, name: true, storageKey: true, publicUrl: true, url: true,
      urlType: true, mimeType: true, fileSize: true, checksum: true,
      originalFileName: true, visibility: true, extension: true,
      storageProvider: true,
    },
  });

  if (!resource) {
    return createError("RESOURCE_NOT_FOUND", "download",
      "Resource " + resourceId + " not found.", { resourceId });
  }

  const urlType = resolveUrlType(resource);

  // EXTERNAL → return URL for redirect
  if (urlType === "external") {
    const redirectUrl = resource.publicUrl ?? resource.url ?? "";
    if (!redirectUrl) {
      return createError("FILE_NOT_FOUND", "download",
        "External resource " + resource.name + " has no public URL.", { resourceId: resource.id });
    }
    return {
      success: true,
      buffer: Buffer.from(redirectUrl),
      mimeType: "redirect",
      fileSize: 0,
      fileName: resource.originalFileName ?? resource.name,
      checksum: resource.checksum,
    };
  }

  // DATA_URL → decode base64
  if (urlType === "data_url") {
    const dataUrl = resource.storageKey ?? resource.url ?? "";
    const base64Data = dataUrl.split(",")[1];
    if (!base64Data) {
      return createError("FILE_NOT_FOUND", "download",
        "Data URL for " + resource.name + " is corrupted.", { resourceId: resource.id });
    }
    const buffer = Buffer.from(base64Data, "base64");
    if (incrementCount) {
      void db.resource.update({ where: { id: resource.id }, data: { downloadCount: { increment: 1 } } }).catch(() => {});
    }
    return {
      success: true,
      buffer,
      mimeType: resource.mimeType ?? "application/octet-stream",
      fileSize: buffer.length,
      fileName: sanitizeFileName(resource.originalFileName ?? resource.name),
      checksum: resource.checksum,
    };
  }

  // UPLOADED → lookup via storageKey ONLY
  const storageKey = resource.storageKey ?? resource.url ?? "";
  if (!storageKey) {
    return createError("FILE_NOT_FOUND", "download",
      "Resource " + resource.name + " has no storage key.", { resourceId: resource.id, name: resource.name });
  }

  // SAFETY CHECK: storageKey is HTTP URL → treat as redirect
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    if (!isVercelBlobUrl(storageKey)) {
      console.error("[ResourceService] CRITICAL: storageKey for " + resource.name + " is HTTP URL. Auto-correcting to redirect.");
      return {
        success: true,
        buffer: Buffer.from(storageKey),
        mimeType: "redirect",
        fileSize: 0,
        fileName: sanitizeFileName(resource.originalFileName ?? resource.name),
        checksum: resource.checksum,
      };
    }
  }

  try {
    const downloadResult = await StorageService.download(storageKey);

    if (resource.checksum && incrementCount) {
      const actualHash = crypto.createHash("sha256").update(downloadResult.buffer).digest("hex");
      if (actualHash !== resource.checksum) {
        console.warn("[ResourceService] CHECKSUM_WARNING for " + resource.name);
      }
    }

    if (incrementCount) {
      void db.resource.update({ where: { id: resource.id }, data: { downloadCount: { increment: 1 } } }).catch(() => {});
    }

    return {
      success: true,
      buffer: downloadResult.buffer,
      mimeType: downloadResult.mimeType,
      fileSize: downloadResult.fileSize,
      fileName: sanitizeFileName(resource.originalFileName ?? resource.name),
      checksum: resource.checksum,
    };
  } catch (storageErr) {
    console.error("[ResourceService] Storage error for key=" + storageKey + " resource=" + resource.name, storageErr);
    return createError("FILE_NOT_FOUND", "download",
      "The physical file for " + resource.name + " could not be read.",
      { resourceId: resource.id, storageKey: storageKey.slice(0, 60), storageProvider: resource.storageProvider ?? "unknown" });
  }
}

// ---------------------------------------------------------------------------
// Health Check & Auto-Fix
// ---------------------------------------------------------------------------

export interface HealthIssue {
  resourceId: string;
  resourceName: string;
  issue: string;
  severity: "critical" | "warning" | "info";
  details: string;
  autoFixable: boolean;
}

export async function auditResourceHealth(): Promise<{
  totalResources: number;
  healthyResources: number;
  issues: HealthIssue[];
}> {
  const resources = await db.resource.findMany({
    select: { id: true, name: true, storageKey: true, publicUrl: true, url: true, urlType: true, checksum: true, storageProvider: true },
  });

  const issues: HealthIssue[] = [];
  let healthy = 0;

  for (const r of resources) {
    let isHealthy = true;
    const resolvedType = resolveUrlType(r);

    if (!r.storageKey && !r.publicUrl && !r.url) {
      issues.push({ resourceId: r.id, resourceName: r.name, issue: "EMPTY_STORAGE_IDENTITY", severity: "critical", details: "No storageKey, publicUrl, or legacy url.", autoFixable: false });
      isHealthy = false;
      continue;
    }

    if (r.urlType !== resolvedType) {
      issues.push({ resourceId: r.id, resourceName: r.name, issue: "URL_TYPE_MISMATCH", severity: "warning", details: "Stored urlType=" + r.urlType + " but effective=" + resolvedType, autoFixable: true });
      isHealthy = false;
    }

    const effectiveKey = r.storageKey ?? r.url ?? "";
    if ((effectiveKey.startsWith("http://") || effectiveKey.startsWith("https://")) && !isVercelBlobUrl(effectiveKey)) {
      issues.push({ resourceId: r.id, resourceName: r.name, issue: "PUBLIC_URL_IN_STORAGE_KEY", severity: "critical", details: "storageKey contains HTTP URL: " + effectiveKey.slice(0, 60), autoFixable: true });
      isHealthy = false;
    }

    if (resolvedType === "uploaded" && effectiveKey) {
      const exists = await StorageService.exists(effectiveKey).catch(() => false);
      if (!exists && !isVercelBlobUrl(effectiveKey)) {
        issues.push({ resourceId: r.id, resourceName: r.name, issue: "FILE_MISSING_IN_STORAGE", severity: "critical", details: "Physical file not found at: " + effectiveKey.slice(0, 60), autoFixable: false });
        isHealthy = false;
      }
    }

    if (resolvedType === "uploaded" && !r.checksum) {
      issues.push({ resourceId: r.id, resourceName: r.name, issue: "MISSING_CHECKSUM", severity: "warning", details: "SHA-256 checksum not set.", autoFixable: false });
      isHealthy = false;
    }

    if (isHealthy) healthy++;
  }

  return { totalResources: resources.length, healthyResources: healthy, issues };
}

export async function autoFixResourceRecords(): Promise<{ fixed: number; errors: number }> {
  const audit = await auditResourceHealth();
  let fixed = 0;
  let errors = 0;

  for (const issue of audit.issues) {
    if (!issue.autoFixable) continue;
    try {
      const resource = await db.resource.findUnique({ where: { id: issue.resourceId } });
      if (!resource) continue;

      if (issue.issue === "URL_TYPE_MISMATCH") {
        const resolvedType = resolveUrlType(resource);
        await db.resource.update({ where: { id: resource.id }, data: { urlType: resolvedType } });
        fixed++;
      }

      if (issue.issue === "PUBLIC_URL_IN_STORAGE_KEY") {
        const httpUrl = resource.storageKey ?? resource.url ?? "";
        await db.resource.update({
          where: { id: resource.id },
          data: { storageKey: null, publicUrl: httpUrl, urlType: "external", url: httpUrl },
        });
        fixed++;
      }
    } catch {
      errors++;
    }
  }

  console.log("[AutoFix] Fixed " + fixed + " records, " + errors + " errors");
  return { fixed, errors };
}

// Re-export getStorageProvider for convenience
export { getStorageProvider };
