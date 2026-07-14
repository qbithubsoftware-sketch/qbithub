"use client";

/**
 * HealthSummaryCard — overall test score + pass/fail/warning breakdown.
 *
 * Reuses SurfaceCard, Icon, StatusBadge, ProgressTracker.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { ProgressTracker } from "@/components/qbit/primitives/ProgressTracker";
import {
  type OverallTestStatus,
  OVERALL_STATUS_VARIANTS,
  OVERALL_STATUS_LABELS,
} from "@/lib/test-center/types";

interface HealthSummaryCardProps {
  overallScore: number;
  overallStatus: OverallTestStatus;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  skippedCount: number;
  notSupportedCount: number;
}

export function HealthSummaryCard(props: HealthSummaryCardProps) {
  const variant = OVERALL_STATUS_VARIANTS[props.overallStatus];

  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between gap-3 border-b border-qbit-outline-variant/50 pb-4">
        <div className="flex items-center gap-3">
          <div className={
            "flex h-14 w-14 items-center justify-center rounded-full " +
            (props.overallStatus === "passed" ? "bg-qbit-success/10 text-qbit-success"
            : props.overallStatus === "partial" ? "bg-qbit-warning/10 text-qbit-warning"
            : props.overallStatus === "failed" ? "bg-qbit-error/10 text-qbit-error"
            : "bg-qbit-surface-container-high text-qbit-on-surface-variant")
          }>
            <Icon name={
              props.overallStatus === "passed" ? "verified"
              : props.overallStatus === "partial" ? "warning"
              : props.overallStatus === "failed" ? "error"
              : "hourglass_empty"
            } className="text-[28px]" filled />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
              Overall Test Score
            </p>
            <p className="text-3xl font-bold text-qbit-on-surface">{props.overallScore}<span className="text-lg text-qbit-on-surface-variant">/100</span></p>
          </div>
        </div>
        <StatusBadge variant={variant} dot>
          {OVERALL_STATUS_LABELS[props.overallStatus]}
        </StatusBadge>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <ProgressTracker
          value={props.overallScore}
          variant={
            props.overallScore >= 80 ? "success"
            : props.overallScore >= 50 ? "warning"
            : "error"
          }
          showPercentage={false}
        />
      </div>

      {/* Breakdown */}
      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
        <StatBox label="Passed" value={props.passedCount} color="text-qbit-success" icon="check_circle" />
        <StatBox label="Failed" value={props.failedCount} color="text-qbit-error" icon="cancel" />
        <StatBox label="Warning" value={props.warningCount} color="text-qbit-warning" icon="warning" />
        <StatBox label="Skipped" value={props.skippedCount} color="text-qbit-on-surface-variant" icon="skip_next" />
        <StatBox label="N/A" value={props.notSupportedCount} color="text-qbit-on-surface-variant" icon="remove_circle" />
      </div>
    </SurfaceCard>
  );
}

function StatBox({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="rounded-lg border border-qbit-outline-variant/50 bg-white p-2">
      <Icon name={icon} className={`mx-auto text-[16px] ${color}`} filled />
      <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-qbit-on-surface-variant">{label}</p>
    </div>
  );
}
