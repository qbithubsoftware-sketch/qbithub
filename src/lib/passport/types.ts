/**
 * Device Passport — type definitions.
 *
 * Strict TypeScript types for the Digital Device Passport, driver intelligence,
 * warranty, and timeline. These types are the contract between the API routes
 * and the UI components.
 */

import type { DeviceConnection, DeviceStatus } from "@/lib/drqbit/types";

/** Device passport status — derived from driver intelligence + scan data. */
export type PassportDeviceStatus =
  | "ready"
  | "driver_missing"
  | "driver_outdated"
  | "unsupported"
  | "unknown";

/** Driver comparison status. */
export type DriverComparisonStatus =
  | "installed"
  | "update_available"
  | "missing"
  | "unsupported";

/** Warranty status. */
export type WarrantyStatus = "active" | "expired" | "void" | "unknown";

/** Driver history event type. */
export type DriverEventType = "install" | "update" | "rollback" | "uninstall" | "scan";

/** Full passport DTO returned to the UI. */
export interface PassportDTO {
  id: string;
  passportNumber: string;
  // Hardware identity
  detectedDeviceId: string | null;
  productId: string | null;
  hardwareId: string | null;
  vendorId: string | null;
  productIdCode: string | null;
  serialNumber: string | null;
  deviceName: string | null;
  manufacturer: string | null;
  brand: string | null;
  model: string | null;
  connectionType: DeviceConnection | null;
  port: string | null;
  usbVersion: string | null;
  osInfo: string | null;
  architecture: string | null;
  macAddress: string | null;
  ipAddress: string | null;
  deviceStatus: PassportDeviceStatus;
  // Product info (from matched QbitProduct)
  product: {
    id: string;
    name: string;
    brand: string;
    manufacturer: string | null;
    model: string;
    deviceType: string;
    description: string | null;
    driverDownloadUrl: string | null;
    manualUrl: string | null;
    installationGuideUrl: string | null;
    knowledgeBaseUrl: string | null;
  } | null;
  // Driver intelligence
  driverInfo: {
    installedDriverName: string | null;
    installedDriverVersion: string | null;
    installedDriverProvider: string | null;
    installedDriverDate: string | null;
    latestDriverVersion: string | null;
    latestDriverReleaseDate: string | null;
    latestDriverDownloadUrl: string | null;
    latestDriverFileSize: number | null;
    latestDriverReleaseNotes: string | null;
    driverStatus: DriverComparisonStatus;
    supportedOses: string[] | null;
    lastCheckedAt: string;
  } | null;
  // Warranty
  warranty: {
    purchaseDate: string | null;
    warrantyStartDate: string | null;
    warrantyExpiryDate: string | null;
    warrantyStatus: WarrantyStatus;
    warrantyDaysRemaining: number | null;
    extendedWarranty: boolean;
    extendedExpiryDate: string | null;
    warrantyProvider: string | null;
  } | null;
  // Timeline
  firstDetectedAt: string;
  lastScannedAt: string | null;
  lastDriverUpdateAt: string | null;
  lastFirmwareUpdateAt: string | null;
  lastInstallationAt: string | null;
  lastServiceAt: string | null;
  // Customer info
  customerAssetId: string | null;
  // Driver history
  driverHistory: Array<{
    id: string;
    eventType: DriverEventType;
    oldVersion: string | null;
    newVersion: string | null;
    driverName: string | null;
    driverProvider: string | null;
    performedByName: string | null;
    notes: string | null;
    occurredAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/** Search query parameters. */
export interface PassportSearchParams {
  q?: string; // general search (serial, model, hardwareId, VID, PID, customer)
  serialNumber?: string;
  model?: string;
  hardwareId?: string;
  vendorId?: string;
  productIdCode?: string;
  deviceStatus?: PassportDeviceStatus;
  limit?: number;
}

/** Status badge variant per passport device status. */
export const PASSPORT_STATUS_VARIANTS: Record<
  PassportDeviceStatus,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  ready: "success",
  driver_missing: "error",
  driver_outdated: "warning",
  unsupported: "neutral",
  unknown: "info",
};

/** Status badge variant per driver comparison status. */
export const DRIVER_STATUS_VARIANTS: Record<
  DriverComparisonStatus,
  "success" | "warning" | "error" | "neutral"
> = {
  installed: "success",
  update_available: "warning",
  missing: "error",
  unsupported: "neutral",
};

/** Status badge variant per warranty status. */
export const WARRANTY_STATUS_VARIANTS: Record<
  WarrantyStatus,
  "success" | "warning" | "error" | "neutral"
> = {
  active: "success",
  expired: "error",
  void: "error",
  unknown: "neutral",
};

/** Human-readable label per passport device status. */
export const PASSPORT_STATUS_LABELS: Record<PassportDeviceStatus, string> = {
  ready: "Ready",
  driver_missing: "Driver Missing",
  driver_outdated: "Driver Outdated",
  unsupported: "Unsupported",
  unknown: "Unknown Device",
};

/** Human-readable label per driver comparison status. */
export const DRIVER_STATUS_LABELS: Record<DriverComparisonStatus, string> = {
  installed: "Up to Date",
  update_available: "Update Available",
  missing: "Driver Missing",
  unsupported: "Not Supported",
};

/** Material Symbol icon per passport device status. */
export const PASSPORT_STATUS_ICONS: Record<PassportDeviceStatus, string> = {
  ready: "check_circle",
  driver_missing: "error",
  driver_outdated: "warning",
  unsupported: "block",
  unknown: "help_outline",
};

/** Quick action definition for passport page. */
export interface PassportQuickAction {
  label: string;
  icon: string;
  url?: string;
  screen?: string;
  variant?: "primary" | "outline" | "ghost";
}
