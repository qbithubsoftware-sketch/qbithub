"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { useNavigation } from "@/lib/navigation/store";
import type { DownloadHistoryEntry, DownloadItem } from "@/lib/downloads/types";
import { DownloadCard } from "./DownloadCard";

/**
 * DownloadHistory — sidebar card with tabs for Recent Downloads, Most
 * Downloaded, and Favorites.  Recent Downloads shows a compact timeline;
 * Most Downloaded and Favorites render DownloadCard lists.
 */
export function DownloadHistory({
  recent,
  mostDownloaded,
  favorites,
  onViewAll,
  onDownload,
  onRemoveFavorite,
}: {
  recent: DownloadHistoryEntry[];
  mostDownloaded: DownloadItem[];
  favorites: DownloadItem[];
  onViewAll?: () => void;
  onDownload?: (download: DownloadItem) => void;
  onRemoveFavorite?: (download: DownloadItem) => void;
}) {
  const [tab, setTab] = useState<"recent" | "popular" | "favorites">("recent");
  const navigate = useNavigation((s) => s.navigate);

  return (
    <SurfaceCard className="p-5 lg:sticky lg:top-24">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-qbit-outline-variant/40">
        <TabButton active={tab === "recent"} onClick={() => setTab("recent")}>
          Recent
        </TabButton>
        <TabButton active={tab === "popular"} onClick={() => setTab("popular")}>
          Popular
        </TabButton>
        <TabButton active={tab === "favorites"} onClick={() => setTab("favorites")}>
          Favorites
          {favorites.length > 0 && (
            <span className="ml-1 text-[10px] font-bold bg-qbit-primary/10 text-qbit-primary px-1.5 py-0.5 rounded-full">
              {favorites.length}
            </span>
          )}
        </TabButton>
      </div>

      {/* Recent timeline */}
      {tab === "recent" && (
        <>
          <div className="space-y-4">
            {recent.length === 0 ? (
              <p className="text-sm text-qbit-on-surface-variant italic py-4 text-center">
                No recent downloads.
              </p>
            ) : (
              recent.map((h, idx) => {
                const isLast = idx === recent.length - 1;
                return (
                  <div key={h.id} className="relative pl-8 min-h-[24px]">
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[11px] top-7 bottom-[-16px] w-[2px] bg-qbit-surface-container-high"
                      />
                    )}
                    <div
                      className={cn(
                        "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center z-10",
                        h.tone === "primary"
                          ? "bg-qbit-primary-container text-qbit-primary"
                          : "bg-qbit-surface-container-high text-qbit-on-surface-variant",
                      )}
                    >
                      <Icon name={h.icon} className="text-[14px]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-qbit-on-surface">{h.downloadName}</p>
                      <p className="text-sm text-qbit-on-surface-variant">{h.downloadedAt}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button
            type="button"
            onClick={onViewAll ?? (() => navigate("engineer-dashboard"))}
            className="w-full mt-5 py-2 text-qbit-primary text-sm font-medium border border-qbit-primary/20 rounded-lg hover:bg-qbit-primary/5 transition-all"
          >
            View All Activity
          </button>
        </>
      )}

      {/* Most downloaded */}
      {tab === "popular" && (
        <div className="space-y-3">
          {mostDownloaded.length === 0 ? (
            <p className="text-sm text-qbit-on-surface-variant italic py-4 text-center">
              No downloads yet.
            </p>
          ) : (
            mostDownloaded.map((d) => (
              <CompactDownloadRow key={d.id} download={d} onDownload={onDownload} />
            ))
          )}
        </div>
      )}

      {/* Favorites */}
      {tab === "favorites" && (
        <div className="space-y-3">
          {favorites.length === 0 ? (
            <div className="py-8 text-center">
              <Icon name="favorite_border" className="text-[32px] text-qbit-outline mx-auto mb-2" />
              <p className="text-sm text-qbit-on-surface-variant">
                No favorites yet.
              </p>
              <p className="text-xs text-qbit-outline mt-1">
                Click the heart icon on any download to add it here.
              </p>
            </div>
          ) : (
            favorites.map((d) => (
              <CompactDownloadRow
                key={d.id}
                download={d}
                onDownload={onDownload}
                onRemove={onRemoveFavorite}
              />
            ))
          )}
        </div>
      )}
    </SurfaceCard>
  );
}

/** Compact download row for the sidebar lists. */
function CompactDownloadRow({
  download,
  onDownload,
  onRemove,
}: {
  download: DownloadItem;
  onDownload?: (download: DownloadItem) => void;
  onRemove?: (download: DownloadItem) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-qbit-surface-container-low transition-colors group">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-qbit-surface-container-low",
          download.deviceColor,
        )}
      >
        <Icon name={download.deviceIcon} className="text-[18px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-qbit-on-surface truncate">{download.name}</p>
        <p className="text-[11px] text-qbit-on-surface-variant">
          {download.version} • {download.fileSize} • {download.downloadCountLabel}
        </p>
      </div>
      {onRemove ? (
        <button
          onClick={() => onRemove(download)}
          aria-label="Remove from favorites"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:text-qbit-error hover:bg-qbit-error-container/40 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Icon name="close" className="text-[16px]" />
        </button>
      ) : (
        <button
          onClick={() => onDownload?.(download)}
          aria-label="Download"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-primary hover:bg-qbit-primary/10 transition-colors"
        >
          <Icon name="download" className="text-[18px]" />
        </button>
      )}
    </div>
  );
}

/** Tab button used inside the DownloadHistory sidebar. */
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
        active
          ? "border-qbit-primary text-qbit-primary"
          : "border-transparent text-qbit-on-surface-variant hover:text-qbit-on-surface",
      )}
    >
      {children}
    </button>
  );
}
