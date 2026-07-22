/**
 * Dr. QBIT — barrel exports for all engine modules.
 *
 * Import from "@/lib/drqbit" to access:
 *   - Phase 1: Device Discovery Engine (device-discovery.ts)
 *   - Phase 2: Device Identification Engine (device-identification.ts)
 *   - Phase 3: Cloud Lookup Engine (cloud-lookup-engine.ts, resource-engine.ts, cloud-lookup-types.ts)
 *   - Phase 4: Configuration & Provisioning Engine (configuration-engine.ts, configuration-adapters.ts, configuration-types.ts)
 *   - Device Matcher (device-matcher.ts)
 *   - Desktop Agent Auth (desktop-agent-auth.ts)
 */

// Phase 1 — Discovery
export { scanAllPorts } from "./device-discovery";
export type { DiscoveryResult, ScannerAvailability, DiscoveredDevice, DiscoveryConnection } from "./device-discovery";

// Phase 2 — Identification
export { identifyAllDevices, identifyDevice, identifyModel, extractSerialNumber } from "./device-identification";
export type { SerialExtractionResult, ModelIdentificationResult } from "./device-identification";

// Phase 3 — Cloud Lookup
export { runCloudLookup } from "./cloud-lookup-engine";
export { fetchProductResources, fetchResourcesByModel, fetchResourcesByHardwareSignature, selectSmartRecommendations } from "./resource-engine";

// Phase 3 — Types
export type {
  CloudLookupInput,
  CloudLookupResult,
  CloudLookupError,
  CloudLookupStep,
  SerialValidationResult,
  SerialValidationStatus,
  CloudProductInfo,
  CloudCustomerInfo,
  CloudWarrantyInfo,
  WarrantyStatus as CloudWarrantyStatus,
  FirmwareCompatibilityResult,
  TimelineEvent,
  TimelineEventType,
  SmartRecommendation,
  ResourceTypeCategory,
  ResourceItem,
  CloudResources,
  CloudLookupRequest,
  CloudLookupResponse,
} from "./cloud-lookup-types";
export {
  SERIAL_STATUS_LABELS,
  WARRANTY_STATUS_LABELS,
  WARRANTY_STATUS_ICONS,
  WARRANTY_STATUS_VARIANTS,
  TIMELINE_EVENT_LABELS,
  TIMELINE_EVENT_ICONS,
  RESOURCE_CATEGORY_LABELS,
  RESOURCE_CATEGORY_ICONS,
  mapResourceTypeToCategory,
} from "./cloud-lookup-types";

// Phase 4 — Configuration & Provisioning
export { runConfiguration, readCapabilitiesOnly, readDeviceCapabilities, generateConfigurationOptions, saveConfigurationEvents } from "./configuration-engine";
export {
  sendDesktopAgentCommand,
  isDesktopAgentAvailable,
  sendTestPrint,
  getAdapter,
  getAllAdapters,
  getApplicableAdapters,
  registerAdapter,
  mapUsbResult,
  mapWifiResult,
  mapLanResult,
  mapBluetoothResult,
  UsbConfigurationAdapter,
  LanConfigurationAdapter,
  WifiConfigurationAdapter,
  BluetoothConfigurationAdapter,
} from "./configuration-adapters";
export type { ConfigurationAdapter, DeviceIdentificationInfo, ProductConnectionCapabilities, AdapterConfigurationResult } from "./configuration-adapters";

// Phase 4 — Types
export type {
  ConfigurationConnectionType,
  DeviceConfigurationCapabilities,
  ConfigurationOption,
  UsbConfigurationResult,
  WifiConfigurationRequest,
  WifiConfigurationResult,
  WifiErrorCode,
  LanConfigurationResult,
  BluetoothConfigurationResult,
  CommunicationTestResult,
  TestPrintResult,
  SavedDeviceProfile,
  ConfigurationEventType,
  ConfigurationEventRecord,
  SecurityValidationResult,
  SecurityCheckFailure,
  ConfigurationErrorCode,
  ConfigurationError,
  ConfigurationStep,
  ConfigurationStepStatus,
  ConfigurationOverallStatus,
  TestPrintOutcome,
  ConfigurationResult,
  ConfigurationRequest,
  ConfigurationResponse,
  ConfigurationAction,
  DesktopAgentConfigCommand,
  DesktopAgentConfigResponse,
  AgentCommandType,
} from "./configuration-types";
export {
  CONFIG_CONNECTION_LABELS,
  CONFIG_CONNECTION_ICONS,
  CONFIG_STEP_STATUS_LABELS,
  CONFIG_OVERALL_STATUS_LABELS,
  TEST_PRINT_OUTCOME_LABELS,
  CONFIG_EVENT_LABELS,
  CONFIG_EVENT_ICONS,
  WIFI_ERROR_LABELS,
  CONFIG_ERROR_LABELS,
} from "./configuration-types";

// Shared Types
export type {
  DeviceConnection,
  DeviceType,
  DeviceStatus,
  ScanStatus,
  IdentificationStatus,
  DeviceCapability,
  DeviceProfile,
  DeviceFingerprint,
  IdentificationError,
  IdentificationResult,
  RawDetectedDevice,
  DetectedDeviceDTO,
  UnknownDeviceDTO,
  ScanSessionDTO,
  DesktopAgentScanPayload,
  DeviceQuickAction,
} from "./types";
export {
  CAPABILITY_LABELS,
  DEVICE_TYPE_ICONS,
  DEVICE_TYPE_LABELS,
  CONNECTION_ICONS,
  CONNECTION_LABELS,
  DEVICE_STATUS_VARIANTS,
  getDeviceQuickActions,
} from "./types";

// Device Matcher
export { matchDevice, suggestClosestProducts } from "./device-matcher";
export type { MatchResult } from "./device-matcher";

// Desktop Agent Auth
export { validateAgentSecret, extractAgentSecret, isAgentSecretConfigured } from "./desktop-agent-auth";
