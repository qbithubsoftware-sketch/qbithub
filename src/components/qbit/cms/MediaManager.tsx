"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { EmptyState } from "@/components/qbit/dashboard/EmptyState";
import { MEDIA_FILES, MEDIA_FOLDERS } from "@/lib/cms/placeholder-data";
import type { MediaFileEntry } from "@/lib/cms/types";

const MIME_ICON: Record<string, string> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/svg+xml": "image",
  "image/webp": "image",
  "application/pdf": "picture_as_pdf",
  "application/zip": "folder_zip",
};

/**
 * MediaManager — central media library with search, folder filter,
 * grid/list view, tags, and usage tracking.
 */
export function MediaManager() {
  const [query, setQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return MEDIA_FILES.filter((f) => {
      if (query) {
        const q = query.toLowerCase();
        if (!f.fileName.toLowerCase().includes(q) && !f.tags.some((t) => t.includes(q))) return false;
      }
      if (activeFolder !== "all" && f.folder !== activeFolder) return false;
      return true;
    });
  }, [query, activeFolder]);

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Media Library"
        accentDot
        rightContent={
          <QbitButton size="sm" variant="primary" icon="upload">Upload Media</QbitButton>
        }
      />

      {/* Search + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search media by name or tag..."
            className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-2.5 pl-10 pr-3 text-sm focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
          />
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView("grid")} className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition-colors", view === "grid" ? "bg-qbit-primary text-white" : "border border-qbit-outline-variant text-qbit-on-surface-variant")}>
            <Icon name="grid_view" className="text-[18px]" />
          </button>
          <button onClick={() => setView("list")} className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition-colors", view === "list" ? "bg-qbit-primary text-white" : "border border-qbit-outline-variant text-qbit-on-surface-variant")}>
            <Icon name="view_list" className="text-[18px]" />
          </button>
        </div>
      </div>

      {/* Folder filter chips */}
      <div className="flex flex-wrap gap-2">
        {MEDIA_FOLDERS.map((folder) => (
          <button
            key={folder.id}
            onClick={() => setActiveFolder(folder.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeFolder === folder.id ? "bg-qbit-primary text-white" : "bg-qbit-surface-container-low text-qbit-on-surface-variant hover:bg-qbit-surface-container",
            )}
          >
            <Icon name={folder.icon} className="text-[14px]" />
            {folder.name}
          </button>
        ))}
      </div>

      {/* Files */}
      {filtered.length === 0 ? (
        <SurfaceCard className="p-8">
          <EmptyState icon="folder_off" title="No media found" description="Upload images, documents, or icons to populate the media library." />
        </SurfaceCard>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {filtered.map((file) => <MediaGridCard key={file.id} file={file} />)}
        </div>
      ) : (
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-qbit-surface-container-low border-b border-qbit-outline-variant">
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-qbit-on-surface-variant">File</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-qbit-on-surface-variant hidden sm:table-cell">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-qbit-on-surface-variant hidden md:table-cell">Size</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase text-qbit-on-surface-variant hidden lg:table-cell">Tags</th>
                  <th className="px-3 py-2 text-center text-xs font-bold uppercase text-qbit-on-surface-variant">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-qbit-outline-variant/40">
                {filtered.map((file) => (
                  <tr key={file.id} className="hover:bg-qbit-surface-container-low transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Icon name={MIME_ICON[file.mimeType] ?? "description"} className="text-[18px] text-qbit-primary" />
                        <span className="text-xs font-medium text-qbit-on-surface truncate max-w-[160px]">{file.fileName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-qbit-on-surface-variant hidden sm:table-cell">{file.mimeType.split("/")[1]?.toUpperCase()}</td>
                    <td className="px-3 py-2 text-xs text-qbit-on-surface-variant hidden md:table-cell">{file.fileSize}</td>
                    <td className="px-3 py-2 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {file.tags.map((tag) => <span key={tag} className="text-[10px] bg-qbit-surface-container-high px-1.5 py-0.5 rounded text-qbit-on-surface-variant">{tag}</span>)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-xs font-semibold text-qbit-primary">{file.usageCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}
    </section>
  );
}

function MediaGridCard({ file }: { file: MediaFileEntry }) {
  return (
    <div className="group rounded-xl border border-qbit-outline-variant bg-white overflow-hidden hover:shadow-md transition-all">
      {/* Thumbnail */}
      <div className="aspect-square bg-qbit-surface-container-low flex items-center justify-center relative">
        {file.thumbnailUrl ? (
          <img src={file.thumbnailUrl} alt={file.fileName} loading="lazy" className="w-full h-full object-contain" />
        ) : (
          <Icon name={MIME_ICON[file.mimeType] ?? "description"} className="text-[32px] text-qbit-outline" />
        )}
        {file.usageCount > 0 && (
          <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-qbit-primary text-white px-1.5 py-0.5 rounded-full">{file.usageCount}</span>
        )}
      </div>
      {/* Info */}
      <div className="p-2">
        <p className="text-[11px] font-medium text-qbit-on-surface truncate">{file.fileName}</p>
        <p className="text-[10px] text-qbit-outline">{file.fileSize}</p>
      </div>
    </div>
  );
}
