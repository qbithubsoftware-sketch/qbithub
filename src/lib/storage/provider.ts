/**
 * Storage Provider Registry — picks the active provider from env var.
 *
 * Set STORAGE_PROVIDER env var to switch providers:
 *   - "local" (default) → LocalStorageProvider (writes to public/uploads/resources/)
 *   - "supabase" → SupabaseStorageProvider (future)
 *   - "s3" → S3StorageProvider (future)
 *   - "r2" → CloudflareR2Provider (future)
 *
 * Changing providers requires only changing the env var — no code changes.
 * The Global Resources Library UI never changes.
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

  console.log(`[StorageService] Active provider: ${_provider.name}`);
  return _provider;
}
