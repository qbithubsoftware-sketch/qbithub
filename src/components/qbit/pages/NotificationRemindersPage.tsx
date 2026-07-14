"use client";

/**
 * NotificationRemindersPage — admin view of scheduled reminders.
 *
 * Lists all reminders with status (scheduled, sent, skipped, failed).
 * Shows next-due reminder + countdown.
 */

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { NOTIFICATION_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";

interface ReminderItem {
  id: string;
  workOrderId: string;
  jobNumber: string | null;
  jobType: string | null;
  workOrderStatus: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  customerName: string | null;
  engineerName: string | null;
  recipientType: string;
  recipientContact: string;
  offsetMinutes: number;
  offsetLabel: string;
  channels: string[];
  status: string;
  dueAt: string;
  sentAt: string | null;
}

interface RemindersStats {
  total: number;
  scheduled: number;
  sent: number;
  skipped: number;
  failed: number;
  nextDue: string | null;
}

const STATUS_VARIANTS: Record<string, "success" | "warning" | "error" | "neutral" | "info"> = {
  scheduled: "warning",
  sent: "success",
  skipped: "neutral",
  failed: "error",
  cancelled: "neutral",
};

export function NotificationRemindersPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [stats, setStats] = useState<RemindersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string }>({});

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    try {
      const res = await fetch(`/api/admin/notifications/reminders?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { items: ReminderItem[]; stats: RemindersStats };
      setItems(data.items);
      setStats(data.stats);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchReminders();
  }, [fetchReminders]);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Reminder Schedule", icon: "schedule" }}
      navItems={NOTIFICATION_NAV}
      activeScreen="notification-reminders"
      user={{ name: userName, role: "Administrator", initials }}
      cta={{ label: "Refresh", icon: "refresh", onClick: () => void fetchReminders() }}
      topBar={{ searchPlaceholder: "Search…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            Reminder Schedule
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Automated reminders for engineers (1d / 2h / 30min before) and customers (1d / 2h before).
          </p>
        </div>

        {/* KPI cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <KpiCard label="Total" value={stats.total.toString()} icon="schedule" iconBg="bg-qbit-primary/10 text-qbit-primary" />
            <KpiCard label="Scheduled" value={stats.scheduled.toString()} icon="hourglass_empty" iconBg="bg-qbit-warning/10 text-qbit-warning" />
            <KpiCard label="Sent" value={stats.sent.toString()} icon="check_circle" iconBg="bg-qbit-success/10 text-qbit-success" />
            <KpiCard label="Skipped" value={stats.skipped.toString()} icon="skip_next" iconBg="bg-qbit-surface-container-high text-qbit-on-surface-variant" />
            <KpiCard label="Failed" value={stats.failed.toString()} icon="cancel" iconBg="bg-qbit-error/10 text-qbit-error" />
          </div>
        )}

        {/* Next-due banner */}
        {stats?.nextDue && (
          <div className="rounded-xl border border-qbit-primary/30 bg-qbit-primary-fixed/30 px-5 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Icon name="schedule" className="text-[18px] text-qbit-primary" />
              <span className="font-semibold text-qbit-primary">Next reminder due:</span>
              <span className="text-qbit-on-surface">
                {new Date(stats.nextDue).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-xs text-qbit-on-surface-variant">
                (in {Math.max(0, Math.round((new Date(stats.nextDue).getTime() - Date.now()) / 60_000))} minutes)
              </span>
            </div>
          </div>
        )}

        {/* Filter */}
        <SurfaceCard className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="filter_list" className="text-[18px] text-qbit-on-surface-variant" />
            <select
              value={filter.status ?? ""}
              onChange={(e) => setFilter({ status: e.target.value || undefined })}
              className="rounded-md border border-qbit-outline-variant bg-white px-2 py-1 text-xs"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="skipped">Skipped</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </SurfaceCard>

        {/* Reminders list */}
        {loading ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-12 text-center">
            <Icon name="progress_activity" className="mx-auto text-[28px] animate-spin text-qbit-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
            <Icon name="schedule" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
            <p className="mt-3 text-sm text-qbit-on-surface-variant">No reminders match the filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((r) => (
              <SurfaceCard key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " +
                      (r.recipientType === "engineer"
                        ? "bg-qbit-primary/10 text-qbit-primary"
                        : "bg-qbit-secondary/10 text-qbit-secondary")
                    }>
                      <Icon name={r.recipientType === "engineer" ? "engineering" : "person"} className="text-[20px]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-qbit-primary">{r.jobNumber}</span>
                        <TagBadge variant="neutral">{r.offsetLabel}</TagBadge>
                        <TagBadge variant={r.recipientType === "engineer" ? "primary" : "neutral"}>
                          {r.recipientType}
                        </TagBadge>
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-qbit-on-surface">
                        {r.customerName} · {r.jobType?.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-qbit-on-surface-variant">
                        Engineer: {r.engineerName ?? "—"} · Scheduled: {r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"} at {r.scheduledTime ?? "—"}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        {r.channels.map((c) => (
                          <span key={c} className="inline-flex items-center gap-0.5 text-[10px] text-qbit-on-surface-variant">
                            <Icon name={c === "email" ? "mail" : c === "whatsapp" ? "chat" : "notifications"} className="text-[12px]" />
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge variant={STATUS_VARIANTS[r.status] ?? "neutral"} dot>
                      {r.status}
                    </StatusBadge>
                    <p className="mt-1 text-[10px] text-qbit-on-surface-variant">
                      Due: {new Date(r.dueAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {r.sentAt && (
                      <p className="text-[10px] text-qbit-success">
                        Sent: {new Date(r.sentAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
