"use client";

/**
 * DiagnosticTimeline — vertical timeline of findings.
 *
 * Reuses TimelineStep primitive.
 */

import { TimelineStep } from "@/components/qbit/primitives/TimelineStep";
import {
  type DiagnosticFindingDTO,
  CATEGORY_ICONS,
  SEVERITY_LABELS,
} from "@/lib/diagnostics/types";

interface DiagnosticTimelineProps {
  findings: DiagnosticFindingDTO[];
}

export function DiagnosticTimeline({ findings }: DiagnosticTimelineProps) {
  if (findings.length === 0) {
    return (
      <p className="text-sm text-qbit-on-surface-variant">No findings — device is healthy.</p>
    );
  }

  return (
    <div>
      {findings.map((f, idx) => (
        <TimelineStep
          key={f.id}
          icon={CATEGORY_ICONS[f.category] ?? "info"}
          title={f.title}
          description={f.description}
          meta={`${SEVERITY_LABELS[f.severity]} · ${new Date(f.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
          status={
            f.severity === "info" ? "completed"
            : f.severity === "warning" ? "active"
            : "pending"
          }
          isLast={idx === findings.length - 1}
        />
      ))}
    </div>
  );
}
