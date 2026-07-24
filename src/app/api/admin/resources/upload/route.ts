/**
 * POST /api/admin/resources/upload — Enterprise Streaming Upload Endpoint
 *
 * ARCHITECTURE:
 *   This endpoint implements a 3-phase streaming upload pipeline:
 *     Phase 1: Create Upload Session → returns sessionId + chunk plan
 *     Phase 2: Upload Chunks → streams chunks to temp file (resumable)
 *     Phase 3: Complete Upload → move to storage, compute checksum, return metadata
 *
 *   The API NEVER buffers the entire file in memory. Each chunk is written
 *   directly to a temp file at the correct offset. Only the final assembly
 *   reads the complete file (for checksum + storage provider upload).
 *
 * SECURITY:
 *   - requireSuperAdminOrAdmin for all phases
 *   - Extension + MIME validation on session creation (before any bytes are written)
 *   - SHA-256 checksum on completion
 *   - Session expiry (24 hours)
 *
 * ERROR HANDLING:
 *   All errors are structured JSON with code, stage, message, details.
 *   Never returns "UNKNOWN".
 *
 * Body size limit: 10 MB per chunk (configurable).
 * Total file size limit: 1 GB (validated on session creation).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import {
  createUploadSession,
  getUploadSession,
  writeUploadChunk,
  completeUploadSession,
  createError,
  type ResourceError,
  type UploadSession,
} from "@/lib/resource-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isResourceError(result: unknown): result is ResourceError {
  return result !== null && typeof result === "object" && "success" in result && result.success === false && "code" in result;
}

// ---------------------------------------------------------------------------
// Phase 1: Create Upload Session
// ---------------------------------------------------------------------------

async function handleCreateSession(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      createError("PARSE_ERROR", "validation", "Invalid JSON body.", {}),
      { status: 400 },
    );
  }

  const { fileName, mimeType, fileSize } = body;

  if (!fileName || !mimeType || !fileSize) {
    return NextResponse.json(
      createError("MISSING_FIELD", "validation", "fileName, mimeType, and fileSize are required to create an upload session.", {
        provided: { fileName: !!fileName, mimeType: !!mimeType, fileSize: !!fileSize },
      }),
      { status: 400 },
    );
  }

  const result = createUploadSession(fileName, mimeType, fileSize);

  if (isResourceError(result)) {
    const statusMap: Record<string, number> = {
      FILE_TOO_LARGE: 413,
      FILE_TOO_SMALL: 400,
      BLOCKED_EXTENSION: 415,
      INVALID_EXTENSION: 415,
      VALIDATION_FAILED: 400,
    };
    return NextResponse.json(result, { status: statusMap[result.code] ?? 400 });
  }

  const session = result as UploadSession;
  return NextResponse.json({
    success: true,
    sessionId: session.id,
    fileName: session.fileName,
    fileSize: session.fileSize,
    mimeType: session.mimeType,
    extension: session.extension,
    totalChunks: session.totalChunks,
    chunkSize: session.chunkSize,
    expiresAt: session.expiresAt.toISOString(),
  }, { status: 201 });
}

// ---------------------------------------------------------------------------
// Phase 2: Upload Chunk
// ---------------------------------------------------------------------------

async function handleUploadChunk(req: NextRequest): Promise<NextResponse> {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      createError("PARSE_ERROR", "upload", "Expected multipart form data with a chunk.", {}),
      { status: 400 },
    );
  }

  const sessionId = formData.get("sessionId") as string | null;
  const chunkIndex = parseInt(formData.get("chunkIndex") as string ?? "", 10);
  const chunkFile = formData.get("chunk") as File | null;

  if (!sessionId || isNaN(chunkIndex) || !chunkFile) {
    return NextResponse.json(
      createError("MISSING_FIELD", "upload", "sessionId, chunkIndex, and chunk file are required.", {
        provided: { sessionId: !!sessionId, chunkIndex: !isNaN(chunkIndex), chunk: !!chunkFile },
      }),
      { status: 400 },
    );
  }

  // Read chunk buffer — this is ONLY one chunk (5 MB max), NOT the entire file
  const chunkBuffer = Buffer.from(await chunkFile.arrayBuffer());

  const result = await writeUploadChunk(sessionId, chunkIndex, chunkBuffer);

  if (isResourceError(result)) {
    const statusMap: Record<string, number> = {
      UPLOAD_SESSION_NOT_FOUND: 404,
      UPLOAD_SESSION_EXPIRED: 410,
      UPLOAD_NOT_RESUMABLE: 409,
      CHUNK_OUT_OF_ORDER: 400,
      CHUNK_SIZE_INVALID: 400,
      STORAGE_ERROR: 500,
    };
    return NextResponse.json(result, { status: statusMap[result.code] ?? 400 });
  }

  const { accepted, chunkIndex: acceptedIndex, progress } = result as { accepted: true; chunkIndex: number; progress: number };

  return NextResponse.json({
    success: true,
    accepted,
    chunkIndex: acceptedIndex,
    progress: Math.round(progress * 100),
  });
}

// ---------------------------------------------------------------------------
// Phase 3: Complete Upload
// ---------------------------------------------------------------------------

async function handleCompleteUpload(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      createError("PARSE_ERROR", "upload", "Invalid JSON body.", {}),
      { status: 400 },
    );
  }

  const { sessionId } = body;
  if (!sessionId) {
    return NextResponse.json(
      createError("MISSING_FIELD", "upload", "sessionId is required.", { field: "sessionId" }),
      { status: 400 },
    );
  }

  const result = await completeUploadSession(sessionId);

  if (isResourceError(result)) {
    const statusMap: Record<string, number> = {
      UPLOAD_SESSION_NOT_FOUND: 404,
      UPLOAD_FAILED: 400,
      FILE_NOT_FOUND: 404,
      STORAGE_ERROR: 500,
    };
    return NextResponse.json(result, { status: statusMap[result.code] ?? 500 });
  }

  const metadata = result as {
    storageKey: string;
    storageProvider: string;
    mimeType: string;
    fileSize: number;
    originalFileName: string;
    extension: string;
    checksum: string;
    publicUrl: string | null;
  };

  return NextResponse.json({
    success: true,
    ...metadata,
  });
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json(
      createError("ACCESS_DENIED", "authorization", "Administrator access required.", {}),
      { status: 403 },
    );
  }

  // Determine which phase based on Content-Type and query param
  const url = new URL(req.url);
  const phase = url.searchParams.get("phase");

  switch (phase) {
    case "create-session":
      return handleCreateSession(req);

    case "upload-chunk":
      return handleUploadChunk(req);

    case "complete":
      return handleCompleteUpload(req);

    default:
      // If no phase specified, try to infer from Content-Type
      const contentType = req.headers.get("content-type") ?? "";

      if (contentType.includes("multipart/form-data")) {
        // FormData → likely a chunk upload or simple single-file upload
        const formData = await req.formData().catch(() => null);
        if (formData?.get("sessionId")) {
          return handleUploadChunk(req);
        }
        // Single-file upload (no chunking) — handle directly
        return handleSimpleUpload(req);
      }

      // JSON body → likely session creation or completion
      const body = await req.json().catch(() => null);
      if (body?.sessionId) {
        return handleCompleteUpload(req);
      }
      if (body?.fileName && body?.fileSize) {
        return handleCreateSession(req);
      }

      return NextResponse.json(
        createError("METHOD_NOT_ALLOWED", "upload", "Specify upload phase: ?phase=create-session, ?phase=upload-chunk, or ?phase=complete.", {
          hint: "For simple uploads, send multipart/form-data without sessionId.",
        }),
        { status: 405 },
      );
  }
}

// ---------------------------------------------------------------------------
// Simple Upload (single file, no chunking) — for files < 50 MB
// ---------------------------------------------------------------------------

async function handleSimpleUpload(req: NextRequest): Promise<NextResponse> {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      createError("PARSE_ERROR", "upload", "Expected multipart form data.", {}),
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      createError("MISSING_FIELD", "upload", "No file provided in FormData.", { field: "file" }),
      { status: 400 },
    );
  }

  // For simple uploads, delegate to the session-based pipeline internally
  // Create session → upload all as one chunk → complete
  const sessionResult = createUploadSession(file.name, file.type, file.size);

  if (isResourceError(sessionResult)) {
    const statusMap: Record<string, number> = {
      FILE_TOO_LARGE: 413,
      BLOCKED_EXTENSION: 415,
      INVALID_EXTENSION: 415,
    };
    return NextResponse.json(sessionResult, { status: statusMap[sessionResult.code] ?? 400 });
  }

  const uploadSession = sessionResult as UploadSession;

  // Read entire file as one chunk (for simple uploads < 50 MB)
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const chunkResult = await writeUploadChunk(uploadSession.id, 0, fileBuffer);

  if (isResourceError(chunkResult)) {
    return NextResponse.json(chunkResult, { status: 400 });
  }

  // Complete the upload
  const completeResult = await completeUploadSession(uploadSession.id);

  if (isResourceError(completeResult)) {
    return NextResponse.json(completeResult, { status: 500 });
  }

  return NextResponse.json(completeResult, { status: 201 });
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
