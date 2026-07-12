"use client";

import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { DownloadCard } from "./DownloadCard";
import type { DownloadItem } from "@/lib/downloads/types";

/**
 * SDKUtilitiesSection — grid of SDK and Utility download cards.
 *
 * Receives pre-filtered lists of SDK and Utility items and renders them
 * in two sub-sections using the reusable DownloadCard in compact mode.
 */
export function SDKUtilitiesSection({
  sdks,
  utilities,
  onDownload,
  onViewDetails,
  onFavorite,
  favoriteIds = [],
}: {
  sdks: DownloadItem[];
  utilities: DownloadItem[];
  onDownload?: (download: DownloadItem) => void;
  onViewDetails?: (download: DownloadItem) => void;
  onFavorite?: (download: DownloadItem) => void;
  favoriteIds?: string[];
}) {
  return (
    <>
      {sdks.length > 0 && (
        <section>
          <SectionHeader title="SDK Downloads" accentDot />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sdks.map((sdk) => (
              <DownloadCard
                key={sdk.id}
                download={sdk}
                onDownload={onDownload}
                onViewDetails={onViewDetails}
                onFavorite={onFavorite}
                isFavorite={favoriteIds.includes(sdk.id)}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {utilities.length > 0 && (
        <section>
          <SectionHeader title="Utility Downloads" accentDot />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {utilities.map((utility) => (
              <DownloadCard
                key={utility.id}
                download={utility}
                onDownload={onDownload}
                onViewDetails={onViewDetails}
                onFavorite={onFavorite}
                isFavorite={favoriteIds.includes(utility.id)}
                compact
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
