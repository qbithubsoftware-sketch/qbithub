"use client";

import { RelatedDownloads } from "@/components/qbit/installation/RelatedDownloads";
import { RelatedVideos } from "@/components/qbit/installation/RelatedVideos";
import type { DownloadItem } from "@/lib/downloads/types";
import type { RelatedVideoEntry } from "@/lib/knowledge/types";

/**
 * RelatedContent — composes the existing RelatedDownloads and RelatedVideos
 * components (from the installation module) into a single wrapper.
 *
 * This avoids duplicating the download-card and YouTube-embed logic.
 * The installation module already built these components to be reusable;
 * we simply import them here.
 */
export function RelatedContent({
  downloads,
  videos,
  onDownload,
  onViewDownloadDetails,
}: {
  downloads?: DownloadItem[];
  videos?: RelatedVideoEntry[];
  onDownload?: (download: DownloadItem) => void;
  onViewDownloadDetails?: (download: DownloadItem) => void;
}) {
  // Map RelatedVideoEntry → the RelatedVideo type expected by RelatedVideos
  const mappedVideos = videos?.map((v) => ({
    id: v.id,
    title: v.title,
    youtubeId: v.youtubeId,
    duration: v.duration,
    thumbnail: v.thumbnail,
  }));

  return (
    <div className="space-y-8">
      {downloads && downloads.length > 0 && (
        <RelatedDownloads downloads={downloads} onDownload={onDownload} onViewDetails={onViewDownloadDetails} />
      )}
      {mappedVideos && mappedVideos.length > 0 && <RelatedVideos videos={mappedVideos} />}
    </div>
  );
}
