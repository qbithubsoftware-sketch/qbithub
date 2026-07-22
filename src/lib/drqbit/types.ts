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

// ====================== Phase 2 — Device Identification Engine ======================

/**
 * Identification status after Phase 2 processing.
 *
 * - verified:      Device fully identified (printer confirmed, model known, serial read)
 * - unsupported:   Device detected but NOT a printer/POS — rejected
 * - unknown:       Printer detected but model/identity unknown (limited info)
 * - partial:       Printer identified but some critical fields missing (serial, firmware)
 */
export type IdentificationStatus = "verified" | "unsupported" | "unknown" | "partial";

/**
 * Device capability types — dynamically detected, never hardcoded.
 *
 * Each capability is derived from:
 *   - USB interface class codes
 *   - Bluetooth GATT service availability
 *   - Product database (QbitProduct.capabilities)
 *   - Desktop Agent reports
 *
 * Future device types can add new capabilities without engine changes.
 */
export type DeviceCapability =
  | "usb"
  | "lan"
  | "wifi"
  | "bluetooth"
  | "com_serial"
  | "cash_drawer"
  | "firmware_upgrade"
  | "auto_cutter"
  | "barcode_printing"
  | "label_printing"
  | "receipt_printing"
  | "kitchen_printing"
  | "pos_mode"
  | "scanner_mode"
  | "display_output"
  | "esc_pos_protocol"
  | "snmp_support";

/** Human-readable label per capability. */
export const CAPABILITY_LABELS: Record<DeviceCapability, string> = {
  usb: "USB Connection",
  lan: "Ethernet (LAN)",
  wifi: "Wi-Fi",
  bluetooth: "Bluetooth",
  com_serial: "Serial (COM)",
  cash_drawer: "Cash Drawer",
  firmware_upgrade: "Firmware Upgrade",
  auto_cutter: "Auto Cutter",
  barcode_printing: "Barcode Printing",
  label_printing: "Label Printing",
  receipt_printing: "Receipt Printing",
  kitchen_printing: "Kitchen Printing",
  pos_mode: "POS Mode",
  scanner_mode: "Scanner Mode",
  display_output: "Customer Display Output",
  esc_pos_protocol: "ESC/POS Protocol",
  snmp_support: "SNMP Support",
};

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
  /** Phase 2 enrichment: Firmware version read from device (GATT/USB/Desktop Agent). */
  firmwareVersion?: string;
  /** Phase 2 enrichment: Hardware revision read from device (GATT/USB). */
  hardwareRevision?: string;
  /** Phase 2 enrichment: Software revision read from device (GATT). */
  softwareRevision?: string;
  /** Phase 2 enrichment: Primary USB interface class code (e.g. 0x07 = Printer). */
  interfaceClass?: number;
  /** Phase 2 enrichment: All USB interface class codes detected on the device. */
  interfaceClasses?: number[];
  /** Phase 2 enrichment: Driver name reported by Desktop Agent. */
  driverName?: string;
  /** Phase 2 enrichment: Product name from device descriptor (distinct from deviceName). */
  productName?: string;
}

// ====================== Phase 2 — Identification Core Types ======================

/**
 * Device fingerprint — unique identity signature for matching.
 *
 * Created from device hardware attributes. Used for:
 *   - Fast lookup in HardwareSignature database
 *   - Future cloud matching (Phase 3)
 *   - Device deduplication across scans
 *
 * The fingerprintHash is a deterministic hash of all non-null fields,
 * enabling quick comparison without string matching.
 */
export interface DeviceFingerprint {
  vendorId: string | null;
  productId: string | null;
  /** Primary USB interface class (e.g. 0x07 = Printer, 0xFF = Vendor-Specific). */
  interfaceClass: number | null;
  /** Device name as reported by the hardware/OS. */
  deviceName: string;
  /** How the device communicates with the host. */
  communicationType: DeviceConnection;
  /** Windows driver name (from Desktop Agent). Null for browser-only scans. */
  driverName: string | null;
  /** Deterministic SHA-256-based hash of all non-null fingerprint fields. */
  fingerprintHash: string;
}

/**
 * Complete Device Profile — the verified identity object passed to Phase 3.
 *
 * This is the final output of the Identification Engine. Every field is
 * sourced from REAL hardware data — no mock, placeholder, or fabricated
 * values. Null means "could not be read from the device", NOT "unknown default".
 *
 * Only verified data is forwarded to Phase 3 (Cloud Lookup Engine).
 * If identificationStatus is "unsupported", the profile is still created
 * but marked as rejected — Phase 3 MUST NOT process it.
 */
export interface DeviceProfile {
  /** What kind of device this is (thermal_printer, barcode_scanner, etc.). */
  deviceType: DeviceType;
  /** How the device is connected to the host. */
  connectionType: DeviceConnection;
  /** Device name from hardware descriptor or OS. */
  deviceName: string;
  /** Identified model name (e.g. "P80 Alpha", "BT2 Portable"). Null if unknown. */
  model: string | null;
  /** Manufacturer name from hardware. Null if device didn't report it. */
  manufacturer: string | null;
  /** USB Vendor ID (hex). Null for non-USB devices. */
  vendorId: string | null;
  /** USB Product ID (hex). Null for non-USB devices. */
  productId: string | null;
  /** Port/address where the device is reachable. Null if unavailable. */
  port: string | null;
  /** Real serial number extracted from the device. Null if unreadable. */
  serialNumber: string | null;
  /** Firmware version read from device (GATT/USB/Agent). Null if unreadable. */
  firmwareVersion: string | null;
  /** Hardware revision read from device (GATT/USB). Null if unreadable. */
  hardwareRevision: string | null;
  /** Dynamically detected capabilities — never hardcoded. */
  capabilities: DeviceCapability[];
  /** Overall identification status — determines Phase 3 eligibility. */
  identificationStatus: IdentificationStatus;
  /** Device fingerprint for matching and deduplication. */
  fingerprint: DeviceFingerprint;
  /** ISO-8601 timestamp of when this profile was created. */
  detectionTimestamp: string;
  /** Which source provided the serial number. Null if serial was not read. */
  serialSource: "usb_descriptor" | "bluetooth_gatt" | "desktop_agent" | "firmware_query" | "device_database" | null;
  /** Which method identified the model. Null if model unknown. */
  modelSource: "firmware" | "sdk" | "product_id" | "device_database" | "bluetooth_gatt" | null;
  /** Errors encountered during identification (per step). */
  identificationErrors: IdentificationError[];
}

/**
 * Identification error — records what went wrong during a specific step.
 *
 * Used for debugging, user feedback, and admin review.
 * No step silently fails — every error is recorded.
 */
export interface IdentificationError {
  /** Which Phase 2 step failed. */
  step: "verify" | "fingerprint" | "read_info" | "serial_extraction" | "model_identification" | "capability_detection" | "profile_build";
  /** Human-readable error message. */
  message: string;
  /** Whether this error is recoverable (partial identification possible). */
  recoverable: boolean;
  /** Original error object, if available. */
  originalError?: string;
}

/**
 * Result of the full identification pipeline for a single device.
 *
 * Contains the final Device Profile plus metadata about the identification
 * process itself (which steps succeeded, which were skipped, timing).
 */
export interface IdentificationResult {
  /** The completed (or partially completed) device profile. */
  profile: DeviceProfile;
  /** Steps that completed successfully. */
  completedSteps: string[];
  /** Steps that were skipped (e.g. serial extraction for devices without serial). */
  skippedSteps: string[];
  /** Total identification time in milliseconds. */
  identificationDurationMs: number;
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
