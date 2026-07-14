"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useTour } from "@/lib/tour/tour-context";
import { ALL_TOUR_STEPS } from "@/lib/tour/tour-steps";

/**
 * TourOverlay — renders the highlighted element + tooltip during the tour.
 *
 * Features:
 * - Darkened backdrop with cutout for the highlighted element
 * - Tooltip with title, description, progress, and nav buttons
 * - Keyboard navigation (← → Enter Esc)
 * - Responsive (mobile-friendly)
 */
export function TourOverlay() {
  const { isActive, currentStep, nextStep, prevStep, finishTour, skipTour } = useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = ALL_TOUR_STEPS[currentStep];
  const totalSteps = ALL_TOUR_STEPS.length;
  const isLastStep = currentStep >= totalSteps - 1;

  // Find and highlight the target element
  useEffect(() => {
    if (!isActive || !step) return;

    const findTarget = () => {
      if (step.selector) {
        const el = document.querySelector(step.selector);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
          return;
        }
      }
      setTargetRect(null); // Centered modal
    };

    findTarget();
    // Re-find on resize/scroll
    window.addEventListener("resize", findTarget);
    window.addEventListener("scroll", findTarget, true);
    const interval = setInterval(findTarget, 500); // Poll for dynamic content

    return () => {
      window.removeEventListener("resize", findTarget);
      window.removeEventListener("scroll", findTarget, true);
      clearInterval(interval);
    };
  }, [isActive, step]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (isLastStep) finishTour();
        else nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      } else if (e.key === "Escape") {
        e.preventDefault();
        skipTour();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, isLastStep, nextStep, prevStep, finishTour, skipTour]);

  if (!isActive || !step) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Calculate tooltip position
  const tooltipStyle = getTooltipStyle(step.position ?? "center", targetRect);

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      {/* Backdrop with cutout */}
      {targetRect ? (
        <>
          {/* Top */}
          <div className="absolute bg-black/50 pointer-events-auto" style={{ top: 0, left: 0, right: 0, height: targetRect.top }} />
          {/* Bottom */}
          <div className="absolute bg-black/50 pointer-events-auto" style={{ top: targetRect.bottom, left: 0, right: 0, bottom: 0 }} />
          {/* Left */}
          <div className="absolute bg-black/50 pointer-events-auto" style={{ top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height }} />
          {/* Right */}
          <div className="absolute bg-black/50 pointer-events-auto" style={{ top: targetRect.top, left: targetRect.right, right: 0, height: targetRect.height }} />
          {/* Highlight ring */}
          <div
            className="absolute pointer-events-none rounded-lg ring-4 ring-qbit-primary ring-offset-2 ring-offset-transparent transition-all duration-300"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/50 pointer-events-auto" />
      )}

      {/* Tooltip */}
      <div
        className={cn(
          "absolute pointer-events-auto bg-qbit-surface-container-lowest rounded-2xl shadow-2xl border border-qbit-outline-variant/50 p-5 w-[90vw] max-w-md animate-qbit-scale-in",
        )}
        style={tooltipStyle}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-qbit-surface-container-high rounded-t-2xl overflow-hidden">
          <div className="h-full bg-qbit-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Step counter */}
        <div className="flex items-center justify-between mb-3 mt-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-qbit-primary">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <button
            onClick={skipTour}
            className="text-[10px] font-semibold text-qbit-on-surface-variant hover:text-qbit-error transition-colors"
          >
            Skip Tour
          </button>
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-qbit-on-surface mb-1.5">{step.title}</h3>
        <p className="text-sm text-qbit-on-surface-variant leading-relaxed mb-4">{step.description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <QbitButton
            size="sm"
            variant="ghost"
            icon="arrow_back"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </QbitButton>

          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {ALL_TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === currentStep ? "w-4 bg-qbit-primary" : i < currentStep ? "w-1.5 bg-qbit-primary/40" : "w-1.5 bg-qbit-surface-container-high",
                )}
              />
            ))}
          </div>

          {isLastStep ? (
            <QbitButton size="sm" variant="primary" icon="task_alt" onClick={finishTour}>
              Finish
            </QbitButton>
          ) : (
            <QbitButton size="sm" variant="primary" iconRight="arrow_forward" onClick={nextStep}>
              Next
            </QbitButton>
          )}
        </div>
      </div>
    </div>
  );
}

/** Calculates the tooltip position based on the target element and desired position. */
function getTooltipStyle(position: string, targetRect: DOMRect | null): React.CSSProperties {
  if (!targetRect || position === "center") {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const margin = 16;
  const tooltipWidth = 400;

  switch (position) {
    case "bottom":
      return {
        top: targetRect.bottom + margin,
        left: Math.max(margin, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - margin)),
      };
    case "top":
      return {
        top: Math.max(margin, targetRect.top - 200 - margin),
        left: Math.max(margin, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - margin)),
      };
    case "right":
      return {
        top: targetRect.top + targetRect.height / 2 - 100,
        left: Math.min(targetRect.right + margin, window.innerWidth - tooltipWidth - margin),
      };
    case "left":
      return {
        top: targetRect.top + targetRect.height / 2 - 100,
        left: Math.max(margin, targetRect.left - tooltipWidth - margin),
      };
    default:
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }
}
