"use client";

/**
 * FSMDashboardPage — installation engineer's home screen.
 *
 * Reuses: AppShell (variant=field), FSM_NAV, KpiCard, SurfaceCard, JobCard.
 *
 * Sections:
 *   1. Welcome + KPIs (Today / Upcoming / Pending / Delayed / Completed)
 *   2. Today's Jobs (cards)
 *   3. Quick Actions (Open Dr. QBIT, View History, etc.)
 *   4. Pending Jobs (cards)
 *   5. Delayed Jobs (cards, with warning banner)
 *   6. Recent Customers (mini list)
 *   7. Upcoming Jobs (cards)
 *   8. Completed Jobs (cards)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { JobCard, bucketWorkOrders } from "@/components/qbit/fsm";
import { FSM_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import { type WorkOrderCardDTO } from "@/lib/fsm/types";

export function FSMDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  const [orders, setOrders] = useState<WorkOrderCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fsm/work-orders?due=all", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load work orders");
      const { items } = (await res.json()) as { items: WorkOrderCardDTO[] };
      setOrders(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const buckets = useMemo(() => bucketWorkOrders(orders), [orders]);

  const engineerName = user?.name ?? "Engineer";
  const initials = engineerName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleOpenJob = (id: string, jobNumber: string) => {
    navigate("fsm-work-order-detail", { id, jobNumber });
  };

  const handleOpenDrQbit = () => {
    navigate("support-tickets");
    toast({
      title: "Dr. QBIT ready",
      description: "Scan a device or ask a diagnostic question.",
    });
  };

  return (
    <AppShell
      variant="field"
      brand={{ title: "QBIT FSM", tagline: "Field Service", icon: "engineering" }}
      navItems={FSM_NAV}
      activeScreen="fsm-dashboard"
      user={{ name: engineerName, role: "Installation Engineer", initials }}
      cta={{ label: "Refresh", icon: "refresh", onClick: () => void fetchOrders() }}
      topBar={{
        searchPlaceholder: "Search work orders, customers, assets…",
        user: { name: engineerName, role: "Installation Engineer", initials },
      }}
    >
      <div className="space-y-6 lg:space-y-8">
        {/* -------------------------------------------------------------- */}
        {/* 1. Welcome + KPIs                                              */}
        {/* -------------------------------------------------------------- */}
        <section>
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface md:text-3xl">
              Welcome back, {engineerName.split(" ")[0]}
            </h2>
            <p className="text-sm text-qbit-on-surface-variant">
              You have <span className="font-semibold text-qbit-primary">{buckets.today.length}</span> jobs today
              {buckets.delayed.length > 0 && (
                <>
                  {" · "}
                  <span className="font-semibold text-qbit-error">{buckets.delayed.length} delayed</span>
                </>
              )}
              {" · "}
              <span className="font-semibold text-qbit-tertiary">{buckets.pending.length} pending</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <KpiCard label="Today's Jobs" value={buckets.today.length.toString()} icon="event_available" iconBg="bg-qbit-primary/10 text-qbit-primary" />
            <KpiCard label="Upcoming" value={buckets.upcoming.length.toString()} icon="event_upcoming" iconBg="bg-qbit-secondary/10 text-qbit-secondary" />
            <KpiCard label="Pending" value={buckets.pending.length.toString()} icon="pending_actions" iconBg="bg-qbit-tertiary/10 text-qbit-tertiary" />
            <KpiCard label="Delayed" value={buckets.delayed.length.toString()} icon="warning" iconBg="bg-qbit-error/10 text-qbit-error" />
            <KpiCard label="Completed" value={buckets.completed.length.toString()} icon="task_alt" iconBg="bg-qbit-primary/10 text-qbit-primary" />
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-qbit-error/30 bg-qbit-error/10 px-4 py-3 text-sm text-qbit-error">
            <Icon name="error" className="mr-1 inline text-[16px]" />
            {error}
            <QbitButton variant="ghost" size="sm" className="ml-2" onClick={() => void fetchOrders()}>
              Retry
            </QbitButton>
          </div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* 2. Quick Actions                                              */}
        {/* -------------------------------------------------------------- */}
        <section>
          <SurfaceCard className="p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-qbit-on-surface">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <button
                type="button"
                onClick={handleOpenDrQbit}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-qbit-primary/5 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-qbit-primary-container hover:text-qbit-on-primary-container"
              >
                <Icon name="smart_toy" className="text-[28px] text-qbit-primary transition-transform group-hover:scale-110" filled />
                <span className="text-sm font-semibold">Open Dr. QBIT</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("fsm-customer-asset-history")}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-qbit-secondary/5 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-qbit-secondary-container hover:text-qbit-on-secondary-container"
              >
                <Icon name="history" className="text-[28px] text-qbit-secondary transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold">Asset History</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("installation-center")}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-qbit-tertiary/5 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-qbit-tertiary-container hover:text-qbit-on-tertiary-container"
              >
                <Icon name="menu_book" className="text-[28px] text-qbit-tertiary transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold">Install Guides</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("support-tickets")}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-qbit-primary/5 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-qbit-primary-container hover:text-qbit-on-primary-container"
              >
                <Icon name="support_agent" className="text-[28px] text-qbit-primary transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold">Get Support</span>
              </button>
            </div>
          </SurfaceCard>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* 3. Today's Jobs                                               */}
        {/* -------------------------------------------------------------- */}
        <JobListSection
          title="Today's Jobs"
          icon="event_available"
          jobs={buckets.today}
          loading={loading}
          onOpenJob={handleOpenJob}
          emptyHint="No jobs scheduled for today."
        />

        {/* -------------------------------------------------------------- */}
        {/* 4. Delayed Jobs (warning banner)                              */}
        {/* -------------------------------------------------------------- */}
        {buckets.delayed.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-qbit-error/30 bg-qbit-error/10 px-4 py-2">
              <Icon name="warning" className="text-[18px] text-qbit-error" filled />
              <span className="text-sm font-semibold text-qbit-error">
                {buckets.delayed.length} job{buckets.delayed.length === 1 ? "" : "s"} delayed — please reschedule or complete.
              </span>
            </div>
            <JobGrid jobs={buckets.delayed} onOpenJob={handleOpenJob} />
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* 5. Pending + Upcoming                                         */}
        {/* -------------------------------------------------------------- */}
        <JobListSection
          title="Pending Acceptance"
          icon="pending_actions"
          jobs={buckets.pending.filter((j) => j.status === "pending")}
          loading={loading}
          onOpenJob={handleOpenJob}
          emptyHint="No jobs awaiting acceptance."
        />

        <JobListSection
          title="Upcoming Jobs"
          icon="event_upcoming"
          jobs={buckets.upcoming}
          loading={loading}
          onOpenJob={handleOpenJob}
          emptyHint="No upcoming jobs scheduled."
        />

        {/* -------------------------------------------------------------- */}
        {/* 6. Recent Customers (mini list)                                */}
        {/* -------------------------------------------------------------- */}
        <section>
          <SurfaceCard className="p-5 md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-qbit-on-surface">Recent Customers</h3>
            {orders.length === 0 ? (
              <p className="text-sm text-qbit-on-surface-variant">No customer activity yet.</p>
            ) : (
              <div className="space-y-2">
                {uniqueCustomers(orders).slice(0, 5).map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-lg border border-qbit-outline-variant/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-qbit-primary/10 text-qbit-primary">
                        <Icon name="person" className="text-[18px]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-qbit-on-surface">{c.name}</p>
                        <p className="text-xs text-qbit-on-surface-variant">{c.address}</p>
                      </div>
                    </div>
                    <span className="text-xs text-qbit-on-surface-variant">{c.jobCount} job{c.jobCount === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* 7. Completed Jobs                                              */}
        {/* -------------------------------------------------------------- */}
        <JobListSection
          title="Completed Jobs"
          icon="task_alt"
          jobs={buckets.completed}
          loading={loading}
          onOpenJob={handleOpenJob}
          emptyHint="No completed jobs yet."
        />
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function JobListSection({
  title,
  icon,
  jobs,
  loading,
  onOpenJob,
  emptyHint,
}: {
  title: string;
  icon: string;
  jobs: WorkOrderCardDTO[];
  loading: boolean;
  onOpenJob: (id: string, jobNumber: string) => void;
  emptyHint: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon name={icon} className="text-[20px] text-qbit-primary" filled />
        <h3 className="text-lg font-semibold text-qbit-on-surface">{title}</h3>
        <span className="rounded-full bg-qbit-surface-container-high px-2 py-0.5 text-xs font-medium text-qbit-on-surface-variant">
          {jobs.length}
        </span>
      </div>
      {loading ? (
        <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-8 text-center text-sm text-qbit-on-surface-variant">
          <Icon name="progress_activity" className="mx-auto mb-2 text-[24px] animate-spin" />
          Loading…
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-8 text-center text-sm text-qbit-on-surface-variant">
          {emptyHint}
        </div>
      ) : (
        <JobGrid jobs={jobs} onOpenJob={onOpenJob} />
      )}
    </section>
  );
}

function JobGrid({
  jobs,
  onOpenJob,
}: {
  jobs: WorkOrderCardDTO[];
  onOpenJob: (id: string, jobNumber: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((j) => (
        <JobCard
          key={j.id}
          workOrder={j}
          onClick={() => onOpenJob(j.id, j.jobNumber)}
        />
      ))}
    </div>
  );
}

function uniqueCustomers(orders: WorkOrderCardDTO[]) {
  const map = new Map<string, { name: string; address: string; jobCount: number }>();
  for (const o of orders) {
    const key = o.customerName;
    const existing = map.get(key);
    if (existing) {
      existing.jobCount += 1;
    } else {
      map.set(key, { name: o.customerName, address: o.address, jobCount: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.jobCount - a.jobCount);
}
