/**
 * Storage Provider Registry — picks the active provider from env var.
 *
 * AUTHENTICATION MIGRATION (SDK v2.6.1):
 *   The @vercel/blob SDK now supports OIDC authentication via
 *   BLOB_STORE_ID + auto-provisioned OIDC tokens on Vercel.
 *   BLOB_READ_WRITE_TOKEN is the LEGACY method.
 *
 *   Provider selection now checks for EITHER:
 *     - OIDC-ready: BLOB_STORE_ID present + Vercel runtime (OIDC auto)
 *     - Legacy:     BLOB_READ_WRITE_TOKEN present
 *
 *   This matches the SDK's resolveBlobAuth() priority chain.
 *
 * DIAGNOSTIC LOGGING:
 *   Every step of provider initialization is logged:
 *     1. STORAGE_PROVIDER env var value
 *     2. BLOB_STORE_ID presence
 *     3. BLOB_READ_WRITE_TOKEN presence (masked)
 *     4. OIDC availability (Vercel runtime detection)
 *     5. Auth detection result (which method the SDK will use)
 *     6. SDK module load attempt
 *     7. Provider instantiation
 *     8. Active provider confirmation
 */

import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local-storage";
import { detectBlobAuth, type BlobAuthDetection } from "./vercel-blob-storage";

let _provider: StorageProvider | null = null;

/**
 * Check if Vercel Blob is usable — either OIDC or legacy token.
 * Returns the auth detection result if usable, null if not.
 */
function checkBlobCredentials(): BlobAuthDetection | null {
  const auth = detectBlobAuth();
  if (auth.method !== "none") {
    return auth;
  }
  return null;
}

/**
 * Get the active storage provider.
 * Lazily initialized on first call.
 *
 * Logs EVERY step of the initialization process for debugging.
 */
export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider;

  const providerName = (process.env.STORAGE_PROVIDER ?? "auto").toLowerCase();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const blobTokenPresent = !!blobToken;
  const blobTokenPrefix = blobToken ? blobToken.slice(0, 8) + "..." : "(not set)";
  const blobStoreId = process.env.BLOB_STORE_ID ?? "(not set)";
  const isVercelRuntime = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL);

  // Detect auth capabilities
  const auth = detectBlobAuth();
  const blobUsable = auth.method !== "none";

  console.log(`[StorageInit] === STORAGE PROVIDER INITIALIZATION ===`);
  console.log(`[StorageInit] STORAGE_PROVIDER env:     "${providerName}"`);
  console.log(`[StorageInit] BLOB_READ_WRITE_TOKEN:     ${blobTokenPresent ? `present (${blobTokenPrefix})` : "MISSING"}`);
  console.log(`[StorageInit] BLOB_STORE_ID:             ${blobStoreId}`);
  console.log(`[StorageInit] Vercel Runtime:            ${isVercelRuntime ? "YES" : "NO"}`);
  console.log(`[StorageInit] Auth Detection:            ${auth.method} — ${auth.description}`);
  console.log(`[StorageInit] Blob Usable:               ${blobUsable}`);

  switch (providerName) {
    case "local": {
      console.log(`[StorageInit] Explicit local provider requested.`);
      _provider = new LocalStorageProvider();
      break;
    }

    case "vercel-blob": {
      console.log(`[StorageInit] Explicit vercel-blob provider requested.`);
      if (!blobUsable) {
        console.error(`[StorageInit] CONFIGURATION ERROR: STORAGE_PROVIDER="vercel-blob" but no blob credentials found.`);
        console.error(`[StorageInit] The @vercel/blob SDK (v2.6.1+) requires one of:`);
        console.error(`[StorageInit]   1. OIDC auth: BLOB_STORE_ID env var (auto on Vercel runtime)`);
        console.error(`[StorageInit]   2. Legacy auth: BLOB_READ_WRITE_TOKEN env var`);
        console.error(`[StorageInit] Neither was found. Falling back to local provider.`);
        console.error(`[StorageInit] To fix: Set BLOB_STORE_ID (recommended) or BLOB_READ_WRITE_TOKEN, or use STORAGE_PROVIDER="local".`);
        _provider = new LocalStorageProvider();
      } else {
        _provider = loadVercelBlobProvider();
      }
      break;
    }

    case "auto": {
      // Auto-detect: use Vercel Blob if credentials are available, otherwise local
      if (blobUsable) {
        console.log(`[StorageInit] Auto-detected: Blob credentials available (${auth.method}), attempting vercel-blob`);
        _provider = loadVercelBlobProvider();
      } else {
        console.log(`[StorageInit] Auto-detected: No blob credentials, using local provider`);
        _provider = new LocalStorageProvider();
      }
      break;
    }

    default: {
      console.warn(`[StorageInit] Unknown STORAGE_PROVIDER="${providerName}", falling back to auto-detect.`);
      if (blobUsable) {
        _provider = loadVercelBlobProvider();
      } else {
        _provider = new LocalStorageProvider();
      }
    }
  }

  const provider = _provider!;
  console.log(`[StorageInit] === ACTIVE PROVIDER: ${provider.name} ===`);
  return provider;
}

/**
 * Load the Vercel Blob storage provider.
 * Falls back to local if the module is not available.
 *
 * Logs every step of the SDK loading process.
 */
function loadVercelBlobProvider(): StorageProvider {
  console.log(`[StorageInit] Loading VercelBlobStorageProvider...`);

  // Step 1: Verify credentials (already checked by caller, but double-check)
  const auth = detectBlobAuth();
  if (auth.method === "none") {
    console.error(`[StorageInit] No blob credentials found — cannot use Vercel Blob.`);
    console.error(`[StorageInit] This is a STORAGE_CONFIGURATION_ERROR.`);
    console.error(`[StorageInit] Falling back to local provider.`);
    return new LocalStorageProvider();
  }

  console.log(`[StorageInit] Auth method: ${auth.method} — ${auth.description}`);

  // Step 2: Try to load the SDK module
  let blobModule: typeof import("@vercel/blob") | null = null;
  try {
    blobModule = require("@vercel/blob");
    console.log(`[StorageInit] @vercel/blob SDK loaded successfully.`);
    console.log(`[StorageInit] SDK exports: put=${typeof blobModule!.put}, del=${typeof blobModule!.del}, head=${typeof blobModule!.head}`);
  } catch (loadErr) {
    console.error(`[StorageInit] Failed to load @vercel/blob module.`);
    console.error(`[StorageInit] Error: ${loadErr instanceof Error ? loadErr.message : String(loadErr)}`);
    console.error(`[StorageInit] Stack: ${loadErr instanceof Error ? loadErr.stack : "N/A"}`);
    console.error(`[StorageInit] Is @vercel/blob installed? Run: npm install @vercel/blob`);
    console.error(`[StorageInit] Falling back to local provider.`);
    return new LocalStorageProvider();
  }

  // Step 3: Verify the SDK has the required functions
  if (!blobModule || typeof blobModule.put !== "function") {
    console.error(`[StorageInit] @vercel/blob loaded but "put" function is missing or not a function.`);
    console.error(`[StorageInit] put type: ${typeof blobModule?.put}`);
    console.error(`[StorageInit] Falling back to local provider.`);
    return new LocalStorageProvider();
  }

  // Step 4: Instantiate the provider
  try {
    const { VercelBlobStorageProvider } = require("./vercel-blob-storage");
    const provider = new VercelBlobStorageProvider();
    console.log(`[StorageInit] VercelBlobStorageProvider instantiated successfully.`);
    console.log(`[StorageInit] Provider name: ${provider.name}`);
    return provider;
  } catch (instantiationErr) {
    console.error(`[StorageInit] Failed to instantiate VercelBlobStorageProvider.`);
    console.error(`[StorageInit] Error: ${instantiationErr instanceof Error ? instantiationErr.message : String(instantiationErr)}`);
    console.error(`[StorageInit] Stack: ${instantiationErr instanceof Error ? instantiationErr.stack : "N/A"}`);
    console.error(`[StorageInit] Falling back to local provider.`);
    return new LocalStorageProvider();
  }
}

/**
 * Reset the provider singleton (useful for testing or dynamic switching).
 */
export function resetStorageProvider(): void {
  _provider = null;
}

/**
 * Get diagnostic info about the current storage configuration.
 * Useful for health check endpoints and debugging.
 */
export function getStorageDiagnostics(): Record<string, unknown> {
  const providerName = (process.env.STORAGE_PROVIDER ?? "auto").toLowerCase();
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const activeProvider = _provider?.name ?? "not initialized";
  const auth = detectBlobAuth();

  return {
    storageProviderEnv: providerName,
    authMethod: auth.method,
    authDescription: auth.description,
    blobTokenPresent: !!token,
    blobTokenPrefix: token ? token.slice(0, 8) + "..." : null,
    blobStoreId: process.env.BLOB_STORE_ID ?? null,
    hasOidcToken: auth.hasOidcToken,
    isVercelRuntime: !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL),
    activeProvider,
    uploadDir: process.env.UPLOAD_DIR ?? null,
  };
}
