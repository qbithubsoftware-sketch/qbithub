"use client";

/**
 * NotificationHistoryPage — admin view of all outbound notifications.
 *
 * Shows NotificationLog with filters (channel, status, recipientRole, date range).
 * Includes aggregate stats.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { DeliveryStatus } from "@/components/qbit/notifications";
import { NOTIFICATION_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";

interface HistoryItem {
  id: string;
  workOrderId: string;
  channel: string;
  templateCode: string;
  recipient: string;
  recipientRole: string;
  subject: string | null;
  body: string;
  status: string;
  attempts: number;
  sentAt: string;
  error: string | null;
  providerName: string | null;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  queued: number;
  byChannel: Record<string, number>;
}

const CHANNEL_ICONS: Record<string, string> = {
  email: "mail",
  whatsapp: "chat",
  in_app: "notifications",
  sms: "sms",
};

export function NotificationHistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ channel?: string; status?: string; recipientRole?: string }>({});

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.channel) params.set("channel", filter.channel);
    if (filter.status) params.set("status", filter.status);
    if (filter.recipientRole) params.set("recipientRole", filter.recipientRole);
    try {
      const res = await fetch(`/api/admin/notifications/history?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { items: HistoryItem[]; stats: Stats };
      setItems(data.items);
      setStats(data.stats);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const successRate = useMemo(() => {
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.sent / stats.total) * 100);
  }, [stats]);

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Notification History", icon: "history" }}
      navItems={NOTIFICATION_NAV}
      activeScreen="notification-history"
      user={{ name: userName, role: "Administrator", initials }}
      cta={{ label: "Refresh", icon: "refresh", onClick: () => void fetchHistory() }}
      topBar={{ searchPlaceholder: "Search…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            Notification Delivery History
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Audit trail of every outbound notification across all channels.
          </p>
        </div>

        {/* KPI cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <KpiCard label="Total Sent" value={stats.total.toString()} icon="mail" iconBg="bg-qbit-primary/10 text-qbit-primary" />
            <KpiCard label="Delivered" value={stats.sent.toString()} icon="check_circle" iconBg="bg-qbit-success/10 text-qbit-success" />
            <KpiCard label="Failed" value={stats.failed.toString()} icon="cancel" iconBg="bg-qbit-error/10 text-qbit-error" />
            <KpiCard label="Success Rate" value={`${successRate}%`} icon="trending_up" iconBg="bg-qbit-tertiary/10 text-qbit-tertiary" />
            <KpiCard label="Queued" value={stats.queued.toString()} icon="hourglass_empty" iconBg="bg-qbit-warning/10 text-qbit-warning" />
          </div>
        )}

        {/* Filters */}
        <SurfaceCard className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="filter_list" className="text-[18px] text-qbit-on-surface-variant" />
            <select
              value={filter.channel ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, channel: e.target.value || undefined }))}
              className="rounded-md border border-qbit-outline-variant bg-white px-2 py-1 text-xs"
            >
              <option value="">All Channels</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="in_app">In-App</option>
              <option value="sms">SMS</option>
            </select>
            <select
              value={filter.status ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value || undefined }))}
              className="rounded-md border border-qbit-outline-variant bg-white px-2 py-1 text-xs"
            >
              <option value="">All Status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>
            <select
              value={filter.recipientRole ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, recipientRole: e.target.value || undefined }))}
              className="rounded-md border border-qbit-outline-variant bg-white px-2 py-1 text-xs"
            >
              <option value="">All Recipients</option>
              <option value="admin">Admin</option>
              <option value="engineer">Engineer</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </SurfaceCard>

        {/* History table */}
        {loading ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-12 text-center">
            <Icon name="progress_activity" className="mx-auto text-[28px] animate-spin text-qbit-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
            <Icon name="history" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
            <p className="mt-3 text-sm text-qbit-on-surface-variant">No notifications match the filter.</p>
          </div>
        ) : (
          <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-qbit-surface-container-low text-xs uppercase tracking-wider text-qbit-on-surface-variant">
                  <tr>
                    <th className="px-3 py-2 text-left">Channel</th>
                    <th className="px-3 py-2 text-left">Recipient</th>
                    <th className="px-3 py-2 text-left">Template</th>
                    <th className="px-3 py-2 text-left">Subject / Body</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-qbit-outline-variant/30 hover:bg-qbit-surface-container-low/50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Icon name={CHANNEL_ICONS[item.channel] ?? "notifications"} className="text-[14px] text-qbit-primary" />
                          <span className="text-xs font-medium">{item.channel}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <p className="font-mono text-xs">{item.recipient}</p>
                          <TagBadge variant="neutral">{item.recipientRole}</TagBadge>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] text-qbit-on-surface-variant">{item.templateCode}</span>
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        {item.subject && <p className="text-xs font-semibold text-qbit-on-surface truncate">{item.subject}</p>}
                        <p className="text-xs text-qbit-on-surface-variant truncate">{item.body}</p>
                      </td>
                      <td className="px-3 py-2">
                        <DeliveryStatus status={item.status as "sent" | "failed" | "queued"} attempts={item.attempts} lastError={item.error} />
                      </td>
                      <td className="px-3 py-2 text-xs text-qbit-on-surface-variant">
                        {new Date(item.sentAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        )}
      </div>
    </AppShell>
  );
}
