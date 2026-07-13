/**
 * Tracking token library — generation, validation, audit.
 *
 * Tokens are 32-char URL-safe random strings stored in TrackingToken table.
 * One work order can have multiple tokens (e.g. one for email, one for WhatsApp)
 * so individual channels can be revoked without disrupting others.
 */

import { db } from "@/lib/db";
import { generateTrackingToken } from "./types";

interface CreateTokenArgs {
  workOrderId: string;
  source?: string; // "email" | "whatsapp" | "sms" | "qr_code" | "manual"
  createdBy?: string; // User.id or "system"
  expiresAt?: Date | null;
}

/**
 * Creates a new tracking token for a work order.
 * Returns the token string (URL-safe, 32 chars).
 */
export async function createTrackingToken(args: CreateTokenArgs): Promise<{
  token: string;
  id: string;
  trackingUrl: string;
}> {
  const token = generateTrackingToken();
  const row = await db.trackingToken.create({
    data: {
      token,
      workOrderId: args.workOrderId,
      source: args.source ?? "manual",
      createdBy: args.createdBy ?? "system",
      expiresAt: args.expiresAt ?? null,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://qbithub.vercel.app";
  return {
    token,
    id: row.id,
    trackingUrl: `${baseUrl}/?track=${token}`,
  };
}

/**
 * Validates a tracking token and returns the associated work order ID.
 * Side effects: increments viewCount, updates lastViewedAt + IP + UA.
 *
 * Returns null if:
 *   - Token not found
 *   - Token is inactive (revoked)
 *   - Token has expired
 */
export async function validateTrackingToken(
  token: string,
  requestMetadata?: { ip?: string; userAgent?: string },
): Promise<{ workOrderId: string; tokenId: string } | null> {
  const normalized = token.trim();
  if (!normalized || normalized.length < 16 || normalized.length > 64) {
    return null;
  }

  const row = await db.trackingToken.findUnique({
    where: { token: normalized },
    select: {
      id: true,
      workOrderId: true,
      isActive: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  if (!row) return null;
  if (!row.isActive || row.revokedAt) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

  // Increment view count + update last viewed (fire-and-forget)
  void db.trackingToken.update({
    where: { id: row.id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date(),
      lastViewedIp: requestMetadata?.ip ?? null,
      lastViewedUserAgent: requestMetadata?.userAgent ?? null,
    },
  }).catch(() => {
    // Non-fatal — don't fail the request if audit update fails
  });

  return { workOrderId: row.workOrderId, tokenId: row.id };
}

/**
 * Revokes a tracking token. The customer will see "link expired" if they
 * try to access it again.
 */
export async function revokeTrackingToken(
  tokenId: string,
  reason: string,
): Promise<void> {
  await db.trackingToken.update({
    where: { id: tokenId },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
}

/**
 * Lists all active tokens for a work order (admin view).
 */
export async function listTokensForWorkOrder(workOrderId: string) {
  return db.trackingToken.findMany({
    where: { workOrderId },
    orderBy: { createdAt: "desc" },
  });
}
