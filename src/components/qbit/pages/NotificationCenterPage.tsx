"use client";

/**
 * NotificationCenterPage — unified inbox for admin + engineer + support.
 *
 * Shows in-app notifications with filter tabs (All / Unread / Archived),
 * bulk actions (mark-read, archive), and unread count badge.
 *
 * Reuses: AppShell (variant=field for engineers, variant=admin for admins),
 * NOTIFICATION_NAV (admin) / FSM_NAV (engineer), NotificationCard, KpiCard.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { NotificationCard, type NotificationItem } from "@/components/qbit/notifications";
import { FSM_NAV, NOTIFICATION_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";

type FilterTab = "all" | "unread" | "archived";

export function NotificationCenterPage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?filter=${filter}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { items: NotificationItem[]; unreadCount: number };
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      toast({
        title: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-read" }),
    });
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleArchive = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleBulkAction = async (action: "mark-read" | "archive") => {
    if (selected.size === 0) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: Array.from(selected) }),
    });
    setSelected(new Set());
    void fetchNotifications();
    toast({
      title: action === "mark-read" ? "Marked as read" : "Archived",
      description: `${selected.size} notification${selected.size === 1 ? "" : "s"} updated.`,
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const role = user?.role ?? "viewer";
  const isAdmin = role === "administrator";
  const userName = user?.name ?? "User";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      total: items.length,
      unread: items.filter((i) => !i.readAt).length,
      urgent: items.filter((i) => i.priority === "urgent" && !i.readAt).length,
      today: items.filter((i) => new Date(i.createdAt) >= today).length,
    };
  }, [items]);

  return (
    <AppShell
      variant={isAdmin ? "admin" : "field"}
      brand={{ title: "QBIT Hub", tagline: "Notification Center", icon: "notifications" }}
      navItems={isAdmin ? NOTIFICATION_NAV : FSM_NAV}
      activeScreen="notification-center"
      user={{ name: userName, role: isAdmin ? "Administrator" : "Engineer", initials }}
      cta={{ label: "Refresh", icon: "refresh", onClick: () => void fetchNotifications() }}
      topBar={{
        searchPlaceholder: "Search notifications…",
        user: { name: userName, role: isAdmin ? "Administrator" : "Engineer", initials },
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            Notification Center
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Real-time in-app notifications. {unreadCount > 0 && (
              <span className="font-semibold text-qbit-primary">{unreadCount} unread</span>
            )}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total" value={stats.total.toString()} icon="notifications" iconBg="bg-qbit-primary/10 text-qbit-primary" />
          <KpiCard label="Unread" value={stats.unread.toString()} icon="mark_chat_unread" iconBg="bg-qbit-secondary/10 text-qbit-secondary" />
          <KpiCard label="Urgent" value={stats.urgent.toString()} icon="priority_high" iconBg="bg-qbit-error/10 text-qbit-error" />
          <KpiCard label="Today" value={stats.today.toString()} icon="today" iconBg="bg-qbit-tertiary/10 text-qbit-tertiary" />
        </div>

        {/* Filter tabs + bulk actions */}
        <SurfaceCard className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg bg-qbit-surface-container-low p-1">
              {([
                { id: "all", label: "All", count: items.length },
                { id: "unread", label: "Unread", count: stats.unread },
                { id: "archived", label: "Archived", count: items.filter((i) => i.archivedAt).length },
              ] as Array<{ id: FilterTab; label: string; count: number }>).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setFilter(tab.id); setSelected(new Set()); }}
                  className={
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                    (filter === tab.id
                      ? "bg-white text-qbit-primary shadow-sm"
                      : "text-qbit-on-surface-variant hover:text-qbit-on-surface")
                  }
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={
                      "rounded-full px-1.5 text-[10px] font-bold " +
                      (filter === tab.id ? "bg-qbit-primary/10 text-qbit-primary" : "bg-qbit-surface-container-high text-qbit-on-surface-variant")
                    }>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-qbit-on-surface-variant">{selected.size} selected</span>
                <QbitButton variant="ghost" size="sm" icon="check" onClick={() => void handleBulkAction("mark-read")}>
                  Mark Read
                </QbitButton>
                <QbitButton variant="ghost" size="sm" icon="archive" onClick={() => void handleBulkAction("archive")}>
                  Archive
                </QbitButton>
              </div>
            )}
          </div>
        </SurfaceCard>

        {/* Notification list */}
        {loading ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-12 text-center">
            <Icon name="progress_activity" className="mx-auto text-[28px] animate-spin text-qbit-primary" />
            <p className="mt-2 text-sm text-qbit-on-surface-variant">Loading notifications…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
            <Icon name="notifications_off" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
            <p className="mt-3 text-sm font-medium text-qbit-on-surface">
              {filter === "unread" ? "You're all caught up!" : filter === "archived" ? "No archived notifications." : "No notifications yet."}
            </p>
            <p className="text-xs text-qbit-on-surface-variant">
              {filter === "unread" && "New notifications will appear here in real-time."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <div key={n.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(n.id)}
                  onChange={() => toggleSelect(n.id)}
                  className="mt-4 h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary focus:ring-qbit-primary"
                />
                <div className="flex-1">
                  <NotificationCard
                    notification={n}
                    onMarkRead={handleMarkRead}
                    onArchive={handleArchive}
                    onClick={(id) => {
                      if (n.actionUrl?.includes("/api/fsm/work-orders/")) {
                        const woId = n.actionUrl.split("/").pop();
                        navigate("fsm-work-order-detail", { id: woId ?? "" });
                      }
                      if (!n.readAt) void handleMarkRead(id);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin tools */}
        {isAdmin && (
          <SurfaceCard className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-qbit-on-surface">Admin Tools</h3>
            <div className="flex flex-wrap gap-2">
              <QbitButton variant="outline" size="sm" icon="description" onClick={() => navigate("notification-template-manager")}>
                Manage Templates
              </QbitButton>
              <QbitButton variant="outline" size="sm" icon="history" onClick={() => navigate("notification-history")}>
                View Delivery History
              </QbitButton>
              <QbitButton variant="outline" size="sm" icon="schedule" onClick={() => navigate("notification-reminders")}>
                Reminder Schedule
              </QbitButton>
            </div>
          </SurfaceCard>
        )}
      </div>
    </AppShell>
  );
}
