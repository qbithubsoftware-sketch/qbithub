/**
 * Dr. QBIT Phase 3 — Cloud Lookup & Intelligent Resource Engine
 *
 * Strict TypeScript types for the Cloud Lookup pipeline.
 * These types are the contract between the API routes, the engine,
 * and the UI components (Phase 4).
 *
 * Phase 3 receives a Verified Device Profile from Phase 2,
 * validates the serial number against the QBIT database, fetches
 * real Product, Customer, Warranty, and Resource data, and builds
 * a complete CloudEnrichedProfile for Phase 4 (Configuration &
 * Provisioning Engine).
 *
 * RULES:
 *   - NO fake/dummy/mock/placeholder data.
 *   - "Not Available" means the database has no record, NOT "we invented a value".
 *   - Only verified serial numbers trigger Cloud Lookup.
 *   - All data comes from the QBIT database — never from third-party APIs.
 */

import type { DeviceConnection, DeviceType, DeviceCapability, IdentificationStatus } from "./types";

// ====================== Step 1 — Input from Phase 2 ======================

/**
 * Verified Device Profile received from Phase 2.
 *
 * This is the ONLY input to the Cloud Lookup Engine.
 * If serialNumber is null/undefined, Cloud Lookup MUST NOT proceed.
 */
export interface CloudLookupInput {
  /** Real serial number extracted from the device. MUST be non-null for Cloud Lookup. */
  serialNumber: string | null;
  /** Identified model name (e.g. "P80 Alpha", "T-800"). Null if unknown. */
  model: string | null;
  /** What kind of device (thermal_printer, barcode_scanner, etc.). */
  deviceType: DeviceType;
  /** How the device is connected (usb, lan, wifi, bluetooth, com). */
  connectionType: DeviceConnection;
  /** Firmware version read from device. Null if unreadable. */
  firmwareVersion: string | null;
  /** Dynamically detected capabilities. */
  capabilities: DeviceCapability[];
  /** Overall identification status from Phase 2. */
  identificationStatus: IdentificationStatus;
  /** USB Vendor ID. Null for non-USB devices. */
  vendorId: string | null;
  /** USB Product ID. Null for non-USB devices. */
  productId: string | null;
  /** Device name from hardware. */
  deviceName: string | null;
  /** Manufacturer name. Null if device didn't report it. */
  manufacturer: string | null;
}

// ====================== Step 2 — Serial Number Validation ======================

/**
 * Serial Number validation result.
 *
 * Three possible outcomes:
 *   - registered:    Device exists in QBIT database (PurchaseRecord or FSMCustomerAsset)
 *   - not_registered: Serial format is valid, but no database record exists
 *   - invalid:       Serial number format or integrity check failed
 */
export type SerialValidationStatus = "registered" | "not_registered" | "invalid";

export interface SerialValidationResult {
  status: SerialValidationStatus;
  /** The serial number that was validated. */
  serialNumber: string;
  /** Source of the registration: "purchase_record" | "fsm_asset" | "device_passport" */
  source: "purchase_record" | "fsm_asset" | "device_passport" | null;
  /** Database record IDs that matched. */
  matchedRecordIds: {
    purchaseRecordId?: string;
    fsmAssetId?: string;
    passportId?: string;
    productId?: string;
    customerId?: string;
  };
  /** Whether duplicate registration was detected (security check). */
  isDuplicateRegistration: boolean;
  /** Validation error message, if any. */
  errorMessage?: string;
}

// ====================== Step 4 — Product Lookup ======================

/**
 * Product information fetched from QbitProduct + related tables.
 *
 * Every field is sourced from the real database.
 * Null means "the database has no value for this field", NOT "unknown default".
 */
export interface CloudProductInfo {
  id: string;
  name: string;
  brand: string;
  model: string;
  deviceType: string;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
  /** Product family (e.g. "T-Series Printers"). Null if not set in product master. */
  productFamily: string | null;
  productSeries: string | null;
  hardwareVersion: string | null;
  firmwareVersion: string | null;
  /** Launch year from product master. Null if not set. */
  launchYear: string | null;
  /** V4 Smart Device Setup capabilities. */
  capabilities: {
    supportsWifi: boolean;
    autoDriverInstall: boolean;
    sdkAvailable: boolean;
    firmwareConfigSupported: boolean;
    connectionTypes: string[];
  };
}

// ====================== Step 5 — Customer Lookup ======================

/**
 * Customer information fetched from the database.
 *
 * For registered devices, this comes from PurchaseRecord.customer
 * or FSMCustomerAsset.customer.
 * "Not Available" means the database has no value — never fake data.
 */
export interface CloudCustomerInfo {
  name: string | null;
  companyName: string | null;
  city: string | null;
  state: string | null;
  /** Dealer or distributor who sold the device. Null if not in the record. */
  dealer: string | null;
  /** Date the device was purchased. Null if not available. */
  purchaseDate: string | null;
  /** Date the device was installed. Null if not recorded. */
  installationDate: string | null;
  /** Engineer assigned to this device. Null if not assigned. */
  assignedEngineer: string | null;
}

// ====================== Step 6 — Warranty Lookup ======================

/**
 * Warranty status — dynamically calculated from database dates.
 *
 * The status is NEVER hardcoded. It's computed from:
 *   warrantyStartDate + warrantyPeriod → warrantyEndDate
 *   Then compared against current date.
 *
 * "unknown" means the database has no warranty dates for this device.
 */
export type WarrantyStatus = "active" | "expired" | "expiring_soon" | "unknown";

export interface CloudWarrantyInfo {
  status: WarrantyStatus;
  startDate: string | null;
  endDate: string | null;
  /** Dynamically calculated: days until warranty expires. Negative = expired. Null = no dates. */
  remainingDays: number | null;
  /** Whether this device has an extended warranty. */
  extendedWarranty: boolean;
  /** Extended warranty expiry date, if applicable. Null = no extension. */
  extendedExpiryDate: string | null;
  /** Warranty provider (e.g. "QBIT Technologies"). Null if not set. */
  provider: string | null;
}

// ====================== Step 7 — Resource Engine ======================

/**
 * Resource type categories — matches the V5 Resource Library taxonomy.
 *
 * Each category contains resources fetched from the Resource +
 * ProductResourceMapping tables, filtered by product ID and visibility.
 */
export type ResourceTypeCategory =
  | "drivers"
  | "firmware"
  | "manuals"
  | "sdk"
  | "videos"
  | "utilities";

/**
 * A single resource item — fetched from the V5 Resource Library.
 *
 * Every field comes from the real Resource table.
 * No placeholder URLs or fake descriptions.
 */
export interface ResourceItem {
  id: string;
  name: string;
  type: string;
  version: string | null;
  description: string | null;
  url: string | null;
  urlType: "storage_key" | "data_url" | "external";
  mimeType: string | null;
  fileSize: number | null;
  originalFileName: string | null;
  checksum: string | null;
  thumbnailUrl: string | null;
  releaseDate: string | null;
  status: string;
  visibility: string;
  /** Operating system this resource targets (e.g. "Windows 11", "Android 13"). */
  targetOs: string | null;
  downloadCount: number;
}

/**
 * All resources for a device, grouped by type category.
 *
 * Each group is an array of ResourceItems filtered by:
 *   - Product ID (from ProductResourceMapping)
 *   - Type category (driver, firmware, manual, sdk, video, utility)
 *   - Visibility (public for guests, employee/engineer/admin for authenticated users)
 *
 * Empty arrays mean "no resources of this type exist in the database
 * for this product" — NOT "we have resources but chose not to show them".
 */
export interface CloudResources {
  drivers: ResourceItem[];
  firmware: ResourceItem[];
  manuals: ResourceItem[];
  sdk: ResourceItem[];
  videos: ResourceItem[];
  utilities: ResourceItem[];
}

// ====================== Step 8 — Compatibility Engine ======================

/**
 * Firmware compatibility check result.
 *
 * Compares the device's current firmware (from Phase 2) against
 * the latest available firmware (from FirmwareRelease table).
 *
 * NEVER auto-starts firmware updates — only reports availability.
 */
export interface FirmwareCompatibilityResult {
  currentFirmware: string | null;
  latestFirmware: string | null;
  latestFirmwareReleaseDate: string | null;
  latestFirmwareDownloadUrl: string | null;
  isCompatible: boolean;
  /** "update_available" | "up_to_date" | "unknown" */
  updateStatus: "update_available" | "up_to_date" | "unknown";
  /** Reason for incompatibility, if applicable. Null if compatible. */
  incompatibilityReason: string | null;
  /** Whether this is a critical/security update. */
  isCritical: boolean;
  /** Whether the release is stable (not beta). */
  isStable: boolean;
}

// ====================== Step 9 — Smart Recommendations ======================

/**
 * Smart recommendation — automatically suggested based on device model.
 *
 * The user does NOT need to manually search — the engine picks the
 * best resource for each category based on:
 *   - Model compatibility
 *   - Latest version
 *   - Stability (prefer stable releases over beta)
 *   - Operating system match (if available from Desktop Agent)
 */
export interface SmartRecommendation {
  category: ResourceTypeCategory;
  /** The recommended resource item. Null if no resources exist for this category. */
  item: ResourceItem | null;
  /** Why this was recommended (e.g. "Latest stable driver for Windows 11"). */
  reason: string;
}

// ====================== Step 10 — Device Timeline ======================

/**
 * Device timeline event — sourced from real database records.
 *
 * Types of events:
 *   - purchase:          From PurchaseRecord
 *   - installation:      From WorkOrder or PurchaseRecord
 *   - warranty_start:    From DeviceWarranty or PurchaseRecord
 *   - warranty_expiry:   Computed from warranty start + period
 *   - firmware_update:   From FirmwareHistory or FirmwareRelease
 *   - service_call:      From WorkOrder
 *   - repair:            From WorkOrder (type = "repair")
 *   - driver_update:     From DriverHistory
 *   - scan:              From ScanSession + DetectedDevice
 */
export type TimelineEventType =
  | "purchase"
  | "installation"
  | "warranty_start"
  | "warranty_expiry"
  | "firmware_update"
  | "service_call"
  | "repair"
  | "driver_update"
  | "scan";

export interface TimelineEvent {
  type: TimelineEventType;
  date: string;
  description: string;
  /** Reference ID in the database (e.g. WorkOrder.id, PurchaseRecord.id). */
  referenceId: string | null;
  /** Actor who performed this event (engineer name, system, etc.). */
  actor: string | null;
}

// ====================== Step 12 — Error Handling ======================

/**
 * Cloud Lookup error — records what went wrong during a specific step.
 *
 * No step silently fails — every error is recorded.
 * Errors are NEVER hidden from the user.
 */
export interface CloudLookupError {
  step: CloudLookupStep;
  /** Human-readable error message (shown to the user). */
  message: string;
  /** Whether this error is recoverable (partial data still available). */
  recoverable: boolean;
  /** Original error object, if available (for debugging). */
  originalError?: string;
  /** ISO-8601 timestamp of when the error occurred. */
  timestamp: string;
}

export type CloudLookupStep =
  | "receive_device_profile"
  | "validate_serial"
  | "fetch_product"
  | "fetch_customer"
  | "fetch_warranty"
  | "fetch_resources"
  | "check_compatibility"
  | "generate_recommendations"
  | "build_timeline"
  | "security_check";

// ====================== Complete Output for Phase 4 ======================

/**
 * Cloud Lookup Result — the complete enriched profile passed to Phase 4.
 *
 * This is the FINAL output of the Cloud Lookup Engine.
 * All data comes from the real QBIT database — no fakes, no mocks.
 *
 * If serial validation returns "not_registered" or "invalid",
 * the result will have:
 *   - device: populated (from Phase 2 input)
 *   - serialValidation: with the correct status
 *   - customer: null (Not Available)
 *   - warranty: null (Not Available)
 *   - resources: may still be populated if product is matched by VID/PID
 *   - recommendations: may still be populated
 *   - timeline: empty array
 */
export interface CloudLookupResult {
  /** Whether the overall Cloud Lookup succeeded (at least partially). */
  success: boolean;
  /** Serial number validation result. */
  serialValidation: SerialValidationResult;
  /** Device identity (from Phase 2 input, enriched with product data). */
  device: {
    serialNumber: string | null;
    model: string | null;
    deviceType: DeviceType;
    connectionType: DeviceConnection;
    productId: string | null;
    productName: string | null;
    productBrand: string | null;
  };
  /** Customer information. Null if device not registered or data unavailable. */
  customer: CloudCustomerInfo | null;
  /** Warranty information. Null if device not registered or no warranty dates. */
  warranty: CloudWarrantyInfo | null;
  /** Product information. Null if no product match in database. */
  product: CloudProductInfo | null;
  /** Model-specific resources grouped by type. Empty arrays if none in database. */
  resources: CloudResources;
  /** Firmware compatibility check result. Null if no product match. */
  firmwareCompatibility: FirmwareCompatibilityResult | null;
  /** Smart recommendations for this device model. */
  recommendations: SmartRecommendation[];
  /** Device timeline events from real database records. Empty if no history. */
  timeline: TimelineEvent[];
  /** Errors encountered during Cloud Lookup. Empty if all steps succeeded. */
  errors: CloudLookupError[];
  /** ISO-8601 timestamp of when this result was generated. */
  lookupTimestamp: string;
  /** Duration of the entire Cloud Lookup in milliseconds. */
  lookupDurationMs: number;
}

// ====================== API Request/Response ======================

/**
 * POST /api/dr-qbit/cloud-lookup request body.
 *
 * Contains the Verified Device Profile from Phase 2.
 * The serialNumber MUST be present for Cloud Lookup to proceed.
 */
export interface CloudLookupRequest {
  /** The Verified Device Profile from Phase 2. */
  deviceProfile: CloudLookupInput;
  /** Optional: engineer/user ID who initiated the lookup (for audit trail). */
  engineerId?: string;
  /** Optional: operating system info from Desktop Agent (for smart recommendations). */
  osInfo?: string;
  /** Optional: preferred language for recommendations (e.g. "en", "hi"). */
  language?: string;
}

/**
 * POST /api/dr-qbit/cloud-lookup response.
 *
 * If serial number is null:
 *   { success: false, serialValidation: { status: "invalid", ... }, ... }
 *
 * If API/database error:
 *   { success: false, errors: [{ step, message, ... }], ... }
 */
export interface CloudLookupResponse extends CloudLookupResult {
  /** Human-readable message for the user (e.g. "Device registered successfully"). */
  message: string;
}

// ====================== Utility Labels ======================

/** Human-readable label per serial validation status. */
export const SERIAL_STATUS_LABELS: Record<SerialValidationStatus, string> = {
  registered: "Registered",
  not_registered: "Not Registered",
  invalid: "Invalid Serial Number",
};

/** Human-readable label per warranty status. */
export const WARRANTY_STATUS_LABELS: Record<WarrantyStatus, string> = {
  active: "Active",
  expired: "Expired",
  expiring_soon: "Expiring Soon",
  unknown: "Not Available",
};

/** Material Symbol icon per warranty status. */
export const WARRANTY_STATUS_ICONS: Record<WarrantyStatus, string> = {
  active: "verified",
  expired: "error",
  expiring_soon: "warning",
  unknown: "help_outline",
};

/** Badge variant per warranty status. */
export const WARRANTY_STATUS_VARIANTS: Record<WarrantyStatus, "success" | "warning" | "error" | "neutral"> = {
  active: "success",
  expired: "error",
  expiring_soon: "warning",
  unknown: "neutral",
};

/** Human-readable label per timeline event type. */
export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  purchase: "Purchase",
  installation: "Installation",
  warranty_start: "Warranty Start",
  warranty_expiry: "Warranty Expiry",
  firmware_update: "Firmware Update",
  service_call: "Service Call",
  repair: "Repair",
  driver_update: "Driver Update",
  scan: "Device Scan",
};

/** Material Symbol icon per timeline event type. */
export const TIMELINE_EVENT_ICONS: Record<TimelineEventType, string> = {
  purchase: "shopping_cart",
  installation: "build",
  warranty_start: "verified",
  warranty_expiry: "schedule",
  firmware_update: "upgrade",
  service_call: "support_agent",
  repair: "handyman",
  driver_update: "system_update",
  scan: "search",
};

/** Human-readable label per resource type category. */
export const RESOURCE_CATEGORY_LABELS: Record<ResourceTypeCategory, string> = {
  drivers: "Drivers",
  firmware: "Firmware",
  manuals: "Manuals & Guides",
  sdk: "SDK",
  videos: "Videos",
  utilities: "Utilities & Tools",
};

/** Material Symbol icon per resource type category. */
export const RESOURCE_CATEGORY_ICONS: Record<ResourceTypeCategory, string> = {
  drivers: "settings_input_component",
  firmware: "memory",
  manuals: "menu_book",
  sdk: "code",
  videos: "videocam",
  utilities: "construction",
};

/**
 * Maps V5 Resource Library type strings to our ResourceTypeCategory.
 *
 * The Resource table uses granular types like "windows_driver", "android_software",
 * "firmware", "sdk", etc. This function maps them to the 6 categories Phase 3 uses.
 */
export function mapResourceTypeToCategory(resourceType: string): ResourceTypeCategory {
  const typeMap: Record<string, ResourceTypeCategory> = {
    // Drivers
    windows_driver: "drivers",
    // Software (treated as driver-like utilities)
    windows_software: "utilities",
    android_software: "utilities",
    linux_software: "utilities",
    // Firmware
    firmware: "firmware",
    // Manuals & Guides
    manual: "manuals",
    installation_guide: "manuals",
    troubleshooting: "manuals",
    // SDK
    sdk: "sdk",
    // Videos
    video: "videos",
    // Utilities & Tools
    browser_utility: "utilities",
    maintenance_tool: "utilities",
    pos_utility: "utilities",
    diagnostic_tool: "utilities",
    configuration_tool: "utilities",
    firmware_tool: "utilities",
    other: "utilities",
  };

  return typeMap[resourceType] ?? "utilities";
}
