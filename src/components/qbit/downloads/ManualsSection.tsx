"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import type { ManualItem } from "@/lib/downloads/types";

/**
 * ManualsSection — grid of manual cards (Quick Start, Installation Guide,
 * User Manual, Warranty Card, Datasheet).  Each card has an icon, title,
 * description, page count, file size, and two actions: "Open PDF Viewer"
 * and "Download PDF".
 */
export function ManualsSection({
  manuals,
  onOpenPdf,
  onDownload,
}: {
  manuals: ManualItem[];
  onOpenPdf?: (manual: ManualItem) => void;
  onDownload?: (manual: ManualItem) => void;
}) {
  return (
    <section>
      <SectionHeader title="Manuals" actionLabel="View all manuals" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {manuals.map((manual) => (
          <ManualCard
            key={manual.id}
            manual={manual}
            onOpenPdf={onOpenPdf}
            onDownload={onDownload}
          />
        ))}
      </div>
    </section>
  );
}

function ManualCard({
  manual,
  onOpenPdf,
  onDownload,
}: {
  manual: ManualItem;
  onOpenPdf?: (manual: ManualItem) => void;
  onDownload?: (manual: ManualItem) => void;
}) {
  return (
    <SurfaceCard className="p-5 card-hover-lift flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-qbit-error/10 text-qbit-error">
          <Icon name={manual.icon} className="text-[24px]" filled />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-qbit-on-surface">{manual.title}</h4>
          <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant bg-qbit-surface-container-high px-2 py-0.5 rounded-full">
            {manual.typeLabel}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-qbit-on-surface-variant leading-relaxed mb-3 flex-1">
        {manual.description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-[11px] text-qbit-on-surface-variant mb-4">
        <span className="flex items-center gap-1">
          <Icon name="menu_book" className="text-[14px]" />
          {manual.pages} pages
        </span>
        <span className="flex items-center gap-1">
          <Icon name="save" className="text-[14px]" />
          {manual.fileSize}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="picture_as_pdf" className="text-[14px]" />
          PDF
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <QbitButton
          variant="outline"
          size="sm"
          icon="visibility"
          fullWidth
          onClick={() => onOpenPdf?.(manual)}
        >
          View PDF
        </QbitButton>
        <QbitButton
          variant="primary"
          size="sm"
          icon="download"
          fullWidth
          onClick={() => onDownload?.(manual)}
        >
          Download
        </QbitButton>
      </div>
    </SurfaceCard>
  );
}
