"use client";

/**
 * EngineerActions — action buttons for a work order.
 *
 * Renders the correct set of actions based on the work order's current status.
 * Calls onClick with the action verb (matches the PATCH /api/fsm/work-orders/[id] API).
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { type WorkOrderStatus } from "@/lib/fsm/types";

interface EngineerActionsProps {
  status: WorkOrderStatus;
  customerPhone?: string | null;
  workOrderJobNumber?: string;
  /** Fired when an action is clicked. */
  onAction?: (action: string) => void;
  /** Open Dr. QBIT (navigates to AI support). */
  onOpenDrQbit?: () => void;
  /** Navigate to customer location. */
  onNavigate?: () => void;
}

interface ActionDef {
  label: string;
  icon: string;
  action: string;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
}

/** Returns the ordered list of actions for a given status. */
function actionsForStatus(status: WorkOrderStatus): ActionDef[] {
  switch (status) {
    case "pending":
      return [
        { label: "Accept", icon: "check_circle", action: "accept", variant: "primary" },
        { label: "Reject", icon: "cancel", action: "reject", variant: "outline" },
      ];
    case "accepted":
      return [
        { label: "On The Way", icon: "directions_car", action: "on_the_way", variant: "primary" },
        { label: "Reschedule", icon: "schedule", action: "reschedule", variant: "outline" },
      ];
    case "on_the_way":
      return [
        { label: "Arrived", icon: "place", action: "arrived", variant: "primary" },
      ];
    case "arrived":
      return [
        { label: "Start Installing", icon: "build", action: "start", variant: "primary" },
      ];
    case "installing":
      return [
        { label: "Start Testing", icon: "science", action: "testing", variant: "primary" },
      ];
    case "testing":
      return [
        { label: "Complete Job", icon: "task_alt", action: "complete", variant: "primary" },
      ];
    case "completed":
    case "cancelled":
    case "rescheduled":
      return [];
  }
}

export function EngineerActions({
  status,
  customerPhone,
  workOrderJobNumber,
  onAction,
  onOpenDrQbit,
  onNavigate,
}: EngineerActionsProps) {
  const primaryActions = actionsForStatus(status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status-driven primary actions */}
      {primaryActions.map((a) => (
        <QbitButton
          key={a.action}
          variant={a.variant ?? "primary"}
          size="sm"
          icon={a.icon}
          onClick={() => onAction?.(a.action)}
        >
          {a.label}
        </QbitButton>
      ))}

      {/* Always-available utility actions */}
      {onNavigate && (
        <QbitButton variant="ghost" size="sm" icon="near_me" onClick={onNavigate}>
          Navigate
        </QbitButton>
      )}

      {customerPhone && (
        <>
          <a href={`tel:${customerPhone}`} className="inline-flex">
            <QbitButton variant="ghost" size="sm" icon="call">
              Call
            </QbitButton>
          </a>
          <a
            href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
              `Hello, this is your QBIT engineer regarding job ${workOrderJobNumber ?? ""}.`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <QbitButton variant="ghost" size="sm" icon="chat">
              WhatsApp
            </QbitButton>
          </a>
        </>
      )}

      {onOpenDrQbit && (
        <QbitButton variant="surface" size="sm" icon="smart_toy" onClick={onOpenDrQbit}>
          Dr. QBIT
        </QbitButton>
      )}
    </div>
  );
}

export { Icon };
