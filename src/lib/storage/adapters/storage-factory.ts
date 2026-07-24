/**
 * Storage Factory — selects the active StorageAdapter based on env vars.
 *
 * SWITCHING HOSTING:
 *   Changing storage hosting requires ONLY env var changes:
 *
 *   STORAGE_PROVIDER=local       → local filesystem (default for dev)
 *   STORAGE_PROVIDER=vercel-blob → Vercel Blob CDN storage
 *   STORAGE_PROVIDER=s3          → AWS S3 / Cloudflare R2 / DigitalOcean Spaces / MinIO
 *
 *   For S3, also configure:
 *     S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY
 *
 *   For Vercel Blob, also configure:
 *     BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN
 *
 *   For local, optionally configure:
 *     STORAGE_LOCAL_PATH or UPLOAD_DIR (custom writable directory)
 *
 * BACKWARD COMPATIBILITY:
 *   The existing getStorageProvider() function (from provider.ts) continues
 *   to work for code that uses the StorageProvider interface. This factory
 *   provides the NEW StorageAdapter interface which adds signedUrl(),
 *   getMetadata(), and structured FileMetadata.
 *
 *   Both systems coexist — existing code is NOT broken.
 */

import type { StorageAdapter } from "./storage-adapter";
import { StorageAdapterError } from "./storage-adapter";
import { LocalStorageAdapter } from "./local-adapter";
import { VercelBlobAdapter } from "./vercel-blob-adapter";
import { S3StorageAdapter } from "./s3-adapter";

let _adapter: StorageAdapter | null = null;

/**
 * Get the active StorageAdapter.
 * Lazily initialized on first call based on STORAGE_PROVIDER env var.
 *
 * Provider selection logic:
 *   1. STORAGE_PROVIDER=local → LocalStorageAdapter (dev/self-hosted)
 *   2. STORAGE_PROVIDER=vercel-blob → VercelBlobAdapter (Vercel platform)
 *   3. STORAGE_PROVIDER=s3 → S3StorageAdapter (AWS/R2/Spaces/MinIO)
 *   4. STORAGE_PROVIDER=auto (default) → auto-detect based on available credentials
 *   5. Any other value → auto-detect with a warning
 */
export function getStorageAdapter(): StorageAdapter {
  if (_adapter) return _adapter;

  const provider = (process.env.STORAGE_PROVIDER || "auto").toLowerCase();

  console.log(`[StorageFactory] === SELECTING STORAGE ADAPTER ===`);
  console.log(`[StorageFactory] STORAGE_PROVIDER env: "${provider}"`);

  switch (provider) {
    case "local": {
      console.log(`[StorageFactory] Explicit local adapter requested.`);
      _adapter = new LocalStorageAdapter();
      break;
    }

    case "vercel-blob": {
      console.log(`[StorageFactory] Explicit vercel-blob adapter requested.`);
      _adapter = new VercelBlobAdapter();
      break;
    }

    case "s3": {
      console.log(`[StorageFactory] Explicit S3 adapter requested.`);
      // Validate S3 configuration before creating the adapter
      const requiredVars = ["S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_BUCKET"];
      const missing = requiredVars.filter((v) => !process.env[v]);
      if (missing.length > 0) {
        console.error(`[StorageFactory] S3 configuration incomplete. Missing: ${missing.join(", ")}`);
        console.error(`[StorageFactory] Falling back to local adapter.`);
        _adapter = new LocalStorageAdapter();
      } else {
        _adapter = new S3StorageAdapter();
      }
      break;
    }

    case "auto": {
      // Auto-detect: prefer Vercel Blob if credentials are available, then S3, then local
      const hasBlobCreds = !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.BLOB_STORE_ID;
      const hasS3Creds = !!process.env.S3_ACCESS_KEY && !!process.env.S3_SECRET_KEY && !!process.env.S3_BUCKET;

      if (hasBlobCreds) {
        console.log(`[StorageFactory] Auto-detected: Vercel Blob credentials available.`);
        _adapter = new VercelBlobAdapter();
      } else if (hasS3Creds) {
        console.log(`[StorageFactory] Auto-detected: S3 credentials available.`);
        _adapter = new S3StorageAdapter();
      } else {
        console.log(`[StorageFactory] Auto-detected: No cloud credentials, using local adapter.`);
        _adapter = new LocalStorageAdapter();
      }
      break;
    }

    default: {
      console.warn(`[StorageFactory] Unknown STORAGE_PROVIDER="${provider}". Falling back to auto-detect.`);
      const hasBlobCreds = !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.BLOB_STORE_ID;
      const hasS3Creds = !!process.env.S3_ACCESS_KEY && !!process.env.S3_SECRET_KEY && !!process.env.S3_BUCKET;

      if (hasBlobCreds) {
        _adapter = new VercelBlobAdapter();
      } else if (hasS3Creds) {
        _adapter = new S3StorageAdapter();
      } else {
        _adapter = new LocalStorageAdapter();
      }
    }
  }

  console.log(`[StorageFactory] === ACTIVE ADAPTER: ${_adapter!.name} ===`);
  return _adapter!;
}

/**
 * Reset the adapter singleton (for testing or dynamic switching).
 */
export function resetStorageAdapter(): void {
  _adapter = null;
}

/**
 * Get diagnostic info about the current storage configuration.
 * Useful for health check endpoints and debugging.
 */
export function getStorageAdapterDiagnostics(): Record<string, unknown> {
  const provider = (process.env.STORAGE_PROVIDER || "auto").toLowerCase();
  const activeAdapter = _adapter?.name ?? "not initialized";

  return {
    storageProviderEnv: provider,
    activeAdapter,
    // Local adapter config
    storageLocalPath: process.env.STORAGE_LOCAL_PATH ?? null,
    uploadDir: process.env.UPLOAD_DIR ?? null,
    // Vercel Blob config
    blobReadWriteTokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN,
    blobReadWriteTokenPrefix: process.env.BLOB_READ_WRITE_TOKEN
      ? process.env.BLOB_READ_WRITE_TOKEN.slice(0, 8) + "..."
      : null,
    blobStoreId: process.env.BLOB_STORE_ID ?? null,
    // S3 config
    s3Endpoint: process.env.S3_ENDPOINT ?? null,
    s3Region: process.env.S3_REGION ?? null,
    s3Bucket: process.env.S3_BUCKET ?? null,
    s3AccessKeyPresent: !!process.env.S3_ACCESS_KEY,
    s3SecretKeyPresent: !!process.env.S3_SECRET_KEY,
    s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE ?? null,
  };
}
