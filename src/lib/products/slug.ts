/**
 * Shared slug helpers for QbitProduct.
 *
 * The slug is used as the URL key for /products/[slug] deep links, so it must
 * be URL-safe, lowercase, and unique. We auto-derive it from `model` (the
 * preferred unique field) by stripping non-alphanumeric chars and joining
 * with hyphens. If a slug collision occurs, we append a numeric suffix.
 *
 * Examples:
 *   "T-800"     → "t800"
 *   "HUB-X Pro" → "hub-x-pro"
 *   "SM-E1"     → "sm-e1"
 */

import { db } from "@/lib/db";

/**
 * Convert a free-text model / name into a URL-safe slug.
 * Preserves hyphens (so "HUB-X" → "hub-x" not "hubb"), strips other punctuation.
 */
export function slugifyModel(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")   // collapse non-alphanum to single hyphen
    .replace(/^-+|-+$/g, "")       // strip leading/trailing hyphens
    .replace(/-{2,}/g, "-");       // collapse multiple hyphens
}

/**
 * Generate a unique slug for a product. If the derived slug already exists
 * (and isn't owned by the same product when `existingId` is provided), append
 * `-2`, `-3`, etc. until unique.
 *
 * Always call this when creating or updating a product — never trust
 * client-supplied slugs blindly.
 */
export async function generateUniqueSlug(
  model: string,
  existingId?: string,
  desiredSlug?: string,
): Promise<string> {
  const base = slugifyModel(desiredSlug ?? model);
  if (!base) throw new Error("Cannot generate slug from empty model");

  // Check if base slug is available
  const existing = await db.qbitProduct.findUnique({ where: { slug: base } });
  if (!existing || existing.id === existingId) return base;

  // Try -2, -3, ... up to -99
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    const dup = await db.qbitProduct.findUnique({ where: { slug: candidate } });
    if (!dup || dup.id === existingId) return candidate;
  }

  // Fallback: append cuid-like timestamp suffix
  return `${base}-${Date.now().toString(36)}`;
}
