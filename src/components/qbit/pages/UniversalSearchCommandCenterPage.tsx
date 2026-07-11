"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { COMMAND_CENTER_NAV } from "@/lib/navigation/nav-config";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type FilterChip = "All" | "Products" | "Drivers" | "Manuals" | "Videos";

type ResultIconTone = "primary" | "secondary" | "neutral" | "gradient";

interface ResultItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconTone: ResultIconTone;
  /** Optional right-side keyboard hint badge (e.g. "Enter" for the first action). */
  rightBadge?: string;
  /** Optional in-app navigation target when the item is activated. */
  screen?: ScreenId;
}

interface ResultGroup {
  id: string;
  label: string;
  items: ResultItem[];
}

/* ------------------------------------------------------------------ */
/* Static content (verbatim from Stitch design)                        */
/* ------------------------------------------------------------------ */

const FILTER_CHIPS: readonly FilterChip[] = [
  "All",
  "Products",
  "Drivers",
  "Manuals",
  "Videos",
];

const RESULT_GROUPS: readonly ResultGroup[] = [
  {
    id: "quick-actions",
    label: "Quick Actions",
    items: [
      {
        id: "create-ticket",
        title: "Create Ticket",
        description: "Initialize a new support workflow",
        icon: "confirmation_number",
        iconTone: "primary",
        rightBadge: "Enter",
      },
      {
        id: "upload-driver",
        title: "Upload Driver",
        description: "Add a new firmwire package",
        icon: "upload_file",
        iconTone: "secondary",
      },
    ],
  },
  {
    id: "recent-items",
    label: "Recent Items",
    items: [
      {
        id: "t800-manual",
        title: "T-800 Manual",
        description: "Manuals • Last opened 2h ago",
        icon: "menu_book",
        iconTone: "neutral",
      },
      {
        id: "windows-pos-driver",
        title: "Windows POS Driver",
        description: "Drivers • v2.4.1 Stable",
        icon: "settings_input_component",
        iconTone: "neutral",
      },
    ],
  },
  {
    id: "products",
    label: "Products",
    items: [
      {
        id: "qbit-t-800",
        title: "QBIT T-800",
        description: "Industrial Processing Unit",
        icon: "memory",
        iconTone: "gradient",
        screen: "product-details-t800",
      },
    ],
  },
];

/** Flat list of every result item, in display order. */
const FLAT_ITEMS: readonly ResultItem[] = RESULT_GROUPS.flatMap(
  (g) => g.items,
);

/** Index in FLAT_ITEMS that the design renders as "currently selected". */
const DEFAULT_SELECTED_INDEX = 1; // "Upload Driver"

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const ICON_TONE_CLASS: Record<ResultIconTone, string> = {
  primary: "bg-qbit-primary/10 text-qbit-primary",
  secondary: "bg-qbit-secondary/10 text-qbit-secondary",
  neutral: "bg-qbit-surface-variant text-qbit-on-surface-variant",
  gradient: "qbit-gradient-primary text-white",
};

/**
 * Simulate the design's "no results" trigger:
 * query length > 5 AND query contains "xyz".
 */
function isNoResultsQuery(query: string): boolean {
  const lower = query.trim().toLowerCase();
  return lower.length > 5 && lower.includes("xyz");
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function UniversalSearchCommandCenterPage() {
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  // Modal opens automatically when the page loads (this is the "command center" page).
  const [isOpen, setIsOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("All");
  const [selectedIndex, setSelectedIndex] = useState<number>(
    DEFAULT_SELECTED_INDEX,
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const isNoResults = isNoResultsQuery(query);

  const filterChips = useMemo(() => FILTER_CHIPS, []);

  /* ----- Modal open / close ----- */
  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(DEFAULT_SELECTED_INDEX);
    setActiveFilter("All");
  }, []);

  /* ----- Auto-focus the search input when the modal opens ----- */
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  /* ----- Global ⌘K / Ctrl+K hotkey (always on) ----- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openModal();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openModal]);

  /* ----- Activate a result item (Enter or click) ----- */
  const activate = useCallback(
    (item: ResultItem) => {
      toast({
        title: item.title,
        description: item.description,
      });
      if (item.screen) {
        closeModal();
        navigate(item.screen);
      }
    },
    [closeModal, navigate, toast],
  );

  /* ----- Keyboard navigation inside the open modal ----- */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }
      if (isNoResults) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % FLAT_ITEMS.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (i) => (i - 1 + FLAT_ITEMS.length) % FLAT_ITEMS.length,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = FLAT_ITEMS[selectedIndex];
        if (item) activate(item);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isNoResults, selectedIndex, activate, closeModal]);

  /* ----- Keep the selected row scrolled into view ----- */
  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  /* ----- Top bar / sidebar wiring ----- */
  const handleSearchFocus = useCallback(() => openModal(), [openModal]);
  const handleAIAssistant = () => navigate("ai-support-center");
  const handleCta = () => navigate("ai-support-center");

  return (
    <>
      <AppShell
        variant="ai-support"
        brand={{
          title: "QBIT Hub",
          tagline: "InstalCore Enterprise",
          icon: "smart_toy",
        }}
        navItems={COMMAND_CENTER_NAV}
        activeScreen="universal-search-command-center"
        user={{ name: "Alex Mercer", role: "Lead Engineer", initials: "AM" }}
        cta={{ label: "New Support Case", icon: "add", onClick: handleCta }}
        footerItems={[
          { label: "Settings", icon: "settings", screen: "system-settings" },
          { label: "Help Center", icon: "help", screen: "ai-support-center" },
        ]}
        topBar={{
          title: "Technical Installation Support",
          searchPlaceholder: "Search or command...",
          showSearchKbd: true,
          onSearchFocus: handleSearchFocus,
          navItems: [
            { label: "Status" },
            { label: "Documentation" },
            { label: "Remote Assistance" },
          ],
          user: {
            name: "Alex Mercer",
            role: "Lead Engineer",
            initials: "AM",
          },
          rightExtras: (
            <button
              type="button"
              onClick={handleAIAssistant}
              className="inline-flex items-center gap-1.5 rounded-lg bg-qbit-primary-container px-3 py-1.5 text-xs font-semibold text-qbit-on-primary-container transition-all hover:brightness-110 hover:shadow-sm"
            >
              <Icon name="auto_awesome" className="text-[18px]" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>
          ),
        }}
        mainMaxWidth="max-w-7xl"
      >
        {/* ===================== Background dashboard ===================== */}
        <div className="space-y-8">
          <header className="space-y-1">
            <h1 className="text-[32px] font-bold leading-tight text-qbit-on-surface md:text-[36px] md:leading-[44px]">
              Engineer Dashboard
            </h1>
            <p className="text-base text-qbit-on-surface-variant md:text-lg">
              Welcome back, Rivera. Here&apos;s your active workflow overview.
            </p>
          </header>

          <div className="grid grid-cols-12 gap-6">
            {/* Activity Stream placeholder */}
            <div className="col-span-12 lg:col-span-8">
              <div className="relative flex h-80 flex-col items-center justify-center overflow-hidden rounded-2xl border border-qbit-outline-variant bg-gradient-to-br from-qbit-surface-container-low via-qbit-surface-container to-qbit-surface-container-high p-6 shadow-sm md:h-96">
                <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-qbit-primary/5 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-qbit-secondary/5 blur-2xl" />
                <div className="relative flex flex-col items-center gap-4 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-qbit-primary/10 text-qbit-primary">
                    <Icon name="activity" className="text-[40px]" filled />
                  </div>
                  <p className="text-base font-medium text-qbit-on-surface-variant md:text-lg">
                    Activity Stream Placeholder
                  </p>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="col-span-12 lg:col-span-4">
              <SurfaceCard className="p-6">
                <h3 className="text-lg font-semibold text-qbit-on-surface md:text-xl">
                  System Health
                </h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-qbit-on-surface-variant md:text-base">
                      Cloud Sync
                    </span>
                    <StatusBadge variant="success">Optimal</StatusBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-qbit-on-surface-variant md:text-base">
                      License Server
                    </span>
                    <StatusBadge variant="success">Active</StatusBadge>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>
      </AppShell>

      {/* ===================== Command Center Modal ===================== */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-24 md:pt-32">
          {/* Backdrop */}
          <div
            className="command-palette-backdrop absolute inset-0"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Palette Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Universal search command center"
            className="relative w-full max-w-[720px] overflow-hidden rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest shadow-2xl"
          >
            {/* Search Header */}
            <div className="flex items-center gap-4 border-b border-qbit-outline-variant p-4 focus-within:ring-2 focus-within:ring-qbit-primary/40">
              <Icon
                name="search"
                className="shrink-0 text-[28px] text-qbit-primary"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                aria-label="Command search input"
                className="flex-1 border-none bg-transparent text-xl font-semibold text-qbit-on-surface outline-none placeholder:text-qbit-outline"
              />
              <span className="shrink-0 rounded border border-qbit-outline-variant bg-qbit-surface-container px-2 py-1 text-[11px] font-semibold text-qbit-on-surface-variant shadow-sm">
                ESC
              </span>
            </div>

            {/* Filter Chips */}
            <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto bg-qbit-surface-dim/20 px-4 py-2">
              {filterChips.map((chip) => {
                const active = chip === activeFilter;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setActiveFilter(chip)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-1 text-xs font-semibold transition-all",
                      active
                        ? "bg-qbit-primary text-qbit-on-primary"
                        : "border border-qbit-outline-variant bg-qbit-surface text-qbit-on-surface-variant hover:border-qbit-primary",
                    )}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            {/* Results or Empty State */}
            {isNoResults ? (
              <div className="flex flex-col items-center px-8 py-12 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-qbit-surface-container-low">
                  <Icon
                    name="search_off"
                    className="text-[48px] text-qbit-outline opacity-40"
                  />
                </div>
                <h4 className="text-xl font-semibold text-qbit-on-surface">
                  No results found for &quot;
                  <span className="font-bold">{query}</span>&quot;
                </h4>
                <p className="mt-2 max-w-sm text-base text-qbit-on-surface-variant">
                  Try searching for generic terms like &quot;manual&quot;,
                  &quot;driver&quot;, or product models like &quot;T-800&quot;.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("ai-support-center")}
                    className="rounded-lg bg-qbit-primary px-5 py-2 text-sm font-semibold text-qbit-on-primary transition-all hover:bg-qbit-primary-container"
                  >
                    Contact Support
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("ai-support-center")}
                    className="rounded-lg border border-qbit-outline-variant bg-qbit-surface px-5 py-2 text-sm font-semibold text-qbit-on-surface-variant transition-all hover:border-qbit-primary"
                  >
                    View FAQ
                  </button>
                </div>
              </div>
            ) : (
              <div className="custom-scrollbar max-h-[480px] space-y-4 overflow-y-auto p-2">
                {RESULT_GROUPS.map((group) => (
                  <div key={group.id}>
                    <h3 className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-qbit-primary">
                      {group.label}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const flatIndex = FLAT_ITEMS.findIndex(
                          (f) => f.id === item.id,
                        );
                        const isSelected = flatIndex === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            ref={(el) => {
                              itemRefs.current[flatIndex] = el;
                            }}
                            onClick={() => activate(item)}
                            onMouseEnter={() => setSelectedIndex(flatIndex)}
                            className={cn(
                              "flex w-full items-center gap-4 rounded-xl px-4 py-2.5 text-left transition-colors",
                              isSelected
                                ? "border-l-4 border-qbit-primary bg-qbit-surface-container-low"
                                : "border-l-4 border-transparent hover:bg-qbit-surface-container-low",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                ICON_TONE_CLASS[item.iconTone],
                              )}
                            >
                              <Icon
                                name={item.icon}
                                className="text-[24px]"
                                filled={item.iconTone === "gradient"}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-qbit-on-surface">
                                {item.title}
                              </p>
                              <p className="truncate text-xs text-qbit-on-surface-variant opacity-70">
                                {item.description}
                              </p>
                            </div>
                            {item.rightBadge && (
                              <span className="shrink-0 rounded border border-qbit-outline-variant bg-qbit-surface px-2 py-1 text-[11px] font-semibold text-qbit-outline">
                                {item.rightBadge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Keyboard Hints */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-qbit-outline-variant bg-qbit-surface-container-low px-4 py-2 text-xs text-qbit-on-surface-variant opacity-70">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="rounded border border-qbit-outline-variant bg-qbit-surface px-1.5 py-0.5 text-[10px] font-bold">
                    &#8593;
                  </span>
                  <span className="rounded border border-qbit-outline-variant bg-qbit-surface px-1.5 py-0.5 text-[10px] font-bold">
                    &#8595;
                  </span>
                  <span>to navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="rounded border border-qbit-outline-variant bg-qbit-surface px-1.5 py-0.5 text-[10px] font-bold">
                    Enter
                  </span>
                  <span>to select</span>
                </span>
              </div>
              <div>
                <span className="flex items-center gap-1">
                  <span>Press</span>
                  <span className="rounded border border-qbit-outline-variant bg-qbit-surface px-1.5 py-0.5 text-[10px] font-bold">
                    Esc
                  </span>
                  <span>to close</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
