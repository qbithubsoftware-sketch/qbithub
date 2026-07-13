"use client";

/**
 * RatingCard — displays existing feedback (after submission).
 *
 * Reuses StatusBadge + Icon.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";

interface RatingCardProps {
  overallRating: number;
  comment?: string | null;
  recommendImprovement?: string | null;
  wouldRecommend?: boolean | null;
  customerName?: string | null;
  submittedAt: string;
}

export function RatingCard({
  overallRating,
  comment,
  recommendImprovement,
  wouldRecommend,
  customerName,
  submittedAt,
}: RatingCardProps) {
  return (
    <SurfaceCard className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
          Your Feedback
        </p>
        <StatusBadge variant="success" dot>Submitted</StatusBadge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Icon
              key={star}
              name="star"
              className={
                "text-[24px] " +
                (star <= overallRating ? "text-amber-400" : "text-qbit-surface-container-highest")
              }
              filled={star <= overallRating}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-qbit-on-surface">
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][overallRating]}
        </span>
      </div>

      {comment && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase text-qbit-on-surface-variant">Comment</p>
          <p className="text-sm text-qbit-on-surface">{comment}</p>
        </div>
      )}

      {recommendImprovement && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold uppercase text-qbit-on-surface-variant">
            Improvement Suggestion
          </p>
          <p className="text-sm text-qbit-on-surface">{recommendImprovement}</p>
        </div>
      )}

      {wouldRecommend !== null && wouldRecommend !== undefined && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold uppercase text-qbit-on-surface-variant">
            Would Recommend QBIT?
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-qbit-surface-container-low px-2 py-1">
            <Icon
              name={wouldRecommend ? "thumb_up" : "thumb_down"}
              className={"text-[14px] " + (wouldRecommend ? "text-qbit-success" : "text-qbit-error")}
              filled
            />
            <span className="text-xs font-medium">{wouldRecommend ? "Yes" : "No"}</span>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-qbit-outline-variant/50 pt-3 text-[10px] text-qbit-on-surface-variant">
        {customerName && <span>By {customerName} · </span>}
        Submitted on {new Date(submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </div>
    </SurfaceCard>
  );
}
