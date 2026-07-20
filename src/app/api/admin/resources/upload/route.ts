/**
 * POST /api/admin/resources/upload
 *
 * Enterprise-grade file upload endpoint with FULL diagnostic logging.
 *
 * Flow:
 *  0. Pre-flight: log Content-Type, Content-Length, method
 *  1. Authenticate (requireSuperAdminOrAdmin)
 *  2. Parse multipart/form-data — log ALL received keys
 *  3. Validate file presence — log what was received vs expected
 *  4. Validate file extension (blocklist + allowlist)
 *  5. Read file buffer
 *  6. Validate MIME type, size, magic bytes via StorageService
 *  7. Compute SHA-256 checksum
 *  8. Store file via storage provider
 *  9. Return metadata
 *
 * ALL error responses are structured JSON:
 *   { success, code, message, stage, details: { field, expected, received, ... } }
 *
 * No generic "Upload Failed" — every error is specific and actionable.
 *
 * Security: requireSuperAdminOrAdmin
 * Hosting: Works on ANY Node.js host (VPS, Docker, serverless, bare metal)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { StorageService, StorageError, StorageValidationError, StorageConfigurationError } from "@/lib/storage/storage";
import {
  createResourceLogger,
  createErrorResponse,
} from "@/lib/storage/resource-logger";
import {
  isExtensionBlocked,
  isExtensionAllowed,
  validateMimeForExtension,
  verifyMagicBytes,
  getFileTypeLabel,
  getAllowedExtensions,
  getBlockedExtensions,
  MAX_FILE_SIZE,
  getExtension,
} from "@/lib/storage/file-type-registry";
import { getStorageDiagnostics } from "@/lib/storage/provider";

// Route segment config for large file uploads.
export const maxDuration = 300; // 5 minutes for large file uploads

/**
 * Create a field-level validation error response.
 * Always includes: success, code, field, expected, received, message.
 */
function validationError(
  code: string,
  field: string,
  expected: string,
  received: string,
  message: string,
  stage: string = "validation",
  extra?: Record<string, unknown>,
) {
  return {
    success: false as const,
    code,
    field,
    expected,
    received,
    message,
    stage,
    details: extra ?? {},
  };
}

export async function POST(req: NextRequest) {
  const logger = createResourceLogger("upload");

  // ================================================================
  // 0. PRE-FLIGHT: Log everything about the incoming request BEFORE
  //    any processing. This is the #1 diagnostic for 400 errors.
  // ================================================================
  const contentType = req.headers.get("content-type") ?? "(missing)";
  const contentLength = req.headers.get("content-length") ?? "(missing)";
  const method = req.method;
  const url = req.url;

  console.log(`[UPLOAD-PREFLIGHT] === REQUEST START ===`);
  console.log(`[UPLOAD-PREFLIGHT] Method: ${method}`);
  console.log(`[UPLOAD-PREFLIGHT] URL: ${url}`);
  console.log(`[UPLOAD-PREFLIGHT] Content-Type: ${contentType}`);
  console.log(`[UPLOAD-PREFLIGHT] Content-Length: ${contentLength}`);

  // Check: Content-Type must be multipart/form-data
  if (!contentType.includes("multipart/form-data")) {
    console.error(`[UPLOAD-PREFLIGHT] INVALID Content-Type: "${contentType}" — expected multipart/form-data`);
    logger.failed("INVALID_CONTENT_TYPE", `Expected multipart/form-data, got: ${contentType}`);
    return NextResponse.json(
      validationError(
        "INVALID_CONTENT_TYPE",
        "Content-Type",
        "multipart/form-data",
        contentType,
        `Request must be multipart/form-data. Received: "${contentType}". The frontend must use FormData, not JSON.`,
        "preflight",
      ),
      { status: 400 },
    );
  }

  // Check: Content-Length for Vercel body size limits
  const bodySizeBytes = parseInt(contentLength, 10);
  const VERCEL_HOBBY_LIMIT = 4.5 * 1024 * 1024; // 4.5MB
  const VERCEL_PRO_LIMIT = 50 * 1024 * 1024;     // 50MB
  if (!isNaN(bodySizeBytes)) {
    const sizeMB = (bodySizeBytes / 1024 / 1024).toFixed(2);
    console.log(`[UPLOAD-PREFLIGHT] Body size: ${sizeMB}MB (${bodySizeBytes} bytes)`);
    if (bodySizeBytes > MAX_FILE_SIZE) {
      console.error(`[UPLOAD-PREFLIGHT] Body too large: ${sizeMB}MB exceeds app limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      logger.failed("FILE_TOO_LARGE", `Body size ${sizeMB}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return NextResponse.json(
        validationError(
          "FILE_TOO_LARGE",
          "file",
          `<= ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          `${sizeMB}MB`,
          `File size (${sizeMB}MB) exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB).`,
          "preflight",
        ),
        { status: 400 },
      );
    }
    // Warn about Vercel plan limits (not enforced by us — enforced by Vercel's proxy)
    if (bodySizeBytes > VERCEL_HOBBY_LIMIT && bodySizeBytes <= VERCEL_PRO_LIMIT) {
      console.warn(`[UPLOAD-PREFLIGHT] WARNING: Body ${sizeMB}MB may exceed Vercel Hobby plan limit (4.5MB). Use Pro plan or cloud storage for large files.`);
    }
  }

  // ================================================================
  // 1. Authenticate
  // ================================================================
  let session;
  try {
    session = await requireSuperAdminOrAdmin();
  } catch (authError) {
    const errMsg = authError instanceof Error ? authError.message : "Auth check threw";
    console.error(`[UPLOAD-AUTH] Auth function threw error: ${errMsg}`);
    console.error(`[UPLOAD-AUTH] Stack:`, authError instanceof Error ? authError.stack : "N/A");
    logger.failed("AUTH_ERROR", errMsg);
    return NextResponse.json(
      createErrorResponse("AUTH_ERROR", `Authentication check failed: ${errMsg}`, "authentication"),
      { status: 500 },
    );
  }

  if (!session) {
    console.error(`[UPLOAD-AUTH] No session — user is not authenticated or not admin`);
    logger.failed("AUTH_REQUIRED", "Administrator access required");
    return NextResponse.json(
      createErrorResponse("AUTH_REQUIRED", "Administrator access required", "authentication"),
      { status: 403 },
    );
  }

  const userId = session.user?.id ?? session.user?.email ?? "unknown";
  const userRole = session.user?.role ?? "unknown";
  console.log(`[UPLOAD-AUTH] Authenticated: userId=${userId}, role=${userRole}`);
  logger.started({ userId });

  try {
    // ================================================================
    // 2. Parse multipart/form-data — LOG ALL RECEIVED KEYS
    // ================================================================
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (parseError) {
      const errMsg = parseError instanceof Error ? parseError.message : String(parseError);
      const errName = parseError instanceof Error ? parseError.constructor.name : "UnknownError";
      console.error(`[UPLOAD-PARSE] formData() threw ${errName}: ${errMsg}`);
      console.error(`[UPLOAD-PARSE] This usually means:`);
      console.error(`[UPLOAD-PARSE]   1. Body exceeds Vercel serverless limit (4.5MB hobby / 50MB pro)`);
      console.error(`[UPLOAD-PARSE]   2. Malformed multipart boundary`);
      console.error(`[UPLOAD-PARSE]   3. Body already consumed by middleware`);
      console.error(`[UPLOAD-PARSE] Content-Type was: ${contentType}`);
      console.error(`[UPLOAD-PARSE] Content-Length was: ${contentLength}`);
      logger.failed("PARSE_ERROR", errMsg, { userId, errorDetails: { contentType, contentLength } });
      return NextResponse.json(
        validationError(
          "PARSE_ERROR",
          "formData",
          "valid multipart/form-data body",
          `${errName}: ${errMsg}`,
          `Could not parse upload request: ${errMsg}. This often means the file exceeds the hosting platform's body size limit. Content-Type: ${contentType}, Content-Length: ${contentLength}`,
          "parsing",
          { contentType, contentLength, errorName: errName },
        ),
        { status: 400 },
      );
    }

    // ===== LOG ALL RECEIVED FORMDATA KEYS AND VALUES =====
    const allKeys = [...formData.keys()];
    console.log(`[UPLOAD-FORMDATA] === ALL RECEIVED KEYS ===`);
    console.log(`[UPLOAD-FORMDATA] Keys (${allKeys.length}): [${allKeys.map(k => `"${k}"`).join(", ")}]`);

    // Log each key's type and value summary
    for (const key of allKeys) {
      const value = formData.get(key);
      if (value instanceof File) {
        console.log(`[UPLOAD-FORMDATA]   Key: "${key}" → File { name: "${value.name}", type: "${value.type}", size: ${value.size} bytes }`);
      } else {
        const strVal = String(value ?? "");
        const truncated = strVal.length > 200 ? strVal.slice(0, 200) + "…" : strVal;
        console.log(`[UPLOAD-FORMDATA]   Key: "${key}" → String: "${truncated}"`);
      }
    }

    // Also log the EXPECTED keys for comparison
    console.log(`[UPLOAD-FORMDATA] Expected keys: ["file"]`);
    console.log(`[UPLOAD-FORMDATA] Extra keys (ignored): [${allKeys.filter(k => k !== "file").map(k => `"${k}"`).join(", ")}]`);

    // ================================================================
    // 3. Validate file presence — DETAILED field-level diagnostic
    // ================================================================
    const file = formData.get("file");

    if (!file) {
      console.error(`[UPLOAD-VALIDATE] "file" key is MISSING from FormData. Received keys: [${allKeys.join(", ")}]`);
      logger.failed("NO_FILE", "No file provided in multipart/form-data", { userId, errorDetails: { receivedKeys: allKeys } });
      return NextResponse.json(
        validationError(
          "NO_FILE",
          "file",
          "File object in field 'file'",
          `No value for key "file". Received keys: [${allKeys.join(", ")}]`,
          `No file provided. Use multipart/form-data with a field named "file". Received FormData keys: [${allKeys.join(", ")}]. Make sure the frontend uses formData.append("file", fileObject).`,
          "validation",
          { receivedKeys: allKeys },
        ),
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      console.error(`[UPLOAD-VALIDATE] "file" key exists but is NOT a File object. Type: ${typeof file}, value: "${String(file).slice(0, 100)}"`);
      logger.failed("NOT_A_FILE", `"file" field is not a File object`, { userId, errorDetails: { receivedType: typeof file } });
      return NextResponse.json(
        validationError(
          "NOT_A_FILE",
          "file",
          "File object (multipart file upload)",
          `typeof file = "${typeof file}", value = "${String(file).slice(0, 100)}"`,
          `The "file" field was received but is not a File object. This happens when the frontend sends the file name as a string instead of a File/Blob object. Use formData.append("file", fileObject), not formData.append("file", fileName).`,
          "validation",
          { receivedType: typeof file },
        ),
        { status: 400 },
      );
    }

    // Log all file metadata
    const ext = getExtension(file.name);
    const reportedMime = file.type || "application/octet-stream";
    const mimeResult = validateMimeForExtension(reportedMime, ext);

    console.log(`[UPLOAD-VALIDATE] === FILE METADATA ===`);
    console.log(`[UPLOAD-VALIDATE]   file.name:        "${file.name}"`);
    console.log(`[UPLOAD-VALIDATE]   file.type (MIME):  "${file.type}"`);
    console.log(`[UPLOAD-VALIDATE]   file.size:         ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`[UPLOAD-VALIDATE]   file.lastModified: ${file.lastModified}`);
    console.log(`[UPLOAD-VALIDATE]   extension:         "${ext}"`);
    console.log(`[UPLOAD-VALIDATE]   typeLabel:         ${ext ? getFileTypeLabel(ext) : "N/A"}`);
    console.log(`[UPLOAD-VALIDATE]   extensionAllowed:  ${ext ? isExtensionAllowed(ext) : "N/A"}`);
    console.log(`[UPLOAD-VALIDATE]   extensionBlocked:  ${ext ? isExtensionBlocked(ext) : "N/A"}`);
    console.log(`[UPLOAD-VALIDATE]   mimeValid:         ${mimeResult.valid}`);
    console.log(`[UPLOAD-VALIDATE]   mimeNote:          ${mimeResult.note ?? "MIME type is a known variant"}`);
    console.log(`[UPLOAD-VALIDATE]   canonicalMime:     ${mimeResult.canonicalMime ?? reportedMime}`);

    // ================================================================
    // 4. Extension blocklist check — security hard-stop
    // ================================================================
    if (ext && isExtensionBlocked(ext)) {
      console.error(`[UPLOAD-VALIDATE] BLOCKED extension: "${ext}" for file "${file.name}"`);
      logger.failed("BLOCKED_EXTENSION", `Blocked file extension: ${ext}`, {
        userId, fileName: file.name, extension: ext,
      });
      return NextResponse.json(
        validationError(
          "BLOCKED_EXTENSION",
          "file.name",
          `Allowed extension (not in blocklist)`,
          `"${ext}"`,
          `File extension "${ext}" is blocked for security reasons. Blocked extensions: ${getBlockedExtensions().join(", ")}.`,
          "validation",
          { fileName: file.name, extension: ext },
        ),
        { status: 400 },
      );
    }

    // ================================================================
    // 4b. Extension allowlist check — must be in registry
    // ================================================================
    if (ext && !isExtensionAllowed(ext)) {
      console.error(`[UPLOAD-VALIDATE] UNSUPPORTED extension: "${ext}" for file "${file.name}"`);
      logger.failed("UNSUPPORTED_EXTENSION", `Unsupported file extension: ${ext}`, {
        userId, fileName: file.name, extension: ext,
      });
      return NextResponse.json(
        validationError(
          "UNSUPPORTED_EXTENSION",
          "file.name",
          `One of: ${getAllowedExtensions().join(", ")}`,
          `"${ext}"`,
          `File extension "${ext}" is not supported. Allowed extensions: ${getAllowedExtensions().join(", ")}.`,
          "validation",
          { fileName: file.name, extension: ext },
        ),
        { status: 400 },
      );
    }

    // ================================================================
    // 4c. MIME type cross-check (informational — NEVER reject on MIME alone)
    // Browsers report inconsistent MIME types. If the extension is
    // registered, we accept the file regardless of MIME.
    // ================================================================
    if (mimeResult.valid) {
      console.log(`[UPLOAD-VALIDATE] MIME cross-check PASSED for "${reportedMime}" + "${ext}"`);
      if (mimeResult.note) {
        console.log(`[UPLOAD-VALIDATE] MIME note: ${mimeResult.note}`);
      }
    } else {
      // This shouldn't happen if the extension is in the registry
      // But if it does, we still don't reject — just log a warning
      console.warn(`[UPLOAD-VALIDATE] MIME cross-check WARNING: ${mimeResult.note}`);
    }

    // ================================================================
    // 4d. File size check (before reading buffer)
    // ================================================================
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
      console.error(`[UPLOAD-VALIDATE] File too large: ${sizeMB}MB (max ${maxMB}MB)`);
      logger.failed("FILE_TOO_LARGE", `File too large: ${sizeMB}MB`, {
        userId, fileName: file.name, fileSize: file.size,
      });
      return NextResponse.json(
        validationError(
          "FILE_TOO_LARGE",
          "file.size",
          `<= ${maxMB}MB`,
          `${sizeMB}MB`,
          `File size (${sizeMB}MB) exceeds maximum allowed (${maxMB}MB).`,
          "validation",
          { fileName: file.name, fileSize: file.size, maxSize: MAX_FILE_SIZE },
        ),
        { status: 400 },
      );
    }

    if (file.size < 1) {
      console.error(`[UPLOAD-VALIDATE] File is empty: ${file.size} bytes`);
      logger.failed("FILE_EMPTY", "File is empty", { userId, fileName: file.name });
      return NextResponse.json(
        validationError(
          "FILE_EMPTY",
          "file.size",
          ">= 1 byte",
          `${file.size} bytes`,
          `File is empty (0 bytes). Cannot upload an empty file.`,
          "validation",
          { fileName: file.name },
        ),
        { status: 400 },
      );
    }

    logger.validation({ userId, fileName: file.name, mimeType: reportedMime, fileSize: file.size, extension: ext });

    // ================================================================
    // 5. Read file into buffer
    // ================================================================
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      console.log(`[UPLOAD-BUFFER] Read ${buffer.length} bytes from file "${file.name}"`);
    } catch (readError) {
      const errMsg = readError instanceof Error ? readError.message : "Failed to read file data";
      console.error(`[UPLOAD-BUFFER] Failed to read file: ${errMsg}`);
      logger.failed("READ_ERROR", errMsg, { userId, fileName: file.name });
      return NextResponse.json(
        validationError(
          "READ_ERROR",
          "file",
          "Readable file data",
          `Read error: ${errMsg}`,
          `Could not read file data: ${errMsg}. The file may be corrupted or the browser could not access it.`,
          "reading",
          { fileName: file.name },
        ),
        { status: 400 },
      );
    }

    // ================================================================
    // 6. Upload via Storage Service (validates MIME, size, magic bytes;
    //    computes SHA-256 checksum; delegates to storage provider)
    // ================================================================
    console.log(`[UPLOAD-STORAGE] === STORAGE DIAGNOSTICS ===`);
    const diag = getStorageDiagnostics();
    for (const [key, value] of Object.entries(diag)) {
      console.log(`[UPLOAD-STORAGE]   ${key}: ${value}`);
    }
    console.log(`[UPLOAD-STORAGE] Calling StorageService.upload() for "${file.name}" (${buffer.length} bytes, MIME: ${reportedMime})`);
    let result;
    try {
      result = await StorageService.upload(
        buffer,
        file.name,
        reportedMime,
      );
    } catch (uploadError) {
      // Structured error from StorageService validation
      if (uploadError instanceof StorageConfigurationError) {
        console.error(`[UPLOAD-STORAGE] CONFIGURATION ERROR: [${uploadError.code}] ${uploadError.message}`);
        logger.failed(uploadError.code, uploadError.message, {
          userId, fileName: file.name,
          errorCode: uploadError.code, errorDetails: uploadError.details,
        });
        return NextResponse.json(
          {
            success: false,
            code: uploadError.code,
            field: "BLOB_READ_WRITE_TOKEN",
            expected: "Valid Vercel Blob read-write token",
            received: "Token is missing, invalid, or for a different store",
            message: uploadError.message,
            stage: "storage_configuration",
            details: uploadError.details ?? {},
          },
          { status: 500 },
        );
      }
      if (uploadError instanceof StorageValidationError) {
        console.error(`[UPLOAD-STORAGE] Validation error: [${uploadError.code}] ${uploadError.message}`);
        logger.failed(uploadError.code, uploadError.message, {
          userId, fileName: file.name, mimeType: reportedMime, fileSize: buffer.length,
          errorCode: uploadError.code, errorDetails: uploadError.details,
        });
        return NextResponse.json(
          validationError(
            uploadError.code,
            uploadError.details?.field as string ?? "file",
            uploadError.details?.expected as string ?? "(see message)",
            uploadError.details?.received as string ?? "(see message)",
            uploadError.message,
            "validation",
            uploadError.details ?? {},
          ),
          { status: 400 },
        );
      }
      if (uploadError instanceof StorageError) {
        console.error(`[UPLOAD-STORAGE] Storage error: [${uploadError.code}] ${uploadError.message}`);
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
      console.error(`[UPLOAD-STORAGE] Unexpected error: ${errMsg}`);
      logger.failed("STORAGE_ERROR", errMsg, {
        userId, fileName: file.name, fileSize: buffer.length,
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
      });
      return NextResponse.json(
        createErrorResponse("STORAGE_ERROR", `File storage failed: ${errMsg}`, "storage"),
        { status: 500 },
      );
    }

    // ================================================================
    // 7. Success — log and return
    // ================================================================
    console.log(`[UPLOAD-SUCCESS] === UPLOAD COMPLETE ===`);
    console.log(`[UPLOAD-SUCCESS]   storageKey:      ${result.storageKey}`);
    console.log(`[UPLOAD-SUCCESS]   fileName:        ${result.fileName}`);
    console.log(`[UPLOAD-SUCCESS]   originalFileName: ${result.originalFileName}`);
    console.log(`[UPLOAD-SUCCESS]   mimeType:        ${result.mimeType}`);
    console.log(`[UPLOAD-SUCCESS]   fileSize:        ${result.fileSize} bytes`);
    console.log(`[UPLOAD-SUCCESS]   checksum:        ${result.checksum}`);
    console.log(`[UPLOAD-SUCCESS]   urlType:         storage_key`);

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
    console.error(`[UPLOAD-UNEXPECTED] Unhandled error: ${errMsg}`);
    console.error(`[UPLOAD-UNEXPECTED] Stack:`, stack);
    logger.failed("UNEXPECTED_ERROR", errMsg, { userId, stack });
    return NextResponse.json(
      createErrorResponse("UNEXPECTED_ERROR", `An unexpected error occurred: ${errMsg}`, "unknown"),
      { status: 500 },
    );
  }
}
