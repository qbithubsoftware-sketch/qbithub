"use client";

/**
 * HealthScoreCard — displays overall health score + per-category breakdown.
 *
 * Reuses SurfaceCard, Icon, StatusBadge, ProgressTracker.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { ProgressTracker } from "@/components/qbit/primitives/ProgressTracker";
import {
  type HealthGrade,
  HEALTH_GRADE_VARIANTS,
  HEALTH_GRADE_LABELS,
  HEALTH_GRADE_ICONS,
  gradeFromScore,
} from "@/lib/diagnostics/types";

interface HealthScoreCardProps {
  overallScore: number;
  healthGrade: HealthGrade;
  driverScore: number;
  firmwareScore: number;
  connectionScore: number;
  deviceStatusScore: number;
  compatibilityScore: number;
  knowledgeScore: number;
}

export function HealthScoreCard(props: HealthScoreCardProps) {
  const grade = props.healthGrade;
  const variant = HEALTH_GRADE_VARIANTS[grade];
  const icon = HEALTH_GRADE_ICONS[grade];

  const categories = [
    { label: "Driver", score: props.driverScore, icon: "settings_input_component" },
    { label: "Firmware", score: props.firmwareScore, icon: "system_update" },
    { label: "Connection", score: props.connectionScore, icon: "cable" },
    { label: "Device Status", score: props.deviceStatusScore, icon: "print" },
    { label: "Compatibility", score: props.compatibilityScore, icon: "verified_user" },
    { label: "Knowledge", score: props.knowledgeScore, icon: "library_books" },
  ];

  return (
    <SurfaceCard className="p-5">
      {/* Overall score */}
      <div className="flex items-center justify-between gap-3 border-b border-qbit-outline-variant/50 pb-4">
        <div className="flex items-center gap-3">
          <div className={
            "flex h-14 w-14 items-center justify-center rounded-full " +
            (grade === "excellent" ? "bg-qbit-success/10 text-qbit-success"
            : grade === "good" ? "bg-qbit-primary/10 text-qbit-primary"
            : grade === "attention" ? "bg-qbit-warning/10 text-qbit-warning"
            : grade === "critical" ? "bg-qbit-error/10 text-qbit-error"
            : "bg-qbit-surface-container-high text-qbit-on-surface-variant")
          }>
            <Icon name={icon} className="text-[28px]" filled />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
              Overall Health Score
            </p>
            <p className="text-3xl font-bold text-qbit-on-surface">{props.overallScore}<span className="text-lg text-qbit-on-surface-variant">/100</span></p>
          </div>
        </div>
        <StatusBadge variant={variant} dot>
          {HEALTH_GRADE_LABELS[grade]}
        </StatusBadge>
      </div>

      {/* Per-category breakdown */}
      <div className="mt-4 space-y-3">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Icon name={cat.icon} className="text-[14px] text-qbit-on-surface-variant" />
                <span className="text-xs font-medium text-qbit-on-surface">{cat.label}</span>
              </div>
              <span className="text-xs font-semibold text-qbit-on-surface-variant">{cat.score}/100</span>
            </div>
            <ProgressTracker
              value={cat.score}
              variant={
                cat.score >= 90 ? "success"
                : cat.score >= 70 ? "primary"
                : cat.score >= 40 ? "warning"
                : "error"
              }
              showPercentage={false}
            />
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
