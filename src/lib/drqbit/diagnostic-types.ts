/**
 * Dr. QBIT Phase 5 — Intelligent Diagnostics, Predictive Health & Troubleshooting Engine
 *
 * Strict TypeScript types for the Live Diagnostics pipeline.
 * These types are the contract between the API routes, the engine,
 * the adapters, and the UI components.
 *
 * Phase 5 receives a ConfigurationResult from Phase 4, runs LIVE
 * hardware diagnostics, validates driver/firmware/communication/printing,
 * detects errors, provides intelligent troubleshooting, calculates
 * health scores, and passes verified diagnostic data to Phase 6.
 *
 * RULES:
 *   - NO fake/dummy/mock/simulated health status.
 *   - NO dummy success messages.
 *   - All diagnostic results are based on REAL hardware response.
 *   - If a device capability is NOT supported → its health status is NOT shown.
 *   - Health scores are ONLY calculated from real test results.
 *   - Errors show EXACT reason — no generic error messages.
 *   - Predictive warnings are ONLY based on historical logs — no false predictions.
 *   - Diagnostic history is saved in database for future reference.
 *   - Extensible: new device types need only a Diagnostic Adapter + Capability Profile.
 *   - Core engine remains unchanged for future device types.
 */

import type { DeviceConnection, DeviceType, DeviceCapability } from "./types";
import type { ConfigurationResult, ConfigurationConnectionType } from "./configuration-types";
import type { CloudLookupResult } from "./cloud-lookup-types";

// ====================== Step 1 — Start Live Diagnostics ======================

/**
 * Diagnostic action — what the user triggers.
 *
 * "run_diagnostics" starts the full 15-step pipeline.
 * Individual actions allow running specific diagnostic checks.
 */
export type DiagnosticAction =
  | "run_diagnostics"      // Full pipeline: Steps 1-15
  | "check_hardware"       // Step 2: Hardware health check only
  | "check_driver"         // Step 3: Driver validation only
  | "check_firmware"       // Step 4: Firmware validation only
  | "check_communication"  // Step 5: Communication diagnostics only
  | "check_print_engine"   // Step 6: Print engine test only
  | "check_capabilities"   // Step 7: Device capability validation only
  | "detect_errors"        // Step 8: Error detection only
  | "get_troubleshooting"  // Step 9: Intelligent troubleshooting only
  | "get_predictions"      // Step 10: Predictive health analysis only
  | "get_health_score"     // Step 11: Live health score only
  | "get_report"           // Step 12: Diagnostic report only
  | "get_history"          // Step 13: Diagnostic history lookup (GET, not POST)
  | "get_resources"        // Step 14: Auto resource recommendation only;

/**
 * Request body for the Phase 5 diagnostic engine.
 *
 * Contains the Phase 4 ConfigurationResult (the input to Phase 5),
 * plus the Phase 3 CloudLookupResult for resource recommendations,
 * plus optional diagnostic parameters.
 */
export interface DiagnosticRequest {
  /** The ConfigurationResult from Phase 4 — the primary input. */
  configurationResult: ConfigurationResult;
  /** The CloudLookupResult from Phase 3 — for resource recommendations. */
  cloudLookupResult: CloudLookupResult;
  /** Which diagnostic action to perform. */
  action: DiagnosticAction;
  /** Engineer ID who initiated the diagnostics. */
  engineerId?: string;
  /** Engineer name. */
  engineerName?: string;
  /** OS info from Desktop Agent. */
  osInfo?: string;
  /** Desktop Agent version. */
  agentVersion?: string;
  /** Hostname of the machine running diagnostics. */
  hostname?: string;
  /** Passport ID for DB reference. */
  passportId?: string;
  /** Specific connection type to diagnose (for single-check actions). */
  connectionType?: DiagnosticConnectionType;
  /** Custom diagnostic parameters (e.g. specific test command). */
  parameters?: Record<string, unknown>;
}

// ====================== Step 2 — Hardware Health Check ======================

/**
 * Hardware health status — per-connection-type check results.
 *
 * Each connection type that the device SUPPORTS gets its own health check.
 * Unsupported connection types are NOT included (no fake status).
 */
export interface HardwareHealthCheck {
  /** Whether the device is currently online/responding. */
  deviceOnline: boolean;
  /** Whether the device is responding to commands. */
  deviceResponding: boolean;
  /** Whether the connection is stable (no intermittent drops). */
  connectionStable: boolean;
  /** Whether the printer is in a "ready" state (idle, no errors). */
  printerReady: boolean;
  /** Connection-specific health results — only for supported types. */
  connectionHealth: HardwareConnectionHealth[];
  /** Overall hardware health status. */
  status: DiagnosticStepStatus;
  /** Error message if any check failed. */
  errorMessage: string | null;
  /** Timestamp of when this check was performed. */
  checkedAt: string;
}

/**
 * Per-connection-type hardware health result.
 *
 * Only generated for connection types the device actually supports.
 * If a device doesn't have Wi-Fi → no Wi-Fi health entry here.
 */
export interface HardwareConnectionHealth {
  /** The connection type this health check was for. */
  connectionType: DiagnosticConnectionType;
  /** Whether this connection is active. */
  connected: boolean;
  /** Whether this connection is stable. */
  stable: boolean;
  /** Whether data can be sent/received on this connection. */
  dataFlow: boolean;
  /** Connection-specific details (e.g. signal quality for Wi-Fi). */
  details: Record<string, unknown>;
  /** Status of this specific connection check. */
  status: DiagnosticStepStatus;
  /** Error message if this connection type has issues. */
  errorMessage: string | null;
}

// ====================== Step 3 — Driver Validation ======================

/**
 * Driver validation result — verified against REAL driver data.
 *
 * Checks: installed, version, corrupted, missing, compatible.
 * If driver missing → shows "Compatible Driver Available" + download option.
 */
export interface DriverValidationResult {
  /** Whether a driver is installed for this device. */
  driverInstalled: boolean;
  /** Name of the installed driver. Null if no driver. */
  driverName: string | null;
  /** Version of the installed driver. Null if unknown. */
  driverVersion: string | null;
  /** Latest available driver version (from Phase 3 resources). */
  latestDriverVersion: string | null;
  /** Whether the installed driver is the latest version. */
  isLatest: boolean;
  /** Whether the driver file is corrupted (verified by Desktop Agent). */
  driverCorrupted: boolean;
  /** Whether the driver is compatible with this device model. */
  driverCompatible: boolean;
  /** Whether a compatible driver is available for download. */
  compatibleDriverAvailable: boolean;
  /** Download URL for the compatible driver (from Phase 3). */
  driverDownloadUrl: string | null;
  /** Overall driver validation status. */
  status: DiagnosticStepStatus;
  /** Error message if driver validation failed. */
  errorMessage: string | null;
  /** Timestamp of when this check was performed. */
  checkedAt: string;
}

// ====================== Step 4 — Firmware Validation ======================

/**
 * Firmware validation result — compares installed vs. latest from cloud.
 *
 * Possible outcomes: Latest, Update Available, Unsupported, Corrupted.
 * Firmware is NEVER auto-installed — only reported.
 */
export interface FirmwareValidationResult {
  /** Firmware version currently installed on the device. */
  installedFirmware: string | null;
  /** Latest firmware version available (from cloud/database). */
  latestFirmware: string | null;
  /** Release date of the latest firmware. Null if unknown. */
  latestFirmwareReleaseDate: string | null;
  /** Whether the current firmware is the latest version. */
  isLatest: boolean;
  /** Overall firmware comparison status. */
  updateStatus: FirmwareUpdateStatus;
  /** Whether this is a critical/security update. */
  isCritical: boolean;
  /** Whether the firmware version is supported (not deprecated). */
  isSupported: boolean;
  /** Whether the firmware appears corrupted (read errors, invalid responses). */
  isCorrupted: boolean;
  /** Download URL for firmware update (from Phase 3). Null if latest. */
  firmwareDownloadUrl: string | null;
  /** Overall firmware validation status. */
  status: DiagnosticStepStatus;
  /** Error message if firmware validation failed. */
  errorMessage: string | null;
  /** Timestamp of when this check was performed. */
  checkedAt: string;
}

/** Firmware update status — clear outcome of comparison. */
export type FirmwareUpdateStatus =
  | "latest"              // Current firmware is the latest version
  | "update_available"    // A newer version is available for download
  | "unsupported"         // Current firmware version is deprecated/unsupported
  | "corrupted"           // Firmware appears corrupted (read errors)
  | "unknown";            // Could not determine firmware status

// ====================== Step 5 — Communication Diagnostics ======================

/**
 * Communication diagnostics result — per-connection-type test.
 *
 * Tests: command send → response received for each supported connection.
 * If failure: shows EXACT stage where communication broke down.
 */
export interface CommunicationDiagnosticResult {
  /** Communication test results per supported connection type. */
  connectionTests: CommunicationConnectionTest[];
  /** Whether at least one connection type has verified communication. */
  anyCommunicationVerified: boolean;
  /** Overall communication diagnostics status. */
  status: DiagnosticStepStatus;
  /** Error message if all communication tests failed. */
  errorMessage: string | null;
  /** Timestamp of when these tests were performed. */
  checkedAt: string;
}

/**
 * Per-connection-type communication test.
 *
 * Shows exactly which stage of communication failed:
 *   USB: Connected → Command Sent → Response Received
 *   Bluetooth: Connected → Communication → Response
 *   LAN: Connected → Ping → Printer Response
 *   Wi-Fi: Connected → Ping → Printer Response
 */
export interface CommunicationConnectionTest {
  /** The connection type this test was for. */
  connectionType: DiagnosticConnectionType;
  /** Whether the device is connected on this interface. */
  connected: boolean;
  /** Whether a diagnostic command was successfully sent. */
  commandSent: boolean;
  /** Whether the device responded to the diagnostic command. */
  responseReceived: boolean;
  /** The specific stage where communication failed. Null if successful. */
  failureStage: CommunicationFailureStage | null;
  /** Response data from the device (e.g. printer status bytes). */
  responseData: Record<string, unknown> | null;
  /** Latency of the response in milliseconds. Null if no response. */
  responseLatencyMs: number | null;
  /** Status of this specific communication test. */
  status: DiagnosticStepStatus;
  /** Error message with exact failure reason. */
  errorMessage: string | null;
}

/** Stages where communication can fail — shows EXACT problem. */
export type CommunicationFailureStage =
  | "not_connected"       // Device not connected at all
  | "command_send_failed" // Could not send command to device
  | "no_response"         // Command sent, but no response received
  | "timeout"             // Response took too long (timeout)
  | "invalid_response"    // Response received but data is invalid/garbled
  | "partial_response";   // Response received but incomplete

// ====================== Step 6 — Print Engine Test ======================

/**
 * Print engine test result — sends a small test command and verifies outcome.
 *
 * Checks: Print Started, Print Completed, Print Timeout, Printer Busy.
 * If success → "Print Engine Working Normally".
 */
export interface PrintEngineTestResult {
  /** Whether the test print command was sent. */
  printStarted: boolean;
  /** Whether the test print completed successfully. */
  printCompleted: boolean;
  /** Whether the test print timed out. */
  printTimeout: boolean;
  /** Whether the printer was busy when the test was sent. */
  printerBusy: boolean;
  /** Content of the test print (model, date, time). Null if not applicable. */
  testContent: string | null;
  /** Duration of the test print in milliseconds. Null if not completed. */
  printDurationMs: number | null;
  /** Overall print engine test status. */
  status: DiagnosticStepStatus;
  /** Error message if print engine test failed. */
  errorMessage: string | null;
  /** Timestamp of when this test was performed. */
  checkedAt: string;
}

// ====================== Step 7 — Device Capability Validation ======================

/**
 * Device capability validation result — checks each supported feature's health.
 *
 * ONLY shows capabilities the device ACTUALLY supports.
 * Unsupported features do NOT appear here — no fake health status.
 */
export interface CapabilityValidationResult {
  /** Health check for each SUPPORTED capability. Unsupported ones are NOT listed. */
  capabilities: CapabilityHealthCheck[];
  /** Overall capability validation status. */
  status: DiagnosticStepStatus;
  /** Error message if any capability check failed. */
  errorMessage: string | null;
  /** Timestamp of when these checks were performed. */
  checkedAt: string;
}

/**
 * Health check for a single device capability.
 *
 * Only generated for capabilities the device actually supports.
 * If a device doesn't have Auto Cutter → no auto_cutter health check.
 */
export interface CapabilityHealthCheck {
  /** The capability being checked. */
  capability: DeviceCapability;
  /** Human-readable label for this capability. */
  label: string;
  /** Whether this capability is functioning normally. */
  functioning: boolean;
  /** Detailed health status of this capability. */
  healthStatus: CapabilityHealthStatus;
  /** Diagnostic data from the device about this capability. */
  diagnosticData: Record<string, unknown> | null;
  /** Error message if this capability has issues. Null if healthy. */
  errorMessage: string | null;
}

/** Health status for a device capability. */
export type CapabilityHealthStatus =
  | "healthy"           // Working normally
  | "degraded"          // Working but with reduced performance
  | "error"             // Not functioning — specific error reported
  | "unavailable"       // Temporarily unavailable (e.g. paper out for print)
  | "not_tested";       // Could not be tested (e.g. no test media available)

// ====================== Step 8 — Error Detection Engine ======================

/**
 * Error detection result — automatically detects device errors.
 *
 * No generic error messages. Every error has an ACTUAL reason.
 * Detects: Paper Out, Cover Open, Cutter Error, Printer Offline,
 * Communication Lost, Driver Missing, Firmware Mismatch, USB Disconnected,
 * Bluetooth Lost, LAN Failure, Wi-Fi Failure.
 */
export interface ErrorDetectionResult {
  /** List of detected errors — each with exact reason. */
  detectedErrors: DetectedError[];
  /** Number of errors detected. */
  errorCount: number;
  /** Overall error detection status. */
  status: DiagnosticStepStatus;
  /** Timestamp of when errors were checked. */
  checkedAt: string;
}

/**
 * A single detected error — with EXACT reason, no generic message.
 *
 * Each error has:
 *   - errorType: What kind of error (paper_out, cover_open, etc.)
 *   - reason: Why this error occurred (the EXACT cause)
 *   - affectedComponent: Which part of the device is affected
 *   - severity: How serious this error is
 *   - timestamp: When this error was detected
 */
export interface DetectedError {
  /** Machine-readable error type. */
  errorType: DiagnosticErrorType;
  /** Human-readable error name. */
  errorName: string;
  /** EXACT reason for this error (not generic). */
  reason: string;
  /** Which component is affected. */
  affectedComponent: DiagnosticComponent;
  /** Severity of this error. */
  severity: DiagnosticErrorSeverity;
  /** Whether this error is currently active (not historical). */
  active: boolean;
  /** ISO-8601 timestamp of when this error was detected. */
  detectedAt: string;
  /** Original error data from the device. */
  deviceErrorData: Record<string, unknown> | null;
}

/** Error types — specific device errors, no generic messages. */
export type DiagnosticErrorType =
  | "paper_out"
  | "cover_open"
  | "cutter_error"
  | "printer_offline"
  | "communication_lost"
  | "driver_missing"
  | "driver_corrupted"
  | "firmware_mismatch"
  | "firmware_corrupted"
  | "usb_disconnected"
  | "bluetooth_lost"
  | "lan_failure"
  | "wifi_failure"
  | "network_timeout"
  | "printer_busy"
  | "paper_jam"
  | "temperature_error"
  | "power_error"
  | "memory_error"
  | "unknown_error";

/** Which component is affected by an error. */
export type DiagnosticComponent =
  | "hardware"
  | "driver"
  | "firmware"
  | "communication"
  | "network"
  | "printing"
  | "paper_path"
  | "cutter"
  | "cover"
  | "power"
  | "memory";

/** Severity of a detected error. */
export type DiagnosticErrorSeverity = "info" | "warning" | "error" | "critical";

// ====================== Step 9 — Intelligent Troubleshooting ======================

/**
 * Troubleshooting result — smart resolution for each detected error.
 *
 * Every error gets:
 *   - Problem description
 *   - Possible reasons (specific, not vague)
 *   - Suggested fixes (actionable, not "check device")
 * No manual search required.
 */
export interface TroubleshootingResult {
  /** Troubleshooting suggestions for each detected error. */
  suggestions: TroubleshootingSuggestion[];
  /** Number of troubleshooting suggestions. */
  suggestionCount: number;
  /** Overall troubleshooting status. */
  status: DiagnosticStepStatus;
  /** Timestamp of when troubleshooting was generated. */
  generatedAt: string;
}

/**
 * Troubleshooting suggestion for a specific error.
 *
 * Maps error → possible reasons → suggested fixes.
 * Each fix is actionable (not vague like "check device").
 */
export interface TroubleshootingSuggestion {
  /** The error this suggestion addresses. */
  errorType: DiagnosticErrorType;
  /** Problem description. */
  problem: string;
  /** Possible reasons for this problem (specific, not vague). */
  possibleReasons: string[];
  /** Suggested fixes (actionable steps). */
  suggestedFixes: TroubleshootingFix[];
  /** Whether this issue can be resolved by the engineer. */
  resolvableByEngineer: boolean;
  /** Whether this issue requires contacting support. */
  requiresSupport: boolean;
  /** Priority of fixing this issue (higher = fix first). */
  priority: RecommendationPriority;
}

/** A specific, actionable fix. */
export interface TroubleshootingFix {
  /** The fix action. */
  action: string;
  /** Type of action (what category this fix belongs to). */
  actionType: RecommendationAction;
  /** Detailed instructions for this fix. */
  instructions: string;
  /** Expected outcome after applying this fix. */
  expectedOutcome: string;
  /** Estimated time to apply this fix (in minutes). Null if unknown. */
  estimatedTimeMinutes: number | null;
  /** Resource URL for more information (from Phase 3). */
  resourceUrl: string | null;
  /** Screen to navigate to for this fix. */
  resourceScreen: string | null;
}

/** Recommendation action types (extends diagnostics/types.ts). */
export type RecommendationAction =
  | "download_driver"
  | "download_firmware"
  | "open_manual"
  | "watch_video"
  | "open_troubleshooting"
  | "run_test_print"
  | "restart_spooler"
  | "verify_connection"
  | "power_cycle"
  | "load_paper"
  | "reconnect_usb"
  | "reconnect_bluetooth"
  | "reconnect_network"
  | "restart_printer"
  | "check_usb_cable"
  | "install_driver"
  | "update_firmware"
  | "check_paper_path"
  | "close_cover"
  | "clear_paper_jam"
  | "contact_support";

/** Recommendation priority. */
export type RecommendationPriority = "low" | "normal" | "high" | "urgent" | "critical";

// ====================== Step 10 — Predictive Health Engine ======================

/**
 * Predictive health result — based on HISTORICAL LOGS ONLY.
 *
 * No false predictions. Only warns based on:
 *   - Repeated communication failures
 *   - Frequent disconnects
 *   - Repeated driver errors
 *   - Firmware mismatch patterns
 *
 * If patterns are detected → "This device may require preventive maintenance."
 * If no patterns → no warning.
 */
export interface PredictiveHealthResult {
  /** Whether any predictive warning was generated. */
  hasWarnings: boolean;
  /** Predictive warnings based on historical patterns. */
  warnings: PredictiveWarning[];
  /** Whether this device may require preventive maintenance. */
  requiresPreventiveMaintenance: boolean;
  /** Historical pattern analysis (what patterns were found). */
  patternAnalysis: PredictivePattern[];
  /** Overall predictive health status. */
  status: DiagnosticStepStatus;
  /** Timestamp of when this analysis was performed. */
  analyzedAt: string;
}

/**
 * Predictive warning — based on historical pattern, not guessing.
 *
 * Each warning has:
 *   - pattern: What historical pattern was detected
 *   - description: What this pattern suggests
 *   - confidence: How confident the prediction is (based on frequency)
 *   - recommendation: What to do about it
 */
export interface PredictiveWarning {
  /** What pattern was detected. */
  pattern: PredictivePatternType;
  /** Description of this predictive warning. */
  description: string;
  /** Confidence level of this prediction. */
  confidence: PredictionConfidence;
  /** Recommended action. */
  recommendation: string;
  /** Historical evidence supporting this warning. */
  evidence: string[];
}

/** Pattern types detected from historical logs. */
export type PredictivePatternType =
  | "repeated_communication_failures"
  | "frequent_disconnects"
  | "repeated_driver_errors"
  | "firmware_mismatch_pattern"
  | "repeated_paper_errors"
  | "thermal_overheating_pattern"
  | "power_instability_pattern";

/** Confidence level of a prediction. */
export type PredictionConfidence = "high" | "medium" | "low";

/**
 * Historical pattern — the actual data behind a prediction.
 *
 * NEVER fabricated. Only based on real DiagnosticSession/ConfigurationEvent records.
 */
export interface PredictivePattern {
  /** What type of pattern was detected. */
  patternType: PredictivePatternType;
  /** How many times this pattern occurred in the history. */
  occurrenceCount: number;
  /** Time period over which these occurrences were found. */
  timePeriod: string;
  /** Whether the pattern is increasing in frequency. */
  increasingFrequency: boolean;
  /** Raw historical data points (dates, events) that form this pattern. */
  dataPoints: string[];
}

// ====================== Step 11 — Live Health Score ======================

/**
 * Live health score — calculated from REAL test results ONLY.
 *
 * Categories: Hardware, Communication, Driver, Firmware, Network, Printing.
 * Each category score is based on the actual diagnostic test results.
 * No fake scores. If a test was not performed → category score is "not_tested".
 */
export interface LiveHealthScore {
  /** Overall health score (0-100). Average of all tested category scores. */
  overallScore: number;
  /** Overall health grade based on score. */
  overallGrade: DiagnosticHealthGrade;
  /** Overall status label. */
  overallStatus: DiagnosticOverallStatus;
  /** Per-category health scores — only for tested categories. */
  categories: CategoryHealthScore[];
  /** Number of categories tested (not "not_tested"). */
  categoriesTested: number;
  /** Number of categories with issues (score < 100). */
  categoriesWithIssues: number;
  /** Timestamp of when this score was calculated. */
  calculatedAt: string;
}

/**
 * Health score for a single category.
 *
 * Only categories that were ACTUALLY tested are included.
 * If a device doesn't have Wi-Fi → Network category might still appear
 * for LAN tests, but if no network tests were run → "not_tested".
 */
export interface CategoryHealthScore {
  /** The category this score is for. */
  category: DiagnosticCategory;
  /** Score for this category (0-100). Based on REAL test results. */
  score: number;
  /** Health grade for this category. */
  grade: DiagnosticHealthGrade;
  /** Human-readable label. */
  label: string;
  /** Whether this category was actually tested. */
  tested: boolean;
  /** Key findings that affected this score. */
  keyFindings: string[];
  /** What diagnostic test(s) contributed to this score. */
  contributingTests: string[];
}

/** Diagnostic categories for health scoring. */
export type DiagnosticCategory =
  | "hardware"
  | "communication"
  | "driver"
  | "firmware"
  | "network"
  | "printing";

/** Health grade based on score. */
export type DiagnosticHealthGrade = "excellent" | "good" | "attention" | "critical" | "unknown";

/** Overall diagnostic status. */
export type DiagnosticOverallStatus = "Healthy" | "Attention Required" | "Critical" | "Unknown";

// ====================== Step 12 — Diagnostic Report ======================

/**
 * Diagnostic report — summary of all diagnostic results.
 *
 * Contains: Device info, Driver status, Firmware status, Connection,
 * Printer status, Health score, Issues list, Troubleshooting suggestions.
 */
export interface DiagnosticReport {
  /** Device information. */
  device: DiagnosticReportDeviceInfo;
  /** Driver status summary. */
  driverStatus: string;
  /** Firmware status summary. */
  firmwareStatus: string;
  /** Active connection type. */
  connection: string;
  /** Printer health summary. */
  printerStatus: string;
  /** Overall health score. */
  healthScore: number;
  /** Health grade. */
  healthGrade: DiagnosticHealthGrade;
  /** List of detected issues. Empty if no issues. */
  issues: DiagnosticIssue[];
  /** List of warnings. Empty if no warnings. */
  warnings: PredictiveWarning[];
  /** Timestamp of when this report was generated. */
  generatedAt: string;
}

/** Device information in the diagnostic report. */
export interface DiagnosticReportDeviceInfo {
  /** Device model name. */
  model: string | null;
  /** Device serial number. */
  serialNumber: string | null;
  /** Device type. */
  deviceType: DeviceType;
  /** Customer name (if registered). */
  customer: string | null;
  /** Passport ID. */
  passportId: string | null;
}

/**
 * A single issue in the diagnostic report.
 *
 * Each issue has a clear description, severity, and resolution status.
 */
export interface DiagnosticIssue {
  /** Issue description. */
  description: string;
  /** Severity of the issue. */
  severity: DiagnosticErrorSeverity;
  /** Whether this issue has a suggested fix. */
  hasSuggestedFix: boolean;
  /** Brief suggested fix (if available). */
  suggestedFix: string | null;
  /** Error type. */
  errorType: DiagnosticErrorType | null;
}

// ====================== Step 13 — Diagnostic History ======================

/**
 * Diagnostic history — saved in database for future reference.
 *
 * Every diagnostic run creates a history record with:
 *   - Date, Time, Engineer, Device, Result, Health Score, Issues, Fixes
 */
export interface DiagnosticHistoryEntry {
  /** Unique ID of this history record. */
  id: string;
  /** Session token for reference. */
  sessionToken: string;
  /** When the diagnostic was run. */
  date: string;
  /** Engineer who ran the diagnostic. */
  engineerName: string | null;
  /** Device information. */
  device: DiagnosticReportDeviceInfo;
  /** Overall diagnostic result. */
  diagnosticResult: DiagnosticOverallStatus;
  /** Health score. */
  healthScore: number;
  /** Issues detected. */
  issues: DiagnosticIssue[];
  /** Suggested fixes. */
  suggestedFixes: TroubleshootingFix[];
  /** Passport ID for DB reference. */
  passportId: string | null;
}

// ====================== Step 14 — Auto Resource Recommendation ======================

/**
 * Auto resource recommendation — suggested resources based on detected issues.
 *
 * If any issue is found → automatically suggest:
 *   - Correct driver
 *   - Latest firmware
 *   - Related manual
 *   - Related video
 *   - Troubleshooting guide
 *   - Configuration tool
 * All specific to the device model.
 */
export interface AutoResourceRecommendation {
  /** The issue that triggered this recommendation. */
  triggeredByIssue: DiagnosticErrorType | null;
  /** Recommended resources — model-specific. */
  resources: DiagnosticResourceItem[];
  /** Number of resources recommended. */
  resourceCount: number;
}

/**
 * A single recommended diagnostic resource.
 *
 * Each resource is specific to the device model and the detected issue.
 */
export interface DiagnosticResourceItem {
  /** Resource type. */
  type: DiagnosticResourceType;
  /** Human-readable label. */
  label: string;
  /** Resource name. */
  name: string;
  /** Resource URL or screen to navigate to. */
  url: string | null;
  /** Screen ID for in-app navigation. */
  screen: string | null;
  /** Why this resource is recommended. */
  reason: string;
  /** Priority of this recommendation. */
  priority: RecommendationPriority;
  /** Whether this resource is available (not all resources may be in database). */
  available: boolean;
}

/** Diagnostic resource types. */
export type DiagnosticResourceType =
  | "driver"
  | "firmware"
  | "manual"
  | "video"
  | "troubleshooting_guide"
  | "configuration_tool"
  | "sdk"
  | "utility";

// ====================== Step 15 — Error Handling ======================

/**
 * Diagnostic error — records what went wrong during a specific step.
 *
 * No step silently fails — every error is recorded.
 * Errors are NEVER hidden from the user.
 * Each error has a clear diagnostic status.
 */
export type DiagnosticErrorCode =
  | "printer_busy"
  | "device_offline"
  | "communication_timeout"
  | "driver_failure"
  | "api_failure"
  | "network_lost"
  | "firmware_read_error"
  | "desktop_agent_unavailable"
  | "hardware_unresponsive"
  | "usb_disconnected"
  | "bluetooth_disconnected"
  | "lan_failure"
  | "wifi_failure"
  | "paper_out"
  | "cover_open"
  | "cutter_error"
  | "test_print_failed"
  | "configuration_data_missing"
  | "cloud_lookup_data_missing"
  | "passport_not_found";

export interface DiagnosticError {
  /** Which Phase 5 step failed. */
  step: DiagnosticStep;
  /** Human-readable error message (shown to the user). */
  message: string;
  /** Machine-readable error code. */
  errorCode: DiagnosticErrorCode;
  /** Whether this error is recoverable (partial diagnostics still available). */
  recoverable: boolean;
  /** Original error object, if available (for debugging). */
  originalError?: string;
  /** ISO-8601 timestamp of when the error occurred. */
  timestamp: string;
}

/** Phase 5 step names. */
export type DiagnosticStep =
  | "start_diagnostics"
  | "hardware_health_check"
  | "driver_validation"
  | "firmware_validation"
  | "communication_diagnostics"
  | "print_engine_test"
  | "capability_validation"
  | "error_detection"
  | "troubleshooting"
  | "predictive_health"
  | "health_score_calculation"
  | "diagnostic_report"
  | "diagnostic_history"
  | "resource_recommendation"
  | "error_handling";

// ====================== Status Types ======================

/** Status of a single diagnostic step. */
export type DiagnosticStepStatus =
  | "successful"
  | "failed"
  | "partial"
  | "critical"
  | "skipped"
  | "not_supported"
  | "not_tested"
  | "pending";

/** Supported diagnostic connection types — matches Phase 4. */
export type DiagnosticConnectionType = "usb" | "lan" | "wifi" | "bluetooth";

// ====================== Complete Output (Phase 6 Input) ======================

/**
 * Diagnostic Result — the complete output passed to Phase 6.
 *
 * This is the FINAL output of the Live Diagnostic Engine.
 * All data comes from REAL hardware diagnostics — no fakes, no mocks.
 *
 * If diagnostics fail:
 *   - overallStatus will be "Critical" or "Unknown"
 *   - healthScore will reflect the failure (low score)
 *   - errors will contain the failure details
 *   - NO cached/fake/simulated success data
 *
 * If diagnostics succeed:
 *   - overallStatus will be "Healthy"
 *   - healthScore will reflect actual test results
 *   - issues will be empty or list real detected errors
 *   - warnings will be based on historical patterns only
 */
export interface DiagnosticResult {
  /** Whether the overall diagnostics succeeded (at least partially). */
  success: boolean;
  /** Overall diagnostic status. */
  overallStatus: DiagnosticOverallStatus;
  /** Overall health score (0-100). Based on REAL test results. */
  healthScore: number;
  /** Overall health grade. */
  healthGrade: DiagnosticHealthGrade;
  /** Driver status summary. */
  driverStatus: string;
  /** Firmware status summary. */
  firmwareStatus: string;
  /** Communication status summary. */
  communicationStatus: string;
  /** Network status summary. */
  networkStatus: string;
  /** Printer status summary. */
  printerStatus: string;
  /** Step 2: Hardware health check results. */
  hardwareHealth: HardwareHealthCheck | null;
  /** Step 3: Driver validation results. */
  driverValidation: DriverValidationResult | null;
  /** Step 4: Firmware validation results. */
  firmwareValidation: FirmwareValidationResult | null;
  /** Step 5: Communication diagnostics results. */
  communicationDiagnostics: CommunicationDiagnosticResult | null;
  /** Step 6: Print engine test results. */
  printEngineTest: PrintEngineTestResult | null;
  /** Step 7: Capability validation results. */
  capabilityValidation: CapabilityValidationResult | null;
  /** Step 8: Error detection results. */
  errorDetection: ErrorDetectionResult | null;
  /** Step 9: Troubleshooting suggestions. */
  troubleshooting: TroubleshootingResult | null;
  /** Step 10: Predictive health analysis. */
  predictiveHealth: PredictiveHealthResult | null;
  /** Step 11: Live health score breakdown. */
  liveHealthScore: LiveHealthScore | null;
  /** Step 12: Diagnostic report. */
  diagnosticReport: DiagnosticReport | null;
  /** Step 13: Diagnostic history entries. */
  diagnosticHistory: DiagnosticHistoryEntry[];
  /** Step 14: Auto resource recommendations. */
  recommendedResources: AutoResourceRecommendation[];
  /** Detected issues list. Empty if no issues. */
  issues: DiagnosticIssue[];
  /** Predictive warnings list. Empty if no warnings. */
  warnings: PredictiveWarning[];
  /** Errors encountered during diagnostics. Empty if all steps succeeded. */
  errors: DiagnosticError[];
  /** ISO-8601 timestamp of when this result was generated. */
  diagnosticTimestamp: string;
  /** Duration of the entire diagnostic process in milliseconds. */
  diagnosticDurationMs: number;
}

// ====================== API Response ======================

/**
 * POST /api/dr-qbit/diagnostics/run response (Phase 5 enhanced).
 */
export interface DiagnosticResponse extends DiagnosticResult {
  /** Human-readable message for the user. */
  message: string;
}

// ====================== Desktop Agent Diagnostic Protocol ======================

/**
 * Desktop Agent diagnostic command — sent to localhost:53742.
 *
 * The Desktop Agent is the execution engine for all LIVE diagnostic
 * operations. The web app sends commands and receives real results.
 * No fake/simulated responses.
 */
export interface DesktopAgentDiagnosticCommand {
  /** Command type. */
  command: DiagnosticAgentCommandType;
  /** Target device identifier. */
  deviceIdentifier: {
    serialNumber?: string;
    vendorId?: string;
    productIdCode?: string;
    port?: string;
    ipAddress?: string;
  };
  /** Command-specific parameters. */
  parameters: Record<string, unknown>;
  /** Authentication secret. */
  agentSecret?: string;
}

/** Diagnostic agent command types. */
export type DiagnosticAgentCommandType =
  | "check_hardware"
  | "check_driver"
  | "check_firmware"
  | "check_communication"
  | "check_print_engine"
  | "check_capabilities"
  | "detect_errors"
  | "read_printer_status"
  | "send_test_command"
  | "ping_device"
  | "get_usb_status"
  | "get_bluetooth_status"
  | "get_network_status";

/**
 * Desktop Agent diagnostic response — real hardware test result.
 */
export interface DesktopAgentDiagnosticResponse {
  /** Whether the command succeeded. */
  success: boolean;
  /** Command type that was executed. */
  command: DiagnosticAgentCommandType;
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

/** Human-readable label per diagnostic step status. */
export const DIAG_STEP_STATUS_LABELS: Record<DiagnosticStepStatus, string> = {
  successful: "Successful",
  failed: "Failed",
  partial: "Partially Completed",
  critical: "Critical",
  skipped: "Skipped",
  not_supported: "Not Supported",
  not_tested: "Not Tested",
  pending: "Pending",
};

/** Human-readable label per diagnostic category. */
export const DIAG_CATEGORY_LABELS: Record<DiagnosticCategory, string> = {
  hardware: "Hardware",
  communication: "Communication",
  driver: "Driver",
  firmware: "Firmware",
  network: "Network",
  printing: "Printing",
};

/** Material Symbol icon per diagnostic category. */
export const DIAG_CATEGORY_ICONS: Record<DiagnosticCategory, string> = {
  hardware: "memory",
  communication: "cable",
  driver: "settings_input_component",
  firmware: "system_update",
  network: "lan",
  printing: "print",
};

/** Human-readable label per diagnostic overall status. */
export const DIAG_OVERALL_STATUS_LABELS: Record<DiagnosticOverallStatus, string> = {
  Healthy: "Healthy",
  "Attention Required": "Attention Required",
  Critical: "Critical",
  Unknown: "Unknown",
};

/** Human-readable label per diagnostic health grade. */
export const DIAG_HEALTH_GRADE_LABELS: Record<DiagnosticHealthGrade, string> = {
  excellent: "Excellent",
  good: "Good",
  attention: "Attention Required",
  critical: "Critical",
  unknown: "Unknown",
};

/** Badge variant per diagnostic health grade. */
export const DIAG_HEALTH_GRADE_VARIANTS: Record<
  DiagnosticHealthGrade,
  "success" | "info" | "warning" | "error" | "neutral"
> = {
  excellent: "success",
  good: "info",
  attention: "warning",
  critical: "error",
  unknown: "neutral",
};

/** Material Symbol icon per diagnostic health grade. */
export const DIAG_HEALTH_GRADE_ICONS: Record<DiagnosticHealthGrade, string> = {
  excellent: "verified",
  good: "check_circle",
  attention: "warning",
  critical: "error",
  unknown: "help_outline",
};

/** Human-readable label per diagnostic error type. */
export const DIAG_ERROR_TYPE_LABELS: Record<DiagnosticErrorType, string> = {
  paper_out: "Paper Out",
  cover_open: "Cover Open",
  cutter_error: "Cutter Error",
  printer_offline: "Printer Offline",
  communication_lost: "Communication Lost",
  driver_missing: "Driver Missing",
  driver_corrupted: "Driver Corrupted",
  firmware_mismatch: "Firmware Mismatch",
  firmware_corrupted: "Firmware Corrupted",
  usb_disconnected: "USB Disconnected",
  bluetooth_lost: "Bluetooth Lost",
  lan_failure: "LAN Failure",
  wifi_failure: "Wi-Fi Failure",
  network_timeout: "Network Timeout",
  printer_busy: "Printer Busy",
  paper_jam: "Paper Jam",
  temperature_error: "Temperature Error",
  power_error: "Power Error",
  memory_error: "Memory Error",
  unknown_error: "Unknown Error",
};

/** Human-readable label per diagnostic error code. */
export const DIAG_ERROR_CODE_LABELS: Record<DiagnosticErrorCode, string> = {
  printer_busy: "Printer Busy — Cannot Run Diagnostics Now",
  device_offline: "Device Offline — Cannot Run Diagnostics",
  communication_timeout: "Communication Timeout — Device Not Responding",
  driver_failure: "Driver Failure — Cannot Communicate with Device",
  api_failure: "API Failure — Diagnostic Service Error",
  network_lost: "Network Connection Lost During Diagnostics",
  firmware_read_error: "Firmware Read Error — Cannot Verify Version",
  desktop_agent_unavailable: "Desktop Agent Not Available — Live Diagnostics Require Agent",
  hardware_unresponsive: "Hardware Unresponsive — No Device Response",
  usb_disconnected: "USB Disconnected During Diagnostics",
  bluetooth_disconnected: "Bluetooth Disconnected During Diagnostics",
  lan_failure: "LAN Connection Failed During Diagnostics",
  wifi_failure: "Wi-Fi Connection Failed During Diagnostics",
  paper_out: "Paper Out — Cannot Complete Print Test",
  cover_open: "Cover Open — Cannot Complete Print Test",
  cutter_error: "Cutter Error — Mechanism Malfunction",
  test_print_failed: "Test Print Failed — Print Engine Not Working",
  configuration_data_missing: "Configuration Data Missing — Cannot Run Diagnostics",
  cloud_lookup_data_missing: "Cloud Lookup Data Missing — Cannot Verify Firmware/Driver",
  passport_not_found: "Device Passport Not Found — Cannot Save History",
};

/** Human-readable label per diagnostic connection type. */
export const DIAG_CONNECTION_LABELS: Record<DiagnosticConnectionType, string> = {
  usb: "USB",
  lan: "Ethernet (LAN)",
  wifi: "Wi-Fi",
  bluetooth: "Bluetooth",
};

/** Material Symbol icon per diagnostic connection type. */
export const DIAG_CONNECTION_ICONS: Record<DiagnosticConnectionType, string> = {
  usb: "usb",
  lan: "lan",
  wifi: "wifi",
  bluetooth: "bluetooth",
};

/** Human-readable label per firmware update status. */
export const FIRMWARE_UPDATE_STATUS_LABELS: Record<FirmwareUpdateStatus, string> = {
  latest: "Firmware is Latest Version",
  update_available: "Firmware Update Available",
  unsupported: "Firmware Version Unsupported",
  corrupted: "Firmware Appears Corrupted",
  unknown: "Firmware Status Unknown",
};

/** Human-readable label per diagnostic resource type. */
export const DIAG_RESOURCE_TYPE_LABELS: Record<DiagnosticResourceType, string> = {
  driver: "Driver Download",
  firmware: "Firmware Update",
  manual: "Manual & Guide",
  video: "Setup Video",
  troubleshooting_guide: "Troubleshooting Guide",
  configuration_tool: "Configuration Tool",
  sdk: "SDK & Developer Resources",
  utility: "Utility & Diagnostic Tool",
};

/** Human-readable label per predictive pattern type. */
export const PREDICTIVE_PATTERN_LABELS: Record<PredictivePatternType, string> = {
  repeated_communication_failures: "Repeated Communication Failures",
  frequent_disconnects: "Frequent Disconnections",
  repeated_driver_errors: "Repeated Driver Errors",
  firmware_mismatch_pattern: "Firmware Version Mismatch Pattern",
  repeated_paper_errors: "Repeated Paper/Cover/Cutter Errors",
  thermal_overheating_pattern: "Thermal Overheating Pattern",
  power_instability_pattern: "Power Instability Pattern",
};

/**
 * Computes health grade from a 0-100 score.
 * Same rules as the existing diagnostics engine — no guessing.
 */
export function gradeFromScore(score: number): DiagnosticHealthGrade {
  if (score >= 90) return "excellent";
  if (score >= 70) return "good";
  if (score >= 40) return "attention";
  if (score >= 0) return "critical";
  return "unknown";
}

/**
 * Computes overall status from health grade.
 */
export function statusFromGrade(grade: DiagnosticHealthGrade): DiagnosticOverallStatus {
  switch (grade) {
    case "excellent": return "Healthy";
    case "good": return "Healthy";
    case "attention": return "Attention Required";
    case "critical": return "Critical";
    case "unknown": return "Unknown";
  }
}

/**
 * Maps Phase 4 ConfigurationConnectionType to Phase 5 DiagnosticConnectionType.
 * They're the same strings but defined in separate modules for independence.
 */
export function mapConfigToDiagConnection(
  configType: ConfigurationConnectionType,
): DiagnosticConnectionType {
  return configType as DiagnosticConnectionType;
}
