/**
 * Monitoring interface — provider-agnostic.
 *
 * Supports error tracking, performance monitoring, and custom metrics.
 * The default implementation is a no-op.  In production, set a custom
 * monitor via `setMonitor()` with a Sentry, OpenTelemetry, or
 * Application Insights adapter.
 */

export interface MonitoringSpan {
  name: string;
  startTime: number;
  endTime?: number;
  attributes?: Record<string, unknown>;
}

export interface Monitor {
  /** Capture an exception for error tracking. */
  captureException(error: Error, context?: Record<string, unknown>): void;

  /** Capture a custom message/event. */
  captureMessage(message: string, level?: "info" | "warning" | "error"): void;

  /** Start a performance span (returns a handle to end it). */
  startSpan(name: string, attributes?: Record<string, unknown>): MonitoringSpan;

  /** End a performance span and record the duration. */
  endSpan(span: MonitoringSpan): void;

  /** Set the current user context. */
  setUser(user: { id: string; email?: string; role?: string }): void;

  /** Clear the current user context. */
  clearUser(): void;
}

// ---------- No-op Monitor (default) ----------

class NoopMonitor implements Monitor {
  captureException(error: Error, _context?: Record<string, unknown>): void {
    // Fallback: log to console if no monitor is set
    console.error("[Monitor] Exception:", error.message, _context);
  }

  captureMessage(_message: string, _level?: "info" | "warning" | "error"): void {
    // No-op
  }

  startSpan(name: string, attributes?: Record<string, unknown>): MonitoringSpan {
    return { name, startTime: Date.now(), attributes };
  }

  endSpan(span: MonitoringSpan): void {
    span.endTime = Date.now();
    const duration = span.endTime - span.startTime;
    if (process.env.NODE_ENV === "development") {
      console.debug(`[Monitor] Span "${span.name}" took ${duration}ms`);
    }
  }

  setUser(_user: { id: string; email?: string; role?: string }): void {
    // No-op
  }

  clearUser(): void {
    // No-op
  }
}

// ---------- Singleton ----------

let monitorInstance: Monitor | null = null;

/**
 * Returns the active monitor.  Defaults to NoopMonitor.
 * In production, set a custom monitor via `setMonitor()`.
 */
export function getMonitor(): Monitor {
  if (!monitorInstance) {
    monitorInstance = new NoopMonitor();
  }
  return monitorInstance;
}

/**
 * Sets a custom monitor (e.g. Sentry, OpenTelemetry, Application Insights).
 * Call this once at application startup.
 */
export function setMonitor(monitor: Monitor): void {
  monitorInstance = monitor;
}

// ---------- Convenience: Sentry adapter example (commented) ----------
/*
import * as Sentry from "@sentry/nextjs";

class SentryMonitor implements Monitor {
  captureException(error: Error, context?: Record<string, unknown>) {
    Sentry.captureException(error, { extra: context });
  }
  captureMessage(message: string, level?: "info" | "warning" | "error") {
    Sentry.captureMessage(message, level);
  }
  startSpan(name: string, attributes?: Record<string, unknown>) {
    return Sentry.startSpan({ name, attributes }, () => ({ name, startTime: Date.now(), attributes }));
  }
  endSpan(span: MonitoringSpan) { // Sentry handles this automatically
  }
  setUser(user: { id: string; email?: string; role?: string }) {
    Sentry.setUser(user);
  }
  clearUser() {
    Sentry.setUser(null);
  }
}

// At startup: setMonitor(new SentryMonitor());
*/
