/**
 * Minimal HTML sanitizer — strips dangerous tags and attributes.
 * For production, consider using DOMPurify or sanitize-html.
 */

const DANGEROUS_TAGS = /<(script|iframe|object|embed|link|meta|style|base|form)\b[^>]*>[\s\S]*?<\/\1>/gi;
const DANGEROUS_TAGS_SELF = /<(script|iframe|object|embed|link|meta|base|form)\b[^>]*\/?>/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*"[^"]*"/gi;
const EVENT_HANDLERS_SINGLE = /\s+on\w+\s*=\s*'[^']*'/gi;
const JAVASCRIPT_URLS = /href\s*=\s*"javascript:[^"]*"/gi;
const JAVASCRIPT_URLS_SINGLE = /href\s*=\s*'javascript:[^']*'/gi;

export function sanitizeHtml(html: string): string {
  return html
    .replace(DANGEROUS_TAGS, "")
    .replace(DANGEROUS_TAGS_SELF, "")
    .replace(EVENT_HANDLERS, "")
    .replace(EVENT_HANDLERS_SINGLE, "")
    .replace(JAVASCRIPT_URLS, 'href="#"')
    .replace(JAVASCRIPT_URLS_SINGLE, "href='#'");
}
