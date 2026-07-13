"use client";

/**
 * ProgressTracker — enterprise progress bar with percentage + milestone markers.
 *
 * Reuses ProgressTracker primitive from primitives/ for the bar itself,
 * but adds milestone labels + percentage overlay.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { ProgressTracker } from "@/components/qbit/primitives/ProgressTracker";
import type { WorkOrderStatus } from "@/lib/fsm/types";

interface ProgressTrackerEnterpriseProps {
  percent: number;
  milestones: Array<{
    status: WorkOrderStatus;
    label: string;
    occurredAt: string | null;
    done: boolean;
    isCurrent: boolean;
  }>;
}

export function ProgressTrackerEnterprise({
  percent,
  milestones,
}: ProgressTrackerEnterpriseProps) {
  return (
    <div className="space-y-4">
      {/* Percentage display */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
            Job Progress
          </p>
          <p className="text-3xl font-bold text-qbit-primary">{percent}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-qbit-on-surface-variant">
            {milestones.filter((m) => m.done).length} of {milestones.length} steps complete
          </p>
          <p className="text-[10px] text-qbit-on-surface-variant/70">
            {percent === 100 ? "Job completed" : percent === 0 ? "Awaiting start" : "In progress"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressTracker
        value={percent}
        showPercentage={false}
        variant={percent === 100 ? "success" : "primary"}
        pulse={percent > 0 && percent < 100}
      />

      {/* Milestone markers */}
      <ol className="relative mt-6 grid grid-cols-7 gap-1">
        {milestones.map((m, idx) => (
          <li key={m.status} className="flex flex-col items-center text-center">
            {/* Marker dot */}
            <div className="relative flex items-center">
              {idx > 0 && (
                <div
                  className={
                    "absolute right-1/2 top-1/2 h-0.5 w-[calc(50%-12px)] -translate-y-1/2 " +
                    (milestones[idx - 1].done ? "bg-qbit-primary" : "bg-qbit-outline-variant")
                  }
                />
              )}
              <div
                className={
                  "z-10 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold transition-colors " +
                  (m.done
                    ? "bg-qbit-primary text-qbit-on-primary"
                    : m.isCurrent
                      ? "bg-qbit-primary-container text-qbit-on-primary-container ring-4 ring-qbit-primary/20"
                      : "bg-qbit-surface-container-high text-qbit-on-surface-variant")
                }
              >
                {m.done ? (
                  <Icon name="check" className="text-[12px]" filled />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < milestones.length - 1 && (
                <div
                  className={
                    "absolute left-1/2 top-1/2 h-0.5 w-[calc(50%-12px)] -translate-y-1/2 " +
                    (m.done ? "bg-qbit-primary" : "bg-qbit-outline-variant")
                  }
                />
              )}
            </div>
            {/* Label */}
            <span
              className={
                "mt-1.5 text-[9px] font-medium leading-tight " +
                (m.done ? "text-qbit-on-surface" : m.isCurrent ? "text-qbit-primary" : "text-qbit-on-surface-variant")
              }
            >
              {m.label}
            </span>
            {m.occurredAt && (
              <span className="text-[8px] text-qbit-on-surface-variant/70">
                {new Date(m.occurredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
