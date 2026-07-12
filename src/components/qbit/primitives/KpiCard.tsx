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
    <SurfaceCard className={cn("p-4 hover:shadow-md transition-shadow", className)}>
      <div className="flex justify-between items-start mb-2">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconBg)}>
          <Icon name={icon} className="text-[20px]" />
        </span>
        {delta && (
          <span className={cn("text-xs font-medium flex items-center gap-0.5", deltaClass)}>
            <Icon name={deltaIcon} className="text-[14px]" />
            {delta}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-qbit-outline">{label}</p>
      <p className="text-[20px] font-semibold text-qbit-on-surface">{value}</p>
    </SurfaceCard>
  );
}
