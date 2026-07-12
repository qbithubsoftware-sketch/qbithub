"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";
import type { ActivityEntry } from "./types";

/**
 * Recent Activity — reusable activity-feed component.
 *
 * Can be dropped into any dashboard (Home, Engineer, Admin) and renders
 * a vertical list of icon + title + meta + time entries.  Shows an empty
 * state when there are no entries.
 */
export function RecentActivity({
  items,
  title = "Recent Activity",
  actionLabel = "View all",
  onAction,
  maxHeight = "max-h-96",
  emptyTitle = "No recent activity",
  emptyDescription = "Actions you perform across the portal will appear here.",
}: {
  items: ActivityEntry[];
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  maxHeight?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const isEmpty = items.length === 0;

  return (
    <section>
      <SectionHeader title={title} actionLabel={isEmpty ? undefined : actionLabel} onAction={onAction} />
      {isEmpty ? (
        <SurfaceCard className="p-8">
          <EmptyState
            icon="history"
            title={emptyTitle}
            description={emptyDescription}
          />
        </SurfaceCard>
      ) : (
        <SurfaceCard className={cn("p-2 overflow-hidden", maxHeight)}>
          <ul className="divide-y divide-qbit-outline-variant/40">
            {items.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 p-3 hover:bg-qbit-surface-container-low rounded-lg transition-colors"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    entry.iconBg ?? "bg-qbit-primary/10 text-qbit-primary",
                  )}
                >
                  <Icon name={entry.icon} className="text-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-qbit-on-surface truncate">
                    {entry.title}
                  </p>
                  <p className="text-[11px] text-qbit-on-surface-variant truncate">
                    {entry.meta}
                  </p>
                </div>
                <span className="text-[10px] text-qbit-outline whitespace-nowrap">
                  {entry.time}
                </span>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      )}
    </section>
  );
}
