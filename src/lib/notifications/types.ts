/**
 * Notification Automation Engine — type definitions.
 *
 * Strict TypeScript types for templates, providers, dispatch, and queues.
 * These types are the contract between the dispatcher, providers, and API routes.
 */

/** Supported notification channels. */
export type NotificationChannel = "in_app" | "email" | "whatsapp" | "sms" | "push";

/** Recipient type — drives template selection and routing. */
export type RecipientType = "admin" | "engineer" | "customer";

/** All notification events supported by the engine.
 *
 *  Admin events (7): engineer_accepts, engineer_rejects, job_delayed,
 *    job_completed, relocation_completed, service_completed, customer_feedback.
 *  Engineer events (8): work_order_assigned, job_updated, job_rescheduled,
 *    job_cancelled, customer_changed, priority_changed, reminder_1d, reminder_2h.
 *  Customer events (10): job_assigned, engineer_accepted, engineer_on_the_way,
 *    engineer_arrived, installation_started, installation_completed,
 *    relocation_started, relocation_completed, service_started, service_completed.
 */
export type NotificationEvent =
  // Admin events
  | "engineer_accepts"
  | "engineer_rejects"
  | "job_delayed"
  | "job_completed"
  | "relocation_completed"
  | "service_completed"
  | "customer_feedback"
  // Engineer events
  | "work_order_assigned"
  | "job_updated"
  | "job_rescheduled"
  | "job_cancelled"
  | "customer_changed"
  | "priority_changed"
  | "reminder_engineer_1d"
  | "reminder_engineer_2h"
  | "reminder_engineer_30m"
  // Customer events
  | "customer_job_assigned"
  | "customer_engineer_accepted"
  | "customer_engineer_on_the_way"
  | "customer_engineer_arrived"
  | "customer_installation_started"
  | "customer_installation_completed"
  | "customer_relocation_started"
  | "customer_relocation_completed"
  | "customer_service_started"
  | "customer_service_completed"
  | "customer_reminder_1d"
  | "customer_reminder_2h";

/** Priority of a notification — drives UI treatment + retry aggressiveness. */
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

/** Lifecycle status of a queued message. */
export type QueueStatus = "queued" | "sent" | "failed" | "retried";

/** Lifecycle status of an in-app notification. */
export type InAppStatus = "unread" | "read" | "archived";

/** Reminder offsets supported by the scheduler. */
export const REMINDER_OFFSETS = [
  { minutes: -1440, label: "1 Day Before" },
  { minutes: -120, label: "2 Hours Before" },
  { minutes: -30, label: "30 Minutes Before" },
] as const;

/** Variables available for template substitution. */
export interface TemplateVariables {
  // Customer / recipient
  CustomerName?: string;
  CustomerPhone?: string;
  CustomerEmail?: string;
  // Engineer
  EngineerName?: string;
  EngineerPhone?: string;
  // Job
  JobNumber?: string;
  JobType?: string;
  JobStatus?: string;
  Priority?: string;
  // Schedule
  Date?: string;
  Time?: string;
  ScheduledDate?: string;
  // Product
  ProductName?: string;
  Model?: string;
  SerialNumber?: string;
  // Links
  TrackingURL?: string;
  DashboardURL?: string;
  // Branding
  CompanyName?: string;
  SupportPhone?: string;
  // Misc
  Reason?: string;
  OldDate?: string;
  NewDate?: string;
  Notes?: string;
  FeedbackLink?: string;
  ReportLink?: string;
  [key: string]: string | undefined;
}

/** Request to dispatch a notification. */
export interface DispatchRequest {
  event: NotificationEvent;
  recipientType: RecipientType;
  recipientId?: string; // User.id (for in-app + engineer email)
  recipientContact?: string; // phone or email (for customer WhatsApp/email)
  recipientName?: string;
  workOrderId?: string;
  variables: TemplateVariables;
  /** Override channels — defaults are derived from event + recipient type. */
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
}

/** Result of a dispatch operation — one entry per channel attempted. */
export interface DispatchResult {
  channel: NotificationChannel;
  status: "queued" | "sent" | "failed";
  messageId?: string;
  error?: string;
  logId?: string;
}

/** Provider interface — all providers (Email/WhatsApp/SMS) implement this. */
export interface NotificationProvider<TPayload = unknown> {
  /** Provider identifier — "console" | "sendgrid" | "twilio" | etc. */
  readonly name: string;
  /** Channel this provider serves. */
  readonly channel: NotificationChannel;
  /** Send a payload. Returns provider message ID on success. */
  send(payload: TPayload): Promise<{ messageId: string }>;
  /** Check if the provider is properly configured (env vars present). */
  isConfigured(): boolean;
}

/** Email payload — passed to EmailProvider.send(). */
export interface EmailPayload {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  templateId?: string;
  workOrderId?: string;
  recipientUserId?: string;
}

/** WhatsApp payload — passed to WhatsAppProvider.send(). */
export interface WhatsAppPayload {
  toPhone: string;
  body: string;
  templateName?: string;
  templateId?: string;
  workOrderId?: string;
  recipientUserId?: string;
}

/** SMS payload — passed to SmsProvider.send(). */
export interface SmsPayload {
  toPhone: string;
  body: string;
  templateId?: string;
  workOrderId?: string;
}

/** In-app payload — written directly to Notification table. */
export interface InAppPayload {
  recipientId: string;
  recipientType: RecipientType;
  title: string;
  message: string;
  category?: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  templateId?: string;
  workOrderId?: string;
}

/** Default channel routing per event. */
export const DEFAULT_CHANNEL_ROUTING: Record<NotificationEvent, NotificationChannel[]> = {
  // Admin events → in-app (always) + email for high-priority
  engineer_accepts: ["in_app"],
  engineer_rejects: ["in_app", "email"],
  job_delayed: ["in_app", "email"],
  job_completed: ["in_app"],
  relocation_completed: ["in_app"],
  service_completed: ["in_app"],
  customer_feedback: ["in_app", "email"],
  // Engineer events → in-app (always), email for high-priority
  work_order_assigned: ["in_app", "email"],
  job_updated: ["in_app"],
  job_rescheduled: ["in_app", "email"],
  job_cancelled: ["in_app", "email"],
  customer_changed: ["in_app"],
  priority_changed: ["in_app", "email"],
  reminder_engineer_1d: ["in_app", "email"],
  reminder_engineer_2h: ["in_app"],
  reminder_engineer_30m: ["in_app"],
  // Customer events → WhatsApp (preferred) + email
  customer_job_assigned: ["whatsapp", "email"],
  customer_engineer_accepted: ["whatsapp"],
  customer_engineer_on_the_way: ["whatsapp"],
  customer_engineer_arrived: ["whatsapp"],
  customer_installation_started: ["whatsapp"],
  customer_installation_completed: ["whatsapp", "email"],
  customer_relocation_started: ["whatsapp"],
  customer_relocation_completed: ["whatsapp", "email"],
  customer_service_started: ["whatsapp"],
  customer_service_completed: ["whatsapp", "email"],
  customer_reminder_1d: ["whatsapp", "email"],
  customer_reminder_2h: ["whatsapp"],
};

/** Human-readable label for each event. */
export const EVENT_LABELS: Record<NotificationEvent, string> = {
  engineer_accepts: "Engineer Accepts Job",
  engineer_rejects: "Engineer Rejects Job",
  job_delayed: "Job Delayed",
  job_completed: "Job Completed",
  relocation_completed: "Relocation Completed",
  service_completed: "Service Completed",
  customer_feedback: "Customer Feedback Received",
  work_order_assigned: "Work Order Assigned",
  job_updated: "Job Updated",
  job_rescheduled: "Job Rescheduled",
  job_cancelled: "Job Cancelled",
  customer_changed: "Customer Changed",
  priority_changed: "Priority Changed",
  reminder_engineer_1d: "Engineer Reminder — 1 Day Before",
  reminder_engineer_2h: "Engineer Reminder — 2 Hours Before",
  reminder_engineer_30m: "Engineer Reminder — 30 Minutes Before",
  customer_job_assigned: "Customer: Job Assigned",
  customer_engineer_accepted: "Customer: Engineer Accepted",
  customer_engineer_on_the_way: "Customer: Engineer On The Way",
  customer_engineer_arrived: "Customer: Engineer Arrived",
  customer_installation_started: "Customer: Installation Started",
  customer_installation_completed: "Customer: Installation Completed",
  customer_relocation_started: "Customer: Relocation Started",
  customer_relocation_completed: "Customer: Relocation Completed",
  customer_service_started: "Customer: Service Started",
  customer_service_completed: "Customer: Service Completed",
  customer_reminder_1d: "Customer Reminder — 1 Day Before",
  customer_reminder_2h: "Customer Reminder — 2 Hours Before",
};

/** Channel icons (Material Symbol names). */
export const CHANNEL_ICONS: Record<NotificationChannel, string> = {
  in_app: "notifications",
  email: "mail",
  whatsapp: "chat",
  sms: "sms",
  push: "notifications_active",
};

/** Status badge variant for queue status. */
export const QUEUE_STATUS_VARIANTS: Record<
  QueueStatus,
  "success" | "warning" | "error" | "neutral"
> = {
  queued: "warning",
  sent: "success",
  failed: "error",
  retried: "warning",
};
