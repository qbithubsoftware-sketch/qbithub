"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { ProgressTracker } from "@/components/qbit/primitives/ProgressTracker";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";

/**
 * ProgressTrackerNav — progress bar with Previous / Next / Complete
 * navigation buttons.  Reuses the existing ProgressTracker primitive.
 */
export function ProgressTrackerNav({
  currentStep,
  totalSteps,
  progress,
  onPrev,
  onNext,
  onComplete,
  isLastStep = false,
  isFirstStep = true,
}: {
  currentStep: number;
  totalSteps: number;
  progress: number;
  onPrev?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  isLastStep?: boolean;
  isFirstStep?: boolean;
}) {
  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
            Overall Progress
          </p>
          <p className="text-sm font-semibold text-qbit-on-surface">
            Step {currentStep} of {totalSteps}
          </p>
        </div>
        <span className="text-2xl font-bold text-qbit-primary">{progress}%</span>
      </div>
      <ProgressTracker value={progress} showPercentage={false} pulse={progress > 0 && progress < 100} />
      <div className="flex items-center justify-between gap-2 mt-4">
        <QbitButton
          variant="outline"
          size="md"
          icon="arrow_back"
          onClick={onPrev}
          disabled={isFirstStep}
        >
          Previous
        </QbitButton>
        <div className="flex gap-2">
          {!isLastStep && (
            <QbitButton variant="outline" size="md" icon="check_circle" onClick={onComplete}>
              Mark Complete
            </QbitButton>
          )}
          <QbitButton
            variant="primary"
            size="md"
            iconRight={isLastStep ? "task_alt" : "arrow_forward"}
            onClick={onNext}
            disabled={isLastStep}
          >
            {isLastStep ? "Finish" : "Next Step"}
          </QbitButton>
        </div>
      </div>
    </SurfaceCard>
  );
}
