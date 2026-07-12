"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard, Pill } from "@/components/qbit/primitives/GlassCard";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { OPERATING_SYSTEMS, CATEGORIES, PRODUCT_FILTER_CHIPS } from "@/lib/downloads/placeholder-data";
import type { DownloadFilters } from "@/lib/downloads/types";

/**
 * DownloadHero — the centered hero section with title, subtitle, large
 * search bar, and quick filter chips.  Renders full-width above the
 * 3-column filter + list + sidebar layout.
 */
export function DownloadHero({
  filters,
  onChange,
}: {
  filters: DownloadFilters;
  onChange: (patch: Partial<DownloadFilters>) => void;
}) {
  return (
    <section className="flex flex-col items-center text-center">
      <Pill className="mb-4 border-transparent bg-qbit-primary-container uppercase tracking-wider text-qbit-on-primary-container">
        Resource Center
      </Pill>
      <h2 className="text-[36px] leading-[44px] font-bold text-qbit-on-surface mb-3">
        Driver Download Center
      </h2>
      <p className="text-lg text-qbit-on-surface-variant max-w-2xl">
        Search and download the latest drivers, firmware, and SDK packages for your QBIT hardware.
      </p>

      {/* Large central search */}
      <div className="mt-8 w-full max-w-3xl relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[28px] text-qbit-outline"
        />
        <input
          type="text"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="Search product, model number, driver version, firmware or software..."
          className="w-full pl-16 pr-28 py-5 bg-qbit-surface-container-lowest border border-qbit-outline-variant rounded-2xl text-base shadow-xl focus:ring-4 focus:ring-qbit-primary/10 focus:border-qbit-primary transition-all outline-none text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70"
        />
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 px-5 py-2 bg-qbit-primary text-qbit-on-primary text-sm font-medium rounded-xl hover:bg-qbit-primary-container hover:text-qbit-on-primary-container transition-all"
        >
          Search
        </button>
      </div>

      {/* Quick filter chips */}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        {PRODUCT_FILTER_CHIPS.map((chip) => {
          const active = filters.productCategory === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => onChange({ productCategory: chip })}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                active
                  ? "bg-qbit-primary text-qbit-on-primary shadow-md"
                  : "bg-qbit-surface-container-lowest text-qbit-on-surface-variant border border-qbit-outline-variant hover:bg-qbit-surface-container",
              )}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * SearchFilters — the left sidebar with Product Category checkboxes,
 * OS select, Category filter, Latest toggle, and Release Year slider.
 *
 * Rendered inside a sticky <aside> in the 3-column download-center layout.
 */
export function SearchFilters({
  filters,
  onChange,
  resultCount,
  resultLabel,
}: {
  filters: DownloadFilters;
  onChange: (patch: Partial<DownloadFilters>) => void;
  resultCount?: number;
  resultLabel?: string;
}) {
  return (
    <SurfaceCard className="p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[20px] font-semibold text-qbit-on-surface">Filters</h4>
        <button
          type="button"
          onClick={() =>
            onChange({
              productCategory: "All Products",
              osSlug: "all",
              categorySlug: "all",
              releaseYear: 2024,
              latestOnly: false,
            })
          }
          className="text-qbit-primary text-xs font-semibold hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-6">
        {/* Operating System */}
        <div>
          <h5 className="text-sm font-medium text-qbit-on-surface mb-3">Operating System</h5>
          <Select
            value={filters.osSlug}
            onValueChange={(v) => onChange({ osSlug: v })}
          >
            <SelectTrigger className="w-full h-10 bg-qbit-surface-container-low border-qbit-outline-variant/60 text-qbit-on-surface text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operating Systems</SelectItem>
              {OPERATING_SYSTEMS.map((os) => (
                <SelectItem key={os.id} value={os.slug}>
                  {os.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div>
          <h5 className="text-sm font-medium text-qbit-on-surface mb-3">Category</h5>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={filters.categorySlug === "all"}
                onCheckedChange={() => onChange({ categorySlug: "all" })}
                className="w-5 h-5 border-qbit-outline-variant data-[state=checked]:bg-qbit-primary data-[state=checked]:border-qbit-primary"
              />
              <span className="text-sm text-qbit-on-surface-variant group-hover:text-qbit-on-surface">
                All Categories
              </span>
            </label>
            {CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Checkbox
                  checked={filters.categorySlug === cat.slug}
                  onCheckedChange={() => onChange({ categorySlug: cat.slug })}
                  className="w-5 h-5 border-qbit-outline-variant data-[state=checked]:bg-qbit-primary data-[state=checked]:border-qbit-primary"
                />
                <span className="text-sm text-qbit-on-surface-variant group-hover:text-qbit-on-surface flex items-center gap-1.5">
                  {cat.icon && <Icon name={cat.icon} className="text-[14px]" />}
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Version filter (Latest toggle) */}
        <div>
          <h5 className="text-sm font-medium text-qbit-on-surface mb-3">Version</h5>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-qbit-on-surface-variant">Latest versions only</span>
            <Switch
              checked={filters.latestOnly}
              onCheckedChange={(v) => onChange({ latestOnly: v })}
            />
          </label>
        </div>

        {/* Release Year */}
        <div>
          <h5 className="text-sm font-medium text-qbit-on-surface mb-3">Release Year</h5>
          <input
            type="range"
            min={2020}
            max={2024}
            step={1}
            value={filters.releaseYear}
            onChange={(e) => onChange({ releaseYear: Number(e.target.value) })}
            className="qbit-range-slider cursor-pointer"
            aria-label="Release year"
          />
          <div className="flex justify-between mt-2 text-xs text-qbit-on-surface-variant">
            <span>2020</span>
            <span className="text-qbit-primary font-semibold">{filters.releaseYear}</span>
            <span>2024</span>
          </div>
        </div>
      </div>

      {/* Result count */}
      {resultCount !== undefined && (
        <div className="mt-6 pt-4 border-t border-qbit-outline-variant/40 text-xs text-qbit-on-surface-variant">
          <span className="font-semibold text-qbit-on-surface">{resultCount}</span>{" "}
          {resultLabel ?? "downloads"} found
        </div>
      )}
    </SurfaceCard>
  );
}
