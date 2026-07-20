/**
 * Storage Provider Registry — picks the active provider from env var.
 *
 * Set STORAGE_PROVIDER env var to switch providers:
 *   - "local" (default) → LocalStorageProvider (auto-detects writable directory)
 *   - "vercel-blob" → VercelBlobStorageProvider (Vercel Blob Storage, CDN-backed)
 *   - "auto" → Auto-detects the best provider for the current environment
 *   - Future: "s3", "r2", "supabase", "azure", "gcs"
 *
 * AUTO-DETECTION ("auto" or when STORAGE_PROVIDER is not set):
 *   1. If BLOB_READ_WRITE_TOKEN is set → vercel-blob (persistent on Vercel)
 *   2. Otherwise → local (works on any Node.js host)
 *
 * HOSTING INDEPENDENCE:
 *   - "local" works on ANY Node.js host (VPS, Docker, bare metal, shared hosting)
 *   - "vercel-blob" is Vercel-specific but optional
 *   - The app NEVER requires a specific storage provider
 *
 * IMPORTANT for serverless deployments (Vercel, AWS Lambda, etc.):
 *   The "local" provider auto-detects the writable directory:
 *   - VPS/Docker: data/uploads/resources/ (persistent)
 *   - Serverless: /tmp/qbit-uploads/resources/ (ephemeral)
 *   For persistent storage on serverless, use vercel-blob or a cloud provider.
 */

import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local-storage";

let _provider: StorageProvider | null = null;

/**
 * Get the active storage provider.
 * Lazily initialized on first call.
 */
export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider;

  const providerName = (process.env.STORAGE_PROVIDER ?? "auto").toLowerCase();

  switch (providerName) {
    case "local":
      _provider = new LocalStorageProvider();
      break;

    case "vercel-blob": {
      _provider = loadVercelBlobProvider();
      break;
    }

    case "auto": {
      // Auto-detect: use Vercel Blob if token is available, otherwise local
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        console.log("[StorageService] Auto-detected: BLOB_READ_WRITE_TOKEN present, using vercel-blob");
        _provider = loadVercelBlobProvider();
      } else {
        console.log("[StorageService] Auto-detected: No cloud storage token, using local provider");
        _provider = new LocalStorageProvider();
      }
      break;
    }

    // Future providers — add here when implemented:
    // case "s3":
    //   const { S3StorageProvider } = require("./s3-storage");
    //   _provider = new S3StorageProvider();
    //   break;

    default:
      console.warn(`[StorageService] Unknown STORAGE_PROVIDER="${providerName}", falling back to auto-detect.`);
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        _provider = loadVercelBlobProvider();
      } else {
        _provider = new LocalStorageProvider();
      }
  }

  const provider = _provider!;
  console.log(`[StorageService] Active provider: ${provider.name}`);
  return provider;
}

/**
 * Load the Vercel Blob storage provider.
 * Falls back to local if the module is not available.
 */
function loadVercelBlobProvider(): StorageProvider {
  try {
    const { VercelBlobStorageProvider } = require("./vercel-blob-storage");
    return new VercelBlobStorageProvider();
  } catch (err) {
    console.error(
      `[StorageService] Failed to load VercelBlobStorageProvider. Falling back to local. Error: ${err instanceof Error ? err.message : String(err)}`,
    );
    return new LocalStorageProvider();
  }
}

/**
 * Reset the provider singleton (useful for testing or dynamic switching).
 */
export function resetStorageProvider(): void {
  _provider = null;
}
