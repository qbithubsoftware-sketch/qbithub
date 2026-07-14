/**
 * Customer Live Tracking Portal — type definitions.
 *
 * Public-facing types (no internal fields, no pricing, no admin PII).
 */

import type { WorkOrderStatus, WorkOrderType } from "@/lib/fsm/types";

/** Public tracking view returned to the customer. */
export interface PublicTrackingView {
  // Job identification
  jobNumber: string;
  workType: WorkOrderType;
  workTypeLabel: string;
  status: WorkOrderStatus;
  statusLabel: string;

  // Customer (sanitized — no full address)
  customerName: string;
  companyName: string | null;

  // Product
  productName: string | null;
  model: string | null;
  serialNumber: string | null;
  warrantyStatus: string | null;
  warrantyExpiry: string | null;
  firmwareVersion: string | null;
  driverVersion: string | null;

  // Schedule
  scheduledDate: string;
  scheduledTime: string | null;
  estimatedMinutes: number;

  // Engineer (sanitized — name + masked phone only)
  engineerName: string | null;
  engineerPhone: string | null;
  engineerInitials: string | null;
  engineerPhotoUrl: string | null;

  // Support
  supportPhone: string;
  supportEmail: string;

  // Progress
  progressPercent: number;
  milestones: Array<{
    status: WorkOrderStatus;
    label: string;
    description: string | null;
    occurredAt: string | null;
    done: boolean;
    isCurrent: boolean;
  }>;

  // Timeline (filtered to public events only)
  timeline: Array<{
    label: string;
    description: string | null;
    occurredAt: string;
  }>;

  // Completion (only set if status === 'completed')
  completion: {
    completedAt: string;
    reportAvailable: boolean;
    feedbackSubmitted: boolean;
  } | null;

  // Resource links (for customer actions)
  installationGuideUrl: string | null;
  manualUrl: string | null;
  driverDownloadUrl: string | null;
  firmwareDownloadUrl: string | null;
  videoUrl: string | null;

  // Token metadata
  tokenCreatedAt: string;
  tokenViewCount: number;
}

/** Customer feedback submission payload. */
export interface FeedbackSubmission {
  overallRating: number; // 1-5
  punctualityRating?: number;
  professionalismRating?: number;
  qualityRating?: number;
  communicationRating?: number;
  comment?: string;
  recommendImprovement?: string;
  wouldRecommend?: boolean;
  customerName?: string;
}

/** Stored feedback record (returned after submission). */
export interface FeedbackRecord extends FeedbackSubmission {
  id: string;
  workOrderId: string;
  submittedAt: string;
}

/** Engineer rating aggregate (public-facing). */
export interface EngineerRatingPublic {
  engineerName: string;
  totalRatings: number;
  averageRating: number;
  lastRatingAt: string | null;
}

/** Material Symbol icon per work type. */
export const WORK_TYPE_ICONS: Record<WorkOrderType, string> = {
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

/**
 * Computes progress percentage from current status.
 * Returns 0-100 based on position in PROGRESS_STATUSES array.
 */
export function computeProgressPercent(status: WorkOrderStatus): number {
  const PROGRESS_STATUSES: WorkOrderStatus[] = [
    "pending",
    "accepted",
    "on_the_way",
    "arrived",
    "installing",
    "testing",
    "completed",
  ];
  const idx = PROGRESS_STATUSES.indexOf(status);
  if (idx < 0) return 0; // cancelled / rescheduled = 0
  return Math.round(((idx + 1) / PROGRESS_STATUSES.length) * 100);
}

/**
 * Generates a cryptographically secure URL-safe random token.
 * 24 bytes of entropy → 32 base64url chars (no padding).
 */
export function generateTrackingToken(): string {
  const bytes = new Uint8Array(24);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback (should never run in Node 18+ / browsers)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  // Convert to base64url (no padding)
  const b64 = Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Returns masked phone for public display: +91 98765 43210 → +91 98765 4XXXX */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  // Keep country code + first 5 digits, mask last 4
  const visible = phone.slice(0, -4);
  return visible + "XXXX";
}

/** Returns engineer initials from full name: "Alex Chen" → "AC" */
export function getInitials(name: string | null): string | null {
  if (!name) return null;
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
