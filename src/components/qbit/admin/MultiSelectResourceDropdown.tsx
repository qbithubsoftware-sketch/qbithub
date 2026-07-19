"use client";

/**
 * MultiSelectResourceDropdown — enterprise-grade shared resource picker.
 *
 * Replaces per-product upload forms with a searchable multi-select dropdown
 * that lists resources from the Global Resource Library.
 *
 * FEATURES:
 *   - Search filter (type to filter by name/version)
 *   - Multi-select (checkbox per resource)
 *   - Keyboard navigation (ArrowUp/Down, Enter, Escape)
 *   - Smart filtering by product category (supportedCategories field)
 *   - Resource type icon (color-coded)
 *   - Version display + "Latest" badge
 *   - "Used by N products" count
 *   - Selected resources shown as removable chips
 *   - Click-outside-to-close
 *   - ARIA combobox + listbox roles
 *   - Mobile responsive
 *
 * USAGE:
 *   <MultiSelectResourceDropdown
 *     label="Windows Software"
 *     resources={allResources}
 *     filterTypes={["windows_software"]}
 *     productCategory="thermal-printer"  // smart filter
 *     selectedIds={["res1", "res2"]}
 *     onChange={(ids) => setSelectedIds(ids)}
 *   />
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";

export interface GlobalResource {
  id: string;
  name: string;
  type: string;
  version: string | null;
  description: string | null;
  supportedCategories: string | null;
  url: string;
  mimeType: string | null;
  fileSize: number | null;
  thumbnailUrl: string | null;
  status: string;
  visibility: string;
  downloadCount: number;
  usedByCount: number;
  releaseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MultiSelectResourceDropdownProps {
  label: string;
  description?: string;
  resources: GlobalResource[];
  /** Resource types to include (e.g. ["windows_software"]). */
  filterTypes: string[];
  /** Product category for smart filtering (e.g. "thermal-printer"). */
  productCategory?: string;
  /** Currently selected resource IDs. */
  selectedIds: string[];
  /** Called when selection changes. */
  onChange: (ids: string[]) => void;
  icon?: string;
}

function iconForType(type: string): string {
  const map: Record<string, string> = {
    windows_driver: "memory",
    windows_software: "apps",
    android_software: "phone_android",
    firmware: "upgrade",
    sdk: "code",
    manual: "menu_book",
    installation_guide: "menu_book",
    troubleshooting: "build",
    video: "videocam",
    browser_utility: "apps",
    maintenance_tool: "build",
    pos_utility: "point_of_sale",
    other: "attach_file",
  };
  return map[type] ?? "attach_file";
}

function colorForType(type: string): string {
  const map: Record<string, string> = {
    windows_driver: "text-qbit-primary",
    windows_software: "text-qbit-secondary",
    android_software: "text-qbit-tertiary",
    firmware: "text-qbit-warning",
    sdk: "text-qbit-primary",
    manual: "text-qbit-tertiary",
    installation_guide: "text-qbit-tertiary",
    troubleshooting: "text-qbit-error",
    video: "text-qbit-error",
    browser_utility: "text-qbit-secondary",
    maintenance_tool: "text-qbit-error",
    pos_utility: "text-qbit-primary",
    other: "text-qbit-on-surface-variant",
  };
  return map[type] ?? "text-qbit-on-surface-variant";
}

export function MultiSelectResourceDropdown({
  label,
  description,
  resources,
  filterTypes,
  productCategory,
  selectedIds,
  onChange,
  icon = "link",
}: MultiSelectResourceDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // ===== Filter resources by type + smart category filter + search =====
  const filtered = useMemo(() => {
    let byType = resources.filter((r) => filterTypes.includes(r.type));

    // Smart category filtering: if productCategory is specified, show resources
    // that either have no supportedCategories (universal) OR include this category
    if (productCategory) {
      byType = byType.filter((r) => {
        if (!r.supportedCategories) return true; // universal resource
        const cats = r.supportedCategories.split(",").map((c) => c.trim());
        return cats.includes(productCategory);
      });
    }

    // Sort by version descending (latest first)
    const sorted = [...byType].sort((a, b) => {
      if (a.version && b.version) return b.version.localeCompare(a.version);
      if (a.version) return -1;
      if (b.version) return 1;
      return a.name.localeCompare(b.name);
    });

    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.version ?? "").toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }, [resources, filterTypes, productCategory, search]);

  const latestResourceId = filtered.length > 0 && filtered[0].version ? filtered[0].id : null;
  const selectedResources = resources.filter((r) => selectedIds.includes(r.id));

  // ===== Click outside to close =====
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
      setHighlightedIndex(-1);
    }
  }, [open]);

  function toggleResource(resourceId: string) {
    if (selectedIds.includes(resourceId)) {
      onChange(selectedIds.filter((id) => id !== resourceId));
    } else {
      onChange([...selectedIds, resourceId]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlightedIndex]) {
        toggleResource(filtered[highlightedIndex].id);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
          {label}
        </label>
        {selectedIds.length > 0 && (
          <span className="rounded-md bg-qbit-primary/10 px-2 py-0.5 text-[10px] font-bold text-qbit-primary">
            {selectedIds.length} selected
          </span>
        )}
      </div>
      {description && <p className="text-[11px] text-qbit-on-surface-variant/80">{description}</p>}

      {/* Selected resource chips */}
      {selectedResources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedResources.map((r) => (
            <div
              key={r.id}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 ${
                r.status === "deprecated"
                  ? "border-qbit-warning/40 bg-qbit-warning/5"
                  : "border-qbit-primary/30 bg-qbit-primary/5"
              }`}
            >
              <Icon name={iconForType(r.type)} className={`text-[14px] ${colorForType(r.type)}`} />
              <span className="text-[11px] font-semibold text-qbit-on-surface">{r.name}</span>
              {r.version && <span className="text-[10px] text-qbit-on-surface-variant">{r.version}</span>}
              {r.status === "deprecated" && <span className="text-[9px] font-bold uppercase text-qbit-warning">Deprecated</span>}
              <button
                type="button"
                onClick={() => toggleResource(r.id)}
                className="text-qbit-on-surface-variant hover:text-qbit-error"
                aria-label={`Remove ${r.name}`}
              >
                <Icon name="close" className="text-[14px]" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div ref={containerRef} className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left transition-all hover:border-qbit-primary/40 ${
            open ? "border-qbit-primary ring-2 ring-qbit-primary/20" : "border-qbit-outline-variant"
          }`}
        >
          <Icon name={icon} className="text-[18px] text-qbit-primary shrink-0" />
          <span className="flex-1 text-sm text-qbit-on-surface-variant">
            {selectedIds.length === 0 ? "Select resources…" : `${selectedIds.length} resource${selectedIds.length !== 1 ? "s" : ""} linked`}
          </span>
          <Icon name={open ? "expand_less" : "expand_more"} className="text-[18px] text-qbit-on-surface-variant shrink-0" />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-qbit-outline-variant bg-white shadow-2xl">
            {/* Search input */}
            <div className="border-b border-qbit-outline-variant/50 p-2">
              <div className="relative">
                <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-qbit-on-surface-variant" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setHighlightedIndex(-1); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search resources…"
                  className="w-full rounded-md border border-qbit-outline-variant bg-qbit-surface-container-low py-2 pl-8 pr-3 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/60 focus:border-qbit-primary focus:outline-none focus:ring-1 focus:ring-qbit-primary/30"
                />
              </div>
            </div>

            {/* Options list */}
            <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
              {filtered.length === 0 ? (
                <li className="px-3 py-4 text-center text-xs text-qbit-on-surface-variant">
                  {resources.filter((r) => filterTypes.includes(r.type)).length === 0
                    ? "No resources of this type in the library yet. Add resources via Global Resource Library."
                    : "No matches found."}
                </li>
              ) : (
                filtered.map((r, i) => {
                  const isSelected = selectedIds.includes(r.id);
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => toggleResource(r.id)}
                        onMouseEnter={() => setHighlightedIndex(i)}
                        className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                          i === highlightedIndex ? "bg-qbit-primary/10" : "hover:bg-qbit-surface-container-low"
                        } ${isSelected ? "bg-qbit-primary/5" : ""}`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="mt-0.5 h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary"
                        />
                        <Icon name={iconForType(r.type)} className={`mt-0.5 text-[18px] ${colorForType(r.type)} shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-qbit-on-surface">{r.name}</p>
                            {r.version && (
                              <span className="shrink-0 rounded bg-qbit-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-qbit-primary">
                                {r.version}
                              </span>
                            )}
                            {r.id === latestResourceId && r.version && (
                              <span className="shrink-0 rounded bg-qbit-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-qbit-success">
                                Latest
                              </span>
                            )}
                          </div>
                          {r.description && (
                            <p className="truncate text-[11px] text-qbit-on-surface-variant">{r.description}</p>
                          )}
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-qbit-on-surface-variant/70">
                            <span className="flex items-center gap-0.5"><Icon name="link" className="text-[12px]" /> {r.usedByCount} product{r.usedByCount !== 1 ? "s" : ""}</span>
                            {r.status === "deprecated" && (
                              <span className="rounded bg-qbit-warning/15 px-1 py-0.5 text-[9px] font-bold uppercase text-qbit-warning">Deprecated</span>
                            )}
                            {r.status === "active" && (
                              <span className="rounded bg-qbit-success/15 px-1 py-0.5 text-[9px] font-bold uppercase text-qbit-success">Active</span>
                            )}
                            {r.updatedAt && (
                              <span className="flex items-center gap-0.5">
                                <Icon name="schedule" className="text-[10px]" />
                                {new Date(r.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="border-t border-qbit-outline-variant/50 bg-qbit-surface-container-low/50 px-3 py-1.5 text-[10px] text-qbit-on-surface-variant">
              {filtered.length} resource{filtered.length !== 1 ? "s" : ""} · ↑↓ navigate · Enter toggle · Esc close
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
