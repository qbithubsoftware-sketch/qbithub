/**
 * Firmware Intelligence — type definitions.
 *
 * Strict TypeScript types for firmware detection, comparison, compatibility,
 * and history. Reuses the existing Firmware + Download tables for file storage.
 *
 * SAFETY: Firmware updates NEVER start automatically. This module only
 * detects, compares, and recommends — no auto-flashing.
 */

/** Firmware comparison status. */
export type FirmwareStatus =
  | "healthy"           // installed = latest
  | "update_available"  // installed < latest
  | "unsupported"       // installed version is no longer supported
  | "unknown";          // firmware cannot be read

/** Firmware history event type. */
export type FirmwareEventType =
  | "install"     // initial firmware install
  | "update"      // firmware updated to new version
  | "rollback"    // firmware rolled back to previous version
  | "scan"        // firmware detected during scan
  | "block";      // update blocked by compatibility check

/** Firmware update method. */
export type FirmwareUpdateMethod = "usb" | "lan" | "wifi" | "manual";

/** Compatibility check result. */
export interface CompatibilityResult {
  isCompatible: boolean;
  reasons: string[];
  warnings: string[];
  blocked: boolean;
}

/** Full firmware information DTO returned to the UI. */
export interface FirmwareInfoDTO {
  id: string;
  passportId: string;
  // Installed firmware (never invented — null if not available)
  installedVersion: string | null;
  installedBuildNumber: string | null;
  installedFirmwareDate: string | null;
  installedFirmwareVendor: string | null;
  installedCompatibility: string | null;
  // Latest available
  latestReleaseId: string | null;
  latestVersion: string | null;
  latestReleaseDate: string | null;
  latestDownloadUrl: string | null;
  latestFileSize: number | null;
  latestChecksum: string | null;
  latestReleaseNotes: string | null;
  latestIsCritical: boolean;
  latestIsStable: boolean;
  // Comparison
  firmwareStatus: FirmwareStatus;
  // Safety
  compatibilityChecked: boolean;
  isCompatible: boolean;
  compatibilityReason: string | null;
  // Metadata
  lastCheckedAt: string;
}

/** Firmware release DTO. */
export interface FirmwareReleaseDTO {
  id: string;
  firmwareId: string;
  firmwareName: string;
  version: string;
  buildNumber: string | null;
  releaseDate: string;
  downloadUrl: string | null;
  fileSize: number | null;
  checksum: string | null;
  releaseNotes: string | null;
  isCritical: boolean;
  isLatest: boolean;
  isStable: boolean;
  supportedModels: string[];
  minOsVersion: string | null;
}

/** Firmware history entry DTO. */
export interface FirmwareHistoryDTO {
  id: string;
  eventType: FirmwareEventType;
  oldVersion: string | null;
  newVersion: string | null;
  performedByName: string | null;
  updateMethod: string | null;
  notes: string | null;
  occurredAt: string;
}

/** Status badge variant per firmware status. */
export const FIRMWARE_STATUS_VARIANTS: Record<
  FirmwareStatus,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  healthy: "success",
  update_available: "warning",
  unsupported: "error",
  unknown: "neutral",
};

/** Human-readable label per firmware status. */
export const FIRMWARE_STATUS_LABELS: Record<FirmwareStatus, string> = {
  healthy: "Firmware Healthy",
  update_available: "Update Available",
  unsupported: "Unsupported Version",
  unknown: "Unknown Version",
};

/** Material Symbol icon per firmware status. */
export const FIRMWARE_STATUS_ICONS: Record<FirmwareStatus, string> = {
  healthy: "verified",
  update_available: "system_update",
  unsupported: "block",
  unknown: "help_outline",
};

/** Material Symbol icon per firmware event type. */
export const FIRMWARE_EVENT_ICONS: Record<FirmwareEventType, string> = {
  install: "download",
  update: "upgrade",
  rollback: "undo",
  scan: "qr_code_scanner",
  block: "block",
};

/** Human-readable label per firmware event type. */
export const FIRMWARE_EVENT_LABELS: Record<FirmwareEventType, string> = {
  install: "Firmware Installed",
  update: "Firmware Updated",
  rollback: "Firmware Rolled Back",
  scan: "Firmware Detected",
  block: "Update Blocked",
};

/**
 * Compares two version strings (semver-like).
 * Returns: -1 if a < b, 0 if equal, 1 if a > b.
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map((p) => parseInt(p, 10) || 0);
  const partsB = b.split(".").map((p) => parseInt(p, 10) || 0);
  const maxLen = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLen; i++) {
    const valA = partsA[i] ?? 0;
    const valB = partsB[i] ?? 0;
    if (valA < valB) return -1;
    if (valA > valB) return 1;
  }
  return 0;
}

/**
 * Determines firmware status by comparing installed vs latest version.
 */
export function determineFirmwareStatus(
  installedVersion: string | null,
  latestVersion: string | null,
  unsupportedVersions: string[] = [],
): FirmwareStatus {
  if (!installedVersion) return "unknown";
  if (!latestVersion) return "unknown";

  // Check if installed version is in unsupported list
  if (unsupportedVersions.includes(installedVersion)) {
    return "unsupported";
  }

  const cmp = compareVersions(installedVersion, latestVersion);
  if (cmp === 0) return "healthy";
  if (cmp < 0) return "update_available";
  // installed > latest (shouldn't happen, but treat as healthy)
  return "healthy";
}
