/**
 * Vercel Blob Storage Provider — stores files in Vercel Blob Storage.
 *
 * AUTHENTICATION MIGRATION (SDK v2.6.1):
 *   The @vercel/blob SDK now supports multiple authentication methods.
 *   BLOB_READ_WRITE_TOKEN is the LEGACY method. The current recommended
 *   method on Vercel is OIDC authentication, which uses:
 *     - BLOB_STORE_ID (set automatically by the Vercel integration)
 *     - OIDC tokens (auto-provisioned by the Vercel runtime via @vercel/oidc)
 *
 *   The SDK's resolveBlobAuth() priority chain is:
 *     1. options.presignedUrlPayload — presigned/delegated access
 *     2. options.token — explicit read-write token (legacy)
 *     3. OIDC (auto from @vercel/oidc) + BLOB_STORE_ID — CURRENT recommended
 *     4. BLOB_READ_WRITE_TOKEN env var — legacy fallback
 *
 *   Our code now lets the SDK handle auth resolution instead of
 *   demanding BLOB_READ_WRITE_TOKEN. We detect which auth method
 *   is available and pass the appropriate options to put()/head()/del().
 *
 * DIAGNOSTIC LOGGING:
 *   Every method logs before AND after each operation with the resolved
 *   auth method, token presence, SDK function calls, and full error details.
 *
 * ERROR HANDLING:
 *   - No credentials at all → STORAGE_CONFIGURATION_ERROR with specific guidance
 *   - Vercel SDK errors (BlobAccessError, BlobStoreNotFoundError, etc.)
 *     are caught, their original class preserved, and re-thrown with
 *     full stack traces — NEVER wrapped as generic "Access denied"
 *   - Network errors are caught with their original class
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
    storeId = blobStoreId!;
    description = `OIDC (auto on Vercel) + BLOB_STORE_ID="${blobStoreId}"`;
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
 * Parse store ID from a read-write token.
 * Token format: vercel_blob_rw_<storeId>_<random>
 */
function parseStoreIdFromToken(token: string): string | null {
  try {
    const parts = token.split("_");
    // Format: vercel_blob_rw_<storeId>_<random>
    // storeId is at index 3
    if (parts.length >= 4 && parts[0] === "vercel" && parts[1] === "blob" && parts[2] === "rw") {
      return parts[3];
    }
    return null;
  } catch {
    return null;
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
      // The caller (StorageService) will handle it
      throw sdkError;
    }

    return {
      storageKey: blob.url,
      fileName: uniqueName,
      originalFileName,
      mimeType,
      fileSize: buffer.length,
    };
  }

  async download(storageKey: string): Promise<DownloadResult> {
    const auth = detectBlobAuth();
    const blobOptions = buildBlobCommandOptions(auth);

    console.log(`[VercelBlob] === DOWNLOAD START ===`);
    console.log(`[VercelBlob]   Auth method:      ${auth.method}`);
    console.log(`[VercelBlob]   Storage key (URL): ${storageKey.slice(0, 80)}...`);

    let response: Response;
    try {
      response = await fetch(storageKey, { method: "GET" });
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
      console.error(`[VercelBlob]   URL: ${storageKey.slice(0, 80)}...`);
      throw new Error(errMsg);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const urlPath = new URL(storageKey).pathname;
    const fileName = path.basename(urlPath);
    const ext = getExtension(fileName);
    const mimeType = MIME_FROM_EXT[ext] || contentType;

    console.log(`[VercelBlob] === DOWNLOAD SUCCESS ===`);
    console.log(`[VercelBlob]   Bytes: ${buffer.length}, MIME: ${mimeType}`);

    return { buffer, mimeType, fileSize: buffer.length, fileName };
  }

  async delete(storageKey: string): Promise<boolean> {
    const auth = detectBlobAuth();
    const blobOptions = buildBlobCommandOptions(auth);

    console.log(`[VercelBlob] === DELETE START ===`);
    console.log(`[VercelBlob]   Auth method:      ${auth.method}`);
    console.log(`[VercelBlob]   Storage key: ${storageKey.slice(0, 80)}...`);
    try {
      await del(storageKey, blobOptions as Parameters<typeof del>[1] | undefined);
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

    console.log(`[VercelBlob] === EXISTS CHECK ===`);
    console.log(`[VercelBlob]   Auth method:      ${auth.method}`);
    console.log(`[VercelBlob]   Storage key: ${storageKey.slice(0, 80)}...`);
    try {
      const blobDetails = await head(storageKey, blobOptions as Parameters<typeof head>[1] | undefined);
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
