/**
 * Structured logging interface — provider-agnostic.
 *
 * The application talks to loggers through the `Logger` interface.
 * The default implementation is a console logger.  In production,
 * adapters for Sentry, Datadog, or Application Insights can be
 * added by implementing the `Logger` interface.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  fatal(message: string, meta?: Record<string, unknown>): void;
}

// ---------- Console Logger (default) ----------

class ConsoleLogger implements Logger {
  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(JSON.stringify(this.format("debug", message, meta)));
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(JSON.stringify(this.format("info", message, meta)));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(JSON.stringify(this.format("warn", message, meta)));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(JSON.stringify(this.format("error", message, meta)));
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    console.error(JSON.stringify(this.format("fatal", message, meta)));
  }
}

// ---------- Singleton ----------

let loggerInstance: Logger | null = null;

/**
 * Returns the active logger.  Defaults to ConsoleLogger.
 * In production, set a custom logger via `setLogger()`.
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new ConsoleLogger();
  }
  return loggerInstance;
}

/**
 * Sets a custom logger (e.g. Sentry, Datadog, Application Insights).
 * Call this once at application startup.
 */
export function setLogger(logger: Logger): void {
  loggerInstance = logger;
}

// ---------- Convenience exports ----------

export const log = {
  debug: (msg: string, meta?: Record<string, unknown>) => getLogger().debug(msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => getLogger().info(msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => getLogger().warn(msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => getLogger().error(msg, meta),
  fatal: (msg: string, meta?: Record<string, unknown>) => getLogger().fatal(msg, meta),
};
