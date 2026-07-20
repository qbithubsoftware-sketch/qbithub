/**
 * Vercel Blob Storage Provider — stores files in Vercel Blob Storage.
 *
 * AUTHENTICATION (SDK v2.6.1):
 *   Two auth methods supported:
 *     1. OIDC + BLOB_STORE_ID (recommended) — auto on Vercel runtime
 *     2. BLOB_READ_WRITE_TOKEN (legacy) — explicit token
 *
 *   The SDK's resolveBlobAuth() chain:
 *     presignedUrlPayload → options.token → OIDC + BLOB_STORE_ID → BLOB_READ_WRITE_TOKEN
 *
 * STORAGE KEY RESOLUTION:
 *   The database may contain storageKeys in two formats:
 *     A. Full Blob URL: https://store_xxx.public.blob.vercel-storage.com/resources/...
 *     B. Relative path:  resources/1784559605570-abc123-driver.exe
 *
 *   Format A is what VercelBlobStorageProvider.upload() returns (blob.url).
 *   Format B occurs when:
 *     - Files were uploaded with the local storage provider and the DB was
 *       populated with the local-style key
 *     - The provider was switched from local → vercel-blob after upload
 *
 *   This provider MUST handle both formats:
 *     - Full URL → use directly for public blobs (no auth needed for public)
 *     - Relative path → resolve to full Blob URL using store ID:
 *       https://${storeId}.public.blob.vercel-storage.com/${pathname}
 *
 *   For private blobs, the SDK's head()/get() functions are used with
 *   auth options so the SDK can authorize the request.
 *
 * NO FILESYSTEM API:
 *   When STORAGE_PROVIDER=vercel-blob, this provider NEVER calls
 *   fs.readFile(), fs.writeFile(), or any filesystem API.
 *   All operations go through the Vercel Blob HTTP API.
 *
 * BACKWARD COMPATIBILITY:
 *   - Full Blob URLs from any store version work for public blobs
 *   - Relative paths are resolved using the current store ID
 *   - Legacy BLOB_READ_WRITE_TOKEN still supported
 *   - detectUrlType() in resource-download.ts correctly classifies
 *     Blob URLs as "storage_key" (not "external")
 */

import type { StorageProvider, UploadResult, DownloadResult } from "./types";
import { MIME_FROM_EXT, sanitizeFileName, getExtension } from "./types";
import { put, head, del } from "@vercel/blob";
import path from "path";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Auth detection — determine which credential path the SDK will use
// ---------------------------------------------------------------------------

/**
 * Detected authentication method for Vercel Blob.
 * Mirrors the SDK's resolveBlobAuth() priority chain.
 */
export type BlobAuthMethod =
  | "oidc"           // OIDC token (auto from @vercel/oidc) + BLOB_STORE_ID — CURRENT recommended
  | "readWriteToken" // BLOB_READ_WRITE_TOKEN env var — LEGACY fallback
  | "none";          // No credentials found — will fail

export interface BlobAuthDetection {
  method: BlobAuthMethod;
  /** Human-readable description for logging */
  description: string;
  /** Whether BLOB_READ_WRITE_TOKEN is present (even if OIDC takes priority) */
  hasReadWriteToken: boolean;
  /** Whether BLOB_STORE_ID is present */
  hasStoreId: boolean;
  /** Whether an OIDC token is likely available (auto-detected on Vercel) */
  hasOidcToken: boolean;
  /** The store ID that will be used (from BLOB_STORE_ID or parsed from token) */
  storeId: string | null;
}

/**
 * Detect which authentication method the SDK will use.
 * This does NOT call the SDK — it inspects env vars and the Vercel runtime
 * to predict the auth path, so we can log it before making SDK calls.
 *
 * The SDK's actual resolveBlobAuth() runs at call time and may differ
 * if the Vercel runtime is not available (e.g. local dev).
 */
export function detectBlobAuth(): BlobAuthDetection {
  const readWriteToken = readEnv("BLOB_READ_WRITE_TOKEN");
  const blobStoreId = readEnv("BLOB_STORE_ID");
  const isVercelRuntime = !!(
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.VERCEL_URL
  );

  const hasReadWriteToken = !!readWriteToken;
  const hasStoreId = !!blobStoreId;
  // On Vercel, OIDC tokens are auto-provisioned by the runtime.
  // Locally, they're not available unless explicitly set.
  const hasOidcToken = isVercelRuntime || !!readEnv("VERCEL_OIDC_TOKEN");

  // Determine the method following the SDK's priority chain
  let method: BlobAuthMethod;
  let description: string;
  let storeId: string | null = null;

  if (hasOidcToken && hasStoreId) {
    // OIDC + BLOB_STORE_ID — this is the current recommended pattern
    method = "oidc";
    storeId = normalizeStoreId(blobStoreId!);
    description = `OIDC (auto on Vercel) + BLOB_STORE_ID="${blobStoreId}" (normalized: "${storeId}")`;
  } else if (hasReadWriteToken) {
    // Legacy read-write token
    method = "readWriteToken";
    storeId = parseStoreIdFromToken(readWriteToken!);
    description = `BLOB_READ_WRITE_TOKEN (legacy, storeId: ${storeId ?? "unknown"})`;
  } else {
    method = "none";
    description = "No credentials found — neither OIDC+BLOB_STORE_ID nor BLOB_READ_WRITE_TOKEN";
  }

  return { method, description, hasReadWriteToken, hasStoreId, hasOidcToken, storeId };
}

/**
 * Build the BlobCommandOptions for SDK calls based on detected auth.
 * This lets us explicitly pass storeId when using OIDC, which helps
 * the SDK resolve auth even if BLOB_STORE_ID isn't in process.env
 * at SDK call time (edge runtime, cold starts, etc.)
 */
export function buildBlobCommandOptions(
  auth: BlobAuthDetection,
): Record<string, unknown> {
  const options: Record<string, unknown> = {};

  // If using legacy token, pass it explicitly so the SDK uses it
  // (instead of falling through to OIDC which might not work with this token)
  if (auth.method === "readWriteToken" && auth.hasReadWriteToken) {
    options.token = readEnv("BLOB_READ_WRITE_TOKEN");
  }

  // Always pass storeId if available — helps the SDK with OIDC auth
  // and with the x-vercel-blob-store-id header
  if (auth.storeId) {
    options.storeId = auth.storeId;
  }

  return options;
}

// ---------------------------------------------------------------------------
// Storage key resolution — handle both full URLs and relative paths
// ---------------------------------------------------------------------------

/**
 * Check if a storage key is a full Vercel Blob URL.
 * Full URLs look like: https://store_xxx.public.blob.vercel-storage.com/resources/...
 */
function isBlobUrl(key: string): boolean {
  try {
    const parsed = new URL(key);
    return parsed.hostname.includes("blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Resolve a storage key to a full Vercel Blob URL.
 *
 * Handles two formats:
 *   A. Full URL: https://store_xxx.public.blob.vercel-storage.com/resources/...
 *      → returned as-is
 *   B. Relative path: resources/1784559605570-abc123-driver.exe
 *      → resolved to: https://${storeId}.public.blob.vercel-storage.com/resources/...
 *
 * For format B, we need the storeId (from BLOB_STORE_ID or parsed from token).
 * If no storeId is available, we cannot resolve the URL — this is a
 * configuration error.
 */
function resolveBlobUrl(storageKey: string, auth: BlobAuthDetection): string {
  // Already a full URL — return as-is
  if (isBlobUrl(storageKey)) {
    return storageKey;
  }

  // Relative path — construct URL from store ID
  // Strip leading slash if present
  const pathname = storageKey.replace(/^\//, "");

  if (!auth.storeId) {
    throw new StorageConfigurationError(
      "STORAGE_CONFIGURATION_ERROR",
      `Cannot resolve relative storage key "${storageKey}" to a Vercel Blob URL because no store ID is available. ` +
      `Set BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN (which contains the store ID) in your environment variables, ` +
      `or re-upload the file with the current provider configuration so the full Blob URL is stored in the database.`,
      { storageKey, hasStoreId: false, hasReadWriteToken: auth.hasReadWriteToken },
    );
  }

  // Construct URL: https://${storeId}.public.blob.vercel-storage.com/${pathname}
  // All our uploads use access: "public", so the URL uses the "public" subdomain.
  const url = `https://${auth.storeId}.public.blob.vercel-storage.com/${pathname}`;

  console.log(`[VercelBlob]   Resolved relative key: "${storageKey}" → "${url}"`);
  return url;
}

/**
 * Read an env var, returning undefined if missing or empty.
 * Uses try/catch because process.env may not be accessible in some runtimes.
 */
function readEnv(name: string): string | undefined {
  try {
    const value = process.env[name];
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Normalize a store ID — strip the "store_" prefix if present.
 *
 * The Vercel Dashboard sets BLOB_STORE_ID with a "store_" prefix
 * (e.g. "store_abc123"), but the Blob URL subdomain uses just the
 * ID part (e.g. "abc123"). The SDK's resolveBlobAuth() does this
 * normalization via normalizeStoreId(). We must do the same.
 *
 * constructBlobUrl(storeId, pathname, access) produces:
 *   https://${storeId}.${access}.blob.vercel-storage.com/${pathname}
 * So storeId must NOT have the "store_" prefix.
 */
function normalizeStoreId(storeId: string): string {
  return storeId.startsWith("store_") ? storeId.slice("store_".length) : storeId;
}

/**
 * Parse store ID from a read-write token.
 * Token format: vercel_blob_rw_<storeId>_<random>
 *
 * The storeId in the token does NOT have the "store_" prefix.
 * It's already the raw ID used in the Blob URL subdomain.
 */
function parseStoreIdFromToken(token: string): string | null {
  try {
    const parts = token.split("_");
    // Format: vercel_blob_rw_<storeId>_<random>
    // storeId is at index 3 — already normalized (no "store_" prefix)
    if (parts.length >= 4 && parts[0] === "vercel" && parts[1] === "blob" && parts[2] === "rw") {
      return parts[3];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract a filename from a URL or relative path.
 */
function extractFileName(key: string): string {
  try {
    if (isBlobUrl(key) || key.startsWith("http://") || key.startsWith("https://")) {
      const urlPath = new URL(key).pathname;
      return path.basename(urlPath);
    }
    return path.basename(key);
  } catch {
    return path.basename(key);
  }
}

// ---------------------------------------------------------------------------
// VercelBlobStorageProvider
// ---------------------------------------------------------------------------

export class VercelBlobStorageProvider implements StorageProvider {
  readonly name = "vercel-blob";

  /**
   * Detect available authentication and validate configuration.
   * Returns auth info if usable, throws STORAGE_CONFIGURATION_ERROR if not.
   */
  private requireAuth(): BlobAuthDetection {
    const auth = detectBlobAuth();

    console.log(`[VercelBlob] === AUTH DETECTION ===`);
    console.log(`[VercelBlob]   Method:             ${auth.method}`);
    console.log(`[VercelBlob]   Description:        ${auth.description}`);
    console.log(`[VercelBlob]   hasReadWriteToken:  ${auth.hasReadWriteToken}`);
    console.log(`[VercelBlob]   hasStoreId:         ${auth.hasStoreId}`);
    console.log(`[VercelBlob]   hasOidcToken:       ${auth.hasOidcToken}`);
    console.log(`[VercelBlob]   storeId:            ${auth.storeId ?? "(none)"}`);

    if (auth.method === "none") {
      const error = new StorageConfigurationError(
        "STORAGE_CONFIGURATION_ERROR",
        "No Vercel Blob credentials found. The @vercel/blob SDK (v2.6.1+) supports two authentication methods:\n" +
        "  1. OIDC + BLOB_STORE_ID (recommended): Set BLOB_STORE_ID in Vercel Dashboard. The OIDC token is auto-provisioned on Vercel.\n" +
        "  2. BLOB_READ_WRITE_TOKEN (legacy): Set in Vercel Dashboard → Settings → Environment Variables.\n" +
        "Neither BLOB_STORE_ID nor BLOB_READ_WRITE_TOKEN was found. Set one of these, or switch STORAGE_PROVIDER to 'local'.",
        {
          envVar: "BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN",
          provider: "vercel-blob",
          detectedAuth: auth,
        },
      );
      console.error(`[VercelBlob] CONFIGURATION ERROR: No blob credentials found.`);
      console.error(`[VercelBlob] The SDK requires one of:`);
      console.error(`[VercelBlob]   1. OIDC auth: BLOB_STORE_ID env var (auto on Vercel)`);
      console.error(`[VercelBlob]   2. Legacy auth: BLOB_READ_WRITE_TOKEN env var`);
      console.error(`[VercelBlob] Neither was found. Set one, or use STORAGE_PROVIDER="local".`);
      throw error;
    }

    return auth;
  }

  async upload(
    buffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    // ---- Pre-flight: detect auth ----
    const auth = this.requireAuth();
    const blobOptions = buildBlobCommandOptions(auth);

    const sanitized = sanitizeFileName(originalFileName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${sanitized}`;
    const blobKey = `resources/${uniqueName}`;

    const tokenInfo = auth.method === "readWriteToken"
      ? `token present (${(readEnv("BLOB_READ_WRITE_TOKEN") ?? "").slice(0, 8)}...)`
      : `auth: ${auth.method}`;

    console.log(`[VercelBlob] === UPLOAD START ===`);
    console.log(`[VercelBlob]   Auth method:      ${auth.method} (${auth.description})`);
    console.log(`[VercelBlob]   Token info:        ${tokenInfo}`);
    console.log(`[VercelBlob]   Blob key:         ${blobKey}`);
    console.log(`[VercelBlob]   File name:        ${originalFileName}`);
    console.log(`[VercelBlob]   MIME type:        ${mimeType}`);
    console.log(`[VercelBlob]   Buffer size:      ${buffer.length} bytes`);
    console.log(`[VercelBlob]   BLOB_STORE_ID:    ${auth.storeId ?? "(not set)"}`);
    console.log(`[VercelBlob]   Access:           public`);
    console.log(`[VercelBlob]   Calling put()...`);

    let blob;
    try {
      const putOptions: Parameters<typeof put>[2] = {
        access: "public",
        contentType: mimeType,
        addRandomSuffix: false,
        // Merge auth-derived options (token, storeId)
        ...blobOptions as Partial<Parameters<typeof put>[2]>,
      };

      const loggableOptions = { ...putOptions, token: putOptions.token ? "(present)" : undefined };
      console.log(`[VercelBlob]   put() args: key="${blobKey}", body=Buffer(${buffer.length}), options=${JSON.stringify(loggableOptions)}`);

      blob = await put(blobKey, buffer, putOptions);

      console.log(`[VercelBlob] === UPLOAD SUCCESS ===`);
      console.log(`[VercelBlob]   Blob URL:         ${blob.url}`);
      console.log(`[VercelBlob]   Blob pathname:    ${blob.pathname}`);
      console.log(`[VercelBlob]   Content-Type:     ${blob.contentType ?? "(unknown)"}`);
      console.log(`[VercelBlob]   Download URL:     ${blob.downloadUrl ?? "N/A"}`);
    } catch (sdkError) {
      // ---- Capture the EXACT SDK error class and message ----
      const errorClass = sdkError instanceof Error ? sdkError.constructor.name : typeof sdkError;
      const errorMessage = sdkError instanceof Error ? sdkError.message : String(sdkError);
      const errorStack = sdkError instanceof Error ? sdkError.stack : "N/A";

      console.error(`[VercelBlob] === UPLOAD FAILED ===`);
      console.error(`[VercelBlob]   Auth method used:  ${auth.method}`);
      console.error(`[VercelBlob]   Error class:       ${errorClass}`);
      console.error(`[VercelBlob]   Error message:     ${errorMessage}`);
      console.error(`[VercelBlob]   Stack trace:`);
      console.error(errorStack);

      // Known Vercel Blob error classes — provide specific guidance
      const className = String(errorClass);
      if (className.includes("BlobAccessError") || errorMessage.includes("Access denied")) {
        console.error(`[VercelBlob] DIAGNOSIS: BlobAccessError — the credentials do not have permission to write to this Blob store.`);
        console.error(`[VercelBlob]   Possible causes:`);
        if (auth.method === "oidc") {
          console.error(`[VercelBlob]   1. BLOB_STORE_ID points to a store in a DIFFERENT Vercel project`);
          console.error(`[VercelBlob]   2. The OIDC token doesn't have access to this store`);
          console.error(`[VercelBlob]   3. The Blob store has been deleted or suspended`);
          console.error(`[VercelBlob]   FIX: Go to Vercel Dashboard → Storage → Blob and verify the store exists and is linked to this project.`);
        } else {
          console.error(`[VercelBlob]   1. BLOB_READ_WRITE_TOKEN is for a DIFFERENT Vercel project or store`);
          console.error(`[VercelBlob]   2. The token has been revoked or expired`);
          console.error(`[VercelBlob]   3. The Blob store has been deleted`);
          console.error(`[VercelBlob]   4. BLOB_STORE_ID points to a store that doesn't match the token`);
          console.error(`[VercelBlob]   FIX: Go to Vercel Dashboard → Storage → Blob and verify the store exists and the token matches.`);
        }
      } else if (className.includes("BlobStoreNotFoundError")) {
        console.error(`[VercelBlob] DIAGNOSIS: BlobStoreNotFoundError — the Blob store doesn't exist.`);
        console.error(`[VercelBlob]   BLOB_STORE_ID was: ${auth.storeId ?? "(not set)"}`);
        console.error(`[VercelBlob]   FIX: Create a Blob store in the Vercel Dashboard, or check BLOB_STORE_ID.`);
      } else if (className.includes("BlobStoreSuspendedError")) {
        console.error(`[VercelBlob] DIAGNOSIS: BlobStoreSuspendedError — the Blob store has been suspended (billing issue?).`);
      } else if (className.includes("BlobFileTooLargeError")) {
        console.error(`[VercelBlob] DIAGNOSIS: BlobFileTooLargeError — file exceeds Vercel Blob plan limits.`);
      }

      // Re-throw the ORIGINAL error — do NOT wrap it
      throw sdkError;
    }

    // ---- Post-upload verification: head() the stored key ----
    // This confirms the blob is reachable using the SAME key we'll store
    // in the database. If head() fails here, the storageKey is wrong
    // and downloads will break.
    console.log(`[VercelBlob] === POST-UPLOAD VERIFICATION ===`);
    console.log(`[VercelBlob]   Verifying stored key with head()...`);
    console.log(`[VercelBlob]   storageKey (will be stored in DB): ${blob.url}`);
    try {
      const blobOptions2 = buildBlobCommandOptions(auth);
      const verification = await head(blob.url, blobOptions2 as Parameters<typeof head>[1] | undefined);
      if (verification) {
        console.log(`[VercelBlob]   head() SUCCESS — blob exists at stored key`);
        console.log(`[VercelBlob]   Verified URL:      ${verification.url}`);
        console.log(`[VercelBlob]   Verified pathname:  ${verification.pathname}`);
        console.log(`[VercelBlob]   Verified size:      ${verification.size} bytes`);
      } else {
        console.error(`[VercelBlob]   head() returned NULL — blob NOT found at stored key!`);
        console.error(`[VercelBlob]   This means download() will also fail for this key.`);
        console.error(`[VercelBlob]   Stored key: ${blob.url}`);
      }
    } catch (headErr) {
      const headErrClass = headErr instanceof Error ? headErr.constructor.name : typeof headErr;
      const headErrMsg = headErr instanceof Error ? headErr.message : String(headErr);
      console.error(`[VercelBlob]   head() FAILED — ${headErrClass}: ${headErrMsg}`);
      console.error(`[VercelBlob]   The blob WAS uploaded (put() succeeded) but head() cannot find it.`);
      console.error(`[VercelBlob]   This may indicate an auth or store ID mismatch.`);
      // Non-blocking — the upload itself succeeded. The download issue will be caught at download time.
    }

    return {
      storageKey: blob.url,
      fileName: uniqueName,
      originalFileName,
      mimeType,
      fileSize: buffer.length,
    };
  }

  /**
   * Download a file from Vercel Blob.
   *
   * STORAGE KEY RESOLUTION:
   *   - Full Blob URL → fetch directly (public blobs don't need auth)
   *   - Relative path (resources/...) → resolve to full URL using store ID
   *
   * NO FILESYSTEM API — all reads go through HTTP to Vercel Blob.
   */
  async download(storageKey: string): Promise<DownloadResult> {
    const auth = detectBlobAuth();

    // ---- Resolve storage key to a full Blob URL ----
    let resolvedUrl: string;
    try {
      resolvedUrl = resolveBlobUrl(storageKey, auth);
    } catch (resolveError) {
      // Configuration error (no store ID to resolve relative path)
      console.error(`[VercelBlob] === DOWNLOAD FAILED (key resolution) ===`);
      console.error(`[VercelBlob]   Storage key: ${storageKey}`);
      if (resolveError instanceof StorageConfigurationError) {
        console.error(`[VercelBlob]   ${resolveError.message}`);
      }
      throw resolveError;
    }

    const keyType = isBlobUrl(storageKey) ? "full Blob URL" : "relative path (resolved)";

    console.log(`[VercelBlob] === DOWNLOAD START ===`);
    console.log(`[VercelBlob]   Auth method:      ${auth.method}`);
    console.log(`[VercelBlob]   Key type:         ${keyType}`);
    console.log(`[VercelBlob]   Original key:     ${storageKey.slice(0, 80)}${storageKey.length > 80 ? "..." : ""}`);
    console.log(`[VercelBlob]   Resolved URL:     ${resolvedUrl.slice(0, 100)}...`);

    // ---- STEP 1: HEAD check — verify the blob exists before GET ----
    console.log(`[VercelBlob]   STEP 1: head() check...`);
    try {
      const blobOptions2 = buildBlobCommandOptions(auth);
      const headResult = await head(resolvedUrl, blobOptions2 as Parameters<typeof head>[1] | undefined);
      if (headResult) {
        console.log(`[VercelBlob]   HEAD RESULT: blob exists`);
        console.log(`[VercelBlob]     head.url:         ${headResult.url}`);
        console.log(`[VercelBlob]     head.pathname:     ${headResult.pathname}`);
        console.log(`[VercelBlob]     head.size:         ${headResult.size} bytes`);
        console.log(`[VercelBlob]     head.contentType:  ${headResult.contentType ?? "(unknown)"}`);
        console.log(`[VercelBlob]     head.uploadedAt:   ${headResult.uploadedAt.toISOString()}`);
      } else {
        console.error(`[VercelBlob]   HEAD RESULT: NULL — blob NOT found at resolved URL`);
        console.error(`[VercelBlob]   The blob may have been deleted, or the resolved URL is wrong.`);
        console.error(`[VercelBlob]   DB storageKey:   ${storageKey}`);
        console.error(`[VercelBlob]   Resolved URL:    ${resolvedUrl}`);
        console.error(`[VercelBlob]   storeId used:    ${auth.storeId ?? "(none)"}`);
      }
    } catch (headErr) {
      const headErrClass = headErr instanceof Error ? headErr.constructor.name : typeof headErr;
      const headErrMsg = headErr instanceof Error ? headErr.message : String(headErr);
      console.error(`[VercelBlob]   HEAD RESULT: ERROR — ${headErrClass}: ${headErrMsg}`);
      console.error(`[VercelBlob]   The blob may not exist at the resolved URL, or auth is insufficient.`);
    }

    // ---- STEP 2: GET — fetch the blob content ----
    console.log(`[VercelBlob]   STEP 2: fetch() GET...`);
    let response: Response;
    try {
      response = await fetch(resolvedUrl, { method: "GET" });
      console.log(`[VercelBlob]   Fetch response: ${response.status} ${response.statusText}`);
    } catch (fetchError) {
      const errorClass = fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError;
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error(`[VercelBlob] === DOWNLOAD FAILED (fetch error) ===`);
      console.error(`[VercelBlob]   Error class: ${errorClass}`);
      console.error(`[VercelBlob]   Error message: ${errorMessage}`);
      console.error(`[VercelBlob]   Stack: ${fetchError instanceof Error ? fetchError.stack : "N/A"}`);
      throw fetchError;
    }

    if (!response.ok) {
      const errMsg = `Failed to download from Vercel Blob: HTTP ${response.status} ${response.statusText}`;
      console.error(`[VercelBlob] === DOWNLOAD FAILED (HTTP error) ===`);
      console.error(`[VercelBlob]   ${errMsg}`);
      console.error(`[VercelBlob]   URL: ${resolvedUrl.slice(0, 100)}...`);
      console.error(`[VercelBlob]   Key type: ${keyType}`);
      if (response.status === 404) {
        console.error(`[VercelBlob] DIAGNOSIS: 404 — the blob does not exist at this URL.`);
        console.error(`[VercelBlob]   Possible causes:`);
        console.error(`[VercelBlob]   1. The file was uploaded with a DIFFERENT store and this URL doesn't point to it`);
        console.error(`[VercelBlob]   2. The relative key was resolved to the WRONG store ID`);
        console.error(`[VercelBlob]   3. The blob was deleted from Vercel Blob`);
        console.error(`[VercelBlob]   4. The storage key in the DB is stale (uploaded with local provider, not migrated)`);
      }
      throw new Error(errMsg);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const fileName = extractFileName(resolvedUrl);
    const ext = getExtension(fileName);
    const mimeType = MIME_FROM_EXT[ext] || contentType;

    console.log(`[VercelBlob] === DOWNLOAD SUCCESS ===`);
    console.log(`[VercelBlob]   Bytes: ${buffer.length}, MIME: ${mimeType}, File: ${fileName}`);

    return { buffer, mimeType, fileSize: buffer.length, fileName };
  }

  async delete(storageKey: string): Promise<boolean> {
    const auth = detectBlobAuth();
    const blobOptions = buildBlobCommandOptions(auth);

    // Resolve relative keys to full URLs for the SDK's del()
    // The SDK's del() accepts full Blob URLs
    let resolvedKey = storageKey;
    if (!isBlobUrl(storageKey)) {
      try {
        resolvedKey = resolveBlobUrl(storageKey, auth);
      } catch {
        console.warn(`[VercelBlob] Cannot resolve relative key for delete: ${storageKey}`);
        return false;
      }
    }

    console.log(`[VercelBlob] === DELETE START ===`);
    console.log(`[VercelBlob]   Auth method:      ${auth.method}`);
    console.log(`[VercelBlob]   Storage key: ${resolvedKey.slice(0, 100)}...`);
    try {
      await del(resolvedKey, blobOptions as Parameters<typeof del>[1] | undefined);
      console.log(`[VercelBlob] === DELETE SUCCESS ===`);
      return true;
    } catch (delError) {
      const errorClass = delError instanceof Error ? delError.constructor.name : typeof delError;
      const errorMessage = delError instanceof Error ? delError.message : String(delError);
      console.error(`[VercelBlob] === DELETE FAILED ===`);
      console.error(`[VercelBlob]   Error class: ${errorClass}`);
      console.error(`[VercelBlob]   Error message: ${errorMessage}`);
      console.error(`[VercelBlob]   Stack: ${delError instanceof Error ? delError.stack : "N/A"}`);
      return false;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const auth = detectBlobAuth();
    const blobOptions = buildBlobCommandOptions(auth);

    // Resolve relative keys to full URLs for the SDK's head()
    let resolvedKey = storageKey;
    if (!isBlobUrl(storageKey)) {
      try {
        resolvedKey = resolveBlobUrl(storageKey, auth);
      } catch {
        console.warn(`[VercelBlob] Cannot resolve relative key for exists check: ${storageKey}`);
        return false;
      }
    }

    console.log(`[VercelBlob] === EXISTS CHECK ===`);
    console.log(`[VercelBlob]   Auth method:      ${auth.method}`);
    console.log(`[VercelBlob]   Storage key: ${resolvedKey.slice(0, 100)}...`);
    try {
      const blobDetails = await head(resolvedKey, blobOptions as Parameters<typeof head>[1] | undefined);
      const exists = !!blobDetails;
      console.log(`[VercelBlob]   Result: ${exists}`);
      return exists;
    } catch (headError) {
      const errorClass = headError instanceof Error ? headError.constructor.name : typeof headError;
      const errorMessage = headError instanceof Error ? headError.message : String(headError);
      console.error(`[VercelBlob]   EXISTS CHECK FAILED: ${errorClass}: ${errorMessage}`);
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Storage Configuration Error — missing env vars, invalid setup
// ---------------------------------------------------------------------------

export class StorageConfigurationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "StorageConfigurationError";
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
