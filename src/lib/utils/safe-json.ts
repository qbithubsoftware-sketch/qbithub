/**
 * Safe JSON parse — never throws. Returns fallback on error.
 */
export function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON parse for arrays — always returns an array.
 */
export function safeJsonArray(str: string | null | undefined): unknown[] {
  return safeJsonParse(str, []);
}
