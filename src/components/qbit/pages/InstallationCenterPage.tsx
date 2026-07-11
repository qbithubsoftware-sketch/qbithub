"use client";

import { useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { ProgressTracker } from "@/components/qbit/primitives/ProgressTracker";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { useNavigation } from "@/lib/navigation/store";
import { INSTALCORE_NAV } from "@/lib/navigation/nav-config";

interface QuickAccessCard {
  title: string;
  description: string;
  icon: string;
  /** Optional navigation target — if omitted, the card is non-navigational. */
  screen?: "video-training-center";
}

const QUICK_ACCESS_CARDS: QuickAccessCard[] = [
  {
    title: "Installation Guides",
    description: "Step-by-step PDF manuals and interactive web guides for all hardware.",
    icon: "menu_book",
  },
  {
    title: "Installation Videos",
    description: "High-definition walkthroughs of unboxing and hardware mounting.",
    icon: "video_library",
    screen: "video-training-center",
  },
  {
    title: "Quick Setup",
    description: "Rapid deployment checklists for field engineers and technicians.",
    icon: "bolt",
  },
  {
    title: "Wiring Diagrams",
    description: "Low-voltage electrical schematics and pinout specifications.",
    icon: "account_tree",
  },
  {
    title: "Configuration Guides",
    description: "OS provisioning, network setup, and peripheral mapping details.",
    icon: "settings_applications",
  },
  {
    title: "Troubleshooting",
    description: "Common failure modes, diagnostic codes, and resolution steps.",
    icon: "error_outline",
  },
];

interface ProductCategory {
  label: string;
  title: string;
  icon: string;
  /** Tailwind gradient classes for the cover. */
  gradient: string;
}

const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    label: "TERMINALS",
    title: "Windows POS",
    icon: "desktop_windows",
    gradient: "from-qbit-primary via-qbit-primary-container to-qbit-secondary",
  },
  {
    label: "MOBILE",
    title: "Android POS",
    icon: "phone_android",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    label: "PERIPHERALS",
    title: "Thermal Printer",
    icon: "print",
    gradient: "from-slate-700 via-slate-600 to-slate-800",
  },
  {
    label: "SCANNING",
    title: "Barcode Scanner",
    icon: "barcode_scanner",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    label: "SELF-SERVICE",
    title: "Kiosk",
    icon: "store",
    gradient: "from-fuchsia-600 via-purple-600 to-indigo-600",
  },
];

interface GuideEntry {
  title: string;
  section: string;
  status: "active" | "review" | "complete";
  statusLabel: string;
  progress: number;
  progressVariant: "primary" | "warning" | "success";
  icon: string;
  ctaLabel: string;
  ctaVariant: "primary" | "outline";
  dimmed?: boolean;
}

const GUIDE_ENTRIES: GuideEntry[] = [
  {
    title: "Windows Terminal Elite X2 Configuration",
    section: "Section 4: BIOS and Peripheral Sync",
    status: "active",
    statusLabel: "Active",
    progress: 75,
    progressVariant: "primary",
    icon: "desktop_windows",
    ctaLabel: "Resume",
    ctaVariant: "primary",
  },
  {
    title: "TP-800 Thermal Printer Wiring Schematic",
    section: "Section 2: Parallel Port Pinout Configuration",
    status: "review",
    statusLabel: "In Review",
    progress: 30,
    progressVariant: "warning",
    icon: "print",
    ctaLabel: "Resume",
    ctaVariant: "primary",
  },
  {
    title: "Kiosk Core Server Connectivity Setup",
    section: "Completed Section: Static IP Assignment",
    status: "complete",
    statusLabel: "Complete",
    progress: 100,
    progressVariant: "success",
    icon: "dns",
    ctaLabel: "Review",
    ctaVariant: "outline",
    dimmed: true,
  },
];

const STATUS_BADGE_VARIANT: Record<
  GuideEntry["status"],
  "primary" | "warning" | "success"
> = {
  active: "primary",
  review: "warning",
  complete: "success",
};

export function InstallationCenterPage() {
  const navigate = useNavigation((s) => s.navigate);
  const [query, setQuery] = useState("");

  return (
    <AppShell
      variant="instalcore"
      brand={{ title: "InstalCore", tagline: "Enterprise Portal", icon: "hub" }}
      navItems={INSTALCORE_NAV}
      activeScreen="installation-center"
      user={{
        name: "Senior Engineer",
        role: "Terminal ID: 4920",
        initials: "EP",
      }}
      topBar={{
        searchPlaceholder: "Search across enterprise assets...",
        user: {
          name: "Senior Engineer",
          role: "Terminal ID: 4920",
          initials: "EP",
        },
      }}
    >
      <div className="space-y-8 pb-12">
        {/* ===== Hero ===== */}
        <section className="relative flex min-h-[280px] flex-col justify-center overflow-hidden rounded-3xl bg-qbit-primary-container px-6 py-10 text-qbit-on-primary-container md:px-12">
          {/* Decorative overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.45) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.25) 0%, transparent 50%)",
            }}
          />
          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                Installation Center
              </h2>
              <p className="max-w-2xl text-base md:text-lg opacity-90">
                Comprehensive installation resources, wiring diagrams, and configuration
                guides for QBIT enterprise hardware.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 max-w-2xl">
              <div className="relative flex-1 transition-transform focus-within:scale-[1.01]">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-qbit-primary"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search installation guides, videos..."
                  className="w-full h-12 md:h-14 rounded-xl border-0 bg-white pl-12 pr-4 text-sm md:text-base text-qbit-on-surface shadow-lg placeholder:text-qbit-on-surface-variant/70 focus:outline-none focus:ring-4 focus:ring-qbit-primary/20 md:pl-12"
                />
              </div>
              <QbitButton
                size="lg"
                icon="filter_list"
                className="h-12 md:h-14 bg-qbit-inverse-surface text-qbit-inverse-on-surface hover:bg-qbit-on-surface"
              >
                Filter
              </QbitButton>
            </div>
          </div>
        </section>

        {/* ===== Quick Access Bento ===== */}
        <section>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {QUICK_ACCESS_CARDS.map((card) => {
              const Wrapper = card.screen ? "button" : "div";
              return (
                <Wrapper
                  key={card.title}
                  {...(card.screen
                    ? {
                        type: "button" as const,
                        onClick: () => card.screen && navigate(card.screen),
                      }
                    : {})}
                  className="group flex w-full cursor-pointer flex-col rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest p-5 text-left transition-all hover:-translate-y-1 hover:border-qbit-primary hover:shadow-xl md:p-6"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary/10 text-qbit-primary transition-colors group-hover:bg-qbit-primary group-hover:text-white">
                      <Icon name={card.icon} className="text-[24px]" />
                    </div>
                    <Icon
                      name="arrow_forward"
                      className="text-[20px] text-qbit-outline transition-all group-hover:translate-x-1 group-hover:text-qbit-primary"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-qbit-on-surface">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-qbit-on-surface-variant">
                    {card.description}
                  </p>
                </Wrapper>
              );
            })}
          </div>
        </section>

        {/* ===== Product Selection ===== */}
        <section className="space-y-5">
          <div className="flex flex-col gap-2 border-b border-qbit-outline-variant pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-qbit-on-surface md:text-3xl">
                Product Selection
              </h2>
              <p className="text-sm text-qbit-on-surface-variant md:text-base">
                Select a hardware category to browse specific documentation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("product-library")}
              className="text-sm font-bold text-qbit-primary hover:underline"
            >
              View All Products
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {PRODUCT_CATEGORIES.map((product) => (
              <button
                key={product.title}
                type="button"
                onClick={() => navigate("product-library")}
                className="group relative aspect-square overflow-hidden rounded-2xl text-left"
              >
                {/* Gradient cover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${product.gradient} transition-transform duration-500 group-hover:scale-110`}
                />
                {/* Material icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon
                    name={product.icon}
                    className="text-[64px] text-white/90 transition-transform duration-500 group-hover:scale-110"
                    filled
                  />
                </div>
                {/* Dark gradient overlay for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Label */}
                <div className="absolute bottom-0 left-0 p-4 md:p-5 text-white">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70 md:text-xs">
                    {product.label}
                  </p>
                  <h4 className="text-lg font-semibold md:text-xl">{product.title}</h4>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ===== Recently Viewed Guides ===== */}
        <section className="space-y-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-semibold text-qbit-on-surface md:text-3xl">
              Recently Viewed Guides
            </h2>
            <span className="text-sm text-qbit-outline">
              Showing 3 most recent tasks
            </span>
          </div>

          <div className="space-y-4">
            {GUIDE_ENTRIES.map((guide) => (
              <div
                key={guide.title}
                className={[
                  "flex flex-col gap-4 rounded-2xl border border-qbit-outline-variant bg-white p-4 transition-all hover:shadow-md md:flex-row md:items-center md:gap-6 md:p-5",
                  guide.dimmed ? "opacity-70 hover:opacity-100" : "",
                ].join(" ")}
              >
                {/* Icon */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-qbit-surface-container text-qbit-primary md:h-16 md:w-16">
                  <Icon name={guide.icon} className="text-[28px] md:text-[32px]" />
                </div>

                {/* Body */}
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h5 className="truncate text-lg font-semibold text-qbit-on-surface">
                        {guide.title}
                      </h5>
                      <p className="text-sm text-qbit-on-surface-variant">
                        {guide.section}
                      </p>
                    </div>
                    <StatusBadge variant={STATUS_BADGE_VARIANT[guide.status]}>
                      {guide.statusLabel}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center gap-3">
                    <ProgressTracker
                      value={guide.progress}
                      variant={guide.progressVariant}
                      showPercentage={false}
                      className="flex-1"
                    />
                    <span className="whitespace-nowrap text-sm font-medium text-qbit-on-surface">
                      {guide.progress}% Complete
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <QbitButton
                  variant={guide.ctaVariant}
                  size="md"
                  className="shrink-0 px-6"
                >
                  {guide.ctaLabel}
                </QbitButton>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer className="mt-8 border-t border-qbit-outline-variant bg-qbit-surface-container-low p-6 md:p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between md:gap-4">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-lg font-semibold text-qbit-primary">InstalCore Hub</p>
              <p className="text-sm text-qbit-on-surface-variant">
                Enterprise Hardware Installation Management System v4.2.1
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <a
                href="#"
                className="text-sm text-qbit-on-surface-variant transition-colors hover:text-qbit-primary"
              >
                Documentation Policy
              </a>
              <a
                href="#"
                className="text-sm text-qbit-on-surface-variant transition-colors hover:text-qbit-primary"
              >
                Support Portal
              </a>
              <a
                href="#"
                className="text-sm text-qbit-on-surface-variant transition-colors hover:text-qbit-primary"
              >
                Security Standards
              </a>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-outline transition-all hover:border-qbit-primary hover:text-qbit-primary"
                aria-label="Share"
              >
                <Icon name="share" className="text-[18px]" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-outline transition-all hover:border-qbit-primary hover:text-qbit-primary"
                aria-label="Print"
              >
                <Icon name="print" className="text-[18px]" />
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* ===== FAB ===== */}
      <button
        type="button"
        title="New Installation Report"
        aria-label="New Installation Report"
        className="group fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-qbit-primary text-white shadow-2xl transition-transform hover:scale-110 active:scale-95"
      >
        <Icon
          name="add"
          className="text-[32px] transition-transform group-hover:rotate-90"
        />
        <div className="pointer-events-none absolute right-full mr-4 whitespace-nowrap rounded-lg bg-qbit-inverse-surface px-4 py-2 text-sm font-bold text-qbit-inverse-on-surface opacity-0 transition-opacity group-hover:opacity-100">
          New Installation Report
        </div>
      </button>
    </AppShell>
  );
}
