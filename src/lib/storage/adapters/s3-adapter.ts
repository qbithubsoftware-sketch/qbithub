/**
 * S3 Storage Adapter — AWS S3 / Cloudflare R2 / DigitalOcean Spaces / MinIO.
 *
 * This adapter uses the AWS SDK v3 (@aws-sdk/client-s3) for all operations.
 * It works with ANY S3-compatible provider by changing env vars:
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ Provider              │ Env vars to set                         │
 *   ├───────────────────────┼─────────────────────────────────────────┤
 *   │ AWS S3                │ S3_REGION, S3_BUCKET, S3_ACCESS_KEY,    │
 *   │                       │ S3_SECRET_KEY                           │
 *   ├───────────────────────┼─────────────────────────────────────────┤
 *   │ Cloudflare R2         │ S3_ENDPOINT=https://<account>.r2.cloud │
 *   │                       │ .flarestor.com, S3_REGION=auto,         │
 *   │                       │ S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY│
 *   ├───────────────────────┼─────────────────────────────────────────┤
 *   │ DigitalOcean Spaces   │ S3_ENDPOINT=https://<region>.digitalo  │
 *   │                       │ .spaces.com, S3_REGION=<region>,        │
 *   │                       │ S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY│
 *   ├───────────────────────┼─────────────────────────────────────────┤
 *   │ MinIO                 │ S3_ENDPOINT=http://localhost:9000,      │
 *   │                       │ S3_REGION=us-east-1, S3_BUCKET,         │
 *   │                       │ S3_ACCESS_KEY, S3_SECRET_KEY            │
 *   └───────────────────────┴─────────────────────────────────────────┘
 *
 * SWITCHING HOSTING:
 *   Changing storage hosting requires ONLY env var changes.
 *   No code changes needed — just set STORAGE_PROVIDER=s3 and configure
 *   the S3_* env vars for your provider.
 *
 * UPLOAD PATH:
 *   Files are stored under: resources/<timestamp>-<random6>-<sanitized-name>
 *   This matches the local adapter's key format for consistency.
 */

import type { StorageAdapter, FileMetadata, UploadResult } from "./storage-adapter";
import { StorageAdapterError } from "./storage-adapter";
import { sanitizeFileName, getExtension, MIME_FROM_EXT } from "../types";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// S3 Client configuration — hosting-agnostic
// ---------------------------------------------------------------------------

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (_s3Client) return _s3Client;

  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "us-east-1";
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true" || !!endpoint;

  if (!accessKey || !secretKey) {
    throw new StorageAdapterError(
      "STORAGE_CONFIGURATION_ERROR",
      "S3 credentials not configured. Set S3_ACCESS_KEY and S3_SECRET_KEY environment variables.",
      { missingVars: accessKey ? ["S3_SECRET_KEY"] : ["S3_ACCESS_KEY", "S3_SECRET_KEY"] },
    );
  }

  const clientConfig = {
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle,
    ...(endpoint ? { endpoint } : {}),
  };

  _s3Client = new S3Client(clientConfig);

  console.log(`[S3Adapter] S3 client initialized: region=${region}, endpoint=${endpoint || "(AWS default)"}, forcePathStyle=${forcePathStyle}`);
  return _s3Client;
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new StorageAdapterError(
      "STORAGE_CONFIGURATION_ERROR",
      "S3 bucket not configured. Set S3_BUCKET environment variable.",
      { missingVar: "S3_BUCKET" },
    );
  }
  return bucket;
}

// ---------------------------------------------------------------------------
// S3StorageAdapter
// ---------------------------------------------------------------------------

export class S3StorageAdapter implements StorageAdapter {
  readonly name = "s3";

  async upload(key: string, data: Buffer, metadata?: FileMetadata): Promise<UploadResult> {
    const client = getS3Client();
    const bucket = getBucket();

    const originalName = metadata?.originalName ?? key;
    const sanitized = sanitizeFileName(originalName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${sanitized}`;
    const s3Key = `resources/${uniqueName}`;
    const mimeType = metadata?.contentType ?? MIME_FROM_EXT[getExtension(originalName)] ?? "application/octet-stream";

    // Compute checksum before upload
    const checksum = crypto.createHash("sha256").update(data).digest("hex");

    console.log(`[S3Adapter] UPLOAD: ${originalName} → s3://${bucket}/${s3Key} (${data.length} bytes)`);

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: data,
        ContentType: mimeType,
        Metadata: {
          originalName,
          checksum,
          uploadedAt: new Date().toISOString(),
        },
      });

      await client.send(command);

      console.log(`[S3Adapter] UPLOAD SUCCESS: s3://${bucket}/${s3Key}`);
    } catch (s3Error) {
      const errorMessage = s3Error instanceof Error ? s3Error.message : String(s3Error);
      console.error(`[S3Adapter] UPLOAD FAILED: ${errorMessage}`);
      throw new StorageAdapterError(
        "UPLOAD_FAILED",
        `S3 upload failed: ${errorMessage}`,
        { key: s3Key, bucket, originalError: errorMessage },
      );
    }

    // Build public URL if the bucket has public access or a custom endpoint
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || "us-east-1";
    let url: string | null = null;

    if (endpoint) {
      // Custom endpoint (R2, Spaces, MinIO) — construct URL from endpoint
      url = `${endpoint}/${bucket}/${s3Key}`;
    } else {
      // AWS S3 standard URL
      url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
    }

    return {
      key: s3Key,
      url,
      size: data.length,
      contentType: mimeType,
      checksum,
      originalName,
      provider: this.name,
    };
  }

  async download(key: string): Promise<Buffer | null> {
    const client = getS3Client();
    const bucket = getBucket();

    console.log(`[S3Adapter] DOWNLOAD: s3://${bucket}/${key}`);

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await client.send(command);

      if (!response.Body) {
        console.error(`[S3Adapter] DOWNLOAD FAILED: No body in response for ${key}`);
        return null;
      }

      const bytes = await response.Body.transformToByteArray();
      const buffer = Buffer.from(bytes);

      console.log(`[S3Adapter] DOWNLOAD SUCCESS: ${key} (${buffer.length} bytes)`);
      return buffer;
    } catch (s3Error) {
      const errorName = s3Error instanceof Error ? s3Error.name : "Unknown";
      const errorMessage = s3Error instanceof Error ? s3Error.message : String(s3Error);

      // NoSuchKey is the expected error for missing files — return null instead of throwing
      if (errorName === "NoSuchKey" || errorName === "NotFound" || errorMessage.includes("404") || errorMessage.includes("NoSuchKey")) {
        console.warn(`[S3Adapter] DOWNLOAD: Key not found in S3: ${key}`);
        return null;
      }

      console.error(`[S3Adapter] DOWNLOAD FAILED: ${errorName}: ${errorMessage}`);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    const client = getS3Client();
    const bucket = getBucket();

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await client.send(command);
      console.log(`[S3Adapter] DELETED: s3://${bucket}/${key}`);
      return true;
    } catch (s3Error) {
      const errorMessage = s3Error instanceof Error ? s3Error.message : String(s3Error);
      console.error(`[S3Adapter] DELETE FAILED: ${errorMessage}`);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const client = getS3Client();
    const bucket = getBucket();

    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await client.send(command);
      return true;
    } catch (s3Error) {
      const errorName = s3Error instanceof Error ? s3Error.name : "Unknown";
      // NotFound / NoSuchKey means the file doesn't exist
      if (errorName === "NotFound" || errorName === "NoSuchKey") {
        return false;
      }
      // Other errors (e.g. access denied) — conservatively return false
      return false;
    }
  }

  async signedUrl(key: string, expiresIn?: number): Promise<string> {
    const client = getS3Client();
    const bucket = getBucket();
    const expirationSeconds = expiresIn ?? 3600; // Default 1 hour

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const url = await getSignedUrl(client, command, { expiresIn: expirationSeconds });
      console.log(`[S3Adapter] SIGNED_URL: ${key} (expires in ${expirationSeconds}s)`);
      return url;
    } catch (s3Error) {
      const errorMessage = s3Error instanceof Error ? s3Error.message : String(s3Error);
      throw new StorageAdapterError(
        "SIGNED_URL_FAILED",
        `Failed to generate signed URL: ${errorMessage}`,
        { key, bucket },
      );
    }
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    const client = getS3Client();
    const bucket = getBucket();

    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await client.send(command);

      return {
        contentType: response.ContentType ?? undefined,
        size: response.ContentLength ?? undefined,
        originalName: response.Metadata?.originalName ?? undefined,
        extension: getExtension(key).replace(/^\./, ""),
        checksum: response.Metadata?.checksum ?? undefined,
        uploadedAt: response.Metadata?.uploadedAt ?? response.LastModified?.toISOString() ?? undefined,
        storageProvider: this.name,
      };
    } catch (s3Error) {
      const errorName = s3Error instanceof Error ? s3Error.name : "Unknown";
      if (errorName === "NotFound" || errorName === "NoSuchKey") {
        return null;
      }
      return null;
    }
  }
}

/**
 * Reset the S3 client singleton (for testing or dynamic switching).
 */
export function resetS3Client(): void {
  _s3Client = null;
}
