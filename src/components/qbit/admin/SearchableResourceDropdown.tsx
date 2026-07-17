"use client";

/**
 * SearchableResourceDropdown — enterprise-grade resource picker.
 *
 * Replaces manual URL text fields with a searchable dropdown that lists
 * resources already uploaded for the current product.
 *
 * FEATURES:
 *   - Search filter (type to filter by title/version)
 *   - Keyboard navigation (ArrowUp/Down, Enter, Escape)
 *   - Resource type icon (color-coded)
 *   - Version display (parsed from metadata)
 *   - "Latest" badge for the highest-version resource of each type
 *   - "None" option to clear the selection
 *   - Click-outside-to-close
 *   - ARIA combobox + listbox + option roles for accessibility
 *   - Mobile responsive
 *
 * USAGE:
 *   <SearchableResourceDropdown
 *     label="Driver"
 *     resources={productResources}
 *     filterTypes={["windows_driver", "driver"]}
 *     value={selectedResourceId}
 *     onChange={(id, resource) => setDriverResourceId(id)}
 *   />
 *
 * The dropdown automatically:
 *   - Filters resources by the specified types
 *   - Sorts by version (latest first)
 *   - Marks the highest-version resource with a "Latest" badge
 *   - Shows the selected resource's URL in a read-only field below
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";

// ====================== Types ======================
export interface ResourceOption {
  id: string;
  type: string;
  title: string;
  url: string;
  mimeType?: string | null;
  altText?: string | null;
  createdAt?: string;
}

interface SearchableResourceDropdownProps {
  label: string;
  description?: string;
  resources: ResourceOption[];
  /** Resource types to include in this dropdown (e.g. ["windows_driver", "driver"]). */
  filterTypes: string[];
  /** Currently selected resource ID (or null/empty for "None"). */
  value: string | null;
  /** Called when the user selects a resource (or null for "None"). */
  onChange: (resourceId: string | null, resource: ResourceOption | null) => void;
  /** Icon name for the dropdown header. */
  icon?: string;
}

// ====================== Helpers ======================
function parseMeta(altText: string | null): Record<string, string> {
  if (!altText) return {};
  try {
    const parsed = JSON.parse(altText);
    if (parsed && typeof parsed === "object" && parsed.meta) {
      return parsed.meta as Record<string, string>;
    }
  } catch {
    // not JSON — ignore
  }
  return {};
}

function extractVersion(resource: ResourceOption): string {
  const meta = parseMeta(resource.altText ?? null);
  return meta.version ?? meta.driverVersion ?? meta.firmwareVersion ?? meta.softwareVersion ?? "";
}

function extractSubLabel(resource: ResourceOption): string {
  const meta = parseMeta(resource.altText ?? null);
  return (
    meta.supportedOS ??
    meta.manualType ??
    meta.docType ??
    meta.viewType ??
    meta.category ??
    meta.language ??
    ""
  );
}

function iconForType(type: string): string {
  const map: Record<string, string> = {
    windows_driver: "memory",
    windows_software: "apps",
    android_software: "phone_android",
    firmware: "upgrade",
    manual: "menu_book",
    troubleshooting: "build",
    video: "videocam",
    gallery_image: "photo_library",
    image: "photo_library",
    brochure: "picture_as_pdf",
    datasheet: "article",
    warranty: "verified_user",
    sdk: "code",
    utility: "build",
    driver: "memory",
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
    manual: "text-qbit-tertiary",
    troubleshooting: "text-qbit-error",
    video: "text-qbit-error",
    gallery_image: "text-qbit-primary",
    driver: "text-qbit-primary",
    utility: "text-qbit-secondary",
    sdk: "text-qbit-primary",
  };
  return map[type] ?? "text-qbit-on-surface-variant";
}

/**
 * Compare two version strings like "v2.4.1" vs "v2.4.0".
 * Returns positive if a > b, negative if a < b, 0 if equal.
 */
function compareVersions(a: string, b: string): number {
  const parseVersion = (v: string) => {
    const cleaned = v.replace(/^v/i, "").trim();
    const parts = cleaned.split(/[.\-]/).map((p) => parseInt(p, 10) || 0);
    return parts;
  };
  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  const maxLen = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < maxLen; i++) {
    const aVal = aParts[i] ?? 0;
    const bVal = bParts[i] ?? 0;
    if (aVal !== bVal) return aVal - bVal;
  }
  return 0;
}

// ====================== Component ======================
export function SearchableResourceDropdown({
  label,
  description,
  resources,
  filterTypes,
  value,
  onChange,
  icon = "link",
}: SearchableResourceDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // ===== Filter resources by type + search query =====
  const filtered = useMemo(() => {
    const byType = resources.filter((r) => filterTypes.includes(r.type));
    const withVersions = byType.map((r) => ({
      resource: r,
      version: extractVersion(r),
      subLabel: extractSubLabel(r),
    }));
    // Sort by version descending (latest first)
    withVersions.sort((a, b) => {
      if (a.version && b.version) return compareVersions(b.version, a.version);
      if (a.version) return -1;
      if (b.version) return 1;
      return 0;
    });

    if (!search.trim()) return withVersions;
    const q = search.toLowerCase();
    return withVersions.filter(
      ({ resource, version }) =>
        resource.title.toLowerCase().includes(q) ||
        version.toLowerCase().includes(q) ||
        resource.type.toLowerCase().includes(q)
    );
  }, [resources, filterTypes, search]);

  // The "latest" resource is the first one in the sorted list (highest version)
  const latestResourceId = filtered.length > 0 ? filtered[0].resource.id : null;

  // ===== Selected resource =====
  const selectedResource = resources.find((r) => r.id === value) ?? null;
  const selectedVersion = selectedResource ? extractVersion(selectedResource) : "";
  const selectedSubLabel = selectedResource ? extractSubLabel(selectedResource) : "";

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

  // ===== Focus search input when opened =====
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
      setHighlightedIndex(-1);
    }
  }, [open]);

  // ===== Keyboard navigation =====
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex === -1) {
        // "None" option
        onChange(null, null);
        setOpen(false);
      } else if (filtered[highlightedIndex]) {
        onChange(filtered[highlightedIndex].resource.id, filtered[highlightedIndex].resource);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  function handleSelect(resourceId: string | null, resource: ResourceOption | null) {
    onChange(resourceId, resource);
    setOpen(false);
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
        {label}
      </label>
      {description && (
        <p className="text-[11px] text-qbit-on-surface-variant/80">{description}</p>
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
          {selectedResource ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-qbit-on-surface">{selectedResource.title}</p>
                {selectedVersion && (
                  <span className="shrink-0 rounded-md bg-qbit-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-qbit-primary">
                    {selectedVersion}
                  </span>
                )}
                {selectedResource.id === latestResourceId && selectedVersion && (
                  <span className="shrink-0 rounded-md bg-qbit-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-qbit-success">
                    Latest
                  </span>
                )}
              </div>
              {selectedSubLabel && (
                <p className="truncate text-[11px] text-qbit-on-surface-variant">{selectedSubLabel}</p>
              )}
            </div>
          ) : (
            <p className="flex-1 text-sm text-qbit-on-surface-variant/60">
              Select a resource…
            </p>
          )}
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
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search resources…"
                  className="w-full rounded-md border border-qbit-outline-variant bg-qbit-surface-container-low py-2 pl-8 pr-3 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/60 focus:border-qbit-primary focus:outline-none focus:ring-1 focus:ring-qbit-primary/30"
                />
              </div>
            </div>

            {/* Options list */}
            <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
              {/* "None" option */}
              <li>
                <button
                  type="button"
                  onClick={() => handleSelect(null, null)}
                  onMouseEnter={() => setHighlightedIndex(-1)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    highlightedIndex === -1 ? "bg-qbit-primary/10" : "hover:bg-qbit-surface-container-low"
                  } ${value === null || value === "" ? "bg-qbit-primary/5" : ""}`}
                  role="option"
                  aria-selected={value === null || value === ""}
                >
                  <Icon name="do_not_disturb" className="text-[18px] text-qbit-on-surface-variant" />
                  <span className="text-qbit-on-surface-variant">None (clear selection)</span>
                </button>
              </li>

              {filtered.length === 0 ? (
                <li className="px-3 py-4 text-center text-xs text-qbit-on-surface-variant">
                  {resources.filter((r) => filterTypes.includes(r.type)).length === 0
                    ? "No resources uploaded for this type yet."
                    : "No matches found."}
                </li>
              ) : (
                filtered.map(({ resource, version, subLabel }, i) => (
                  <li key={resource.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(resource.id, resource)}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                        i === highlightedIndex ? "bg-qbit-primary/10" : "hover:bg-qbit-surface-container-low"
                      } ${value === resource.id ? "bg-qbit-primary/5" : ""}`}
                      role="option"
                      aria-selected={value === resource.id}
                    >
                      <Icon
                        name={iconForType(resource.type)}
                        className={`mt-0.5 text-[18px] ${colorForType(resource.type)} shrink-0`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-qbit-on-surface">{resource.title}</p>
                          {version && (
                            <span className="shrink-0 rounded bg-qbit-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-qbit-primary">
                              {version}
                            </span>
                          )}
                          {resource.id === latestResourceId && version && (
                            <span className="shrink-0 rounded bg-qbit-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-qbit-success">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-qbit-on-surface-variant">
                          {subLabel || resource.type.replace(/_/g, " ")}
                        </p>
                      </div>
                      {value === resource.id && (
                        <Icon name="check_circle" className="mt-0.5 text-[16px] text-qbit-primary shrink-0" />
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>

            {/* Footer */}
            <div className="border-t border-qbit-outline-variant/50 bg-qbit-surface-container-low/50 px-3 py-1.5 text-[10px] text-qbit-on-surface-variant">
              {filtered.length} resource{filtered.length !== 1 ? "s" : ""} available · ↑↓ to navigate · Enter to select · Esc to close
            </div>
          </div>
        )}
      </div>

      {/* Read-only URL display (shows the linked resource's URL) */}
      {selectedResource && (
        <div className="flex items-center gap-1.5 rounded-md border border-qbit-success/30 bg-qbit-success/5 px-2.5 py-1.5">
          <Icon name="link" className="text-[14px] text-qbit-success shrink-0" />
          <p className="truncate font-mono text-[10px] text-qbit-on-surface-variant">
            {selectedResource.url}
          </p>
          <a
            href={selectedResource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 text-qbit-primary hover:underline"
            title="Open resource"
          >
            <Icon name="open_in_new" className="text-[14px]" />
          </a>
        </div>
      )}
    </div>
  );
}
