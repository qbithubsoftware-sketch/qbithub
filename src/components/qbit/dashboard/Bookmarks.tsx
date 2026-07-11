"use client";

import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { EmptyState } from "./EmptyState";
import { SectionHeader } from "./SectionHeader";
import type { BookmarkItem } from "./types";

/**
 * Bookmarks — list of bookmarked resources.  Shows an empty state when
 * the user has no bookmarks yet.
 */
export function Bookmarks({
  items,
  onRemove,
  onAddBookmark,
}: {
  items: BookmarkItem[];
  onRemove?: (index: number) => void;
  onAddBookmark?: () => void;
}) {
  const isEmpty = items.length === 0;

  return (
    <section>
      <SectionHeader
        title="Bookmarks"
        actionLabel={isEmpty ? undefined : "Manage"}
      />
      {isEmpty ? (
        <SurfaceCard className="p-8">
          <EmptyState
            icon="bookmark_add"
            title="No bookmarks yet"
            description="Bookmark products, drivers, and manuals to quickly access them here."
            actionLabel="Browse Products"
            onAction={onAddBookmark}
          />
        </SurfaceCard>
      ) : (
        <SurfaceCard className="p-2">
          <ul className="divide-y divide-qbit-outline-variant/40">
            {items.map((item, idx) => (
              <li
                key={`${item.title}-${idx}`}
                className="flex items-center gap-3 p-3 hover:bg-qbit-surface-container-low rounded-lg transition-colors group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                  <Icon name={item.icon} className="text-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-qbit-on-surface truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-qbit-on-surface-variant">
                    {item.type}
                    {item.time ? ` • ${item.time}` : ""}
                  </p>
                </div>
                {onRemove && (
                  <button
                    onClick={() => onRemove(idx)}
                    aria-label={`Remove bookmark ${item.title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:text-qbit-error hover:bg-qbit-error-container/40 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="close" className="text-[16px]" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </SurfaceCard>
      )}
    </section>
  );
}
