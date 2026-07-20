/**
 * Enterprise Resource Logger — structured logging for the Global Resources Module.
 *
 * Every upload, download, and delete operation is logged with:
 *  - Exact stage where the operation succeeded or failed
 *  - Request ID for traceability
 *  - File metadata (name, MIME type, size, extension)
 *  - Duration of the operation
 *  - Error details with stack trace on failure
 *  - User identity (if authenticated)
 *
 * Log stages:
 *   UPLOAD_STARTED → VALIDATION → STORAGE_UPLOAD → DATABASE_INSERT → COMPLETED
 *   UPLOAD_STARTED → VALIDATION → FAILED
 *   UPLOAD_STARTED → VALIDATION → STORAGE_UPLOAD → FAILED
 *
 * No generic "Upload Failed" — every error is specific and actionable.
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogStage =
  | "UPLOAD_STARTED"
  | "VALIDATION"
  | "STORAGE_UPLOAD"
  | "DATABASE_INSERT"
  | "COMPLETED"
  | "FAILED";

export type LogSeverity = "info" | "warn" | "error";

export interface ResourceLogEntry {
  /** Unique request ID for traceability */
  requestId: string;
  /** Timestamp of the log entry */
  timestamp: string;
  /** Stage of the operation */
  stage: LogStage;
  /** Operation type */
  operation: "upload" | "download" | "delete" | "health_check";
  /** Severity level */
  severity: LogSeverity;
  /** Resource ID (if available) */
  resourceId?: string;
  /** File name */
  fileName?: string;
  /** MIME type */
  mimeType?: string;
  /** File size in bytes */
  fileSize?: number;
  /** File extension */
  extension?: string;
  /** Storage key */
  storageKey?: string;
  /** User ID (if authenticated) */
  userId?: string;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Error code (for structured errors) */
  errorCode?: string;
  /** Error message */
  errorMessage?: string;
  /** Additional details */
  details?: Record<string, unknown>;
  /** Stack trace (for error entries) */
  stack?: string;
  /** Error details (for structured errors) */
  errorDetails?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Request ID generator
// ---------------------------------------------------------------------------

/**
 * Generate a unique request ID for traceability.
 * Format: req_<timestamp>_<random8>
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

/**
 * Log a resource operation event.
 *
 * Outputs structured JSON to console (stdout/stderr based on severity).
 * In production, these logs are collected by the hosting platform's
 * log aggregation service (Vercel Logs, CloudWatch, Datadog, etc.)
 */
export function logResourceOperation(entry: ResourceLogEntry): void {
  const logLine = JSON.stringify(entry);

  switch (entry.severity) {
    case "error":
      console.error(`[ResourceOps] ${logLine}`);
      break;
    case "warn":
      console.warn(`[ResourceOps] ${logLine}`);
      break;
    case "info":
    default:
      console.log(`[ResourceOps] ${logLine}`);
      break;
  }
}

/**
 * Create a logger bound to a specific request ID and operation.
 * Returns convenience methods for logging each stage.
 */
export function createResourceLogger(
  operation: "upload" | "download" | "delete" | "health_check",
  requestId?: string,
) {
  const rid = requestId ?? generateRequestId();
  const startTime = Date.now();

  function log(
    stage: LogStage,
    severity: LogSeverity,
    extra?: Partial<ResourceLogEntry>,
  ) {
    logResourceOperation({
      requestId: rid,
      timestamp: new Date().toISOString(),
      stage,
      operation,
      severity,
      durationMs: Date.now() - startTime,
      ...extra,
    });
  }

  return {
    requestId: rid,
    startTime,

    started(extra?: Partial<ResourceLogEntry>) {
      log("UPLOAD_STARTED", "info", extra);
    },

    validation(extra?: Partial<ResourceLogEntry>) {
      log("VALIDATION", "info", extra);
    },

    storageUpload(extra?: Partial<ResourceLogEntry>) {
      log("STORAGE_UPLOAD", "info", extra);
    },

    databaseInsert(extra?: Partial<ResourceLogEntry>) {
      log("DATABASE_INSERT", "info", extra);
    },

    completed(extra?: Partial<ResourceLogEntry>) {
      log("COMPLETED", "info", extra);
    },

    failed(
      errorCode: string,
      errorMessage: string,
      extra?: Partial<ResourceLogEntry>,
    ) {
      log("FAILED", "error", {
        errorCode,
        errorMessage,
        ...extra,
      });
    },

    warn(
      message: string,
      extra?: Partial<ResourceLogEntry>,
    ) {
      log("FAILED", "warn", {
        errorCode: "WARNING",
        errorMessage: message,
        ...extra,
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Structured API error response helper
// ---------------------------------------------------------------------------

/**
 * Create a structured error response for API routes.
 * NEVER return a generic "Upload failed" — always include:
 *  - success: false
 *  - code: machine-readable error code
 *  - message: human-readable error description
 *  - stage: where in the pipeline the error occurred
 *  - details: additional context
 */
export function createErrorResponse(
  code: string,
  message: string,
  stage: string,
  details?: Record<string, unknown>,
) {
  return {
    success: false as const,
    code,
    message,
    stage,
    details: details ?? {},
  };
}
