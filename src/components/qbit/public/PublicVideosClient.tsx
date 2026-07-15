"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

/**
 * PublicVideosClient — interactive video gallery with category filter.
 *
 * Embeds YouTube videos via iframe. If a video URL isn't a YouTube link,
 * shows a "Open in new tab" fallback card.
 */

interface VideoItem {
  title: string;
  url: string;
  provider: string | null;
  externalId: string | null;
  productSlug: string | null;
  productName: string | null;
}

const CATEGORIES = [
  { key: "all", label: "All Videos" },
  { key: "installation", label: "Installation" },
  { key: "training", label: "Training" },
  { key: "troubleshooting", label: "Troubleshooting" },
];

function getYouTubeId(url: string, externalId: string | null): string | null {
  if (externalId) return externalId;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function categorize(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("install") || t.includes("setup") || t.includes("unbox")) return "installation";
  if (t.includes("train") || t.includes("tutorial") || t.includes("overview") || t.includes("how to")) return "training";
  if (t.includes("troubleshoot") || t.includes("fix") || t.includes("problem") || t.includes("error")) return "troubleshooting";
  return "training";
}

export function PublicVideosClient({ videos }: { videos: VideoItem[] }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return videos;
    return videos.filter((v) => categorize(v.title) === filter);
  }, [videos, filter]);

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
        <span className="material-symbols-outlined mx-auto text-[40px] text-qbit-on-surface-variant/40">videocam</span>
        <p className="mt-3 text-sm font-medium text-qbit-on-surface">No videos available.</p>
        <p className="mt-1 text-xs text-qbit-on-surface-variant">
          We&apos;re producing new content — check back soon, or browse the{" "}
          <Link href="/products" className="text-qbit-primary hover:underline">product catalog</Link>.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filter chips */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === c.key ? "bg-qbit-primary text-qbit-on-primary" : "bg-white text-qbit-on-surface-variant border border-qbit-outline-variant hover:bg-qbit-surface-container-low"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v, i) => {
          const ytId = getYouTubeId(v.url, v.externalId);
          return (
            <div key={i} className="overflow-hidden rounded-2xl border border-qbit-outline-variant bg-white shadow-sm transition-all hover:shadow-lg">
              {ytId ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-video w-full flex items-center justify-center bg-qbit-on-background text-white"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[64px]">play_circle</span>
                    <span className="text-xs font-medium">Open in new tab</span>
                  </div>
                </a>
              )}
              <div className="p-4">
                <h3 className="text-sm font-bold text-qbit-on-surface line-clamp-2">{v.title}</h3>
                {v.productName && v.productSlug && (
                  <Link
                    href={`/products/${v.productSlug}`}
                    className="mt-1 inline-block text-xs text-qbit-primary hover:underline"
                  >
                    {v.productName}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
