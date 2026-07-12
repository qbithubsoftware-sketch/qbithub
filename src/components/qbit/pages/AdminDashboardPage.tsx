"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  type TooltipProps,
} from "recharts";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { ProgressTracker } from "@/components/qbit/primitives/ProgressTracker";
import { useNavigation } from "@/lib/navigation/store";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { AdminStatsGrid } from "@/components/qbit/admin/AdminStatsCard";
import { AnalyticsCards } from "@/components/qbit/admin/AnalyticsCards";
import { AuditLogTable } from "@/components/qbit/admin/AuditLogTable";
import { AnnouncementManager } from "@/components/qbit/admin/AnnouncementManager";
import { ADMIN_STATS, ANALYTICS_CARDS, AUDIT_LOGS, ANNOUNCEMENTS } from "@/lib/admin/placeholder-data";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface DownloadTrendPoint {
  month: string;
  drivers: number;
  manuals: number;
}

interface RecentUploadRow {
  name: string;
  category: string;
  status: "published" | "draft";
  updated: string;
  icon: string;
  gradient: string;
}

type ActivityDotColor = "primary" | "secondary" | "error" | "neutral";

interface ActivityLogEntry {
  actor: string;
  action: string;
  time: string;
  dotColor: ActivityDotColor;
  /** Optional file/attachment chip shown below the action. */
  attachment?: { icon: string; label: string };
  /** Optional list of invited-member initials (overlapping avatars). */
  invitees?: string[];
  /** Render the whole entry dimmed (e.g. system automation). */
  dim?: boolean;
}

/* ------------------------------------------------------------------ */
/* Static data — exact copy from admin_dashboard_qbit_hub design HTML */
/* ------------------------------------------------------------------ */

const DOWNLOAD_TRENDS: DownloadTrendPoint[] = [
  { month: "Apr", drivers: 1800, manuals: 1200 },
  { month: "May", drivers: 2100, manuals: 1450 },
  { month: "Jun", drivers: 1950, manuals: 1600 },
  { month: "Jul", drivers: 2300, manuals: 1500 },
  { month: "Aug", drivers: 2400, manuals: 1700 },
  { month: "Sep", drivers: 2250, manuals: 1550 },
  { month: "Oct", drivers: 2600, manuals: 1850 },
];

const RECENT_UPLOADS: RecentUploadRow[] = [
  {
    name: "Q-Core Engine V2",
    category: "Hardware",
    status: "published",
    updated: "2 mins ago",
    icon: "memory",
    gradient: "from-qbit-primary to-qbit-secondary",
  },
  {
    name: "Network Map 2024",
    category: "Manual",
    status: "draft",
    updated: "1 hour ago",
    icon: "map",
    gradient: "from-qbit-tertiary to-qbit-tertiary-container",
  },
  {
    name: "PCIe Kernel Driver",
    category: "Drivers",
    status: "published",
    updated: "Yesterday",
    icon: "settings_input_component",
    gradient: "from-qbit-primary-container to-qbit-secondary-container",
  },
];

const ACTIVITY_LOGS: ActivityLogEntry[] = [
  {
    actor: "Alex Johnson",
    action: "uploaded a new product manual",
    time: "2 minutes ago",
    dotColor: "primary",
    attachment: { icon: "picture_as_pdf", label: "Setup_Guide_V3.pdf" },
  },
  {
    actor: "Sarah Chen",
    action: "updated Driver #42",
    time: "15 minutes ago",
    dotColor: "secondary",
  },
  {
    actor: "System",
    action:
      "Security alert: Unrecognized login attempt from IP 192.168.1.45",
    time: "1 hour ago",
    dotColor: "error",
  },
  {
    actor: "Admin",
    action: "invited 3 new team members",
    time: "3 hours ago",
    dotColor: "neutral",
    invitees: ["MK", "PT", "RL"],
  },
  {
    actor: "Automator",
    action: "Backups completed successfully",
    time: "Yesterday 11:45 PM",
    dotColor: "neutral",
    dim: true,
  },
];

const DOT_COLOR_CLASS: Record<ActivityDotColor, string> = {
  primary: "bg-qbit-primary",
  secondary: "bg-qbit-secondary-container",
  error: "bg-qbit-error",
  neutral: "bg-qbit-outline-variant",
};

const INVITEE_BG_CLASS: string[] = [
  "bg-qbit-primary-fixed text-qbit-on-primary-fixed",
  "bg-qbit-secondary-fixed text-qbit-on-secondary-fixed",
  "bg-qbit-tertiary-fixed text-qbit-on-tertiary-fixed",
];

/* ------------------------------------------------------------------ */
/* Recharts tooltip                                                   */
/* ------------------------------------------------------------------ */

function DownloadTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const drivers = (payload.find((p) => p.dataKey === "drivers")?.value as number) ?? 0;
  const manuals = (payload.find((p) => p.dataKey === "manuals")?.value as number) ?? 0;
  return (
    <div className="rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-lowest px-4 py-3 shadow-xl">
      <p className="text-sm font-bold text-qbit-on-surface">{label}</p>
      <div className="mt-2 space-y-1">
        <p className="flex items-center gap-2 text-xs font-medium text-qbit-on-surface-variant">
          <span className="h-2 w-2 rounded-full bg-qbit-primary" />
          Drivers: <span className="font-bold text-qbit-primary">{drivers.toLocaleString()}</span>
        </p>
        <p className="flex items-center gap-2 text-xs font-medium text-qbit-on-surface-variant">
          <span className="h-2 w-2 rounded-full bg-qbit-secondary-container/60" />
          Manuals:{" "}
          <span className="font-bold text-qbit-secondary">{manuals.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export function AdminDashboardPage() {
  const navigate = useNavigation((s) => s.navigate);
  const [searchValue, setSearchValue] = useState("");

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Control Center", icon: "bolt" }}
      navItems={ADMIN_NAV}
      activeScreen="admin-dashboard"
      user={{ name: "Admin User", role: "Super Administrator", initials: "AU" }}
      topBar={{
        searchPlaceholder: "Global search commands...",
        searchValue,
        onSearchChange: setSearchValue,
        user: { name: "Admin User", role: "Super Administrator", initials: "AU" },
      }}
    >
      <div className="space-y-6 lg:space-y-8">
        {/* ------------------------------------------------------------ */}
        {/* 1. Header                                                    */}
        {/* ------------------------------------------------------------ */}
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
            <QbitButton
              variant="surface"
              size="md"
              icon="person_add"
              onClick={() => navigate("user-role-management")}
            >
              Invite User
            </QbitButton>
            <QbitButton
              variant="primary-container"
              size="md"
              icon="upload"
              onClick={() => navigate("driver-download-center")}
            >
              Upload Driver
            </QbitButton>
            <QbitButton
              variant="primary"
              size="md"
              icon="add"
              onClick={() => navigate("product-management")}
            >
              Add Product
            </QbitButton>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 2. KPI Grid                                                  */}
        {/* ------------------------------------------------------------ */}
        <section aria-label="Key performance indicators">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
            <KpiCard
              label="Total Products"
              value="124"
              icon="inventory_2"
              delta="+12%"
              deltaVariant="up"
              iconBg="bg-qbit-primary/10 text-qbit-primary"
            />
            <KpiCard
              label="Active Users"
              value="856"
              icon="group"
              delta="+8.4%"
              deltaVariant="up"
              iconBg="bg-qbit-secondary-container/30 text-qbit-secondary"
            />
            <KpiCard
              label="Drivers"
              value="42"
              icon="local_shipping"
              delta="Stable"
              deltaVariant="neutral"
              iconBg="bg-qbit-tertiary-container/30 text-qbit-tertiary"
            />
            <KpiCard
              label="Manuals"
              value="18"
              icon="menu_book"
              delta="+2"
              deltaVariant="up"
            />
            <SurfaceCard className="p-5 card-hover-lift">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Storage Used
                  </p>
                  <p className="mt-2 text-[28px] font-bold leading-tight text-qbit-on-surface">
                    65%
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                    <Icon name="trending_down" className="text-[12px]" />
                    Critical
                  </span>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                  <Icon name="storage" className="text-[22px]" />
                </div>
              </div>
              <ProgressTracker
                className="mt-4"
                value={65}
                variant="error"
                pulse
                showPercentage={false}
              />
            </SurfaceCard>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 3. Main Grid (8/4)                                           */}
        {/* ------------------------------------------------------------ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left column --------------------------------------------- */}
          <div className="space-y-6 lg:col-span-8">
            {/* 3a. Download Trends chart */}
            <SurfaceCard className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-qbit-outline-variant px-5 py-4 md:px-6">
                <h3 className="text-lg font-semibold text-qbit-on-surface">
                  Download Trends
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-qbit-primary" />
                    <span className="text-xs font-medium text-qbit-on-surface-variant">
                      Drivers
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-qbit-secondary-container/60" />
                    <span className="text-xs font-medium text-qbit-on-surface-variant">
                      Manuals
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[280px] w-full bg-qbit-surface-container-lowest/60 px-3 py-4 md:px-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={DOWNLOAD_TRENDS}
                    margin={{ top: 10, right: 8, bottom: 4, left: -16 }}
                    barGap={6}
                    barCategoryGap="22%"
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#c3c5d9"
                      strokeDasharray="3 3"
                      strokeOpacity={0.45}
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={{ stroke: "#c3c5d9", strokeOpacity: 0.6 }}
                      tick={{ fill: "#434656", fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      tick={{ fill: "#434656", fontSize: 12 }}
                      tickFormatter={(v: number) => `${Math.round(v / 100) / 10}k`}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,67,200,0.06)" }}
                      content={<DownloadTooltip />}
                    />
                    <Bar
                      dataKey="drivers"
                      fill="#0043c8"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={26}
                    />
                    <Bar
                      dataKey="manuals"
                      fill="#316bf3"
                      fillOpacity={0.6}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={26}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SurfaceCard>

            {/* 3b. Recent Uploads table */}
            <SurfaceCard className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-qbit-outline-variant px-5 py-4 md:px-6">
                <h3 className="text-lg font-semibold text-qbit-on-surface">
                  Recent Uploads
                </h3>
                <button
                  type="button"
                  onClick={() => navigate("product-management")}
                  className="text-sm font-semibold text-qbit-primary transition-colors hover:underline"
                >
                  View all uploads
                </button>
              </div>
              <div className="max-h-[420px] overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed text-left">
                  <thead className="bg-qbit-surface-container-low">
                    <tr>
                      <th className="w-[80px] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-qbit-outline md:px-6">
                        Image
                      </th>
                      <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-qbit-outline">
                        Product Name
                      </th>
                      <th className="w-[140px] px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-qbit-outline">
                        Category
                      </th>
                      <th className="w-[140px] px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-qbit-outline">
                        Status
                      </th>
                      <th className="w-[140px] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-qbit-outline md:px-6">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-qbit-outline-variant">
                    {RECENT_UPLOADS.map((row) => (
                      <tr
                        key={row.name}
                        className="cursor-pointer transition-colors hover:bg-qbit-surface-container-high"
                      >
                        <td className="px-5 py-3 md:px-6">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${row.gradient} text-white shadow-sm`}
                          >
                            <Icon name={row.icon} className="text-[22px]" filled />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-qbit-on-surface">
                          {row.name}
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-qbit-on-surface-variant">
                          {row.category}
                        </td>
                        <td className="px-3 py-3">
                          {row.status === "published" ? (
                            <StatusBadge variant="primary" dot>
                              Published
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="neutral" dot>
                              Draft
                            </StatusBadge>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm text-qbit-on-surface-variant md:px-6">
                          {row.updated}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          </div>

          {/* Right column: Activity Logs ------------------------------ */}
          <div className="lg:col-span-4">
            <SurfaceCard className="flex h-full flex-col overflow-hidden">
              <div className="sticky top-0 flex items-center justify-between border-b border-qbit-outline-variant bg-qbit-surface-container-lowest px-5 py-4 md:px-6">
                <h3 className="text-lg font-semibold text-qbit-on-surface">
                  Activity Logs
                </h3>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-qbit-outline transition-colors hover:bg-qbit-surface-container"
                  aria-label="More activity options"
                >
                  <Icon name="more_vert" className="text-[18px]" />
                </button>
              </div>

              <div className="custom-scrollbar max-h-[640px] flex-1 space-y-5 overflow-y-auto px-5 py-5 md:px-6">
                {ACTIVITY_LOGS.map((entry, idx) => (
                  <ActivityLogItem key={`${entry.actor}-${idx}`} entry={entry} />
                ))}
              </div>

              <div className="border-t border-qbit-outline-variant bg-qbit-surface-container-low px-5 py-3 md:px-6">
                <QbitButton
                  variant="ghost"
                  fullWidth
                  className="font-bold text-qbit-primary hover:bg-qbit-primary/5"
                  onClick={() => navigate("user-role-management")}
                >
                  View All Activity
                </QbitButton>
              </div>
            </SurfaceCard>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* Extended: Full Admin Stats Grid                              */}
        {/* ------------------------------------------------------------ */}
        <AdminStatsGrid stats={ADMIN_STATS} />

        {/* ------------------------------------------------------------ */}
        {/* Extended: Analytics Cards                                    */}
        {/* ------------------------------------------------------------ */}
        <AnalyticsCards cards={ANALYTICS_CARDS} />

        {/* ------------------------------------------------------------ */}
        {/* Extended: Announcement Manager                               */}
        {/* ------------------------------------------------------------ */}
        <AnnouncementManager announcements={ANNOUNCEMENTS} />

        {/* ------------------------------------------------------------ */}
        {/* Extended: Audit Log Table                                    */}
        {/* ------------------------------------------------------------ */}
        <section className="space-y-4">
          <h3 className="text-[20px] font-semibold text-qbit-on-surface flex items-center gap-2">
            Audit Logs
          </h3>
          <AuditLogTable logs={AUDIT_LOGS} />
        </section>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Activity log item                                                  */
/* ------------------------------------------------------------------ */

function ActivityLogItem({ entry }: { entry: ActivityLogEntry }) {
  return (
    <div
      className={`relative border-l-2 border-qbit-outline-variant pl-6 ${
        entry.dim ? "opacity-60" : ""
      }`}
    >
      <span
        className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-qbit-background ${
          DOT_COLOR_CLASS[entry.dotColor]
        }`}
      />
      <p className="mb-1 text-sm leading-snug">
        <span className="font-bold text-qbit-on-surface">{entry.actor}</span>{" "}
        <span className="text-qbit-on-surface-variant">{entry.action}</span>
      </p>

      {entry.attachment && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low p-2">
          <Icon
            name={entry.attachment.icon}
            className="text-[18px] text-qbit-primary"
            filled
          />
          <span className="truncate text-xs font-medium text-qbit-on-surface">
            {entry.attachment.label}
          </span>
        </div>
      )}

      {entry.invitees && entry.invitees.length > 0 && (
        <div className="mb-2 flex -space-x-2">
          {entry.invitees.map((initials, i) => (
            <div
              key={initials}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-qbit-background text-[10px] font-bold ${
                INVITEE_BG_CLASS[i % INVITEE_BG_CLASS.length]
              }`}
            >
              {initials}
            </div>
          ))}
        </div>
      )}

      <span className="text-xs text-qbit-outline">{entry.time}</span>
    </div>
  );
}
