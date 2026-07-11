"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export type StepStatus = "completed" | "active" | "pending";

export interface TimelineStepProps {
  index?: number | string;
  icon?: string;
  title: string;
  description?: string;
  status: StepStatus;
  meta?: string;
  children?: React.ReactNode;
  isLast?: boolean;
  className?: string;
}

export function TimelineStep({
  index,
  icon,
  title,
  description,
  status,
  meta,
  children,
  isLast = false,
  className,
}: TimelineStepProps) {
  const circleClass =
    status === "completed"
      ? "bg-qbit-primary text-qbit-on-primary"
      : status === "active"
        ? "bg-qbit-primary text-qbit-on-primary ring-4 ring-qbit-primary/20 animate-pulse"
        : "bg-qbit-surface-container border-2 border-qbit-outline-variant text-qbit-on-surface-variant";

  return (
    <div className={cn("relative flex gap-4", className)}>
      {/* Vertical line */}
      {!isLast && (
        <span
          className={cn(
            "absolute left-4 top-10 bottom-0 w-[2px]",
            status === "completed" ? "bg-qbit-primary/40" : "bg-qbit-outline-variant/40",
          )}
        />
      )}
      {/* Step circle */}
      <div
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          circleClass,
        )}
      >
        {icon ? (
          <Icon name={icon} className="text-[16px]" filled={status === "completed"} />
        ) : status === "completed" ? (
          <Icon name="check" className="text-[16px]" />
        ) : (
          <span className="text-xs font-bold">{index}</span>
        )}
      </div>
      {/* Step body */}
      <div className={cn("flex-1 pb-8", status === "pending" && "opacity-60")}>
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-semibold text-qbit-on-surface">{title}</h4>
          {meta && (
            <span className="text-xs font-medium text-qbit-on-surface-variant">{meta}</span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-qbit-on-surface-variant leading-relaxed">
            {description}
          </p>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}
