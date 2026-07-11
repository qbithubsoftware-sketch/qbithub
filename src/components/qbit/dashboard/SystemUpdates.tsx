"use client";

import { cn } from "@/lib/utils";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { SystemUpdateItem } from "./types";

/**
 * System Updates — vertical timeline of recent platform events.
 * Matches the Stitch design: left-bordered timeline with circular nodes,
 * bold title, description, and colored meta label.
 */
export function SystemUpdates({ items }: { items: SystemUpdateItem[] }) {
  return (
    <SurfaceCard className="p-4 bg-qbit-surface-container-low">
      <h3 className="text-sm font-medium text-qbit-on-surface mb-4">System Updates</h3>
      <div className="relative space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-qbit-outline-variant">
        {items.map((item, idx) => (
          <SystemUpdateEntry key={idx} item={item} />
        ))}
      </div>
    </SurfaceCard>
  );
}

function SystemUpdateEntry({ item }: { item: SystemUpdateItem }) {
  const isCritical = item.variant === "critical";
  const nodeClass = isCritical
    ? "bg-qbit-primary"
    : "bg-qbit-outline-variant";
  const dotClass = isCritical ? "bg-white" : "bg-qbit-surface-variant";
  const metaClass = isCritical
    ? "text-qbit-primary"
    : "text-qbit-outline uppercase";

  return (
    <div className="relative pl-8">
      <div
        className={cn(
          "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-qbit-surface-container-low flex items-center justify-center",
          nodeClass,
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
      </div>
      <p className="text-xs font-bold text-qbit-on-surface">{item.title}</p>
      <p className="text-sm text-qbit-on-surface-variant">{item.description}</p>
      <p className={cn("text-[10px] mt-1 font-bold", metaClass)}>{item.meta}</p>
    </div>
  );
}
