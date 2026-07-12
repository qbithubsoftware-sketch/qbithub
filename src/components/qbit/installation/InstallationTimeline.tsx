"use client";

import { GuideStep } from "./GuideStep";
import type { InstallationStep } from "@/lib/installation/types";

/**
 * InstallationTimeline — renders the full vertical timeline of steps
 * for an installation guide.  Reuses the GuideStep component for each
 * entry.
 */
export function InstallationTimeline({
  steps,
  onCompleteStep,
  onViewDiagram,
  onViewVideo,
  onDownload,
}: {
  steps: InstallationStep[];
  onCompleteStep?: (step: InstallationStep) => void;
  onViewDiagram?: () => void;
  onViewVideo?: (url: string) => void;
  onDownload?: (downloadId: string) => void;
}) {
  return (
    <div className="space-y-0">
      {steps.map((step, idx) => (
        <GuideStep
          key={step.id}
          step={step}
          isLast={idx === steps.length - 1}
          onComplete={onCompleteStep}
          onViewDiagram={onViewDiagram}
          onViewVideo={onViewVideo}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}
