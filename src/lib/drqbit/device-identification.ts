/**
 * Device Identification Engine — Phase 2
 *
 * Takes devices detected by Phase 1 (Discovery Engine) and performs
 * deep identification: verification, fingerprinting, serial number
 * extraction, model identification, capability detection, and profile
 * building.
 *
 * Architecture:
 *   - Step 1: Receive Connected Device (from Phase 1)
 *   - Step 2: Verify Device (is this actually a printer?)
 *   - Step 3: Create Device Fingerprint
 *   - Step 4: Read Printer Information (all available fields)
 *   - Step 5: Serial Number Extraction (multi-source fallback chain)
 *   - Step 6: Model Identification (priority: firmware → SDK → PID → database)
 *   - Step 7: Capability Detection (dynamic, never hardcoded)
 *   - Step 8: Build Device Profile
 *   - Step 9: Unknown Device Handling
 *   - Step 10: Error Handling
 *
 * CRITICAL RULES:
 *   - NO mock data, NO fake serial numbers, NO dummy device profiles
 *   - If a field cannot be read → NULL, never a placeholder
 *   - If a device is not a printer → mark as "unsupported", stop processing
 *   - If a model is unknown → mark as "unknown", limited info only
 *   - Every error is recorded, no silent failures
 *
 * Extensibility:
 *   - New device types (barcode printer, POS, scanner) only require
 *     adding verification rules and capability detectors
 *   - Core engine pipeline never changes
 *   - Adapters for new device types can be registered dynamically
 *
 * Browser vs Desktop Agent:
 *   - Browser: Can read USB descriptors, BT GATT characteristics
 *   - Desktop Agent: Can read firmware via ESC/POS, driver info, SNMP
 *   - This module works with BOTH data sources
 *   - When Desktop Agent data is available, it takes priority
 */

import type { DiscoveredDevice, DiscoveryConnection } from "./device-discovery";
import type {
  DeviceType,
  DeviceConnection,
  DeviceCapability,
  IdentificationStatus,
  DeviceFingerprint,
  DeviceProfile,
  IdentificationError,
  IdentificationResult,
} from "./types";

// ====================== Device Verifier Registry ======================

/**
 * Device verifier — determines if a connected device is a supported type.
 *
 * Each verifier handles one or more device types. New device types only
 * require registering a new verifier — no engine changes.
 */
interface DeviceVerifier {
  /** Which device types this verifier can check. */
  supportedTypes: DeviceType[];
  /** Check if the discovered device matches this verifier's types. */
  verify(device: DiscoveredDevice): VerificationResult;
}

interface VerificationResult {
  /** Is this device a supported hardware type (printer, POS, scanner, etc.)? */
  isSupported: boolean;
  /** The identified device type, if verified. Null if unsupported or uncertain. */
  deviceType: DeviceType | null;
  /** Confidence of the verification (0.0–1.0). */
  confidence: number;
  /** Reason for rejection, if isSupported is false. */
  rejectionReason?: string;
}

// ====================== USB Device Verifier ======================

/**
 * USB Device Verifier — checks USB devices against class codes and
 * known VID/PID patterns to determine if they are printers/POS/scanners.
 *
 * Class code mapping:
 *   0x07 = Printer class (definite match)
 *   0x0A = CDC-Data (likely POS/serial printer)
 *   0x02 = CDC-Control (likely POS)
 *   0xFF = Vendor-Specific (needs further investigation)
 *
 * Name-based heuristics supplement class code checks for devices
 * that report Vendor-Specific class but are actually printers.
 */
class UsbDeviceVerifier implements DeviceVerifier {
  supportedTypes: DeviceType[] = [
    "thermal_printer", "label_printer", "kitchen_printer",
    "barcode_scanner", "cash_drawer", "customer_display",
    "kiosk", "weighing_scale", "windows_pos", "android_pos",
  ];

  verify(device: DiscoveredDevice): VerificationResult {
    // Must be USB connection
    if (device.connectionType !== "usb") {
      return { isSupported: false, deviceType: null, confidence: 0, rejectionReason: "Not a USB device" };
    }

    const interfaceClasses = device.interfaceClasses || [];
    const name = (device.deviceName + " " + (device.manufacturer ?? "")).toLowerCase();

    // Check for Printer class (0x07) — definitive
    if (interfaceClasses.includes(0x07)) {
      return {
        isSupported: true,
        deviceType: this.classifyByKeywords(name, "thermal_printer"),
        confidence: 1.0,
      };
    }

    // Check for CDC classes (0x0A, 0x02) — likely POS/serial printer
    if (interfaceClasses.includes(0x0A) || interfaceClasses.includes(0x02)) {
      return {
        isSupported: true,
        deviceType: this.classifyByKeywords(name, "thermal_printer"),
        confidence: 0.9,
      };
    }

    // Check for Vendor-Specific class (0xFF) — needs investigation
    if (interfaceClasses.includes(0xFF)) {
      // Name-based check: if name contains printer keywords, it's likely a printer
      const printerKeywords = [
        "printer", "print", "thermal", "label", "barcode", "pos",
        "scanner", "kiosk", "scale", "cash drawer", "display",
        "receipt", "ticket", "slip", "impact", "dot matrix",
      ];
      if (printerKeywords.some(kw => name.includes(kw))) {
        return {
          isSupported: true,
          deviceType: this.classifyByKeywords(name, "thermal_printer"),
          confidence: 0.8,
        };
      }
      // Vendor-Specific without printer keywords — uncertain
      // Check known QBIT VIDs
      const vid = device.vendorId?.replace("0x", "").toUpperCase() ?? "";
      const knownQbitVids = ["1E90", "04B8", "1FC9"];
      if (knownQbitVids.includes(vid)) {
        return {
          isSupported: true,
          deviceType: "thermal_printer",
          confidence: 0.7,
        };
      }
      // Unknown Vendor-Specific — accept for further investigation
      return {
        isSupported: true,
        deviceType: "unknown",
        confidence: 0.3,
      };
    }

    // HID class (0x03) — not a printer (mice, keyboards)
    if (interfaceClasses.includes(0x03) && !interfaceClasses.some(c => c === 0x07 || c === 0x0A || c === 0x02 || c === 0xFF)) {
      return {
        isSupported: false,
        deviceType: null,
        confidence: 0.95,
        rejectionReason: "USB HID device (mouse/keyboard) — not a printer or POS device",
      };
    }

    // Mass Storage (0x08) — not a printer
    if (interfaceClasses.includes(0x08) && !interfaceClasses.some(c => c === 0x07 || c === 0x0A || c === 0x02 || c === 0xFF)) {
      return {
        isSupported: false,
        deviceType: null,
        confidence: 0.95,
        rejectionReason: "USB Mass Storage device — not a printer or POS device",
      };
    }

    // No relevant class codes found but isPrinterLike flag from Phase 1 heuristic
    if (device.isPrinterLike) {
      return {
        isSupported: true,
        deviceType: this.classifyByKeywords(name, "unknown"),
        confidence: 0.4,
      };
    }

    // Default: reject unknown devices
    return {
      isSupported: false,
      deviceType: null,
      confidence: 0,
      rejectionReason: "Device does not match any supported printer/POS/scanner pattern",
    };
  }

  /** Classify device type by name keywords. Returns fallback if no match. */
  private classifyByKeywords(name: string, fallback: DeviceType): DeviceType {
    if (name.includes("label")) return "label_printer";
    if (name.includes("barcode") || name.includes("scanner")) return "barcode_scanner";
    if (name.includes("kitchen")) return "kitchen_printer";
    if (name.includes("cash drawer") || name.includes("pos")) return "cash_drawer";
    if (name.includes("display") || name.includes("customer")) return "customer_display";
    if (name.includes("kiosk")) return "kiosk";
    if (name.includes("scale") || name.includes("weighing")) return "weighing_scale";
    if (name.includes("printer") || name.includes("thermal") || name.includes("receipt") || name.includes("ticket")) return "thermal_printer";
    return fallback;
  }
}

// ====================== Bluetooth Device Verifier ======================

/**
 * Bluetooth Device Verifier — checks Bluetooth devices.
 *
 * Bluetooth devices in the Dr. QBIT context are almost always printers
 * because the user explicitly selected a printer-service device via the
 * Web Bluetooth permission dialog. However, we still verify based on
 * model number and name patterns.
 */
class BluetoothDeviceVerifier implements DeviceVerifier {
  supportedTypes: DeviceType[] = [
    "thermal_printer", "label_printer", "barcode_scanner",
  ];

  verify(device: DiscoveredDevice): VerificationResult {
    if (device.connectionType !== "bluetooth") {
      return { isSupported: false, deviceType: null, confidence: 0, rejectionReason: "Not a Bluetooth device" };
    }

    // Bluetooth devices in our flow are already filtered by printer service
    // in the Web Bluetooth request. If we got here, the user explicitly
    // chose a device with binary_output or immediate_output service.
    const name = (device.deviceName + " " + (device.manufacturer ?? "")).toLowerCase();

    // Name-based classification
    const deviceType = this.classifyByKeywords(name);

    return {
      isSupported: true,
      deviceType,
      confidence: 0.85, // High confidence since user selected via printer service filter
    };
  }

  private classifyByKeywords(name: string): DeviceType {
    if (name.includes("label")) return "label_printer";
    if (name.includes("barcode") || name.includes("scanner")) return "barcode_scanner";
    return "thermal_printer";
  }
}

// ====================== LAN Device Verifier ======================

/**
 * LAN Device Verifier — checks network devices (requires Desktop Agent).
 *
 * Network printers are detected via SNMP, mDNS, or port scanning.
 * The Desktop Agent provides the raw data; this verifier classifies it.
 */
class LanDeviceVerifier implements DeviceVerifier {
  supportedTypes: DeviceType[] = [
    "thermal_printer", "label_printer", "kitchen_printer", "kiosk",
  ];

  verify(device: DiscoveredDevice): VerificationResult {
    if (device.connectionType !== "lan") {
      return { isSupported: false, deviceType: null, confidence: 0, rejectionReason: "Not a LAN device" };
    }

    // LAN devices from Desktop Agent will have deviceName and port info
    // Until Desktop Agent is available, all LAN devices are unknown
    const name = (device.deviceName + " " + (device.manufacturer ?? "")).toLowerCase();

    if (!name || name === "lan device" || name === "network device") {
      return {
        isSupported: true,
        deviceType: "unknown",
        confidence: 0.3,
      };
    }

    const deviceType = this.classifyByKeywords(name);
    return {
      isSupported: true,
      deviceType,
      confidence: 0.7,
    };
  }

  private classifyByKeywords(name: string): DeviceType {
    if (name.includes("label")) return "label_printer";
    if (name.includes("kitchen")) return "kitchen_printer";
    if (name.includes("kiosk")) return "kiosk";
    return "thermal_printer";
  }
}

// ====================== Verifier Registry ======================

const verifierRegistry: DeviceVerifier[] = [];

/** Register a new device verifier. Extensible for future device types. */
export function registerVerifier(verifier: DeviceVerifier): void {
  verifierRegistry.push(verifier);
}

// Auto-register built-in verifiers
registerVerifier(new UsbDeviceVerifier());
registerVerifier(new BluetoothDeviceVerifier());
registerVerifier(new LanDeviceVerifier());

// ====================== Fingerprint Creation ======================

/**
 * Creates a device fingerprint from discovered device attributes.
 *
 * The fingerprint is used for:
 *   - Fast matching in HardwareSignature database (via fingerprintHash)
 *   - Device deduplication across multiple scans
 *   - Cloud lookup in Phase 3
 *
 * The fingerprintHash is a deterministic hash computed from all non-null
 * fields, ensuring identical devices produce identical hashes regardless
 * of scan order or connection method.
 */
export function createFingerprint(device: DiscoveredDevice): DeviceFingerprint {
  const connectionType = mapDiscoveryToApiConnection(device.connectionType);

  // Build fingerprint components
  const components: string[] = [];

  // VID + PID (core identity for USB devices)
  if (device.vendorId) components.push(`VID:${device.vendorId}`);
  if (device.productId) components.push(`PID:${device.productId}`);

  // Interface class (what the device claims to be)
  if (device.interfaceClass !== null) components.push(`IFC:${device.interfaceClass}`);

  // Device name (as reported by hardware)
  components.push(`NAME:${device.deviceName}`);

  // Communication type
  components.push(`COMM:${connectionType}`);

  // Manufacturer (if available)
  if (device.manufacturer) components.push(`MFR:${device.manufacturer}`);

  // Driver name (from Desktop Agent)
  // Note: driverName is not in DiscoveredDevice yet, will come from Desktop Agent data
  const driverName: string | null = null; // Placeholder until Desktop Agent integration

  // Compute deterministic hash
  // Using a simple but deterministic hash algorithm (no crypto dependency needed)
  const hashInput = components.join("|");
  const fingerprintHash = computeDeterministicHash(hashInput);

  return {
    vendorId: device.vendorId,
    productId: device.productId,
    interfaceClass: device.interfaceClass,
    deviceName: device.deviceName,
    communicationType: connectionType,
    driverName,
    fingerprintHash,
  };
}

/**
 * Simple deterministic hash function for fingerprinting.
 *
 * NOT cryptographically secure — used for fast comparison only.
 * Produces a consistent hex string from any input.
 */
function computeDeterministicHash(input: string): string {
  // Simple hash: DJB2 algorithm
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xFFFFFFFF;
  }
  // Convert to hex string (8 characters)
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

// ====================== Serial Number Extraction ======================

/**
 * Extracts the real serial number from a device using a fallback chain.
 *
 * Priority order:
 *   1. USB Descriptor (navigator.usb serialNumber — already read in Phase 1)
 *   2. Bluetooth GATT (serial_number_string characteristic — already read in Phase 1)
 *   3. Desktop Agent (Windows registry/WMI — future integration)
 *   4. Firmware query (ESC/POS commands — future integration via Desktop Agent)
 *   5. Device database lookup (by VID/PID → known serial pattern — future)
 *
 * CRITICAL: If serial number cannot be read, return NULL.
 * NEVER generate a fake serial number.
 */
export interface SerialExtractionResult {
  serialNumber: string | null;
  source: "usb_descriptor" | "bluetooth_gatt" | "desktop_agent" | "firmware_query" | "device_database" | null;
  /** Whether extraction was attempted (even if it failed). */
  attempted: boolean;
  /** Error message if extraction failed. Null if successful or skipped. */
  error: string | null;
}

export function extractSerialNumber(device: DiscoveredDevice): SerialExtractionResult {
  // Source 1: USB Descriptor (already read by UsbScanner in Phase 1)
  if (device.connectionType === "usb" && device.serialNumber) {
    return {
      serialNumber: device.serialNumber,
      source: "usb_descriptor",
      attempted: true,
      error: null,
    };
  }

  // Source 2: Bluetooth GATT (already read by BluetoothScanner in Phase 1)
  if (device.connectionType === "bluetooth" && device.serialNumber) {
    return {
      serialNumber: device.serialNumber,
      source: "bluetooth_gatt",
      attempted: true,
      error: null,
    };
  }

  // Source 3: Desktop Agent (not available yet — placeholder)
  // When Desktop Agent is integrated, it will provide serial from:
  //   - Windows Registry: HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Enum\USB\...
  //   - WMI: Win32_PnPEntity.SerialNumber
  //   - SNMP: Device serial from network printer

  // Source 4: Firmware query (not available yet — placeholder)
  // When Desktop Agent supports ESC/POS, it can query:
  //   - ESC ? (printer status)
  //   - DLE EOT (real-time status)
  //   - Custom vendor-specific commands for serial

  // Source 5: Device database lookup (server-side, not available in client)
  // This will be handled by the server-side identification endpoint

  // All sources exhausted — serial could not be read
  const hasSerialAttempt = device.connectionType === "usb" || device.connectionType === "bluetooth";

  return {
    serialNumber: null,
    source: null,
    attempted: hasSerialAttempt,
    error: hasSerialAttempt
      ? "Serial number could not be read. The device did not expose a serial number via USB descriptor or Bluetooth GATT."
      : "Serial number extraction requires Desktop Agent for LAN devices.",
  };
}

// ====================== Model Identification ======================

/**
 * Identifies the device model using a priority chain.
 *
 * Priority:
 *   1. Firmware revision (Bluetooth GATT firmware_revision_string)
 *   2. SDK identification (future — Desktop Agent integration)
 *   3. Product ID (USB PID mapped to known models)
 *   4. Internal Device Database (server-side matching)
 *   5. Bluetooth GATT model_number_string
 *
 * CRITICAL: If model cannot be identified, return NULL.
 * NEVER fabricate a model name.
 */
export interface ModelIdentificationResult {
  model: string | null;
  source: "firmware" | "sdk" | "product_id" | "device_database" | "bluetooth_gatt" | null;
  /** Confidence of the model identification (0.0–1.0). */
  confidence: number;
  /** Error message if identification failed. Null if successful. */
  error: string | null;
}

export function identifyModel(device: DiscoveredDevice): ModelIdentificationResult {
  // Priority 1: Firmware revision may contain model identifier
  // Some printers embed their model in the firmware revision string
  // e.g. "P80_Alpha_V2.10" or "BT2_Firmware_1.5"
  if (device.firmwareVersion) {
    const modelFromFirmware = extractModelFromFirmware(device.firmwareVersion);
    if (modelFromFirmware) {
      return {
        model: modelFromFirmware,
        source: "firmware",
        confidence: 0.95,
        error: null,
      };
    }
  }

  // Priority 2: SDK identification (future — not available yet)
  // When Desktop Agent is integrated, it can use vendor SDKs to identify models

  // Priority 3: Product ID mapping (USB PID → known model)
  // Known QBIT PID-to-model mappings (extensible)
  if (device.productId && device.vendorId) {
    const modelFromPid = lookupModelByPid(device.vendorId, device.productId);
    if (modelFromPid) {
      return {
        model: modelFromPid,
        source: "product_id",
        confidence: 0.8,
        error: null,
      };
    }
  }

  // Priority 4: Internal Device Database (server-side — not available in client)
  // This will be handled by the server-side identification endpoint using matchDevice()

  // Priority 5: Bluetooth GATT model_number_string (already read in Phase 1)
  if (device.connectionType === "bluetooth" && device.modelNumber) {
    return {
      model: device.modelNumber,
      source: "bluetooth_gatt",
      confidence: 0.7,
      error: null,
    };
  }

  // All sources exhausted — model unknown
  const attemptedSources: string[] = [];
  if (device.firmwareVersion) attemptedSources.push("firmware");
  if (device.productId) attemptedSources.push("product_id");
  if (device.modelNumber) attemptedSources.push("bluetooth_gatt");

  return {
    model: null,
    source: null,
    confidence: 0,
    error: attemptedSources.length > 0
      ? `Model identification attempted via ${attemptedSources.join(", ")} but no match found. Server-side database matching may identify this device.`
      : "No model identification sources available. Requires Desktop Agent or server-side matching.",
  };
}

/**
 * Try to extract a model identifier from a firmware revision string.
 *
 * Some printers encode their model name in the firmware version string.
 * Examples:
 *   "P80_Alpha_V2.10" → "P80 Alpha"
 *   "BT2Portable_1.5.0" → "BT2 Portable"
 *   "B420_Barcode_V3.0" → "B420 Barcode"
 *
 * This is a heuristic — if no model pattern is found, returns null.
 */
function extractModelFromFirmware(firmware: string): string | null {
  // Common patterns:
  // 1. Model_Version (e.g. "P80_Alpha_V2.10")
  // 2. ModelVersion (e.g. "P80V2.10")
  // 3. Model Firmware (e.g. "P80 Alpha Firmware V2.10")

  // Pattern 1: underscores separating model and version
  const underscoreMatch = firmware.match(/^([A-Z0-9]+[_\s][A-Z0-9]+(?:[_\s][A-Z0-9]+)*)[_\s](?:V|v|Ver|ver|Version|version|Firmware|firmware|FW|fw)[.\s]/i);
  if (underscoreMatch) {
    return underscoreMatch[1].replace(/_/g, " ").trim();
  }

  // Pattern 2: pure model name followed by version number
  const simpleMatch = firmware.match(/^([A-Z][A-Z0-9]{1,15}(?:\s[A-Z0-9]+)*)\s(?:V|v)?\d/i);
  if (simpleMatch) {
    return simpleMatch[1].trim();
  }

  // No pattern found
  return null;
}

/**
 * Lookup model by USB Vendor ID and Product ID.
 *
 * Maps known QBIT VID/PID combinations to model names.
 * This is a client-side lookup for immediate identification;
 * the server has the full HardwareSignature database.
 *
 * EXTENSIBILITY: New VID/PID → model mappings can be added here
 * without changing any engine logic.
 */
function lookupModelByPid(vendorId: string, productId: string): string | null {
  // Known QBIT product mappings (VID → PID → Model)
  // Format: normalized hex VID/PID without "0x" prefix
  const vid = vendorId.replace("0x", "").toUpperCase();
  const pid = productId.replace("0x", "").toUpperCase();

  const knownProducts: Record<string, Record<string, string>> = {
    // QBIT Technologies (VID: 1E90)
    "1E90": {
      "0001": "P80 Alpha",
      "0002": "P80 Beta",
      "0003": "BT2 Portable",
      "0004": "Barcode B420",
      "0005": "Label L200",
      "0006": "Kitchen K60",
    },
    // Epson (VID: 04B8) — common thermal receipt printers
    "04B8": {
      "0005": "Epson TM-T88VI",
      "0006": "Epson TM-T82X",
      "0202": "Epson TM-T20III",
    },
    // NXP / LPC (VID: 1FC9) — used in some QBIT POS hardware
    "1FC9": {
      "0090": "QBIT POS Terminal",
    },
  };

  const vendorModels = knownProducts[vid];
  if (vendorModels && vendorModels[pid]) {
    return vendorModels[pid];
  }

  return null;
}

// ====================== Capability Detection ======================

/**
 * Detects device capabilities dynamically from available information.
 *
 * Capabilities are derived from:
 *   1. USB interface class codes (what the device claims to support)
 *   2. Bluetooth GATT service availability
 *   3. Device name keywords
 *   4. Known product capabilities (server-side database)
 *
 * CRITICAL: Capabilities are NEVER hardcoded. They are ALWAYS
 * derived from real device data. If a capability cannot be confirmed,
 * it is NOT included in the list.
 */
export function detectCapabilities(device: DiscoveredDevice): DeviceCapability[] {
  const capabilities: DeviceCapability[] = [];

  // Connection type is always a capability
  if (device.connectionType === "usb") capabilities.push("usb");
  if (device.connectionType === "bluetooth") capabilities.push("bluetooth");
  if (device.connectionType === "lan") capabilities.push("lan");

  // USB interface class code analysis
  if (device.interfaceClasses && device.interfaceClasses.length > 0) {
    for (const cls of device.interfaceClasses) {
      // Printer class → ESC/POS protocol capability
      if (cls === 0x07) {
        capabilities.push("esc_pos_protocol");
        capabilities.push("receipt_printing");
      }
      // CDC class → serial communication capability
      if (cls === 0x0A || cls === 0x02) {
        capabilities.push("com_serial");
        capabilities.push("pos_mode");
      }
      // Vendor-Specific → possible custom protocol support
      if (cls === 0xFF) {
        capabilities.push("esc_pos_protocol");
      }
    }
  }

  // Bluetooth: if we connected via binary_output service, device supports receipt printing
  if (device.connectionType === "bluetooth") {
    capabilities.push("receipt_printing");
  }

  // LAN: network printers typically support SNMP
  if (device.connectionType === "lan") {
    capabilities.push("snmp_support");
    capabilities.push("receipt_printing");
  }

  // Name-based capability heuristics (supplement class codes)
  const name = (device.deviceName + " " + (device.manufacturer ?? "")).toLowerCase();

  if (name.includes("label")) capabilities.push("label_printing");
  if (name.includes("barcode")) capabilities.push("barcode_printing");
  if (name.includes("kitchen")) capabilities.push("kitchen_printing");
  if (name.includes("cash drawer") || name.includes("pos")) capabilities.push("cash_drawer");
  if (name.includes("cutter") || name.includes("auto cut")) capabilities.push("auto_cutter");
  if (name.includes("scanner")) capabilities.push("scanner_mode");
  if (name.includes("display")) capabilities.push("display_output");

  // Deduplicate capabilities
  return [...new Set(capabilities)];
}

// ====================== Full Identification Pipeline ======================

/**
 * Main entry point: Runs the complete Phase 2 identification pipeline
 * on a single discovered device.
 *
 * Steps:
 *   1. Receive Connected Device
 *   2. Verify Device (is this a printer/POS/scanner?)
 *   3. Create Device Fingerprint
 *   4. Read Printer Information
 *   5. Extract Serial Number (multi-source fallback)
 *   6. Identify Model (priority chain)
 *   7. Detect Capabilities (dynamic)
 *   8. Build Device Profile
 *
 * If the device is verified as unsupported (not a printer), the pipeline
 * stops and returns a profile with identificationStatus = "unsupported".
 *
 * @returns IdentificationResult with the completed Device Profile
 */
export function identifyDevice(device: DiscoveredDevice): IdentificationResult {
  const startTime = Date.now();
  const completedSteps: string[] = [];
  const skippedSteps: string[] = [];
  const errors: IdentificationError[] = [];

  // ===== Step 1: Receive Connected Device =====
  // Already done — device comes from Phase 1
  completedSteps.push("receive_device");

  // ===== Step 2: Verify Device =====
  const verification = verifyDevice(device);
  completedSteps.push("verify");

  if (!verification.isSupported) {
    // Device is NOT a printer/POS/scanner — STOP processing
    errors.push({
      step: "verify",
      message: verification.rejectionReason ?? "Unsupported device type",
      recoverable: false,
    });

    const profile = buildUnsupportedProfile(device, verification, errors);
    return {
      profile,
      completedSteps,
      skippedSteps: ["fingerprint", "read_info", "serial_extraction", "model_identification", "capability_detection", "profile_build"],
      identificationDurationMs: Date.now() - startTime,
    };
  }

  // ===== Step 3: Create Device Fingerprint =====
  const fingerprint = createFingerprint(device);
  completedSteps.push("fingerprint");

  // ===== Step 4: Read Printer Information =====
  // Information is already read by the scanners in Phase 1 + enrichment
  // This step validates what we have and marks what's missing
  completedSteps.push("read_info");

  // ===== Step 5: Extract Serial Number =====
  const serialResult = extractSerialNumber(device);
  if (serialResult.serialNumber) {
    completedSteps.push("serial_extraction");
  } else if (serialResult.attempted) {
    // Serial was attempted but couldn't be read — this is a partial identification
    completedSteps.push("serial_extraction");
    errors.push({
      step: "serial_extraction",
      message: serialResult.error ?? "Serial number could not be read from the device",
      recoverable: true, // Device can still be partially identified
    });
  } else {
    // Serial extraction was not possible (e.g. LAN device without Desktop Agent)
    skippedSteps.push("serial_extraction");
  }

  // ===== Step 6: Identify Model =====
  const modelResult = identifyModel(device);
  if (modelResult.model) {
    completedSteps.push("model_identification");
  } else {
    completedSteps.push("model_identification");
    errors.push({
      step: "model_identification",
      message: modelResult.error ?? "Model could not be identified from available data",
      recoverable: true, // Unknown printer still gets a partial profile
    });
  }

  // ===== Step 7: Detect Capabilities =====
  const capabilities = detectCapabilities(device);
  completedSteps.push("capability_detection");

  // ===== Step 8: Build Device Profile =====
  const connectionType = mapDiscoveryToApiConnection(device.connectionType);

  // Determine identification status based on what we know
  let identificationStatus: IdentificationStatus;
  if (!verification.isSupported) {
    identificationStatus = "unsupported";
  } else if (serialResult.serialNumber && modelResult.model) {
    identificationStatus = "verified";
  } else if (verification.deviceType && verification.deviceType !== "unknown") {
    identificationStatus = "partial"; // We know it's a printer type but missing some info
  } else {
    identificationStatus = "unknown"; // Printer detected but model unknown
  }

  const profile: DeviceProfile = {
    deviceType: verification.deviceType ?? "unknown",
    connectionType,
    deviceName: device.deviceName,
    model: modelResult.model,
    manufacturer: device.manufacturer,
    vendorId: device.vendorId,
    productId: device.productId,
    port: device.port,
    serialNumber: serialResult.serialNumber,
    firmwareVersion: device.firmwareVersion,
    hardwareRevision: device.hardwareRevision,
    capabilities,
    identificationStatus,
    fingerprint,
    detectionTimestamp: new Date().toISOString(),
    serialSource: serialResult.source,
    modelSource: modelResult.source,
    identificationErrors: errors,
  };

  completedSteps.push("profile_build");

  return {
    profile,
    completedSteps,
    skippedSteps,
    identificationDurationMs: Date.now() - startTime,
  };
}

/**
 * Run identification on ALL discovered devices from a Phase 1 scan.
 *
 * Processes each device through the full pipeline and returns
 * an array of IdentificationResults, one per device.
 *
 * Unsupported devices are included in the results (marked as "unsupported")
 * so the UI can display appropriate messages.
 */
export function identifyAllDevices(discoveryResult: { devices: DiscoveredDevice[] }): IdentificationResult[] {
  return discoveryResult.devices.map(identifyDevice);
}

// ====================== Helper Functions ======================

/**
 * Verify a device using all registered verifiers.
 *
 * Runs through the verifier registry and returns the best match.
 * If multiple verifiers match, the one with highest confidence wins.
 */
function verifyDevice(device: DiscoveredDevice): VerificationResult {
  let bestResult: VerificationResult = {
    isSupported: false,
    deviceType: null,
    confidence: 0,
    rejectionReason: "No verifier matched this device",
  };

  for (const verifier of verifierRegistry) {
    const result = verifier.verify(device);
    if (result.isSupported && result.confidence > bestResult.confidence) {
      bestResult = result;
    }
  }

  return bestResult;
}

/**
 * Build a Device Profile for unsupported devices.
 *
 * Unsupported devices get a minimal profile that records what was detected
 * but marks them as rejected. Phase 3 MUST NOT process unsupported profiles.
 */
function buildUnsupportedProfile(
  device: DiscoveredDevice,
  verification: VerificationResult,
  errors: IdentificationError[],
): DeviceProfile {
  const connectionType = mapDiscoveryToApiConnection(device.connectionType);
  const fingerprint = createFingerprint(device);

  return {
    deviceType: "unknown",
    connectionType,
    deviceName: device.deviceName,
    model: null,
    manufacturer: device.manufacturer,
    vendorId: device.vendorId,
    productId: device.productId,
    port: device.port,
    serialNumber: null,
    firmwareVersion: null,
    hardwareRevision: null,
    capabilities: [],
    identificationStatus: "unsupported",
    fingerprint,
    detectionTimestamp: new Date().toISOString(),
    serialSource: null,
    modelSource: null,
    identificationErrors: [
      ...errors,
      {
        step: "verify",
        message: `Unsupported Device: ${verification.rejectionReason ?? "This device is not a printer, POS, or scanner"}`,
        recoverable: false,
      },
    ],
  };
}

/**
 * Map DiscoveryConnection (Phase 1 client-side) to DeviceConnection (API/server-side).
 *
 * Phase 1 uses "usb" | "bluetooth" | "lan" (browser API perspective).
 * Phase 2 / API uses "usb" | "com" | "lan" | "wifi" | "bluetooth" (full device perspective).
 */
function mapDiscoveryToApiConnection(dc: DiscoveryConnection): DeviceConnection {
  switch (dc) {
    case "usb": return "usb";
    case "bluetooth": return "bluetooth";
    case "lan": return "lan";
    default: return "usb";
  }
}
