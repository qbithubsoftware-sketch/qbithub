"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { QR_MAPPINGS } from "@/lib/cms/placeholder-data";

const QR_TYPE_LABEL: Record<string, string> = {
  product_page: "Product Page",
  driver_download: "Driver Download",
  manual_view: "Manual View",
  share_link: "Share Link",
};

const QR_TYPE_ICON: Record<string, string> = {
  product_page: "inventory_2",
  driver_download: "settings_input_component",
  manual_view: "menu_book",
  share_link: "share",
};

/**
 * QRManager — bulk QR code management for products, drivers, manuals, and share links.
 * Shows QR code image, target URL, type, download count, and download action.
 */
export function QRManager() {
  return (
    <section className="space-y-4">
      <SectionHeader
        title="QR Code Manager"
        accentDot
        rightContent={
          <QbitButton size="sm" variant="primary" icon="qr_code_scanner">Generate All QR Codes</QbitButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QR_MAPPINGS.map((qr) => (
          <SurfaceCard key={qr.id} className="p-4 group">
            <div className="flex items-start gap-3">
              {/* QR image */}
              <div className="shrink-0">
                <img
                  src={qr.qrImageUrl}
                  alt={`QR code for ${qr.targetUrl}`}
                  width={80}
                  height={80}
                  loading="lazy"
                  className="rounded-lg border border-qbit-outline-variant"
                />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon name={QR_TYPE_ICON[qr.qrType] ?? "qr_code"} className="text-[16px] text-qbit-primary" />
                  <span className="text-xs font-semibold text-qbit-on-surface">{QR_TYPE_LABEL[qr.qrType] ?? qr.qrType}</span>
                </div>
                <p className="text-[10px] text-qbit-on-surface-variant truncate" title={qr.targetUrl}>{qr.targetUrl}</p>
                <p className="text-[10px] text-qbit-outline mt-1">{qr.downloadCount} scans</p>
              </div>
            </div>
            {/* Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-qbit-outline-variant/40">
              <QbitButton size="sm" variant="outline" icon="download" fullWidth>Download PNG</QbitButton>
              <QbitButton size="sm" variant="ghost" icon="share">Share</QbitButton>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </section>
  );
}
