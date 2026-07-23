/**
 * Dr. QBIT Phase 5 — Diagnostic Adapters
 *
 * Extensible adapter pattern for LIVE hardware diagnostics.
 * Each device type (thermal printer, barcode printer, POS, etc.)
 * has a DiagnosticAdapter that implements device-specific diagnostic checks.
 *
 * The core Diagnostic Engine calls adapters for hardware-specific operations.
 * New device types need ONLY a DiagnosticAdapter + CapabilityProfile —
 * the core engine remains unchanged.
 *
 * Architecture:
 *   DiagnosticAdapterRegistry → getAdapter(deviceType) → DiagnosticAdapter
 *     → checkHardware()      → HardwareHealthCheck
 *     → validateDriver()     → DriverValidationResult
 *     → validateFirmware()   → FirmwareValidationResult
 *     → testCommunication()  → CommunicationConnectionTest[]
 *     → testPrintEngine()    → PrintEngineTestResult
 *     → validateCapabilities → CapabilityHealthCheck[]
 *     → detectErrors()       → DetectedError[]
 *
 * All adapter methods communicate with the Desktop Agent for REAL hardware
 * data. No fake/simulated responses.
 *
 * RULES:
 *   - Adapter methods MUST NOT return fake/mock/simulated data.
 *   - If Desktop Agent is unavailable → adapter returns clear error.
 *   - If device doesn't respond → adapter returns "device_offline" error.
 *   - Unsupported capabilities → NOT included in results.
 *   - New device types: only add adapter + register it. Core engine unchanged.
 */

import type { DeviceConnection, DeviceType, DeviceCapability } from "./types";
import type { ConfigurationResult, ConfigurationConnectionType } from "./configuration-types";
import type { CloudLookupResult } from "./cloud-lookup-types";
import type {
  DiagnosticConnectionType,
  DiagnosticStepStatus,
  HardwareHealthCheck,
  HardwareConnectionHealth,
  DriverValidationResult,
  FirmwareValidationResult,
  FirmwareUpdateStatus,
  CommunicationConnectionTest,
  CommunicationFailureStage,
  PrintEngineTestResult,
  CapabilityHealthCheck,
  CapabilityHealthStatus,
  DetectedError,
  DiagnosticErrorType,
  DiagnosticErrorSeverity,
  DiagnosticComponent,
  DesktopAgentDiagnosticCommand,
  DesktopAgentDiagnosticResponse,
  DiagnosticAgentCommandType,
  mapConfigToDiagConnection,
} from "./diagnostic-types";

// ====================== Desktop Agent Communication ======================

const DESKTOP_AGENT_URL = "http://localhost:53742/command";

/**
 * Sends a diagnostic command to the Desktop Agent and receives the result.
 *
 * This is the ONLY way to get REAL hardware diagnostic data.
 * The web app CANNOT directly access USB/Bluetooth/LAN — it must
 * go through the Desktop Agent running on the engineer's machine.
 *
 * If the Desktop Agent is not running → returns clear error.
 * No fake/simulated responses.
 */
export async function sendDiagnosticCommand(
  command: DesktopAgentDiagnosticCommand,
): Promise<DesktopAgentDiagnosticResponse> {
  try {
    const response = await fetch(DESKTOP_AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      return {
        success: false,
        command: command.command,
        data: {},
        error: `Desktop Agent returned HTTP ${response.status}`,
        errorCode: "desktop_agent_error",
        durationMs: 0,
      };
    }

    const data = await response.json();
    return data as DesktopAgentDiagnosticResponse;
  } catch (error) {
    return {
      success: false,
      command: command.command,
      data: {},
      error: error instanceof Error ? error.message : "Desktop Agent unavailable",
      errorCode: "desktop_agent_unavailable",
      durationMs: 0,
    };
  }
}

/**
 * Checks if the Desktop Agent is available for live diagnostics.
 *
 * If unavailable → diagnostics MUST NOT proceed with hardware checks.
 * Only database-based analysis (existing diagnostic engine) can run.
 */
export async function isDesktopAgentAvailable(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:53742/health", {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ====================== Diagnostic Adapter Interface ======================

/**
 * Diagnostic Adapter — device-type-specific live diagnostic operations.
 *
 * Each adapter knows how to:
 *   - Check hardware health for its device type
 *   - Validate driver installation and compatibility
 *   - Validate firmware and compare with latest versions
 *   - Test communication on supported connection types
 *   - Test the print/output engine
 *   - Validate device-specific capabilities
 *   - Detect device-specific errors
 *
 * The core Diagnostic Engine delegates hardware operations to adapters.
 * New device types ONLY need to implement this interface and register
 * their adapter — the engine stays the same.
 */
export interface DiagnosticAdapter {
  /** The device type this adapter handles. */
  deviceType: DeviceType;
  /** Human-readable label for this device type. */
  label: string;

  /** Check hardware health — device online, responding, connection stable. */
  checkHardware(
    deviceInfo: DiagnosticDeviceInfo,
    agentAvailable: boolean,
  ): Promise<HardwareHealthCheck>;

  /** Validate driver — installed, version, corrupted, compatible. */
  validateDriver(
    deviceInfo: DiagnosticDeviceInfo,
    cloudLookup: CloudLookupResult,
    agentAvailable: boolean,
  ): Promise<DriverValidationResult>;

  /** Validate firmware — installed vs latest, update status, corrupted. */
  validateFirmware(
    deviceInfo: DiagnosticDeviceInfo,
    cloudLookup: CloudLookupResult,
    agentAvailable: boolean,
  ): Promise<FirmwareValidationResult>;

  /** Test communication on supported connection types. */
  testCommunication(
    deviceInfo: DiagnosticDeviceInfo,
    configResult: ConfigurationResult,
    agentAvailable: boolean,
  ): Promise<CommunicationConnectionTest[]>;

  /** Test the print/output engine. */
  testPrintEngine(
    deviceInfo: DiagnosticDeviceInfo,
    agentAvailable: boolean,
  ): Promise<PrintEngineTestResult>;

  /** Validate device-specific capabilities. */
  validateCapabilities(
    deviceInfo: DiagnosticDeviceInfo,
    supportedCapabilities: DeviceCapability[],
    agentAvailable: boolean,
  ): Promise<CapabilityHealthCheck[]>;

  /** Detect device-specific errors. */
  detectErrors(
    deviceInfo: DiagnosticDeviceInfo,
    hardwareHealth: HardwareHealthCheck | null,
    driverValidation: DriverValidationResult | null,
    firmwareValidation: FirmwareValidationResult | null,
    communicationTests: CommunicationConnectionTest[] | null,
    agentAvailable: boolean,
  ): Promise<DetectedError[]>;
}

/**
 * Device identification info passed to diagnostic adapters.
 *
 * Contains all the information the adapter needs to identify
 * and communicate with the device. Sourced from Phase 4 output.
 */
export interface DiagnosticDeviceInfo {
  /** Serial number of the device. */
  serialNumber: string | null;
  /** Device model name. */
  model: string | null;
  /** Device type (thermal_printer, barcode_scanner, etc.). */
  deviceType: DeviceType;
  /** Primary connection type (from Phase 4 configuration). */
  connectionType: DiagnosticConnectionType | null;
  /** IP address (for LAN/Wi-Fi). Null for USB/Bluetooth. */
  ipAddress: string | null;
  /** USB Vendor ID. Null for non-USB devices. */
  vendorId: string | null;
  /** USB Product ID. Null for non-USB devices. */
  productId: string | null;
  /** Port the device is on. Null if unknown. */
  port: string | null;
  /** Device name from hardware. */
  deviceName: string | null;
  /** Firmware version (from Phase 2/4). */
  firmwareVersion: string | null;
  /** Driver name (from Desktop Agent). */
  driverName: string | null;
  /** Passport ID for DB reference. */
  passportId: string | null;
  /** All supported capabilities (from Phase 2 identification). */
  capabilities: DeviceCapability[];
}

// ====================== Adapter Registry ======================

/** Registry of all diagnostic adapters — extensible at runtime. */
const adapterRegistry = new Map<DeviceType, DiagnosticAdapter>();

/**
 * Register a diagnostic adapter for a device type.
 *
 * Call this before running diagnostics. Adapters are registered once
 * and reused for all subsequent diagnostic runs of that device type.
 *
 * Example:
 *   registerDiagnosticAdapter(new ThermalPrinterDiagnosticAdapter());
 *   registerDiagnosticAdapter(new BarcodePrinterDiagnosticAdapter());
 */
export function registerDiagnosticAdapter(adapter: DiagnosticAdapter): void {
  adapterRegistry.set(adapter.deviceType, adapter);
}

/**
 * Get the diagnostic adapter for a device type.
 *
 * Returns null if no adapter is registered for this device type.
 * The engine will fall back to the BaseDiagnosticAdapter.
 */
export function getDiagnosticAdapter(deviceType: DeviceType): DiagnosticAdapter | null {
  return adapterRegistry.get(deviceType) ?? null;
}

/**
 * Get all registered diagnostic adapters.
 */
export function getAllDiagnosticAdapters(): DiagnosticAdapter[] {
  return Array.from(adapterRegistry.values());
}

/**
 * Get the applicable adapter for a device, falling back to BaseDiagnosticAdapter
 * if no specific adapter is registered.
 */
export function getApplicableDiagnosticAdapter(deviceType: DeviceType): DiagnosticAdapter {
  const specific = adapterRegistry.get(deviceType);
  if (specific) return specific;
  // Fall back to base adapter — handles common diagnostic operations
  return BaseDiagnosticAdapter;
}

// ====================== Base Diagnostic Adapter ======================

/**
 * Base Diagnostic Adapter — handles common diagnostic operations
 * for all device types that don't have a specific adapter.
 *
 * Uses Desktop Agent for REAL hardware checks.
 * Falls back to database-based analysis if agent is unavailable.
 *
 * NEVER returns fake/mock/simulated data.
 */
export const BaseDiagnosticAdapter: DiagnosticAdapter = {
  deviceType: "unknown",
  label: "Base Diagnostic Adapter",

  async checkHardware(
    deviceInfo: DiagnosticDeviceInfo,
    agentAvailable: boolean,
  ): Promise<HardwareHealthCheck> {
    const now = new Date().toISOString();

    if (!agentAvailable) {
      return {
        deviceOnline: false,
        deviceResponding: false,
        connectionStable: false,
        printerReady: false,
        connectionHealth: [],
        status: "failed",
        errorMessage: "Desktop Agent Not Available — cannot check hardware health. Live diagnostics require the Desktop Agent running on the engineer's machine.",
        checkedAt: now,
      };
    }

    // Send hardware check command to Desktop Agent
    const result = await sendDiagnosticCommand({
      command: "check_hardware",
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productId ?? undefined,
        port: deviceInfo.port ?? undefined,
        ipAddress: deviceInfo.ipAddress ?? undefined,
      },
      parameters: {
        checkOnline: true,
        checkResponding: true,
        checkConnectionStable: true,
        checkPrinterReady: true,
      },
    });

    if (!result.success) {
      return {
        deviceOnline: false,
        deviceResponding: false,
        connectionStable: false,
        printerReady: false,
        connectionHealth: [],
        status: "failed",
        errorMessage: result.error ?? "Hardware check failed — device did not respond",
        checkedAt: now,
      };
    }

    const data = result.data;
    const connectionHealth: HardwareConnectionHealth[] = [];

    // Build per-connection health results from Desktop Agent data
    const connections = (data.connections as Array<{
      type: string;
      connected: boolean;
      stable: boolean;
      dataFlow: boolean;
      details: Record<string, unknown>;
      status: string;
      errorMessage: string | null;
    }> | null) ?? [];

    for (const conn of connections) {
      const validTypes: DiagnosticConnectionType[] = ["usb", "lan", "wifi", "bluetooth"];
      if (validTypes.includes(conn.type as DiagnosticConnectionType)) {
        connectionHealth.push({
          connectionType: conn.type as DiagnosticConnectionType,
          connected: conn.connected,
          stable: conn.stable,
          dataFlow: conn.dataFlow,
          details: conn.details,
          status: (conn.status as DiagnosticStepStatus) ?? (conn.connected ? "successful" : "failed"),
          errorMessage: conn.errorMessage ?? null,
        });
      }
    }

    const deviceOnline = (data.deviceOnline as boolean) ?? false;
    const deviceResponding = (data.deviceResponding as boolean) ?? false;
    const connectionStable = (data.connectionStable as boolean) ?? false;
    const printerReady = (data.printerReady as boolean) ?? false;

    // Determine overall status
    let status: DiagnosticStepStatus = "successful";
    let errorMessage: string | null = null;

    if (!deviceOnline) {
      status = "failed";
      errorMessage = "Device Offline — not responding to any connection";
    } else if (!deviceResponding) {
      status = "failed";
      errorMessage = "Device Connected but Not Responding to commands";
    } else if (!connectionStable) {
      status = "partial";
      errorMessage = "Connection Unstable — intermittent communication";
    } else if (!printerReady) {
      status = "partial";
      errorMessage = "Device Responding but Printer Not Ready — may be busy or in error state";
    }

    return {
      deviceOnline,
      deviceResponding,
      connectionStable,
      printerReady,
      connectionHealth,
      status,
      errorMessage,
      checkedAt: now,
    };
  },

  async validateDriver(
    deviceInfo: DiagnosticDeviceInfo,
    cloudLookup: CloudLookupResult,
    agentAvailable: boolean,
  ): Promise<DriverValidationResult> {
    const now = new Date().toISOString();

    if (!agentAvailable) {
      // Fall back to database-based driver validation from Phase 3 data
      const firmwareCompat = cloudLookup.firmwareCompatibility;
      return {
        driverInstalled: false,
        driverName: null,
        driverVersion: null,
        latestDriverVersion: null,
        isLatest: false,
        driverCorrupted: false,
        driverCompatible: false,
        compatibleDriverAvailable: cloudLookup.resources.drivers.length > 0,
        driverDownloadUrl: cloudLookup.resources.drivers.length > 0
          ? cloudLookup.resources.drivers[0].url ?? null
          : null,
        status: "partial",
        errorMessage: "Desktop Agent Not Available — driver validation based on database records only. Cannot verify real driver status.",
        checkedAt: now,
      };
    }

    // Send driver check command to Desktop Agent
    const result = await sendDiagnosticCommand({
      command: "check_driver",
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productId ?? undefined,
      },
      parameters: {
        checkInstalled: true,
        checkVersion: true,
        checkCorrupted: true,
        checkCompatible: true,
      },
    });

    const data = result.success ? result.data : {};
    const driverInstalled = (data.driverInstalled as boolean) ?? false;
    const driverName = (data.driverName as string) ?? null;
    const driverVersion = (data.driverVersion as string) ?? null;
    const driverCorrupted = (data.driverCorrupted as boolean) ?? false;
    const driverCompatible = (data.driverCompatible as boolean) ?? true;

    // Compare with latest from Phase 3 resources
    const latestDriverVersion = cloudLookup.resources.drivers.length > 0
      ? cloudLookup.resources.drivers[0].version ?? null
      : null;
    const isLatest = driverVersion && latestDriverVersion
      ? driverVersion === latestDriverVersion
      : false;
    const compatibleDriverAvailable = cloudLookup.resources.drivers.length > 0;
    const driverDownloadUrl = cloudLookup.resources.drivers.length > 0
      ? cloudLookup.resources.drivers[0].url ?? null
      : null;

    // Determine status
    let status: DiagnosticStepStatus = "successful";
    let errorMessage: string | null = null;

    if (!driverInstalled) {
      status = "failed";
      errorMessage = "Driver Not Installed — compatible driver available for download";
    } else if (driverCorrupted) {
      status = "failed";
      errorMessage = "Driver Corrupted — reinstall the latest driver";
    } else if (!driverCompatible) {
      status = "failed";
      errorMessage = `Driver "${driverName}" v${driverVersion} is not compatible with this device model`;
    } else if (!isLatest) {
      status = "partial";
      errorMessage = `Driver v${driverVersion} installed — update available to v${latestDriverVersion ?? "latest"}`;
    }

    return {
      driverInstalled,
      driverName,
      driverVersion,
      latestDriverVersion,
      isLatest,
      driverCorrupted,
      driverCompatible,
      compatibleDriverAvailable,
      driverDownloadUrl,
      status,
      errorMessage,
      checkedAt: now,
    };
  },

  async validateFirmware(
    deviceInfo: DiagnosticDeviceInfo,
    cloudLookup: CloudLookupResult,
    agentAvailable: boolean,
  ): Promise<FirmwareValidationResult> {
    const now = new Date().toISOString();

    // Firmware validation can partially work without Desktop Agent
    // (we have firmware version from Phase 2 and cloud data from Phase 3)
    const installedFirmware = deviceInfo.firmwareVersion ?? cloudLookup.firmwareCompatibility?.currentFirmware ?? null;
    const latestFirmware = cloudLookup.firmwareCompatibility?.latestFirmware ?? null;
    const latestFirmwareReleaseDate = cloudLookup.firmwareCompatibility?.latestFirmwareReleaseDate ?? null;
    const isLatest = installedFirmware && latestFirmware
      ? installedFirmware === latestFirmware
      : false;
    const isSupported = cloudLookup.firmwareCompatibility?.isCompatible ?? true;
    const firmwareDownloadUrl = cloudLookup.firmwareCompatibility?.latestFirmwareDownloadUrl ?? null;
    const isCritical = cloudLookup.firmwareCompatibility?.isCritical ?? false;

    // Check for corruption if Desktop Agent is available
    let isCorrupted = false;
    if (agentAvailable && installedFirmware) {
      const result = await sendDiagnosticCommand({
        command: "check_firmware",
        deviceIdentifier: {
          serialNumber: deviceInfo.serialNumber ?? undefined,
          vendorId: deviceInfo.vendorId ?? undefined,
          productIdCode: deviceInfo.productId ?? undefined,
        },
        parameters: {
          checkCorrupted: true,
          firmwareVersion: installedFirmware,
        },
      });
      if (result.success) {
        isCorrupted = (result.data.firmwareCorrupted as boolean) ?? false;
      }
    }

    // Determine update status
    let updateStatus: FirmwareUpdateStatus = "unknown";
    if (isCorrupted) {
      updateStatus = "corrupted";
    } else if (isLatest) {
      updateStatus = "latest";
    } else if (installedFirmware && latestFirmware && !isLatest) {
      updateStatus = "update_available";
    } else if (!isSupported) {
      updateStatus = "unsupported";
    }

    // Determine overall status
    let status: DiagnosticStepStatus = "successful";
    let errorMessage: string | null = null;

    if (isCorrupted) {
      status = "failed";
      errorMessage = "Firmware Appears Corrupted — device returning invalid responses. Firmware update recommended.";
    } else if (updateStatus === "unsupported") {
      status = "failed";
      errorMessage = `Firmware v${installedFirmware ?? "unknown"} is unsupported/deprecated — update to v${latestFirmware ?? "latest"}`;
    } else if (updateStatus === "update_available") {
      status = "partial";
      errorMessage = `Firmware v${installedFirmware ?? "unknown"} — update available to v${latestFirmware ?? "latest"}${isCritical ? " (Critical Update)" : ""}`;
    } else if (updateStatus === "unknown") {
      status = "not_tested";
      errorMessage = "Firmware version could not be determined — unable to compare with latest";
    }

    return {
      installedFirmware,
      latestFirmware,
      latestFirmwareReleaseDate,
      isLatest,
      updateStatus,
      isCritical,
      isSupported,
      isCorrupted,
      firmwareDownloadUrl,
      status,
      errorMessage,
      checkedAt: now,
    };
  },

  async testCommunication(
    deviceInfo: DiagnosticDeviceInfo,
    configResult: ConfigurationResult,
    agentAvailable: boolean,
  ): Promise<CommunicationConnectionTest[]> {
    const tests: CommunicationConnectionTest[] = [];

    if (!agentAvailable) {
      // Cannot test live communication without Desktop Agent
      // Return "not tested" for each supported connection type
      const supportedTypes = getSupportedConnectionTypes(configResult);
      for (const connType of supportedTypes) {
        tests.push({
          connectionType: connType,
          connected: false,
          commandSent: false,
          responseReceived: false,
          failureStage: "not_connected",
          responseData: null,
          responseLatencyMs: null,
          status: "not_tested",
          errorMessage: "Desktop Agent Not Available — cannot test live communication",
        });
      }
      return tests;
    }

    // Test each supported connection type
    const supportedTypes = getSupportedConnectionTypes(configResult);

    for (const connType of supportedTypes) {
      // Send communication test command to Desktop Agent
      const result = await sendDiagnosticCommand({
        command: "check_communication",
        deviceIdentifier: {
          serialNumber: deviceInfo.serialNumber ?? undefined,
          vendorId: deviceInfo.vendorId ?? undefined,
          productIdCode: deviceInfo.productId ?? undefined,
          port: deviceInfo.port ?? undefined,
          ipAddress: deviceInfo.ipAddress ?? undefined,
        },
        parameters: {
          connectionType: connType,
          sendCommand: true,
          expectResponse: true,
          timeoutMs: 5000,
        },
      });

      const data = result.success ? result.data : {};
      const connected = (data.connected as boolean) ?? false;
      const commandSent = (data.commandSent as boolean) ?? false;
      const responseReceived = (data.responseReceived as boolean) ?? false;
      const responseData = (data.responseData as Record<string, unknown>) ?? null;
      const responseLatencyMs = (data.responseLatencyMs as number) ?? null;

      // Determine failure stage (if any)
      let failureStage: CommunicationFailureStage | null = null;
      let status: DiagnosticStepStatus = "successful";
      let errorMessage: string | null = null;

      if (!connected) {
        failureStage = "not_connected";
        status = "failed";
        errorMessage = `${connType.toUpperCase()} Not Connected — device not available on this interface`;
      } else if (!commandSent) {
        failureStage = "command_send_failed";
        status = "failed";
        errorMessage = `${connType.toUpperCase()} Connected but Command Send Failed — check driver/port`;
      } else if (!responseReceived) {
        failureStage = "no_response";
        status = "failed";
        errorMessage = `${connType.toUpperCase()} Command Sent but No Response Received — printer not responding`;
      }

      // Check for timeout in error code
      if (result.errorCode === "timeout" || result.errorCode === "communication_timeout") {
        failureStage = "timeout";
        status = "failed";
        errorMessage = `${connType.toUpperCase()} Communication Timeout — device took too long to respond`;
      }

      tests.push({
        connectionType: connType,
        connected,
        commandSent,
        responseReceived,
        failureStage,
        responseData,
        responseLatencyMs,
        status,
        errorMessage,
      });
    }

    return tests;
  },

  async testPrintEngine(
    deviceInfo: DiagnosticDeviceInfo,
    agentAvailable: boolean,
  ): Promise<PrintEngineTestResult> {
    const now = new Date().toISOString();

    if (!agentAvailable) {
      return {
        printStarted: false,
        printCompleted: false,
        printTimeout: false,
        printerBusy: false,
        testContent: null,
        printDurationMs: null,
        status: "not_tested",
        errorMessage: "Desktop Agent Not Available — cannot test print engine. Live diagnostics require the Desktop Agent.",
        checkedAt: now,
      };
    }

    // Send print engine test command to Desktop Agent
    const result = await sendDiagnosticCommand({
      command: "check_print_engine",
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productId ?? undefined,
        port: deviceInfo.port ?? undefined,
        ipAddress: deviceInfo.ipAddress ?? undefined,
      },
      parameters: {
        testType: "mini_test_print",
        content: `QBIT Diagnostic Test\nModel: ${deviceInfo.model ?? "Unknown"}\nDate: ${new Date().toLocaleDateString()}\nTime: ${new Date().toLocaleTimeString()}`,
        timeoutMs: 10000,
      },
    });

    const data = result.success ? result.data : {};
    const printStarted = (data.printStarted as boolean) ?? false;
    const printCompleted = (data.printCompleted as boolean) ?? false;
    const printTimeout = (data.printTimeout as boolean) ?? false;
    const printerBusy = (data.printerBusy as boolean) ?? false;
    const testContent = (data.testContent as string) ?? null;
    const printDurationMs = (data.printDurationMs as number) ?? null;

    // Determine status
    let status: DiagnosticStepStatus = "successful";
    let errorMessage: string | null = null;

    if (printerBusy) {
      status = "failed";
      errorMessage = "Printer Busy — cannot test print engine now. Wait for current job to finish.";
    } else if (printTimeout) {
      status = "failed";
      errorMessage = "Print Engine Timeout — test command was sent but print did not complete within expected time";
    } else if (!printStarted) {
      status = "failed";
      errorMessage = "Print Engine Test Failed — test command could not be sent to printer";
    } else if (!printCompleted) {
      status = "partial";
      errorMessage = "Print Started but Not Confirmed Completed — check if paper came out of printer";
    }

    if (result.success && printCompleted) {
      errorMessage = null;
      status = "successful";
    }

    return {
      printStarted,
      printCompleted,
      printTimeout,
      printerBusy,
      testContent,
      printDurationMs,
      status,
      errorMessage,
      checkedAt: now,
    };
  },

  async validateCapabilities(
    deviceInfo: DiagnosticDeviceInfo,
    supportedCapabilities: DeviceCapability[],
    agentAvailable: boolean,
  ): Promise<CapabilityHealthCheck[]> {
    const checks: CapabilityHealthCheck[] = [];

    if (!agentAvailable) {
      // Cannot validate capabilities without Desktop Agent
      // Return "not_tested" for each supported capability
      for (const cap of supportedCapabilities) {
        checks.push({
          capability: cap,
          label: CAPABILITY_LABEL_MAP[cap] ?? cap,
          functioning: false,
          healthStatus: "not_tested",
          diagnosticData: null,
          errorMessage: "Desktop Agent Not Available — cannot validate device capabilities",
        });
      }
      return checks;
    }

    // Send capability check command to Desktop Agent
    const result = await sendDiagnosticCommand({
      command: "check_capabilities",
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productId ?? undefined,
      },
      parameters: {
        capabilities: supportedCapabilities,
        checkEach: true,
      },
    });

    const data = result.success ? result.data : {};
    const capabilityResults = (data.capabilityResults as Array<{
      capability: string;
      functioning: boolean;
      healthStatus: string;
      diagnosticData: Record<string, unknown> | null;
      errorMessage: string | null;
    }> | null) ?? [];

    // Build capability health checks from results
    for (const cap of supportedCapabilities) {
      const capResult = capabilityResults.find((r) => r.capability === cap);

      checks.push({
        capability: cap,
        label: CAPABILITY_LABEL_MAP[cap] ?? cap,
        functioning: capResult?.functioning ?? false,
        healthStatus: (capResult?.healthStatus as CapabilityHealthStatus) ?? "not_tested",
        diagnosticData: capResult?.diagnosticData ?? null,
        errorMessage: capResult?.errorMessage ?? (capResult?.functioning ? null : "Capability check could not be verified"),
      });
    }

    return checks;
  },

  async detectErrors(
    deviceInfo: DiagnosticDeviceInfo,
    hardwareHealth: HardwareHealthCheck | null,
    driverValidation: DriverValidationResult | null,
    firmwareValidation: FirmwareValidationResult | null,
    communicationTests: CommunicationConnectionTest[] | null,
    agentAvailable: boolean,
  ): Promise<DetectedError[]> {
    const errors: DetectedError[] = [];
    const now = new Date().toISOString();

    // Detect errors from hardware health check
    if (hardwareHealth) {
      if (!hardwareHealth.deviceOnline) {
        errors.push({
          errorType: "printer_offline",
          errorName: "Printer Offline",
          reason: "Device is not online or not responding to any connection interface",
          affectedComponent: "hardware",
          severity: "critical",
          active: true,
          detectedAt: now,
          deviceErrorData: null,
        });
      }

      if (!hardwareHealth.deviceResponding) {
        errors.push({
          errorType: "communication_lost",
          errorName: "Communication Lost",
          reason: "Device is connected but not responding to diagnostic commands",
          affectedComponent: "communication",
          severity: "error",
          active: true,
          detectedAt: now,
          deviceErrorData: null,
        });
      }

      // Per-connection errors
      for (const connHealth of hardwareHealth.connectionHealth) {
        if (!connHealth.connected) {
          const errorTypeMap: Record<string, DiagnosticErrorType> = {
            usb: "usb_disconnected",
            bluetooth: "bluetooth_lost",
            lan: "lan_failure",
            wifi: "wifi_failure",
          };
          const errorNameMap: Record<string, string> = {
            usb: "USB Disconnected",
            bluetooth: "Bluetooth Lost",
            lan: "LAN Failure",
            wifi: "Wi-Fi Failure",
          };
          const reasonMap: Record<string, string> = {
            usb: "USB cable disconnected or device unplugged from USB port",
            bluetooth: "Bluetooth connection dropped or device moved out of range",
            lan: "LAN cable disconnected or network switch error",
            wifi: "Wi-Fi connection lost — check network availability and credentials",
          };

          errors.push({
            errorType: errorTypeMap[connHealth.connectionType] ?? "unknown_error",
            errorName: errorNameMap[connHealth.connectionType] ?? "Connection Failure",
            reason: connHealth.errorMessage ?? reasonMap[connHealth.connectionType] ?? "Connection not available",
            affectedComponent: "communication",
            severity: "error",
            active: true,
            detectedAt: now,
            deviceErrorData: connHealth.details,
          });
        }
      }
    }

    // Detect errors from driver validation
    if (driverValidation) {
      if (!driverValidation.driverInstalled) {
        errors.push({
          errorType: "driver_missing",
          errorName: "Driver Missing",
          reason: `No driver installed for this device model (${deviceInfo.model ?? "unknown"})`,
          affectedComponent: "driver",
          severity: "error",
          active: true,
          detectedAt: now,
          deviceErrorData: null,
        });
      } else if (driverValidation.driverCorrupted) {
        errors.push({
          errorType: "driver_corrupted",
          errorName: "Driver Corrupted",
          reason: `Driver "${driverValidation.driverName ?? "unknown"}" is corrupted — file integrity check failed`,
          affectedComponent: "driver",
          severity: "error",
          active: true,
          detectedAt: now,
          deviceErrorData: null,
        });
      }
    }

    // Detect errors from firmware validation
    if (firmwareValidation) {
      if (firmwareValidation.isCorrupted) {
        errors.push({
          errorType: "firmware_corrupted",
          errorName: "Firmware Corrupted",
          reason: `Firmware v${firmwareValidation.installedFirmware ?? "unknown"} appears corrupted — device returning invalid diagnostic responses`,
          affectedComponent: "firmware",
          severity: "critical",
          active: true,
          detectedAt: now,
          deviceErrorData: null,
        });
      } else if (firmwareValidation.updateStatus === "unsupported") {
        errors.push({
          errorType: "firmware_mismatch",
          errorName: "Firmware Mismatch",
          reason: `Firmware v${firmwareValidation.installedFirmware ?? "unknown"} is unsupported/deprecated — update to v${firmwareValidation.latestFirmware ?? "latest"}`,
          affectedComponent: "firmware",
          severity: "warning",
          active: true,
          detectedAt: now,
          deviceErrorData: null,
        });
      }
    }

    // Detect errors from communication tests
    if (communicationTests) {
      for (const test of communicationTests) {
        if (test.status === "failed" && test.failureStage) {
          // Only add if not already detected from hardware health
          // (avoid duplicate errors for the same connection issue)
          const alreadyDetected = errors.some((e) =>
            e.errorType === `${test.connectionType}_disconnected` ||
            e.errorType === `${test.connectionType}_lost` ||
            e.errorType === `${test.connectionType}_failure`,
          );

          if (!alreadyDetected && test.failureStage === "timeout") {
            errors.push({
              errorType: "network_timeout",
              errorName: `${test.connectionType.toUpperCase()} Communication Timeout`,
              reason: test.errorMessage ?? `${test.connectionType.toUpperCase()} communication timed out during diagnostic command`,
              affectedComponent: "communication",
              severity: "warning",
              active: true,
              detectedAt: now,
              deviceErrorData: test.responseData,
            });
          }
        }
      }
    }

    // Detect printer-specific errors from Desktop Agent (if available)
    if (agentAvailable) {
      const result = await sendDiagnosticCommand({
        command: "detect_errors",
        deviceIdentifier: {
          serialNumber: deviceInfo.serialNumber ?? undefined,
          vendorId: deviceInfo.vendorId ?? undefined,
          productIdCode: deviceInfo.productId ?? undefined,
        },
        parameters: {
          checkPaper: true,
          checkCover: true,
          checkCutter: true,
          checkTemperature: true,
          checkPower: true,
          checkMemory: true,
        },
      });

      if (result.success) {
        const agentErrors = (result.data.errors as Array<{
          type: string;
          name: string;
          reason: string;
          severity: string;
          active: boolean;
          data: Record<string, unknown>;
        }> | null) ?? [];

        for (const agentErr of agentErrors) {
          // Only add if not already detected from previous checks
          const alreadyDetected = errors.some((e) => e.errorType === agentErr.type);
          if (!alreadyDetected) {
            errors.push({
              errorType: (agentErr.type as DiagnosticErrorType) ?? "unknown_error",
              errorName: agentErr.name,
              reason: agentErr.reason,
              affectedComponent: mapErrorToComponent(agentErr.type),
              severity: (agentErr.severity as DiagnosticErrorSeverity) ?? "warning",
              active: agentErr.active ?? true,
              detectedAt: now,
              deviceErrorData: agentErr.data,
            });
          }
        }
      }
    }

    return errors;
  },
};

// ====================== Thermal Printer Diagnostic Adapter ======================

/**
 * Thermal Printer Diagnostic Adapter — specific diagnostics for thermal printers.
 *
 * Extends the BaseDiagnosticAdapter with thermal printer-specific checks:
 *   - Paper sensor validation
 *   - Cover sensor check
 *   - Auto cutter test
 *   - Cash drawer kick test
 *   - Print density/temperature check
 *   - ESC/POS command set validation
 */
export class ThermalPrinterDiagnosticAdapter implements DiagnosticAdapter {
  deviceType: DeviceType = "thermal_printer";
  label = "Thermal Printer Diagnostic Adapter";

  async checkHardware(
    deviceInfo: DiagnosticDeviceInfo,
    agentAvailable: boolean,
  ): Promise<HardwareHealthCheck> {
    // Delegate to base adapter for common checks
    return BaseDiagnosticAdapter.checkHardware(deviceInfo, agentAvailable);
  }

  async validateDriver(
    deviceInfo: DiagnosticDeviceInfo,
    cloudLookup: CloudLookupResult,
    agentAvailable: boolean,
  ): Promise<DriverValidationResult> {
    return BaseDiagnosticAdapter.validateDriver(deviceInfo, cloudLookup, agentAvailable);
  }

  async validateFirmware(
    deviceInfo: DiagnosticDeviceInfo,
    cloudLookup: CloudLookupResult,
    agentAvailable: boolean,
  ): Promise<FirmwareValidationResult> {
    return BaseDiagnosticAdapter.validateFirmware(deviceInfo, cloudLookup, agentAvailable);
  }

  async testCommunication(
    deviceInfo: DiagnosticDeviceInfo,
    configResult: ConfigurationResult,
    agentAvailable: boolean,
  ): Promise<CommunicationConnectionTest[]> {
    return BaseDiagnosticAdapter.testCommunication(deviceInfo, configResult, agentAvailable);
  }

  async testPrintEngine(
    deviceInfo: DiagnosticDeviceInfo,
    agentAvailable: boolean,
  ): Promise<PrintEngineTestResult> {
    // Thermal printer-specific print engine test
    if (!agentAvailable) {
      return {
        printStarted: false,
        printCompleted: false,
        printTimeout: false,
        printerBusy: false,
        testContent: null,
        printDurationMs: null,
        status: "not_tested",
        errorMessage: "Desktop Agent Not Available — cannot test thermal printer print engine",
        checkedAt: new Date().toISOString(),
      };
    }

    // Use base adapter for common print engine test
    return BaseDiagnosticAdapter.testPrintEngine(deviceInfo, agentAvailable);
  }

  async validateCapabilities(
    deviceInfo: DiagnosticDeviceInfo,
    supportedCapabilities: DeviceCapability[],
    agentAvailable: boolean,
  ): Promise<CapabilityHealthCheck[]> {
    // Use base adapter first, then add thermal printer-specific capability checks
    const baseChecks = await BaseDiagnosticAdapter.validateCapabilities(deviceInfo, supportedCapabilities, agentAvailable);

    // Add thermal printer-specific capability checks if Desktop Agent is available
    if (agentAvailable) {
      const thermalCaps: DeviceCapability[] = ["auto_cutter", "cash_drawer", "receipt_printing", "esc_pos_protocol"];
      for (const cap of thermalCaps) {
        if (supportedCapabilities.includes(cap) && !baseChecks.some((c) => c.capability === cap)) {
          baseChecks.push({
            capability: cap,
            label: CAPABILITY_LABEL_MAP[cap] ?? cap,
            functioning: false,
            healthStatus: "not_tested",
            diagnosticData: null,
            errorMessage: "Thermal printer-specific capability not yet validated",
          });
        }
      }
    }

    return baseChecks;
  }

  async detectErrors(
    deviceInfo: DiagnosticDeviceInfo,
    hardwareHealth: HardwareHealthCheck | null,
    driverValidation: DriverValidationResult | null,
    firmwareValidation: FirmwareValidationResult | null,
    communicationTests: CommunicationConnectionTest[] | null,
    agentAvailable: boolean,
  ): Promise<DetectedError[]> {
    // Use base adapter for common error detection
    return BaseDiagnosticAdapter.detectErrors(
      deviceInfo, hardwareHealth, driverValidation, firmwareValidation, communicationTests, agentAvailable,
    );
  }
}

// ====================== Barcode Printer Diagnostic Adapter ======================

/**
 * Barcode Printer Diagnostic Adapter — specific diagnostics for barcode/label printers.
 *
 * Adds barcode-specific checks:
 *   - Barcode print quality test
 *   - Label media sensor validation
 *   - Label printing engine test
 *   - Barcode symbology support check
 */
export class BarcodePrinterDiagnosticAdapter implements DiagnosticAdapter {
  deviceType: DeviceType = "label_printer";
  label = "Barcode/Label Printer Diagnostic Adapter";

  async checkHardware(deviceInfo: DiagnosticDeviceInfo, agentAvailable: boolean): Promise<HardwareHealthCheck> {
    return BaseDiagnosticAdapter.checkHardware(deviceInfo, agentAvailable);
  }
  async validateDriver(deviceInfo: DiagnosticDeviceInfo, cloudLookup: CloudLookupResult, agentAvailable: boolean): Promise<DriverValidationResult> {
    return BaseDiagnosticAdapter.validateDriver(deviceInfo, cloudLookup, agentAvailable);
  }
  async validateFirmware(deviceInfo: DiagnosticDeviceInfo, cloudLookup: CloudLookupResult, agentAvailable: boolean): Promise<FirmwareValidationResult> {
    return BaseDiagnosticAdapter.validateFirmware(deviceInfo, cloudLookup, agentAvailable);
  }
  async testCommunication(deviceInfo: DiagnosticDeviceInfo, configResult: ConfigurationResult, agentAvailable: boolean): Promise<CommunicationConnectionTest[]> {
    return BaseDiagnosticAdapter.testCommunication(deviceInfo, configResult, agentAvailable);
  }
  async testPrintEngine(deviceInfo: DiagnosticDeviceInfo, agentAvailable: boolean): Promise<PrintEngineTestResult> {
    return BaseDiagnosticAdapter.testPrintEngine(deviceInfo, agentAvailable);
  }
  async validateCapabilities(deviceInfo: DiagnosticDeviceInfo, supportedCapabilities: DeviceCapability[], agentAvailable: boolean): Promise<CapabilityHealthCheck[]> {
    const baseChecks = await BaseDiagnosticAdapter.validateCapabilities(deviceInfo, supportedCapabilities, agentAvailable);
    // Add barcode-specific checks for supported capabilities
    if (agentAvailable) {
      const barcodeCaps: DeviceCapability[] = ["barcode_printing", "label_printing"];
      for (const cap of barcodeCaps) {
        if (supportedCapabilities.includes(cap) && !baseChecks.some((c) => c.capability === cap)) {
          baseChecks.push({
            capability: cap,
            label: CAPABILITY_LABEL_MAP[cap] ?? cap,
            functioning: false,
            healthStatus: "not_tested",
            diagnosticData: null,
            errorMessage: "Barcode/label capability not yet validated",
          });
        }
      }
    }
    return baseChecks;
  }
  async detectErrors(deviceInfo: DiagnosticDeviceInfo, hardwareHealth: HardwareHealthCheck | null, driverValidation: DriverValidationResult | null, firmwareValidation: FirmwareValidationResult | null, communicationTests: CommunicationConnectionTest[] | null, agentAvailable: boolean): Promise<DetectedError[]> {
    return BaseDiagnosticAdapter.detectErrors(deviceInfo, hardwareHealth, driverValidation, firmwareValidation, communicationTests, agentAvailable);
  }
}

// ====================== POS Diagnostic Adapter ======================

/**
 * Windows POS Diagnostic Adapter — specific diagnostics for Windows POS terminals.
 *
 * Adds POS-specific checks:
 *   - POS application integration test
 *   - Multi-device coordination check (printer + drawer + display)
 *   - POS mode capability validation
 */
export class WindowsPosDiagnosticAdapter implements DiagnosticAdapter {
  deviceType: DeviceType = "windows_pos";
  label = "Windows POS Diagnostic Adapter";

  async checkHardware(deviceInfo: DiagnosticDeviceInfo, agentAvailable: boolean): Promise<HardwareHealthCheck> {
    return BaseDiagnosticAdapter.checkHardware(deviceInfo, agentAvailable);
  }
  async validateDriver(deviceInfo: DiagnosticDeviceInfo, cloudLookup: CloudLookupResult, agentAvailable: boolean): Promise<DriverValidationResult> {
    return BaseDiagnosticAdapter.validateDriver(deviceInfo, cloudLookup, agentAvailable);
  }
  async validateFirmware(deviceInfo: DiagnosticDeviceInfo, cloudLookup: CloudLookupResult, agentAvailable: boolean): Promise<FirmwareValidationResult> {
    return BaseDiagnosticAdapter.validateFirmware(deviceInfo, cloudLookup, agentAvailable);
  }
  async testCommunication(deviceInfo: DiagnosticDeviceInfo, configResult: ConfigurationResult, agentAvailable: boolean): Promise<CommunicationConnectionTest[]> {
    return BaseDiagnosticAdapter.testCommunication(deviceInfo, configResult, agentAvailable);
  }
  async testPrintEngine(deviceInfo: DiagnosticDeviceInfo, agentAvailable: boolean): Promise<PrintEngineTestResult> {
    return BaseDiagnosticAdapter.testPrintEngine(deviceInfo, agentAvailable);
  }
  async validateCapabilities(deviceInfo: DiagnosticDeviceInfo, supportedCapabilities: DeviceCapability[], agentAvailable: boolean): Promise<CapabilityHealthCheck[]> {
    const baseChecks = await BaseDiagnosticAdapter.validateCapabilities(deviceInfo, supportedCapabilities, agentAvailable);
    if (agentAvailable) {
      const posCaps: DeviceCapability[] = ["pos_mode", "cash_drawer", "display_output"];
      for (const cap of posCaps) {
        if (supportedCapabilities.includes(cap) && !baseChecks.some((c) => c.capability === cap)) {
          baseChecks.push({
            capability: cap,
            label: CAPABILITY_LABEL_MAP[cap] ?? cap,
            functioning: false,
            healthStatus: "not_tested",
            diagnosticData: null,
            errorMessage: "POS capability not yet validated",
          });
        }
      }
    }
    return baseChecks;
  }
  async detectErrors(deviceInfo: DiagnosticDeviceInfo, hardwareHealth: HardwareHealthCheck | null, driverValidation: DriverValidationResult | null, firmwareValidation: FirmwareValidationResult | null, communicationTests: CommunicationConnectionTest[] | null, agentAvailable: boolean): Promise<DetectedError[]> {
    return BaseDiagnosticAdapter.detectErrors(deviceInfo, hardwareHealth, driverValidation, firmwareValidation, communicationTests, agentAvailable);
  }
}

// ====================== Android POS Diagnostic Adapter ======================

export class AndroidPosDiagnosticAdapter implements DiagnosticAdapter {
  deviceType: DeviceType = "android_pos";
  label = "Android POS Diagnostic Adapter";

  async checkHardware(deviceInfo: DiagnosticDeviceInfo, agentAvailable: boolean): Promise<HardwareHealthCheck> {
    return BaseDiagnosticAdapter.checkHardware(deviceInfo, agentAvailable);
  }
  async validateDriver(deviceInfo: DiagnosticDeviceInfo, cloudLookup: CloudLookupResult, agentAvailable: boolean): Promise<DriverValidationResult> {
    return BaseDiagnosticAdapter.validateDriver(deviceInfo, cloudLookup, agentAvailable);
  }
  async validateFirmware(deviceInfo: DiagnosticDeviceInfo, cloudLookup: CloudLookupResult, agentAvailable: boolean): Promise<FirmwareValidationResult> {
    return BaseDiagnosticAdapter.validateFirmware(deviceInfo, cloudLookup, agentAvailable);
  }
  async testCommunication(deviceInfo: DiagnosticDeviceInfo, configResult: ConfigurationResult, agentAvailable: boolean): Promise<CommunicationConnectionTest[]> {
    return BaseDiagnosticAdapter.testCommunication(deviceInfo, configResult, agentAvailable);
  }
  async testPrintEngine(deviceInfo: DiagnosticDeviceInfo, agentAvailable: boolean): Promise<PrintEngineTestResult> {
    return BaseDiagnosticAdapter.testPrintEngine(deviceInfo, agentAvailable);
  }
  async validateCapabilities(deviceInfo: DiagnosticDeviceInfo, supportedCapabilities: DeviceCapability[], agentAvailable: boolean): Promise<CapabilityHealthCheck[]> {
    return BaseDiagnosticAdapter.validateCapabilities(deviceInfo, supportedCapabilities, agentAvailable);
  }
  async detectErrors(deviceInfo: DiagnosticDeviceInfo, hardwareHealth: HardwareHealthCheck | null, driverValidation: DriverValidationResult | null, firmwareValidation: FirmwareValidationResult | null, communicationTests: CommunicationConnectionTest[] | null, agentAvailable: boolean): Promise<DetectedError[]> {
    return BaseDiagnosticAdapter.detectErrors(deviceInfo, hardwareHealth, driverValidation, firmwareValidation, communicationTests, agentAvailable);
  }
}

// ====================== Barcode Scanner Diagnostic Adapter ======================

export class BarcodeScannerDiagnosticAdapter implements DiagnosticAdapter {
  deviceType: DeviceType = "barcode_scanner";
  label = "Barcode Scanner Diagnostic Adapter";

  async checkHardware(deviceInfo: DiagnosticDeviceInfo, agentAvailable: boolean): Promise<HardwareHealthCheck> {
    return BaseDiagnosticAdapter.checkHardware(deviceInfo, agentAvailable);
  }
  async validateDriver(deviceInfo: DiagnosticDeviceInfo, cloudLookup: CloudLookupResult, agentAvailable: boolean): Promise<DriverValidationResult> {
    return BaseDiagnosticAdapter.validateDriver(deviceInfo, cloudLookup, agentAvailable);
  }
  async validateFirmware(deviceInfo: DiagnosticDeviceInfo, cloudLookup: CloudLookupResult, agentAvailable: boolean): Promise<FirmwareValidationResult> {
    return BaseDiagnosticAdapter.validateFirmware(deviceInfo, cloudLookup, agentAvailable);
  }
  async testCommunication(deviceInfo: DiagnosticDeviceInfo, configResult: ConfigurationResult, agentAvailable: boolean): Promise<CommunicationConnectionTest[]> {
    return BaseDiagnosticAdapter.testCommunication(deviceInfo, configResult, agentAvailable);
  }
  async testPrintEngine(deviceInfo: DiagnosticDeviceInfo, agentAvailable: boolean): Promise<PrintEngineTestResult> {
    // Barcode scanners don't have print engines — return "not_supported"
    return {
      printStarted: false,
      printCompleted: false,
      printTimeout: false,
      printerBusy: false,
      testContent: null,
      printDurationMs: null,
      status: "not_supported",
      errorMessage: "Barcode Scanner does not have a print engine — test not applicable",
      checkedAt: new Date().toISOString(),
    };
  }
  async validateCapabilities(deviceInfo: DiagnosticDeviceInfo, supportedCapabilities: DeviceCapability[], agentAvailable: boolean): Promise<CapabilityHealthCheck[]> {
    const baseChecks = await BaseDiagnosticAdapter.validateCapabilities(deviceInfo, supportedCapabilities, agentAvailable);
    if (agentAvailable) {
      const scannerCaps: DeviceCapability[] = ["scanner_mode", "esc_pos_protocol"];
      for (const cap of scannerCaps) {
        if (supportedCapabilities.includes(cap) && !baseChecks.some((c) => c.capability === cap)) {
          baseChecks.push({
            capability: cap,
            label: CAPABILITY_LABEL_MAP[cap] ?? cap,
            functioning: false,
            healthStatus: "not_tested",
            diagnosticData: null,
            errorMessage: "Scanner capability not yet validated",
          });
        }
      }
    }
    return baseChecks;
  }
  async detectErrors(deviceInfo: DiagnosticDeviceInfo, hardwareHealth: HardwareHealthCheck | null, driverValidation: DriverValidationResult | null, firmwareValidation: FirmwareValidationResult | null, communicationTests: CommunicationConnectionTest[] | null, agentAvailable: boolean): Promise<DetectedError[]> {
    return BaseDiagnosticAdapter.detectErrors(deviceInfo, hardwareHealth, driverValidation, firmwareValidation, communicationTests, agentAvailable);
  }
}

// ====================== Helper Functions ======================

/**
 * Maps a DeviceConnection from Phase 4 to DiagnosticConnectionType.
 */
export function mapConnectionType(conn: DeviceConnection): DiagnosticConnectionType {
  return conn as DiagnosticConnectionType;
}

/**
 * Gets supported connection types from ConfigurationResult.
 *
 * Only returns types that were actually configured or supported by the device.
 * No fake/unsupported connection types.
 */
export function getSupportedConnectionTypes(
  configResult: ConfigurationResult,
): DiagnosticConnectionType[] {
  const types: DiagnosticConnectionType[] = [];

  if (configResult.capabilities?.supportsUsb) types.push("usb");
  if (configResult.capabilities?.supportsLan) types.push("lan");
  if (configResult.capabilities?.supportsWifi) types.push("wifi");
  if (configResult.capabilities?.supportsBluetooth) types.push("bluetooth");

  // Also check active connection type if capabilities not set
  if (types.length === 0 && configResult.connectionType) {
    types.push(configResult.connectionType as DiagnosticConnectionType);
  }

  return types;
}

/**
 * Builds DiagnosticDeviceInfo from ConfigurationResult + CloudLookupResult.
 *
 * Merges Phase 4 configuration data with Phase 3 cloud data to build
 * the complete device info needed by diagnostic adapters.
 */
export function buildDiagnosticDeviceInfo(
  configResult: ConfigurationResult,
  cloudLookup: CloudLookupResult,
): DiagnosticDeviceInfo {
  const serialNumber = cloudLookup.device.serialNumber ?? configResult.savedProfile?.serialNumber ?? null;
  const model = cloudLookup.device.model ?? cloudLookup.product?.model ?? null;
  const deviceType = cloudLookup.device.deviceType ?? "unknown";

  // Determine primary connection type and IP
  let connectionType: DiagnosticConnectionType | null = null;
  let ipAddress: string | null = null;

  if (configResult.connectionType) {
    connectionType = configResult.connectionType as DiagnosticConnectionType;
  }

  // Get IP from the configured connection
  if (configResult.wifiResult?.connected) {
    ipAddress = configResult.wifiResult.ipAddress ?? null;
    connectionType ??= "wifi";
  } else if (configResult.lanResult?.connected) {
    ipAddress = configResult.lanResult.ipAddress ?? null;
    connectionType ??= "lan";
  }

  // Get USB-specific info
  const vendorId = configResult.usbResult?.vendorId ?? cloudLookup.device.serialNumber ? null : null;
  const productId = configResult.usbResult?.productIdCode ?? null;
  const port = configResult.usbResult?.port ?? null;

  // Get firmware version
  const firmwareVersion = configResult.firmware ?? cloudLookup.firmwareCompatibility?.currentFirmware ?? null;

  // Get driver name
  const driverName = configResult.usbResult?.driverName ?? null;

  // Get passport ID
  const passportId = configResult.savedProfile?.passportId ?? null;

  // Get capabilities
  const capabilities = cloudLookup.device.deviceType === "unknown"
    ? []
    : Object.entries(configResult.capabilities ?? {})
        .filter(([key, val]) => {
          const capMap: Record<string, DeviceCapability> = {
            supportsUsb: "usb",
            supportsLan: "lan",
            supportsWifi: "wifi",
            supportsBluetooth: "bluetooth",
            supportsCashDrawer: "cash_drawer",
            supportsFirmwareUpgrade: "firmware_upgrade",
            supportsAutoDriverInstall: "auto_cutter",
            supportsSdk: "esc_pos_protocol",
            supportsFirmwareConfig: "firmware_upgrade",
          };
          return val === true && capMap[key] !== undefined;
        })
        .map(([key]) => {
          const capMap: Record<string, DeviceCapability> = {
            supportsUsb: "usb",
            supportsLan: "lan",
            supportsWifi: "wifi",
            supportsBluetooth: "bluetooth",
            supportsCashDrawer: "cash_drawer",
            supportsFirmwareUpgrade: "firmware_upgrade",
            supportsSdk: "esc_pos_protocol",
          };
          return capMap[key] as DeviceCapability;
        });

  return {
    serialNumber,
    model,
    deviceType,
    connectionType,
    ipAddress,
    vendorId,
    productId,
    port,
    deviceName: cloudLookup.device.productName ?? null,
    firmwareVersion,
    driverName,
    passportId,
    capabilities,
  };
}

/** Capability label mapping for human-readable names. */
const CAPABILITY_LABEL_MAP: Record<string, string> = {
  usb: "USB Connection",
  lan: "Ethernet (LAN)",
  wifi: "Wi-Fi Module",
  bluetooth: "Bluetooth Module",
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

/** Maps device error type string to DiagnosticComponent. */
function mapErrorToComponent(errorType: string): DiagnosticComponent {
  const map: Record<string, DiagnosticComponent> = {
    paper_out: "paper_path",
    paper_jam: "paper_path",
    cover_open: "cover",
    cutter_error: "cutter",
    printer_offline: "hardware",
    communication_lost: "communication",
    driver_missing: "driver",
    driver_corrupted: "driver",
    firmware_mismatch: "firmware",
    firmware_corrupted: "firmware",
    usb_disconnected: "communication",
    bluetooth_lost: "communication",
    lan_failure: "network",
    wifi_failure: "network",
    network_timeout: "network",
    printer_busy: "printing",
    temperature_error: "hardware",
    power_error: "power",
    memory_error: "memory",
    unknown_error: "hardware",
  };
  return map[errorType] ?? "hardware";
}

// ====================== Auto-register Default Adapters ======================

// Register adapters for all known device types at module load time.
// New device types can register additional adapters at runtime.
registerDiagnosticAdapter(new ThermalPrinterDiagnosticAdapter());
registerDiagnosticAdapter(new BarcodePrinterDiagnosticAdapter());
registerDiagnosticAdapter(new WindowsPosDiagnosticAdapter());
registerDiagnosticAdapter(new AndroidPosDiagnosticAdapter());
registerDiagnosticAdapter(new BarcodeScannerDiagnosticAdapter());
