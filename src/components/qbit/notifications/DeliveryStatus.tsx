"use client";

/**
 * DeliveryStatus — visual indicator for a notification's delivery status.
 *
 * Reuses StatusBadge + Icon.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";

interface DeliveryStatusProps {
  status: "queued" | "sent" | "failed" | "retried" | "read";
  channel?: string;
  attempts?: number;
  lastError?: string | null;
  className?: string;
}

const STATUS_META: Record<
  DeliveryStatusProps["status"],
  { variant: "success" | "warning" | "error" | "neutral" | "info"; icon: string; label: string }
> = {
  queued: { variant: "warning", icon: "hourglass_empty", label: "Queued" },
  sent: { variant: "success", icon: "check_circle", label: "Sent" },
  failed: { variant: "error", icon: "cancel", label: "Failed" },
  retried: { variant: "warning", icon: "refresh", label: "Retried" },
  read: { variant: "info", icon: "drafts", label: "Read" },
};

export function DeliveryStatus({
  status,
  channel,
  attempts,
  lastError,
  className = "",
}: DeliveryStatusProps) {
  const meta = STATUS_META[status] ?? STATUS_META.sent;
  return (
    <div className={"inline-flex items-center gap-2 " + className}>
      <StatusBadge variant={meta.variant} dot icon={meta.icon}>
        {meta.label}
      </StatusBadge>
      {channel && (
        <span className="text-[10px] uppercase tracking-wider text-qbit-on-surface-variant">
          via {channel}
        </span>
      )}
      {attempts !== undefined && attempts > 1 && (
        <span className="text-[10px] text-qbit-on-surface-variant">
          ({attempts} attempts)
        </span>
      )}
      {lastError && status === "failed" && (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-qbit-error" title={lastError}>
          <Icon name="error" className="text-[12px]" />
          {lastError.length > 40 ? lastError.slice(0, 40) + "…" : lastError}
        </span>
      )}
    </div>
  );
}
