/**
 * /drivers — public drivers listing (subset of /downloads filtered to driver category).
 */

import { db } from "@/lib/db";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { PublicDownloadsClient } from "@/components/qbit/public/PublicDownloadsClient";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  // Fetch only drivers
  const driverCategory = await db.downloadCategory.findFirst({ where: { slug: "driver" } });
  const downloads = driverCategory
    ? await db.download.findMany({
        where: { visibility: "public", categoryId: driverCategory.id },
        orderBy: [{ featured: "desc" }, { releaseDate: "desc" }],
        take: 100,
        include: { category: true },
      })
    : [];

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-qbit-primary/10 px-3 py-1 text-xs font-semibold text-qbit-primary mb-3">
            <span className="material-symbols-outlined text-[14px]">memory</span>
            Driver Downloads
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-qbit-on-surface">Drivers</h1>
          <p className="mt-2 text-base text-qbit-on-surface-variant">
            Official QBIT drivers for Windows, Linux, and Android. Always free, no login required.
          </p>
        </div>

        <PublicDownloadsClient downloads={downloads.map((d) => ({
          id: d.id,
          name: d.name,
          version: d.version,
          fileSize: d.fileSize,
          releaseDate: d.releaseDate?.toISOString() ?? null,
          storagePath: d.storagePath,
          downloadCount: d.downloadCount,
          categoryName: d.category?.name ?? "Driver",
          categorySlug: d.category?.slug ?? "driver",
          categoryIcon: d.category?.icon ?? "memory",
          featured: d.featured,
          latest: d.latest,
          description: d.description,
        }))} />

        {/* Help section */}
        <div className="mt-12 rounded-2xl border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-6 text-center">
          <h2 className="text-base font-bold text-qbit-on-surface">Not sure which driver you need?</h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Run Dr. QBIT to auto-detect your hardware and get the exact driver for your device.
          </p>
          <a
            href="/dr-qbit"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            Run Dr. QBIT
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Drivers — QBIT Hub",
    description: "Download official QBIT drivers for Windows, Linux, and Android.",
  };
}
