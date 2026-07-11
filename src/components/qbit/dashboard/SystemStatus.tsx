"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { SystemStatusItem } from "./types";

/**
 * System Status — grid of KPI widgets showing inventory / driver / manual /
 * video counts.  Matches the Stitch 4-col grid on desktop.
 */
export function SystemStatus({ items }: { items: SystemStatusItem[] }) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <SystemStatusCard key={item.label} item={item} />
      ))}
    </section>
  );
}

function SystemStatusCard({ item }: { item: SystemStatusItem }) {
  const deltaColor =
    item.deltaVariant === "up"
      ? "text-emerald-600"
      : item.deltaVariant === "down"
        ? "text-qbit-error"
        : "text-qbit-on-surface-variant";

  return (
    <SurfaceCard className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            item.iconBg ?? "bg-qbit-primary/10 text-qbit-primary",
          )}
        >
          <Icon name={item.icon} className="text-[20px]" />
        </span>
        {item.delta && (
          <span className={cn("text-xs font-medium flex items-center", deltaColor)}>
            {item.delta}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-qbit-outline">{item.label}</p>
      <p className="text-[20px] font-semibold text-qbit-on-surface">{item.value}</p>
    </SurfaceCard>
  );
}
