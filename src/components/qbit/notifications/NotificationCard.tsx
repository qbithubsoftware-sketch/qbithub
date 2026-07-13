"use client";

/**
 * NotificationCard — single in-app notification row.
 *
 * Reuses existing primitives: Icon, StatusBadge.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  readAt?: string | null;
  archivedAt?: string | null;
  workOrderId?: string | null;
  createdAt: string;
}

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onClick?: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  system: "info",
  job: "assignment",
  reminder: "schedule",
  alert: "warning",
};

const PRIORITY_VARIANTS: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "error",
};

export function NotificationCard({
  notification,
  onMarkRead,
  onArchive,
  onClick,
}: NotificationCardProps) {
  const isUnread = !notification.readAt;
  const icon = CATEGORY_ICONS[notification.category] ?? "notifications";

  return (
    <div
      className={
        "rounded-xl border bg-white p-4 transition-all hover:shadow-sm " +
        (isUnread
          ? "border-qbit-primary/30 bg-qbit-primary-fixed/20"
          : "border-qbit-outline-variant/50")
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
            (isUnread
              ? "bg-qbit-primary text-qbit-on-primary"
              : "bg-qbit-surface-container-high text-qbit-on-surface-variant")
          }
        >
          <Icon name={icon} className="text-[18px]" filled={isUnread} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {isUnread && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-qbit-primary" />
                )}
                <h4 className={"text-sm " + (isUnread ? "font-bold" : "font-semibold") + " text-qbit-on-surface truncate"}>
                  {notification.title}
                </h4>
              </div>
              <p className="mt-1 text-xs text-qbit-on-surface-variant line-clamp-2">
                {notification.message}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-qbit-on-surface-variant">
                <span>{formatRelative(notification.createdAt)}</span>
                {notification.priority !== "normal" && (
                  <StatusBadge variant={PRIORITY_VARIANTS[notification.priority] ?? "neutral"}>
                    {notification.priority}
                  </StatusBadge>
                )}
                {notification.actionUrl && notification.actionLabel && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick?.(notification.id);
                    }}
                    className="font-semibold text-qbit-primary hover:underline"
                  >
                    {notification.actionLabel} →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 flex-col gap-1">
          {isUnread && onMarkRead && (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              title="Mark as read"
              className="flex h-7 w-7 items-center justify-center rounded-md text-qbit-on-surface-variant hover:bg-qbit-surface-container-high hover:text-qbit-primary"
            >
              <Icon name="check" className="text-[14px]" />
            </button>
          )}
          {onArchive && (
            <button
              type="button"
              onClick={() => onArchive(notification.id)}
              title="Archive"
              className="flex h-7 w-7 items-center justify-center rounded-md text-qbit-on-surface-variant hover:bg-qbit-surface-container-high hover:text-qbit-error"
            >
              <Icon name="archive" className="text-[14px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
