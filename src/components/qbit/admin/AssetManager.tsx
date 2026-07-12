"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminAssetRow } from "@/lib/admin/types";

const VISIBILITY_VARIANT = {
  public: "success",
  internal: "warning",
  hidden: "neutral",
} as const;

const TYPE_FILTERS = ["All", "Driver", "Firmware", "SDK", "Utility", "Manual", "Datasheet", "Warranty", "Video"] as const;

const notifyComingSoon = (toast: ReturnType<typeof useToast>["toast"], feature: string) =>
  toast({ title: `${feature} coming soon`, description: "This feature is under development." });

/**
 * AssetManager — unified asset manager table for drivers, firmware, SDK,
 * utilities, manuals, datasheets, warranty docs, and YouTube videos.
 *
 * Supports search, type filtering, and per-row actions (edit, replace
 * version, archive, delete, visibility toggle).
 */
export function AssetManager({
  assets,
  onEdit,
  onArchive,
  onDelete,
  onUpload,
}: {
  assets: AdminAssetRow[];
  onEdit?: (a: AdminAssetRow) => void;
  onArchive?: (a: AdminAssetRow) => void;
  onDelete?: (a: AdminAssetRow) => void;
  onUpload?: () => void;
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (query) {
        const q = query.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.version.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== "All" && a.typeLabel !== typeFilter) return false;
      return true;
    });
  }, [assets, query, typeFilter]);

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Asset Manager"
        accentDot
        rightContent={
          <QbitButton size="sm" variant="primary" icon="upload" onClick={() => onUpload ?? notifyComingSoon(toast, "Asset Upload")}>
            Upload Asset
          </QbitButton>
        }
      />

      {/* Search + type filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets by name or version..."
            className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-2.5 pl-10 pr-3 text-sm focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-lg transition-all",
                typeFilter === t
                  ? "bg-qbit-primary text-qbit-on-primary"
                  : "bg-qbit-surface-container-low text-qbit-on-surface-variant hover:bg-qbit-surface-container",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <SurfaceCard className="overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-qbit-surface-container-low border-b border-qbit-outline-variant">
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Asset</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden md:table-cell">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden lg:table-cell">Size</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Visibility</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden lg:table-cell">Downloads</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant hidden md:table-cell">Updated</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-qbit-outline-variant/40">
              {filtered.map((asset) => (
                <tr key={asset.id} className="hover:bg-qbit-surface-container-low transition-colors">
                  {/* Asset */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white", asset.gradient)}>
                        <Icon name={asset.icon} className="text-[18px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-qbit-on-surface truncate">{asset.name}</p>
                        <p className="text-xs text-qbit-on-surface-variant">{asset.version}</p>
                      </div>
                    </div>
                  </td>
                  {/* Type */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs font-semibold text-qbit-on-surface-variant bg-qbit-surface-container-high px-2 py-0.5 rounded">{asset.typeLabel}</span>
                  </td>
                  {/* Size */}
                  <td className="px-4 py-3 text-qbit-on-surface-variant whitespace-nowrap hidden lg:table-cell">{asset.size}</td>
                  {/* Visibility */}
                  <td className="px-4 py-3">
                    <StatusBadge variant={VISIBILITY_VARIANT[asset.visibility]}>{asset.visibility}</StatusBadge>
                  </td>
                  {/* Downloads */}
                  <td className="px-4 py-3 text-qbit-on-surface-variant whitespace-nowrap hidden lg:table-cell">{asset.downloadCount}</td>
                  {/* Updated */}
                  <td className="px-4 py-3 text-qbit-on-surface-variant whitespace-nowrap hidden md:table-cell">{asset.updatedAt}</td>
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors ml-auto">
                          <Icon name="more_vert" className="text-[18px]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onSelect={() => onEdit?.(asset) ?? notifyComingSoon(toast, "Edit Asset")}>
                          <Icon name="edit" className="text-[16px]" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onSelect={() => notifyComingSoon(toast, "Replace Version")}>
                          <Icon name="upgrade" className="text-[16px]" /> Replace Version
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onSelect={() => notifyComingSoon(toast, "Toggle Visibility")}>
                          <Icon name="visibility" className="text-[16px]" /> Toggle Visibility
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onSelect={() => onArchive?.(asset) ?? notifyComingSoon(toast, "Archive Asset")}>
                          <Icon name="archive" className="text-[16px]" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600" onSelect={() => onDelete?.(asset) ?? notifyComingSoon(toast, "Delete Asset")}>
                          <Icon name="delete" className="text-[16px]" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-qbit-on-surface-variant">No assets found.</div>
        )}
      </SurfaceCard>
    </section>
  );
}
