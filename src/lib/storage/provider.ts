/**
 * Storage Provider Registry — picks the active provider from env var.
 *
 * Set STORAGE_PROVIDER env var to switch providers:
 *   - "local" (default) → LocalStorageProvider (writes to data/uploads/resources/)
 *   - "vercel-blob" → VercelBlobStorageProvider (Vercel Blob Storage, CDN-backed)
 *   - Future: "s3", "r2", "supabase", "azure", "gcs"
 *
 * Changing providers requires only changing the env var — no code changes.
 * The Global Resources Library UI never changes.
 *
 * HOSTING INDEPENDENCE:
 *   - "local" works on ANY Node.js host (VPS, Docker, bare metal, shared hosting)
 *   - "vercel-blob" is Vercel-specific but optional
 *   - The app NEVER requires a specific storage provider
 *
 * IMPORTANT for serverless deployments (Vercel, AWS Lambda, etc.):
 *   The "local" provider stores files in data/uploads/resources/ which is
 *   EPHEMERAL on serverless — files are lost on cold starts.
 *   For production on serverless, use a persistent provider (vercel-blob, s3, etc.).
 *   For production on persistent hosts (VPS, Docker, bare metal), "local" works perfectly.
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

  const providerName = process.env.STORAGE_PROVIDER ?? "local";

  switch (providerName) {
    case "local":
      _provider = new LocalStorageProvider();
      break;
    case "vercel-blob": {
      // Dynamic import to avoid loading @vercel/blob where it's not needed
      try {
        const { VercelBlobStorageProvider } = require("./vercel-blob-storage");
        _provider = new VercelBlobStorageProvider();
      } catch (err) {
        console.error(
          `[StorageService] Failed to load VercelBlobStorageProvider. Falling back to local. Error: ${err instanceof Error ? err.message : String(err)}`,
        );
        _provider = new LocalStorageProvider();
      }
      break;
    }
    // Future providers — add here when implemented:
    // case "s3":
    //   const { S3StorageProvider } = require("./s3-storage");
    //   _provider = new S3StorageProvider();
    //   break;
    // case "r2":
    //   const { CloudflareR2Provider } = require("./r2-storage");
    //   _provider = new CloudflareR2Provider();
    //   break;
    // case "supabase":
    //   const { SupabaseStorageProvider } = require("./supabase-storage");
    //   _provider = new SupabaseStorageProvider();
    //   break;
    default:
      console.warn(`[StorageService] Unknown STORAGE_PROVIDER="${providerName}", falling back to "local".`);
      _provider = new LocalStorageProvider();
  }

  const provider = _provider!;
  console.log(`[StorageService] Active provider: ${provider.name}`);
  return provider;
}

/**
 * Reset the provider singleton (useful for testing or dynamic switching).
 */
export function resetStorageProvider(): void {
  _provider = null;
}
