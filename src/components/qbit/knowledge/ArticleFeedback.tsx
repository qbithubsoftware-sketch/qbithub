"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";
import type { FeedbackType } from "@/lib/knowledge/types";

/**
 * ArticleFeedback — feedback bar for a knowledge article.
 *
 * Supports four actions: Helpful, Not Helpful, Suggest Improvement,
 * Report Issue.  The suggestion and report actions open a small
 * textarea inline.
 */
export function ArticleFeedback({
  helpfulCount = 0,
  notHelpfulCount = 0,
}: {
  helpfulCount?: number;
  notHelpfulCount?: number;
}) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<FeedbackType | null>(null);
  const [showTextarea, setShowTextarea] = useState(false);
  const [comment, setComment] = useState("");

  function handleFeedback(type: FeedbackType) {
    setSelected(type);
    if (type === "helpful") {
      toast({ title: "Thank you!", description: "We're glad this article was helpful." });
    } else if (type === "not_helpful") {
      toast({ title: "Feedback recorded", description: "We'll work on improving this article." });
    } else {
      setShowTextarea(true);
    }
  }

  function submitComment() {
    toast({
      title: selected === "suggestion" ? "Suggestion submitted" : "Issue reported",
      description: "Thank you for helping us improve the Knowledge Base.",
    });
    setShowTextarea(false);
    setComment("");
    setSelected(null);
  }

  return (
    <SurfaceCard className="p-5">
      <p className="text-sm font-semibold text-qbit-on-surface mb-1">Was this article helpful?</p>
      <p className="text-xs text-qbit-on-surface-variant mb-4">
        <span className="text-emerald-600 font-semibold">{helpfulCount}</span> found this helpful ·{" "}
        <span className="text-red-600 font-semibold">{notHelpfulCount}</span> did not
      </p>
      <div className="flex flex-wrap gap-2">
        <FeedbackButton
          icon="thumb_up"
          label="Helpful"
          active={selected === "helpful"}
          onClick={() => handleFeedback("helpful")}
        />
        <FeedbackButton
          icon="thumb_down"
          label="Not Helpful"
          active={selected === "not_helpful"}
          onClick={() => handleFeedback("not_helpful")}
        />
        <FeedbackButton
          icon="edit_note"
          label="Suggest Improvement"
          active={selected === "suggestion"}
          onClick={() => handleFeedback("suggestion")}
        />
        <FeedbackButton
          icon="report"
          label="Report Issue"
          active={selected === "report"}
          onClick={() => handleFeedback("report")}
        />
      </div>
      {showTextarea && (
        <div className="mt-4 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              selected === "suggestion"
                ? "Describe how we can improve this article..."
                : "Describe the issue you encountered..."
            }
            rows={3}
            className="w-full rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low p-3 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
          />
          <div className="flex gap-2 justify-end">
            <QbitButton
              size="sm"
              variant="outline"
              onClick={() => {
                setShowTextarea(false);
                setSelected(null);
              }}
            >
              Cancel
            </QbitButton>
            <QbitButton size="sm" variant="primary" onClick={submitComment} disabled={!comment.trim()}>
              Submit
            </QbitButton>
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}

function FeedbackButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-qbit-primary bg-qbit-primary/10 text-qbit-primary"
          : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container",
      )}
    >
      <Icon name={icon} className="text-[14px]" />
      {label}
    </button>
  );
}
