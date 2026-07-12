"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import type { DownloadItem } from "@/lib/downloads/types";

/**
 * DownloadCard — reusable card displaying a downloadable file.
 *
 * Shows file name, version, release date, OS tags, category, file size,
 * release notes preview, badges (Featured / Latest / Verified), and
 * action buttons (Download, Favorite, Share, Release Notes).
 *
 * Used in the driver list, SDK list, and utility list.
 */
export function DownloadCard({
  download,
  onDownload,
  onViewDetails,
  onFavorite,
  onShare,
  isFavorite = false,
  compact = false,
}: {
  download: DownloadItem;
  onDownload?: (download: DownloadItem) => void;
  onViewDetails?: (download: DownloadItem) => void;
  onFavorite?: (download: DownloadItem) => void;
  onShare?: (download: DownloadItem) => void;
  isFavorite?: boolean;
  /** When true, renders a more compact layout (used in SDK / Utility grids). */
  compact?: boolean;
}) {
  return (
    <SurfaceCard hover className="p-5 group">
      <div className={cn("flex gap-4", compact ? "flex-col" : "flex-col md:flex-row")}>
        {/* Icon tile */}
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-qbit-surface-container-low",
            download.deviceColor,
          )}
        >
          <Icon name={download.deviceIcon} className="text-[32px]" />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3
              className="text-[20px] font-semibold text-qbit-on-surface cursor-pointer hover:text-qbit-primary transition-colors"
              onClick={() => onViewDetails?.(download)}
            >
              {download.name}
            </h3>
            {download.badge && (
              <StatusBadge variant={download.badge.variant}>{download.badge.label}</StatusBadge>
            )}
            {download.featured && <StatusBadge variant="primary">Featured</StatusBadge>}
            {download.latest && <StatusBadge variant="success">Latest</StatusBadge>}
          </div>

          {/* Meta line */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 text-sm text-qbit-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <Icon name="tag" className="text-[16px]" />
              {download.version}
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="devices" className="text-[18px]" />
              {download.category.name}
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="calendar_today" className="text-[18px]" />
              {download.releaseDate}
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="save" className="text-[18px]" />
              {download.fileSize}
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="download" className="text-[18px]" />
              {download.downloadCountLabel}
            </div>
          </div>

          {/* OS tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {download.operatingSystems.map((os) => (
              <span
                key={os.id}
                className="px-3 py-0.5 text-xs font-semibold text-qbit-on-surface-variant rounded-full bg-qbit-surface-container-high flex items-center gap-1"
              >
                {os.icon && <Icon name={os.icon} className="text-[12px]" />}
                {os.name}
              </span>
            ))}
          </div>

          {/* Release notes preview */}
          {download.description && !compact && (
            <div className="bg-qbit-surface-container-low/60 p-3 rounded-lg border border-qbit-outline-variant/30">
              <p className="text-sm text-qbit-on-surface-variant line-clamp-2 italic">
                {download.description}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={cn("flex gap-2", compact ? "flex-row" : "flex-col md:w-48")}>
          <QbitButton
            variant="primary"
            size="md"
            icon="download"
            fullWidth
            onClick={() => onDownload?.(download)}
          >
            Download
          </QbitButton>
          {!compact && (
            <QbitButton
              variant="outline"
              size="md"
              fullWidth
              icon="description"
              onClick={() => onViewDetails?.(download)}
            >
              Release Notes
            </QbitButton>
          )}
          {/* Favorite + Share icon buttons */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => onFavorite?.(download)}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                isFavorite
                  ? "border-qbit-primary/30 bg-qbit-primary/10 text-qbit-primary"
                  : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container",
              )}
            >
              <Icon name={isFavorite ? "favorite" : "favorite_border"} className="text-[18px]" filled={isFavorite} />
            </button>
            <button
              onClick={() => onShare?.(download)}
              aria-label="Share download"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors"
            >
              <Icon name="share" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
