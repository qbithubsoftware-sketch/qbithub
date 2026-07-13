"use client";

/**
 * FirmwareHistoryTimeline — vertical timeline of firmware events.
 *
 * Reuses TimelineStep primitive.
 */

import { TimelineStep } from "@/components/qbit/primitives/TimelineStep";
import {
  type FirmwareHistoryDTO,
  FIRMWARE_EVENT_ICONS,
  FIRMWARE_EVENT_LABELS,
} from "@/lib/firmware/types";

interface FirmwareHistoryTimelineProps {
  history: FirmwareHistoryDTO[];
}

export function FirmwareHistoryTimeline({ history }: FirmwareHistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-qbit-on-surface-variant">No firmware history yet.</p>
    );
  }

  return (
    <div>
      {history.map((h, idx) => (
        <TimelineStep
          key={h.id}
          icon={FIRMWARE_EVENT_ICONS[h.eventType] ?? "history"}
          title={FIRMWARE_EVENT_LABELS[h.eventType] ?? h.eventType}
          description={
            h.notes ??
            (h.oldVersion && h.newVersion
              ? `v${h.oldVersion} → v${h.newVersion}`
              : h.newVersion
                ? `v${h.newVersion}`
                : undefined)
          }
          meta={`${new Date(h.occurredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}${
            h.performedByName ? ` · ${h.performedByName}` : ""
          }${h.updateMethod ? ` · ${h.updateMethod.toUpperCase()}` : ""}`}
          status="completed"
          isLast={idx === history.length - 1}
        />
      ))}
    </div>
  );
}
