/**
 * Customer feedback library — submit + aggregate.
 *
 * Submits customer feedback (rating + comment) and updates the
 * InstallationRating aggregate for the engineer.
 */

import { db } from "@/lib/db";
import type { FeedbackSubmission, FeedbackRecord } from "./types";

interface SubmitFeedbackArgs extends FeedbackSubmission {
  workOrderId: string;
  trackingTokenId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Submits customer feedback for a work order.
 * Throws if feedback already exists (one per work order).
 */
export async function submitFeedback(args: SubmitFeedbackArgs): Promise<FeedbackRecord> {
  // Validate rating range
  if (args.overallRating < 1 || args.overallRating > 5) {
    throw new Error("Overall rating must be between 1 and 5");
  }

  // Check for existing feedback (unique constraint on workOrderId)
  const existing = await db.customerFeedback.findUnique({
    where: { workOrderId: args.workOrderId },
  });
  if (existing) {
    throw new Error("Feedback has already been submitted for this work order.");
  }

  // Create feedback record
  const feedback = await db.customerFeedback.create({
    data: {
      workOrderId: args.workOrderId,
      trackingTokenId: args.trackingTokenId ?? null,
      overallRating: args.overallRating,
      punctualityRating: args.punctualityRating,
      professionalismRating: args.professionalismRating,
      qualityRating: args.qualityRating,
      communicationRating: args.communicationRating,
      comment: args.comment ?? null,
      recommendImprovement: args.recommendImprovement ?? null,
      wouldRecommend: args.wouldRecommend ?? null,
      customerName: args.customerName ?? null,
      ipAddress: args.ipAddress ?? null,
      userAgent: args.userAgent ?? null,
    },
  });

  // Update engineer's aggregate rating (fire-and-forget, non-fatal)
  void updateEngineerRating(feedback.workOrderId).catch(() => {
    // Non-fatal — feedback is still submitted
  });

  return {
    id: feedback.id,
    workOrderId: feedback.workOrderId,
    overallRating: feedback.overallRating,
    punctualityRating: feedback.punctualityRating ?? undefined,
    professionalismRating: feedback.professionalismRating ?? undefined,
    qualityRating: feedback.qualityRating ?? undefined,
    communicationRating: feedback.communicationRating ?? undefined,
    comment: feedback.comment ?? undefined,
    recommendImprovement: feedback.recommendImprovement ?? undefined,
    wouldRecommend: feedback.wouldRecommend ?? undefined,
    customerName: feedback.customerName ?? undefined,
    submittedAt: feedback.submittedAt.toISOString(),
  };
}

/**
 * Updates (or creates) the InstallationRating aggregate for the engineer
 * assigned to the work order.
 */
async function updateEngineerRating(workOrderId: string): Promise<void> {
  const wo = await db.workOrder.findUnique({
    where: { id: workOrderId },
    select: { assignedEngineerId: true },
  });
  if (!wo?.assignedEngineerId) return;

  const engineerId = wo.assignedEngineerId;

  // Fetch all feedback for work orders assigned to this engineer
  const allFeedback = await db.customerFeedback.findMany({
    where: { workOrder: { assignedEngineerId: engineerId } },
    select: {
      overallRating: true,
      punctualityRating: true,
      professionalismRating: true,
      qualityRating: true,
      communicationRating: true,
      submittedAt: true,
    },
  });

  if (allFeedback.length === 0) return;

  const total = allFeedback.length;
  const sumOverall = allFeedback.reduce((s, f) => s + f.overallRating, 0);
  const avg = sumOverall / total;

  const countByRating = (n: number) => allFeedback.filter((f) => f.overallRating === n).length;

  const avgOrNull = (selector: (f: typeof allFeedback[0]) => number | null): number | null => {
    const values = allFeedback.map(selector).filter((v): v is number => v !== null);
    return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;
  };

  // Upsert the aggregate
  await db.installationRating.upsert({
    where: { engineerId },
    update: {
      totalRatings: total,
      averageRating: Math.round(avg * 100) / 100,
      fiveStarCount: countByRating(5),
      fourStarCount: countByRating(4),
      threeStarCount: countByRating(3),
      twoStarCount: countByRating(2),
      oneStarCount: countByRating(1),
      avgPunctuality: avgOrNull((f) => f.punctualityRating),
      avgProfessionalism: avgOrNull((f) => f.professionalismRating),
      avgQuality: avgOrNull((f) => f.qualityRating),
      avgCommunication: avgOrNull((f) => f.communicationRating),
      lastRatingAt: new Date(),
    },
    create: {
      engineerId,
      totalRatings: total,
      averageRating: Math.round(avg * 100) / 100,
      fiveStarCount: countByRating(5),
      fourStarCount: countByRating(4),
      threeStarCount: countByRating(3),
      twoStarCount: countByRating(2),
      oneStarCount: countByRating(1),
      avgPunctuality: avgOrNull((f) => f.punctualityRating),
      avgProfessionalism: avgOrNull((f) => f.professionalismRating),
      avgQuality: avgOrNull((f) => f.qualityRating),
      avgCommunication: avgOrNull((f) => f.communicationRating),
      lastRatingAt: new Date(),
    },
  });
}

/**
 * Returns the public-facing engineer rating (sanitized).
 */
export async function getEngineerRatingPublic(engineerId: string): Promise<{
  totalRatings: number;
  averageRating: number;
  lastRatingAt: string | null;
} | null> {
  const rating = await db.installationRating.findUnique({
    where: { engineerId },
    select: {
      totalRatings: true,
      averageRating: true,
      lastRatingAt: true,
    },
  });
  if (!rating) return null;
  return {
    totalRatings: rating.totalRatings,
    averageRating: rating.averageRating,
    lastRatingAt: rating.lastRatingAt?.toISOString() ?? null,
  };
}
