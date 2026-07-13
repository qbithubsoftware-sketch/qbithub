"use client";

/**
 * MobileEngineerPage — mobile-first PWA home for installation engineers.
 *
 * Layout:
 *   - Top bar: brand + notifications bell with unread count + sync status
 *   - Sticky OfflineBanner (shown only when offline)
 *   - InstallPrompt (shown when beforeinstallprompt fires)
 *   - KPI strip: Today / Pending / Completed / Delayed (horizontal scroll on mobile)
 *   - Filter chips: All / Today / Upcoming / Pending / Completed / Delayed
 *   - Job list: mobile-optimized JobCards (touch-friendly, swipe to action)
 *   - Quick Actions grid: Dr. QBIT, Asset History, Knowledge Base, Support
 *   - Bottom nav: Home / Jobs / Notifications / Profile (sticky)
 *
 * Reuses existing FSM API (/api/fsm/work-orders) + Notification API.
 * No new API needed — this page is a mobile-optimized view of FSM data.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { OfflineBanner, SyncStatus, InstallPrompt } from "@/components/qbit/pwa";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/lib/pwa/hooks";
import {
  type WorkOrderCardDTO,
  type WorkOrderType,
  type WorkOrderStatus,
  WORK_ORDER_TYPE_ICONS,
  WORK_ORDER_TYPE_LABELS,
  WORK_ORDER_STATUS_BADGES,
  WORK_ORDER_STATUS_LABELS,
  PRIORITY_BADGES,
  PRIORITY_LABELS,
  isWorkOrderDelayed,
} from "@/lib/fsm/types";

type FilterTab = "all" | "today" | "upcoming" | "pending" | "completed" | "delayed";

export function MobileEngineerPage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();
  const online = useOnlineStatus();

  const [orders, setOrders] = useState<WorkOrderCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fsm/work-orders?due=all", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const { items } = (await res.json()) as { items: WorkOrderCardDTO[] };
      setOrders(items);
    } catch (e) {
      // If offline, try to serve from cache (service worker will handle)
      if (!online) {
        setError("You are offline. Showing cached data.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load jobs");
      }
    } finally {
      setLoading(false);
    }
  }, [online]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?filter=unread&limit=1", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    void fetchUnreadCount();
  }, [fetchOrders, fetchUnreadCount]);

  // Auto-refresh when coming back online
  useEffect(() => {
    if (online) void fetchOrders();
  }, [online, fetchOrders]);

  const buckets = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    return {
      today: orders.filter((o) => {
        const d = new Date(o.scheduledDate);
        return d >= startOfToday && d <= endOfToday;
      }),
      upcoming: orders.filter((o) => new Date(o.scheduledDate) > endOfToday),
      pending: orders.filter((o) => o.status === "pending" || o.status === "accepted"),
      completed: orders.filter((o) => o.status === "completed"),
      delayed: orders.filter((o) => o.isDelayed),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "today": return buckets.today;
      case "upcoming": return buckets.upcoming;
      case "pending": return buckets.pending;
      case "completed": return buckets.completed;
      case "delayed": return buckets.delayed;
      default: return orders;
    }
  }, [filter, buckets, orders]);

  const engineerName = user?.name ?? "Engineer";
  const engineerInitials = engineerName
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const handleOpenJob = (id: string, jobNumber: string) => {
    navigate("fsm-work-order-detail", { id, jobNumber });
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "drqbit":
        navigate("ai-support-center");
        break;
      case "history":
        navigate("fsm-customer-asset-history");
        break;
      case "knowledge":
        navigate("ai-support-center");
        break;
      case "notifications":
        navigate("notification-center");
        break;
      default:
        toast({ title: "Coming soon", description: action });
    }
  };

  return (
    <div className="min-h-screen bg-qbit-surface pb-20">
      {/* ---------- Offline banner ---------- */}
      <OfflineBanner pendingCount={0} />

      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-40 border-b border-qbit-outline-variant bg-qbit-surface/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-qbit-primary text-qbit-on-primary">
              <Icon name="engineering" className="text-[20px]" filled />
            </div>
            <div>
              <p className="text-sm font-bold text-qbit-on-surface leading-tight">QBIT Engineer</p>
              <p className="text-[10px] text-qbit-on-surface-variant leading-tight">{engineerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchOrders()}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
              aria-label="Refresh"
            >
              <Icon name="refresh" className="text-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("notifications")}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
              aria-label="Notifications"
            >
              <Icon name="notifications" className="text-[20px]" filled={unreadCount > 0} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-qbit-error px-1 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-qbit-primary-container text-sm font-bold text-qbit-on-primary-container">
              {engineerInitials}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {/* ---------- Install prompt ---------- */}
        <InstallPrompt />

        {/* ---------- Sync status ---------- */}
        <SyncStatus />

        {/* ---------- Welcome + KPIs ---------- */}
        <div>
          <h1 className="text-xl font-bold text-qbit-on-surface">
            Hi, {engineerName.split(" ")[0]} 👋
          </h1>
          <p className="text-xs text-qbit-on-surface-variant">
            {buckets.today.length > 0
              ? `You have ${buckets.today.length} job${buckets.today.length === 1 ? "" : "s"} today`
              : "No jobs scheduled for today"}
            {buckets.delayed.length > 0 && ` · ${buckets.delayed.length} delayed`}
          </p>
        </div>

        {/* KPI horizontal strip */}
        <div className="grid grid-cols-4 gap-2">
          <KpiTile label="Today" value={buckets.today.length} icon="event_available" color="primary" />
          <KpiTile label="Pending" value={buckets.pending.length} icon="pending_actions" color="tertiary" />
          <KpiTile label="Done" value={buckets.completed.length} icon="task_alt" color="success" />
          <KpiTile label="Delayed" value={buckets.delayed.length} icon="warning" color="error" />
        </div>

        {/* ---------- Quick Actions ---------- */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
            Quick Actions
          </p>
          <div className="grid grid-cols-4 gap-2">
            <QuickActionTile icon="smart_toy" label="Dr. QBIT" onClick={() => handleQuickAction("drqbit")} />
            <QuickActionTile icon="history" label="History" onClick={() => handleQuickAction("history")} />
            <QuickActionTile icon="library_books" label="Knowledge" onClick={() => handleQuickAction("knowledge")} />
            <QuickActionTile icon="support_agent" label="Support" onClick={() => handleQuickAction("knowledge")} />
          </div>
        </div>

        {/* ---------- Filter chips ---------- */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {([
            { id: "all", label: "All", count: orders.length },
            { id: "today", label: "Today", count: buckets.today.length },
            { id: "upcoming", label: "Upcoming", count: buckets.upcoming.length },
            { id: "pending", label: "Pending", count: buckets.pending.length },
            { id: "completed", label: "Completed", count: buckets.completed.length },
            { id: "delayed", label: "Delayed", count: buckets.delayed.length },
          ] as Array<{ id: FilterTab; label: string; count: number }>).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                (filter === tab.id
                  ? "border-qbit-primary bg-qbit-primary text-qbit-on-primary"
                  : "border-qbit-outline-variant bg-white text-qbit-on-surface-variant")
              }
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={"ml-1 text-[10px] " + (filter === tab.id ? "text-white/80" : "text-qbit-on-surface-variant")}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ---------- Error ---------- */}
        {error && (
          <div className="rounded-lg border border-qbit-error/30 bg-qbit-error/10 px-3 py-2 text-xs text-qbit-error">
            <Icon name="error" className="mr-1 inline text-[14px]" />
            {error}
          </div>
        )}

        {/* ---------- Job list ---------- */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-qbit-outline-variant/30 bg-white p-4">
                <div className="h-4 w-1/3 rounded bg-qbit-surface-container-high" />
                <div className="mt-2 h-3 w-2/3 rounded bg-qbit-surface-container-high" />
                <div className="mt-3 h-3 w-1/2 rounded bg-qbit-surface-container-high" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-12 text-center">
            <Icon name="inbox" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
            <p className="mt-2 text-sm text-qbit-on-surface-variant">No jobs in this category.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((wo) => (
              <MobileJobCard key={wo.id} workOrder={wo} onClick={() => handleOpenJob(wo.id, wo.jobNumber)} />
            ))}
          </div>
        )}

        {/* ---------- Recent customers ---------- */}
        {orders.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
              Recent Customers
            </p>
            <div className="space-y-1.5">
              {uniqueCustomers(orders).slice(0, 4).map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => navigate("fsm-customer-asset-history")}
                  className="flex w-full items-center gap-3 rounded-lg border border-qbit-outline-variant/50 bg-white p-2.5 text-left active:bg-qbit-surface-container-low"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-qbit-primary/10 text-qbit-primary">
                    <Icon name="person" className="text-[16px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-qbit-on-surface">{c.name}</p>
                    <p className="truncate text-[10px] text-qbit-on-surface-variant">{c.address}</p>
                  </div>
                  <Icon name="chevron_right" className="text-[16px] text-qbit-on-surface-variant" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ---------- Bottom navigation ---------- */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-qbit-outline-variant bg-qbit-surface/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-md grid-cols-4">
          <BottomNavItem icon="dashboard" label="Home" active onClick={() => navigate("mobile-engineer")} />
          <BottomNavItem icon="assignment" label="Jobs" badge={buckets.today.length} onClick={() => { setFilter("today"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          <BottomNavItem icon="notifications" label="Alerts" badge={unreadCount} onClick={() => navigate("notification-center")} />
          <BottomNavItem icon="person" label="Profile" onClick={() => navigate("engineer-dashboard")} />
        </div>
      </nav>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile-optimized JobCard                                           */
/* ------------------------------------------------------------------ */

function MobileJobCard({
  workOrder,
  onClick,
}: {
  workOrder: WorkOrderCardDTO;
  onClick: () => void;
}) {
  const scheduled = new Date(workOrder.scheduledDate);
  const isToday = (() => {
    const now = new Date();
    return scheduled.getDate() === now.getDate() &&
      scheduled.getMonth() === now.getMonth() &&
      scheduled.getFullYear() === now.getFullYear();
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-xl border border-qbit-outline-variant/50 bg-white p-3.5 text-left transition-all active:bg-qbit-surface-container-low"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
          <Icon name={WORK_ORDER_TYPE_ICONS[workOrder.type] ?? "assignment"} className="text-[20px]" filled />
        </div>
        <div className="min-w-0 flex-1">
          {/* Top row: job number + status */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold text-qbit-primary">{workOrder.jobNumber}</span>
            <StatusBadge variant={WORK_ORDER_STATUS_BADGES[workOrder.status]} dot>
              {WORK_ORDER_STATUS_LABELS[workOrder.status]}
            </StatusBadge>
          </div>
          {/* Customer name */}
          <p className="mt-0.5 truncate text-sm font-semibold text-qbit-on-surface">
            {workOrder.customerName}
          </p>
          {/* Address */}
          <p className="truncate text-[11px] text-qbit-on-surface-variant">
            {workOrder.companyName ? `${workOrder.companyName} · ` : ""}
            {workOrder.address}
          </p>
          {/* Schedule + product */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-qbit-on-surface-variant">
            <span className="inline-flex items-center gap-0.5">
              <Icon name="schedule" className="text-[12px]" />
              {isToday ? "Today" : scheduled.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              {workOrder.scheduledTime ? ` · ${workOrder.scheduledTime}` : ""}
            </span>
            {workOrder.productName && (
              <span className="inline-flex items-center gap-0.5">
                <Icon name="inventory_2" className="text-[12px]" />
                {workOrder.model ?? workOrder.productName}
              </span>
            )}
          </div>
          {/* Priority + delayed */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <TagBadge variant={PRIORITY_BADGES[workOrder.priority]}>
              {PRIORITY_LABELS[workOrder.priority]}
            </TagBadge>
            {workOrder.isDelayed && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-qbit-error/10 px-1.5 py-0.5 text-[10px] font-semibold text-qbit-error">
                <Icon name="warning" className="text-[10px]" filled />
                Delayed
              </span>
            )}
          </div>
        </div>
        <Icon name="chevron_right" className="text-[18px] text-qbit-on-surface-variant" />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function KpiTile({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: "primary" | "tertiary" | "success" | "error";
}) {
  const colorClass = {
    primary: "bg-qbit-primary/10 text-qbit-primary",
    tertiary: "bg-qbit-tertiary/10 text-qbit-tertiary",
    success: "bg-qbit-success/10 text-qbit-success",
    error: "bg-qbit-error/10 text-qbit-error",
  }[color];

  return (
    <div className="rounded-lg border border-qbit-outline-variant/50 bg-white p-2 text-center">
      <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full ${colorClass}`}>
        <Icon name={icon} className="text-[14px]" filled />
      </div>
      <p className="mt-1 text-base font-bold text-qbit-on-surface">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-qbit-on-surface-variant">{label}</p>
    </div>
  );
}

function QuickActionTile({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-qbit-outline-variant/50 bg-white p-2.5 text-center transition-all active:bg-qbit-surface-container-low"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
        <Icon name={icon} className="text-[18px]" filled />
      </div>
      <span className="text-[10px] font-medium text-qbit-on-surface">{label}</span>
    </button>
  );
}

function BottomNavItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative flex flex-col items-center gap-0.5 py-2.5 " +
        (active ? "text-qbit-primary" : "text-qbit-on-surface-variant")
      }
    >
      <Icon name={icon} className="text-[22px]" filled={active} />
      <span className="text-[10px] font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-1/4 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-qbit-error px-1 text-[9px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function uniqueCustomers(orders: WorkOrderCardDTO[]) {
  const map = new Map<string, { name: string; address: string; jobCount: number }>();
  for (const o of orders) {
    const existing = map.get(o.customerName);
    if (existing) existing.jobCount += 1;
    else map.set(o.customerName, { name: o.customerName, address: o.address, jobCount: 1 });
  }
  return Array.from(map.values()).sort((a, b) => b.jobCount - a.jobCount);
}
