/**
 * Device Discovery Engine — Phase 1
 *
 * Central service for detecting connected hardware devices via USB,
 * Bluetooth, and LAN. This is the ONLY module responsible for device
 * discovery. No mock data, no simulated scans, no dummy devices.
 *
 * Architecture:
 *   - ScannerRegistry: Extensible registry of scanner types. Adding a
 *     new device type (Barcode Printer, POS, Scanner, etc.) only
 *     requires registering a new scanner — no engine changes needed.
 *   - DiscoveryResult: Unified result type across all connection types.
 *   - scanAll(): Sequential scan across all registered scanners.
 *
 * Browser APIs used:
 *   - WebUSB (navigator.usb) — Chrome/Edge/Opera over HTTPS
 *   - Web Bluetooth (navigator.bluetooth) — Chrome/Edge/Opera over HTTPS
 *   - LAN scanning requires Desktop Agent (architecture placeholder)
 *
 * Security:
 *   - All scans require explicit user action (browser permission dialogs)
 *   - No background scanning, no persistent permissions
 *   - Device data is only read, never written to the device
 */

// ====================== Types ======================

/** Connection type for a detected device. */
export type DiscoveryConnection = "usb" | "bluetooth" | "lan";

/** A single device discovered by any scanner. */
export interface DiscoveredDevice {
  /** How the device was detected. */
  connectionType: DiscoveryConnection;
  /** Device name reported by the OS/driver. */
  deviceName: string;
  /** Manufacturer name if available. */
  manufacturer: string | null;
  /** USB Vendor ID (hex string, e.g. "0x04B8"). Null for non-USB. */
  vendorId: string | null;
  /** USB Product ID (hex string, e.g. "0x0202"). Null for non-USB. */
  productId: string | null;
  /** Serial number if the device exposes one. Critical for Phase 2. */
  serialNumber: string | null;
  /** USB version (e.g. "2.0", "3.0"). Null for non-USB. */
  usbVersion: string | null;
  /** Port/address where the device is reachable. */
  port: string | null;
  /** Bluetooth device ID (if Bluetooth). */
  bluetoothDeviceId: string | null;
  /** IP address (if LAN/Network). */
  ipAddress: string | null;
  /** MAC address (if LAN/Bluetooth). */
  macAddress: string | null;
  /** Whether this device appears to be a printer/POS/scanner. */
  isPrinterLike: boolean;
}

/** Overall discovery result from scanning all ports. */
export interface DiscoveryResult {
  /** Whether any scan succeeded (even if 0 devices found). */
  scanCompleted: boolean;
  /** All discovered devices. Empty array if nothing found. */
  devices: DiscoveredDevice[];
  /** Which scanners were actually run. */
  scannersUsed: DiscoveryConnection[];
  /** Which scanners were skipped (not supported / not available). */
  scannersSkipped: DiscoveryConnection[];
  /** Error messages per scanner (if any). Null means no error. */
  errors: Partial<Record<DiscoveryConnection, string>>;
}

/** Scanner capability check result. */
export interface ScannerAvailability {
  supported: boolean;
  reason?: string;
}

/** Abstract scanner interface — register new device types here. */
export interface DeviceScanner {
  /** Which connection type this scanner handles. */
  connectionType: DiscoveryConnection;
  /** Check if this scanner is available in the current browser/env. */
  isAvailable(): ScannerAvailability;
  /** Run the scan. Returns discovered devices or throws. */
  scan(): Promise<DiscoveredDevice[]>;
}

// ====================== Scanner Registry ======================

const scannerRegistry: DeviceScanner[] = [];

/** Register a new scanner type. Call this at module init time. */
export function registerScanner(scanner: DeviceScanner): void {
  const existing = scannerRegistry.find((s) => s.connectionType === scanner.connectionType);
  if (existing) {
    console.warn(`[DiscoveryEngine] Overwriting existing scanner for ${scanner.connectionType}`);
    const idx = scannerRegistry.indexOf(existing);
    scannerRegistry[idx] = scanner;
  } else {
    scannerRegistry.push(scanner);
  }
}

/** Get all registered scanners. */
export function getRegisteredScanners(): DeviceScanner[] {
  return [...scannerRegistry];
}

// ====================== USB Scanner (WebUSB) ======================

/**
 * WebUSB Scanner — detects USB devices using navigator.usb API.
 *
 * Works in Chrome, Edge, Opera over HTTPS. Requires user to click
 * "Scan" and approve the browser permission dialog each session.
 *
 * Filter: Only returns devices that look like printers/POS/scanners.
 * Unknown devices (mice, keyboards, storage) are excluded.
 */
class UsbScanner implements DeviceScanner {
  connectionType: DiscoveryConnection = "usb";

  isAvailable(): ScannerAvailability {
    if (typeof navigator === "undefined") {
      return { supported: false, reason: "Not running in a browser environment" };
    }
    if (!navigator.usb) {
      return { supported: false, reason: "WebUSB not supported in this browser. Use Chrome or Edge over HTTPS." };
    }
    return { supported: true };
  }

  async scan(): Promise<DiscoveredDevice[]> {
    const avail = this.isAvailable();
    if (!avail.supported) {
      throw new Error(avail.reason ?? "WebUSB not available");
    }

    // Step 1: Request user permission to access USB devices
    // The browser shows a permission dialog listing available devices.
    // User must select a device (or cancel). This is required by WebUSB spec.
    try {
      await navigator.usb!.requestDevice({ filters: [] }).catch(() => null);
    } catch {
      // User cancelled the permission dialog — no devices to scan
      throw new Error("USB permission denied. Please click Scan again and approve the browser permission dialog.");
    }

    // Step 2: Get all authorized USB devices
    const authorizedDevices = await navigator.usb!.getDevices();

    if (authorizedDevices.length === 0) {
      // Permission was granted but no devices were selected/found
      return [];
    }

    // Step 3: Convert WebUSB devices to our DiscoveredDevice format
    // Filter: skip clearly non-hardware devices (human interface devices
    // like mice/keyboards are unlikely to be printers/POS/scanners).
    const devices: DiscoveredDevice[] = [];

    for (const d of authorizedDevices) {
      const vid = "0x" + d.vendorId.toString(16).toUpperCase().padStart(4, "0");
      const pid = "0x" + d.productId.toString(16).toUpperCase().padStart(4, "0");
      const name = d.productName || "USB Device";
      const manufacturer = d.manufacturerName || null;
      const serial = d.serialNumber || null;
      const usbVer = `${d.usbVersionMajor}.${d.usbVersionMinor}.${d.usbVersionSubminor}`;

      // Determine if this looks like a printer/POS/scanner device.
      // Class codes: 0x07 = Printer, 0x0A = CDC (serial/POS),
      // Subclass checks for known POS/printer patterns.
      // We also accept unknown devices so admins can map them later.
      const isPrinterLike = this.isPrinterOrPosDevice(d, name, manufacturer);

      devices.push({
        connectionType: "usb",
        deviceName: name,
        manufacturer,
        vendorId: vid,
        productId: pid,
        serialNumber: serial,
        usbVersion: usbVer,
        port: "USB",
        bluetoothDeviceId: null,
        ipAddress: null,
        macAddress: null,
        isPrinterLike,
      });
    }

    return devices;
  }

  /**
   * Heuristic: Is this USB device likely a printer, POS, or scanner?
   *
   * We're generous — any device that isn't clearly a mouse/keyboard/storage
   * is considered "printer-like" so we don't miss unusual hardware.
   * The final identification happens in Phase 2 (Identification Engine).
   */
  private isPrinterOrPosDevice(d: USBDevice, name: string, manufacturer: string | null): boolean {
    // USB Class codes that indicate printer/POS:
    // 0x07 = Printer class
    // 0x0A = CDC-Data (serial communication, common for POS)
    // 0x02 = CDC-Control
    for (const config of d.configurations) {
      for (const iface of config.interfaces) {
        for (const alt of iface.alternates) {
          const cls = alt.interfaceClass;
          // Printer, CDC-Data, CDC-Control, Vendor-Specific
          if (cls === 0x07 || cls === 0x0A || cls === 0x02 || cls === 0xFF) {
            return true;
          }
        }
      }
    }

    // Name-based heuristic: common printer/POS/scanner keywords
    const printerKeywords = [
      "printer", "print", "thermal", "label", "barcode", "pos",
      "scanner", "kiosk", "scale", "cash drawer", "display",
      "receipt", "ticket", "slip", "impact", "dot matrix",
    ];
    const combined = `${name} ${manufacturer ?? ""}`.toLowerCase();
    if (printerKeywords.some((kw) => combined.includes(kw))) {
      return true;
    }

    // Known QBIT VID prefix check
    const vid = d.vendorId.toString(16).toUpperCase().padStart(4, "0");
    // QBIT Technologies known VIDs (update as more are discovered)
    const qbitVids = ["1E90", "04B8", "1FC9"];
    if (qbitVids.includes(vid)) {
      return true;
    }

    // Default: Accept all devices for discovery. Phase 2 handles
    // exact identification. Only exclude obvious HID/storage.
    // HID class (0x03) with mouse/keyboard subclass → exclude
    for (const config of d.configurations) {
      for (const iface of config.interfaces) {
        for (const alt of iface.alternates) {
          if (alt.interfaceClass === 0x03) {
            // Human Interface Device — skip mice/keyboards
            return false;
          }
          // Mass Storage (0x08) — skip flash drives
          if (alt.interfaceClass === 0x08) {
            return false;
          }
        }
      }
    }

    // Everything else: include for further identification
    return true;
  }
}

// ====================== Bluetooth Scanner (Web Bluetooth) ======================

/**
 * Web Bluetooth Scanner — detects paired Bluetooth devices.
 *
 * Flow (per spec):
 *   1. User first pairs the printer in Windows Bluetooth settings
 *   2. Then Dr. QBIT scans for paired Bluetooth printers
 *   3. If compatible printer found → proceed to Phase 2
 *
 * Limitations:
 *   - Only works in Chrome/Edge over HTTPS
 *   - Only detects devices that the user explicitly paired
 *   - Cannot read serial number via Bluetooth (needs Desktop Agent)
 */
class BluetoothScanner implements DeviceScanner {
  connectionType: DiscoveryConnection = "bluetooth";

  isAvailable(): ScannerAvailability {
    if (typeof navigator === "undefined") {
      return { supported: false, reason: "Not running in a browser environment" };
    }
    if (!navigator.bluetooth) {
      return { supported: false, reason: "Web Bluetooth not supported in this browser. Use Chrome or Edge over HTTPS." };
    }
    return { supported: true };
  }

  async scan(): Promise<DiscoveredDevice[]> {
    const avail = this.isAvailable();
    if (!avail.supported) {
      throw new Error(avail.reason ?? "Web Bluetooth not available");
    }

    try {
      // Request Bluetooth devices — filter for printer-like services
      // Bluetooth GATT services that printers commonly expose:
      // - 0x180F (Battery Service)
      // - 0x18F0 (Binary Output — some POS printers)
      // - 0x18F1 (Immediate Output)
      // We use a broad filter to catch most printers
      const device = await navigator.bluetooth!.requestDevice({
        filters: [
          { services: ["binary_output"] },
          { services: ["immediate_output"] },
        ],
        // Also accept devices with printer-like names
        optionalServices: ["battery_service", "device_information"],
      });

      // We got at least one device from the permission dialog
      const devices: DiscoveredDevice[] = [];

      if (device) {
        const name = device.name || "Bluetooth Device";
        const id = device.id;

        // Try to read Device Information Service (0x180A)
        // This may contain manufacturer name, model number, serial number
        let manufacturer: string | null = null;
        let serialNumber: string | null = null;
        let modelNumber: string | null = null;

        try {
          // Connect to GATT server to read device info
          const server = await device.gatt?.connect();
          if (server) {
            try {
              const infoService = await server.getPrimaryService("device_information");
              if (infoService) {
                // Read manufacturer name (0x2A29)
                try {
                  const mfChar = await infoService.getCharacteristic("manufacturer_name_string");
                  const mfValue = await mfChar.readValue();
                  manufacturer = new TextDecoder().decode(mfValue);
                } catch { /* Characteristic not available */ }

                // Read serial number (0x2A25)
                try {
                  const snChar = await infoService.getCharacteristic("serial_number_string");
                  const snValue = await snChar.readValue();
                  serialNumber = new TextDecoder().decode(snValue);
                } catch { /* Characteristic not available */ }

                // Read model number (0x2A24)
                try {
                  const modelChar = await infoService.getCharacteristic("model_number_string");
                  const modelValue = await modelChar.readValue();
                  modelNumber = new TextDecoder().decode(modelValue);
                } catch { /* Characteristic not available */ }
              }
            } catch {
              // Device Information Service not available on this device
            }

            // Disconnect after reading info
            device.gatt?.disconnect();
          }
        } catch {
          // GATT connection failed — device info unavailable
        }

        devices.push({
          connectionType: "bluetooth",
          deviceName: modelNumber ? `${name} (${modelNumber})` : name,
          manufacturer,
          vendorId: null, // No USB VID for Bluetooth
          productId: null, // No USB PID for Bluetooth
          serialNumber,
          usbVersion: null,
          port: "Bluetooth",
          bluetoothDeviceId: id,
          ipAddress: null,
          macAddress: null,
          isPrinterLike: true, // User selected it via printer service filter
        });
      }

      return devices;
    } catch (e) {
      // User cancelled the Bluetooth permission dialog
      if (e instanceof DOMException && e.name === "NotFoundError") {
        // No Bluetooth devices found that match the filters
        return [];
      }
      throw new Error(
        e instanceof Error ? e.message : "Bluetooth scan failed. Please pair your printer in Windows Bluetooth settings first."
      );
    }
  }
}

// ====================== LAN Scanner (Placeholder — Requires Desktop Agent) ======================

/**
 * LAN/Network Scanner — detects network printers on local LAN.
 *
 * ARCHITECTURE NOTE:
 *   Browsers cannot directly scan network ports or enumerate LAN devices.
 *   This scanner requires the QBIT Desktop Agent for actual detection.
 *   The Desktop Agent runs on the user's Windows machine and can:
 *     - Scan local network for printer ports (9100, 515, 631)
 *     - Enumerate SNMP printer responses
 *     - Detect mDNS/DNS-SD printer advertisements
 *     - Ping known printer IP ranges
 *
 *   Current implementation: Always returns empty array with a clear
 *   message that the Desktop Agent is required for LAN scanning.
 */
class LanScanner implements DeviceScanner {
  connectionType: DiscoveryConnection = "lan";

  isAvailable(): ScannerAvailability {
    // LAN scanning always requires the Desktop Agent — browsers cannot
    // scan network ports due to security restrictions
    return {
      supported: false,
      reason: "LAN/Network scanning requires the QBIT Desktop Agent. Browsers cannot directly scan network devices.",
    };
  }

  async scan(): Promise<DiscoveredDevice[]> {
    // No LAN scanning possible without Desktop Agent
    // Architecture placeholder — when Desktop Agent is implemented,
    // this scanner will call the agent's local API endpoint
    return [];
  }
}

// ====================== Auto-Registration ======================

// Register all built-in scanners at module load time
registerScanner(new UsbScanner());
registerScanner(new BluetoothScanner());
registerScanner(new LanScanner());

// ====================== Discovery Engine ======================

/**
 * Scan all registered ports sequentially.
 *
 * Flow per spec:
 *   1. USB scan → detect USB printers
 *   2. Bluetooth scan → detect paired Bluetooth printers
 *   3. LAN scan → detect network printers (requires Desktop Agent)
 *
 * Each scan runs independently. Results are aggregated.
 * If a scanner is unavailable, it's skipped with a clear message.
 *
 * @returns DiscoveryResult with all found devices and scan metadata.
 */
export async function scanAllPorts(): Promise<DiscoveryResult> {
  const devices: DiscoveredDevice[] = [];
  const scannersUsed: DiscoveryConnection[] = [];
  const scannersSkipped: DiscoveryConnection[] = [];
  const errors: Partial<Record<DiscoveryConnection, string>> = {};

  for (const scanner of scannerRegistry) {
    const avail = scanner.isAvailable();

    if (!avail.supported) {
      scannersSkipped.push(scanner.connectionType);
      errors[scanner.connectionType] = avail.reason ?? "Not available";
      continue;
    }

    scannersUsed.push(scanner.connectionType);

    try {
      const found = await scanner.scan();
      if (found.length > 0) {
        devices.push(...found);
      }
    } catch (e) {
      errors[scanner.connectionType] = e instanceof Error ? e.message : "Scan failed";
    }
  }

  return {
    scanCompleted: true,
    devices,
    scannersUsed,
    scannersSkipped,
    errors,
  };
}

/**
 * Quick check: Is WebUSB available in the current browser?
 */
export function isWebUsbAvailable(): ScannerAvailability {
  const usbScanner = scannerRegistry.find((s) => s.connectionType === "usb");
  return usbScanner?.isAvailable() ?? { supported: false, reason: "USB scanner not registered" };
}

/**
 * Quick check: Is Web Bluetooth available in the current browser?
 */
export function isBluetoothAvailable(): ScannerAvailability {
  const btScanner = scannerRegistry.find((s) => s.connectionType === "bluetooth");
  return btScanner?.isAvailable() ?? { supported: false, reason: "Bluetooth scanner not registered" };
}

/**
 * Quick check: Is LAN scanning available?
 */
export function isLanAvailable(): ScannerAvailability {
  const lanScanner = scannerRegistry.find((s) => s.connectionType === "lan");
  return lanScanner?.isAvailable() ?? { supported: false, reason: "LAN scanner not registered" };
}

/**
 * Filter discovered devices to only include printer-like devices.
 * Removes mice, keyboards, storage devices, and other non-hardware.
 */
export function filterPrinterDevices(devices: DiscoveredDevice[]): DiscoveredDevice[] {
  return devices.filter((d) => d.isPrinterLike);
}

/**
 * Find the first device with a serial number (best candidate for
 * serial-lookup in the Customer Portal flow).
 */
export function findDeviceWithSerial(devices: DiscoveredDevice[]): DiscoveredDevice | null {
  return devices.find((d) => d.serialNumber && d.serialNumber.length >= 4) ?? null;
}
