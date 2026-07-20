"use client";

import { useState, useMemo } from "react";

/**
 * PublicDownloadsClient — interactive download list with category filter.
 *
 * Renders the list grouped by category. Each download card shows name,
 * version, file size, release date, and a Download button that triggers
 * the secure download API endpoint.
 */

interface DownloadItem {
  id: string;
  name: string;
  version: string;
  fileSize: number | string | null;
  releaseDate: string | null;
  downloadCount: number;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string;
  featured: boolean;
  latest: boolean;
  description: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  driver: "bg-qbit-primary/10 text-qbit-primary",
  firmware: "bg-qbit-secondary/10 text-qbit-secondary",
  manual: "bg-qbit-tertiary/10 text-qbit-tertiary",
  sdk: "bg-qbit-primary/10 text-qbit-primary",
  utility: "bg-qbit-secondary/10 text-qbit-secondary",
  brochure: "bg-qbit-tertiary/10 text-qbit-tertiary",
};

export function PublicDownloadsClient({ downloads }: { downloads: DownloadItem[] }) {
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return downloads;
    return downloads.filter((d) => d.categorySlug === filter);
  }, [downloads, filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, DownloadItem[]> = {};
    for (const d of filtered) {
      const key = d.categorySlug;
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    }
    return groups;
  }, [filtered]);

  if (downloads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
        <span className="material-symbols-outlined mx-auto text-[40px] text-qbit-on-surface-variant/40">download</span>
        <p className="mt-3 text-sm font-medium text-qbit-on-surface">No downloads available yet.</p>
        <p className="mt-1 text-xs text-qbit-on-surface-variant">Check back soon — we&apos;re adding new releases regularly.</p>
      </div>
    );
  }

  return (
    <>
      {/* Filter chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            filter === "all" ? "bg-qbit-primary text-qbit-on-primary" : "bg-white text-qbit-on-surface-variant border border-qbit-outline-variant hover:bg-qbit-surface-container-low"
          }`}
        >
          All ({downloads.length})
        </button>
        {Object.keys(grouped).length > 0 && Object.entries(
          downloads.reduce<Record<string, number>>((acc, d) => {
            acc[d.categorySlug] = (acc[d.categorySlug] ?? 0) + 1;
            return acc;
          }, {})
        ).map(([slug, count]) => (
          <button
            key={slug}
            onClick={() => setFilter(slug)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === slug ? "bg-qbit-primary text-qbit-on-primary" : "bg-white text-qbit-on-surface-variant border border-qbit-outline-variant hover:bg-qbit-surface-container-low"
            }`}
          >
            {slug} ({count})
          </button>
        ))}
      </div>

      {/* Grouped lists */}
      <div className="space-y-10">
        {Object.entries(grouped).map(([catSlug, items]) => (
          <section key={catSlug} id={catSlug}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold capitalize text-qbit-on-surface">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${CATEGORY_COLORS[catSlug] ?? "bg-qbit-surface-container-high text-qbit-on-surface-variant"}`}>
                <span className="material-symbols-outlined text-[18px]">{items[0]?.categoryIcon ?? "download"}</span>
              </span>
              {catSlug}
              <span className="text-xs font-normal text-qbit-on-surface-variant">({items.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col rounded-2xl border border-qbit-outline-variant bg-white p-5 shadow-sm transition-all hover:shadow-lg"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {d.featured && (
                        <span className="rounded-full bg-qbit-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-qbit-primary">Featured</span>
                      )}
                      {d.latest && (
                        <span className="rounded-full bg-qbit-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-qbit-success">Latest</span>
                      )}
                    </div>
                    <span className="text-[10px] text-qbit-on-surface-variant">v{d.version}</span>
                  </div>
                  <h3 className="text-sm font-bold text-qbit-on-surface">{d.name}</h3>
                  {d.description && (
                    <p className="mt-1 text-xs text-qbit-on-surface-variant line-clamp-2">{d.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-qbit-on-surface-variant">
                    {d.fileSize && <span>{d.fileSize}</span>}
                    {d.releaseDate && (
                      <span>· {new Date(d.releaseDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
                    )}
                    <span>· {d.downloadCount} downloads</span>
                  </div>
                  <a
                    href={`/api/downloads/${d.id}`}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-qbit-primary px-4 py-2 text-xs font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download
                  </a>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
