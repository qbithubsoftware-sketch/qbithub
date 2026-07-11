"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "./SectionHeader";
import type { PopularDownload } from "./types";

/**
 * Popular Downloads — grid of download cards showing the most-fetched
 * drivers / manuals / firmware.  Each card shows icon, name, category,
 * file size, download count, and a Download button.
 */
export function PopularDownloads({ items }: { items: PopularDownload[] }) {
  return (
    <section>
      <SectionHeader title="Popular Downloads" actionLabel="View all" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <PopularDownloadCard key={item.name} item={item} />
        ))}
      </div>
    </section>
  );
}

function PopularDownloadCard({ item }: { item: PopularDownload }) {
  return (
    <SurfaceCard className="p-4 card-hover-lift">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            item.iconBg ?? "bg-qbit-primary/10 text-qbit-primary",
          )}
        >
          <Icon name={item.icon} className="text-[22px]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-qbit-on-surface truncate">
            {item.name}
          </p>
          <p className="text-xs text-qbit-on-surface-variant">{item.category}</p>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-qbit-outline">
            <span className="flex items-center gap-1">
              <Icon name="database" className="text-[12px]" />
              {item.size}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="download" className="text-[12px]" />
              {item.downloads}
            </span>
          </div>
        </div>
      </div>
      <QbitButton
        size="sm"
        variant="outline"
        fullWidth
        icon="download"
        className="mt-3"
      >
        Download
      </QbitButton>
    </SurfaceCard>
  );
}
