"use client";

import { useCallback, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { GlassCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";
import { ENGINEER_NAV, ENGINEER_FOOTER } from "@/lib/navigation/nav-config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryCardData {
  name: string;
  slug: string;
  count: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  iconHoverBg: string;
}

interface TrendingProduct {
  name: string;
  badgeLabel: string;
  badgeColor: string;
  subtitle: string;
  icon: string;
  gradient: string;
  navigateTo?: ScreenId;
}

interface InventoryProduct {
  name: string;
  categoryBadge: string;
  /** Solid pill background class — e.g. bg-qbit-primary text-qbit-on-primary */
  badgeClass: string;
  model: string;
  osIcons: string[];
  chips: { label: string; icon: string }[];
  icon: string;
  gradient: string;
  navigateTo?: ScreenId;
}

/* ------------------------------------------------------------------ */
/* Static data                                                        */
/* ------------------------------------------------------------------ */

const CATEGORIES: CategoryCardData[] = [
  {
    name: "Windows POS",
    slug: "windows-pos",
    count: "12 Products",
    icon: "desktop_windows",
    iconColor: "text-qbit-primary",
    iconBg: "bg-qbit-primary-container/10",
    iconHoverBg: "group-hover:bg-qbit-primary-container/20",
  },
  {
    name: "Android POS",
    slug: "android-pos",
    count: "8 Products",
    icon: "phone_android",
    iconColor: "text-qbit-secondary",
    iconBg: "bg-qbit-secondary-container/10",
    iconHoverBg: "group-hover:bg-qbit-secondary-container/20",
  },
  {
    name: "Thermal Printers",
    slug: "thermal-printer",
    count: "15 Products",
    icon: "print",
    iconColor: "text-qbit-tertiary",
    iconBg: "bg-qbit-on-tertiary-fixed-variant/10",
    iconHoverBg: "group-hover:bg-qbit-on-tertiary-fixed-variant/20",
  },
  {
    name: "Barcode Scanners",
    slug: "barcode-scanner",
    count: "6 Products",
    icon: "barcode_scanner",
    iconColor: "text-qbit-primary",
    iconBg: "bg-qbit-primary/10",
    iconHoverBg: "group-hover:bg-qbit-primary/20",
  },
  {
    name: "Accessories",
    slug: "accessories",
    count: "24 Products",
    icon: "cable",
    iconColor: "text-qbit-secondary",
    iconBg: "bg-qbit-secondary/10",
    iconHoverBg: "group-hover:bg-qbit-secondary/20",
  },
];

const TRENDING: TrendingProduct[] = [
  {
    name: "HUB-X Pro",
    badgeLabel: "Top Resource",
    badgeColor: "text-qbit-primary",
    subtitle: "Thermal Printer \u2022 v2.4 Driver",
    icon: "print",
    gradient:
      "from-qbit-surface-container-high via-qbit-surface-container to-qbit-surface-container-low",
  },
  {
    name: "ScanMaster Elite",
    badgeLabel: "Newly Released",
    badgeColor: "text-qbit-secondary",
    subtitle: "Wireless Scanner \u2022 User Manual",
    icon: "barcode_scanner",
    gradient:
      "from-qbit-secondary-container/30 via-qbit-surface-container-high to-qbit-surface-container-low",
  },
  {
    name: "QBIT T-800",
    badgeLabel: "Most Downloaded",
    badgeColor: "text-qbit-tertiary",
    subtitle: "Windows POS \u2022 Setup Guide",
    icon: "desktop_windows",
    navigateTo: "product-details-t800",
    gradient:
      "from-qbit-primary-container/25 via-qbit-surface-container-high to-qbit-surface-container-low",
  },
];

const INVENTORY: InventoryProduct[] = [
  {
    name: "QBIT T-800",
    categoryBadge: "WINDOWS POS",
    badgeClass: "bg-qbit-primary text-qbit-on-primary",
    model: "MODEL: T-800",
    osIcons: ["desktop_windows", "phone_android", "terminal"],
    chips: [
      { label: "Manual", icon: "description" },
      { label: "Driver", icon: "download" },
      { label: "Video", icon: "videocam" },
    ],
    icon: "desktop_windows",
    gradient:
      "from-qbit-primary-container/30 via-qbit-surface-container-high to-qbit-surface-container-low",
    navigateTo: "product-details-t800",
  },
  {
    name: "HUB-X Pro",
    categoryBadge: "PRINTER",
    badgeClass: "bg-qbit-secondary text-qbit-on-secondary",
    model: "MODEL: HUB-X PRO",
    osIcons: ["desktop_windows", "phone_android", "terminal"],
    chips: [
      { label: "Manual", icon: "description" },
      { label: "Driver", icon: "download" },
    ],
    icon: "print",
    gradient:
      "from-qbit-secondary-container/25 via-qbit-surface-container-high to-qbit-surface-container-low",
  },
  {
    name: "ScanMaster Elite",
    categoryBadge: "SCANNER",
    badgeClass:
      "bg-qbit-tertiary-container text-qbit-on-tertiary-container",
    model: "MODEL: SM-E1",
    osIcons: ["desktop_windows", "phone_android"],
    chips: [
      { label: "Manual", icon: "description" },
      { label: "Video", icon: "videocam" },
    ],
    icon: "barcode_scanner",
    gradient:
      "from-qbit-tertiary-container/30 via-qbit-surface-container-high to-qbit-surface-container-low",
  },
];

const SHARE_URL = "https://hub.qbit.com/assets/T-800";

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export function ProductLibraryPage() {
  const navigate = useNavigation((s) => s.navigate);
  const [shareOpen, setShareOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleCopy = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(SHARE_URL);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <AppShell
      variant="engineer"
      brand={{ title: "QBIT Hub", tagline: "Enterprise SaaS", icon: "dataset" }}
      navItems={ENGINEER_NAV}
      footerItems={ENGINEER_FOOTER}
      activeScreen="product-library"
      user={{ name: "Alex Chen", role: "Installation Engineer", initials: "AC" }}
      topBar={{
        searchPlaceholder: "Search product technical library...",
        searchValue,
        onSearchChange: setSearchValue,
        user: { name: "Alex Chen", role: "Installation Engineer", initials: "AC" },
      }}
    >
      <div className="space-y-10 md:space-y-12">
        {/* ---------------------------------------------------------- */}
        {/* Hero                                                       */}
        {/* ---------------------------------------------------------- */}
        <section className="relative overflow-hidden rounded-3xl border border-qbit-outline-variant/50 bg-gradient-to-b from-qbit-surface-container-low to-qbit-surface px-6 py-12 text-center md:px-12 md:py-16">
          <div className="mx-auto max-w-4xl space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-qbit-on-surface md:text-4xl">
              Product Library
            </h2>
            <p className="mx-auto max-w-2xl text-base text-qbit-on-surface-variant md:text-lg">
              Browse all QBIT hardware with specifications, images, videos,
              manuals and drivers. The definitive technical repository for
              enterprise-grade hardware solutions.
            </p>

            {/* Search input */}
            <div className="mx-auto max-w-xl pt-6">
              <div className="group relative">
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Enter model number (e.g. T-800)..."
                  className="w-full rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest py-4 pl-12 pr-24 text-sm text-qbit-on-surface shadow-lg transition-all placeholder:text-qbit-on-surface-variant/70 focus:border-qbit-primary focus:ring-2 focus:ring-qbit-primary/40 group-hover:shadow-xl md:text-base"
                />
                <Icon
                  name="search"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[24px] font-bold text-qbit-primary"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-qbit-outline-variant bg-qbit-surface-container px-3 py-1 text-xs font-semibold text-qbit-on-surface-variant">
                  {"\u2318"} K
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Categories                                                 */}
        {/* ---------------------------------------------------------- */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-qbit-on-surface md:text-2xl">
                Browse Categories
              </h3>
              <p className="mt-1 text-sm text-qbit-on-surface-variant">
                Jump straight to a hardware family.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 md:gap-6">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? null : cat.slug)}
                  className={`group flex cursor-pointer flex-col items-center rounded-2xl border p-6 text-center transition-all ${isActive ? "border-qbit-primary bg-qbit-primary/5 ring-2 ring-qbit-primary/20" : "border-qbit-outline-variant/50 hover:border-qbit-primary/30"}`}
                >
                  <div
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${cat.iconBg} ${cat.iconHoverBg}`}
                  >
                    <Icon
                      name={cat.icon}
                      className={`text-[32px] ${cat.iconColor}`}
                      filled={isActive}
                    />
                  </div>
                  <span className={`text-sm font-semibold ${isActive ? "text-qbit-primary" : "text-qbit-on-surface"}`}>
                    {cat.name}
                  </span>
                  <span className="mt-1 text-xs uppercase tracking-wider text-qbit-outline">
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Trending Hardware                                          */}
        {/* ---------------------------------------------------------- */}
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-qbit-on-surface md:text-2xl">
                Trending Hardware
              </h3>
              <p className="mt-1 text-sm text-qbit-on-surface-variant">
                The most frequently accessed resources this week.
              </p>
            </div>
            <div className="hidden gap-2 sm:flex">
              <button
                type="button"
                aria-label="Previous trending hardware"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-qbit-outline-variant text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high"
              >
                <Icon name="chevron_left" className="text-[20px]" />
              </button>
              <button
                type="button"
                aria-label="Next trending hardware"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-qbit-outline-variant text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high"
              >
                <Icon name="chevron_right" className="text-[20px]" />
              </button>
            </div>
          </div>

          <div className="custom-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0">
            {TRENDING.map((product) => (
              <article
                key={product.name}
                className="group flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest shadow-sm transition-shadow hover:shadow-md sm:w-[320px]"
              >
                {/* Gradient cover with Material icon */}
                <div
                  className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${product.gradient}`}
                >
                  <Icon
                    name={product.icon}
                    className="text-[64px] text-qbit-primary transition-transform duration-500 group-hover:scale-110"
                    filled
                  />
                  <span
                    className={`absolute left-4 top-4 text-xs font-semibold uppercase tracking-wider ${product.badgeColor}`}
                  >
                    {product.badgeLabel}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <h4 className="text-lg font-bold text-qbit-on-surface">
                      {product.name}
                    </h4>
                    <span className="text-xs text-qbit-on-surface-variant">
                      {product.subtitle}
                    </span>
                  </div>
                  <QbitButton
                    variant="primary"
                    fullWidth
                    className="mt-auto"
                    onClick={
                      product.navigateTo
                        ? () => navigate(product.navigateTo as ScreenId)
                        : undefined
                    }
                  >
                    View Details
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </QbitButton>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Full Hardware Inventory                                    */}
        {/* ---------------------------------------------------------- */}
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-qbit-on-surface md:text-2xl">
                Full Hardware Inventory
              </h3>
              <p className="mt-1 text-sm text-qbit-on-surface-variant">
                Complete catalog of QBIT enterprise hardware.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant px-4 py-2 text-sm font-medium text-qbit-on-surface transition-colors hover:bg-qbit-surface-container-low"
              >
                <Icon name="filter_list" className="text-[20px]" />
                Filter
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant px-4 py-2 text-sm font-medium text-qbit-on-surface transition-colors hover:bg-qbit-surface-container-low"
              >
                <Icon name="sort" className="text-[20px]" />
                Sort: Newest
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {INVENTORY.filter((p) => {
              if (!activeCategory) return true;
              const slug = p.categoryBadge.toLowerCase().replace(/\s+/g, "-");
              return slug === activeCategory || slug === activeCategory.replace(/-/g, " ");
            }).length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
                <Icon name="inventory_2" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
                <p className="mt-3 text-sm font-medium text-qbit-on-surface">No products available in this category.</p>
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className="mt-3 text-sm font-semibold text-qbit-primary hover:underline"
                >
                  View all products
                </button>
              </div>
            ) : (
              INVENTORY.filter((p) => {
                if (!activeCategory) return true;
                const slug = p.categoryBadge.toLowerCase().replace(/\s+/g, "-");
                return slug === activeCategory || slug === activeCategory.replace(/-/g, " ");
              }).map((product) => (
              <article
                key={product.name}
                className="group flex flex-col overflow-hidden rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-2xl"
              >
                {/* Cover */}
                <div
                  className={`relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-br p-8 ${product.gradient}`}
                >
                  <Icon
                    name={product.icon}
                    className="text-[96px] text-qbit-primary transition-transform duration-500 group-hover:scale-105"
                    filled
                  />
                  <div className="absolute left-4 top-4 flex gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${product.badgeClass}`}
                    >
                      {product.categoryBadge}
                    </span>
                    <span className="rounded-full border border-qbit-outline-variant/30 bg-qbit-surface-container-lowest/80 px-3 py-1 text-xs text-qbit-on-surface-variant backdrop-blur">
                      {product.model}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-5 p-6">
                  <div>
                    <h4 className="mb-1 text-xl font-bold text-qbit-on-surface">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-3 text-qbit-outline">
                      {product.osIcons.map((icon) => (
                        <Icon key={icon} name={icon} className="text-[18px]" />
                      ))}
                      <span className="ml-1 text-xs font-medium">
                        OS Supported
                      </span>
                    </div>
                  </div>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-2">
                    {product.chips.map((chip) => (
                      <span
                        key={chip.label}
                        className="flex items-center gap-1 rounded-lg bg-qbit-surface-container-low px-3 py-1 text-xs text-qbit-on-surface-variant"
                      >
                        <Icon name={chip.icon} className="text-[14px]" />
                        {chip.label}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto grid grid-cols-2 gap-3 border-t border-qbit-outline-variant/50 pt-4">
                    <QbitButton
                      variant="primary"
                      onClick={
                        product.navigateTo
                          ? () => navigate(product.navigateTo as ScreenId)
                          : undefined
                      }
                    >
                      View Details
                    </QbitButton>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        title="Share"
                        onClick={() => setShareOpen(true)}
                        className="flex flex-1 items-center justify-center rounded-xl border border-qbit-outline-variant text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-low"
                      >
                        <Icon name="share" className="text-[20px]" />
                      </button>
                      <button
                        type="button"
                        title="Favorite"
                        className="flex flex-1 items-center justify-center rounded-xl border border-qbit-outline-variant text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-low"
                      >
                        <Icon name="favorite" className="text-[20px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
              ))
            )}
          </div>

          {/* Active category indicator + clear button */}
          {activeCategory && (
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm text-qbit-on-surface-variant">
                Filtered by: <span className="font-semibold text-qbit-primary capitalize">{activeCategory.replace(/-/g, " ")}</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="inline-flex items-center gap-1 rounded-full border border-qbit-outline-variant px-3 py-1 text-xs font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"
              >
                <Icon name="close" className="text-[14px]" />
                Clear filter
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Share Modal                                                */}
      {/* ---------------------------------------------------------- */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="glass-card max-w-md rounded-2xl border-qbit-outline-variant bg-qbit-surface-container-lowest p-6 shadow-2xl">
          <DialogHeader className="mb-2 flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-xl font-semibold text-qbit-on-surface">
              Share Hardware Profile
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Copy the asset link or share the hardware profile via WhatsApp, PDF,
            or email.
          </DialogDescription>

          <div className="space-y-4">
            {/* Copyable URL */}
            <div className="rounded-xl border border-qbit-outline-variant bg-qbit-surface-container p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-qbit-on-surface-variant">
                  Technical Asset Link
                </span>
                <Icon name="link" className="text-[16px] text-qbit-primary" />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={SHARE_URL}
                  className="flex-1 rounded-lg border border-qbit-outline-variant bg-qbit-surface px-4 py-2 text-sm text-qbit-on-surface-variant outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg bg-qbit-primary px-4 py-2 text-sm font-semibold text-qbit-on-primary transition-colors hover:bg-qbit-primary-container"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* WhatsApp + PDF */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="group flex items-center justify-center gap-3 rounded-2xl border border-qbit-outline-variant p-5 text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-low"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] transition-transform group-hover:scale-110">
                  <Icon name="chat" className="text-[20px]" />
                </div>
                <span className="text-sm font-medium">WhatsApp</span>
              </button>
              <button
                type="button"
                className="group flex items-center justify-center gap-3 rounded-2xl border border-qbit-outline-variant p-5 text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-low"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-qbit-error/10 text-qbit-error transition-transform group-hover:scale-110">
                  <Icon name="picture_as_pdf" className="text-[20px]" />
                </div>
                <span className="text-sm font-medium">Download PDF</span>
              </button>
            </div>

            {/* Email */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-qbit-outline-variant py-4 text-qbit-on-surface-variant transition-all hover:border-qbit-primary hover:bg-qbit-primary-container/5"
            >
              <Icon name="mail" className="text-[20px]" />
              <span className="text-sm font-medium">Email Technical Specs</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
