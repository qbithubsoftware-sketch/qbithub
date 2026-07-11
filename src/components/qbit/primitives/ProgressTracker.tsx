"use client";

import { cn } from "@/lib/utils";

export interface ProgressTrackerProps {
  label?: string;
  value: number; // 0-100
  showPercentage?: boolean;
  variant?: "primary" | "success" | "warning" | "error";
  className?: string;
  pulse?: boolean;
}

export function ProgressTracker({
  label,
  value,
  showPercentage = true,
  variant = "primary",
  className,
  pulse = false,
}: ProgressTrackerProps) {
  const variantClass = {
    primary: "bg-qbit-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-qbit-error",
  }[variant];

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-qbit-on-surface-variant">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-xs font-bold text-qbit-on-surface">
              {value}%
            </span>
          )}
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-qbit-surface-container-high">
        <div
          className={cn("h-full rounded-full transition-all duration-500", variantClass, pulse && "animate-pulse")}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
