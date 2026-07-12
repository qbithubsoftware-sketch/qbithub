"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ManualItem } from "@/lib/downloads/types";

/**
 * PDFPreview — modal dialog that opens a PDF viewer for a manual.
 *
 * In production this would embed a PDF.js viewer or an `<iframe>` pointing
 * at the cloud-hosted PDF.  For now it renders a placeholder preview area
 * with the manual title and a "Download PDF" button.
 */
export function PDFPreview({
  manual,
  open,
  onOpenChange,
  onDownload,
}: {
  manual: ManualItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (manual: ManualItem) => void;
}) {
  if (!manual) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-qbit-surface-container-lowest">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-qbit-outline-variant flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary shrink-0">
              <Icon name={manual.icon} className="text-[20px]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-qbit-on-surface truncate">
                {manual.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-qbit-on-surface-variant">
                {manual.typeLabel} • {manual.pages} pages • {manual.fileSize}
              </DialogDescription>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <QbitButton
              variant="outline"
              size="sm"
              icon="download"
              onClick={() => onDownload?.(manual)}
            >
              Download PDF
            </QbitButton>
          </div>
        </DialogHeader>

        {/* PDF viewer area */}
        <div className="flex-1 overflow-hidden bg-qbit-surface-container-low flex items-center justify-center">
          {/* Placeholder for the actual PDF viewer */}
          <div className="text-center p-8">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-white border border-qbit-outline-variant shadow-sm mb-4">
              <Icon name="picture_as_pdf" className="text-[40px] text-qbit-error" filled />
            </div>
            <p className="text-sm font-semibold text-qbit-on-surface">{manual.title}</p>
            <p className="text-xs text-qbit-on-surface-variant mt-1 max-w-md">
              {manual.description}
            </p>
            <p className="text-[10px] text-qbit-outline mt-4 uppercase tracking-wider">
              PDF Viewer • Powered by PDF.js
            </p>
          </div>
        </div>

        {/* Footer with page nav */}
        <div className="p-3 border-t border-qbit-outline-variant flex items-center justify-between bg-qbit-surface-container-lowest">
          <div className="flex items-center gap-2 text-xs text-qbit-on-surface-variant">
            <Icon name="menu_book" className="text-[16px]" />
            Page 1 of {manual.pages}
          </div>
          <div className="flex gap-1">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container disabled:opacity-40"
              disabled
            >
              <Icon name="chevron_left" className="text-[18px]" />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container"
            >
              <Icon name="chevron_right" className="text-[18px]" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
