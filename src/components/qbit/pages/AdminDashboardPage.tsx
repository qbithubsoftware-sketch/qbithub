"use client";

/**
 * AdminDashboardPage — Admin Control Center with real database data.
 *
 * All KPIs, charts, uploads, and activity come from /api/admin/dashboard.
 * No hardcoded mock data. Uses real session for user identity.
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, type TooltipProps } from "recharts";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { ProgressTracker } from "@/components/qbit/primitives/ProgressTracker";
import { useNavigation } from "@/lib/navigation/store";
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
  id: string; name: string; type: string; version: string | null;
  size: number | null; downloadCount: number; createdAt: string;
}

interface ActivityItem {
  id: string; userName: string; action: string; entity: string;
  entityName: string; icon: string; dotColor: string; createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TYPE_ICONS: Record<string, string> = {
  driver: "settings_input_component", windows_driver: "desktop_windows",
  firmware: "upgrade", sdk: "code", manual: "description",
  user_manual: "description", utility: "build", tool: "construction",
};

const DOT_COLOR_CLASS: Record<string, string> = {
  primary: "bg-qbit-primary", secondary: "bg-qbit-secondary-container", error: "bg-qbit-error", neutral: "bg-qbit-outline-variant",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function DownloadTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-lowest px-4 py-3 shadow-xl">
      <p className="text-sm font-bold text-qbit-on-surface">{label}</p>
      <p className="text-xs font-medium text-qbit-primary">{payload[0]?.value?.toLocaleString()} downloads</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function AdminDashboardPage() {
  const { data: session } = useSession();
  const navigate = useNavigation((s) => s.navigate);

  const role = session?.user?.role as Role | undefined;
  const userName = session?.user?.name ?? "Admin";
  const userInitials = userName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const displayRole = role ? ROLE_LABELS[role] : "Administrator";

  const [kpis, setKpis] = useState<DashboardKpis>({ totalProducts: 0, activeUsers: 0, totalDrivers: 0, totalManuals: 0, totalFirmware: 0 });
  const [recentUploads, setRecentUploads] = useState<ResourceItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityItem[]>([]);
  const [downloadTrends, setDownloadTrends] = useState<{ month: string; downloads: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) return;
      const data = await res.json();
      setKpis(data.kpis ?? { totalProducts: 0, activeUsers: 0, totalDrivers: 0, totalManuals: 0, totalFirmware: 0 });
      setRecentUploads(data.newReleases ?? []);
      setActivityLogs(data.recentActivity ?? []);
      setDownloadTrends(data.downloadTrends ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Control Center", icon: "bolt" }}
      navItems={ADMIN_NAV}
      activeScreen="admin-dashboard"
      user={{ name: userName, role: displayRole, initials: userInitials }}
      topBar={{
        searchPlaceholder: "Global search commands...",
        user: { name: userName, role: displayRole, initials: userInitials },
      }}
    >
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between lg:gap-8">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface md:text-3xl">
              Admin Control Center
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-qbit-on-surface-variant md:text-base">
              Manage products, drivers, manuals, videos, users and application settings.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <QbitButton variant="surface" size="md" icon="person_add" onClick={() => navigate("user-role-management")}>
              Invite User
            </QbitButton>
            <QbitButton variant="primary-container" size="md" icon="upload" onClick={() => navigate("upload-resource-center")}>
              Upload Resource
            </QbitButton>
            <QbitButton variant="primary" size="md" icon="add" onClick={() => navigate("product-master")}>
              Add Product
            </QbitButton>
          </div>
        </section>

        {/* KPI Grid — real data from API */}
        <section aria-label="Key performance indicators">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
            <KpiCard label="Total Products" value={kpis.totalProducts.toString()} icon="inventory_2" delta="Live" deltaVariant="neutral" iconBg="bg-qbit-primary/10 text-qbit-primary" />
            <KpiCard label="Active Users" value={kpis.activeUsers.toString()} icon="group" delta="Live" deltaVariant="neutral" iconBg="bg-qbit-secondary-container/30 text-qbit-secondary" />
            <KpiCard label="Drivers" value={kpis.totalDrivers.toString()} icon="settings_input_component" delta="Live" deltaVariant="neutral" iconBg="bg-qbit-tertiary-container/30 text-qbit-tertiary" />
            <KpiCard label="Manuals" value={kpis.totalManuals.toString()} icon="menu_book" delta="Live" deltaVariant="neutral" />
            <KpiCard label="Firmware" value={kpis.totalFirmware.toString()} icon="upgrade" delta="Live" deltaVariant="neutral" iconBg="bg-teal-50 text-teal-600" />
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            {/* Download Trends chart */}
            <SurfaceCard className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-qbit-outline-variant px-5 py-4 md:px-6">
                <h3 className="text-lg font-semibold text-qbit-on-surface">Download Trends</h3>
              </div>
              <div className="h-[280px] w-full bg-qbit-surface-container-lowest/60 px-3 py-4 md:px-5">
                {downloadTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={downloadTrends} margin={{ top: 10, right: 8, bottom: 4, left: -16 }} barGap={6} barCategoryGap="22%">
                      <CartesianGrid vertical={false} stroke="#c3c5d9" strokeDasharray="3 3" strokeOpacity={0.45} />
                      <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "#c3c5d9", strokeOpacity: 0.6 }} tick={{ fill: "#434656", fontSize: 12, fontWeight: 500 }} />
                      <YAxis tickLine={false} axisLine={false} width={48} tick={{ fill: "#434656", fontSize: 12 }} />
                      <Tooltip cursor={{ fill: "rgba(0,67,200,0.06)" }} content={<DownloadTooltip />} />
                      <Bar dataKey="downloads" fill="#0043c8" radius={[6, 6, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-qbit-on-surface-variant">No download data yet — chart will populate when downloads are tracked</p>
                  </div>
                )}
              </div>
            </SurfaceCard>

            {/* Recent Uploads table */}
            <SurfaceCard className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-qbit-outline-variant px-5 py-4 md:px-6">
                <h3 className="text-lg font-semibold text-qbit-on-surface">Recent Uploads</h3>
                <button type="button" onClick={() => navigate("resource-library")} className="text-sm font-semibold text-qbit-primary transition-colors hover:underline">View all resources</button>
              </div>
              <div className="max-h-[420px] overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed text-left">
                  <thead className="bg-qbit-surface-container-low">
                    <tr>
                      <th className="w-[80px] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-qbit-outline md:px-6">Icon</th>
                      <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-qbit-outline">Name</th>
                      <th className="w-[140px] px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-qbit-outline">Type</th>
                      <th className="w-[140px] px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-qbit-outline">Downloads</th>
                      <th className="w-[140px] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-qbit-outline md:px-6">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-qbit-outline-variant">
                    {recentUploads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-qbit-on-surface-variant">
                          No resources uploaded yet
                        </td>
                      </tr>
                    ) : (
                      recentUploads.slice(0, 6).map(row => (
                        <tr key={row.id} className="cursor-pointer transition-colors hover:bg-qbit-surface-container-high">
                          <td className="px-5 py-3 md:px-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                              <Icon name={TYPE_ICONS[row.type] ?? "insert_drive_file"} className="text-[18px]" />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm font-semibold text-qbit-on-surface">{row.name}</td>
                          <td className="px-3 py-3 text-sm font-medium text-qbit-on-surface-variant capitalize">{row.type.replace(/_/g, " ")}</td>
                          <td className="px-3 py-3">
                            <StatusBadge variant={row.downloadCount > 0 ? "primary" : "neutral"} dot>
                              {row.downloadCount.toLocaleString()}
                            </StatusBadge>
                          </td>
                          <td className="px-5 py-3 text-sm text-qbit-on-surface-variant md:px-6">{timeAgo(row.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          </div>

          {/* Right: Activity Logs */}
          <div className="lg:col-span-4">
            <SurfaceCard className="flex h-full flex-col overflow-hidden">
              <div className="sticky top-0 flex items-center justify-between border-b border-qbit-outline-variant bg-qbit-surface-container-lowest px-5 py-4 md:px-6">
                <h3 className="text-lg font-semibold text-qbit-on-surface">Activity Logs</h3>
              </div>
              <div className="custom-scrollbar max-h-[640px] flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6">
                {activityLogs.length === 0 ? (
                  <p className="text-sm text-qbit-on-surface-variant text-center py-8">No activity yet</p>
                ) : (
                  activityLogs.slice(0, 8).map(entry => (
                    <div key={entry.id} className="relative border-l-2 border-qbit-outline-variant pl-6">
                      <span className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-qbit-background ${DOT_COLOR_CLASS[entry.dotColor] ?? DOT_COLOR_CLASS.neutral}`} />
                      <p className="mb-1 text-sm leading-snug">
                        <span className="font-bold text-qbit-on-surface">{entry.userName}</span>{" "}
                        <span className="text-qbit-on-surface-variant">{entry.action} {entry.entityName}</span>
                      </p>
                      <span className="text-xs text-qbit-outline">{timeAgo(entry.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
