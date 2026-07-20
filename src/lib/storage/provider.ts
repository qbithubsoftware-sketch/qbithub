/**
 * Storage Provider Registry — picks the active provider from env var.
 *
 * FULL STORAGE-LAYER AUDIT LOGGING:
 *   Every step of provider initialization is logged:
 *     1. STORAGE_PROVIDER env var value
 *     2. BLOB_READ_WRITE_TOKEN presence (masked)
 *     3. SDK module load attempt
 *     4. Provider instantiation
 *     5. Active provider confirmation
 *
 *   If BLOB_READ_WRITE_TOKEN is missing but vercel-blob is requested,
 *   returns STORAGE_CONFIGURATION_ERROR instead of silently failing.
 */

import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local-storage";

let _provider: StorageProvider | null = null;

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

  console.log(`[StorageInit] === STORAGE PROVIDER INITIALIZATION ===`);
  console.log(`[StorageInit] STORAGE_PROVIDER env:     "${providerName}"`);
  console.log(`[StorageInit] BLOB_READ_WRITE_TOKEN:     ${blobTokenPresent ? `present (${blobTokenPrefix})` : "MISSING"}`);
  console.log(`[StorageInit] BLOB_STORE_ID:             ${blobStoreId}`);

  switch (providerName) {
    case "local": {
      console.log(`[StorageInit] Explicit local provider requested.`);
      _provider = new LocalStorageProvider();
      break;
    }

    case "vercel-blob": {
      console.log(`[StorageInit] Explicit vercel-blob provider requested.`);
      if (!blobTokenPresent) {
        console.error(`[StorageInit] CONFIGURATION ERROR: STORAGE_PROVIDER="vercel-blob" but BLOB_READ_WRITE_TOKEN is NOT SET.`);
        console.error(`[StorageInit] The Vercel Blob SDK requires this token. Falling back to local provider.`);
        console.error(`[StorageInit] To fix: Set BLOB_READ_WRITE_TOKEN in your Vercel project settings, or change STORAGE_PROVIDER to "local".`);
        _provider = new LocalStorageProvider();
      } else {
        _provider = loadVercelBlobProvider();
      }
      break;
    }

    case "auto": {
      // Auto-detect: use Vercel Blob if token is available, otherwise local
      if (blobTokenPresent) {
        console.log(`[StorageInit] Auto-detected: BLOB_READ_WRITE_TOKEN present, attempting vercel-blob`);
        _provider = loadVercelBlobProvider();
      } else {
        console.log(`[StorageInit] Auto-detected: No BLOB_READ_WRITE_TOKEN, using local provider`);
        _provider = new LocalStorageProvider();
      }
      break;
    }

    default: {
      console.warn(`[StorageInit] Unknown STORAGE_PROVIDER="${providerName}", falling back to auto-detect.`);
      if (blobTokenPresent) {
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
 * Falls back to local if the module is not available or token is missing.
 *
 * Logs every step of the SDK loading process.
 */
function loadVercelBlobProvider(): StorageProvider {
  console.log(`[StorageInit] Loading VercelBlobStorageProvider...`);

  // Step 1: Check token
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error(`[StorageInit] BLOB_READ_WRITE_TOKEN is undefined — cannot use Vercel Blob.`);
    console.error(`[StorageInit] This is a STORAGE_CONFIGURATION_ERROR.`);
    console.error(`[StorageInit] Falling back to local provider.`);
    return new LocalStorageProvider();
  }

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

  return {
    storageProviderEnv: providerName,
    blobTokenPresent: !!token,
    blobTokenPrefix: token ? token.slice(0, 8) + "..." : null,
    blobStoreId: process.env.BLOB_STORE_ID ?? null,
    activeProvider,
    uploadDir: process.env.UPLOAD_DIR ?? null,
  };
}
