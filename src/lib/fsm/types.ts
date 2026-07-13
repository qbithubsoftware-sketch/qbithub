/**
 * Field Service Management — type definitions.
 *
 * Strict TypeScript types mirroring the Prisma FSM models.
 * Never includes any sales/price/commission/invoice fields.
 */

/** All work order types supported by QBIT FSM. */
export type WorkOrderType =
  | "installation"
  | "reinstallation"
  | "relocation"
  | "driver_installation"
  | "firmware_update"
  | "troubleshooting"
  | "inspection"
  | "training"
  | "device_health_check";

/** Lifecycle status of a work order. */
export type WorkOrderStatus =
  | "pending"
  | "accepted"
  | "on_the_way"
  | "arrived"
  | "installing"
  | "testing"
  | "completed"
  | "cancelled"
  | "rescheduled";

/** Priority of a work order. */
export type JobPriority = "low" | "normal" | "high" | "urgent";

/** Photo category — bucket of the captured image. */
export type PhotoCategory =
  | "before"
  | "setup"
  | "cables"
  | "after"
  | "issue";

/** Outbound notification channel. */
export type NotificationChannel = "email" | "whatsapp" | "sms";

/** Notification templates fired during the job lifecycle. */
export type NotificationTemplate =
  | "job_assigned"
  | "engineer_accepted"
  | "engineer_on_the_way"
  | "installation_started"
  | "installation_completed"
  | "relocation_completed"
  | "service_completed";

/** Public-facing customer view (no internal/engineer PII beyond name + phone). */
export interface PublicCustomerView {
  jobNumber: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  scheduledDate: string; // ISO
  scheduledTime: string | null;
  engineerName: string | null;
  engineerPhone: string | null;
  productName: string | null;
  model: string | null;
  serialNumber: string | null;
  warrantyStatus: string | null;
  warrantyExpiry: string | null;
  timeline: Array<{
    label: string;
    description: string | null;
    occurredAt: string;
    done: boolean;
  }>;
}

/** Engineer-facing work order summary (dashboard card). */
export interface WorkOrderCardDTO {
  id: string;
  jobNumber: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: JobPriority;
  customerName: string;
  companyName: string | null;
  address: string;
  productName: string | null;
  model: string | null;
  scheduledDate: string;
  scheduledTime: string | null;
  estimatedMinutes: number;
  isDelayed: boolean;
}

/** Full work order detail (for detail page). */
export interface WorkOrderDetailDTO extends WorkOrderCardDTO {
  publicTrackingCode: string;
  customerId: string;
  customerPhone: string;
  customerEmail: string | null;
  geoLat: number | null;
  geoLng: number | null;
  assignedEngineerId: string | null;
  assignedEngineerName: string | null;
  assetId: string | null;
  serialNumber: string | null;
  qrCode: string | null;
  purchaseDate: string | null;
  warrantyStatus: string | null;
  warrantyExpiry: string | null;
  firmwareVersion: string | null;
  driverVersion: string | null;
  description: string | null;
  startedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
}

/** Timeline entry returned to UI. */
export interface TimelineEntryDTO {
  id: string;
  status: WorkOrderStatus;
  label: string;
  description: string | null;
  actorName: string | null;
  occurredAt: string;
}

/** Human-readable label for a work order type. */
export const WORK_ORDER_TYPE_LABELS: Record<WorkOrderType, string> = {
  installation: "Installation",
  reinstallation: "Reinstallation",
  relocation: "Relocation",
  driver_installation: "Driver Installation",
  firmware_update: "Firmware Update",
  troubleshooting: "Troubleshooting",
  inspection: "Inspection",
  training: "Training",
  device_health_check: "Device Health Check",
};

/** Material Symbol icon for each work order type. */
export const WORK_ORDER_TYPE_ICONS: Record<WorkOrderType, string> = {
  installation: "build_circle",
  reinstallation: "restart_alt",
  relocation: "local_shipping",
  driver_installation: "settings_input_component",
  firmware_update: "system_update",
  troubleshooting: "bug_report",
  inspection: "fact_check",
  training: "school",
  device_health_check: "health_and_safety",
};

/** Human-readable status label. */
export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  on_the_way: "Engineer On The Way",
  arrived: "Arrived",
  installing: "Installing",
  testing: "Testing",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

/** Tailwind class mapping for each status (badge colour). */
export const WORK_ORDER_STATUS_BADGES: Record<
  WorkOrderStatus,
  "success" | "warning" | "error" | "info" | "primary" | "neutral"
> = {
  pending: "warning",
  accepted: "info",
  on_the_way: "primary",
  arrived: "primary",
  installing: "info",
  testing: "info",
  completed: "success",
  cancelled: "error",
  rescheduled: "neutral",
};

/** Human-readable priority label. */
export const PRIORITY_LABELS: Record<JobPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

/** Tailwind class for priority indicator (TagBadge-compatible — no "info"). */
export const PRIORITY_BADGES: Record<
  JobPriority,
  "neutral" | "primary" | "secondary" | "error"
> = {
  low: "neutral",
  normal: "primary",
  high: "secondary",
  urgent: "error",
};

/**
 * Ordered list of statuses that represent forward progress.
 * Used to draw the customer-visible timeline as a checklist.
 */
export const PROGRESS_STATUSES: WorkOrderStatus[] = [
  "pending",
  "accepted",
  "on_the_way",
  "arrived",
  "installing",
  "testing",
  "completed",
];

/**
 * Returns the timeline label for a given status (customer-facing copy).
 */
export function customerLabelForStatus(status: WorkOrderStatus): string {
  switch (status) {
    case "pending":
      return "Job Assigned";
    case "accepted":
      return "Engineer Accepted";
    case "on_the_way":
      return "Engineer On The Way";
    case "arrived":
      return "Engineer Arrived";
    case "installing":
      return "Installation Started";
    case "testing":
      return "Testing";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "rescheduled":
      return "Rescheduled";
  }
}

/**
 * Returns true if the work order is in a "delayed" state — scheduled in the
 * past but not yet completed/cancelled.
 */
export function isWorkOrderDelayed(
  scheduledDate: string | Date,
  status: WorkOrderStatus,
  now: Date = new Date(),
): boolean {
  if (status === "completed" || status === "cancelled" || status === "rescheduled") {
    return false;
  }
  return new Date(scheduledDate).getTime() < now.getTime();
}

/** Maps a Prisma WorkOrder row to the dashboard card DTO. */
export function toWorkOrderCardDTO(
  wo: {
    id: string;
    jobNumber: string;
    type: string;
    status: string;
    priority: string;
    scheduledDate: Date;
    scheduledTime: string | null;
    estimatedMinutes: number;
    description: string | null;
    customer: { name: string; companyName: string | null; addressLine: string };
    asset: { productName: string | null; model: string | null } | null;
  },
  now: Date = new Date(),
): WorkOrderCardDTO {
  return {
    id: wo.id,
    jobNumber: wo.jobNumber,
    type: wo.type as WorkOrderType,
    status: wo.status as WorkOrderStatus,
    priority: wo.priority as JobPriority,
    customerName: wo.customer.name,
    companyName: wo.customer.companyName,
    address: wo.customer.addressLine,
    productName: wo.asset?.productName ?? null,
    model: wo.asset?.model ?? null,
    scheduledDate: wo.scheduledDate.toISOString(),
    scheduledTime: wo.scheduledTime,
    estimatedMinutes: wo.estimatedMinutes,
    isDelayed: isWorkOrderDelayed(wo.scheduledDate, wo.status as WorkOrderStatus, now),
  };
}
