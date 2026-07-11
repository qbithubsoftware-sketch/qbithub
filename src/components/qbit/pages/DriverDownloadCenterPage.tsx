"use client";

import { useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard, Pill } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENGINEER_NAV, ENGINEER_FOOTER } from "@/lib/navigation/nav-config";
import { useNavigation } from "@/lib/navigation/store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type BadgeVariant = "info" | "error" | "neutral";

interface DriverCardData {
  id: string;
  title: string;
  badge: { label: string; variant: BadgeVariant };
  deviceIcon: string;
  deviceColor: string;
  device: string;
  date: string;
  size: string;
  osTags: string[];
  notes: string;
}

interface FeaturedCardData {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: string;
  iconFilled?: boolean;
  /** Tailwind classes for the colored background. */
  surface: string;
  /** Tailwind classes for muted text on the colored surface. */
  muted: string;
  ctaLabel: string;
}

interface HistoryEntry {
  id: string;
  title: string;
  meta: string;
  icon: string;
  tone: "primary" | "neutral";
}

/* ------------------------------------------------------------------ */
/* Static content (verbatim from Stitch design)                       */
/* ------------------------------------------------------------------ */

const FILTER_CHIPS = [
  "All Products",
  "Windows POS",
  "Android POS",
  "Thermal Printer",
  "Barcode Scanner",
  "Kiosks",
] as const;

const TYPE_CHIPS = ["Driver", "Firmware", "SDK", "Utility"] as const;

const FEATURED_CARDS: FeaturedCardData[] = [
  {
    id: "latest-driver",
    label: "NEW RELEASE",
    title: "Latest Driver",
    description: "Universal Thermal Printer v2.4.1",
    icon: "bolt",
    surface: "bg-qbit-primary text-qbit-on-primary",
    muted: "text-qbit-on-primary/85",
    ctaLabel: "Quick Download",
  },
  {
    id: "recommended-firmware",
    label: "STABLE BUILD",
    title: "Recommended Firmware",
    description: "HUB-X Series Security Patch",
    icon: "verified",
    iconFilled: true,
    surface: "bg-emerald-600 text-white",
    muted: "text-white/85",
    ctaLabel: "Download",
  },
  {
    id: "most-downloaded",
    label: "POPULAR",
    title: "Most Downloaded",
    description: "Barcode Scanner SDK v1.9",
    icon: "trending_up",
    surface: "bg-amber-500 text-white",
    muted: "text-white/85",
    ctaLabel: "Download",
  },
];

const DRIVERS: DriverCardData[] = [
  {
    id: "thermal-v2-4-0",
    title: "Universal Thermal Printer Driver v2.4.0",
    badge: { label: "Verified Official", variant: "info" },
    deviceIcon: "print",
    deviceColor: "text-qbit-primary",
    device: "HUB-X Pro Series",
    date: "Oct 12, 2023",
    size: "12.4 MB",
    osTags: ["Windows 11", "Windows 10"],
    notes:
      "Added support for high-speed USB 3.1 connections and fixed intermittent connectivity issues with the HUB-X Pro models...",
  },
  {
    id: "pos-firmware-v4-1-2",
    title: "Advanced POS Terminal Firmware v4.1.2",
    badge: { label: "Critical Update", variant: "error" },
    deviceIcon: "terminal",
    deviceColor: "text-qbit-secondary",
    device: "POS-2000 & 3000",
    date: "Nov 05, 2023",
    size: "45.8 MB",
    osTags: ["Embedded OS"],
    notes:
      "Patches vulnerability CVE-2023-5421 and improves battery management for portable POS units.",
  },
  {
    id: "scanner-sdk-android",
    title: "Barcode Scanner SDK for Android",
    badge: { label: "Developer Kit", variant: "neutral" },
    deviceIcon: "integration_instructions",
    deviceColor: "text-qbit-tertiary",
    device: "Scanner Q-Series",
    date: "Dec 12, 2023",
    size: "128 MB",
    osTags: ["Android 10+"],
    notes:
      "Full development kit including libraries, headers, and sample code for integrating Q-series scanners.",
  },
];

const RECENT_HISTORY: HistoryEntry[] = [
  {
    id: "h1",
    title: "Thermal Driver v2.4.0",
    meta: "2 hours ago",
    icon: "download",
    tone: "primary",
  },
  {
    id: "h2",
    title: "Scanner SDK v1.9",
    meta: "Yesterday",
    icon: "visibility",
    tone: "neutral",
  },
  {
    id: "h3",
    title: "POS Security Patch",
    meta: "Oct 24, 2023",
    icon: "download",
    tone: "primary",
  },
];

const PAGINATION_PAGES = [1, 2, 3, 12];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function DriverDownloadCenterPage() {
  const navigate = useNavigation((s) => s.navigate);

  const [activeChip, setActiveChip] = useState<string>("All Products");
  const [categories, setCategories] = useState<Record<string, boolean>>({
    "POS Terminals": false,
    "Thermal Printers": true,
    Scanners: false,
  });
  const [os, setOs] = useState<string>("win11");
  const [activeType, setActiveType] = useState<string>("Driver");
  const [year, setYear] = useState<number>(2024);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [page, setPage] = useState<number>(1);

  const clearAllFilters = () => {
    setCategories({
      "POS Terminals": false,
      "Thermal Printers": false,
      Scanners: false,
    });
    setOs("win11");
    setActiveType("Driver");
    setYear(2024);
  };

  return (
    <AppShell
      variant="engineer"
      brand={{ title: "QBIT Hub", tagline: "Enterprise SaaS", icon: "dataset" }}
      navItems={ENGINEER_NAV}
      activeScreen="driver-download-center"
      user={{ name: "Admin User", role: "Administrator", initials: "AU" }}
      footerItems={ENGINEER_FOOTER}
      topBar={{
        searchPlaceholder: "Search product, model...",
        user: { name: "Admin User", role: "Administrator", initials: "AU" },
      }}
    >
      <div className="space-y-8 pb-10">
        {/* ============================================================ */}
        {/* Hero                                                          */}
        {/* ============================================================ */}
        <section className="flex flex-col items-center text-center">
          <Pill className="mb-4 border-transparent bg-qbit-primary-container uppercase tracking-wider text-qbit-on-primary-container">
            Resource Center
          </Pill>
          <h2 className="font-display-sm text-display-sm text-qbit-on-surface mb-3">
            Driver Download Center
          </h2>
          <p className="font-body-lg text-body-lg text-qbit-on-surface-variant max-w-2xl">
            Search and download the latest drivers, firmware, and SDK packages for
            your QBIT hardware.
          </p>

          {/* Large central search */}
          <div className="mt-8 w-full max-w-3xl relative">
            <Icon
              name="search"
              className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[28px] text-qbit-outline"
            />
            <input
              type="text"
              placeholder="Search product, model number, driver version, firmware or software..."
              className="w-full pl-16 pr-28 py-5 bg-qbit-surface-container-lowest border border-qbit-outline-variant rounded-2xl font-body-md text-body-md shadow-xl focus:ring-4 focus:ring-qbit-primary/10 focus:border-qbit-primary transition-all outline-none text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 px-5 py-2 bg-qbit-primary text-qbit-on-primary font-label-md text-label-md rounded-xl hover:bg-qbit-primary-container hover:text-qbit-on-primary-container transition-all"
            >
              Search
            </button>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {FILTER_CHIPS.map((chip) => {
              const active = activeChip === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setActiveChip(chip)}
                  className={cn(
                    "px-5 py-2 rounded-full font-label-md text-label-md transition-all",
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

        {/* ============================================================ */}
        {/* Featured Bento                                                */}
        {/* ============================================================ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURED_CARDS.map((card) => (
            <div
              key={card.id}
              className={cn(
                "relative overflow-hidden rounded-xl border border-transparent shadow-sm p-5 group",
                card.surface,
              )}
            >
              <Icon
                name={card.icon}
                filled={card.iconFilled}
                className="absolute top-2 right-2 text-[120px] opacity-15 pointer-events-none transition-transform duration-500 group-hover:scale-110"
              />
              <div className="relative z-10">
                <span className="font-label-sm text-label-sm block mb-2 opacity-90">
                  {card.label}
                </span>
                <h3 className="font-headline-sm text-headline-sm mb-1">
                  {card.title}
                </h3>
                <p className={cn("font-body-sm text-body-sm mb-4", card.muted)}>
                  {card.description}
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 font-label-md text-label-md hover:underline"
                >
                  {card.ctaLabel}
                  <Icon name="arrow_forward" className="text-[16px]" />
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* ============================================================ */}
        {/* Main grid: filter sidebar + driver list + right sidebar       */}
        {/* ============================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ----- Left filter sidebar ----- */}
          <aside className="lg:col-span-3">
            <SurfaceCard className="p-5 lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-headline-sm text-headline-sm text-qbit-on-surface">
                  Filters
                </h4>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-qbit-primary font-label-sm text-label-sm hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-6">
                {/* Product Category */}
                <div>
                  <h5 className="font-label-md text-label-md text-qbit-on-surface mb-3">
                    Product Category
                  </h5>
                  <div className="space-y-2">
                    {Object.keys(categories).map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <Checkbox
                          checked={categories[cat]}
                          onCheckedChange={(v) =>
                            setCategories((s) => ({ ...s, [cat]: Boolean(v) }))
                          }
                          className="w-5 h-5 border-qbit-outline-variant data-[state=checked]:bg-qbit-primary data-[state=checked]:border-qbit-primary"
                        />
                        <span className="font-body-sm text-body-sm text-qbit-on-surface-variant group-hover:text-qbit-on-surface">
                          {cat}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Operating System */}
                <div>
                  <h5 className="font-label-md text-label-md text-qbit-on-surface mb-3">
                    Operating System
                  </h5>
                  <Select value={os} onValueChange={setOs}>
                    <SelectTrigger className="w-full h-10 bg-qbit-surface-container-low border-qbit-outline-variant/60 text-qbit-on-surface text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="win11">Windows 11 (64-bit)</SelectItem>
                      <SelectItem value="win10">Windows 10 (64-bit)</SelectItem>
                      <SelectItem value="ubuntu">Ubuntu Linux 22.04</SelectItem>
                      <SelectItem value="android">Android 13.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div>
                  <h5 className="font-label-md text-label-md text-qbit-on-surface mb-3">
                    Type
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_CHIPS.map((t) => {
                      const active = activeType === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setActiveType(t)}
                          className={cn(
                            "px-3 py-1 font-label-sm text-label-sm rounded-lg transition-all",
                            active
                              ? "bg-qbit-surface-container text-qbit-primary border border-qbit-primary/20"
                              : "bg-qbit-surface-container-low text-qbit-on-surface-variant hover:bg-qbit-surface-container",
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Release Year */}
                <div>
                  <h5 className="font-label-md text-label-md text-qbit-on-surface mb-3">
                    Release Year
                  </h5>
                  <input
                    type="range"
                    min={2020}
                    max={2024}
                    step={1}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="qbit-range-slider cursor-pointer"
                    aria-label="Release year"
                  />
                  <div className="flex justify-between mt-2 font-label-sm text-label-sm text-qbit-on-surface-variant">
                    <span>2020</span>
                    <span className="text-qbit-primary font-semibold">{year}</span>
                    <span>2024</span>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </aside>

          {/* ----- Driver list ----- */}
          <div className="lg:col-span-6 space-y-4">
            {/* Stats + Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="font-body-sm text-body-sm text-qbit-on-surface-variant">
                Showing <strong className="text-qbit-on-surface">24</strong> drivers
                for &quot;Thermal Printer&quot;
              </span>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-qbit-on-surface-variant uppercase tracking-wider">
                  Sort By:
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-auto bg-transparent border-none shadow-none px-1 text-qbit-primary font-label-md text-label-md cursor-pointer focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest Release</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="az">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Driver cards */}
            {DRIVERS.map((d) => (
              <DriverCard key={d.id} driver={d} />
            ))}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low transition-colors"
                aria-label="Previous page"
              >
                <Icon name="chevron_left" className="text-[20px]" />
              </button>

              {PAGINATION_PAGES.map((n, idx) => {
                const prev = PAGINATION_PAGES[idx - 1];
                const showEllipsis = idx > 0 && prev !== n - 1;
                return (
                  <span key={n} className="flex items-center gap-2">
                    {showEllipsis && (
                      <span className="px-1 text-qbit-on-surface-variant">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-lg font-label-md text-label-md transition-colors",
                        page === n
                          ? "bg-qbit-primary text-qbit-on-primary"
                          : "border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low",
                      )}
                    >
                      {n}
                    </button>
                  </span>
                );
              })}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(12, p + 1))}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low transition-colors"
                aria-label="Next page"
              >
                <Icon name="chevron_right" className="text-[20px]" />
              </button>
            </div>
          </div>

          {/* ----- Right sidebar ----- */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Recent History */}
            <SurfaceCard className="p-5 lg:sticky lg:top-24">
              <h4 className="font-headline-sm text-headline-sm text-qbit-on-surface mb-4 flex items-center gap-2">
                <Icon name="history" className="text-qbit-primary text-[22px]" />
                Recent History
              </h4>
              <div className="space-y-4">
                {RECENT_HISTORY.map((h, idx) => {
                  const isLast = idx === RECENT_HISTORY.length - 1;
                  return (
                    <div key={h.id} className="relative pl-8 min-h-[24px]">
                      {!isLast && (
                        <span
                          aria-hidden="true"
                          className="absolute left-[11px] top-7 bottom-[-16px] w-[2px] bg-qbit-surface-container-high"
                        />
                      )}
                      <div
                        className={cn(
                          "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center z-10",
                          h.tone === "primary"
                            ? "bg-qbit-primary-container text-qbit-primary"
                            : "bg-qbit-surface-container-high text-qbit-on-surface-variant",
                        )}
                      >
                        <Icon name={h.icon} className="text-[14px]" />
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-qbit-on-surface">
                          {h.title}
                        </p>
                        <p className="font-body-sm text-body-sm text-qbit-on-surface-variant">
                          {h.meta}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => navigate("engineer-dashboard")}
                className="w-full mt-5 py-2 text-qbit-primary font-label-md text-label-md border border-qbit-primary/20 rounded-lg hover:bg-qbit-primary/5 transition-all"
              >
                View All Activity
              </button>
            </SurfaceCard>

            {/* CTA card */}
            <div className="rounded-xl overflow-hidden shadow-md relative h-64 border border-qbit-outline-variant bg-gradient-to-br from-qbit-primary via-qbit-secondary to-qbit-primary-container flex flex-col justify-end p-5">
              <Icon
                name="support_agent"
                filled
                className="absolute top-4 right-4 text-[64px] text-white/15 pointer-events-none"
              />
              <div className="relative z-10">
                <h5 className="text-white font-headline-sm text-headline-sm mb-1">
                  Need Hardware Support?
                </h5>
                <p className="text-white/85 font-body-sm text-body-sm mb-3">
                  Our enterprise support team is available 24/7 for remote assistance.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("ai-support-center")}
                  className="inline-flex items-center gap-2 text-white font-label-md text-label-md group"
                >
                  Contact Support
                  <Icon
                    name="arrow_forward"
                    className="text-[18px] group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Driver card sub-component                                          */
/* ------------------------------------------------------------------ */

function DriverCard({ driver }: { driver: DriverCardData }) {
  return (
    <SurfaceCard hover className="p-5 group">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Icon tile */}
        <div
          className={cn(
            "w-16 h-16 bg-qbit-surface-container-low rounded-xl flex items-center justify-center flex-shrink-0",
            driver.deviceColor,
          )}
        >
          <Icon name={driver.deviceIcon} className="text-[32px]" />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-headline-sm text-headline-sm text-qbit-on-surface">
              {driver.title}
            </h3>
            <StatusBadge variant={driver.badge.variant}>
              {driver.badge.label}
            </StatusBadge>
          </div>

          {/* Meta line */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 font-body-sm text-body-sm text-qbit-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <Icon name="devices" className="text-[18px]" />
              {driver.device}
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="calendar_today" className="text-[18px]" />
              {driver.date}
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="save" className="text-[18px]" />
              {driver.size}
            </div>
          </div>

          {/* OS tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {driver.osTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-0.5 text-qbit-on-surface-variant font-label-sm text-label-sm rounded-full bg-qbit-surface-container-high"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Release notes preview */}
          <div className="bg-qbit-surface-container-low/60 p-3 rounded-lg border border-qbit-outline-variant/30">
            <p className="font-body-sm text-body-sm text-qbit-on-surface-variant line-clamp-1 italic">
              {driver.notes}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 md:w-48">
          <QbitButton variant="primary" size="md" icon="download" fullWidth>
            Download
          </QbitButton>
          <QbitButton variant="outline" size="md" fullWidth>
            Release Notes
          </QbitButton>
        </div>
      </div>
    </SurfaceCard>
  );
}
