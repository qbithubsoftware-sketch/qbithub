"use client";

import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { PublicDownloadGrid } from "./PublicDownloadCard";
import type { PublicDownloadItem } from "@/lib/portal/types";

/**
 * DownloadAssets — public downloads section for a product page.
 *
 * REUSES the existing PublicDownloadCard/PublicDownloadGrid from the
 * portal module.  Only displays assets marked visibility="public".
 */
export function DownloadAssets({ downloads }: { downloads: PublicDownloadItem[] }) {
  if (downloads.length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionHeader title="Downloads" accentDot />
      <p className="text-sm text-qbit-on-surface-variant -mt-2">
        Free drivers, manuals, datasheets, and warranty documents for your QBIT hardware.
      </p>
      <PublicDownloadGrid downloads={downloads} />
    </section>
  );
}
