"use client";

/**
 * HomePage — Admin Dashboard with real database data.
 *
 * All widgets pull from /api/admin/dashboard (aggregated KPIs, resources,
 * activity, announcements). No placeholder data, no hardcoded strings.
 * Auto-refreshes via useEffect on mount.
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { ROLE_LABELS, type Role } from "@/lib/rbac/roles";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface DashboardKpis {
  totalProducts: number;
  activeUsers: number;
  totalDrivers: number;
  totalManuals: number;
  totalFirmware: number;
}

interface ResourceItem {
  id: string;
  name: string;
  type: string;
  version: string | null;
  fileSize: number | null;
  downloadCount: number;
  createdAt: string;
}

interface PinnedItem {
  id: string;
  name: string;
  type: string;
  version: string | null;
  badgeLabel: string | null;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  userName: string;
  action: string;
  entity: string;
  entityName: string;
  icon: string;
  dotColor: string;
  createdAt: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  type: string;
  severity: string;
  createdAt: string;
}

interface BookmarkItem {
  id: string;
  articleId: string;
  bookmarkType: string;
  createdAt: string;
}

interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  badgeLabel: string | null;
  isTrending: boolean;
  updatedAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  driver: "settings_input_component", windows_driver: "desktop_windows",
  firmware: "upgrade", sdk: "code", manual: "description",
  user_manual: "description", utility: "build", tool: "construction",
  video: "play_circle", apk: "phone_android", installer: "package",
};

const TYPE_COLORS: Record<string, string> = {
  driver: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  windows_driver: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  firmware: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  sdk: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  manual: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  user_manual: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  utility: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
  tool: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const DOT_COLORS: Record<string, string> = {
  primary: "bg-primary", secondary: "bg-secondary", error: "bg-destructive", neutral: "bg-muted-foreground",
};

/* ------------------------------------------------------------------ */
/* KPI Card                                                            */
/* ------------------------------------------------------------------ */

function KpiTile({ label, value, icon, color }: {
  label: string; value: number | string; icon: string; color: string;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
  };
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 lg:p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bgMap[color] ?? bgMap.blue}`}>
        <Icon name={icon} className="text-[22px]" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export function HomePage() {
  const { data: session } = useSession();
  const navigate = useNavigation((s) => s.navigate);

  const role = session?.user?.role as Role | undefined;
  const userName = session?.user?.name ?? "Admin";
  const userInitials = userName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const displayRole = role ? ROLE_LABELS[role] : "Admin Access";

  const [kpis, setKpis] = useState<DashboardKpis>({ totalProducts: 0, activeUsers: 0, totalDrivers: 0, totalManuals: 0, totalFirmware: 0 });
  const [newReleases, setNewReleases] = useState<ResourceItem[]>([]);
  const [popularDownloads, setPopularDownloads] = useState<ResourceItem[]>([]);
  const [pinnedResources, setPinnedResources] = useState<PinnedItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) return;
      const data = await res.json();
      setKpis(data.kpis ?? { totalProducts: 0, activeUsers: 0, totalDrivers: 0, totalManuals: 0, totalFirmware: 0 });
      setNewReleases(data.newReleases ?? []);
      setPopularDownloads(data.popularDownloads ?? []);
      setPinnedResources(data.pinnedResources ?? []);
      setBookmarks(data.bookmarks ?? []);
      setRecentActivity(data.recentActivity ?? []);
      setAnnouncements(data.announcements ?? []);
      setFeaturedProducts(data.featuredProducts ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Control Center", icon: "bolt" }}
      navItems={ADMIN_NAV}
      activeScreen="home"
      user={{ name: userName, role: displayRole, initials: userInitials }}
      topBar={{
        title: "QBIT Hub Admin",
        searchPlaceholder: "Global search...",
        user: { name: userName, role: displayRole, initials: userInitials },
      }}
    >
      <div className="flex flex-col gap-6">
        {/* 1. Welcome Hero */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              {greeting}, {userName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enterprise control center — manage products, resources, users, and settings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <QbitButton variant="primary" icon="add" onClick={() => navigate("product-master")}>Add Product</QbitButton>
            <QbitButton variant="outline" icon="upload" onClick={() => navigate("upload-resource-center")}>Upload Resource</QbitButton>
          </div>
        </div>

        {/* 2. KPI Grid */}
        <section aria-label="Key metrics">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            <KpiTile label="Products" value={kpis.totalProducts} icon="inventory_2" color="blue" />
            <KpiTile label="Active Users" value={kpis.activeUsers} icon="group" color="green" />
            <KpiTile label="Drivers" value={kpis.totalDrivers} icon="settings_input_component" color="amber" />
            <KpiTile label="Manuals" value={kpis.totalManuals} icon="menu_book" color="purple" />
            <KpiTile label="Firmware" value={kpis.totalFirmware} icon="upgrade" color="teal" />
          </div>
        </section>

        {/* 3. Main 3-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Quick Access */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">Quick Access</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Product Master", icon: "inventory_2", screen: "product-master" as ScreenId, desc: "Manage all products" },
                  { label: "Upload Resource", icon: "cloud_upload", screen: "upload-resource-center" as ScreenId, desc: "Upload drivers, manuals" },
                  { label: "Users & Roles", icon: "group", screen: "user-role-management" as ScreenId, desc: "Manage access" },
                  { label: "Announcements", icon: "campaign", screen: "admin-dashboard" as ScreenId, desc: "System announcements" },
                ].map(item => (
                  <button key={item.label} type="button" onClick={() => navigate(item.screen)}
                    className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon name={item.icon} className="text-[20px]" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Featured Products / New Releases */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">New Releases</h2>
                <button type="button" onClick={() => navigate("resource-library")} className="text-sm font-semibold text-primary hover:underline">View All</button>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
              ) : newReleases.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Icon name="cloud_off" className="text-[40px] text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No new releases yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {newReleases.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TYPE_COLORS[item.type] ?? TYPE_COLORS.utility}`}>
                        <Icon name={TYPE_ICONS[item.type] ?? "insert_drive_file"} className="text-[20px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{item.type.replace(/_/g, " ")}</span>
                          {item.version && <span>v{item.version}</span>}
                          <span>{formatBytes(item.fileSize)}</span>
                          <span>{timeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                      <QbitButton variant="outline" size="sm" icon="download"
                        onClick={() => window.open(`/api/admin/resources/${item.id}?download=true`, "_blank")}>
                        Download
                      </QbitButton>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Popular Downloads */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Popular Downloads</h2>
                <button type="button" onClick={() => navigate("driver-download-center")} className="text-sm font-semibold text-primary hover:underline">View All</button>
              </div>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
              ) : popularDownloads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Icon name="trending_down" className="text-[40px] text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No downloads tracked yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {popularDownloads.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TYPE_COLORS[item.type] ?? TYPE_COLORS.utility}`}>
                        <Icon name={TYPE_ICONS[item.type] ?? "insert_drive_file"} className="text-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{item.type.replace(/_/g, " ")}</span>
                          <span>{item.downloadCount.toLocaleString()} downloads</span>
                        </div>
                      </div>
                      <QbitButton variant="outline" size="sm" icon="download"
                        onClick={() => window.open(`/api/admin/resources/${item.id}?download=true`, "_blank")}>
                        Get
                      </QbitButton>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right 1/3 */}
          <div className="flex flex-col gap-6">
            {/* Pinned Resources */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">Pinned Resources</h2>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}</div>
              ) : pinnedResources.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <Icon name="push_pin" className="text-[32px] text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No pinned resources</p>
                  <p className="text-xs text-muted-foreground mt-1">Mark resources as featured to pin them here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pinnedResources.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                      <Icon name={TYPE_ICONS[item.type] ?? "insert_drive_file"} className="text-[18px] text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.type.replace(/_/g, " ")}</p>
                      </div>
                      {item.badgeLabel && (
                        <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">{item.badgeLabel}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Bookmarks */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">Bookmarks</h2>
              {loading ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
              ) : bookmarks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <Icon name="bookmark" className="text-[32px] text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No bookmarks yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map(item => (
                    <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <Icon name="bookmark" className="text-[16px] text-primary shrink-0" />
                      <span className="text-sm text-foreground truncate">{item.articleId}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{item.bookmarkType}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Announcements */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">Announcements</h2>
              {loading ? (
                <div className="space-y-2">{[1].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
              ) : announcements.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <Icon name="campaign" className="text-[32px] text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No announcements</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {announcements.map(item => (
                    <div key={item.id} className={`rounded-lg border p-3 ${
                      item.severity === "critical" ? "border-red-200 bg-red-50/50 dark:bg-red-950/30" :
                      item.severity === "warning" ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/30" :
                      "border-border bg-card"
                    }`}>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* 4. Recent Activity */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">Recent Activity</h2>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
          ) : recentActivity.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Icon name="history" className="text-[40px] text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="space-y-3">
                {recentActivity.slice(0, 8).map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${DOT_COLORS[item.dotColor] ?? DOT_COLORS.neutral}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{item.userName}</span>{" "}
                        <span className="text-muted-foreground">{item.action} {item.entityName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
