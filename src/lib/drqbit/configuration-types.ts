/**
 * Dr. QBIT Phase 4 — Configuration & Device Provisioning Engine
 *
 * Strict TypeScript types for the Configuration & Provisioning pipeline.
 * These types are the contract between the API routes, the engine,
 * and the UI components (existing WifiSetupWizard, etc.).
 *
 * Phase 4 receives a CloudLookupResult from Phase 3, reads the device
 * capabilities, generates supported configuration options, configures
 * each connection type, tests communication, sends a test print, and
 * saves the configuration to the database.
 *
 * RULES:
 *   - NO fake/dummy/mock/placeholder configuration data.
 *   - Only supported configuration options are generated.
 *   - If a device does not support Wi-Fi → Wi-Fi Setup is NOT generated.
 *   - If a device does not support Bluetooth → Bluetooth Setup is NOT generated.
 *   - Communication must be verified BEFORE showing "Success".
 *   - Configuration is NEVER saved unless device is verified + communication verified.
 *   - "Not Available" means the hardware/driver didn't report it, NOT "we invented a value".
 *   - All configuration actions are logged in ConfigurationEvent audit trail.
 *   - Extensible: new device types and connection types need only an adapter,
 *     the core engine remains unchanged.
 */

import type { DeviceConnection, DeviceCapability, DeviceType } from "./types";
import type { CloudLookupResult, CloudProductInfo } from "./cloud-lookup-types";

// ====================== Step 1 — Read Device Capabilities ======================

/**
 * Supported connection configuration types.
 *
 * Each type corresponds to a specific configuration adapter.
 * Only types present in this list AND supported by the device
 * are included in the generated configuration options.
 */
export type ConfigurationConnectionType = "usb" | "lan" | "wifi" | "bluetooth";

/**
 * Device capabilities relevant to configuration.
 *
 * These are read from the CloudLookupResult and determine which
 * configuration options the engine generates. Only options that
 * the device actually supports are generated — never hardcoded.
 */
export interface DeviceConfigurationCapabilities {
  /** Whether the device supports USB connection. */
  supportsUsb: boolean;
  /** Whether the device supports Ethernet/LAN connection. */
  supportsLan: boolean;
  /** Whether the device supports Wi-Fi connection. */
  supportsWifi: boolean;
  /** Whether the device supports Bluetooth connection. */
  supportsBluetooth: boolean;
  /** Whether the device supports cash drawer kick. */
  supportsCashDrawer: boolean;
  /** Whether the device supports firmware upgrade. */
  supportsFirmwareUpgrade: boolean;
  /** Whether automatic driver installation is available. */
  supportsAutoDriverInstall: boolean;
  /** Whether SDK-based configuration is available (enables Auto Wi-Fi setup). */
  supportsSdk: boolean;
  /** Whether firmware-level configuration commands are supported. */
  supportsFirmwareConfig: boolean;
  /** List of all connection types the device supports (from QbitProduct.connectionTypes). */
  supportedConnectionTypes: ConfigurationConnectionType[];
}

/**
 * Configuration option — one per supported connection type.
 *
 * The engine generates these options based on device capabilities.
 * Options that the device does NOT support are NEVER generated.
 */
export interface ConfigurationOption {
  /** The connection type this option configures. */
  connectionType: ConfigurationConnectionType;
  /** Human-readable label (e.g. "USB Connection", "Wi-Fi Setup"). */
  label: string;
  /** Material Symbol icon name. */
  icon: string;
  /** Whether this option is available for the current device. */
  available: boolean;
  /** Why this option is unavailable, if applicable. */
  unavailableReason?: string;
  /** Whether this option requires the Desktop Agent. */
  requiresDesktopAgent: boolean;
  /** Whether this option can be configured automatically (SDK/firmware-based). */
  autoConfigAvailable: boolean;
  /** Whether this option requires manual/guided setup. */
  guidedModeOnly: boolean;
}

// ====================== Step 2 — USB Configuration ======================

/**
 * USB configuration result — verification of USB connection.
 *
 * Every field is sourced from REAL hardware data.
 * Null means "could not be read", NOT "unknown default".
 */
export interface UsbConfigurationResult {
  /** Whether the USB driver is installed on the host machine. */
  driverInstalled: boolean;
  /** Name of the installed driver (from Desktop Agent). Null if no driver. */
  driverName: string | null;
  /** Version of the installed driver. Null if unknown. */
  driverVersion: string | null;
  /** USB port the device is connected on (e.g. "USB001", "COM3"). */
  port: string | null;
  /** Whether the port is available for communication. */
  portAvailable: boolean;
  /** Whether the printer is responding to USB commands. */
  printerResponding: boolean;
  /** Whether bidirectional communication is active. */
  communicationActive: boolean;
  /** Overall USB connection status. */
  status: ConfigurationStepStatus;
  /** Error message if status is failed. Null if successful. */
  errorMessage: string | null;
  /** Error code if status is failed. Null if successful. */
  errorCode: string | null;
  /** Vendor ID (hex) of the USB device. */
  vendorId: string | null;
  /** Product ID (hex) of the USB device. */
  productIdCode: string | null;
}

// ====================== Step 3 — Wi-Fi Configuration ======================

/**
 * Wi-Fi configuration request — sent to Desktop Agent for actual configuration.
 */
export interface WifiConfigurationRequest {
  /** The SSID (network name) to connect the printer to. */
  ssid: string;
  /** The Wi-Fi password. NEVER stored in the database — only passed to Desktop Agent. */
  password: string;
  /** Security type (WPA2, WPA3, etc.). Null if unknown. */
  securityType?: string;
  /** Whether to use automatic (SDK-based) configuration. */
  autoMode: boolean;
  /** Device serial number for targeting. */
  serialNumber: string;
  /** Passport ID for DB reference. */
  passportId?: string;
}

/**
 * Wi-Fi configuration result — after Desktop Agent processes the request.
 *
 * Every field is sourced from REAL device response.
 * Null means "the device didn't report this value", NOT "we guessed it".
 */
export interface WifiConfigurationResult {
  /** Whether the Wi-Fi connection was successfully established. */
  connected: boolean;
  /** The SSID the printer connected to. Null if not connected. */
  ssid: string | null;
  /** The IP address assigned to the printer. Null if DHCP failed. */
  ipAddress: string | null;
  /** Signal quality (0-100). Null if device didn't report it. */
  signalQuality: number | null;
  /** Signal strength label (Excellent, Good, Fair, Weak). Null if unknown. */
  signalLabel: string | null;
  /** Gateway IP. Null if not available. */
  gateway: string | null;
  /** DNS server IP. Null if not available. */
  dns: string | null;
  /** Security type of the connected network. Null if unknown. */
  securityType: string | null;
  /** Overall Wi-Fi configuration status. */
  status: ConfigurationStepStatus;
  /** Error message if status is failed. Null if successful. */
  errorMessage: string | null;
  /** Error code for specific failure reasons. */
  errorCode: WifiErrorCode | null;
  /** Whether a printer restart was performed during configuration. */
  printerRestarted: boolean;
}

/** Wi-Fi-specific error codes — clear reason for each failure case. */
export type WifiErrorCode =
  | "wrong_password"
  | "network_unreachable"
  | "auth_failed"
  | "connection_timeout"
  | "dhcp_failed"
  | "ssid_not_found"
  | "security_type_mismatch"
  | "printer_not_responding"
  | "firmware_command_failed"
  | "sdk_not_available"
  | "desktop_agent_unavailable";

// ====================== Step 4 — LAN Configuration ======================

/**
 * LAN configuration result — after Desktop Agent detects network settings.
 */
export interface LanConfigurationResult {
  /** Whether LAN connection is established. */
  connected: boolean;
  /** Whether DHCP is enabled on the printer's network interface. */
  dhcpEnabled: boolean | null;
  /** Whether static IP is configured. */
  staticIp: boolean | null;
  /** Current IP address of the printer on the LAN. Null if not detected. */
  ipAddress: string | null;
  /** Gateway IP address. Null if not available. */
  gateway: string | null;
  /** DNS server IP. Null if not available. */
  dns: string | null;
  /** Subnet mask. Null if not available. */
  subnetMask: string | null;
  /** MAC address of the printer's LAN interface. */
  macAddress: string | null;
  /** Whether the printer is reachable via its IP. */
  reachable: boolean;
  /** Overall LAN configuration status. */
  status: ConfigurationStepStatus;
  /** Error message if status is failed. Null if successful. */
  errorMessage: string | null;
  /** Error code if status is failed. Null if successful. */
  errorCode: string | null;
}

// ====================== Step 5 — Bluetooth Configuration ======================

/**
 * Bluetooth configuration result — after pairing/verification.
 */
export interface BluetoothConfigurationResult {
  /** Whether the printer is paired with the host via Bluetooth. */
  paired: boolean;
  /** Name of the paired device (from Windows Bluetooth settings). Null if not paired. */
  pairedDeviceName: string | null;
  /** MAC address of the paired device. Null if not paired. */
  pairedMacAddress: string | null;
  /** Whether the Bluetooth connection is ready for communication. */
  communicationReady: boolean;
  /** COM port assigned to the Bluetooth connection (e.g. "COM5"). Null if unknown. */
  comPort: string | null;
  /** Whether Windows Bluetooth pairing is required before proceeding. */
  needsWindowsPairing: boolean;
  /** Overall Bluetooth configuration status. */
  status: ConfigurationStepStatus;
  /** Error message if status is failed. Null if successful. */
  errorMessage: string | null;
  /** Error code if status is failed. Null if successful. */
  errorCode: string | null;
}

// ====================== Step 6 — Communication Test ======================

/**
 * Communication test result — verifies command response, printer status, ready state.
 */
export interface CommunicationTestResult {
  /** Whether the device responds to ESC/POS or vendor-specific commands. */
  commandResponse: boolean;
  /** Printer status read from the device (idle, busy, error, etc.). Null if unreadable. */
  printerStatus: string | null;
  /** Whether the printer is in a "ready" state (idle, no errors). */
  readyState: boolean;
  /** Overall communication test status. */
  status: ConfigurationStepStatus;
  /** Error message if status is failed. Null if successful. */
  errorMessage: string | null;
  /** Error code if status is failed. Null if successful. */
  errorCode: string | null;
}

// ====================== Step 7 — Test Print ======================

/**
 * Test print result — after sending a test print command to the printer.
 */
export interface TestPrintResult {
  /** Whether the test print was sent successfully. */
  sent: boolean;
  /** Whether the test print was confirmed as completed. */
  completed: boolean;
  /** Content of the test print (model, date, time). Null if not applicable. */
  content: string | null;
  /** Overall test print status. */
  status: ConfigurationStepStatus;
  /** Error message if status is failed. Null if successful. */
  errorMessage: string | null;
  /** Error code if status is failed. Null if successful. */
  errorCode: string | null;
}

// ====================== Step 8 — Save Device Profile ======================

/**
 * Device profile saved to database after configuration.
 *
 * This is what gets persisted in DeviceConfiguration table.
 * It's the authoritative record of the device's current configuration.
 */
export interface SavedDeviceProfile {
  /** Configuration number (e.g. "CONF-2026-00001"). */
  configurationNumber: string;
  /** Passport ID of the device. */
  passportId: string;
  /** Serial number of the device. */
  serialNumber: string | null;
  /** Active (primary) connection type. */
  activeConnectionType: ConfigurationConnectionType | null;
  /** USB configuration details. Null if device doesn't support USB. */
  usbConfig: UsbConfigurationResult | null;
  /** LAN configuration details. Null if device doesn't support LAN. */
  lanConfig: LanConfigurationResult | null;
  /** Wi-Fi configuration details. Null if device doesn't support Wi-Fi. */
  wifiConfig: WifiConfigurationResult | null;
  /** Bluetooth configuration details. Null if device doesn't support Bluetooth. */
  bluetoothConfig: BluetoothConfigurationResult | null;
  /** Overall configuration status. */
  configurationStatus: ConfigurationOverallStatus;
  /** Whether communication was verified. */
  communicationVerified: boolean;
  /** Test print result status. */
  testPrintStatus: TestPrintOutcome;
  /** Firmware version at the time of configuration. */
  firmwareVersionAtConfig: string | null;
  /** Timestamp of last configuration. */
  lastConfiguredAt: string;
  /** Who performed the configuration. */
  lastConfiguredBy: string | null;
}

// ====================== Step 9 — Configuration History ======================

/**
 * Configuration event — logged for every configuration action.
 *
 * One event per action. Engineers can review the full history
 * of configuration changes for any device.
 */
export type ConfigurationEventType =
  | "configuration_started"
  | "usb_connected"
  | "wifi_updated"
  | "wifi_connected"
  | "lan_updated"
  | "lan_connected"
  | "bluetooth_connected"
  | "bluetooth_paired"
  | "communication_verified"
  | "test_print"
  | "configuration_completed"
  | "configuration_failed";

export interface ConfigurationEventRecord {
  /** Event type. */
  eventType: ConfigurationEventType;
  /** Connection type this event relates to. Null for overall events. */
  connectionType: ConfigurationConnectionType | null;
  /** Detailed event data (JSON — varies by eventType). */
  eventDetails: Record<string, unknown>;
  /** Who performed this event (User.id, "desktop-agent", "system"). */
  performedBy: string | null;
  /** Human-readable name of the actor. */
  performedByName: string | null;
  /** Result of this event. */
  result: "success" | "failure" | "warning" | "info";
  /** Error message if result is failure. */
  errorMessage: string | null;
  /** Error code if result is failure. */
  errorCode: string | null;
  /** Duration of this step in milliseconds. */
  durationMs: number | null;
  /** ISO-8601 timestamp of when this event occurred. */
  occurredAt: string;
}

// ====================== Step 10 — Security Rules ======================

/**
 * Security validation result — checked BEFORE saving configuration.
 *
 * Configuration is NEVER saved unless all three checks pass:
 *   1. Device verified (from Phase 2 identification)
 *   2. Communication verified (from Step 6)
 *   3. Configuration validation complete (all required fields populated)
 */
export interface SecurityValidationResult {
  /** Whether the device identity is verified (Phase 2 status). */
  deviceVerified: boolean;
  /** Whether the device belongs to QBIT (serial genuine, not fake). */
  deviceBelongsToQbit: boolean;
  /** Whether communication was verified for at least one connection type. */
  communicationVerified: boolean;
  /** Whether the configuration data is complete and valid. */
  configurationValidationComplete: boolean;
  /** Whether duplicate registration was detected (security check). */
  noDuplicateRegistration: boolean;
  /** Whether all security checks passed (all of the above must be true). */
  allChecksPassed: boolean;
  /** List of failed checks with reasons. Empty if all passed. */
  failedChecks: SecurityCheckFailure[];
}

export interface SecurityCheckFailure {
  /** Which check failed. */
  check: string;
  /** Why it failed. */
  reason: string;
}

// ====================== Step 11 — Error Handling ======================

/**
 * Configuration error — records what went wrong during a specific step.
 *
 * No step silently fails — every error is recorded.
 * Errors are NEVER hidden from the user.
 */
export type ConfigurationErrorCode =
  | "usb_lost"
  | "bluetooth_disconnected"
  | "lan_timeout"
  | "wifi_auth_failed"
  | "printer_offline"
  | "printer_busy"
  | "firmware_comm_error"
  | "desktop_agent_unavailable"
  | "driver_not_installed"
  | "port_not_available"
  | "network_not_reachable"
  | "connection_timeout"
  | "device_not_verified"
  | "communication_failed"
  | "test_print_failed"
  | "configuration_validation_failed";

export interface ConfigurationError {
  /** Which Phase 4 step failed. */
  step: ConfigurationStep;
  /** Human-readable error message (shown to the user). */
  message: string;
  /** Machine-readable error code. */
  errorCode: ConfigurationErrorCode;
  /** Whether this error is recoverable (partial configuration still possible). */
  recoverable: boolean;
  /** Original error object, if available (for debugging). */
  originalError?: string;
  /** ISO-8601 timestamp of when the error occurred. */
  timestamp: string;
}

/** Configuration engine step names. */
export type ConfigurationStep =
  | "read_capabilities"
  | "usb_configuration"
  | "wifi_configuration"
  | "lan_configuration"
  | "bluetooth_configuration"
  | "communication_test"
  | "test_print"
  | "save_configuration"
  | "security_validation";

// ====================== Status Types ======================

/** Status of a single configuration step. */
export type ConfigurationStepStatus = "successful" | "failed" | "skipped" | "not_supported" | "pending";

/** Overall configuration status for the entire device. */
export type ConfigurationOverallStatus = "successful" | "failed" | "partial" | "pending";

/** Test print outcome. */
export type TestPrintOutcome = "passed" | "failed" | "not_supported" | "skipped" | "pending";

// ====================== Complete Output (Phase 5 Input) ======================

/**
 * Configuration Result — the complete output passed to Phase 5.
 *
 * This is the FINAL output of the Configuration Engine.
 * All data comes from REAL hardware operations — no fakes, no mocks.
 *
 * If configuration fails:
 *   - deviceStatus will be "Disconnected" or "Error"
 *   - configurationStatus will be "failed"
 *   - errors will contain the failure details
 *   - NO cached/fake/simulated success data
 *
 * If configuration succeeds partially:
 *   - deviceStatus will be "Connected"
 *   - configurationStatus will be "partial"
 *   - successful steps will have real data
 *   - failed steps will have error details
 */
export interface ConfigurationResult {
  /** Whether the overall configuration succeeded (at least partially). */
  success: boolean;
  /** Current device status. "Connected" if at least one connection type works. */
  deviceStatus: "Connected" | "Disconnected" | "Error" | "Unknown";
  /** The primary connection type (the one that was successfully configured). */
  connectionType: ConfigurationConnectionType | null;
  /** Overall configuration status. */
  configurationStatus: ConfigurationOverallStatus;
  /** IP address of the device (for LAN/Wi-Fi). Null for USB/Bluetooth. */
  ipAddress: string | null;
  /** Whether communication was verified. */
  communication: "Verified" | "Not Verified" | "Failed";
  /** Test print outcome. */
  testPrint: TestPrintOutcome;
  /** ISO-8601 timestamp of when this configuration was performed. */
  lastConfigured: string | null;
  /** Firmware version at configuration time. */
  firmware: string | null;
  /** Configuration capabilities read from Phase 3 data. */
  capabilities: DeviceConfigurationCapabilities;
  /** Generated configuration options (only supported ones). */
  supportedOptions: ConfigurationOption[];
  /** USB configuration result. Null if device doesn't support USB. */
  usbResult: UsbConfigurationResult | null;
  /** Wi-Fi configuration result. Null if device doesn't support Wi-Fi. */
  wifiResult: WifiConfigurationResult | null;
  /** LAN configuration result. Null if device doesn't support LAN. */
  lanResult: LanConfigurationResult | null;
  /** Bluetooth configuration result. Null if device doesn't support Bluetooth. */
  bluetoothResult: BluetoothConfigurationResult | null;
  /** Communication test result. */
  communicationTest: CommunicationTestResult | null;
  /** Test print result. */
  testPrintResult: TestPrintResult | null;
  /** Security validation result. */
  securityValidation: SecurityValidationResult;
  /** Configuration events logged during this session. */
  events: ConfigurationEventRecord[];
  /** Errors encountered during configuration. Empty if all steps succeeded. */
  errors: ConfigurationError[];
  /** Saved device profile (if configuration was saved to DB). Null if not saved. */
  savedProfile: SavedDeviceProfile | null;
  /** ISO-8601 timestamp of when this result was generated. */
  configurationTimestamp: string;
  /** Duration of the entire configuration process in milliseconds. */
  configurationDurationMs: number;
}

// ====================== API Request/Response ======================

/**
 * POST /api/dr-qbit/configuration request body.
 *
 * Contains the CloudLookupResult from Phase 3 plus any
 * configuration parameters (Wi-Fi credentials, etc.)
 */
export interface ConfigurationRequest {
  /** The CloudLookupResult from Phase 3. */
  cloudLookupResult: CloudLookupResult;
  /** Configuration action to perform. */
  action: ConfigurationAction;
  /** Connection type to configure (for single-step actions). */
  connectionType?: ConfigurationConnectionType;
  /** Wi-Fi configuration parameters (only for wifi_configure action). */
  wifiParams?: WifiConfigurationRequest;
  /** LAN configuration parameters (only for lan_configure action). */
  lanParams?: {
    ipAddress?: string;
    gateway?: string;
    dns?: string;
    subnetMask?: string;
    useStaticIp?: boolean;
  };
  /** Bluetooth COM port override (only for bluetooth_configure action). */
  bluetoothParams?: {
    comPort?: string;
  };
  /** Engineer ID who initiated the configuration. */
  engineerId?: string;
  /** Engineer name. */
  engineerName?: string;
  /** OS info from Desktop Agent. */
  osInfo?: string;
  /** Desktop Agent version. */
  agentVersion?: string;
}

/** Configuration action types. */
export type ConfigurationAction =
  | "read_capabilities"    // Step 1: Read device capabilities and generate options
  | "configure_usb"       // Step 2: Configure USB connection
  | "configure_wifi"      // Step 3: Configure Wi-Fi connection
  | "configure_lan"       // Step 4: Configure LAN connection
  | "configure_bluetooth" // Step 5: Configure Bluetooth connection
  | "test_communication"  // Step 6: Test communication on active connection
  | "test_print"          // Step 7: Send test print
  | "save_configuration"  // Step 8: Save complete configuration to DB
  | "full_configuration"; // Full pipeline: Steps 1-8 in sequence

/**
 * POST /api/dr-qbit/configuration response.
 */
export interface ConfigurationResponse extends ConfigurationResult {
  /** Human-readable message for the user. */
  message: string;
}

// ====================== Desktop Agent Protocol ======================

/**
 * Desktop Agent configuration command — sent to localhost:53742.
 *
 * The Desktop Agent is the execution engine for all local hardware
 * operations. The web app sends commands and receives real results.
 * No fake/simulated responses.
 */
export interface DesktopAgentConfigCommand {
  /** Command type. */
  command: AgentCommandType;
  /** Target device identifier (serial number or VID+PID). */
  deviceIdentifier: {
    serialNumber?: string;
    vendorId?: string;
    productIdCode?: string;
    port?: string;
  };
  /** Command-specific parameters. */
  parameters: Record<string, unknown>;
  /** Authentication secret. */
  agentSecret?: string;
}

/** Desktop Agent command types. */
export type AgentCommandType =
  | "configure_usb"
  | "configure_wifi"
  | "configure_lan"
  | "configure_bluetooth"
  | "test_communication"
  | "test_print"
  | "get_network_info"
  | "get_usb_info"
  | "get_bluetooth_info";

/**
 * Desktop Agent response — real hardware operation result.
 */
export interface DesktopAgentConfigResponse {
  /** Whether the command succeeded. */
  success: boolean;
  /** Command type that was executed. */
  command: AgentCommandType;
  /** Result data (varies by command type). */
  data: Record<string, unknown>;
  /** Error message if command failed. */
  error?: string;
  /** Error code if command failed. */
  errorCode?: string;
  /** Duration of the operation in milliseconds. */
  durationMs?: number;
  /** Desktop Agent version. */
  agentVersion?: string;
}

// ====================== Utility Labels ======================

/** Human-readable label per configuration connection type. */
export const CONFIG_CONNECTION_LABELS: Record<ConfigurationConnectionType, string> = {
  usb: "USB Connection",
  lan: "Ethernet (LAN)",
  wifi: "Wi-Fi Setup",
  bluetooth: "Bluetooth Setup",
};

/** Material Symbol icon per configuration connection type. */
export const CONFIG_CONNECTION_ICONS: Record<ConfigurationConnectionType, string> = {
  usb: "usb",
  lan: "lan",
  wifi: "wifi",
  bluetooth: "bluetooth",
};

/** Human-readable label per configuration step status. */
export const CONFIG_STEP_STATUS_LABELS: Record<ConfigurationStepStatus, string> = {
  successful: "Successful",
  failed: "Failed",
  skipped: "Skipped",
  not_supported: "Not Supported",
  pending: "Pending",
};

/** Human-readable label per overall configuration status. */
export const CONFIG_OVERALL_STATUS_LABELS: Record<ConfigurationOverallStatus, string> = {
  successful: "Configuration Successful",
  failed: "Configuration Failed",
  partial: "Partially Configured",
  pending: "Configuration Pending",
};

/** Human-readable label per test print outcome. */
export const TEST_PRINT_OUTCOME_LABELS: Record<TestPrintOutcome, string> = {
  passed: "Test Print Completed Successfully",
  failed: "Test Print Failed",
  not_supported: "Test Print Not Supported",
  skipped: "Test Print Skipped",
  pending: "Test Print Pending",
};

/** Human-readable label per configuration event type. */
export const CONFIG_EVENT_LABELS: Record<ConfigurationEventType, string> = {
  configuration_started: "Configuration Started",
  usb_connected: "USB Connected",
  wifi_updated: "Wi-Fi Updated",
  wifi_connected: "Wi-Fi Connected",
  lan_updated: "LAN Updated",
  lan_connected: "LAN Connected",
  bluetooth_connected: "Bluetooth Connected",
  bluetooth_paired: "Bluetooth Paired",
  communication_verified: "Communication Verified",
  test_print: "Test Print",
  configuration_completed: "Configuration Completed",
  configuration_failed: "Configuration Failed",
};

/** Material Symbol icon per configuration event type. */
export const CONFIG_EVENT_ICONS: Record<ConfigurationEventType, string> = {
  configuration_started: "play_circle",
  usb_connected: "usb",
  wifi_updated: "wifi",
  wifi_connected: "wifi",
  lan_updated: "lan",
  lan_connected: "lan",
  bluetooth_connected: "bluetooth",
  bluetooth_paired: "bluetooth",
  communication_verified: "verified",
  test_print: "print",
  configuration_completed: "check_circle",
  configuration_failed: "error",
};

/** Human-readable label per Wi-Fi error code. */
export const WIFI_ERROR_LABELS: Record<WifiErrorCode, string> = {
  wrong_password: "Wrong Wi-Fi Password",
  network_unreachable: "Network Unreachable",
  auth_failed: "Wi-Fi Authentication Failed",
  connection_timeout: "Wi-Fi Connection Timeout",
  dhcp_failed: "DHCP IP Assignment Failed",
  ssid_not_found: "Wi-Fi Network Not Found",
  security_type_mismatch: "Security Type Not Supported",
  printer_not_responding: "Printer Not Responding",
  firmware_command_failed: "Firmware Command Failed",
  sdk_not_available: "SDK Not Available for This Model",
  desktop_agent_unavailable: "Desktop Agent Not Available — Use Guided Mode",
};

/** Human-readable label per configuration error code. */
export const CONFIG_ERROR_LABELS: Record<ConfigurationErrorCode, string> = {
  usb_lost: "USB Connection Lost",
  bluetooth_disconnected: "Bluetooth Disconnected",
  lan_timeout: "LAN Connection Timeout",
  wifi_auth_failed: "Wi-Fi Authentication Failed",
  printer_offline: "Printer Offline",
  printer_busy: "Printer Busy — Cannot Configure Now",
  firmware_comm_error: "Firmware Communication Error",
  desktop_agent_unavailable: "Desktop Agent Not Available",
  driver_not_installed: "Driver Not Installed",
  port_not_available: "Port Not Available",
  network_not_reachable: "Network Not Reachable",
  connection_timeout: "Connection Timeout",
  device_not_verified: "Device Not Verified — Configuration Blocked",
  communication_failed: "Communication Test Failed",
  test_print_failed: "Test Print Failed",
  configuration_validation_failed: "Configuration Validation Failed",
};
