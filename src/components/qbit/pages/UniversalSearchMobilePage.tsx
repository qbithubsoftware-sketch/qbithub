"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { ScreenSwitcher } from "@/components/qbit/shells/ScreenSwitcher";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";

/**
 * UniversalSearchMobilePage — pixel-faithful implementation of the
 * `universal_search_mobile_qbit_hub` Stitch design.
 *
 * Mobile-only: no sidebar, no topbar from AppShell. Standalone shell with
 * a fixed glass header, sticky search + filter chips, scrollable grouped
 * results, a FAB and a fixed bottom navigation.
 */
export function UniversalSearchMobilePage() {
  const navigate = useNavigation((s) => s.navigate);

  // Collapse the sidebar-width CSS var so the page spans full viewport width.
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", "0px");
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, []);

  // Search query state — the cancel icon clears it.
  const [query, setQuery] = useState("");
  // Active filter chip state — All is active by default.
  const [activeFilter, setActiveFilter] = useState<string>("All");
  // Header shadow state — toggled when the page scrolls past 10px.
  const [headerShadowed, setHeaderShadowed] = useState(false);
  // Search icon focus animation state.
  const [searchFocused, setSearchFocused] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Attach a scroll listener to the main scroll container so we can toggle
  // the header shadow when the user scrolls down past 10px.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setHeaderShadowed(el.scrollTop > 10);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleClearSearch = () => {
    setQuery("");
  };

  const handleNavClick = (screen: ScreenId | null) => {
    if (screen) navigate(screen);
  };

  return (
    <div className="flex min-h-screen flex-col bg-qbit-background text-qbit-on-surface">
      {/* Floating Screen Switcher — for design demo (positioned outside the phone column on desktop) */}
      <div className="fixed top-4 right-4 z-[100] hidden md:block">
        <ScreenSwitcher />
      </div>
      {/* Outer wrapper constrains content to a phone-like column on desktop. */}
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col">
        {/* ===== Header (fixed top, glass-header bg with backdrop-blur) ===== */}
        <header
          className={[
            "sticky top-0 z-50 flex h-16 items-center justify-between border-b border-qbit-outline-variant/30 px-4 py-2 backdrop-blur-md transition-shadow",
            "bg-[rgba(249,249,255,0.8)]",
            headerShadowed ? "shadow-md" : "",
          ].join(" ")}
        >
          {/* Left: QBIT Hub logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-qbit-primary-container text-qbit-on-primary-container">
              <Icon name="bolt" className="text-[18px]" filled />
            </div>
            <h1 className="text-[20px] font-semibold leading-7 tracking-tight text-qbit-primary">
              QBIT Hub
            </h1>
          </div>
          {/* Right: history button + avatar */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Search history"
              className="flex h-10 w-10 items-center justify-center rounded-full text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high active:scale-95"
            >
              <Icon name="history" className="text-[22px]" />
            </button>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border border-qbit-outline-variant/50 bg-qbit-primary text-[11px] font-bold text-qbit-on-primary"
              aria-label="Account: AR"
            >
              AR
            </div>
          </div>
        </header>

        {/* ===== Scrollable body (owns its own scroll container) ===== */}
        <div
          ref={scrollRef}
          className="hide-scrollbar relative flex-1 overflow-y-auto"
          style={{ paddingBottom: "100px" }}
        >
          {/* ===== Sticky Search Section (top-16 i.e. directly under header) ===== */}
          <section className="sticky top-0 z-40 border-b border-qbit-outline-variant/20 bg-qbit-background/95 px-4 pb-2 pt-4 backdrop-blur-md">
            {/* Search input */}
            <div className="group relative flex w-full items-center">
              <Icon
                name="search"
                className={[
                  "pointer-events-none absolute left-4 text-qbit-on-surface-variant transition-all duration-200",
                  searchFocused
                    ? "scale-110 text-qbit-primary [transform:translateX(2px)_scale(1.1)]"
                    : "",
                ].join(" ")}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search knowledge base, tickets..."
                className="w-full rounded-2xl border border-transparent bg-qbit-surface-container-low py-4 pl-12 pr-12 text-[16px] leading-6 text-qbit-on-surface outline-none transition-all placeholder:text-qbit-on-surface-variant/60 focus:border-qbit-primary focus:ring-4 focus:ring-qbit-primary/10"
              />
              <button
                type="button"
                aria-label="Clear search"
                onClick={handleClearSearch}
                className="absolute right-4 text-qbit-on-surface-variant transition-colors hover:text-qbit-error active:scale-95"
              >
                <Icon name="cancel" className="text-[22px]" />
              </button>
            </div>

            {/* Horizontal filter chips */}
            <div className="hide-scrollbar mt-4 overflow-x-auto">
              <div className="flex gap-2 pb-1">
                {FILTERS.map((filter) => {
                  const isActive = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => handleFilterClick(filter)}
                      className={[
                        "whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium leading-5 transition-colors",
                        isActive
                          ? "bg-qbit-primary text-qbit-on-primary shadow-sm"
                          : "border border-qbit-outline-variant/30 bg-qbit-surface-container-high text-qbit-on-surface-variant hover:bg-qbit-surface-container-highest",
                      ].join(" ")}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ===== Search Results ===== */}
          <section className="space-y-8 px-4 py-4">
            {/* Group: Documentation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[12px] font-semibold uppercase tracking-widest text-qbit-on-surface-variant/60">
                  Documentation
                </h2>
                <button
                  type="button"
                  className="text-[14px] font-medium text-qbit-primary"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {/* Result card 1 */}
                <button
                  type="button"
                  className="flex w-full items-start gap-4 rounded-2xl border border-qbit-outline-variant/30 bg-qbit-surface-container-lowest p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-qbit-surface-container-high">
                    <Icon name="menu_book" className="text-[24px] text-qbit-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[18px] font-semibold leading-6 text-qbit-on-surface">
                      V3 Core Installation Guide
                    </h3>
                    <p className="mt-1 line-clamp-1 text-[14px] leading-5 text-qbit-on-surface-variant">
                      Updated 2 days ago • v4.2.0 compatibility...
                    </p>
                  </div>
                  <Icon
                    name="chevron_right"
                    className="text-[24px] text-qbit-outline-variant"
                  />
                </button>

                {/* Result card 2 */}
                <button
                  type="button"
                  className="flex w-full items-start gap-4 rounded-2xl border border-qbit-outline-variant/30 bg-qbit-surface-container-lowest p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-qbit-surface-container-high">
                    <Icon name="terminal" className="text-[24px] text-qbit-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[18px] font-semibold leading-6 text-qbit-on-surface">
                      CLI Reference: Hub Utility
                    </h3>
                    <p className="mt-1 line-clamp-1 text-[14px] leading-5 text-qbit-on-surface-variant">
                      Comprehensive command list for local dev...
                    </p>
                  </div>
                  <Icon
                    name="chevron_right"
                    className="text-[24px] text-qbit-outline-variant"
                  />
                </button>
              </div>
            </div>

            {/* Group: Recent Tickets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[12px] font-semibold uppercase tracking-widest text-qbit-on-surface-variant/60">
                  Recent Tickets
                </h2>
                <button
                  type="button"
                  className="text-[14px] font-medium text-qbit-primary"
                >
                  Open cases
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col gap-2 rounded-2xl border border-qbit-outline-variant/30 bg-qbit-surface-container-lowest p-4 shadow-sm transition-transform active:scale-[0.98]">
                  <div className="flex items-start justify-between">
                    <div className="rounded bg-qbit-error-container px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-qbit-on-error-container">
                      Critical
                    </div>
                    <span className="text-[14px] font-medium text-qbit-on-surface-variant">
                      #INC-4921
                    </span>
                  </div>
                  <h3 className="text-[18px] font-semibold leading-6 text-qbit-on-surface">
                    Kernel panic on v3-alpha build
                  </h3>
                  <div className="mt-1 flex items-center gap-1">
                    <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-qbit-outline-variant bg-qbit-surface-container-highest">
                      <span className="text-[8px] font-bold text-qbit-on-surface-variant">
                        AC
                      </span>
                    </div>
                    <span className="text-[14px] italic text-qbit-on-surface-variant">
                      Assignee: Alex Chen
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Group: Quick Actions (2-col grid) */}
            <div className="space-y-4">
              <h2 className="text-[12px] font-semibold uppercase tracking-widest text-qbit-on-surface-variant/60">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-2 rounded-3xl bg-qbit-secondary-container p-6 text-qbit-on-secondary-container transition-transform active:scale-95"
                >
                  <Icon name="add_circle" className="text-[32px]" />
                  <span className="text-[14px] font-medium leading-5">New Case</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-2 rounded-3xl bg-qbit-surface-container-high p-6 text-qbit-on-surface transition-transform active:scale-95"
                >
                  <Icon
                    name="download"
                    className="text-[32px] text-qbit-primary"
                  />
                  <span className="text-[14px] font-medium leading-5">
                    Latest SDK
                  </span>
                </button>
              </div>
            </div>

            {/* Group: Recent Searches */}
            <div className="space-y-4 pb-6">
              <h2 className="text-[12px] font-semibold uppercase tracking-widest text-qbit-on-surface-variant/60">
                Recent Searches
              </h2>
              <div className="space-y-0">
                {RECENT_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="flex w-full items-center gap-4 border-b border-qbit-outline-variant/20 px-1 py-4 text-left transition-colors active:bg-qbit-surface-container-low"
                  >
                    <Icon
                      name="history"
                      className="text-[24px] text-qbit-on-surface-variant"
                    />
                    <span className="flex-1 text-[16px] leading-6 text-qbit-on-surface">
                      {term}
                    </span>
                    <Icon
                      name="north_west"
                      className="text-[24px] text-qbit-outline-variant"
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ===== FAB (fixed bottom-24 right-4) ===== */}
        <button
          type="button"
          aria-label="Scan QR code"
          className="absolute bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-primary text-qbit-on-primary shadow-xl transition-transform active:scale-90"
        >
          <Icon name="qr_code_scanner" className="text-[28px]" filled />
        </button>

        {/* ===== Bottom Navigation (fixed, h-72px, glass-header bg) ===== */}
        <nav className="absolute bottom-0 left-0 right-0 z-50 flex h-[72px] items-center justify-around border-t border-qbit-outline-variant/20 bg-[rgba(249,249,255,0.85)] px-4 backdrop-blur-md safe-area-bottom">
          {BOTTOM_NAV.map((item) => {
            const isActive = item.id === "search";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.screen)}
                className={[
                  "flex flex-col items-center gap-1 transition-colors",
                  isActive
                    ? "text-qbit-primary"
                    : "text-qbit-on-surface-variant",
                ].join(" ")}
              >
                <div className="relative">
                  <Icon
                    name={item.icon}
                    className="text-[24px]"
                    filled={isActive}
                  />
                  {item.dot && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-qbit-primary" />
                  )}
                </div>
                <span
                  className={[
                    "text-[10px] font-semibold uppercase tracking-wider",
                    isActive ? "font-bold" : "",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/* ---------- Static data ---------- */

const FILTERS: string[] = [
  "All",
  "Documentation",
  "Support Tickets",
  "Drivers",
  "Knowledge Base",
];

const RECENT_SEARCHES: string[] = [
  "Database migration scripts",
  "API Authentication v2",
];

interface BottomNavItem {
  id: string;
  label: string;
  icon: string;
  screen: ScreenId | null;
  dot?: boolean;
}

const BOTTOM_NAV: BottomNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", screen: "engineer-dashboard" },
  { id: "products", label: "Products", icon: "inventory_2", screen: "product-library" },
  {
    id: "search",
    label: "Search",
    icon: "search",
    screen: "universal-search-mobile",
    dot: true,
  },
  { id: "downloads", label: "Downloads", icon: "download", screen: "driver-download-center" },
  { id: "profile", label: "Profile", icon: "person", screen: null },
];
