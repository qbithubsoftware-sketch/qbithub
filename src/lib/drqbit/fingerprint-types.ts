/**
 * Universal Hardware Fingerprint — Type Definitions
 *
 * This module defines the types for the Universal Hardware Fingerprint
 * System. Every physical printer can be uniquely identified whenever
 * technically possible, using a priority-based detection system that
 * NEVER depends only on Serial Number.
 *
 * Detection Priority (highest to lowest):
 *   1. Chip UID           — MCU/chip unique ID (hardware-burned, unchangeable)
 *   2. Factory Device UUID — Factory-programmed device UUID
 *   3. Ethernet MAC       — Globally unique, burned into NIC
 *   4. Bluetooth MAC      — Globally unique, burned into BT chip
 *   5. USB Serial Number   — Vendor-provided, may be duplicated across models
 *   6. USB Device Instance ID — Windows-specific, unique per port instance
 *   7. Container ID        — Groups functionally related USB devices
 *   8. Device Path         — Physical USB path (changes if port changes)
 *   9. Hardware ID         — Composite hardware ID from Windows
 *   10. Firmware + VID + PID — Combination match (lowest quality)
 *
 * Fingerprint Quality:
 *   - "high":   Chip UID, Factory UUID, or MAC address available
 *   - "medium": USB Device Instance ID or Container ID available
 *   - "low":    Only VID+PID+Serial or Firmware combination available
 *
 * CRITICAL RULES:
 *   - NEVER depend only on Serial Number
 *   - If Serial Number is duplicated, detect and mark it
 *   - Generate a unique Hardware Fingerprint from ALL collected identifiers
 *   - No fake data, no placeholder values, no mock identifiers
 *   - Production-ready, enterprise-grade, modular, and scalable
 */

// ============================================================
// Detection Priority — the ordered list of identifier quality
// ============================================================

/**
 * Detection priority levels for hardware identifiers.
 * Higher number = higher quality = more unique = preferred for matching.
 */
export const DETECTION_PRIORITY = {
  chipUid:              10,  // Highest: MCU unique ID, hardware-burned
  factoryDeviceUuid:     9,  // Factory-programmed UUID
  ethernetMac:           8,  // Ethernet MAC (globally unique)
  bluetoothMac:          7,  // Bluetooth MAC (globally unique)
  usbSerialNumber:       6,  // USB Serial (may be duplicated!)
  usbDeviceInstanceId:   5,  // Windows Device Instance ID
  usbContainerId:        4,  // USB Container ID
  usbDevicePath:         3,  // Device path (changes with port)
  hardwareId:            2,  // Composite hardware ID
  firmwareVidPidCombo:   1,  // Lowest: Firmware+VID+PID combination
} as const;

export type DetectionPriorityKey = keyof typeof DETECTION_PRIORITY;

/**
 * Fingerprint quality classification based on available identifiers.
 */
export type FingerprintQuality = "high" | "medium" | "low";

/**
 * Human-readable label per detection priority key.
 */
export const DETECTION_PRIORITY_LABELS: Record<DetectionPriorityKey, string> = {
  chipUid:              "Chip UID",
  factoryDeviceUuid:    "Factory Device UUID",
  ethernetMac:          "Ethernet MAC Address",
  bluetoothMac:         "Bluetooth MAC Address",
  usbSerialNumber:      "USB Serial Number",
  usbDeviceInstanceId:  "USB Device Instance ID",
  usbContainerId:       "USB Container ID",
  usbDevicePath:        "USB Device Path",
  hardwareId:           "Hardware ID",
  firmwareVidPidCombo:  "Firmware + VID + PID",
};

/**
 * Material Symbol icon per detection priority key.
 */
export const DETECTION_PRIORITY_ICONS: Record<DetectionPriorityKey, string> = {
  chipUid:              "memory",
  factoryDeviceUuid:    "fingerprint",
  ethernetMac:          "lan",
  bluetoothMac:         "bluetooth",
  usbSerialNumber:      "tag",
  usbDeviceInstanceId:  "usb",
  usbContainerId:       "developer_board",
  usbDevicePath:        "cable",
  hardwareId:           "hardware",
  firmwareVidPidCombo:  "info",
};

/**
 * Fingerprint quality label and color for display.
 */
export const FINGERPRINT_QUALITY_DISPLAY: Record<FingerprintQuality, { label: string; color: string; icon: string; description: string }> = {
  high: {
    label: "High Quality",
    color: "text-qbit-success",
    icon: "verified",
    description: "Chip UID, Factory UUID, or MAC address available — device is uniquely identifiable at hardware level",
  },
  medium: {
    label: "Medium Quality",
    color: "text-qbit-warning",
    icon: "warning",
    description: "USB Device Instance ID or Container ID available — unique within this machine but may change across ports",
  },
  low: {
    label: "Low Quality",
    color: "text-qbit-error",
    icon: "error",
    description: "Only VID+PID+Serial or Firmware combination — serial may be duplicated across physical devices",
  },
};

// ============================================================
// Universal Hardware Identity — collected from all sources
// ============================================================

/**
 * Universal Hardware Identity — collected from every available source.
 *
 * This is the complete set of identifiers extracted from a device during
 * scanning. Each field is optional because not all devices expose all
 * identifiers. Null means "could not be read from the device", NOT
 * "unknown default".
 *
 * Sources:
 *   - WebUSB API (browser): VID, PID, Serial, Product, Manufacturer, Configurations
 *   - Desktop Agent (Windows): PNP Device ID, Container ID, Hardware IDs, Driver info
 *   - Bluetooth GATT: MAC, Name, Service UUIDs
 *   - Network: MAC, IP, Hostname
 *   - Firmware queries: Chip UID, Flash ID, Factory UUID
 */
export interface UniversalHardwareIdentity {
  // === Basic Information ===
  manufacturer: string | null;
  productName: string | null;
  model: string | null;
  productCode: string | null;
  firmwareVersion: string | null;
  hardwareRevision: string | null;
  sdkSerialNumber: string | null;

  // === USB Information ===
  vendorId: string | null;         // USB VID (hex, e.g. "0x04B8")
  productId: string | null;        // USB PID (hex, e.g. "0x0202")
  usbDeviceInstanceId: string | null; // Windows USB Device Instance ID
  usbContainerId: string | null;      // USB Container ID
  usbDevicePath: string | null;       // USB device path
  usbPortPath: string | null;         // USB port path
  usbLocationPath: string | null;     // USB location path
  usbInterfaceNumber: number | null;  // USB interface number
  usbBusNumber: number | null;        // USB bus number
  usbAddress: number | null;          // USB address on bus
  usbDeviceClass: string | null;      // USB device class
  usbDeviceSubclass: string | null;   // USB device subclass

  // === Windows Device Information ===
  pnpDeviceId: string | null;
  hardwareIds: string[] | null;      // Array of Hardware IDs
  compatibleIds: string[] | null;    // Array of Compatible IDs
  containerGuid: string | null;
  parentDevice: string | null;
  driverVersion: string | null;
  driverProvider: string | null;
  driverDate: string | null;
  deviceClassGuid: string | null;

  // === Network Information (if available) ===
  ethernetMacAddress: string | null;
  wifiMacAddress: string | null;
  ipAddress: string | null;
  hostname: string | null;

  // === Bluetooth Information ===
  bluetoothMacAddress: string | null;
  bluetoothDeviceAddress: string | null;
  bluetoothName: string | null;

  // === Firmware Information ===
  chipUid: string | null;            // MCU/chip unique ID
  flashId: string | null;            // Flash memory ID
  factoryDeviceUuid: string | null;  // Factory-programmed UUID
  manufacturingBatch: string | null;
  manufacturingDate: string | null;
}

// ============================================================
// Fingerprint Generation — inputs and outputs
// ============================================================

/**
 * Fingerprint generation input — the fields included in the SHA-256 hash.
 *
 * These fields are concatenated in a fixed order and hashed to produce
 * the deterministic Hardware Fingerprint. The order is defined by
 * detection priority (highest priority fields first in the hash).
 */
export interface FingerprintGenerationInput {
  /** Chip UID — highest priority identifier */
  chipUid: string | null;
  /** Factory-programmed device UUID */
  factoryDeviceUuid: string | null;
  /** Ethernet MAC address */
  ethernetMac: string | null;
  /** Bluetooth MAC address */
  bluetoothMac: string | null;
  /** USB Vendor ID */
  vendorId: string | null;
  /** USB Product ID */
  productId: string | null;
  /** USB Serial Number (may be duplicated!) */
  serialNumber: string | null;
  /** USB Device Instance ID */
  usbDeviceInstanceId: string | null;
  /** USB Container ID */
  usbContainerId: string | null;
  /** USB Device Path */
  usbDevicePath: string | null;
  /** Firmware version */
  firmwareVersion: string | null;
}

/**
 * Hardware Fingerprint result — the output of the fingerprint engine.
 */
export interface HardwareFingerprintResult {
  /** SHA-256 hash of all available identifiers (deterministic) */
  fingerprintHash: string;
  /** Generated device UUID (v4) — stable identifier for DB references */
  deviceUuid: string;
  /** Which identifier was selected as primary for matching */
  primaryIdentifier: DetectionPriorityKey;
  /** Quality classification based on available identifiers */
  quality: FingerprintQuality;
  /** Whether any other device in the DB shares the same serial number */
  duplicateSerialDetected: boolean;
  /** Number of non-null identifiers that contributed to the fingerprint */
  identifierCount: number;
  /** List of all identifiers that were actually used in the hash */
  usedIdentifiers: Array<{ key: DetectionPriorityKey; value: string }>;
  /** ISO-8601 timestamp of when this fingerprint was generated */
  generatedAt: string;
}

// ============================================================
// Duplicate Serial Resolution
// ============================================================

/**
 * Result of duplicate serial number detection and resolution.
 *
 * When two or more physical devices share the same Serial Number,
 * this result describes how the system resolves the ambiguity using
 * the Hardware Fingerprint.
 */
export interface DuplicateSerialResolution {
  /** The serial number that is duplicated */
  duplicateSerial: string;
  /** All passports that share this serial number */
  conflictingPassports: Array<{
    passportId: string;
    passportNumber: string;
    hardwareFingerprint: string | null;
    primaryIdentifier: string | null;
    deviceName: string | null;
    manufacturer: string | null;
    model: string | null;
  }>;
  /** Whether the current device's fingerprint uniquely matches one passport */
  resolved: boolean;
  /** The resolved passport ID (if resolved) */
  resolvedPassportId: string | null;
  /** How the resolution was made */
  resolutionMethod: "fingerprint_match" | "primary_identifier_match" | "manual" | null;
}

// ============================================================
// Fingerprint Lookup — search by fingerprint in DB
// ============================================================

/**
 * Result of searching the database by hardware fingerprint.
 *
 * Uses a priority-based lookup: first tries Chip UID, then Factory UUID,
 * then MAC addresses, then Device Instance ID, then Container ID, then
 * fingerprint hash.
 */
export interface FingerprintLookupResult {
  /** Whether a matching passport was found */
  found: boolean;
  /** The matching passport ID */
  passportId: string | null;
  /** The matching passport number */
  passportNumber: string | null;
  /** The passport's hardware fingerprint */
  passportFingerprint: string | null;
  /** Which identifier was used to find the match */
  matchMethod: DetectionPriorityKey | "fingerprint_hash" | null;
  /** Confidence of the match (1.0 for exact, <1.0 for partial) */
  matchConfidence: number;
  /** If no match found, whether the device should be registered as new */
  isNewDevice: boolean;
  /** Any duplicate serial conflict detected during lookup */
  duplicateSerialInfo: DuplicateSerialResolution | null;
}

// ============================================================
// Fingerprint Engine — configuration
// ============================================================

/**
 * Configuration for the fingerprint engine.
 */
export interface FingerprintEngineConfig {
  /** Whether to detect duplicate serials in the DB during fingerprint generation */
  detectDuplicateSerials: boolean;
  /** Whether to generate a device UUID if none exists */
  generateDeviceUuid: boolean;
  /** Minimum number of identifiers required for a "high" quality fingerprint */
  highQualityMinIdentifiers: number;
  /** Minimum number of identifiers required for a "medium" quality fingerprint */
  mediumQualityMinIdentifiers: number;
  /** Whether to log detailed fingerprint generation steps to console */
  verboseLogging: boolean;
}

/**
 * Default configuration for the fingerprint engine.
 */
export const DEFAULT_FINGERPRINT_CONFIG: FingerprintEngineConfig = {
  detectDuplicateSerials: true,
  generateDeviceUuid: true,
  highQualityMinIdentifiers: 3,
  mediumQualityMinIdentifiers: 2,
  verboseLogging: true,
};

// ============================================================
// Utility functions
// ============================================================

/**
 * Determines fingerprint quality based on available identifiers.
 *
 * Quality rules:
 *   - "high":   chipUid, factoryDeviceUuid, ethernetMac, or bluetoothMac available
 *   - "medium": usbDeviceInstanceId or usbContainerId available
 *   - "low":    only serial + VID + PID or firmware combo
 */
export function classifyFingerprintQuality(
  identity: UniversalHardwareIdentity,
): FingerprintQuality {
  // Check for HIGH quality identifiers
  if (
    identity.chipUid ||
    identity.factoryDeviceUuid ||
    identity.ethernetMacAddress ||
    identity.bluetoothMacAddress
  ) {
    return "high";
  }

  // Check for MEDIUM quality identifiers
  if (identity.usbDeviceInstanceId || identity.usbContainerId) {
    return "medium";
  }

  // Only LOW quality identifiers available
  return "low";
}

/**
 * Selects the primary identifier based on detection priority.
 *
 * Scans all available identifiers in priority order and returns
 * the first non-null one as the primary identifier.
 */
export function selectPrimaryIdentifier(
  identity: UniversalHardwareIdentity,
): DetectionPriorityKey {
  // Check in priority order (highest first)
  const priorityChecks: Array<[DetectionPriorityKey, string | null]> = [
    ["chipUid", identity.chipUid],
    ["factoryDeviceUuid", identity.factoryDeviceUuid],
    ["ethernetMac", identity.ethernetMacAddress],
    ["bluetoothMac", identity.bluetoothMacAddress],
    ["usbSerialNumber", identity.sdkSerialNumber],
    ["usbDeviceInstanceId", identity.usbDeviceInstanceId],
    ["usbContainerId", identity.usbContainerId],
    ["usbDevicePath", identity.usbDevicePath],
    ["hardwareId", identity.hardwareIds?.[0] ?? null],
    ["firmwareVidPidCombo", (identity.vendorId && identity.productId && identity.firmwareVersion) ? `${identity.vendorId}:${identity.productId}:${identity.firmwareVersion}` : null],
  ];

  for (const [key, value] of priorityChecks) {
    if (value) {
      return key;
    }
  }

  // Fallback: firmwareVidPidCombo even without firmware (just VID+PID)
  return "firmwareVidPidCombo";
}

/**
 * Counts the number of non-null identifiers in a UniversalHardwareIdentity.
 */
export function countAvailableIdentifiers(identity: UniversalHardwareIdentity): number {
  const fields: Array<string | null | string[] | number[]> = [
    identity.chipUid,
    identity.factoryDeviceUuid,
    identity.ethernetMacAddress,
    identity.bluetoothMacAddress,
    identity.sdkSerialNumber,
    identity.usbDeviceInstanceId,
    identity.usbContainerId,
    identity.usbDevicePath,
    identity.vendorId,
    identity.productId,
    identity.firmwareVersion,
    identity.usbPortPath,
    identity.usbLocationPath,
    identity.pnpDeviceId,
    identity.containerGuid,
    identity.bluetoothDeviceAddress,
    identity.wifiMacAddress,
    identity.hardwareRevision,
    identity.flashId,
    identity.manufacturingBatch,
  ];

  return fields.filter((f) => {
    if (f === null) return false;
    if (Array.isArray(f)) return f.length > 0;
    return true;
  }).length;
}

/**
 * Returns the highest-priority identifier value from the identity.
 */
export function getPrimaryIdentifierValue(
  identity: UniversalHardwareIdentity,
): string | null {
  const key = selectPrimaryIdentifier(identity);
  const mapping: Record<DetectionPriorityKey, string | null> = {
    chipUid: identity.chipUid,
    factoryDeviceUuid: identity.factoryDeviceUuid,
    ethernetMac: identity.ethernetMacAddress,
    bluetoothMac: identity.bluetoothMacAddress,
    usbSerialNumber: identity.sdkSerialNumber,
    usbDeviceInstanceId: identity.usbDeviceInstanceId,
    usbContainerId: identity.usbContainerId,
    usbDevicePath: identity.usbDevicePath,
    hardwareId: identity.hardwareIds?.[0] ?? null,
    firmwareVidPidCombo: (identity.vendorId && identity.productId) ? `${identity.vendorId}:${identity.productId}` : null,
  };
  return mapping[key];
}
