/**
 * Dr. QBIT Phase 4 — Configuration Adapters
 *
 * Extensible adapter pattern for device configuration. Each connection
 * type has its own adapter that handles the specific configuration flow
 * for that connection type. The core engine orchestrates but never
 * hardcodes connection-specific logic.
 *
 * Architecture:
 *   ConfigurationAdapter (interface)
 *     → UsbConfigurationAdapter
 *     → LanConfigurationAdapter
 *     → WifiConfigurationAdapter
 *     → BluetoothConfigurationAdapter
 *
 * The Desktop Agent handles all local hardware operations. The web app
 * sends commands to Desktop Agent (localhost:53742) and receives real
 * results. No fake/simulated responses.
 *
 * RULES:
 *   - NO fake/dummy/mock/placeholder data in any adapter result.
 *   - If Desktop Agent is unavailable → clear error, NO simulated success.
 *   - If a device doesn't support a connection type → adapter returns "not_supported".
 *   - Communication MUST be verified BEFORE reporting success.
 *   - All adapter results are logged as ConfigurationEvents.
 *
 * Future compatibility:
 *   - New device types (barcode scanners, POS terminals, etc.) can reuse
 *     existing adapters for their connection types.
 *   - New connection types (NFC, Zigbee, etc.) can be added by creating
 *     a new adapter — the core engine doesn't change.
 */

import type { DeviceConnection, DeviceCapability } from "./types";
import type {
  ConfigurationConnectionType,
  ConfigurationStepStatus,
  UsbConfigurationResult,
  WifiConfigurationResult,
  WifiConfigurationRequest,
  WifiErrorCode,
  LanConfigurationResult,
  BluetoothConfigurationResult,
  CommunicationTestResult,
  TestPrintResult,
  DesktopAgentConfigCommand,
  DesktopAgentConfigResponse,
  AgentCommandType,
} from "./configuration-types";

// ====================== Desktop Agent Communication ======================

const DESKTOP_AGENT_BASE_URL = "http://localhost:53742";

/**
 * Sends a configuration command to the Desktop Agent.
 *
 * This is the ONLY way to perform hardware operations from the web app.
 * The Desktop Agent runs locally on the engineer's machine and has
 * direct access to USB, Bluetooth, LAN, and Wi-Fi hardware.
 *
 * If Desktop Agent is unavailable → returns a clear error response.
 * NEVER simulates or fakes a successful hardware operation.
 */
export async function sendDesktopAgentCommand(
  command: DesktopAgentConfigCommand,
): Promise<DesktopAgentConfigResponse> {
  try {
    const response = await fetch(`${DESKTOP_AGENT_BASE_URL}/configuration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(command.agentSecret
          ? { "X-Agent-Secret": command.agentSecret }
          : {}),
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(15000), // 15s timeout for hardware operations
    });

    if (!response.ok) {
      return {
        success: false,
        command: command.command,
        data: {},
        error: `Desktop Agent returned HTTP ${response.status}`,
        errorCode: "desktop_agent_error",
      };
    }

    const result: DesktopAgentConfigResponse = await response.json();
    return result;
  } catch (error) {
    // Desktop Agent unavailable — NO simulated/fake response
    const errorMessage =
      error instanceof DOMException && error.name === "TimeoutError"
        ? "Desktop Agent connection timeout — please ensure the agent is running"
        : "Desktop Agent not available — please install and run the QBIT Desktop Agent";

    return {
      success: false,
      command: command.command,
      data: {},
      error: errorMessage,
      errorCode: "desktop_agent_unavailable",
    };
  }
}

/**
 * Checks if the Desktop Agent is available.
 *
 * Used before starting configuration to give the user a clear message
 * if the agent is not running. NEVER silently proceeds without the agent.
 */
export async function isDesktopAgentAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${DESKTOP_AGENT_BASE_URL}/ping`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5s ping timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ====================== Adapter Interface ======================

/**
 * Configuration Adapter — the extensible interface for all connection types.
 *
 * Each adapter handles:
 *   1. Reading device-specific configuration info
 *   2. Performing the configuration (via Desktop Agent)
 *   3. Verifying the configuration was successful
 *
 * The core engine calls adapters based on device capabilities.
 * New connection types can be added by creating a new adapter class.
 */
export interface ConfigurationAdapter {
  /** The connection type this adapter handles. */
  connectionType: ConfigurationConnectionType;

  /** Whether this adapter requires the Desktop Agent. */
  requiresDesktopAgent: boolean;

  /**
   * Configure the device for this connection type.
   *
   * Sends commands to Desktop Agent and returns REAL results.
   * NEVER returns simulated/fake success data.
   */
  configure(
    deviceInfo: DeviceIdentificationInfo,
    configParams?: Record<string, unknown>,
    agentSecret?: string,
  ): Promise<AdapterConfigurationResult>;

  /**
   * Verify that the configuration is working (communication test).
   */
  verifyCommunication(
    deviceInfo: DeviceIdentificationInfo,
    agentSecret?: string,
  ): Promise<CommunicationTestResult>;

  /**
   * Determine if this adapter is applicable for the given capabilities.
   */
  isApplicable(capabilities: DeviceCapability[], productCapabilities: ProductConnectionCapabilities): boolean;
}

/** Device identification info passed to adapters. */
export interface DeviceIdentificationInfo {
  serialNumber: string | null;
  vendorId: string | null;
  productIdCode: string | null;
  port: string | null;
  deviceName: string | null;
  model: string | null;
  firmwareVersion: string | null;
  connectionType: DeviceConnection;
}

/** Product-level connection capabilities (from QbitProduct V4 fields). */
export interface ProductConnectionCapabilities {
  supportsWifi: boolean;
  autoDriverInstall: boolean;
  sdkAvailable: boolean;
  firmwareConfigSupported: boolean;
  connectionTypes: string[];
}

/**
 * Adapter configuration result — unified result type for all adapters.
 *
 * Contains the common fields plus a `connectionData` JSON object
 * that holds connection-type-specific data (USB, LAN, Wi-Fi, BT).
 * This avoids TypeScript interface intersection conflicts.
 */
export interface AdapterConfigurationResult {
  /** The connection type that was configured. */
  connectionType: ConfigurationConnectionType;
  /** Overall step status. */
  status: ConfigurationStepStatus;
  /** Whether the Desktop Agent was used. */
  usedDesktopAgent: boolean;
  /** Duration of the configuration step in ms. */
  durationMs: number;
  /** Error message if status is failed. Null if successful. */
  errorMessage: string | null;
  /** Error code if status is failed. Null if successful. */
  errorCode: string | null;
  /** Connection-type-specific data (varies by adapter). */
  connectionData: Record<string, unknown>;
}

// ====================== Helper: Extract string from agent response ======================

/**
 * Safely extracts a string value from Desktop Agent response data.
 * Returns null if the value is not a string.
 */
function extractString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === "string" ? value : null;
}

/**
 * Safely extracts a number value from Desktop Agent response data.
 * Returns null if the value is not a number.
 */
function extractNumber(data: Record<string, unknown>, key: string): number | null {
  const value = data[key];
  return typeof value === "number" ? value : null;
}

/**
 * Safely extracts a boolean value from Desktop Agent response data.
 * Returns false if the value is not a boolean.
 */
function extractBoolean(data: Record<string, unknown>, key: string): boolean {
  const value = data[key];
  return value === true;
}

// ====================== USB Adapter ======================

/**
 * USB Configuration Adapter — handles USB connection verification.
 *
 * Flow (per spec):
 *   1. Verify Driver Installed
 *   2. Verify Port Available
 *   3. Verify Communication Active
 *   4. Verify Printer Responding
 *
 * If all pass → "USB Connection Successful"
 * If any fail → clear error message
 */
export class UsbConfigurationAdapter implements ConfigurationAdapter {
  connectionType: ConfigurationConnectionType = "usb";
  requiresDesktopAgent = true;

  async configure(
    deviceInfo: DeviceIdentificationInfo,
    configParams?: Record<string, unknown>,
    agentSecret?: string,
  ): Promise<AdapterConfigurationResult> {
    const startTime = Date.now();

    const command: DesktopAgentConfigCommand = {
      command: "configure_usb" as AgentCommandType,
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productIdCode ?? undefined,
        port: deviceInfo.port ?? undefined,
      },
      parameters: configParams ?? {},
      agentSecret,
    };

    const response = await sendDesktopAgentCommand(command);

    if (!response.success) {
      return {
        connectionType: "usb",
        status: "failed",
        usedDesktopAgent: true,
        durationMs: Date.now() - startTime,
        errorMessage: response.error ?? "USB configuration failed",
        errorCode: response.errorCode ?? "usb_lost",
        connectionData: {
          driverInstalled: false,
          driverName: null,
          driverVersion: null,
          port: deviceInfo.port,
          portAvailable: false,
          printerResponding: false,
          communicationActive: false,
          vendorId: deviceInfo.vendorId,
          productIdCode: deviceInfo.productIdCode,
        },
      };
    }

    const data = response.data;
    return {
      connectionType: "usb",
      status: "successful",
      usedDesktopAgent: true,
      durationMs: response.durationMs ?? Date.now() - startTime,
      errorMessage: null,
      errorCode: null,
      connectionData: {
        driverInstalled: extractBoolean(data, "driverInstalled"),
        driverName: extractString(data, "driverName"),
        driverVersion: extractString(data, "driverVersion"),
        port: extractString(data, "port") ?? deviceInfo.port,
        portAvailable: extractBoolean(data, "portAvailable"),
        printerResponding: extractBoolean(data, "printerResponding"),
        communicationActive: extractBoolean(data, "communicationActive"),
        vendorId: extractString(data, "vendorId") ?? deviceInfo.vendorId,
        productIdCode: extractString(data, "productIdCode") ?? deviceInfo.productIdCode,
      },
    };
  }

  async verifyCommunication(
    deviceInfo: DeviceIdentificationInfo,
    agentSecret?: string,
  ): Promise<CommunicationTestResult> {
    const command: DesktopAgentConfigCommand = {
      command: "test_communication" as AgentCommandType,
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productIdCode ?? undefined,
        port: deviceInfo.port ?? undefined,
      },
      parameters: { connectionType: "usb" },
      agentSecret,
    };

    const response = await sendDesktopAgentCommand(command);

    if (!response.success) {
      return {
        commandResponse: false,
        printerStatus: null,
        readyState: false,
        status: "failed",
        errorMessage: response.error ?? "USB communication test failed",
        errorCode: "communication_failed",
      };
    }

    const data = response.data;
    const commandResponse = extractBoolean(data, "commandResponse");
    const readyState = extractBoolean(data, "readyState");
    return {
      commandResponse,
      printerStatus: extractString(data, "printerStatus"),
      readyState,
      status: commandResponse && readyState ? "successful" : "failed",
      errorMessage: commandResponse && readyState ? null : "Printer not responding to commands",
      errorCode: commandResponse && readyState ? null : "printer_not_responding",
    };
  }

  isApplicable(capabilities: DeviceCapability[], productCapabilities: ProductConnectionCapabilities): boolean {
    return capabilities.includes("usb") || productCapabilities.connectionTypes.includes("usb");
  }
}

// ====================== Wi-Fi Adapter ======================

/**
 * Wi-Fi Configuration Adapter — handles Wi-Fi connection setup.
 *
 * Flow (per spec):
 *   1. Verify Connected Printer
 *   2. Verify Printer Wi-Fi Mode
 *   3. Start Available Configuration
 *   4. Send Wi-Fi Credentials
 *   5. Printer Restart (if necessary)
 *   6. Verify Connection
 *   7. Get Printer IP Address
 *   8. Test Communication
 *
 * Auto mode (sdkAvailable + firmwareConfigSupported):
 *   - Sends credentials via SDK/firmware commands through Desktop Agent
 * Guided mode (no SDK or no firmware config support):
 *   - Returns step-by-step instructions for manual setup
 *
 * If success → "Wi-Fi Connected Successfully" with SSID, IP, Signal
 * If fail → clear reason (Wrong Password, Network Unreachable, etc.)
 */
export class WifiConfigurationAdapter implements ConfigurationAdapter {
  connectionType: ConfigurationConnectionType = "wifi";
  requiresDesktopAgent = true;

  async configure(
    deviceInfo: DeviceIdentificationInfo,
    configParams?: Record<string, unknown>,
    agentSecret?: string,
  ): Promise<AdapterConfigurationResult> {
    const startTime = Date.now();

    const wifiParams = configParams as WifiConfigurationRequest | undefined;
    if (!wifiParams?.ssid) {
      return {
        connectionType: "wifi",
        status: "failed",
        usedDesktopAgent: false,
        durationMs: 0,
        errorMessage: "Wi-Fi SSID is required for configuration",
        errorCode: "configuration_validation_failed",
        connectionData: {
          connected: false,
          ssid: null,
          ipAddress: null,
          signalQuality: null,
          signalLabel: null,
          gateway: null,
          dns: null,
          securityType: null,
          printerRestarted: false,
        },
      };
    }

    const command: DesktopAgentConfigCommand = {
      command: "configure_wifi" as AgentCommandType,
      deviceIdentifier: {
        serialNumber: wifiParams.serialNumber ?? deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productIdCode ?? undefined,
      },
      parameters: {
        ssid: wifiParams.ssid,
        password: wifiParams.password,
        securityType: wifiParams.securityType ?? undefined,
        autoMode: wifiParams.autoMode,
      },
      agentSecret,
    };

    const response = await sendDesktopAgentCommand(command);

    if (!response.success) {
      return {
        connectionType: "wifi",
        status: "failed",
        usedDesktopAgent: true,
        durationMs: response.durationMs ?? Date.now() - startTime,
        errorMessage: response.error ?? "Wi-Fi configuration failed",
        errorCode: response.errorCode ?? "connection_timeout",
        connectionData: {
          connected: false,
          ssid: wifiParams.ssid,
          ipAddress: null,
          signalQuality: null,
          signalLabel: null,
          gateway: null,
          dns: null,
          securityType: wifiParams.securityType ?? null,
          printerRestarted: false,
        },
      };
    }

    const data = response.data;
    const connected = extractBoolean(data, "connected");
    const signalQuality = extractNumber(data, "signalQuality");
    const signalLabel = signalQuality !== null
      ? signalQuality >= 80 ? "Excellent"
        : signalQuality >= 60 ? "Good"
        : signalQuality >= 40 ? "Fair"
        : "Weak"
      : null;

    return {
      connectionType: "wifi",
      status: connected ? "successful" : "failed",
      usedDesktopAgent: true,
      durationMs: response.durationMs ?? Date.now() - startTime,
      errorMessage: connected ? null : "Wi-Fi connection not confirmed by device",
      errorCode: connected ? null : "connection_timeout",
      connectionData: {
        connected,
        ssid: extractString(data, "ssid") ?? wifiParams.ssid,
        ipAddress: extractString(data, "ipAddress"),
        signalQuality,
        signalLabel,
        gateway: extractString(data, "gateway"),
        dns: extractString(data, "dns"),
        securityType: extractString(data, "securityType") ?? wifiParams.securityType ?? null,
        printerRestarted: extractBoolean(data, "printerRestarted"),
      },
    };
  }

  async verifyCommunication(
    deviceInfo: DeviceIdentificationInfo,
    agentSecret?: string,
  ): Promise<CommunicationTestResult> {
    const command: DesktopAgentConfigCommand = {
      command: "test_communication" as AgentCommandType,
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productIdCode ?? undefined,
      },
      parameters: { connectionType: "wifi" },
      agentSecret,
    };

    const response = await sendDesktopAgentCommand(command);

    if (!response.success) {
      return {
        commandResponse: false,
        printerStatus: null,
        readyState: false,
        status: "failed",
        errorMessage: response.error ?? "Wi-Fi communication test failed",
        errorCode: "communication_failed",
      };
    }

    const data = response.data;
    const commandResponse = extractBoolean(data, "commandResponse");
    const readyState = extractBoolean(data, "readyState");
    return {
      commandResponse,
      printerStatus: extractString(data, "printerStatus"),
      readyState,
      status: commandResponse && readyState ? "successful" : "failed",
      errorMessage: commandResponse && readyState ? null : "Printer not responding over Wi-Fi",
      errorCode: commandResponse && readyState ? null : "printer_not_responding",
    };
  }

  isApplicable(capabilities: DeviceCapability[], productCapabilities: ProductConnectionCapabilities): boolean {
    return capabilities.includes("wifi") || productCapabilities.supportsWifi;
  }
}

// ====================== LAN Adapter ======================

/**
 * LAN Configuration Adapter — handles Ethernet/LAN connection setup.
 *
 * Detects: DHCP/Static IP, Current IP, Gateway, DNS, Reachability
 * If reachable → "Network Connected Successfully"
 * If not reachable → clear reason
 */
export class LanConfigurationAdapter implements ConfigurationAdapter {
  connectionType: ConfigurationConnectionType = "lan";
  requiresDesktopAgent = true;

  async configure(
    deviceInfo: DeviceIdentificationInfo,
    configParams?: Record<string, unknown>,
    agentSecret?: string,
  ): Promise<AdapterConfigurationResult> {
    const startTime = Date.now();

    const command: DesktopAgentConfigCommand = {
      command: "configure_lan" as AgentCommandType,
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productIdCode ?? undefined,
        port: deviceInfo.port ?? undefined,
      },
      parameters: configParams ?? {},
      agentSecret,
    };

    const response = await sendDesktopAgentCommand(command);

    if (!response.success) {
      return {
        connectionType: "lan",
        status: "failed",
        usedDesktopAgent: true,
        durationMs: response.durationMs ?? Date.now() - startTime,
        errorMessage: response.error ?? "LAN configuration failed",
        errorCode: response.errorCode ?? "lan_timeout",
        connectionData: {
          connected: false,
          dhcpEnabled: null,
          staticIp: null,
          ipAddress: null,
          gateway: null,
          dns: null,
          subnetMask: null,
          macAddress: null,
          reachable: false,
        },
      };
    }

    const data = response.data;
    const connected = extractBoolean(data, "connected");
    const dhcpEnabled = data["dhcpEnabled"] === true ? true : data["dhcpEnabled"] === false ? false : null;
    const staticIp = data["staticIp"] === true ? true : data["staticIp"] === false ? false : null;

    return {
      connectionType: "lan",
      status: connected ? "successful" : "failed",
      usedDesktopAgent: true,
      durationMs: response.durationMs ?? Date.now() - startTime,
      errorMessage: connected ? null : "LAN connection not confirmed",
      errorCode: connected ? null : "lan_timeout",
      connectionData: {
        connected,
        dhcpEnabled,
        staticIp,
        ipAddress: extractString(data, "ipAddress"),
        gateway: extractString(data, "gateway"),
        dns: extractString(data, "dns"),
        subnetMask: extractString(data, "subnetMask"),
        macAddress: extractString(data, "macAddress"),
        reachable: extractBoolean(data, "reachable"),
      },
    };
  }

  async verifyCommunication(
    deviceInfo: DeviceIdentificationInfo,
    agentSecret?: string,
  ): Promise<CommunicationTestResult> {
    const command: DesktopAgentConfigCommand = {
      command: "test_communication" as AgentCommandType,
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productIdCode ?? undefined,
      },
      parameters: { connectionType: "lan" },
      agentSecret,
    };

    const response = await sendDesktopAgentCommand(command);

    if (!response.success) {
      return {
        commandResponse: false,
        printerStatus: null,
        readyState: false,
        status: "failed",
        errorMessage: response.error ?? "LAN communication test failed",
        errorCode: "communication_failed",
      };
    }

    const data = response.data;
    const commandResponse = extractBoolean(data, "commandResponse");
    const readyState = extractBoolean(data, "readyState");
    return {
      commandResponse,
      printerStatus: extractString(data, "printerStatus"),
      readyState,
      status: commandResponse && readyState ? "successful" : "failed",
      errorMessage: commandResponse && readyState ? null : "Printer not responding on LAN",
      errorCode: commandResponse && readyState ? null : "printer_not_responding",
    };
  }

  isApplicable(capabilities: DeviceCapability[], productCapabilities: ProductConnectionCapabilities): boolean {
    return capabilities.includes("lan") || productCapabilities.connectionTypes.includes("lan");
  }
}

// ====================== Bluetooth Adapter ======================

/**
 * Bluetooth Configuration Adapter — handles Bluetooth pairing and verification.
 *
 * Flow:
 *   1. Check Windows Pairing status
 *   2. Verify Device Connected
 *   3. Verify Communication Ready
 *
 * If device NOT paired → "Please pair the printer using Windows Bluetooth Settings."
 * If paired → Automatically verifies communication
 */
export class BluetoothConfigurationAdapter implements ConfigurationAdapter {
  connectionType: ConfigurationConnectionType = "bluetooth";
  requiresDesktopAgent = true;

  async configure(
    deviceInfo: DeviceIdentificationInfo,
    configParams?: Record<string, unknown>,
    agentSecret?: string,
  ): Promise<AdapterConfigurationResult> {
    const startTime = Date.now();

    const command: DesktopAgentConfigCommand = {
      command: "configure_bluetooth" as AgentCommandType,
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productIdCode ?? undefined,
      },
      parameters: configParams ?? {},
      agentSecret,
    };

    const response = await sendDesktopAgentCommand(command);

    // Special case: device needs Windows pairing
    if (!response.success && response.errorCode === "needs_pairing") {
      return {
        connectionType: "bluetooth",
        status: "failed",
        usedDesktopAgent: true,
        durationMs: response.durationMs ?? Date.now() - startTime,
        errorMessage: "Please pair the printer using Windows Bluetooth Settings.",
        errorCode: "bluetooth_disconnected",
        connectionData: {
          paired: false,
          pairedDeviceName: null,
          pairedMacAddress: null,
          communicationReady: false,
          comPort: null,
          needsWindowsPairing: true,
        },
      };
    }

    if (!response.success) {
      return {
        connectionType: "bluetooth",
        status: "failed",
        usedDesktopAgent: true,
        durationMs: response.durationMs ?? Date.now() - startTime,
        errorMessage: response.error ?? "Bluetooth configuration failed",
        errorCode: response.errorCode ?? "bluetooth_disconnected",
        connectionData: {
          paired: false,
          pairedDeviceName: null,
          pairedMacAddress: null,
          communicationReady: false,
          comPort: null,
          needsWindowsPairing: true,
        },
      };
    }

    const data = response.data;
    const paired = extractBoolean(data, "paired");
    const communicationReady = extractBoolean(data, "communicationReady");

    return {
      connectionType: "bluetooth",
      status: communicationReady ? "successful" : "failed",
      usedDesktopAgent: true,
      durationMs: response.durationMs ?? Date.now() - startTime,
      errorMessage: communicationReady ? null : "Bluetooth communication not ready",
      errorCode: communicationReady ? null : "bluetooth_disconnected",
      connectionData: {
        paired,
        pairedDeviceName: extractString(data, "pairedDeviceName"),
        pairedMacAddress: extractString(data, "pairedMacAddress"),
        communicationReady,
        comPort: extractString(data, "comPort"),
        needsWindowsPairing: !paired,
      },
    };
  }

  async verifyCommunication(
    deviceInfo: DeviceIdentificationInfo,
    agentSecret?: string,
  ): Promise<CommunicationTestResult> {
    const command: DesktopAgentConfigCommand = {
      command: "test_communication" as AgentCommandType,
      deviceIdentifier: {
        serialNumber: deviceInfo.serialNumber ?? undefined,
        vendorId: deviceInfo.vendorId ?? undefined,
        productIdCode: deviceInfo.productIdCode ?? undefined,
      },
      parameters: { connectionType: "bluetooth" },
      agentSecret,
    };

    const response = await sendDesktopAgentCommand(command);

    if (!response.success) {
      return {
        commandResponse: false,
        printerStatus: null,
        readyState: false,
        status: "failed",
        errorMessage: response.error ?? "Bluetooth communication test failed",
        errorCode: "communication_failed",
      };
    }

    const data = response.data;
    const commandResponse = extractBoolean(data, "commandResponse");
    const readyState = extractBoolean(data, "readyState");
    return {
      commandResponse,
      printerStatus: extractString(data, "printerStatus"),
      readyState,
      status: commandResponse && readyState ? "successful" : "failed",
      errorMessage: commandResponse && readyState ? null : "Printer not responding over Bluetooth",
      errorCode: commandResponse && readyState ? null : "printer_not_responding",
    };
  }

  isApplicable(capabilities: DeviceCapability[], productCapabilities: ProductConnectionCapabilities): boolean {
    return capabilities.includes("bluetooth") || productCapabilities.connectionTypes.includes("bluetooth");
  }
}

// ====================== Adapter Registry ======================

/**
 * Adapter registry — maps connection types to their adapters.
 *
 * Extensible: adding a new connection type requires only:
 *   1. Create a new adapter class implementing ConfigurationAdapter
 *   2. Register it here
 *   3. Add the connection type to ConfigurationConnectionType in types.ts
 *
 * The core engine never changes.
 */
const adapterRegistry = new Map<string, ConfigurationAdapter>();

adapterRegistry.set("usb", new UsbConfigurationAdapter());
adapterRegistry.set("lan", new LanConfigurationAdapter());
adapterRegistry.set("wifi", new WifiConfigurationAdapter());
adapterRegistry.set("bluetooth", new BluetoothConfigurationAdapter());

/**
 * Returns the adapter for a given connection type.
 * Returns null if no adapter is registered for that type.
 */
export function getAdapter(connectionType: ConfigurationConnectionType): ConfigurationAdapter | null {
  return adapterRegistry.get(connectionType) ?? null;
}

/**
 * Returns all registered adapters.
 */
export function getAllAdapters(): ConfigurationAdapter[] {
  return Array.from(adapterRegistry.values());
}

/**
 * Registers a new adapter for a connection type.
 * Used for extensibility — new connection types can be added without changing the core engine.
 */
export function registerAdapter(adapter: ConfigurationAdapter): void {
  adapterRegistry.set(adapter.connectionType, adapter);
}

/**
 * Returns adapters that are applicable for the given device capabilities.
 * Only adapters whose connection type is supported by the device are returned.
 */
export function getApplicableAdapters(
  capabilities: DeviceCapability[],
  productCapabilities: ProductConnectionCapabilities,
): ConfigurationAdapter[] {
  return getAllAdapters().filter((adapter) => adapter.isApplicable(capabilities, productCapabilities));
}

// ====================== Test Print Command ======================

/**
 * Sends a test print command to the Desktop Agent.
 *
 * The test print content includes:
 *   - QBIT branding
 *   - "Device Configuration Successful"
 *   - Model name
 *   - Date and time
 *
 * Only sent if the printer is ready and communication verified.
 * NEVER sends a fake test print.
 */
export async function sendTestPrint(
  deviceInfo: DeviceIdentificationInfo,
  agentSecret?: string,
): Promise<TestPrintResult> {
  const command: DesktopAgentConfigCommand = {
    command: "test_print" as AgentCommandType,
    deviceIdentifier: {
      serialNumber: deviceInfo.serialNumber ?? undefined,
      vendorId: deviceInfo.vendorId ?? undefined,
      productIdCode: deviceInfo.productIdCode ?? undefined,
      port: deviceInfo.port ?? undefined,
    },
    parameters: {
      // Test print content — the Desktop Agent formats this for the printer
      content: {
        header: "QBIT",
        message: "Device Configuration Successful",
        model: deviceInfo.model ?? "Unknown",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
    },
    agentSecret,
  };

  const response = await sendDesktopAgentCommand(command);

  if (!response.success) {
    return {
      sent: false,
      completed: false,
      content: null,
      status: "failed",
      errorMessage: response.error ?? "Test print failed",
      errorCode: response.errorCode ?? "test_print_failed",
    };
  }

  const data = response.data;
  const sent = extractBoolean(data, "sent");
  const completed = extractBoolean(data, "completed");

  return {
    sent,
    completed,
    content: extractString(data, "content"),
    status: sent && completed ? "successful" : "failed",
    errorMessage: sent && completed ? null : "Test print not confirmed by printer",
    errorCode: sent && completed ? null : "test_print_failed",
  };
}

// ====================== Adapter Result Mappers ======================

/**
 * Maps a USB adapter result to UsbConfigurationResult type.
 * Extracts USB-specific fields from connectionData.
 */
export function mapUsbResult(adapterResult: AdapterConfigurationResult): UsbConfigurationResult {
  const data = adapterResult.connectionData;
  return {
    driverInstalled: data["driverInstalled"] === true,
    driverName: (data["driverName"] as string | null) ?? null,
    driverVersion: (data["driverVersion"] as string | null) ?? null,
    port: (data["port"] as string | null) ?? null,
    portAvailable: data["portAvailable"] === true,
    printerResponding: data["printerResponding"] === true,
    communicationActive: data["communicationActive"] === true,
    status: adapterResult.status,
    errorMessage: adapterResult.errorMessage,
    errorCode: adapterResult.errorCode as string | null,
    vendorId: (data["vendorId"] as string | null) ?? null,
    productIdCode: (data["productIdCode"] as string | null) ?? null,
  };
}

/**
 * Maps a Wi-Fi adapter result to WifiConfigurationResult type.
 * Extracts Wi-Fi-specific fields from connectionData.
 */
export function mapWifiResult(adapterResult: AdapterConfigurationResult): WifiConfigurationResult {
  const data = adapterResult.connectionData;
  const signalQuality = typeof data["signalQuality"] === "number" ? data["signalQuality"] as number : null;
  return {
    connected: data["connected"] === true,
    ssid: (data["ssid"] as string | null) ?? null,
    ipAddress: (data["ipAddress"] as string | null) ?? null,
    signalQuality,
    signalLabel: (data["signalLabel"] as string | null) ?? null,
    gateway: (data["gateway"] as string | null) ?? null,
    dns: (data["dns"] as string | null) ?? null,
    securityType: (data["securityType"] as string | null) ?? null,
    status: adapterResult.status,
    errorMessage: adapterResult.errorMessage,
    errorCode: adapterResult.errorCode as WifiErrorCode | null,
    printerRestarted: data["printerRestarted"] === true,
  };
}

/**
 * Maps a LAN adapter result to LanConfigurationResult type.
 * Extracts LAN-specific fields from connectionData.
 */
export function mapLanResult(adapterResult: AdapterConfigurationResult): LanConfigurationResult {
  const data = adapterResult.connectionData;
  return {
    connected: data["connected"] === true,
    dhcpEnabled: typeof data["dhcpEnabled"] === "boolean" ? data["dhcpEnabled"] as boolean : null,
    staticIp: typeof data["staticIp"] === "boolean" ? data["staticIp"] as boolean : null,
    ipAddress: (data["ipAddress"] as string | null) ?? null,
    gateway: (data["gateway"] as string | null) ?? null,
    dns: (data["dns"] as string | null) ?? null,
    subnetMask: (data["subnetMask"] as string | null) ?? null,
    macAddress: (data["macAddress"] as string | null) ?? null,
    reachable: data["reachable"] === true,
    status: adapterResult.status,
    errorMessage: adapterResult.errorMessage,
    errorCode: adapterResult.errorCode as string | null,
  };
}

/**
 * Maps a Bluetooth adapter result to BluetoothConfigurationResult type.
 * Extracts Bluetooth-specific fields from connectionData.
 */
export function mapBluetoothResult(adapterResult: AdapterConfigurationResult): BluetoothConfigurationResult {
  const data = adapterResult.connectionData;
  return {
    paired: data["paired"] === true,
    pairedDeviceName: (data["pairedDeviceName"] as string | null) ?? null,
    pairedMacAddress: (data["pairedMacAddress"] as string | null) ?? null,
    communicationReady: data["communicationReady"] === true,
    comPort: (data["comPort"] as string | null) ?? null,
    needsWindowsPairing: data["needsWindowsPairing"] === true,
    status: adapterResult.status,
    errorMessage: adapterResult.errorMessage,
    errorCode: adapterResult.errorCode as string | null,
  };
}
