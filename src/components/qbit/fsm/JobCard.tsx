"use client";

/**
 * JobCard — compact work order card for dashboard lists.
 *
 * Reuses existing primitives: SurfaceCard, Icon, StatusBadge, TagBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type WorkOrderCardDTO,
  type WorkOrderStatus,
  type WorkOrderType,
  PRIORITY_BADGES,
  PRIORITY_LABELS,
  WORK_ORDER_STATUS_BADGES,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_TYPE_ICONS,
  WORK_ORDER_TYPE_LABELS,
} from "@/lib/fsm/types";

interface JobCardProps {
  workOrder: WorkOrderCardDTO;
  onClick?: () => void;
  /** Show the "DELAYED" banner if past scheduled date. */
  showDelayed?: boolean;
}

export function JobCard({ workOrder, onClick, showDelayed = true }: JobCardProps) {
  const scheduled = new Date(workOrder.scheduledDate);
  const isToday = (() => {
    const now = new Date();
    return (
      scheduled.getDate() === now.getDate() &&
      scheduled.getMonth() === now.getMonth() &&
      scheduled.getFullYear() === now.getFullYear()
    );
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-qbit-primary"
    >
      <SurfaceCard hover className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
              <Icon name={WORK_ORDER_TYPE_ICONS[workOrder.type]} className="text-[22px]" filled />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-qbit-primary">
                  {workOrder.jobNumber}
                </span>
                <TagBadge variant="neutral">
                  {WORK_ORDER_TYPE_LABELS[workOrder.type]}
                </TagBadge>
              </div>
              <p className="mt-0.5 truncate text-sm font-semibold text-qbit-on-surface">
                {workOrder.customerName}
              </p>
              <p className="truncate text-xs text-qbit-on-surface-variant">
                {workOrder.companyName ? `${workOrder.companyName} · ` : ""}
                {workOrder.address}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge variant={WORK_ORDER_STATUS_BADGES[workOrder.status]} dot>
              {WORK_ORDER_STATUS_LABELS[workOrder.status]}
            </StatusBadge>
            <TagBadge variant={PRIORITY_BADGES[workOrder.priority]}>
              {PRIORITY_LABELS[workOrder.priority]}
            </TagBadge>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-qbit-on-surface-variant">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Icon name="schedule" className="text-[14px]" />
              {isToday ? "Today" : scheduled.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              {workOrder.scheduledTime ? ` · ${workOrder.scheduledTime}` : ""}
            </span>
            {workOrder.productName && (
              <span className="inline-flex items-center gap-1">
                <Icon name="inventory_2" className="text-[14px]" />
                {workOrder.model ?? workOrder.productName}
              </span>
            )}
          </div>
          {showDelayed && workOrder.isDelayed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-qbit-error/10 px-2 py-0.5 text-xs font-semibold text-qbit-error">
              <Icon name="warning" className="text-[12px]" filled />
              Delayed
            </span>
          )}
        </div>
      </SurfaceCard>
    </button>
  );
}

/** Helper to filter work orders by lifecycle bucket. */
export function bucketWorkOrders(orders: WorkOrderCardDTO[]) {
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
    cancelled: orders.filter((o) => o.status === "cancelled" || o.status === "rescheduled"),
  };
}

export type { WorkOrderStatus, WorkOrderType };
