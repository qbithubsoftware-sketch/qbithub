"use client";

/**
 * IssueCard — displays a single diagnostic finding.
 *
 * Reuses SurfaceCard, Icon, StatusBadge, TagBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type DiagnosticFindingDTO,
  SEVERITY_VARIANTS,
  SEVERITY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CERTAINTY_LABELS,
  CERTAINTY_VARIANTS,
} from "@/lib/diagnostics/types";

interface IssueCardProps {
  finding: DiagnosticFindingDTO;
}

export function IssueCard({ finding }: IssueCardProps) {
  return (
    <SurfaceCard className={
      "p-4 " +
      (finding.severity === "critical" || finding.severity === "error"
        ? "border-qbit-error/30 bg-qbit-error/5"
        : finding.severity === "warning"
          ? "border-qbit-warning/30 bg-qbit-warning/5"
          : "")
    }>
      <div className="flex items-start gap-3">
        <div className={
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
          (finding.severity === "error" || finding.severity === "critical"
            ? "bg-qbit-error/10 text-qbit-error"
            : finding.severity === "warning"
              ? "bg-qbit-warning/10 text-qbit-warning"
              : "bg-qbit-primary/10 text-qbit-primary")
        }>
          <Icon name={CATEGORY_ICONS[finding.category] ?? "info"} className="text-[18px]" filled />
        </div>
        <div className="min-w-0 flex-1">
          {/* Title + badges */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-qbit-on-surface">{finding.title}</h4>
            <StatusBadge variant={SEVERITY_VARIANTS[finding.severity]} dot>
              {SEVERITY_LABELS[finding.severity]}
            </StatusBadge>
          </div>

          {/* Category + certainty tags */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TagBadge variant="neutral">{CATEGORY_LABELS[finding.category]}</TagBadge>
            <TagBadge variant={CERTAINTY_VARIANTS[finding.certainty]}>
              {CERTAINTY_LABELS[finding.certainty]}
            </TagBadge>
          </div>

          {/* Description */}
          <p className="mt-2 text-xs text-qbit-on-surface-variant">{finding.description}</p>

          {/* Evidence */}
          {finding.evidence && finding.evidence.length > 0 && (
            <div className="mt-2 border-t border-qbit-outline-variant/50 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                Evidence
              </p>
              <ul className="mt-1 space-y-0.5">
                {finding.evidence.map((e, idx) => (
                  <li key={idx} className="flex items-start gap-1 text-[10px] text-qbit-on-surface-variant">
                    <Icon name="check" className="mt-0.5 text-[10px] shrink-0 text-qbit-primary" />
                    <span className="font-mono">{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended action */}
          {finding.recommendedAction && (
            <div className="mt-2 flex items-center gap-1.5 rounded-md bg-qbit-primary/5 px-2 py-1">
              <Icon name="lightbulb" className="text-[14px] text-qbit-primary" filled />
              <span className="text-xs font-medium text-qbit-primary">{finding.recommendedAction}</span>
            </div>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
