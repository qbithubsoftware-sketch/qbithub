/**
 * Consistent API error handling utilities.
 *
 * Every API route should use these helpers to ensure uniform error
 * responses across the application.
 */

import { NextResponse, type NextRequest } from "next/server";
import { log } from "@/lib/monitoring/logger";
import { getMonitor } from "@/lib/monitoring/monitoring";

/** Standard error response codes. */
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

/** Standard error response shape. */
interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
  message: string;
  requestId?: string;
}

/** Returns a 400 Bad Request response. */
export function badRequest(message: string, details?: Record<string, unknown>) {
  log.warn("API 400 Bad Request", { message, ...details });
  return NextResponse.json<ApiErrorResponse>(
    { error: "Bad Request", code: "BAD_REQUEST", message },
    { status: 400 },
  );
}

/** Returns a 401 Unauthorized response. */
export function unauthorized(message: string = "Authentication required") {
  log.warn("API 401 Unauthorized", { message });
  return NextResponse.json<ApiErrorResponse>(
    { error: "Unauthorized", code: "UNAUTHORIZED", message },
    { status: 401 },
  );
}

/** Returns a 403 Forbidden response. */
export function forbidden(message: string = "Insufficient permissions") {
  log.warn("API 403 Forbidden", { message });
  return NextResponse.json<ApiErrorResponse>(
    { error: "Forbidden", code: "FORBIDDEN", message },
    { status: 403 },
  );
}

/** Returns a 404 Not Found response. */
export function notFound(message: string = "Resource not found") {
  log.warn("API 404 Not Found", { message });
  return NextResponse.json<ApiErrorResponse>(
    { error: "Not Found", code: "NOT_FOUND", message },
    { status: 404 },
  );
}

/** Returns a 429 Rate Limited response. */
export function rateLimited(retryAfterSeconds: number = 60) {
  log.warn("API 429 Rate Limited");
  return NextResponse.json<ApiErrorResponse>(
    { error: "Rate Limited", code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

/** Returns a 500 Internal Error response. Logs the error + captures for monitoring. */
export function internalError(error: Error | string, context?: Record<string, unknown>) {
  const err = typeof error === "string" ? new Error(error) : error;
  log.error("API 500 Internal Error", { error: err.message, stack: err.stack, ...context });
  getMonitor().captureException(err, context);
  return NextResponse.json<ApiErrorResponse>(
    {
      error: "Internal Server Error",
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production"
        ? "An unexpected error occurred. Please try again."
        : err.message,
    },
    { status: 500 },
  );
}

/** Returns a 503 Service Unavailable response. */
export function serviceUnavailable(message: string = "Service temporarily unavailable") {
  log.error("API 503 Service Unavailable", { message });
  return NextResponse.json<ApiErrorResponse>(
    { error: "Service Unavailable", code: "SERVICE_UNAVAILABLE", message },
    { status: 503 },
  );
}

/**
 * Wraps an async API handler with try/catch error handling.
 * Use this in every API route:
 *
 * ```ts
 * export const GET = apiHandler(async (req) => { ... });
 * ```
 */
export function apiHandler<T>(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<T>,
): (req: NextRequest, ...args: unknown[]) => Promise<T | Response> {
  return async (req: NextRequest, ...args: unknown[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return internalError(err, { url: req.url, method: req.method });
    }
  };
}
