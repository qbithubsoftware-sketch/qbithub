"use client";

import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { DownloadCard } from "@/components/qbit/downloads/DownloadCard";
import type { DownloadItem } from "@/lib/downloads/types";

/**
 * RelatedDownloads — displays related drivers, firmware, SDKs, and
 * utilities for an installation guide.  REUSES the existing DownloadCard
 * component from the downloads module — no duplication.
 */
export function RelatedDownloads({
  downloads,
  onDownload,
  onViewDetails,
}: {
  downloads: DownloadItem[];
  onDownload?: (download: DownloadItem) => void;
  onViewDetails?: (download: DownloadItem) => void;
}) {
  if (downloads.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Related Downloads" accentDot />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {downloads.map((download) => (
          <DownloadCard
            key={download.id}
            download={download}
            onDownload={onDownload}
            onViewDetails={onViewDetails}
            compact
          />
        ))}
      </div>
    </section>
  );
}
