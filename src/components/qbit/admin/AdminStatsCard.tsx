"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { AdminStatItem } from "@/lib/admin/types";

const DELTA_CLASS = {
  up: "text-emerald-600 bg-emerald-50",
  down: "text-red-600 bg-red-50",
  neutral: "text-qbit-on-surface-variant bg-qbit-surface-container-high",
} as const;

/**
 * AdminStatsCard — reusable KPI widget for the admin dashboard.
 * Extends the existing KpiCard pattern but adds the `category` field
 * for grouping.
 */
export function AdminStatsCard({ stat }: { stat: AdminStatItem }) {
  const deltaIcon = stat.deltaVariant === "up" ? "trending_up" : stat.deltaVariant === "down" ? "trending_down" : "remove";

  return (
    <SurfaceCard className="p-4 card-hover-lift">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", stat.iconBg ?? "bg-qbit-primary/10 text-qbit-primary")}>
          <Icon name={stat.icon} className="text-[20px]" />
        </span>
        {stat.delta && (
          <span className={cn("text-[11px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full", DELTA_CLASS[stat.deltaVariant ?? "neutral"])}>
            <Icon name={deltaIcon} className="text-[12px]" />
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
