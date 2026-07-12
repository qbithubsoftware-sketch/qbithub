"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { AdminStatItem } from "@/lib/admin/types";

const DELTA_CLASS = {
  up: "text-emerald-600",
  down: "text-qbit-error",
  neutral: "text-qbit-on-surface-variant",
} as const;

/**
 * AdminStatsCard — KPI widget matching the Stitch design exactly.
 * Uses p-4 padding, hover:shadow-md, icon with p-xs bg color.
 */
export function AdminStatsCard({ stat }: { stat: AdminStatItem }) {
  const deltaIcon = stat.deltaVariant === "up" ? "trending_up" : stat.deltaVariant === "down" ? "trending_down" : "remove";

  return (
    <SurfaceCard className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", stat.iconBg ?? "bg-qbit-primary/10 text-qbit-primary")}>
          <Icon name={stat.icon} className="text-[20px]" />
        </span>
        {stat.delta && (
          <span className={cn("text-xs font-medium flex items-center gap-0.5", DELTA_CLASS[stat.deltaVariant ?? "neutral"])}>
            <Icon name={deltaIcon} className="text-[14px]" />
            {stat.delta}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-qbit-outline">{stat.label}</p>
      <p className="text-[20px] font-semibold text-qbit-on-surface">{stat.value}</p>
    </SurfaceCard>
  );
}

/** Grid of AdminStatsCards. */
export function AdminStatsGrid({ stats }: { stats: AdminStatItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {stats.map((stat) => (
        <AdminStatsCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
