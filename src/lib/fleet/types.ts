/**
 * Enterprise Fleet Manager — type definitions.
 */

import type { DeviceType } from "@/lib/drqbit/types";

/** Fleet grouping type. */
export type GroupByType =
  | "customer" | "company" | "branch" | "city" | "state"
  | "device_type" | "brand" | "model" | "engineer" | "status";

/** Fleet device status (aggregated from passport + driver + firmware). */
export type FleetDeviceStatus =
  | "online" | "offline" | "unknown" | "attention_required"
  | "driver_update" | "firmware_update" | "out_of_warranty" | "recently_scanned";

/** Fleet filters. */
export interface FleetFilters {
  customerId?: string;
  branchId?: string;
  status?: FleetDeviceStatus;
  deviceType?: string;
  brand?: string;
  model?: string;
  engineerId?: string;
  warrantyStatus?: string;
  firmwareVersion?: string;
  driverVersion?: string;
  connectionType?: string;
  search?: string;
}

/** Fleet device DTO — aggregated from DevicePassport + related tables. */
export interface FleetDeviceDTO {
  id: string;
  passportNumber: string;
  deviceName: string | null;
  model: string | null;
  brand: string | null;
  serialNumber: string | null;
  deviceType: string | null;
  connectionType: string | null;
  deviceStatus: string;
  fleetStatus: FleetDeviceStatus;
  // Customer + branch
  customerName: string | null;
  companyName: string | null;
  branchName: string | null;
  branchCity: string | null;
  branchState: string | null;
  // Engineer
  assignedEngineerName: string | null;
  // Health
  driverStatus: string | null;
  firmwareStatus: string | null;
  warrantyStatus: string | null;
  warrantyDaysRemaining: number | null;
  overallHealthScore: number | null;
  // Timestamps
  lastScannedAt: string | null;
  lastTestedAt: string | null;
  warrantyExpiry: string | null;
}

/** Fleet stats DTO. */
export interface FleetStatsDTO {
  totalDevices: number;
  online: number;
  offline: number;
  unknown: number;
  attentionRequired: number;
  driverUpdateAvailable: number;
  firmwareUpdateAvailable: number;
  outOfWarranty: number;
  recentlyScanned: number;
  // By device type
  byDeviceType: Record<string, number>;
  // By status
  byStatus: Record<string, number>;
}

/** Fleet analytics DTO. */
export interface FleetAnalyticsDTO {
  mostInstalledDevices: Array<{ deviceType: string; count: number }>;
  mostCommonIssues: Array<{ issue: string; count: number }>;
  mostActiveEngineers: Array<{ engineerName: string; deviceCount: number; scanCount: number }>;
  mostServicedProducts: Array<{ productName: string; count: number }>;
  warrantyExpiringSoon: number;
  totalCustomers: number;
  totalBranches: number;
}

/** Fleet report DTO. */
export interface FleetReportDTO {
  id: string;
  reportNumber: string;
  reportType: string;
  filters: string | null;
  totalDevices: number;
  healthyDevices: number;
  offlineDevices: number;
  attentionDevices: number;
  warrantyExpiring: number;
  generatedByName: string | null;
  exportFormat: string;
  generatedAt: string;
}

/** Status badge variant per fleet status. */
export const FLEET_STATUS_VARIANTS: Record<
  FleetDeviceStatus,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  online: "success",
  offline: "error",
  unknown: "neutral",
  attention_required: "warning",
  driver_update: "warning",
  firmware_update: "warning",
  out_of_warranty: "error",
  recently_scanned: "info",
};

/** Human-readable label per fleet status. */
export const FLEET_STATUS_LABELS: Record<FleetDeviceStatus, string> = {
  online: "Online",
  offline: "Offline",
  unknown: "Unknown",
  attention_required: "Attention Required",
  driver_update: "Driver Update Available",
  firmware_update: "Firmware Update Available",
  out_of_warranty: "Out of Warranty",
  recently_scanned: "Recently Scanned",
};

/** Material Symbol icon per fleet status. */
export const FLEET_STATUS_ICONS: Record<FleetDeviceStatus, string> = {
  online: "cloud_done",
  offline: "cloud_off",
  unknown: "help_outline",
  attention_required: "warning",
  driver_update: "settings_input_component",
  firmware_update: "system_update",
  out_of_warranty: "gpp_bad",
  recently_scanned: "qr_code_scanner",
};
