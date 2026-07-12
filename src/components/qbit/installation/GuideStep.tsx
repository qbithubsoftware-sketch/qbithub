"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import type { InstallationStep } from "@/lib/installation/types";

/**
 * GuideStep — displays a single installation step with all its content:
 * step number, title, description, image, estimated time, warning, tip,
 * required tool, and links to related downloads / manuals / videos.
 */
export function GuideStep({
  step,
  isLast = false,
  onComplete,
  onViewDiagram,
  onViewVideo,
  onDownload,
}: {
  step: InstallationStep;
  isLast?: boolean;
  onComplete?: (step: InstallationStep) => void;
  onViewDiagram?: () => void;
  onViewVideo?: (url: string) => void;
  onDownload?: (downloadId: string) => void;
}) {
  return (
    <div className="relative flex gap-4">
      {/* Vertical line */}
      {!isLast && (
        <span className="absolute left-4 top-10 bottom-0 w-[2px] bg-qbit-outline-variant/40" />
      )}
      {/* Step circle */}
      <div
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          step.status === "completed"
            ? "bg-qbit-primary text-qbit-on-primary"
            : step.status === "active"
              ? "bg-qbit-primary text-qbit-on-primary ring-4 ring-qbit-primary/20 animate-pulse"
              : "bg-qbit-surface-container border-2 border-qbit-outline-variant text-qbit-on-surface-variant",
        )}
      >
        {step.status === "completed" ? (
          <Icon name="check" className="text-[16px]" />
        ) : (
          <span className="text-xs font-bold">{step.stepNumber}</span>
        )}
      </div>

      {/* Step body */}
      <div className="flex-1 pb-8">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h4 className="text-base font-semibold text-qbit-on-surface">
            Step {step.stepNumber}: {step.title}
          </h4>
          <span className="text-xs font-medium text-qbit-on-surface-variant flex items-center gap-1">
            <Icon name="schedule" className="text-[12px]" />
            {step.estimatedTime} min
          </span>
        </div>

        <p className="text-sm text-qbit-on-surface-variant leading-relaxed mb-3">
          {step.description}
        </p>

        {/* Image placeholder */}
        {step.imageUrl && (
          <div className="mb-3 rounded-xl overflow-hidden border border-qbit-outline-variant bg-qbit-surface-container-low aspect-video flex items-center justify-center">
            <Icon name="image" className="text-[40px] text-qbit-outline" />
          </div>
        )}

        {/* Warning */}
        {step.warning && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 p-3">
            <Icon name="warning" className="text-[18px] text-amber-600 mt-0.5 shrink-0" filled />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-0.5">Warning</p>
              <p className="text-sm text-amber-800">{step.warning}</p>
            </div>
          </div>
        )}

        {/* Tip */}
        {step.tip && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-qbit-primary/30 bg-qbit-primary/5 p-3">
            <Icon name="lightbulb" className="text-[18px] text-qbit-primary mt-0.5 shrink-0" filled />
            <div>
              <p className="text-xs font-bold text-qbit-primary uppercase tracking-wider mb-0.5">Pro Tip</p>
              <p className="text-sm text-qbit-on-surface">{step.tip}</p>
            </div>
          </div>
        )}

        {/* Required tool */}
        {step.requiredTool && (
          <div className="mb-3 flex items-center gap-2 text-sm text-qbit-on-surface-variant">
            <Icon name="build" className="text-[16px] text-qbit-on-surface-variant" />
            <span>Required: <strong className="text-qbit-on-surface">{step.requiredTool.name}</strong></span>
            {step.requiredTool.included && (
              <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">In Box</span>
            )}
          </div>
        )}

        {/* Related assets */}
        {(step.relatedDownloadId || step.relatedManualId || step.relatedVideoUrl) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {step.relatedDownloadId && (
              <QbitButton size="sm" variant="outline" icon="download" onClick={() => onDownload?.(step.relatedDownloadId!)}>
                Related Driver
              </QbitButton>
            )}
            {step.relatedManualId && (
              <QbitButton size="sm" variant="outline" icon="menu_book">
                View Manual
              </QbitButton>
            )}
            {step.relatedVideoUrl && (
              <QbitButton size="sm" variant="outline" icon="play_circle" onClick={() => onViewVideo?.(step.relatedVideoUrl!)}>
                Watch Video
              </QbitButton>
            )}
            <QbitButton size="sm" variant="ghost" icon="schema" onClick={onViewDiagram}>
              Wiring Diagram
            </QbitButton>
          </div>
        )}

        {/* Complete button */}
        {step.status !== "completed" && onComplete && (
          <QbitButton size="sm" variant="primary" icon="check_circle" onClick={() => onComplete(step)}>
            Mark as Complete
          </QbitButton>
        )}
        {step.status === "completed" && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <Icon name="check_circle" className="text-[18px]" filled />
            Step Completed
          </span>
        )}
      </div>
    </div>
  );
}
