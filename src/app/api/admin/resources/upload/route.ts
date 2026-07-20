/**
 * POST /api/admin/resources/upload
 *
 * Enterprise-grade file upload endpoint.
 *
 * Flow:
 *  1. Authenticate (requireSuperAdminOrAdmin)
 *  2. Parse multipart/form-data
 *  3. Validate file presence
 *  4. Validate file extension (blocklist + allowlist)
 *  5. Validate MIME type against allowlist
 *  6. Verify magic bytes (anti-spoofing)
 *  7. Validate file size (max 100MB)
 *  8. Compute SHA-256 checksum
 *  9. Store file via StorageService
 *  10. Return metadata (storageKey, checksum, mimeType, etc.)
 *
 * The frontend then uses this metadata when creating/updating a Resource
 * via POST/PUT /api/admin/resources.
 *
 * Security: requireSuperAdminOrAdmin
 * Hosting: Works on ANY Node.js host (VPS, Docker, serverless, bare metal)
 *
 * Error responses are ALWAYS structured JSON:
 *   { success: false, code: "...", message: "...", stage: "...", details: {...} }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { StorageService, StorageError, StorageValidationError } from "@/lib/storage/storage";
import {
  createResourceLogger,
  createErrorResponse,
} from "@/lib/storage/resource-logger";
import { BLOCKED_EXTENSIONS, getExtension } from "@/lib/storage/types";

// Route segment config for large file uploads.
// Next.js App Router: use individual named exports instead of config object.
export const maxDuration = 300; // 5 minutes for large file uploads

export async function POST(req: NextRequest) {
  const logger = createResourceLogger("upload");

  // ---- 1. Authenticate ----
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    logger.failed("AUTH_REQUIRED", "Administrator access required");
    return NextResponse.json(
      createErrorResponse("AUTH_REQUIRED", "Administrator access required", "authentication"),
      { status: 403 },
    );
  }

  const userId = session.user?.id ?? session.user?.email ?? "unknown";
  logger.started({ userId });

  try {
    // ---- 2. Parse multipart/form-data ----
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (parseError) {
      const errMsg = parseError instanceof Error ? parseError.message : "Failed to parse request body";
      logger.failed("PARSE_ERROR", errMsg, { userId });
      return NextResponse.json(
        createErrorResponse("PARSE_ERROR", `Could not parse upload request: ${errMsg}`, "parsing"),
        { status: 400 },
      );
    }

    const file = formData.get("file");

    // ---- 3. Validate file presence ----
    if (!file || !(file instanceof File)) {
      logger.failed("NO_FILE", "No file provided in multipart/form-data", { userId });
      return NextResponse.json(
        createErrorResponse("NO_FILE", "No file provided. Use multipart/form-data with field 'file'.", "validation"),
        { status: 400 },
      );
    }

    // ---- 4. Extension blocklist check ----
    const ext = getExtension(file.name);
    if (ext && BLOCKED_EXTENSIONS.has(ext)) {
      logger.failed("BLOCKED_EXTENSION", `Blocked file extension: ${ext}`, {
        userId, fileName: file.name, extension: ext,
      });
      return NextResponse.json(
        createErrorResponse(
          "BLOCKED_EXTENSION",
          `Blocked file extension: ${ext}. This file type is not allowed for security reasons.`,
          "validation",
          { fileName: file.name, extension: ext },
        ),
        { status: 400 },
      );
    }

    logger.validation({ userId, fileName: file.name, mimeType: file.type, fileSize: file.size, extension: ext });

    // ---- 5. Read file into buffer ----
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (readError) {
      const errMsg = readError instanceof Error ? readError.message : "Failed to read file data";
      logger.failed("READ_ERROR", errMsg, { userId, fileName: file.name });
      return NextResponse.json(
        createErrorResponse("READ_ERROR", `Could not read file data: ${errMsg}`, "reading"),
        { status: 400 },
      );
    }

    // ---- 6. Upload via Storage Service (validates MIME, size, magic bytes; computes SHA-256) ----
    let result;
    try {
      result = await StorageService.upload(
        buffer,
        file.name,
        file.type || "application/octet-stream",
      );
    } catch (uploadError) {
      // Structured error from StorageService validation
      if (uploadError instanceof StorageValidationError) {
        logger.failed(uploadError.code, uploadError.message, {
          userId, fileName: file.name, mimeType: file.type, fileSize: buffer.length,
          errorCode: uploadError.code, errorDetails: uploadError.details,
        });
        return NextResponse.json(
          createErrorResponse(uploadError.code, uploadError.message, "validation", uploadError.details),
          { status: 400 },
        );
      }
      if (uploadError instanceof StorageError) {
        logger.failed(uploadError.code, uploadError.message, {
          userId, fileName: file.name,
          errorCode: uploadError.code,
        });
        return NextResponse.json(
          createErrorResponse(uploadError.code, uploadError.message, "storage", uploadError.details),
          { status: 500 },
        );
      }
      // Unexpected error
      const errMsg = uploadError instanceof Error ? uploadError.message : "Unknown storage error";
      logger.failed("STORAGE_ERROR", errMsg, {
        userId, fileName: file.name, fileSize: buffer.length,
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
      });
      return NextResponse.json(
        createErrorResponse("STORAGE_ERROR", `File storage failed: ${errMsg}`, "storage"),
        { status: 500 },
      );
    }

    logger.storageUpload({
      userId, fileName: file.name, storageKey: result.storageKey,
      fileSize: result.fileSize, mimeType: result.mimeType,
    });

    logger.completed({
      userId, fileName: file.name, storageKey: result.storageKey,
      fileSize: result.fileSize, details: { checksum: result.checksum },
    });

    return NextResponse.json({
      success: true,
      storageKey: result.storageKey,
      fileName: result.fileName,
      originalFileName: result.originalFileName,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
      checksum: result.checksum,
      urlType: "storage_key",
    });
  } catch (error) {
    // Catch-all for any unexpected errors
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    logger.failed("UNEXPECTED_ERROR", errMsg, {
      userId,
      stack,
    });
    console.error("[API ERROR] POST /api/admin/resources/upload:", error);
    return NextResponse.json(
      createErrorResponse("UNEXPECTED_ERROR", `An unexpected error occurred: ${errMsg}`, "unknown"),
      { status: 500 },
    );
  }
}
