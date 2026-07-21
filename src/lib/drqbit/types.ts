/**
 * Dr. QBIT Device Detection Engine — type definitions.
 *
 * Strict TypeScript types for device discovery, identification, and matching.
 * These types are the contract between the Desktop Agent, the API routes,
 * and the UI components.
 *
 * NOTE: This module is ONLY for device detection + identification.
 * No AI diagnostics, no driver installation, no firmware updates.
 */

/** Supported device connection types. */
export type DeviceConnection = "usb" | "com" | "lan" | "wifi" | "bluetooth";

/** Supported device types (from the brief's Supported Devices list). */
export type DeviceType =
  | "windows_pos"
  | "android_pos"
  | "thermal_printer"
  | "barcode_scanner"
  | "cash_drawer"
  | "customer_display"
  | "label_printer"
  | "kitchen_printer"
  | "kiosk"
  | "weighing_scale"
  | "unknown";

/** Device status after detection. */
export type DeviceStatus = "ready" | "offline" | "unknown" | "unsupported";

/** Scan session status. */
export type ScanStatus = "running" | "completed" | "failed";

/** Material Symbol icon per device type. */
export const DEVICE_TYPE_ICONS: Record<DeviceType, string> = {
  windows_pos: "desktop_windows",
  android_pos: "phone_android",
  thermal_printer: "print",
  barcode_scanner: "barcode_scanner",
  cash_drawer: "point_of_sale",
  customer_display: "monitor",
  label_printer: "label",
  kitchen_printer: "restaurant",
  kiosk: "storefront",
  weighing_scale: "scale",
  unknown: "help_outline",
};

/** Human-readable label per device type. */
export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  windows_pos: "Windows POS",
  android_pos: "Android POS",
  thermal_printer: "Thermal Printer",
  barcode_scanner: "Barcode Scanner",
  cash_drawer: "Cash Drawer",
  customer_display: "Customer Display",
  label_printer: "Label Printer",
  kitchen_printer: "Kitchen Printer",
  kiosk: "Kiosk",
  weighing_scale: "Weighing Scale",
  unknown: "Unknown Device",
};

/** Material Symbol icon per connection type. */
export const CONNECTION_ICONS: Record<DeviceConnection, string> = {
  usb: "usb",
  com: "cable",
  lan: "lan",
  wifi: "wifi",
  bluetooth: "bluetooth",
};

/** Human-readable label per connection type. */
export const CONNECTION_LABELS: Record<DeviceConnection, string> = {
  usb: "USB",
  com: "Serial (COM)",
  lan: "Ethernet (LAN)",
  wifi: "WiFi",
  bluetooth: "Bluetooth",
};

/** Status badge variant per device status. */
export const DEVICE_STATUS_VARIANTS: Record<
  DeviceStatus,
  "success" | "warning" | "error" | "info" | "neutral"
> = {
  ready: "success",
  offline: "error",
  unknown: "warning",
  unsupported: "neutral",
};

/** Payload received from the Desktop Agent after a scan. */
export interface DesktopAgentScanPayload {
  /** Shared secret for authentication. */
  agentSecret: string;
  /** Desktop Agent version. */
  agentVersion?: string;
  /** OS info of the machine that ran the scan. */
  osInfo?: string;
  /** Hostname of the scanning machine. */
  hostname?: string;
  /** Engineer user ID (if agent is linked to an engineer). */
  engineerId?: string;
  engineerName?: string;
  /** Optional customer/work order context. */
  customerId?: string;
  customerName?: string;
  workOrderId?: string;
  /** Scan duration in milliseconds. */
  scanDurationMs?: number;
  /** Detected devices — raw from the agent. */
  devices: RawDetectedDevice[];
}

/** Raw device data as received from the Desktop Agent (before DB insert). */
export interface RawDetectedDevice {
  connectionType: DeviceConnection;
  port?: string;
  deviceName?: string;
  manufacturer?: string;
  brand?: string;
  model?: string;
  hardwareId?: string;
  vendorId?: string;
  productIdCode?: string;
  serialNumber?: string;
  usbVersion?: string;
  osInfo?: string;
  architecture?: string;
  ipAddress?: string;
  macAddress?: string;
  hostname?: string;
  openPorts?: number[];
  signalQuality?: number;
  status?: DeviceStatus;
}

/** Device as returned to the UI (after DB insert + matching). */
export interface DetectedDeviceDTO {
  id: string;
  scanSessionId: string;
  connectionType: DeviceConnection;
  port: string | null;
  deviceName: string | null;
  manufacturer: string | null;
  brand: string | null;
  model: string | null;
  hardwareId: string | null;
  vendorId: string | null;
  productIdCode: string | null;
  serialNumber: string | null;
  usbVersion: string | null;
  osInfo: string | null;
  architecture: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  hostname: string | null;
  openPorts: number[] | null;
  signalQuality: number | null;
  status: DeviceStatus;
  matchedProductId: string | null;
  matchedProductName: string | null;
  matchedProductModel: string | null;
  matchedProductType: DeviceType | null;
  matchConfidence: number | null;
  matchMethod: string | null;
  firstDetectedAt: string;
  lastSeenAt: string;
}

/** Unknown device as returned to the UI. */
export interface UnknownDeviceDTO {
  id: string;
  scanSessionId: string;
  hardwareId: string | null;
  vendorId: string | null;
  productIdCode: string | null;
  deviceName: string | null;
  manufacturer: string | null;
  model: string | null;
  connectionType: DeviceConnection | null;
  port: string | null;
  macAddress: string | null;
  ipAddress: string | null;
  mappedProductId: string | null;
  mappedProductName: string | null;
  mappedAt: string | null;
  mappedByName: string | null;
  firstSeenAt: string;
}

/** Scan session as returned to the UI. */
export interface ScanSessionDTO {
  id: string;
  sessionToken: string;
  engineerId: string | null;
  engineerName: string | null;
  customerName: string | null;
  workOrderId: string | null;
  agentVersion: string | null;
  osInfo: string | null;
  hostname: string | null;
  scanDurationMs: number | null;
  deviceCount: number;
  usbCount: number;
  comCount: number;
  lanCount: number;
  wifiCount: number;
  bluetoothCount: number;
  status: ScanStatus;
  startedAt: string;
  completedAt: string | null;
}

/** Quick action definition for device cards. */
export interface DeviceQuickAction {
  label: string;
  icon: string;
  url?: string;
  screen?: string;
}

/** Returns the quick actions available for a matched device. */
export function getDeviceQuickActions(
  matchedProduct: { driverDownloadUrl?: string | null; manualUrl?: string | null; installationGuideUrl?: string | null; knowledgeBaseUrl?: string | null } | null,
): DeviceQuickAction[] {
  const actions: DeviceQuickAction[] = [
    { label: "View Product", icon: "inventory_2", screen: "product-library" },
  ];

  if (matchedProduct?.driverDownloadUrl) {
    actions.push({ label: "Driver Center", icon: "settings_input_component", url: matchedProduct.driverDownloadUrl });
  } else {
    actions.push({ label: "Driver Center", icon: "settings_input_component", screen: "driver-download-center" });
  }

  if (matchedProduct?.manualUrl) {
    actions.push({ label: "Manual", icon: "menu_book", url: matchedProduct.manualUrl });
  } else {
    actions.push({ label: "Manual", icon: "menu_book", screen: "driver-download-center" });
  }

  if (matchedProduct?.installationGuideUrl) {
    actions.push({ label: "Install Guide", icon: "fact_check", url: matchedProduct.installationGuideUrl });
  } else {
    actions.push({ label: "Install Guide", icon: "fact_check", screen: "installation-center" });
  }

  if (matchedProduct?.knowledgeBaseUrl) {
    actions.push({ label: "Knowledge Base", icon: "library_books", url: matchedProduct.knowledgeBaseUrl });
  } else {
    actions.push({ label: "Knowledge Base", icon: "library_books", screen: "support-kb" });
  }

  return actions;
}
