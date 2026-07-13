"use client";

/**
 * FeedbackForm — star rating + comment + recommend improvement + submit.
 *
 * Reuses QbitButton + Icon + useToast.
 * Posts to /api/public/track/[token]/feedback.
 */

import { useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface FeedbackFormProps {
  token: string;
  onSubmitted?: () => void;
}

const CATEGORIES = [
  { key: "punctualityRating", label: "Punctuality", icon: "schedule" },
  { key: "professionalismRating", label: "Professionalism", icon: "verified" },
  { key: "qualityRating", label: "Work Quality", icon: "high_quality" },
  { key: "communicationRating", label: "Communication", icon: "chat" },
] as const;

export function FeedbackForm({ token, onSubmitted }: FeedbackFormProps) {
  const { toast } = useToast();
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [recommendImprovement, setRecommendImprovement] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStarClick = (rating: number) => setOverallRating(rating);
  const handleStarHover = (rating: number) => setHoverRating(rating);
  const handleStarLeave = () => setHoverRating(0);

  const handleCategoryClick = (key: string, rating: number) => {
    setCategoryRatings((prev) => ({ ...prev, [key]: rating }));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast({
        title: "Please rate your experience",
        description: "Click on the stars to give an overall rating.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/track/${token}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallRating,
          punctualityRating: categoryRatings.punctualityRating,
          professionalismRating: categoryRatings.professionalismRating,
          qualityRating: categoryRatings.qualityRating,
          communicationRating: categoryRatings.communicationRating,
          comment: comment.trim() || undefined,
          recommendImprovement: recommendImprovement.trim() || undefined,
          wouldRecommend: wouldRecommend,
          customerName: customerName.trim() || undefined,
        }),
      });
      if (res.status === 409) {
        toast({
          title: "Already submitted",
          description: "Feedback has already been submitted for this work order.",
          variant: "destructive",
        });
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Submission failed");
      }
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
      onSubmitted?.();
    } catch (e) {
      toast({
        title: "Submission failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall rating */}
      <div>
        <p className="mb-2 text-sm font-semibold text-qbit-on-surface">
          Overall Rating <span className="text-qbit-error">*</span>
        </p>
        <div
          className="flex gap-1"
          onMouseLeave={handleStarLeave}
          role="radiogroup"
          aria-label="Overall rating"
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = (hoverRating || overallRating) >= star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                className="rounded p-1 transition-transform hover:scale-110"
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                role="radio"
                aria-checked={overallRating === star}
              >
                <Icon
                  name="star"
                  className={
                    "text-[40px] transition-colors " +
                    (filled ? "text-amber-400" : "text-qbit-surface-container-highest")
                  }
                  filled={filled}
                />
              </button>
            );
          })}
        </div>
        {overallRating > 0 && (
          <p className="mt-1 text-xs text-qbit-on-surface-variant">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][overallRating]}
          </p>
        )}
      </div>

      {/* Category ratings */}
      <div>
        <p className="mb-2 text-sm font-semibold text-qbit-on-surface">
          Category Ratings <span className="text-qbit-on-surface-variant">(optional)</span>
        </p>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name={cat.icon} className="text-[16px] text-qbit-on-surface-variant" />
                <span className="text-sm text-qbit-on-surface">{cat.label}</span>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (categoryRatings[cat.key] ?? 0) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleCategoryClick(cat.key, star)}
                      className="rounded p-0.5 transition-transform hover:scale-110"
                      aria-label={`${star} star for ${cat.label}`}
                    >
                      <Icon
                        name="star"
                        className={
                          "text-[20px] transition-colors " +
                          (filled ? "text-amber-400" : "text-qbit-surface-container-highest")
                        }
                        filled={filled}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-qbit-on-surface">
          Comments <span className="text-qbit-on-surface-variant">(optional)</span>
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Tell us about your experience…"
          className="resize-none"
          maxLength={2000}
        />
        <p className="mt-1 text-[10px] text-qbit-on-surface-variant">{comment.length}/2000</p>
      </div>

      {/* Recommend improvement */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-qbit-on-surface">
          What could we improve? <span className="text-qbit-on-surface-variant">(optional)</span>
        </label>
        <Textarea
          value={recommendImprovement}
          onChange={(e) => setRecommendImprovement(e.target.value)}
          rows={2}
          placeholder="Any suggestions for improvement…"
          className="resize-none"
          maxLength={1000}
        />
      </div>

      {/* Would recommend */}
      <div>
        <p className="mb-2 text-sm font-semibold text-qbit-on-surface">
          Would you recommend QBIT to others?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWouldRecommend(true)}
            className={
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors " +
              (wouldRecommend === true
                ? "border-qbit-primary bg-qbit-primary text-qbit-on-primary"
                : "border-qbit-outline-variant bg-white text-qbit-on-surface hover:bg-qbit-surface-container-low")
            }
          >
            <Icon name="thumb_up" className="text-[16px]" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => setWouldRecommend(false)}
            className={
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors " +
              (wouldRecommend === false
                ? "border-qbit-error bg-qbit-error text-white"
                : "border-qbit-outline-variant bg-white text-qbit-on-surface hover:bg-qbit-surface-container-low")
            }
          >
            <Icon name="thumb_down" className="text-[16px]" />
            No
          </button>
        </div>
      </div>

      {/* Customer name (optional) */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-qbit-on-surface">
          Your Name <span className="text-qbit-on-surface-variant">(optional)</span>
        </label>
        <Input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Your name (optional)"
          maxLength={100}
        />
      </div>

      <QbitButton
        variant="primary"
        icon={submitting ? "progress_activity" : "send"}
        disabled={submitting || overallRating === 0}
        onClick={handleSubmit}
        fullWidth
      >
        {submitting ? "Submitting…" : "Submit Feedback"}
      </QbitButton>
    </div>
  );
}
