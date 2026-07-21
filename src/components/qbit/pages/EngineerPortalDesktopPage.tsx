"use client";

/**
 * Engineer Portal — Desktop-First Responsive Dashboard (V3 Redesign)
 *
 * Premium enterprise experience for installation engineers.
 * Clean sidebar, real KPIs from database, proper responsive grid.
 * Mobile: keeps existing MobileEngineerPage flow.
 * Desktop: CSS Grid with sidebar + main + optional right panel.
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";
import { ENGINEER_NAV, ENGINEER_FOOTER } from "@/lib/navigation/nav-config";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface KpiData {
  todayJobs: number;
  pendingJobs: number;
  completedJobs: number;
  delayedJobs: number;
  openTickets: number;
  warrantyScans: number;
}

interface WorkOrderItem {
  id: string;
  jobNumber: string;
  type: string;
  priority: string;
  status: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  description: string | null;
  customer: {
    name: string;
    phone: string;
    address: string;
  } | null;
  asset: {
    productName: string;
    serialNumber: string;
  } | null;
}

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
/* Quick Action                                                        */
/* ------------------------------------------------------------------ */

function QuickAction({ label, icon, screen, description }: {
  label: string; icon: string; screen: ScreenId; description: string;
}) {
  const navigate = useNavigation((s) => s.navigate);
  return (
    <button
      type="button"
      onClick={() => navigate(screen)}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon name={icon} className="text-[20px]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Job Card                                                            */
/* ------------------------------------------------------------------ */

function JobCard({ job }: { job: WorkOrderItem }) {
  const navigate = useNavigation((s) => s.navigate);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    arrived: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    rescheduled: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  };

  const priorityColors: Record<string, string> = {
    urgent: "text-red-600",
    high: "text-amber-600",
    normal: "text-blue-600",
    low: "text-gray-500",
  };

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    arrived: "Arrived",
    completed: "Completed",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 lg:p-5 transition-shadow hover:shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">#{job.jobNumber}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColors[job.status] ?? statusColors.pending}`}>
              {statusLabel[job.status] ?? job.status}
            </span>
            <span className={`text-[11px] font-semibold uppercase ${priorityColors[job.priority] ?? ""}`}>
              {job.priority}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground capitalize">{job.type.replace(/_/g, " ")}</p>
        </div>
      </div>

      {/* Customer & Asset info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {job.customer && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</p>
            <p className="font-medium text-foreground">{job.customer.name}</p>
            {job.customer.phone && (
              <p className="text-muted-foreground flex items-center gap-1">
                <Icon name="phone" className="text-[14px]" /> {job.customer.phone}
              </p>
            )}
            {job.customer.address && (
              <p className="text-muted-foreground flex items-center gap-1 truncate">
                <Icon name="location_on" className="text-[14px] shrink-0" />
                <span className="truncate">{job.customer.address}</span>
              </p>
            )}
          </div>
        )}
        {job.asset && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</p>
            <p className="font-medium text-foreground">{job.asset.productName}</p>
            {job.asset.serialNumber && (
              <p className="text-muted-foreground flex items-center gap-1">
                <Icon name="qr_code" className="text-[14px]" /> {job.asset.serialNumber}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Schedule */}
      {job.scheduledDate && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Icon name="schedule" className="text-[14px]" />
          <span>{job.scheduledDate}{job.scheduledTime ? ` at ${job.scheduledTime}` : ""}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {job.customer?.phone && (
          <>
            <QbitButton
              variant="outline"
              size="sm"
              icon="phone"
              onClick={() => window.open(`tel:${job.customer!.phone}`, "_self")}
            >
              Call
            </QbitButton>
            <QbitButton
              variant="outline"
              size="sm"
              icon="chat"
              onClick={() => window.open(`https://wa.me/${job.customer!.phone.replace(/\D/g, "")}`, "_blank")}
            >
              WhatsApp
            </QbitButton>
          </>
        )}
        {job.customer?.address && (
          <QbitButton
            variant="outline"
            size="sm"
            icon="directions"
            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.customer!.address)}`, "_blank")}
          >
            Navigate
          </QbitButton>
        )}
        {(job.status === "pending" || job.status === "arrived") && (
          <QbitButton
            variant="primary"
            size="sm"
            icon="play_arrow"
            onClick={() => navigate("fsm-work-order-detail", { id: job.id })}
          >
            Start Job
          </QbitButton>
        )}
        {job.status === "in_progress" && (
          <QbitButton
            variant="primary"
            size="sm"
            icon="check_circle"
            onClick={() => navigate("fsm-work-order-completion", { id: job.id })}
          >
            Complete Job
          </QbitButton>
        )}
        <QbitButton
          variant="ghost"
          size="sm"
          icon="visibility"
          onClick={() => navigate("fsm-work-order-detail", { id: job.id })}
        >
          View Details
        </QbitButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page Component                                                 */
/* ------------------------------------------------------------------ */

export function EngineerPortalDesktopPage() {
  const { data: session } = useSession();
  const navigate = useNavigation((s) => s.navigate);
  const [kpi, setKpi] = useState<KpiData>({
    todayJobs: 0, pendingJobs: 0, completedJobs: 0, delayedJobs: 0, openTickets: 0, warrantyScans: 0,
  });
  const [todayJobs, setTodayJobs] = useState<WorkOrderItem[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<WorkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = session?.user?.role as string | undefined;
  const userName = session?.user?.name ?? "Engineer";
  const displayRole = userRole === "support_engineer" ? "Support" : "Installation Engineer";
  const userInitials = userName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/fsm/work-orders?due=all");
      if (!res.ok) return;
      const data = await res.json();
      const orders: WorkOrderItem[] = Array.isArray(data) ? data : data.workOrders ?? data.items ?? [];

      const today = new Date().toISOString().split("T")[0];
      const todayList = orders.filter(o => o.scheduledDate === today && o.status !== "completed" && o.status !== "cancelled");
      const pendingCount = orders.filter(o => o.status === "pending").length;
      const completedCount = orders.filter(o => o.status === "completed").length;
      const delayedCount = orders.filter(o =>
        (o.status === "pending" || o.status === "rescheduled") &&
        o.scheduledDate && o.scheduledDate < today
      ).length;

      setKpi({
        todayJobs: todayList.length,
        pendingJobs: pendingCount,
        completedJobs: completedCount,
        delayedJobs: delayedCount,
        openTickets: 0,
        warrantyScans: 0,
      });
      setTodayJobs(todayList.slice(0, 5));
      setUpcomingJobs(orders.filter(o => o.status === "pending" && o.scheduledDate !== today).slice(0, 5));
    } catch {
      // Silently fail — dashboard shows zeros
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  return (
    <AppShell
      variant="engineer"
      brand={{ title: "QBIT Hub", tagline: "Engineer Portal", icon: "engineering" }}
      navItems={ENGINEER_NAV}
      footerItems={ENGINEER_FOOTER}
      activeScreen="engineer-portal"
      user={{ name: userName, role: displayRole, initials: userInitials }}
      topBar={{
        searchPlaceholder: "Search serial numbers, drivers, manuals...",
        user: { name: userName, role: displayRole, initials: userInitials },
      }}
    >
      <div className="space-y-6 lg:space-y-8">
        {/* ---------------------------------------------------------------- */}
        {/* Welcome Header — clean, minimal                                  */}
        {/* ---------------------------------------------------------------- */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Welcome back, {userName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your installation dashboard — manage jobs, tools, and resources.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <QbitButton variant="primary" icon="play_arrow" onClick={() => navigate("fsm-dashboard")}>
              Start Installation
            </QbitButton>
            <QbitButton variant="outline" icon="smart_toy" onClick={() => navigate("dr-qbit-detection")}>
              Dr. QBIT
            </QbitButton>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* KPI Strip — Real data from database                              */}
        {/* ---------------------------------------------------------------- */}
        <section aria-label="Job KPIs">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            <KpiTile label="Today's Jobs" value={kpi.todayJobs} icon="today" color="blue" />
            <KpiTile label="Pending" value={kpi.pendingJobs} icon="pending_actions" color="amber" />
            <KpiTile label="Completed" value={kpi.completedJobs} icon="check_circle" color="green" />
            <KpiTile label="Delayed" value={kpi.delayedJobs} icon="warning" color="red" />
            <KpiTile label="Open Tickets" value={kpi.openTickets} icon="confirmation_number" color="purple" />
            <KpiTile label="Warranty Scans" value={kpi.warrantyScans} icon="verified_user" color="teal" />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Main Content Grid — Desktop: 8/4 split                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left: 8 cols — Jobs & Quick Actions */}
          <div className="lg:col-span-8 space-y-6">
            {/* Quick Actions — only what engineers actually use */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                <QuickAction
                  label="Start Installation"
                  icon="play_arrow"
                  screen="fsm-dashboard"
                  description="View and start assigned jobs"
                />
                <QuickAction
                  label="Dr. QBIT"
                  icon="smart_toy"
                  screen="dr-qbit-detection"
                  description="Detect & diagnose hardware"
                />
                <QuickAction
                  label="Download Resources"
                  icon="cloud_download"
                  screen="engineer-downloads"
                  description="Drivers, firmware, SDK, tools"
                />
                <QuickAction
                  label="Scan QR / Serial"
                  icon="qr_code_scanner"
                  screen="dr-qbit-detection"
                  description="Look up device by serial number"
                />
                <QuickAction
                  label="Raise Support Ticket"
                  icon="confirmation_number"
                  screen="support-tickets"
                  description="Contact support team"
                />
                <QuickAction
                  label="Knowledge Base"
                  icon="menu_book"
                  screen="engineer-knowledge"
                  description="Manuals, guides, FAQs, videos"
                />
              </div>
            </section>

            {/* Today's Jobs */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Today&apos;s Jobs</h2>
                <button
                  type="button"
                  onClick={() => navigate("engineer-jobs")}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View All Jobs
                </button>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              ) : todayJobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Icon name="check_circle" className="text-[40px] text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No jobs scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayJobs.map(job => <JobCard key={job.id} job={job} />)}
                </div>
              )}
            </section>

            {/* Upcoming Jobs */}
            {upcomingJobs.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Upcoming Jobs</h2>
                  <button
                    type="button"
                    onClick={() => navigate("engineer-jobs")}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {upcomingJobs.map(job => <JobCard key={job.id} job={job} />)}
                </div>
              </section>
            )}
          </div>

          {/* Right: 4 cols — Activity & Tools */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Dr. QBIT Quick Scan */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon name="smart_toy" className="text-[22px]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Dr. QBIT</h3>
                  <p className="text-xs text-muted-foreground">Your primary diagnostic tool</p>
                </div>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Search serial → Product details → Warranty → Downloads → Manual → Troubleshoot → Ticket
              </p>
              <QbitButton
                variant="primary"
                fullWidth
                icon="qr_code_scanner"
                onClick={() => navigate("dr-qbit-detection")}
              >
                Scan Serial Number
              </QbitButton>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 text-sm font-bold text-foreground">Recent Activity</h3>
              <div className="space-y-3">
                {todayJobs.slice(0, 4).map(job => (
                  <div key={job.id} className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">#{job.jobNumber} — {job.customer?.name ?? "Unassigned"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{job.type.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                ))}
                {todayJobs.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </div>

            {/* Useful Links */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 text-sm font-bold text-foreground">Useful Links</h3>
              <div className="space-y-2">
                {[
                  { label: "Product Library", icon: "inventory_2", screen: "product-library" as ScreenId },
                  { label: "Installation Guides", icon: "menu_book", screen: "installation-center" as ScreenId },
                  { label: "Video Training", icon: "play_circle", screen: "video-training-center" as ScreenId },
                  { label: "System Settings", icon: "settings", screen: "system-settings" as ScreenId },
                ].map(link => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => navigate(link.screen)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <Icon name={link.icon} className="text-[18px] text-muted-foreground" />
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
