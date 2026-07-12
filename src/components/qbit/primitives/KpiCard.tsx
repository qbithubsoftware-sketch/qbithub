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
    up: "text-emerald-600",
    down: "text-qbit-error",
    neutral: "text-qbit-on-surface-variant",
  }[deltaVariant];

  const deltaIcon = deltaVariant === "up" ? "trending_up" : deltaVariant === "down" ? "trending_down" : "remove";

  return (
    <SurfaceCard className={cn("p-4 hover:shadow-md transition-all duration-200", className)}>
      <div className="flex justify-between items-start mb-3">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconBg)}>
          <Icon name={icon} className="text-[20px]" />
        </span>
        {delta && (
          <span className={cn("text-xs font-medium flex items-center gap-0.5", deltaClass)}>
            <Icon name={deltaIcon} className="text-[14px]" />
            {delta}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-qbit-on-surface-variant">{label}</p>
      <p className="text-xl font-semibold text-qbit-on-surface mt-0.5">{value}</p>
    </SurfaceCard>
  );
}
