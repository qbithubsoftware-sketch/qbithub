/**
 * Storage Provider Registry — picks the active provider from env var.
 *
 * Set STORAGE_PROVIDER env var to switch providers:
 *   - "local" (default) → LocalStorageProvider (writes to public/uploads/resources/)
 *   - "vercel-blob" → VercelBlobStorageProvider (Vercel Blob Storage, CDN-backed)
 *   - "supabase" → SupabaseStorageProvider (future)
 *   - "s3" → S3StorageProvider (future)
 *   - "r2" → CloudflareR2Provider (future)
 *
 * Changing providers requires only changing the env var — no code changes.
 * The Global Resources Library UI never changes.
 *
 * IMPORTANT for Vercel deployments:
 *   The "local" provider is EPHEMERAL on Vercel — files written to public/
 *   are lost on serverless cold starts. Use "vercel-blob" for production.
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
      // Dynamic import to avoid loading @vercel/blob in local dev
      // where it's not needed and the token isn't set
      const { VercelBlobStorageProvider } = require("./vercel-blob-storage");
      _provider = new VercelBlobStorageProvider();
      break;
    }
    // Future providers:
    // case "supabase":
    //   _provider = new SupabaseStorageProvider();
    //   break;
    // case "s3":
    //   _provider = new S3StorageProvider();
    //   break;
    // case "r2":
    //   _provider = new CloudflareR2Provider();
    //   break;
    default:
      console.warn(`[StorageService] Unknown STORAGE_PROVIDER="${providerName}", falling back to "local".`);
      _provider = new LocalStorageProvider();
  }

  // TypeScript narrowing: after the switch, _provider is always set
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
