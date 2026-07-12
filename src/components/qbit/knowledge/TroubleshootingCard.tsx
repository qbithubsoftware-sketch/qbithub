"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import type { TroubleshootingIssueEntry, ArticleDifficulty } from "@/lib/knowledge/types";

const DIFFICULTY_VARIANT: Record<ArticleDifficulty, "success" | "warning" | "error"> = {
  Beginner: "success",
  Intermediate: "warning",
  Expert: "error",
} as const;

/**
 * TroubleshootingCard — professional issue card showing symptoms, possible
 * causes, step-by-step resolution, and related assets.
 *
 * Expandable: the summary (title, symptoms, difficulty) always shows; the
 * full resolution steps and related links appear when expanded.
 */
export function TroubleshootingCard({
  issue,
  onBookmark,
  isBookmarked = false,
  onViewDetails,
}: {
  issue: TroubleshootingIssueEntry;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  onViewDetails?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <SurfaceCard className="p-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-error-container text-qbit-on-error-container">
          <Icon name="build_circle" className="text-[20px]" filled />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-qbit-on-surface">{issue.title}</h4>
            <StatusBadge variant={DIFFICULTY_VARIANT[issue.difficulty]}>
              {issue.difficulty}
            </StatusBadge>
            {issue.productName && (
              <span className="text-[10px] font-bold uppercase text-qbit-on-surface-variant bg-qbit-surface-container-high px-1.5 py-0.5 rounded">
                {issue.productName}
              </span>
            )}
          </div>
          <p className="text-xs text-qbit-on-surface-variant flex items-center gap-1">
            <Icon name="visibility" className="text-[12px]" />
            {issue.viewCountLabel} views
          </p>
        </div>
        {onBookmark && (
          <button
            onClick={onBookmark}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark issue"}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors shrink-0",
              isBookmarked
                ? "text-qbit-primary"
                : "text-qbit-on-surface-variant hover:text-qbit-primary hover:bg-qbit-surface-container",
            )}
          >
            <Icon name={isBookmarked ? "bookmark" : "bookmark_border"} className="text-[18px]" filled={isBookmarked} />
          </button>
        )}
      </div>

      {/* Symptoms preview */}
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-1.5 flex items-center gap-1">
          <Icon name="symptoms" className="text-[12px]" />
          Symptoms
        </p>
        <ul className="space-y-0.5">
          {issue.symptoms.slice(0, expanded ? undefined : 2).map((symptom, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-qbit-on-surface-variant">
              <Icon name="circle" className="text-[6px] mt-1.5 shrink-0 text-qbit-outline" />
              <span>{symptom}</span>
            </li>
          ))}
          {!expanded && issue.symptoms.length > 2 && (
            <li className="text-[11px] text-qbit-primary font-medium">
              +{issue.symptoms.length - 2} more symptoms
            </li>
          )}
        </ul>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-4 mt-4 pt-4 border-t border-qbit-outline-variant/40">
          {/* Possible Causes */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-1.5 flex items-center gap-1">
              <Icon name="help" className="text-[12px]" />
              Possible Causes
            </p>
            <ul className="space-y-0.5">
              {issue.causes.map((cause, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-qbit-on-surface-variant">
                  <Icon name="circle" className="text-[6px] mt-1.5 shrink-0 text-qbit-outline" />
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Resolution steps */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2 flex items-center gap-1">
              <Icon name="check_circle" className="text-[12px] text-emerald-500" />
              Step-by-Step Resolution
            </p>
            <ol className="space-y-2">
              {issue.steps.map((step) => (
                <li key={step.id} className="flex gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-qbit-primary text-[10px] font-bold text-qbit-on-primary">
                    {step.stepNumber}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-qbit-on-surface">{step.title}</p>
                    <p className="text-xs text-qbit-on-surface-variant mt-0.5">{step.description}</p>
                    {step.warning && (
                      <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                        <Icon name="warning" className="text-[12px]" filled />
                        {step.warning}
                      </p>
                    )}
                    {step.tip && (
                      <p className="text-[11px] text-qbit-primary mt-1 flex items-center gap-1">
                        <Icon name="lightbulb" className="text-[12px]" filled />
                        {step.tip}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Related assets */}
          {(issue.relatedDownloadIds?.length || issue.relatedGuideIds?.length || issue.relatedVideoUrls?.length) && (
            <div className="flex flex-wrap gap-2">
              {issue.relatedDownloadIds?.length && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-qbit-primary bg-qbit-primary/10 px-2 py-0.5 rounded-full">
                  <Icon name="download" className="text-[12px]" />
                  {issue.relatedDownloadIds.length} Related Downloads
                </span>
              )}
              {issue.relatedGuideIds?.length && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-qbit-primary bg-qbit-primary/10 px-2 py-0.5 rounded-full">
                  <Icon name="menu_book" className="text-[12px]" />
                  Installation Guide
                </span>
              )}
              {issue.relatedVideoUrls?.length && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-qbit-on-surface-variant bg-qbit-surface-container-high px-2 py-0.5 rounded-full">
                  <Icon name="play_circle" className="text-[12px]" />
                  {issue.relatedVideoUrls.length} Videos
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toggle */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-qbit-outline-variant/40">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline"
        >
          {expanded ? "Show less" : "View full resolution"}
          <Icon name={expanded ? "expand_less" : "expand_more"} className="text-[16px]" />
        </button>
        {onViewDetails && (
          <QbitButton size="sm" variant="ghost" icon="open_in_new" onClick={onViewDetails} className="ml-auto">
            Open details
          </QbitButton>
        )}
      </div>
    </SurfaceCard>
  );
}
