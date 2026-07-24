/**
 * Barrel export for the Storage Adapter module.
 *
 * This module provides the hosting-agnostic storage abstraction layer.
 * All code that needs to interact with file storage should use these
 * interfaces, NOT the legacy StorageProvider directly.
 *
 * QUICK START:
 *   import { getStorageAdapter } from "@/lib/storage/adapters";
 *   const adapter = getStorageAdapter();
 *   const result = await adapter.upload("key", buffer, { contentType: "application/pdf" });
 */

// Core interfaces and types — use 'export type' for interfaces to satisfy isolatedModules
export type { StorageAdapter, FileMetadata, UploadResult } from "./storage-adapter";
export { StorageAdapterError } from "./storage-adapter";

// Adapter implementations
export { LocalStorageAdapter } from "./local-adapter";
export { VercelBlobAdapter } from "./vercel-blob-adapter";
export { S3StorageAdapter, resetS3Client } from "./s3-adapter";

// Factory and diagnostics
export { getStorageAdapter, resetStorageAdapter, getStorageAdapterDiagnostics } from "./storage-factory";
