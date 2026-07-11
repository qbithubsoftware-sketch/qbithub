"use client";

import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { ContinueWorkingItem } from "./types";

/**
 * Continue Working — sidebar card listing recently-accessed files.
 * Each row has an icon, file name, type + time, and a play/open indicator.
 */
export function ContinueWorking({
  items,
  onViewHistory,
}: {
  items: ContinueWorkingItem[];
  onViewHistory?: () => void;
}) {
  return (
    <SurfaceCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-qbit-on-surface">Continue Working</h3>
        <Icon name="history" className="text-[18px] text-qbit-outline" />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-qbit-surface-container cursor-pointer transition-colors group"
          >
            <div
              className={`flex h-10 w-10 rounded items-center justify-center ${item.iconBg ?? "bg-qbit-primary/10"}`}
            >
              <Icon name={item.icon} className="text-[18px] text-qbit-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-qbit-on-surface truncate">
                {item.name}
              </p>
              <p className="text-[10px] text-qbit-outline">
                {item.type} • {item.time}
              </p>
            </div>
            <Icon
              name="play_circle"
              className="text-[18px] text-qbit-outline group-hover:text-qbit-primary transition-colors"
            />
          </div>
        ))}
      </div>
      <button
        onClick={onViewHistory}
        className="w-full mt-4 py-2 text-qbit-primary text-xs font-bold border border-qbit-primary/20 rounded-lg hover:bg-qbit-primary/5 transition-colors"
      >
        View Full History
      </button>
    </SurfaceCard>
  );
}
