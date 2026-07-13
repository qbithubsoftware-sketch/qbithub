"use client";

/**
 * WorkOrderTimeline — vertical timeline of a work order's lifecycle.
 *
 * Reuses the existing TimelineStep primitive.
 */

import { TimelineStep } from "@/components/qbit/primitives/TimelineStep";
import {
  type TimelineEntryDTO,
  type WorkOrderStatus,
  PROGRESS_STATUSES,
  customerLabelForStatus,
} from "@/lib/fsm/types";

interface WorkOrderTimelineProps {
  entries: TimelineEntryDTO[];
  currentStatus: WorkOrderStatus;
}

/** Maps a status to a Material Symbol icon. */
const STATUS_ICONS: Record<WorkOrderStatus, string> = {
  pending: "assignment",
  accepted: "check_circle",
  on_the_way: "directions_car",
  arrived: "place",
  installing: "build",
  testing: "science",
  completed: "task_alt",
  cancelled: "cancel",
  rescheduled: "schedule",
};

export function WorkOrderTimeline({ entries, currentStatus }: WorkOrderTimelineProps) {
  // Build a merged view: every progress milestone (with its actual entry if
  // it occurred) plus any non-progress entries (cancelled / rescheduled).
  const progressSet = new Set<WorkOrderStatus>(PROGRESS_STATUSES);
  const currentIdx = PROGRESS_STATUSES.indexOf(currentStatus);

  const rows: Array<{
    icon: string;
    title: string;
    description: string | null;
    meta: string | null;
    status: "completed" | "active" | "pending";
    isLast: boolean;
  }> = [];

  // Progress milestones
  for (const status of PROGRESS_STATUSES) {
    const entry = entries.find((e) => e.status === status);
    const milestoneIdx = PROGRESS_STATUSES.indexOf(status);
    const isDone = milestoneIdx < currentIdx || currentStatus === "completed";
    const isActive = milestoneIdx === currentIdx && currentStatus !== "completed";

    rows.push({
      icon: STATUS_ICONS[status],
      title: customerLabelForStatus(status),
      description: entry?.description ?? null,
      meta: entry ? formatTimestamp(entry.occurredAt) : null,
      status: isDone ? "completed" : isActive ? "active" : "pending",
      isLast: false,
    });
  }

  // Non-progress entries (cancel / reschedule) appended at end if present
  for (const entry of entries) {
    if (!progressSet.has(entry.status)) {
      rows.push({
        icon: STATUS_ICONS[entry.status],
        title: entry.label,
        description: entry.description,
        meta: formatTimestamp(entry.occurredAt),
        status: "completed",
        isLast: false,
      });
    }
  }

  // Mark the last visible row
  if (rows.length > 0) {
    rows[rows.length - 1].isLast = true;
  }

  return (
    <div>
      {rows.map((row, idx) => (
        <TimelineStep
          key={`${row.title}-${idx}`}
          icon={row.icon}
          title={row.title}
          description={row.description ?? undefined}
          meta={row.meta ?? undefined}
          status={row.status}
          isLast={row.isLast}
        />
      ))}
    </div>
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
