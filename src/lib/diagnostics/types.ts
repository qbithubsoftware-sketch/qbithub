/**
 * AI Diagnostics Engine — type definitions.
 *
 * Strict TypeScript types for diagnostic sessions, findings, recommendations,
 * and health scores. The engine NEVER guesses — only reports confirmed info.
 */

/** Diagnostic category — what aspect of the device is being analyzed. */
export type DiagnosticCategory =
  | "driver"
  | "firmware"
  | "connection"
  | "device_status"
  | "compatibility"
  | "windows";

/** Finding severity. */
export type FindingSeverity = "info" | "warning" | "error" | "critical";

/** Certainty level — the engine NEVER guesses. */
export type CertaintyLevel = "confirmed" | "possible" | "unable_to_confirm";

/** Health grade — based on overall score. */
export type HealthGrade = "excellent" | "good" | "attention" | "critical" | "unknown";

/** Recommendation action type. */
export type RecommendationAction =
  | "download_driver"
  | "download_firmware"
  | "open_manual"
  | "watch_video"
  | "open_troubleshooting"
  | "run_test_print"
  | "restart_spooler"
  | "verify_connection"
  | "power_cycle"
  | "load_paper"
  | "contact_support";

/** Recommendation priority. */
export type RecommendationPriority = "low" | "normal" | "high" | "urgent";

/** Full diagnostic session DTO returned to the UI. */
export interface DiagnosticSessionDTO {
  id: string;
  sessionToken: string;
  passportId: string;
  // Extra fields (populated by the detail API, not the list API)
  passportNumber?: string | null;
  productName?: string | null;
  deviceName?: string | null;
  model?: string | null;
  engineerName: string | null;
  agentVersion: string | null;
  osInfo: string | null;
  hostname: string | null;
  scanDurationMs: number | null;
  overallScore: number;
  healthGrade: HealthGrade;
  driverScore: number;
  firmwareScore: number;
  connectionScore: number;
  deviceStatusScore: number;
  compatibilityScore: number;
  knowledgeScore: number;
  findingsCount: number;
  confirmedCount: number;
  possibleCount: number;
  recommendationsCount: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  // Nested data
  findings: DiagnosticFindingDTO[];
  recommendations: DiagnosticRecommendationDTO[];
}

/** Finding DTO. */
export interface DiagnosticFindingDTO {
  id: string;
  category: DiagnosticCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  certainty: CertaintyLevel;
  evidence: string[] | null;
  kbArticleId: string | null;
  recommendedAction: string | null;
  createdAt: string;
}

/** Recommendation DTO. */
export interface DiagnosticRecommendationDTO {
  id: string;
  findingId: string | null;
  title: string;
  description: string | null;
  actionType: RecommendationAction;
  resourceUrl: string | null;
  resourceScreen: string | null;
  priority: RecommendationPriority;
  createdAt: string;
}

/** Status badge variant per health grade. */
export const HEALTH_GRADE_VARIANTS: Record<
  HealthGrade,
  "success" | "info" | "warning" | "error" | "neutral"
> = {
  excellent: "success",
  good: "info",
  attention: "warning",
  critical: "error",
  unknown: "neutral",
};

/** Human-readable label per health grade. */
export const HEALTH_GRADE_LABELS: Record<HealthGrade, string> = {
  excellent: "Excellent",
  good: "Good",
  attention: "Attention Required",
  critical: "Critical",
  unknown: "Unknown",
};

/** Material Symbol icon per health grade. */
export const HEALTH_GRADE_ICONS: Record<HealthGrade, string> = {
  excellent: "verified",
  good: "check_circle",
  attention: "warning",
  critical: "error",
  unknown: "help_outline",
};

/** Status badge variant per finding severity. */
export const SEVERITY_VARIANTS: Record<
  FindingSeverity,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  info: "info",
  warning: "warning",
  error: "error",
  critical: "error",
};

/** Human-readable label per finding severity. */
export const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  info: "Info",
  warning: "Warning",
  error: "Error",
  critical: "Critical",
};

/** Material Symbol icon per diagnostic category. */
export const CATEGORY_ICONS: Record<DiagnosticCategory, string> = {
  driver: "settings_input_component",
  firmware: "system_update",
  connection: "cable",
  device_status: "print",
  compatibility: "verified_user",
  windows: "desktop_windows",
};

/** Human-readable label per diagnostic category. */
export const CATEGORY_LABELS: Record<DiagnosticCategory, string> = {
  driver: "Driver",
  firmware: "Firmware",
  connection: "Connection",
  device_status: "Device Status",
  compatibility: "Compatibility",
  windows: "Windows Environment",
};

/** Material Symbol icon per recommendation action type. */
export const ACTION_ICONS: Record<RecommendationAction, string> = {
  download_driver: "settings_input_component",
  download_firmware: "system_update",
  open_manual: "menu_book",
  watch_video: "play_circle",
  open_troubleshooting: "build",
  run_test_print: "print",
  restart_spooler: "restart_alt",
  verify_connection: "cable",
  power_cycle: "power_settings_new",
  load_paper: "receipt_long",
  contact_support: "support_agent",
};

/** Human-readable label per certainty level. */
export const CERTAINTY_LABELS: Record<CertaintyLevel, string> = {
  confirmed: "Confirmed",
  possible: "Possible Cause",
  unable_to_confirm: "Unable to Confirm",
};

/** Status badge variant per certainty level. */
export const CERTAINTY_VARIANTS: Record<
  CertaintyLevel,
  "primary" | "neutral" | "error"
> = {
  confirmed: "primary",
  possible: "neutral",
  unable_to_confirm: "neutral",
};

/**
 * Computes health grade from a 0-100 score.
 * Based on documented rules — no guessing.
 */
export function gradeFromScore(score: number): HealthGrade {
  if (score >= 90) return "excellent";
  if (score >= 70) return "good";
  if (score >= 40) return "attention";
  if (score >= 0) return "critical";
  return "unknown";
}
