"use client";

import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { EmptyState } from "@/components/qbit/dashboard/EmptyState";
import type { DownloadItem } from "@/lib/downloads/types";
import { DownloadCard } from "./DownloadCard";

/**
 * FavoriteDownloads — full-width section showing the user's favourited
 * downloads.  Renders an empty state when there are no favorites.
 */
export function FavoriteDownloads({
  favorites,
  onDownload,
  onRemoveFavorite,
  onBrowse,
}: {
  favorites: DownloadItem[];
  onDownload?: (download: DownloadItem) => void;
  onRemoveFavorite?: (download: DownloadItem) => void;
  onBrowse?: () => void;
}) {
  if (favorites.length === 0) {
    return (
      <section>
        <h3 className="text-[20px] font-semibold text-qbit-on-surface mb-4">Favorite Downloads</h3>
        <SurfaceCard className="p-8">
          <EmptyState
            icon="favorite_border"
            title="No favorites yet"
            description="Click the heart icon on any download to pin it here for quick access."
            actionLabel="Browse Downloads"
            onAction={onBrowse}
          />
        </SurfaceCard>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[20px] font-semibold text-qbit-on-surface flex items-center gap-2">
          <Icon name="favorite" className="text-[22px] text-qbit-primary" filled />
          Favorite Downloads
        </h3>
        <span className="text-xs font-semibold text-qbit-on-surface-variant">
          {favorites.length} pinned
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {favorites.map((d) => (
          <DownloadCard
            key={d.id}
            download={d}
            onDownload={onDownload}
            onFavorite={onRemoveFavorite}
            isFavorite
            compact
          />
        ))}
      </div>
    </section>
  );
}
