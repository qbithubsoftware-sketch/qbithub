"use client";

/**
 * DeviceTestCard — displays a single test result.
 *
 * Reuses SurfaceCard, Icon, StatusBadge, TagBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type TestResultDTO,
  TEST_STATUS_VARIANTS,
  TEST_STATUS_LABELS,
  TEST_STATUS_ICONS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
} from "@/lib/test-center/types";

interface DeviceTestCardProps {
  result: TestResultDTO;
}

export function DeviceTestCard({ result }: DeviceTestCardProps) {
  const isFailed = result.status === "failed" || result.status === "warning";

  return (
    <SurfaceCard className={
      "p-4 " +
      (result.status === "failed" ? "border-qbit-error/30 bg-qbit-error/5"
      : result.status === "warning" ? "border-qbit-warning/30 bg-qbit-warning/5"
      : result.status === "passed" ? "border-qbit-success/20"
      : "")
    }>
      <div className="flex items-start gap-3">
        <div className={
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
          (result.status === "passed" ? "bg-qbit-success/10 text-qbit-success"
          : result.status === "failed" ? "bg-qbit-error/10 text-qbit-error"
          : result.status === "warning" ? "bg-qbit-warning/10 text-qbit-warning"
          : "bg-qbit-surface-container-high text-qbit-on-surface-variant")
        }>
          <Icon name={CATEGORY_ICONS[result.testCategory] ?? "science"} className="text-[18px]" filled />
        </div>
        <div className="min-w-0 flex-1">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-qbit-on-surface">{result.testName}</h4>
            <StatusBadge variant={TEST_STATUS_VARIANTS[result.status]} icon={TEST_STATUS_ICONS[result.status]} dot>
              {TEST_STATUS_LABELS[result.status]}
            </StatusBadge>
          </div>

          {/* Category + duration */}
          <div className="mt-1 flex items-center gap-2">
            <TagBadge variant="neutral">{CATEGORY_LABELS[result.testCategory]}</TagBadge>
            {result.duration !== null && (
              <span className="text-[10px] text-qbit-on-surface-variant">
                <Icon name="schedule" className="mr-0.5 inline text-[10px]" />
                {result.duration}ms
              </span>
            )}
          </div>

          {/* Message */}
          {result.message && (
            <p className="mt-2 text-xs text-qbit-on-surface-variant">{result.message}</p>
          )}

          {/* Possible cause + recommendation (if failed/warning) */}
          {isFailed && result.possibleCause && (
            <div className="mt-2 rounded-md bg-qbit-error/5 px-2 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-error">Possible Cause</p>
              <p className="text-xs text-qbit-on-surface">{result.possibleCause}</p>
            </div>
          )}
          {isFailed && result.recommendedAction && (
            <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-qbit-primary/5 px-2 py-1">
              <Icon name="lightbulb" className="text-[14px] text-qbit-primary" filled />
              <span className="text-xs font-medium text-qbit-primary">{result.recommendedAction}</span>
            </div>
          )}

          {/* KB article link */}
          {isFailed && result.kbArticleUrl && (
            <a
              href={result.kbArticleUrl}
              target="_blank" rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-qbit-primary hover:underline"
            >
              <Icon name="library_books" className="text-[12px]" />
              Knowledge Base Article
            </a>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
