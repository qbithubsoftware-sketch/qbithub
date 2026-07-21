"use client";

import { useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { TimelineStep } from "@/components/qbit/primitives/TimelineStep";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";
import { ENGINEER_NAV, ENGINEER_FOOTER } from "@/lib/navigation/nav-config";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface QuickAction {
  label: string;
  icon: string;
  screen: ScreenId;
}

interface PinnedResource {
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  icon: string;
  gradient: string;
}

interface Announcement {
  icon: string;
  label: string;
  message: string;
  highlighted: boolean;
}

/* ------------------------------------------------------------------ */
/* Static data — exact copy from dashboard_qbit_hub design HTML       */
/* ------------------------------------------------------------------ */

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Browse Products", icon: "grid_view", screen: "product-library" },
  { label: "Download Drivers", icon: "cloud_download", screen: "driver-download-center" },
  { label: "Installation Guides", icon: "fact_check", screen: "installation-center" },
  { label: "Watch Videos", icon: "video_library", screen: "video-training-center" },
];

const PINNED_RESOURCES: PinnedResource[] = [
  {
    title: "Windows POS Setup Guide",
    subtitle: "Complete deployment workflow v4.2",
    badge: "Popular",
    badgeClass: "bg-qbit-primary text-qbit-on-primary",
    icon: "desktop_windows",
    gradient: "from-qbit-primary to-qbit-secondary",
  },
  {
    title: "Thermal Printer Driver",
    subtitle: "Unified Windows/Linux Package",
    badge: "Driver",
    badgeClass: "bg-qbit-secondary text-qbit-on-secondary",
    icon: "print",
    gradient: "from-qbit-secondary to-qbit-primary-container",
  },
  {
    title: "Barcode Scanner Manual",
    subtitle: "Configuration & Troubleshooting",
    badge: "Manual",
    badgeClass: "bg-qbit-tertiary text-qbit-on-tertiary",
    icon: "barcode_scanner",
    gradient: "from-qbit-tertiary to-qbit-tertiary-container",
  },
  {
    title: "Android POS Installation",
    subtitle: "GMS & App Store Configuration",
    badge: "Android",
    badgeClass: "bg-qbit-primary text-qbit-on-primary",
    icon: "phone_android",
    gradient: "from-qbit-primary-container to-qbit-secondary-container",
  },
];

const TRENDING_TAGS = ["V3 POS Firmware", "Printer SDK 2.4", "Android Integration"];

const ANNOUNCEMENTS: Announcement[] = [
  {
    icon: "campaign",
    label: "System Notice",
    message: "Scheduled maintenance on Nov 24, 02:00 GMT.",
    highlighted: true,
  },
  {
    icon: "new_releases",
    label: "Firmware",
    message: "Global rollout of Firmware 4.0 for all Retail Units.",
    highlighted: false,
  },
  {
    icon: "info",
    label: "Knowledge Base",
    message: "New security protocols for data encryption added.",
    highlighted: false,
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export function EngineerDashboardPage() {
  const navigate = useNavigation((s) => s.navigate);
  const [hubQuery, setHubQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hubQuery.trim()) {
      navigate("universal-search-command-center", { q: hubQuery.trim() });
    }
  };

  return (
    <AppShell
      variant="engineer"
      brand={{ title: "QBIT Hub", tagline: "Enterprise SaaS", icon: "dataset" }}
      navItems={ENGINEER_NAV}
      footerItems={ENGINEER_FOOTER}
      activeScreen="engineer-dashboard"
      user={{ name: "Alex Chen", role: "Installation Engineer", initials: "AC" }}
      topBar={{
        searchPlaceholder: "Search resources...",
        user: { name: "Alex Chen", role: "Installation Engineer", initials: "AC" },
      }}
    >
      <div className="space-y-6 lg:space-y-8">
        {/* -------------------------------------------------------------- */}
        {/* 1. Welcome Banner with Hero Search                            */}
        {/* -------------------------------------------------------------- */}
        <section
          aria-labelledby="welcome-heading"
          className="relative overflow-hidden rounded-2xl border border-qbit-outline-variant/60 bg-gradient-to-br from-qbit-primary-fixed via-qbit-surface-container-lowest to-qbit-surface-container-low px-6 py-10 md:px-12 md:py-14"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-qbit-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-qbit-secondary/10 blur-3xl" />

          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            <h2
              id="welcome-heading"
              className="text-3xl font-bold tracking-tight text-qbit-primary md:text-4xl"
            >
              Welcome back, Installation Engineer
            </h2>
            <p className="mt-2 max-w-2xl text-base text-qbit-on-surface-variant md:text-lg">
              Access all enterprise deployment tools, drivers, and technical manuals from your central command center.
            </p>

            <form onSubmit={handleSearchSubmit} className="mt-8 w-full">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-qbit-primary/15 blur-2xl" />
                <div className="flex items-center gap-2 rounded-2xl border border-qbit-outline-variant bg-white p-1.5 shadow-xl">
                  <Icon name="search" className="ml-3 text-[24px] text-qbit-primary" />
                  <input
                    type="text"
                    value={hubQuery}
                    onChange={(e) => setHubQuery(e.target.value)}
                    placeholder="Search products, drivers, videos, manuals..."
                    aria-label="Search the QBIT Hub"
                    className="flex-1 border-0 bg-transparent px-2 py-3 text-base text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 focus:outline-none focus:ring-0"
                  />
                  <QbitButton type="submit" size="lg" className="mr-1">
                    Search Hub
                  </QbitButton>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  Trending
                </span>
                {TRENDING_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => navigate("universal-search-command-center", { q: tag })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-qbit-outline-variant bg-white/70 px-3 py-1 text-xs font-medium text-qbit-primary transition-colors hover:bg-qbit-primary hover:text-qbit-on-primary"
                  >
                    <Icon name="trending_up" className="text-[12px]" />
                    {tag}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* 2. Summary Cards (6-col bento, glass-card)                    */}
        {/* -------------------------------------------------------------- */}
        <section aria-label="Resource summary">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard
              label="Total Products"
              value="1,248"
              icon="inventory_2"
              iconBg="bg-qbit-primary/10 text-qbit-primary"
            />
            <KpiCard
              label="Drivers"
              value="432"
              icon="settings_input_component"
              iconBg="bg-qbit-secondary/10 text-qbit-secondary"
            />
            <KpiCard
              label="Guides"
              value="156"
              icon="menu_book"
              iconBg="bg-qbit-tertiary/10 text-qbit-tertiary"
            />
            <KpiCard
              label="Videos"
              value="84"
              icon="play_circle"
              iconBg="bg-qbit-primary/10 text-qbit-primary"
            />
            <KpiCard
              label="Articles"
              value="3.2k"
              icon="library_books"
              iconBg="bg-qbit-secondary/10 text-qbit-secondary"
            />
            <KpiCard
              label="Latest Updates"
              value="12"
              icon="update"
              iconBg="bg-qbit-tertiary/10 text-qbit-tertiary"
            />
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* 12-col bento grid: left span-8 (Quick Actions + Pinned)       */}
        {/*                    right span-4 (Recent Activity)             */}
        {/* -------------------------------------------------------------- */}
        <div className="bento-grid">
          {/* Left column: Quick Actions + Pinned Resources */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* 3. Quick Actions */}
            <SurfaceCard className="p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-qbit-on-surface">Quick Actions</h3>
                <button
                  type="button"
                  onClick={() => navigate("product-library")}
                  className="text-sm font-semibold text-qbit-primary hover:underline"
                >
                  Manage All
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => navigate(action.screen)}
                    className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-qbit-surface-container-low p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-qbit-primary-container hover:text-qbit-on-primary-container md:p-6"
                  >
                    <Icon
                      name={action.icon}
                      className="text-[28px] transition-transform group-hover:scale-110 md:text-[32px]"
                    />
                    <span className="text-sm font-semibold">{action.label}</span>
                  </button>
                ))}
              </div>
            </SurfaceCard>

            {/* 4. Pinned Resources */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-qbit-on-surface">Pinned Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {PINNED_RESOURCES.map((resource) => (
                  <button
                    key={resource.title}
                    type="button"
                    onClick={() => navigate("product-library")}
                    className="group relative h-48 overflow-hidden rounded-xl border border-qbit-outline-variant text-left transition-transform hover:-translate-y-0.5"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${resource.gradient} transition-transform duration-500 group-hover:scale-105`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute right-4 top-4 opacity-25 transition-opacity group-hover:opacity-40">
                      <Icon name={resource.icon} className="text-[80px] text-white" filled />
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-5">
                      <span
                        className={`mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${resource.badgeClass}`}
                      >
                        {resource.badge}
                      </span>
                      <h4 className="text-lg font-semibold text-white">{resource.title}</h4>
                      <p className="text-sm font-medium text-white/70">{resource.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Recent Activity */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <SurfaceCard className="p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-qbit-on-surface">Recent Activity</h3>
                <button
                  type="button"
                  onClick={() => navigate("engineer-dashboard")}
                  className="text-sm font-semibold text-qbit-primary hover:underline"
                >
                  View History
                </button>
              </div>
              <div>
                <TimelineStep
                  icon="download"
                  title="Driver Updated: QBIT T-800"
                  description="Version 2.4.1 stable released for Win11."
                  status="completed"
                  meta="2 hours ago"
                />
                <TimelineStep
                  icon="description"
                  title="Manual Revised: Android Kiosk"
                  description="Updated security section for API Level 34."
                  status="completed"
                  meta="5 hours ago"
                />
                <TimelineStep
                  icon="inventory"
                  title="Product Added: HUB-X Pro"
                  description="New enterprise hub series now in catalog."
                  status="completed"
                  meta="Yesterday"
                />
                <TimelineStep
                  icon="play_circle"
                  title="Video Uploaded: Fiber Cabling"
                  description="Advanced installation tutorial for sites."
                  status="completed"
                  meta="2 days ago"
                  isLast
                />
              </div>
            </SurfaceCard>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* 6. Announcements (full-width)                                  */}
        {/* -------------------------------------------------------------- */}
        <section aria-labelledby="announcements-heading">
          <SurfaceCard className="p-5 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                <Icon name="campaign" className="text-[20px]" filled />
              </div>
              <h3 id="announcements-heading" className="text-lg font-semibold text-qbit-on-surface">
                Announcements
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {ANNOUNCEMENTS.map((a) => (
                <div
                  key={a.label}
                  className={
                    a.highlighted
                      ? "rounded-xl border border-qbit-primary/20 bg-qbit-primary-fixed/40 p-4"
                      : "rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low p-4"
                  }
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon
                      name={a.icon}
                      className={
                        a.highlighted
                          ? "text-[18px] text-qbit-primary"
                          : "text-[18px] text-qbit-on-surface-variant"
                      }
                      filled={a.highlighted}
                    />
                    <span
                      className={
                        "text-xs font-semibold uppercase tracking-tight " +
                        (a.highlighted ? "text-qbit-primary" : "text-qbit-on-surface-variant")
                      }
                    >
                      {a.label}
                    </span>
                  </div>
                  <p
                    className={
                      "text-sm " +
                      (a.highlighted
                        ? "font-medium text-qbit-on-surface"
                        : "text-qbit-on-surface-variant")
                    }
                  >
                    {a.message}
                  </p>
                </div>
              ))}
            </div>

            <QbitButton
              variant="outline"
              fullWidth
              className="mt-5"
              iconRight="arrow_forward"
              onClick={() => navigate("support-tickets")}
            >
              Check All Updates
            </QbitButton>
          </SurfaceCard>
        </section>
      </div>
    </AppShell>
  );
}
