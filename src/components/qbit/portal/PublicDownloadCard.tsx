"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";
import type { PublicDownloadItem } from "@/lib/portal/types";

/**
 * PublicDownloadCard — download card for public customers.
 *
 * Only shows PUBLIC downloads (the parent API filters out internal and
 * restricted items before sending data to the client).  Includes a
 * download button that calls the secure download endpoint.
 */
export function PublicDownloadCard({
  download,
  onDownload,
}: {
  download: PublicDownloadItem;
  onDownload?: (download: PublicDownloadItem) => void;
}) {
  const { toast } = useToast();

  function handleDownload() {
    onDownload?.(download);
    toast({
      title: "Download started",
      description: `${download.name} ${download.version} (${download.fileSize})`,
    });
    // Trigger the secure download API endpoint
    window.location.href = `/api/downloads/${download.id}`;
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-qbit-outline-variant bg-white p-4 hover:shadow-md transition-all group">
      {/* Icon */}
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white", download.gradient)}>
        <Icon name={download.icon} className="text-[22px]" />
      </div>
      {/* Body */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-qbit-on-surface truncate">{download.name}</h4>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-qbit-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="tag" className="text-[12px]" />
            {download.version}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="save" className="text-[12px]" />
            {download.fileSize}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="calendar_today" className="text-[12px]" />
            {download.releaseDate}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="download" className="text-[12px]" />
            {download.downloadCountLabel}
          </span>
        </div>
        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant bg-qbit-surface-container-high px-1.5 py-0.5 rounded">
          {download.category}
        </span>
      </div>
      {/* Action */}
      <QbitButton
        size="sm"
        variant="primary"
        icon="download"
        onClick={handleDownload}
        className="shrink-0"
      >
        Download
      </QbitButton>
    </div>
  );
}

/**
 * PublicDownloadGrid — responsive grid of PublicDownloadCards.
 */
export function PublicDownloadGrid({
  downloads,
  onDownload,
}: {
  downloads: PublicDownloadItem[];
  onDownload?: (download: PublicDownloadItem) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {downloads.map((d) => (
        <PublicDownloadCard key={d.id} download={d} onDownload={onDownload} />
      ))}
    </div>
  );
}
