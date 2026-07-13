/**
 * POST /api/public/track/[token]/feedback — submit customer feedback (no auth)
 * GET  /api/public/track/[token]/feedback — check if feedback already submitted
 *
 * POST Body: FeedbackSubmission
 *   - overallRating: 1-5 (required)
 *   - punctualityRating, professionalismRating, qualityRating, communicationRating: 1-5 (optional)
 *   - comment, recommendImprovement: string (optional)
 *   - wouldRecommend: boolean (optional)
 *   - customerName: string (optional)
 *
 * One feedback per work order — enforced by unique constraint.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateTrackingToken } from "@/lib/tracking/tokens";
import { submitFeedback } from "@/lib/tracking/feedback";
import { sanitizeText } from "@/lib/security/validation";
import type { FeedbackSubmission } from "@/lib/tracking/types";

interface Params {
  params: Promise<{ token: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  // Validate token first
  const tokenInfo = await validateTrackingToken(token, { ip, userAgent });
  if (!tokenInfo) {
    return NextResponse.json(
      { error: "Invalid or expired tracking link" },
      { status: 404 },
    );
  }

  // Parse body
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (typeof body.overallRating !== "number" || body.overallRating < 1 || body.overallRating > 5) {
    return NextResponse.json(
      { error: "overallRating is required and must be between 1 and 5" },
      { status: 400 },
    );
  }

  // Sanitize string inputs
  const submission: FeedbackSubmission = {
    overallRating: body.overallRating,
    punctualityRating: typeof body.punctualityRating === "number" ? body.punctualityRating : undefined,
    professionalismRating: typeof body.professionalismRating === "number" ? body.professionalismRating : undefined,
    qualityRating: typeof body.qualityRating === "number" ? body.qualityRating : undefined,
    communicationRating: typeof body.communicationRating === "number" ? body.communicationRating : undefined,
    comment: body.comment ? sanitizeText(String(body.comment), 2000) : undefined,
    recommendImprovement: body.recommendImprovement ? sanitizeText(String(body.recommendImprovement), 1000) : undefined,
    wouldRecommend: typeof body.wouldRecommend === "boolean" ? body.wouldRecommend : undefined,
    customerName: body.customerName ? sanitizeText(String(body.customerName), 100) : undefined,
  };

  try {
    const feedback = await submitFeedback({
      ...submission,
      workOrderId: tokenInfo.workOrderId,
      trackingTokenId: tokenInfo.tokenId,
      ipAddress: ip,
      userAgent,
    });
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to submit feedback";
    const status = message.includes("already been submitted") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * GET — check if feedback already submitted for this work order.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const tokenInfo = await validateTrackingToken(token);
  if (!tokenInfo) {
    return NextResponse.json({ error: "Invalid or expired tracking link" }, { status: 404 });
  }

  const feedback = await db.customerFeedback.findUnique({
    where: { workOrderId: tokenInfo.workOrderId },
    select: {
      id: true,
      overallRating: true,
      comment: true,
      recommendImprovement: true,
      wouldRecommend: true,
      customerName: true,
      submittedAt: true,
    },
  });

  return NextResponse.json({ feedback });
}
