"use client";

/**
 * TopListCard — generic card showing a ranked list (top N items).
 *
 * Reuses SurfaceCard, Icon, TagBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { TagBadge } from "@/components/qbit/primitives/StatusBadge";

interface TopListItem {
  name: string;
  count: number;
}

interface TopListCardProps {
  title: string;
  icon: string;
  items: TopListItem[];
}

export function TopListCard({ title, icon, items }: TopListCardProps) {
  return (
    <SurfaceCard className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon name={icon} className="text-[20px] text-qbit-primary" filled />
        <h3 className="text-sm font-semibold text-qbit-on-surface">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-qbit-on-surface-variant">No data available.</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-qbit-primary/10 text-[10px] font-bold text-qbit-primary">
                  {idx + 1}
                </span>
                <span className="truncate text-sm text-qbit-on-surface">{item.name}</span>
              </div>
              <TagBadge variant="primary">{item.count}</TagBadge>
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}
