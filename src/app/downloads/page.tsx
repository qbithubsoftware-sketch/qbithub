/**
 * /downloads — public download center.
 */

import { db } from "@/lib/db";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { PublicDownloadsClient } from "@/components/qbit/public/PublicDownloadsClient";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { slug: "driver", label: "Drivers", icon: "memory", color: "bg-qbit-primary/10 text-qbit-primary" },
  { slug: "firmware", label: "Firmware", icon: "upgrade", color: "bg-qbit-secondary/10 text-qbit-secondary" },
  { slug: "manual", label: "Manuals", icon: "menu_book", color: "bg-qbit-tertiary/10 text-qbit-tertiary" },
  { slug: "sdk", label: "SDK", icon: "code", color: "bg-qbit-primary/10 text-qbit-primary" },
  { slug: "utility", label: "Utilities", icon: "build", color: "bg-qbit-secondary/10 text-qbit-secondary" },
  { slug: "brochure", label: "Brochures", icon: "picture_as_pdf", color: "bg-qbit-tertiary/10 text-qbit-tertiary" },
];

export default async function DownloadsPage() {
  const downloads = await db.download.findMany({
    where: { visibility: "public" },
    orderBy: [{ featured: "desc" }, { releaseDate: "desc" }],
    take: 100,
    include: { category: true },
  });

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-qbit-on-surface">Download Center</h1>
          <p className="mt-2 text-base text-qbit-on-surface-variant">
            Drivers, firmware, manuals, SDKs, utilities, and brochures — all free, no login required.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.slug}
              href={`#${cat.slug}`}
              className="group flex flex-col items-center rounded-2xl border border-qbit-outline-variant/50 bg-white p-5 text-center transition-all hover:border-qbit-primary/30 hover:shadow-lg"
            >
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${cat.color}`}>
                <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
              </div>
              <span className="text-sm font-semibold text-qbit-on-surface">{cat.label}</span>
            </a>
          ))}
        </div>

        <PublicDownloadsClient downloads={downloads.map((d) => ({
          id: d.id,
          name: d.name,
          version: d.version,
          fileSize: d.fileSize,
          releaseDate: d.releaseDate?.toISOString() ?? null,
          downloadCount: d.downloadCount,
          categoryName: d.category?.name ?? "Other",
          categorySlug: d.category?.slug ?? "other",
          categoryIcon: d.category?.icon ?? "download",
          featured: d.featured,
          latest: d.latest,
          description: d.description,
        }))} />
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Downloads — QBIT Hub",
    description: "Download drivers, firmware, manuals, SDKs, utilities, and brochures for QBIT enterprise hardware.",
  };
}
