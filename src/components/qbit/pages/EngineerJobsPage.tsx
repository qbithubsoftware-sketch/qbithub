"use client";

/**
 * Engineer Jobs / Installations Page
 *
 * Full job management view with filters, search, and detailed job cards.
 * Pulls real data from the FSM work orders API.
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

interface WorkOrderItem {
  id: string;
  jobNumber: string;
  type: string;
  priority: string;
  status: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  description: string | null;
  customer: { name: string; phone: string; address: string } | null;
  asset: { productName: string; serialNumber: string } | null;
}

type StatusFilter = "all" | "pending" | "in_progress" | "arrived" | "completed" | "rescheduled" | "cancelled";

/* ------------------------------------------------------------------ */
/* Job Card — Full Detail                                              */
/* ------------------------------------------------------------------ */

function FullJobCard({ job }: { job: WorkOrderItem }) {
  const navigate = useNavigation((s) => s.navigate);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    arrived: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    rescheduled: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  };

  const priorityBadge: Record<string, { bg: string; label: string }> = {
    urgent: { bg: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400", label: "URGENT" },
    high: { bg: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400", label: "HIGH" },
    normal: { bg: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400", label: "NORMAL" },
    low: { bg: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", label: "LOW" },
  };

  const statusLabel: Record<string, string> = {
    pending: "Pending", in_progress: "In Progress", arrived: "Arrived",
    completed: "Completed", cancelled: "Cancelled", rescheduled: "Rescheduled",
  };

  const prio = priorityBadge[job.priority] ?? priorityBadge.normal;

  return (
    <div className="rounded-xl border border-border bg-card p-5 lg:p-6 transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: Job info */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-foreground">#{job.jobNumber}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColors[job.status] ?? statusColors.pending}`}>
              {statusLabel[job.status] ?? job.status}
            </span>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${prio.bg}`}>
              {prio.label}
            </span>
          </div>

          <p className="text-sm font-medium text-foreground capitalize">{job.type.replace(/_/g, " ")}</p>

          {/* Customer & Product details grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {job.customer && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</p>
                <p className="text-sm font-semibold text-foreground">{job.customer.name}</p>
                {job.customer.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Icon name="phone" className="text-[14px]" /> {job.customer.phone}
                  </p>
                )}
                {job.customer.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Icon name="location_on" className="text-[14px] shrink-0" />
                    <span className="truncate">{job.customer.address}</span>
                  </p>
                )}
              </div>
            )}
            {job.asset && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Product</p>
                <p className="text-sm font-semibold text-foreground">{job.asset.productName}</p>
                {job.asset.serialNumber && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Icon name="qr_code" className="text-[14px]" /> S/N: {job.asset.serialNumber}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Schedule */}
          {job.scheduledDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="schedule" className="text-[16px]" />
              <span>{job.scheduledDate}{job.scheduledTime ? ` at ${job.scheduledTime}` : ""}</span>
            </div>
          )}

          {job.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:items-end lg:justify-start">
          {job.customer?.phone && (
            <>
              <QbitButton variant="outline" size="sm" icon="phone"
                onClick={() => window.open(`tel:${job.customer!.phone}`, "_self")}>Call</QbitButton>
              <QbitButton variant="outline" size="sm" icon="chat"
                onClick={() => window.open(`https://wa.me/${job.customer!.phone.replace(/\D/g, "")}`, "_blank")}>WhatsApp</QbitButton>
            </>
          )}
          {job.customer?.address && (
            <QbitButton variant="outline" size="sm" icon="directions"
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.customer!.address)}`, "_blank")}>Navigate</QbitButton>
          )}
          {(job.status === "pending" || job.status === "arrived") && (
            <QbitButton variant="primary" size="sm" icon="play_arrow"
              onClick={() => navigate("fsm-work-order-detail", { id: job.id })}>Start Job</QbitButton>
          )}
          {job.status === "in_progress" && (
            <QbitButton variant="primary" size="sm" icon="check_circle"
              onClick={() => navigate("fsm-work-order-completion", { id: job.id })}>Complete Job</QbitButton>
          )}
          <QbitButton variant="ghost" size="sm" icon="visibility"
            onClick={() => navigate("fsm-work-order-detail", { id: job.id })}>View Details</QbitButton>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export function EngineerJobsPage() {
  const { data: session } = useSession();
  const navigate = useNavigation((s) => s.navigate);
  const [jobs, setJobs] = useState<WorkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const userName = session?.user?.name ?? "Engineer";
  const userInitials = userName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const userRole = session?.user?.role as string | undefined;
  const displayRole = userRole === "support_engineer" ? "Support" : "Installation Engineer";

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/fsm/work-orders?due=all");
      if (!res.ok) return;
      const data = await res.json();
      const orders: WorkOrderItem[] = Array.isArray(data) ? data : data.workOrders ?? data.items ?? [];
      setJobs(orders);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filteredJobs = jobs.filter(j => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        j.jobNumber.toLowerCase().includes(q) ||
        j.customer?.name.toLowerCase().includes(q) ||
        j.asset?.productName.toLowerCase().includes(q) ||
        j.asset?.serialNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusCounts: Record<string, number> = { all: jobs.length };
  for (const j of jobs) { statusCounts[j.status] = (statusCounts[j.status] ?? 0) + 1; }

  const filterOptions: { value: StatusFilter; label: string; icon: string }[] = [
    { value: "all", label: "All", icon: "list" },
    { value: "pending", label: "Pending", icon: "pending_actions" },
    { value: "in_progress", label: "In Progress", icon: "progress_activity" },
    { value: "arrived", label: "Arrived", icon: "location_on" },
    { value: "completed", label: "Completed", icon: "check_circle" },
    { value: "rescheduled", label: "Rescheduled", icon: "event_repeat" },
    { value: "cancelled", label: "Cancelled", icon: "cancel" },
  ];

  return (
    <AppShell
      variant="engineer"
      brand={{ title: "QBIT Hub", tagline: "Engineer Portal", icon: "engineering" }}
      navItems={ENGINEER_NAV}
      footerItems={ENGINEER_FOOTER}
      activeScreen="engineer-jobs"
      user={{ name: userName, role: displayRole, initials: userInitials }}
      topBar={{
        searchPlaceholder: "Search jobs, customers, serial numbers...",
        user: { name: userName, role: displayRole, initials: userInitials },
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Jobs & Installations</h1>
            <p className="mt-1 text-sm text-muted-foreground">{filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found</p>
          </div>
          <QbitButton variant="primary" icon="add" onClick={() => navigate("fsm-dashboard")}>
            New Installation
          </QbitButton>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job #, customer, product, serial..."
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Icon name={opt.icon} className="text-[14px]" />
              {opt.label}
              <span className="ml-1 text-xs opacity-70">{statusCounts[opt.value] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Job list */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Icon name="search_off" className="text-[48px] text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No jobs found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map(job => <FullJobCard key={job.id} job={job} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
