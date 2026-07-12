"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/lib/navigation/store";
import { ENGINEER_NAV, ENGINEER_FOOTER } from "@/lib/navigation/nav-config";

import {
  DownloadHero,
  SearchFilters,
  DownloadCard,
  DownloadDrawer,
  DownloadHistory,
  FavoriteDownloads,
  ManualsSection,
  SDKUtilitiesSection,
  PDFPreview,
} from "@/components/qbit/downloads";
import type { DownloadItem, DownloadFilters, ManualItem } from "@/lib/downloads/types";
import {
  DOWNLOADS,
  FEATURED_CARDS,
  DOWNLOAD_HISTORY,
  MOST_DOWNLOADED,
  MANUALS,
} from "@/lib/downloads/placeholder-data";

/**
 * Driver Download Center page.
 *
 * Composed entirely of reusable download-center components.  All state
 * (filters, favorites, selected download, PDF preview) lives here; the
 * child components are pure / controlled.
 */
export function DriverDownloadCenterPage() {
  const { toast } = useToast();
  const { data: session } = useSession();

  // ---- Filter state ----
  const [filters, setFilters] = useState<DownloadFilters>({
    query: "",
    osSlug: "all",
    categorySlug: "all",
    productCategory: "All Products",
    releaseYear: 2024,
    latestOnly: false,
    sortBy: "newest",
  });

  // ---- Drawer + PDF preview state ----
  const [selectedDownload, setSelectedDownload] = useState<DownloadItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pdfManual, setPdfManual] = useState<ManualItem | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // ---- Favorites ----
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // ---- Filter + sort logic ----
  const filteredDownloads = useMemo(() => {
    let result = DOWNLOADS.filter((d) => {
      // Text search
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const matches =
          d.name.toLowerCase().includes(q) ||
          d.version.toLowerCase().includes(q) ||
          d.category.name.toLowerCase().includes(q) ||
          d.operatingSystems.some((os) => os.name.toLowerCase().includes(q)) ||
          (d.supportedProducts?.some((p) => p.toLowerCase().includes(q)) ?? false);
        if (!matches) return false;
      }
      // OS filter
      if (filters.osSlug !== "all") {
        if (!d.operatingSystems.some((os) => os.slug === filters.osSlug)) return false;
      }
      // Category filter
      if (filters.categorySlug !== "all") {
        if (d.category.slug !== filters.categorySlug) return false;
      }
      // Latest-only filter
      if (filters.latestOnly && !d.latest) return false;
      // Release year filter
      if (filters.releaseYear < 2024) {
        const year = new Date(d.releaseDate).getFullYear();
        if (year < filters.releaseYear) return false;
      }
      // Visibility filter — internal downloads only visible to authenticated users
      if (d.visibility === "internal" && !session?.user) return false;
      if (d.visibility === "restricted") return false; // never show restricted in the list
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      if (filters.sortBy === "newest") {
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      }
      if (filters.sortBy === "popular") {
        return b.downloadCount - a.downloadCount;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [filters, session]);

  // ---- SDK + Utility sub-lists ----
  const sdkDownloads = useMemo(
    () => filteredDownloads.filter((d) => d.category.slug === "sdk"),
    [filteredDownloads],
  );
  const utilityDownloads = useMemo(
    () => filteredDownloads.filter((d) => d.category.slug === "utility"),
    [filteredDownloads],
  );
  const driverFirmwareDownloads = useMemo(
    () => filteredDownloads.filter((d) => d.category.slug === "driver" || d.category.slug === "firmware"),
    [filteredDownloads],
  );
  const favoriteDownloads = useMemo(
    () => DOWNLOADS.filter((d) => favoriteIds.has(d.id)),
    [favoriteIds],
  );

  // ---- Handlers ----
  const handleFilterChange = useCallback((patch: Partial<DownloadFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleDownload = useCallback(
    (download: DownloadItem) => {
      // Visibility check
      if (download.visibility === "internal" && !session?.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to download this internal file.",
          variant: "destructive",
        });
        return;
      }
      if (download.visibility === "restricted") {
        toast({
          title: "Access denied",
          description: "This download requires elevated permissions.",
          variant: "destructive",
        });
        return;
      }
      // Trigger secure download via API
      toast({
        title: "Download started",
        description: `${download.name} ${download.version} (${download.fileSize})`,
      });
      // In production: window.location.href = `/api/downloads/${download.id}`;
    },
    [session, toast],
  );

  const handleViewDetails = useCallback((download: DownloadItem) => {
    setSelectedDownload(download);
    setDrawerOpen(true);
  }, []);

  const handleFavorite = useCallback(
    (download: DownloadItem) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(download.id)) {
          next.delete(download.id);
          toast({ title: "Removed from favorites", description: download.name });
        } else {
          next.add(download.id);
          toast({ title: "Added to favorites", description: download.name });
        }
        return next;
      });
    },
    [toast],
  );

  const handleOpenPdf = useCallback((manual: ManualItem) => {
    setPdfManual(manual);
    setPdfOpen(true);
  }, []);

  const handleDownloadManual = useCallback(
    (manual: ManualItem) => {
      toast({
        title: "Downloading PDF",
        description: `${manual.title} (${manual.fileSize})`,
      });
    },
    [toast],
  );

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
        {/* ===== Hero (full-width) ===== */}
        <DownloadHero filters={filters} onChange={handleFilterChange} />

        {/* ===== 3-col layout: filter sidebar + driver list + right sidebar ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left filter sidebar */}
          <aside className="lg:col-span-3">
            <SearchFilters
              filters={filters}
              onChange={handleFilterChange}
              resultCount={filteredDownloads.length}
            />
          </aside>

          {/* Center driver list */}
          <div className="lg:col-span-6 space-y-4">
            {/* Stats + Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-sm text-qbit-on-surface-variant">
                Showing{" "}
                <strong className="text-qbit-on-surface">{filteredDownloads.length}</strong>{" "}
                downloads for &quot;{filters.productCategory}&quot;
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-qbit-on-surface-variant uppercase tracking-wider">
                  Sort By:
                </span>
                <Select
                  value={filters.sortBy}
                  onValueChange={(v) => handleFilterChange({ sortBy: v as DownloadFilters["sortBy"] })}
                >
                  <SelectTrigger className="h-auto bg-transparent border-none shadow-none px-1 text-qbit-primary text-sm font-medium cursor-pointer focus:ring-0">
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

            {/* Driver + Firmware cards */}
            {driverFirmwareDownloads.length === 0 ? (
              <EmptyDownloadState onClear={() => handleFilterChange({ query: "", osSlug: "all", categorySlug: "all", latestOnly: false })} />
            ) : (
              driverFirmwareDownloads.map((d) => (
                <DownloadCard
                  key={d.id}
                  download={d}
                  onDownload={handleDownload}
                  onViewDetails={handleViewDetails}
                  onFavorite={handleFavorite}
                  onShare={(dl) => {
                    toast({ title: "Share link copied", description: dl.name });
                  }}
                  isFavorite={favoriteIds.has(d.id)}
                />
              ))
            )}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low transition-colors"
                aria-label="Previous page"
              >
                <Icon name="chevron_left" className="text-[20px]" />
              </button>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                    n === 1
                      ? "bg-qbit-primary text-qbit-on-primary"
                      : "border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low",
                  )}
                >
                  {n}
                </button>
              ))}
              <span className="px-1 text-qbit-on-surface-variant">...</span>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low transition-colors"
              >
                12
              </button>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low transition-colors"
                aria-label="Next page"
              >
                <Icon name="chevron_right" className="text-[20px]" />
              </button>
            </div>
          </div>

          {/* Right sidebar — Download history + Support CTA */}
          <aside className="lg:col-span-3 space-y-4">
            <DownloadHistory
              recent={DOWNLOAD_HISTORY}
              mostDownloaded={MOST_DOWNLOADED}
              favorites={favoriteDownloads}
              onDownload={handleDownload}
              onRemoveFavorite={handleFavorite}
            />

            {/* CTA card */}
            <div className="rounded-xl overflow-hidden shadow-md relative h-64 border border-qbit-outline-variant bg-gradient-to-br from-qbit-primary via-qbit-secondary to-qbit-primary-container flex flex-col justify-end p-5">
              <Icon
                name="support_agent"
                filled
                className="absolute top-4 right-4 text-[64px] text-white/15 pointer-events-none"
              />
              <div className="relative z-10">
                <h5 className="text-white text-[20px] font-semibold mb-1">
                  Need Hardware Support?
                </h5>
                <p className="text-white/85 text-sm mb-3">
                  Our enterprise support team is available 24/7 for remote assistance.
                </p>
                <button
                  type="button"
                  onClick={() => useNavigation.getState().navigate("ai-support-center")}
                  className="inline-flex items-center gap-2 text-white text-sm font-medium group"
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
        </div>

        {/* ===== Featured bento ===== */}
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
                <span className="text-xs font-semibold block mb-2 opacity-90">{card.label}</span>
                <h3 className="text-[20px] font-semibold mb-1">{card.title}</h3>
                <p className={cn("text-sm mb-4", card.muted)}>{card.description}</p>
                <button
                  type="button"
                  onClick={() => {
                    const dl = DOWNLOADS.find((d) => d.id === card.downloadId);
                    if (dl) handleDownload(dl);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  {card.ctaLabel}
                  <Icon name="arrow_forward" className="text-[16px]" />
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* ===== SDK + Utilities ===== */}
        <SDKUtilitiesSection
          sdks={sdkDownloads}
          utilities={utilityDownloads}
          onDownload={handleDownload}
          onViewDetails={handleViewDetails}
          onFavorite={handleFavorite}
          favoriteIds={Array.from(favoriteIds)}
        />

        {/* ===== Manuals ===== */}
        <ManualsSection
          manuals={MANUALS}
          onOpenPdf={handleOpenPdf}
          onDownload={handleDownloadManual}
        />

        {/* ===== Favorite Downloads (full-width) ===== */}
        <FavoriteDownloads
          favorites={favoriteDownloads}
          onDownload={handleDownload}
          onRemoveFavorite={handleFavorite}
        />
      </div>

      {/* ===== Download details drawer ===== */}
      <DownloadDrawer
        download={selectedDownload}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onDownload={(dl) => {
          handleDownload(dl);
          setDrawerOpen(false);
        }}
      />

      {/* ===== PDF preview modal ===== */}
      <PDFPreview
        manual={pdfManual}
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        onDownload={(m) => {
          handleDownloadManual(m);
        }}
      />
    </AppShell>
  );
}

// ---------------------------------------------------------------------
// Helper sub-components
// ---------------------------------------------------------------------

/** Empty state shown when no downloads match the filters. */
function EmptyDownloadState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-qbit-outline-variant bg-qbit-surface-container-lowest p-12 text-center">
      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-qbit-surface-container-high text-qbit-on-surface-variant mb-4">
        <Icon name="search_off" className="text-[32px]" />
      </div>
      <p className="text-base font-semibold text-qbit-on-surface">No downloads found</p>
      <p className="text-sm text-qbit-on-surface-variant mt-1 max-w-sm mx-auto">
        Try adjusting your search query or clearing some filters to see more results.
      </p>
      <button
        onClick={onClear}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-qbit-primary border border-qbit-primary/20 rounded-lg hover:bg-qbit-primary/5 transition-colors"
      >
        <Icon name="refresh" className="text-[18px]" />
        Reset all filters
      </button>
    </div>
  );
}
