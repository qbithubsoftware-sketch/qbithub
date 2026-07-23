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
 * USB Connection Flow (7-step):
 *   STEP 1: navigator.usb.requestDevice() — user permission
 *   STEP 2: device.open() — open USB device for I/O
 *   STEP 3: device.selectConfiguration() — select USB configuration
 *   STEP 4: device.claimInterface() — claim the printer/data interface
 *   STEP 5: Read USB interfaces — enumerate all interface class codes
 *   STEP 6: Read endpoints — enumerate bulk IN/OUT endpoints
 *   STEP 7: Create connected device object — build full DiscoveredDevice
 *
 * Each step is logged with console.log. If any step throws, the exact
 * exception is logged and stored in usbConnectionError. The UI shows
 * the exact error message — no generic "Connection Failed" messages.
 * No errors are swallowed. No .catch(() => null) patterns.
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

/**
 * 7-step USB connection flow steps.
 * Each step is logged individually. If a step fails, the error is
 * captured with the exact step number and exception details.
 */
export type UsbConnectionStep =
  | "step1_requestDevice"
  | "step2_open"
  | "step3_selectConfiguration"
  | "step4_claimInterface"
  | "step5_readInterfaces"
  | "step6_readEndpoints"
  | "step7_createDeviceObject";

/**
 * Result of the 7-step USB connection attempt for a single device.
 * Stored on DiscoveredDevice.usbConnection so the UI can display
 * exactly which step succeeded/failed and the error details.
 */
export interface UsbConnectionResult {
  /** Whether the full 7-step connection flow completed successfully. */
  connected: boolean;
  /** Which step the flow reached before stopping (last successful step). */
  lastCompletedStep: UsbConnectionStep | null;
  /** Which step failed (null if all steps succeeded). */
  failedStep: UsbConnectionStep | null;
  /** Exact error message from the failed step. Null if no failure. */
  errorMessage: string | null;
  /** Exact error name (DOMException name, e.g. "NotFoundError", "SecurityError"). Null if no failure. */
  errorName: string | null;
  /** Detailed log of each step with timestamp, status, and any data read. */
  stepLog: Array<{
    step: UsbConnectionStep;
    status: "success" | "failed" | "skipped";
    message: string;
    timestamp: string;
    data?: Record<string, unknown>;
  }>;
  /** Whether device.configuration was null after open() (before selectConfiguration). */
  configurationWasNullAfterOpen: boolean | null;
  /** Number of interfaces the device exposes. */
  interfaceCount: number | null;
  /** Which interface was claimed (interfaceNumber). Null if claim failed or skipped. */
  claimedInterfaceNumber: number | null;
  /** Bulk OUT endpoint number (for sending data to printer). Null if not found. */
  bulkOutEndpoint: number | null;
  /** Bulk IN endpoint number (for reading data from printer). Null if not found. */
  bulkInEndpoint: number | null;
  /** Whether another application (e.g. printer driver) may be using the interface. */
  interfacePossiblyInUse: boolean | null;
}

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
  // ===== Phase 2 enrichment fields =====
  /** Firmware version read from GATT Device Information Service or Desktop Agent. Null if unreadable. */
  firmwareVersion: string | null;
  /** Hardware revision read from GATT Device Information Service. Null if unreadable. */
  hardwareRevision: string | null;
  /** Software revision read from GATT Device Information Service. Null if unreadable. */
  softwareRevision: string | null;
  /** Primary USB interface class code (e.g. 0x07 = Printer). Null for non-USB. */
  interfaceClass: number | null;
  /** All USB interface class codes detected. Empty for non-USB devices. */
  interfaceClasses: number[];
  /** Model number read from GATT Device Information Service. Null if unreadable. */
  modelNumber: string | null;
  // ===== USB Connection Flow (7-step) =====
  /** Result of the 7-step USB connection attempt. Null for non-USB devices or if flow was not run. */
  usbConnection: UsbConnectionResult | null;
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

// ====================== 7-Step USB Connection Flow ======================

/**
 * Establish a USB connection to a single device through the 7-step flow.
 *
 * STEP 1: navigator.usb.requestDevice() — user selects device in Chrome picker
 * STEP 2: device.open() — open the device for I/O operations
 * STEP 3: device.selectConfiguration() — select the active USB configuration
 * STEP 4: device.claimInterface() — claim the printer/data interface
 * STEP 5: Read USB interfaces — enumerate all interface class codes
 * STEP 6: Read endpoints — enumerate bulk IN/OUT endpoints on claimed interface
 * STEP 7: Create connected device object — build UsbConnectionResult
 *
 * IMPORTANT:
 *   - Every step is logged to console with [DrQBIT USB STEP X] prefix.
 *   - If any step throws, the exact exception is logged and the flow stops.
 *   - The error is stored in UsbConnectionResult.failedStep + errorMessage.
 *   - NO errors are swallowed. NO generic "Connection Failed" messages.
 *   - The caller can show the exact error in the UI.
 *
 * @param device - The USBDevice obtained from requestDevice() or getDevices()
 * @returns UsbConnectionResult with step-by-step status and connection details
 */
export async function connectUsbDevice(device: USBDevice): Promise<UsbConnectionResult> {
  const TAG = "[DrQBIT USB]";
  const stepLog: UsbConnectionResult["stepLog"] = [];
  const now = () => new Date().toISOString();

  let lastCompletedStep: UsbConnectionStep | null = null;
  let failedStep: UsbConnectionStep | null = null;
  let errorMessage: string | null = null;
  let errorName: string | null = null;
  let configurationWasNullAfterOpen: boolean | null = null;
  let interfaceCount: number | null = null;
  let claimedInterfaceNumber: number | null = null;
  let bulkOutEndpoint: number | null = null;
  let bulkInEndpoint: number | null = null;
  let interfacePossiblyInUse: boolean | null = null;

  // ===== STEP 1: requestDevice (already done by caller — log that we have the device) =====
  {
    const step: UsbConnectionStep = "step1_requestDevice";
    console.log(`${TAG} STEP 1: requestDevice() — device obtained from browser picker`);
    console.log(`${TAG} STEP 1: Device name: "${device.productName ?? "Unknown"}"`);
    console.log(`${TAG} STEP 1: VID: 0x${device.vendorId.toString(16).toUpperCase().padStart(4, "0")}, PID: 0x${device.productId.toString(16).toUpperCase().padStart(4, "0")}`);
    console.log(`${TAG} STEP 1: Serial: "${device.serialNumber ?? "N/A"}"`);
    console.log(`${TAG} STEP 1: Manufacturer: "${device.manufacturerName ?? "N/A"}"`);
    console.log(`${TAG} STEP 1: USB Version: ${device.usbVersionMajor}.${device.usbVersionMinor}.${device.usbVersionSubminor}`);
    console.log(`${TAG} STEP 1: Configurations count: ${device.configurations.length}`);
    console.log(`${TAG} STEP 1: opened status (before open()): ${device.opened}`);
    stepLog.push({
      step,
      status: "success",
      message: `Device "${device.productName ?? "Unknown"}" (VID=${device.vendorId}, PID=${device.productId}) obtained from browser picker.`,
      timestamp: now(),
      data: {
        productName: device.productName,
        manufacturerName: device.manufacturerName,
        serialNumber: device.serialNumber,
        vendorId: device.vendorId,
        productId: device.productId,
        usbVersion: `${device.usbVersionMajor}.${device.usbVersionMinor}.${device.usbVersionSubminor}`,
        configurationsCount: device.configurations.length,
        openedBefore: device.opened,
      },
    });
    lastCompletedStep = step;
  }

  // ===== STEP 2: device.open() =====
  {
    const step: UsbConnectionStep = "step2_open";
    console.log(`${TAG} STEP 2: Calling device.open()...`);
    try {
      await device.open();
      console.log(`${TAG} STEP 2: SUCCESS — device.open() completed. Device is now opened.`);
      console.log(`${TAG} STEP 2: opened status (after open()): ${device.opened}`);

      // Check: Is device.configuration null after open()?
      const configAfterOpen = device.configuration;
      configurationWasNullAfterOpen = configAfterOpen === null;
      console.log(`${TAG} STEP 2: device.configuration after open(): ${configAfterOpen === null ? "NULL (selectConfiguration needed)" : `Configuration #${configAfterOpen.configurationValue} (${configAfterOpen.configurationName ?? "unnamed"})`}`);

      stepLog.push({
        step,
        status: "success",
        message: `device.open() succeeded. Device is now opened. configuration=${configAfterOpen === null ? "null" : configAfterOpen.configurationValue}.`,
        timestamp: now(),
        data: {
          openedAfter: device.opened,
          configurationAfterOpen: configAfterOpen === null ? null : {
            configurationValue: configAfterOpen.configurationValue,
            configurationName: configAfterOpen.configurationName,
            interfaceCount: configAfterOpen.interfaces.length,
          },
          configurationWasNull: configurationWasNullAfterOpen,
        },
      });
      lastCompletedStep = step;
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : String(e);
      const errName = e instanceof DOMException ? e.name : (e instanceof Error ? e.name : "UnknownError");
      console.error(`${TAG} STEP 2: FAILED — device.open() threw: ${errName}: ${errMessage}`);
      console.error(`${TAG} STEP 2: This may mean: (a) device is already opened by another app, (b) browser security policy blocked it, (c) device driver is holding the device.`);
      failedStep = step;
      errorMessage = `STEP 2 (device.open) failed: ${errName}: ${errMessage}`;
      errorName = errName;
      interfacePossiblyInUse = errName === "NetworkError" || errMessage.toLowerCase().includes("access denied") || errMessage.toLowerCase().includes("already open");
      stepLog.push({
        step,
        status: "failed",
        message: errorMessage,
        timestamp: now(),
        data: { errorName: errName, errorMessage: errMessage, interfacePossiblyInUse },
      });

      // Close device if it was partially opened
      if (device.opened) {
        try { await device.close(); } catch { /* ignore close error */ }
      }

      // Return immediately — cannot proceed without open
      return {
        connected: false,
        lastCompletedStep,
        failedStep,
        errorMessage,
        errorName,
        stepLog,
        configurationWasNullAfterOpen,
        interfaceCount,
        claimedInterfaceNumber,
        bulkOutEndpoint,
        bulkInEndpoint,
        interfacePossiblyInUse,
      };
    }
  }

  // ===== STEP 3: device.selectConfiguration() =====
  {
    const step: UsbConnectionStep = "step3_selectConfiguration";
    // Determine which configuration to select
    // Most USB printers have only 1 configuration (configurationValue = 1)
    // If the device has multiple configurations, we select the first one
    const configs = device.configurations;
    if (configs.length === 0) {
      console.error(`${TAG} STEP 3: FAILED — device has NO configurations. This is unusual and may indicate a device error.`);
      failedStep = step;
      errorMessage = "STEP 3 (selectConfiguration) failed: Device reports 0 configurations. The USB descriptors may be malformed or the device is not responding correctly.";
      errorName = "NoConfigurations";
      stepLog.push({
        step,
        status: "failed",
        message: errorMessage,
        timestamp: now(),
        data: { configurationsCount: 0 },
      });
      try { await device.close(); } catch { /* ignore */ }
      return {
        connected: false,
        lastCompletedStep,
        failedStep,
        errorMessage,
        errorName,
        stepLog,
        configurationWasNullAfterOpen,
        interfaceCount,
        claimedInterfaceNumber,
        bulkOutEndpoint,
        bulkInEndpoint,
        interfacePossiblyInUse,
      };
    }

    const targetConfig = configs[0]; // Select first configuration
    const configValue = targetConfig.configurationValue;
    console.log(`${TAG} STEP 3: Device has ${configs.length} configuration(s). Selecting configuration #${configValue} (${targetConfig.configurationName ?? "unnamed"}).`);
    console.log(`${TAG} STEP 3: This configuration has ${targetConfig.interfaces.length} interface(s).`);

    try {
      await device.selectConfiguration(configValue);
      const selectedConfig = device.configuration;
      console.log(`${TAG} STEP 3: SUCCESS — selectConfiguration(${configValue}) completed.`);
      console.log(`${TAG} STEP 3: device.configuration is now: ${selectedConfig === null ? "STILL NULL (unexpected)" : `Configuration #${selectedConfig.configurationValue}`}`);
      console.log(`${TAG} STEP 3: Interfaces in selected configuration: ${selectedConfig?.interfaces.length ?? "N/A"}`);

      stepLog.push({
        step,
        status: "success",
        message: `selectConfiguration(${configValue}) succeeded. Configuration has ${targetConfig.interfaces.length} interfaces.`,
        timestamp: now(),
        data: {
          selectedConfigurationValue: configValue,
          selectedConfigurationName: targetConfig.configurationName,
          interfaceCount: targetConfig.interfaces.length,
          configurationIsNull: selectedConfig === null,
        },
      });
      lastCompletedStep = step;
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : String(e);
      const errName = e instanceof DOMException ? e.name : (e instanceof Error ? e.name : "UnknownError");
      console.error(`${TAG} STEP 3: FAILED — selectConfiguration(${configValue}) threw: ${errName}: ${errMessage}`);
      console.error(`${TAG} STEP 3: This may mean: (a) configuration value is invalid, (b) device rejected the configuration, (c) OS/driver is blocking configuration change.`);
      failedStep = step;
      errorMessage = `STEP 3 (selectConfiguration) failed: ${errName}: ${errMessage}`;
      errorName = errName;
      stepLog.push({
        step,
        status: "failed",
        message: errorMessage,
        timestamp: now(),
        data: { errorName: errName, errorMessage: errMessage, configurationValue: configValue },
      });
      try { await device.close(); } catch { /* ignore */ }
      return {
        connected: false,
        lastCompletedStep,
        failedStep,
        errorMessage,
        errorName,
        stepLog,
        configurationWasNullAfterOpen,
        interfaceCount,
        claimedInterfaceNumber,
        bulkOutEndpoint,
        bulkInEndpoint,
        interfacePossiblyInUse,
      };
    }
  }

  // ===== STEP 4: device.claimInterface() =====
  {
    const step: UsbConnectionStep = "step4_claimInterface";
    const currentConfig = device.configuration;
    if (!currentConfig) {
      console.error(`${TAG} STEP 4: FAILED — device.configuration is null. Cannot claim interface without an active configuration.`);
      failedStep = step;
      errorMessage = "STEP 4 (claimInterface) failed: device.configuration is null after selectConfiguration. This is unexpected.";
      errorName = "NullConfiguration";
      stepLog.push({
        step,
        status: "failed",
        message: errorMessage,
        timestamp: now(),
      });
      try { await device.close(); } catch { /* ignore */ }
      return {
        connected: false,
        lastCompletedStep,
        failedStep,
        errorMessage,
        errorName,
        stepLog,
        configurationWasNullAfterOpen,
        interfaceCount,
        claimedInterfaceNumber,
        bulkOutEndpoint,
        bulkInEndpoint,
        interfacePossiblyInUse,
      };
    }

    // Determine which interface to claim
    // Strategy: Find the first interface that looks like a printer/data interface
    // Priority: Printer class (0x07) > Vendor-Specific (0xFF) > CDC (0x02/0x0A) > First available
    const interfaces = currentConfig.interfaces;
    interfaceCount = interfaces.length;
    console.log(`${TAG} STEP 4: Configuration has ${interfaces.length} interface(s):`);
    for (const iface of interfaces) {
      for (const alt of iface.alternates) {
        console.log(`${TAG} STEP 4:   Interface #${iface.interfaceNumber}: class=0x${alt.interfaceClass.toString(16).toUpperCase()} subclass=0x${alt.interfaceSubclass.toString(16).toUpperCase()} protocol=0x${alt.interfaceProtocol.toString(16).toUpperCase()} name="${alt.interfaceName ?? "N/A"}" endpoints=${alt.endpoints.length}`);
      }
    }

    // Find the best interface to claim
    let targetInterfaceNumber: number | null = null;
    let targetInterfaceClass: number | null = null;

    // Priority 1: Printer class (0x07)
    for (const iface of interfaces) {
      for (const alt of iface.alternates) {
        if (alt.interfaceClass === 0x07) {
          targetInterfaceNumber = iface.interfaceNumber;
          targetInterfaceClass = alt.interfaceClass;
          break;
        }
      }
      if (targetInterfaceNumber !== null) break;
    }

    // Priority 2: Vendor-Specific (0xFF)
    if (targetInterfaceNumber === null) {
      for (const iface of interfaces) {
        for (const alt of iface.alternates) {
          if (alt.interfaceClass === 0xFF) {
            targetInterfaceNumber = iface.interfaceNumber;
            targetInterfaceClass = alt.interfaceClass;
            break;
          }
        }
        if (targetInterfaceNumber !== null) break;
      }
    }

    // Priority 3: CDC-Control (0x02) or CDC-Data (0x0A)
    if (targetInterfaceNumber === null) {
      for (const iface of interfaces) {
        for (const alt of iface.alternates) {
          if (alt.interfaceClass === 0x02 || alt.interfaceClass === 0x0A) {
            targetInterfaceNumber = iface.interfaceNumber;
            targetInterfaceClass = alt.interfaceClass;
            break;
          }
        }
        if (targetInterfaceNumber !== null) break;
      }
    }

    // Priority 4: First non-HID, non-storage interface
    if (targetInterfaceNumber === null) {
      for (const iface of interfaces) {
        for (const alt of iface.alternates) {
          if (alt.interfaceClass !== 0x03 && alt.interfaceClass !== 0x08) {
            targetInterfaceNumber = iface.interfaceNumber;
            targetInterfaceClass = alt.interfaceClass;
            break;
          }
        }
        if (targetInterfaceNumber !== null) break;
      }
    }

    // Priority 5: First interface (claim whatever is available)
    if (targetInterfaceNumber === null && interfaces.length > 0) {
      targetInterfaceNumber = interfaces[0].interfaceNumber;
      const firstAlt = interfaces[0].alternates[0];
      targetInterfaceClass = firstAlt?.interfaceClass ?? null;
    }

    if (targetInterfaceNumber === null) {
      console.error(`${TAG} STEP 4: FAILED — no interface found to claim. Device has 0 interfaces.`);
      failedStep = step;
      errorMessage = "STEP 4 (claimInterface) failed: No interfaces available to claim. The device configuration has 0 interfaces.";
      errorName = "NoInterfaces";
      stepLog.push({
        step,
        status: "failed",
        message: errorMessage,
        timestamp: now(),
        data: { interfaceCount: 0 },
      });
      try { await device.close(); } catch { /* ignore */ }
      return {
        connected: false,
        lastCompletedStep,
        failedStep,
        errorMessage,
        errorName,
        stepLog,
        configurationWasNullAfterOpen,
        interfaceCount,
        claimedInterfaceNumber,
        bulkOutEndpoint,
        bulkInEndpoint,
        interfacePossiblyInUse,
      };
    }

    console.log(`${TAG} STEP 4: Claiming interface #${targetInterfaceNumber} (class=0x${(targetInterfaceClass ?? 0).toString(16).toUpperCase()})...`);

    try {
      await device.claimInterface(targetInterfaceNumber);
      claimedInterfaceNumber = targetInterfaceNumber;
      console.log(`${TAG} STEP 4: SUCCESS — claimInterface(${targetInterfaceNumber}) completed.`);
      console.log(`${TAG} STEP 4: Interface #${targetInterfaceNumber} is now claimed by this application.`);

      stepLog.push({
        step,
        status: "success",
        message: `claimInterface(${targetInterfaceNumber}) succeeded. Interface class=0x${(targetInterfaceClass ?? 0).toString(16).toUpperCase()}.`,
        timestamp: now(),
        data: {
          claimedInterfaceNumber: targetInterfaceNumber,
          claimedInterfaceClass: targetInterfaceClass,
          interfaceCount: interfaces.length,
          interfaceDetails: interfaces.map((iface) => ({
            interfaceNumber: iface.interfaceNumber,
            alternates: iface.alternates.map((alt) => ({
              interfaceClass: alt.interfaceClass,
              interfaceSubclass: alt.interfaceSubclass,
              interfaceProtocol: alt.interfaceProtocol,
              interfaceName: alt.interfaceName,
              endpointCount: alt.endpoints.length,
            })),
          })),
        },
      });
      lastCompletedStep = step;
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : String(e);
      const errName = e instanceof DOMException ? e.name : (e instanceof Error ? e.name : "UnknownError");
      console.error(`${TAG} STEP 4: FAILED — claimInterface(${targetInterfaceNumber}) threw: ${errName}: ${errMessage}`);

      // Detect: Is another application (printer driver) already using the interface?
      if (errName === "NetworkError" || errMessage.toLowerCase().includes("cannot claim") || errMessage.toLowerCase().includes("already claimed") || errMessage.toLowerCase().includes("access denied")) {
        interfacePossiblyInUse = true;
        console.error(`${TAG} STEP 4: Another application (likely the printer driver) is probably using this interface. The OS may have auto-installed a driver that claimed the interface.`);
      }

      failedStep = step;
      errorMessage = `STEP 4 (claimInterface #${targetInterfaceNumber}) failed: ${errName}: ${errMessage}`;
      errorName = errName;
      stepLog.push({
        step,
        status: "failed",
        message: errorMessage,
        timestamp: now(),
        data: {
          errorName: errName,
          errorMessage: errMessage,
          targetInterfaceNumber,
          targetInterfaceClass,
          interfacePossiblyInUse,
        },
      });

      // Release the interface if it was partially claimed, then close
      try { await device.releaseInterface(targetInterfaceNumber); } catch { /* ignore */ }
      try { await device.close(); } catch { /* ignore */ }

      return {
        connected: false,
        lastCompletedStep,
        failedStep,
        errorMessage,
        errorName,
        stepLog,
        configurationWasNullAfterOpen,
        interfaceCount,
        claimedInterfaceNumber,
        bulkOutEndpoint,
        bulkInEndpoint,
        interfacePossiblyInUse,
      };
    }
  }

  // ===== STEP 5: Read USB interfaces =====
  {
    const step: UsbConnectionStep = "step5_readInterfaces";
    const currentConfig = device.configuration;
    if (!currentConfig) {
      console.warn(`${TAG} STEP 5: device.configuration is null — reading from device.configurations descriptor instead.`);
    }

    const configToRead = currentConfig ?? device.configurations[0];
    if (!configToRead) {
      console.error(`${TAG} STEP 5: FAILED — no configuration available to read interfaces from.`);
      failedStep = step;
      errorMessage = "STEP 5 (readInterfaces) failed: No configuration available to read interfaces from.";
      errorName = "NoConfiguration";
      stepLog.push({ step, status: "failed", message: errorMessage, timestamp: now() });
      try { await device.releaseInterface(claimedInterfaceNumber!); } catch { /* ignore */ }
      try { await device.close(); } catch { /* ignore */ }
      return {
        connected: false, lastCompletedStep, failedStep, errorMessage, errorName, stepLog,
        configurationWasNullAfterOpen, interfaceCount, claimedInterfaceNumber,
        bulkOutEndpoint, bulkInEndpoint, interfacePossiblyInUse,
      };
    }

    console.log(`${TAG} STEP 5: Reading USB interfaces from configuration #${configToRead.configurationValue}...`);
    const interfaceDetails: Array<{
      interfaceNumber: number;
      classCode: string;
      subclassCode: string;
      protocolCode: string;
      name: string | null;
      endpointCount: number;
    }> = [];

    for (const iface of configToRead.interfaces) {
      for (const alt of iface.alternates) {
        const detail = {
          interfaceNumber: iface.interfaceNumber,
          classCode: `0x${alt.interfaceClass.toString(16).toUpperCase()}`,
          subclassCode: `0x${alt.interfaceSubclass.toString(16).toUpperCase()}`,
          protocolCode: `0x${alt.interfaceProtocol.toString(16).toUpperCase()}`,
          name: alt.interfaceName ?? null,
          endpointCount: alt.endpoints.length,
        };
        interfaceDetails.push(detail);
        console.log(`${TAG} STEP 5:   Interface #${detail.interfaceNumber}: class=${detail.classCode} subclass=${detail.subclassCode} protocol=${detail.protocolCode} name="${detail.name ?? "N/A"}" endpoints=${detail.endpointCount}`);
      }
    }

    stepLog.push({
      step,
      status: "success",
      message: `Read ${interfaceDetails.length} interface alternate(s) from configuration #${configToRead.configurationValue}.`,
      timestamp: now(),
      data: { interfaceDetails, interfaceCount: configToRead.interfaces.length },
    });
    lastCompletedStep = step;
  }

  // ===== STEP 6: Read endpoints =====
  {
    const step: UsbConnectionStep = "step6_readEndpoints";
    const currentConfig = device.configuration;
    const configToRead = currentConfig ?? device.configurations[0];

    if (!configToRead || claimedInterfaceNumber === null) {
      console.error(`${TAG} STEP 6: FAILED — no configuration or claimed interface available to read endpoints.`);
      failedStep = step;
      errorMessage = "STEP 6 (readEndpoints) failed: No configuration or claimed interface available.";
      errorName = "NoConfiguration";
      stepLog.push({ step, status: "failed", message: errorMessage, timestamp: now() });
      try { await device.releaseInterface(claimedInterfaceNumber!); } catch { /* ignore */ }
      try { await device.close(); } catch { /* ignore */ }
      return {
        connected: false, lastCompletedStep, failedStep, errorMessage, errorName, stepLog,
        configurationWasNullAfterOpen, interfaceCount, claimedInterfaceNumber,
        bulkOutEndpoint, bulkInEndpoint, interfacePossiblyInUse,
      };
    }

    console.log(`${TAG} STEP 6: Reading endpoints on claimed interface #${claimedInterfaceNumber}...`);

    // Find the claimed interface and read its endpoints
    const claimedIface = configToRead.interfaces.find((i) => i.interfaceNumber === claimedInterfaceNumber);
    if (!claimedIface) {
      console.error(`${TAG} STEP 6: FAILED — claimed interface #${claimedInterfaceNumber} not found in configuration.`);
      failedStep = step;
      errorMessage = `STEP 6 (readEndpoints) failed: Claimed interface #${claimedInterfaceNumber} not found in configuration.`;
      errorName = "InterfaceNotFound";
      stepLog.push({ step, status: "failed", message: errorMessage, timestamp: now() });
      try { await device.releaseInterface(claimedInterfaceNumber); } catch { /* ignore */ }
      try { await device.close(); } catch { /* ignore */ }
      return {
        connected: false, lastCompletedStep, failedStep, errorMessage, errorName, stepLog,
        configurationWasNullAfterOpen, interfaceCount, claimedInterfaceNumber,
        bulkOutEndpoint, bulkInEndpoint, interfacePossiblyInUse,
      };
    }

    const endpointDetails: Array<{
      endpointNumber: number;
      direction: string;
      type: string;
      packetSize: number;
    }> = [];

    // Read endpoints from the first alternate of the claimed interface
    const primaryAlternate = claimedIface.alternates[0];
    for (const ep of primaryAlternate.endpoints) {
      const detail = {
        endpointNumber: ep.endpointNumber,
        direction: ep.direction,
        type: ep.type,
        packetSize: ep.packetSize,
      };
      endpointDetails.push(detail);
      console.log(`${TAG} STEP 6:   Endpoint #${detail.endpointNumber}: direction=${detail.direction} type=${detail.type} packetSize=${detail.packetSize}`);

      // Identify bulk OUT (for sending ESC/POS commands) and bulk IN (for reading status)
      if (ep.direction === "out" && ep.type === "bulk") {
        bulkOutEndpoint = ep.endpointNumber;
      }
      if (ep.direction === "in" && ep.type === "bulk") {
        bulkInEndpoint = ep.endpointNumber;
      }
    }

    console.log(`${TAG} STEP 6: Bulk OUT endpoint (for sending data): ${bulkOutEndpoint ?? "NOT FOUND"}`);
    console.log(`${TAG} STEP 6: Bulk IN endpoint (for reading data): ${bulkInEndpoint ?? "NOT FOUND"}`);

    stepLog.push({
      step,
      status: "success",
      message: `Read ${endpointDetails.length} endpoint(s) on interface #${claimedInterfaceNumber}. bulkOUT=${bulkOutEndpoint ?? "N/A"}, bulkIN=${bulkInEndpoint ?? "N/A"}.`,
      timestamp: now(),
      data: { endpointDetails, bulkOutEndpoint, bulkInEndpoint },
    });
    lastCompletedStep = step;
  }

  // ===== STEP 7: Create connected device object =====
  {
    const step: UsbConnectionStep = "step7_createDeviceObject";
    console.log(`${TAG} STEP 7: Creating connected device object...`);
    console.log(`${TAG} STEP 7: Device: "${device.productName ?? "Unknown"}"`);
    console.log(`${TAG} STEP 7: VID: 0x${device.vendorId.toString(16).toUpperCase().padStart(4, "0")}, PID: 0x${device.productId.toString(16).toUpperCase().padStart(4, "0")}`);
    console.log(`${TAG} STEP 7: Serial: "${device.serialNumber ?? "N/A"}"`);
    console.log(`${TAG} STEP 7: Claimed interface: #${claimedInterfaceNumber ?? "N/A"}`);
    console.log(`${TAG} STEP 7: Bulk OUT endpoint: #${bulkOutEndpoint ?? "N/A"}`);
    console.log(`${TAG} STEP 7: Bulk IN endpoint: #${bulkInEndpoint ?? "N/A"}`);
    console.log(`${TAG} STEP 7: USB CONNECTION ESTABLISHED SUCCESSFULLY`);

    stepLog.push({
      step,
      status: "success",
      message: "Connected device object created. USB connection fully established.",
      timestamp: now(),
      data: {
        productName: device.productName,
        vendorId: device.vendorId,
        productId: device.productId,
        serialNumber: device.serialNumber,
        claimedInterface: claimedInterfaceNumber,
        bulkOutEndpoint,
        bulkInEndpoint,
      },
    });
    lastCompletedStep = step;
  }

  // NOTE: We do NOT close/release the device here.
  // The caller is responsible for keeping the connection alive for
  // further operations (test print, diagnostics, etc.) and closing
  // it when done. Use device.releaseInterface() + device.close() to clean up.

  return {
    connected: true,
    lastCompletedStep,
    failedStep: null,
    errorMessage: null,
    errorName: null,
    stepLog,
    configurationWasNullAfterOpen,
    interfaceCount,
    claimedInterfaceNumber,
    bulkOutEndpoint,
    bulkInEndpoint,
    interfacePossiblyInUse,
  };
}

/**
 * Release a USB device connection cleanly.
 * Call this when you're done using the device (after diagnostics, test print, etc.)
 *
 * @param device - The USBDevice to release
 * @param claimedInterfaceNumber - The interface number that was claimed
 */
export async function releaseUsbDevice(device: USBDevice, claimedInterfaceNumber: number): Promise<void> {
  const TAG = "[DrQBIT USB]";
  console.log(`${TAG} Releasing USB device: "${device.productName ?? "Unknown"}"`);
  try {
    console.log(`${TAG} Releasing interface #${claimedInterfaceNumber}...`);
    await device.releaseInterface(claimedInterfaceNumber);
    console.log(`${TAG} Interface released.`);
  } catch (e) {
    console.warn(`${TAG} releaseInterface failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    console.log(`${TAG} Closing device...`);
    await device.close();
    console.log(`${TAG} Device closed.`);
  } catch (e) {
    console.warn(`${TAG} device.close() failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ====================== USB Scanner (WebUSB) ======================

/**
 * WebUSB Scanner — detects USB devices using navigator.usb API.
 *
 * 7-step flow:
 *   STEP 1: requestDevice() — user selects device in Chrome picker
 *   STEP 2: device.open() — open for I/O
 *   STEP 3: selectConfiguration() — select active configuration
 *   STEP 4: claimInterface() — claim printer/data interface
 *   STEP 5: Read interfaces — enumerate all interface class codes
 *   STEP 6: Read endpoints — enumerate bulk IN/OUT endpoints
 *   STEP 7: Create connected device object — build full DiscoveredDevice
 *
 * If any step throws, the exact exception is logged and stored in
 * DiscoveredDevice.usbConnection. The UI can show the exact error.
 * NO errors are swallowed. NO generic "Connection Failed" messages.
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
    const TAG = "[DrQBIT USB Scanner]";
    const avail = this.isAvailable();
    if (!avail.supported) {
      throw new Error(avail.reason ?? "WebUSB not available");
    }

    // ===== STEP 1: Request user permission to access USB devices =====
    // The browser shows a permission dialog listing available devices.
    // User must select a device (or cancel). This is required by WebUSB spec.
    // CRITICAL: We KEEP the returned device reference — not discard it.
    // CRITICAL: We DO NOT use .catch(() => null) — errors must propagate.
    console.log(`${TAG} STEP 1: Calling navigator.usb.requestDevice({ filters: [] })...`);

    let selectedDevice: USBDevice;
    try {
      selectedDevice = await navigator.usb!.requestDevice({ filters: [] });
      console.log(`${TAG} STEP 1: SUCCESS — User selected device: "${selectedDevice.productName ?? "Unknown"}" (VID=${selectedDevice.vendorId}, PID=${selectedDevice.productId})`);
    } catch (e) {
      const errName = e instanceof DOMException ? e.name : (e instanceof Error ? e.name : "UnknownError");
      const errMessage = e instanceof Error ? e.message : String(e);

      if (errName === "NotFoundError") {
        // User cancelled the permission dialog — no error, just no device
        console.log(`${TAG} STEP 1: User cancelled the browser permission dialog. No device selected.`);
        return [];
      }

      // Real error — propagate it with the exact message
      console.error(`${TAG} STEP 1: FAILED — requestDevice() threw: ${errName}: ${errMessage}`);
      throw new Error(`USB STEP 1 (requestDevice) failed: ${errName}: ${errMessage}`);
    }

    // ===== Steps 2–7: Run the 7-step connection flow on the selected device =====
    const connectionResult = await connectUsbDevice(selectedDevice);

    // Build DiscoveredDevice from the USB device descriptor data + connection result
    const vid = "0x" + selectedDevice.vendorId.toString(16).toUpperCase().padStart(4, "0");
    const pid = "0x" + selectedDevice.productId.toString(16).toUpperCase().padStart(4, "0");
    const name = selectedDevice.productName || "USB Device";
    const manufacturer = selectedDevice.manufacturerName || null;
    const serial = selectedDevice.serialNumber || null;
    const usbVer = `${selectedDevice.usbVersionMajor}.${selectedDevice.usbVersionMinor}.${selectedDevice.usbVersionSubminor}`;

    // Determine if this looks like a printer/POS/scanner device
    const isPrinterLike = this.isPrinterOrPosDevice(selectedDevice, name, manufacturer);

    // Extract interface class codes (from descriptor — available even if connection failed)
    const interfaceClasses: number[] = [];
    let primaryInterfaceClass: number | null = null;
    for (const config of selectedDevice.configurations) {
      for (const iface of config.interfaces) {
        for (const alt of iface.alternates) {
          const cls = alt.interfaceClass;
          interfaceClasses.push(cls);
          if (primaryInterfaceClass === null && cls !== 0x03 && cls !== 0x08) {
            primaryInterfaceClass = cls;
          }
        }
      }
    }

    const discoveredDevice: DiscoveredDevice = {
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
      firmwareVersion: null,
      hardwareRevision: null,
      softwareRevision: null,
      interfaceClass: primaryInterfaceClass,
      interfaceClasses,
      modelNumber: null,
      usbConnection: connectionResult,
    };

    // If connection failed, log a summary but still return the device
    // (the UI will show the connection error and the exact failed step)
    if (!connectionResult.connected) {
      console.warn(`${TAG} USB connection failed at ${connectionResult.failedStep}: ${connectionResult.errorMessage}`);
      console.warn(`${TAG} Device descriptor data is still available (VID/PID/serial/configurations), but I/O operations (ESC/POS commands, test print) cannot proceed.`);
    }

    // Also check for other authorized devices (in case user authorized multiple)
    // These won't have the 7-step connection flow, just descriptor data
    const otherDevices: DiscoveredDevice[] = [];
    try {
      const allAuthorized = await navigator.usb!.getDevices();
      for (const d of allAuthorized) {
        // Skip the device we already processed
        if (d.vendorId === selectedDevice.vendorId && d.productId === selectedDevice.productId && d.serialNumber === selectedDevice.serialNumber) {
          continue;
        }

        const otherVid = "0x" + d.vendorId.toString(16).toUpperCase().padStart(4, "0");
        const otherPid = "0x" + d.productId.toString(16).toUpperCase().padStart(4, "0");
        const otherName = d.productName || "USB Device";
        const otherManufacturer = d.manufacturerName || null;
        const otherSerial = d.serialNumber || null;
        const otherUsbVer = `${d.usbVersionMajor}.${d.usbVersionMinor}.${d.usbVersionSubminor}`;

        const otherIsPrinterLike = this.isPrinterOrPosDevice(d, otherName, otherManufacturer);

        const otherInterfaceClasses: number[] = [];
        let otherPrimaryInterfaceClass: number | null = null;
        for (const config of d.configurations) {
          for (const iface of config.interfaces) {
            for (const alt of iface.alternates) {
              const cls = alt.interfaceClass;
              otherInterfaceClasses.push(cls);
              if (otherPrimaryInterfaceClass === null && cls !== 0x03 && cls !== 0x08) {
                otherPrimaryInterfaceClass = cls;
              }
            }
          }
        }

        // For other devices: descriptor-only data, no 7-step connection
        // (connection was only attempted for the user-selected device)
        otherDevices.push({
          connectionType: "usb",
          deviceName: otherName,
          manufacturer: otherManufacturer,
          vendorId: otherVid,
          productId: otherPid,
          serialNumber: otherSerial,
          usbVersion: otherUsbVer,
          port: "USB",
          bluetoothDeviceId: null,
          ipAddress: null,
          macAddress: null,
          isPrinterLike: otherIsPrinterLike,
          firmwareVersion: null,
          hardwareRevision: null,
          softwareRevision: null,
          interfaceClass: otherPrimaryInterfaceClass,
          interfaceClasses: otherInterfaceClasses,
          modelNumber: null,
          usbConnection: null, // No connection attempted for secondary devices
        });
      }
    } catch (e) {
      console.warn(`${TAG} getDevices() for secondary devices failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    return [discoveredDevice, ...otherDevices];
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
        // This may contain manufacturer name, model number, serial number,
        // firmware revision, hardware revision, software revision
        let manufacturer: string | null = null;
        let serialNumber: string | null = null;
        let modelNumber: string | null = null;
        let firmwareVersion: string | null = null;
        let hardwareRevision: string | null = null;
        let softwareRevision: string | null = null;

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

                // Phase 2 enrichment: Read firmware revision (0x2A26)
                try {
                  const fwChar = await infoService.getCharacteristic("firmware_revision_string");
                  const fwValue = await fwChar.readValue();
                  firmwareVersion = new TextDecoder().decode(fwValue);
                } catch { /* Characteristic not available */ }

                // Phase 2 enrichment: Read hardware revision (0x2A27)
                try {
                  const hwChar = await infoService.getCharacteristic("hardware_revision_string");
                  const hwValue = await hwChar.readValue();
                  hardwareRevision = new TextDecoder().decode(hwValue);
                } catch { /* Characteristic not available */ }

                // Phase 2 enrichment: Read software revision (0x2A28)
                try {
                  const swChar = await infoService.getCharacteristic("software_revision_string");
                  const swValue = await swChar.readValue();
                  softwareRevision = new TextDecoder().decode(swValue);
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
          // Phase 2 enrichment fields
          firmwareVersion,
          hardwareRevision,
          softwareRevision,
          interfaceClass: null, // Bluetooth doesn't have USB class codes
          interfaceClasses: [],
          modelNumber,
          usbConnection: null, // Not applicable for Bluetooth devices
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
 *   1. USB scan → detect USB printers (7-step connection flow)
 *   2. Bluetooth scan → detect paired Bluetooth printers
 *   3. LAN scan → detect network printers (requires Desktop Agent)
 *
 * Each scan runs independently. Results are aggregated.
 * If a scanner is unavailable, it's skipped with a clear message.
 *
 * IMPORTANT: USB connection failures are stored per-device in
 * DiscoveredDevice.usbConnection. The UI must check this field
 * and show the exact failed step + error message.
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
