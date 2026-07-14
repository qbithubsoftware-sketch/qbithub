"use client";

/**
 * NotificationCenter — list of outbound notifications sent for a work order.
 *
 * Reuses SurfaceCard + StatusBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";

interface NotificationEntry {
  id: string;
  channel: string;
  template: string;
  recipient: string;
  subject?: string | null;
  body: string;
  status: string;
  sentAt: string;
}

interface NotificationCenterProps {
  notifications: NotificationEntry[];
}

const CHANNEL_ICONS: Record<string, string> = {
  email: "mail",
  whatsapp: "chat",
  sms: "sms",
};

const TEMPLATE_LABELS: Record<string, string> = {
  job_assigned: "Job Assigned",
  engineer_accepted: "Engineer Accepted",
  engineer_on_the_way: "Engineer On The Way",
  installation_started: "Installation Started",
  installation_completed: "Installation Completed",
  relocation_completed: "Relocation Completed",
  service_completed: "Service Completed",
};

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  if (notifications.length === 0) {
    return (
      <SurfaceCard className="p-5">
        <div className="flex items-center gap-2 text-qbit-on-surface-variant">
          <Icon name="notifications_off" className="text-[18px]" />
          <span className="text-sm">No notifications sent yet.</span>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <SurfaceCard key={n.id} className="p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
              <Icon name={CHANNEL_ICONS[n.channel] ?? "notifications"} className="text-[16px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-qbit-on-surface">
                  {TEMPLATE_LABELS[n.template] ?? n.template}
                </span>
                <StatusBadge
                  variant={n.status === "sent" ? "success" : n.status === "failed" ? "error" : "warning"}
                  dot
                >
                  {n.status}
                </StatusBadge>
              </div>
              <p className="mt-0.5 truncate text-xs text-qbit-on-surface-variant">
                To: {n.recipient} · {n.channel.toUpperCase()}
              </p>
              <p className="mt-1 text-xs text-qbit-on-surface">{n.body}</p>
              <p className="mt-1 text-[10px] text-qbit-on-surface-variant">
                {new Date(n.sentAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}
