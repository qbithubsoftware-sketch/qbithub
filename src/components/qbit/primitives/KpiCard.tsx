"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { SurfaceCard } from "./GlassCard";

export interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  delta?: string;
  deltaVariant?: "up" | "down" | "neutral";
  iconBg?: string;
  className?: string;
}

export function KpiCard({
  label,
  value,
  icon,
  delta,
  deltaVariant = "neutral",
  iconBg = "bg-qbit-primary/10 text-qbit-primary",
  className,
}: KpiCardProps) {
  const deltaClass = {
    up: "text-emerald-600 bg-emerald-50",
    down: "text-red-600 bg-red-50",
    neutral: "text-qbit-on-surface-variant bg-qbit-surface-container-high",
  }[deltaVariant];

  const deltaIcon = deltaVariant === "up" ? "trending_up" : deltaVariant === "down" ? "trending_down" : "remove";

  return (
    <SurfaceCard className={cn("p-4 card-hover-lift", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
            {label}
          </p>
          <p className="mt-2 text-[28px] font-bold leading-tight text-qbit-on-surface">
            {value}
          </p>
          {delta && (
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                deltaClass,
              )}
            >
              <Icon name={deltaIcon} className="text-[12px]" />
              {delta}
            </span>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconBg,
          )}
        >
          <Icon name={icon} className="text-[22px]" />
        </div>
      </div>
    </SurfaceCard>
  );
}
