"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { SectionHeader } from "./SectionHeader";
import type { PinnedResource } from "./types";

/**
 * Pinned Resources — row of pinned cards (popular resources the user
 * marked as important).  Each card has a gradient header, badge, icon,
 * title, and a "View" button.
 */
export function PinnedResources({ items }: { items: PinnedResource[] }) {
  return (
    <section>
      <SectionHeader title="Pinned Resources" actionLabel="Manage pins" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <PinnedResourceCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

function PinnedResourceCard({ item }: { item: PinnedResource }) {
  const gradient =
    item.gradient ?? "from-qbit-primary/80 to-qbit-secondary";
  const badgeClass = {
    primary: "bg-qbit-primary text-white",
    neutral: "bg-qbit-on-surface-variant text-white",
    success: "bg-emerald-500 text-white",
    warning: "bg-amber-500 text-white",
  }[item.badgeVariant ?? "primary"];

  return (
    <SurfaceCard className="overflow-hidden card-hover-lift">
      <div className={cn("relative h-24 bg-gradient-to-br flex items-center justify-center", gradient)}>
        <Icon name={item.icon} className="text-[40px] text-white/90" filled />
        <span
          className={cn(
            "absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
            badgeClass,
          )}
        >
          {item.badge}
        </span>
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-qbit-on-surface">{item.title}</p>
        <button className="w-full mt-3 py-1.5 text-xs font-bold text-qbit-primary border border-qbit-primary/20 rounded-lg hover:bg-qbit-primary/5 transition-colors">
          View
        </button>
      </div>
    </SurfaceCard>
  );
}
