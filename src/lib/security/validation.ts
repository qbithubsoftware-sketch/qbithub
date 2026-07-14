/**
 * Input validation and sanitization utilities.
 *
 * All user-supplied input that reaches a Prisma query or is stored in
 * the database MUST pass through these functions.
 */

/** Truncates a string to a max length (prevents DoS via huge payloads). */
export function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

/** Strips HTML tags from a string (prevents XSS). */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

/** Escapes special characters for safe display (prevents XSS). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Validates an email address format. */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/** Validates a URL format. */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/** Validates a YouTube video ID (11 characters, alphanumeric + - _). */
export function isValidYouTubeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/** Sanitizes a text input for safe storage (truncates + strips HTML). */
export function sanitizeText(value: unknown, maxLen: number = 5000): string {
  if (typeof value !== "string") return "";
  return truncate(stripHtml(value.trim()), maxLen);
}

/** Sanitizes an email input. */
export function sanitizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().toLowerCase();
  return isValidEmail(trimmed) ? truncate(trimmed, 254) : "";
}

/** Validates required fields in a request body. Returns missing field names. */
export function validateRequired(
  body: Record<string, unknown>,
  required: string[],
): string[] {
  return required.filter((field) => {
    const val = body[field];
    return val === undefined || val === null || (typeof val === "string" && val.trim() === "");
  });
}

/** Returns a safe string from an unknown value, or a default. */
export function safeString(value: unknown, defaultValue: string = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return defaultValue;
}

/** Returns a safe number from an unknown value, or a default. */
export function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (!isNaN(n)) return n;
  }
  return defaultValue;
}

/** Checks if a string contains only safe characters (alphanumeric + common punctuation). */
export function isSafeText(value: string): boolean {
  // Allows letters, numbers, spaces, and common punctuation
  return /^[a-zA-Z0-9\s\-_.,!?@():;'"]+$/.test(value);
}
