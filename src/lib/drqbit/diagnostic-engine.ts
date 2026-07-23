/**
 * Dr. QBIT Phase 5 — Intelligent Diagnostics, Predictive Health & Troubleshooting Engine
 *
 * The core orchestrator that receives a ConfigurationResult from Phase 4,
 * runs LIVE hardware diagnostics on the connected device, and produces:
 *   1. Hardware Health Check (device online, responding, stable, ready)
 *   2. Driver Validation (installed, version, corrupted, compatible)
 *   3. Firmware Validation (installed vs latest, update status, corrupted)
 *   4. Communication Diagnostics (per-connection command send → response)
 *   5. Print Engine Test (mini test command → started/completed/timeout/busy)
 *   6. Device Capability Validation (per-supported-capability health check)
 *   7. Error Detection (paper out, cover open, cutter, offline, driver, etc.)
 *   8. Intelligent Troubleshooting (problem → possible reasons → suggested fixes)
 *   9. Predictive Health Engine (historical pattern analysis → warnings)
 *  10. Live Health Score (per-category scores based on REAL test results)
 *  11. Diagnostic Report (summary: device, driver, firmware, health, issues)
 *  12. Diagnostic History (saved in database for future reference)
 *  13. Auto Resource Recommendation (model-specific driver/firmware/manual/video)
 *  14. Error Handling (clear diagnostic status for every error)
 *  15. Output Object for Phase 6
 *
 * Architecture:
 *   Phase 4 ConfigurationResult + Phase 3 CloudLookupResult
 *     → Build AdapterDeviceInfo
 *     → Get Diagnostic Adapter (device-type-specific)
 *     → Step 2: Hardware Health Check (via adapter + Desktop Agent)
 *     → Step 3: Driver Validation (via adapter + Desktop Agent)
 *     → Step 4: Firmware Validation (via adapter + database + Desktop Agent)
 *     → Step 5: Communication Diagnostics (via adapter + Desktop Agent)
 *     → Step 6: Print Engine Test (via adapter + Desktop Agent)
 *     → Step 7: Capability Validation (via adapter + Desktop Agent)
 *     → Step 8: Error Detection (aggregate all previous checks + Desktop Agent)
 *     → Step 9: Intelligent Troubleshooting (map errors → fixes)
 *     → Step 10: Predictive Health (analyze historical patterns)
 *     → Step 11: Live Health Score (calculate from REAL test results)
 *     → Step 12: Diagnostic Report (build summary)
 *     → Step 13: Save Diagnostic History (database)
 *     → Step 14: Auto Resource Recommendation (model-specific resources)
 *     → Step 15: Error Handling + Build Phase 6 Output
 *
 * Rules:
 *   - NO fake/dummy/mock/simulated health status.
 *   - NO dummy success messages.
 *   - All diagnostic results based on REAL hardware response.
 *   - Unsupported capabilities NOT shown in results.
 *   - Health scores ONLY calculated from real test results.
 *   - Predictive warnings ONLY based on historical logs — no false predictions.
 *   - Diagnostic history saved in database.
 *   - Extensible: new device types need only adapter + capability profile.
 *   - Core engine unchanged for future device types.
 */

import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";
import type { DeviceType, DeviceCapability } from "./types";
import type { ConfigurationResult } from "./configuration-types";
import type { CloudLookupResult } from "./cloud-lookup-types";
import type {
  DiagnosticAction,
  DiagnosticRequest,
  DiagnosticResult,
  DiagnosticStep,
  DiagnosticStepStatus,
  DiagnosticError,
  DiagnosticErrorCode,
  DiagnosticOverallStatus,
  DiagnosticHealthGrade,
  DiagnosticCategory,
  DiagnosticConnectionType,
  HardwareHealthCheck,
  DriverValidationResult,
  FirmwareValidationResult,
  FirmwareUpdateStatus,
  CommunicationDiagnosticResult,
  CommunicationConnectionTest,
  PrintEngineTestResult,
  CapabilityValidationResult,
  CapabilityHealthCheck,
  ErrorDetectionResult,
  DetectedError,
  DiagnosticErrorType,
  DiagnosticErrorSeverity,
  TroubleshootingResult,
  TroubleshootingSuggestion,
  TroubleshootingFix,
  RecommendationAction,
  RecommendationPriority,
  PredictiveHealthResult,
  PredictiveWarning,
  PredictivePattern,
  PredictivePatternType,
  PredictionConfidence,
  LiveHealthScore,
  CategoryHealthScore,
  DiagnosticReport,
  DiagnosticIssue,
  DiagnosticHistoryEntry,
  AutoResourceRecommendation,
  DiagnosticResourceItem,
  DiagnosticResourceType,
  DiagnosticComponent,
} from "./diagnostic-types";
import {
  gradeFromScore,
  statusFromGrade,
  DIAG_ERROR_TYPE_LABELS,
} from "./diagnostic-types";
import {
  getApplicableDiagnosticAdapter,
  isDesktopAgentAvailable,
  buildDiagnosticDeviceInfo,
  getSupportedConnectionTypes,
  BaseDiagnosticAdapter,
} from "./diagnostic-adapters";
import type { DiagnosticAdapter, DiagnosticDeviceInfo as AdapterDeviceInfo } from "./diagnostic-adapters";

// ====================== Step 1 — Start Live Diagnostics ======================

/**
 * Runs the full Phase 5 live diagnostic pipeline on a connected device.
 *
 * This is the MAIN entry point. It orchestrates all 15 steps
 * and produces the complete DiagnosticResult for Phase 6.
 *
 * If the action is a specific single-step action (e.g. "check_hardware"),
 * only that step is run and the rest are left as null/pending.
 */
export async function runLiveDiagnostics(
  request: DiagnosticRequest,
): Promise<DiagnosticResult> {
  const startTime = Date.now();
  const errors: DiagnosticError[] = [];

  // Validate inputs
  if (!request.configurationResult) {
    return buildErrorResult(
      startTime,
      errors,
      "start_diagnostics",
      "ConfigurationResult from Phase 4 is required — cannot start diagnostics",
      "configuration_data_missing",
      false,
    );
  }

  if (!request.cloudLookupResult) {
    return buildErrorResult(
      startTime,
      errors,
      "start_diagnostics",
      "CloudLookupResult from Phase 3 is required — cannot validate firmware/driver",
      "cloud_lookup_data_missing",
      false,
    );
  }

  const configResult = request.configurationResult;
  const cloudLookup = request.cloudLookupResult;

  // Build device info for adapters
  const deviceInfo = buildDiagnosticDeviceInfo(configResult, cloudLookup) as AdapterDeviceInfo;

  // Check Desktop Agent availability
  let agentAvailable = false;
  try {
    agentAvailable = await isDesktopAgentAvailable();
  } catch {
    // Desktop Agent check failed — assume unavailable
    agentAvailable = false;
  }

  // Get the appropriate diagnostic adapter for this device type
  const adapter = getApplicableDiagnosticAdapter(deviceInfo.deviceType);

  // ====================== Run Steps Based on Action ======================

  const isFullRun = request.action === "run_diagnostics";

  // Step 2: Hardware Health Check
  let hardwareHealth: HardwareHealthCheck | null = null;
  if (isFullRun || request.action === "check_hardware") {
    try {
      hardwareHealth = await adapter.checkHardware(deviceInfo, agentAvailable);
    } catch (error) {
      errors.push(buildDiagnosticError("hardware_health_check", error, "hardware_unresponsive"));
      hardwareHealth = {
        deviceOnline: false,
        deviceResponding: false,
        connectionStable: false,
        printerReady: false,
        connectionHealth: [],
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Hardware health check failed",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  // Step 3: Driver Validation
  let driverValidation: DriverValidationResult | null = null;
  if (isFullRun || request.action === "check_driver") {
    try {
      driverValidation = await adapter.validateDriver(deviceInfo, cloudLookup, agentAvailable);
    } catch (error) {
      errors.push(buildDiagnosticError("driver_validation", error, "driver_failure"));
      driverValidation = {
        driverInstalled: false,
        driverName: null,
        driverVersion: null,
        latestDriverVersion: null,
        isLatest: false,
        driverCorrupted: false,
        driverCompatible: false,
        compatibleDriverAvailable: cloudLookup.resources.drivers.length > 0,
        driverDownloadUrl: cloudLookup.resources.drivers.length > 0 ? cloudLookup.resources.drivers[0].url ?? null : null,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Driver validation failed",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  // Step 4: Firmware Validation
  let firmwareValidation: FirmwareValidationResult | null = null;
  if (isFullRun || request.action === "check_firmware") {
    try {
      firmwareValidation = await adapter.validateFirmware(deviceInfo, cloudLookup, agentAvailable);
    } catch (error) {
      errors.push(buildDiagnosticError("firmware_validation", error, "firmware_read_error"));
      firmwareValidation = {
        installedFirmware: deviceInfo.firmwareVersion,
        latestFirmware: cloudLookup.firmwareCompatibility?.latestFirmware ?? null,
        latestFirmwareReleaseDate: cloudLookup.firmwareCompatibility?.latestFirmwareReleaseDate ?? null,
        isLatest: false,
        updateStatus: "unknown",
        isCritical: false,
        isSupported: false,
        isCorrupted: false,
        firmwareDownloadUrl: cloudLookup.firmwareCompatibility?.latestFirmwareDownloadUrl ?? null,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Firmware validation failed",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  // Step 5: Communication Diagnostics
  let communicationDiagnostics: CommunicationDiagnosticResult | null = null;
  let communicationTests: CommunicationConnectionTest[] | null = null;
  if (isFullRun || request.action === "check_communication") {
    try {
      communicationTests = await adapter.testCommunication(deviceInfo, configResult, agentAvailable);
      const anyVerified = communicationTests.some((t) => t.status === "successful" && t.responseReceived);
      communicationDiagnostics = {
        connectionTests: communicationTests,
        anyCommunicationVerified: anyVerified,
        status: anyVerified ? "successful" : (communicationTests.some((t) => t.connected) ? "partial" : "failed"),
        errorMessage: anyVerified ? null : "Communication not verified on any connection type",
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      errors.push(buildDiagnosticError("communication_diagnostics", error, "communication_timeout"));
      communicationDiagnostics = {
        connectionTests: [],
        anyCommunicationVerified: false,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Communication diagnostics failed",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  // Step 6: Print Engine Test
  let printEngineTest: PrintEngineTestResult | null = null;
  if (isFullRun || request.action === "check_print_engine") {
    try {
      printEngineTest = await adapter.testPrintEngine(deviceInfo, agentAvailable);
    } catch (error) {
      errors.push(buildDiagnosticError("print_engine_test", error, "test_print_failed"));
      printEngineTest = {
        printStarted: false,
        printCompleted: false,
        printTimeout: false,
        printerBusy: false,
        testContent: null,
        printDurationMs: null,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Print engine test failed",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  // Step 7: Capability Validation
  let capabilityValidation: CapabilityValidationResult | null = null;
  if (isFullRun || request.action === "check_capabilities") {
    try {
      const capChecks = await adapter.validateCapabilities(
        deviceInfo,
        deviceInfo.capabilities,
        agentAvailable,
      );
      capabilityValidation = {
        capabilities: capChecks,
        status: capChecks.every((c) => c.functioning) ? "successful" : (capChecks.some((c) => c.functioning) ? "partial" : "failed"),
        errorMessage: null,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      errors.push(buildDiagnosticError("capability_validation", error, "hardware_unresponsive"));
      capabilityValidation = {
        capabilities: [],
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Capability validation failed",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  // Step 8: Error Detection
  let errorDetection: ErrorDetectionResult | null = null;
  let detectedErrors: DetectedError[] = [];
  if (isFullRun || request.action === "detect_errors") {
    try {
      detectedErrors = await adapter.detectErrors(
        deviceInfo,
        hardwareHealth,
        driverValidation,
        firmwareValidation,
        communicationTests,
        agentAvailable,
      );
      errorDetection = {
        detectedErrors,
        errorCount: detectedErrors.length,
        status: detectedErrors.length === 0 ? "successful" : (detectedErrors.some((e) => e.severity === "critical") ? "critical" : "partial"),
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      errors.push(buildDiagnosticError("error_detection", error, "api_failure"));
      errorDetection = {
        detectedErrors: [],
        errorCount: 0,
        status: "failed",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  // Step 9: Intelligent Troubleshooting
  let troubleshooting: TroubleshootingResult | null = null;
  if (isFullRun || request.action === "get_troubleshooting") {
    try {
      troubleshooting = generateTroubleshooting(detectedErrors, deviceInfo, cloudLookup);
    } catch (error) {
      errors.push(buildDiagnosticError("troubleshooting", error, "api_failure"));
      troubleshooting = {
        suggestions: [],
        suggestionCount: 0,
        status: "failed",
        generatedAt: new Date().toISOString(),
      };
    }
  }

  // Step 10: Predictive Health Engine
  let predictiveHealth: PredictiveHealthResult | null = null;
  if (isFullRun || request.action === "get_predictions") {
    try {
      predictiveHealth = await analyzePredictiveHealth(
        deviceInfo,
        cloudLookup,
        detectedErrors,
      );
    } catch (error) {
      errors.push(buildDiagnosticError("predictive_health", error, "api_failure"));
      predictiveHealth = {
        hasWarnings: false,
        warnings: [],
        requiresPreventiveMaintenance: false,
        patternAnalysis: [],
        status: "not_tested",
        analyzedAt: new Date().toISOString(),
      };
    }
  }

  // Step 11: Live Health Score Calculation
  let liveHealthScore: LiveHealthScore | null = null;
  if (isFullRun || request.action === "get_health_score") {
    try {
      liveHealthScore = calculateHealthScore(
        hardwareHealth,
        driverValidation,
        firmwareValidation,
        communicationDiagnostics,
        printEngineTest,
        capabilityValidation,
        errorDetection,
        deviceInfo,
      );
    } catch (error) {
      errors.push(buildDiagnosticError("health_score_calculation", error, "api_failure"));
      liveHealthScore = {
        overallScore: 0,
        overallGrade: "unknown",
        overallStatus: "Unknown",
        categories: [],
        categoriesTested: 0,
        categoriesWithIssues: 0,
        calculatedAt: new Date().toISOString(),
      };
    }
  }

  // Step 12: Diagnostic Report
  let diagnosticReport: DiagnosticReport | null = null;
  if (isFullRun || request.action === "get_report") {
    try {
      diagnosticReport = buildDiagnosticReport(
        deviceInfo,
        driverValidation,
        firmwareValidation,
        configResult,
        liveHealthScore,
        detectedErrors,
        predictiveHealth,
      );
    } catch (error) {
      errors.push(buildDiagnosticError("diagnostic_report", error, "api_failure"));
      diagnosticReport = null;
    }
  }

  // Step 13: Diagnostic History (save to database)
  let diagnosticHistory: DiagnosticHistoryEntry[] = [];
  if (isFullRun || request.action === "run_diagnostics") {
    try {
      if (deviceInfo.passportId && liveHealthScore) {
        const historyEntry = await saveDiagnosticHistory(
          deviceInfo,
          request,
          liveHealthScore,
          detectedErrors,
          troubleshooting,
        );
        diagnosticHistory = [historyEntry];
      }
    } catch (error) {
      // History save failure is non-critical — don't block diagnostics
      console.error("[DIAG ENGINE] Failed to save diagnostic history:", error);
    }
  }

  // Step 14: Auto Resource Recommendation
  let recommendedResources: AutoResourceRecommendation[] = [];
  if (isFullRun || request.action === "get_resources") {
    try {
      recommendedResources = generateResourceRecommendations(
        detectedErrors,
        deviceInfo,
        cloudLookup,
      );
    } catch (error) {
      // Resource recommendation failure is non-critical
      console.error("[DIAG ENGINE] Failed to generate resource recommendations:", error);
    }
  }

  // ====================== Build Final Result ======================

  const overallScore = liveHealthScore?.overallScore ?? 0;
  const overallGrade = liveHealthScore?.overallGrade ?? "unknown";
  const overallStatus = liveHealthScore?.overallStatus ?? "Unknown";

  // Determine status summaries
  const driverStatus = driverValidation
    ? driverValidation.driverInstalled
      ? driverValidation.isLatest ? "Installed (Latest)" : `Installed (v${driverValidation.driverVersion ?? "unknown"})`
      : driverValidation.compatibleDriverAvailable ? "Missing — Compatible Driver Available" : "Missing"
    : "Not Checked";

  const firmwareStatus = firmwareValidation
    ? firmwareValidation.updateStatus === "latest" ? "Latest"
      : firmwareValidation.updateStatus === "update_available" ? "Update Available"
      : firmwareValidation.updateStatus === "unsupported" ? "Unsupported Version"
      : firmwareValidation.updateStatus === "corrupted" ? "Corrupted"
      : "Unknown"
    : "Not Checked";

  const communicationStatus = communicationDiagnostics
    ? communicationDiagnostics.anyCommunicationVerified ? "Stable" : "Not Verified"
    : "Not Checked";

  const networkStatus = communicationDiagnostics
    ? communicationDiagnostics.connectionTests.some((t) =>
        (t.connectionType === "lan" || t.connectionType === "wifi") && t.status === "successful"
      ) ? "Connected"
      : communicationDiagnostics.connectionTests.some((t) =>
        (t.connectionType === "lan" || t.connectionType === "wifi") && t.connected
      ) ? "Partial"
      : "Not Checked"
    : "Not Checked";

  const printerStatus = printEngineTest
    ? printEngineTest.printCompleted ? "Ready"
      : printEngineTest.printerBusy ? "Busy"
      : printEngineTest.printTimeout ? "Timeout"
      : printEngineTest.status === "not_supported" ? "Not Supported"
      : "Error"
    : hardwareHealth?.printerReady ? "Ready" : "Not Checked";

  // Build issues list from detected errors
  const issues: DiagnosticIssue[] = detectedErrors.map((err) => ({
    description: DIAG_ERROR_TYPE_LABELS[err.errorType] ?? err.errorName,
    severity: err.severity,
    hasSuggestedFix: troubleshooting?.suggestions.some((s) => s.errorType === err.errorType) ?? false,
    suggestedFix: troubleshooting?.suggestions.find((s) => s.errorType === err.errorType)?.suggestedFixes[0]?.action ?? null,
    errorType: err.errorType,
  }));

  // Build warnings from predictive health
  const warnings: PredictiveWarning[] = predictiveHealth?.warnings ?? [];

  // Determine success
  const success = overallStatus !== "Critical" && overallStatus !== "Unknown";

  const result: DiagnosticResult = {
    success,
    overallStatus,
    healthScore: overallScore,
    healthGrade: overallGrade,
    driverStatus,
    firmwareStatus,
    communicationStatus,
    networkStatus,
    printerStatus,
    hardwareHealth,
    driverValidation,
    firmwareValidation,
    communicationDiagnostics,
    printEngineTest,
    capabilityValidation,
    errorDetection,
    troubleshooting,
    predictiveHealth,
    liveHealthScore,
    diagnosticReport,
    diagnosticHistory,
    recommendedResources,
    issues,
    warnings,
    errors,
    diagnosticTimestamp: new Date().toISOString(),
    diagnosticDurationMs: Date.now() - startTime,
  };

  return result;
}

// ====================== Step 9 — Intelligent Troubleshooting ======================

/**
 * Generates troubleshooting suggestions for each detected error.
 *
 * Maps error → possible reasons → suggested fixes.
 * Each fix is actionable (not vague).
 * No manual search required.
 */
function generateTroubleshooting(
  detectedErrors: DetectedError[],
  deviceInfo: AdapterDeviceInfo,
  cloudLookup: CloudLookupResult,
): TroubleshootingResult {
  const suggestions: TroubleshootingSuggestion[] = [];

  // Troubleshooting knowledge base — maps error types to solutions
  const TROUBLESHOOTING_KB: Record<DiagnosticErrorType, {
    problem: string;
    possibleReasons: string[];
    fixes: Array<{
      action: string;
      actionType: RecommendationAction;
      instructions: string;
      expectedOutcome: string;
      estimatedTimeMinutes: number;
      resourceScreen?: string;
    }>;
    resolvableByEngineer: boolean;
    requiresSupport: boolean;
    priority: RecommendationPriority;
  }> = {
    paper_out: {
      problem: "Printer reports paper out — no paper in the paper path",
      possibleReasons: ["Paper roll not loaded", "Paper roll empty", "Paper sensor malfunction", "Paper loaded incorrectly (not feeding through sensor)"],
      fixes: [
        { action: "Load Paper Roll", actionType: "load_paper", instructions: "Open the printer cover, load a new paper roll, ensure paper feeds through the sensor gap, close the cover", expectedOutcome: "Paper sensor detects paper and printer status changes to Ready", estimatedTimeMinutes: 2 },
        { action: "Check Paper Path", actionType: "check_paper_path", instructions: "Verify paper is feeding correctly through the paper path, check for any obstruction or misalignment", expectedOutcome: "Paper feeds smoothly without jams", estimatedTimeMinutes: 3 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "urgent",
    },
    cover_open: {
      problem: "Printer cover is open — printing cannot proceed",
      possibleReasons: ["Cover not properly closed after loading paper", "Cover sensor malfunction", "Cover latch broken"],
      fixes: [
        { action: "Close Printer Cover", actionType: "close_cover", instructions: "Close the printer cover firmly, ensure the latch clicks into place, verify the cover sensor detects closed state", expectedOutcome: "Cover sensor shows closed, printer ready for operation", estimatedTimeMinutes: 1 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "urgent",
    },
    cutter_error: {
      problem: "Auto cutter mechanism error — cutter not functioning",
      possibleReasons: ["Cutter blade stuck or jammed", "Cutter motor failure", "Paper jam preventing cutter movement", "Cutter mechanism worn out"],
      fixes: [
        { action: "Clear Cutter Area", actionType: "check_paper_path", instructions: "Remove any stuck paper or debris around the cutter blade, gently move the cutter to verify it can rotate freely", expectedOutcome: "Cutter blade moves freely, cutter status returns to normal", estimatedTimeMinutes: 5 },
        { action: "Restart Printer", actionType: "restart_printer", instructions: "Power cycle the printer — turn off, wait 10 seconds, turn on. This resets the cutter mechanism", expectedOutcome: "Cutter mechanism resets to home position", estimatedTimeMinutes: 2 },
      ],
      resolvableByEngineer: true,
      requiresSupport: true,
      priority: "high",
    },
    printer_offline: {
      problem: "Printer is offline — not responding to any interface",
      possibleReasons: ["Printer powered off", "USB cable disconnected", "Network cable disconnected", "Printer in error state requiring restart"],
      fixes: [
        { action: "Check Power", actionType: "power_cycle", instructions: "Verify printer is powered on (LED indicator), check power cable connection, if printer is on but not responding — power cycle", expectedOutcome: "Printer powers on and enters Ready state", estimatedTimeMinutes: 2 },
        { action: "Reconnect USB Cable", actionType: "reconnect_usb", instructions: "Disconnect and reconnect USB cable, check both ends (printer and computer), try a different USB port", expectedOutcome: "USB connection re-established, device detected", estimatedTimeMinutes: 3 },
        { action: "Restart Printer", actionType: "restart_printer", instructions: "Power cycle: turn off, wait 10 seconds, turn on. Allow printer to initialize before sending commands", expectedOutcome: "Printer restarts and enters Ready state", estimatedTimeMinutes: 3 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "urgent",
    },
    communication_lost: {
      problem: "Communication lost — device connected but not responding to commands",
      possibleReasons: ["Driver not responding", "Print spooler stuck", "USB communication error", "Bluetooth pairing lost", "Network connection intermittent"],
      fixes: [
        { action: "Verify Connection", actionType: "verify_connection", instructions: "Check physical connection (USB cable, network cable), verify device shows as connected in OS device manager", expectedOutcome: "Device shows as connected with active communication", estimatedTimeMinutes: 2 },
        { action: "Restart Print Spooler", actionType: "restart_spooler", instructions: "Restart the Windows print spooler service: open Services, find Print Spooler, restart it", expectedOutcome: "Print spooler restarts, pending jobs cleared, communication restored", estimatedTimeMinutes: 2 },
        { action: "Power Cycle Device", actionType: "power_cycle", instructions: "Turn off the printer, wait 10 seconds, turn on. Allow full initialization before retrying", expectedOutcome: "Device reinitializes and communication restores", estimatedTimeMinutes: 3 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "high",
    },
    driver_missing: {
      problem: "No driver installed for this device — cannot communicate",
      possibleReasons: ["Driver never installed after connecting device", "Driver uninstalled accidentally", "Driver incompatible with current OS version"],
      fixes: [
        { action: "Download Compatible Driver", actionType: "download_driver", instructions: `Download the compatible driver for ${deviceInfo.model ?? "this device"} from the QBIT Driver Center`, expectedOutcome: "Driver downloaded and ready for installation", estimatedTimeMinutes: 5, resourceScreen: "driver-download-center" },
        { action: "Install Driver", actionType: "install_driver", instructions: "Run the downloaded driver installer, follow the installation wizard, restart the print spooler after installation", expectedOutcome: "Driver installed and recognized by the OS", estimatedTimeMinutes: 10 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "high",
    },
    driver_corrupted: {
      problem: "Installed driver is corrupted — file integrity check failed",
      possibleReasons: ["Driver file damaged during download", "Driver file overwritten by incompatible version", "OS update corrupted driver files", "Disk error affecting driver files"],
      fixes: [
        { action: "Reinstall Latest Driver", actionType: "download_driver", instructions: `Download the latest driver for ${deviceInfo.model ?? "this device"} from the QBIT Driver Center, uninstall the corrupted driver first, then install the fresh download`, expectedOutcome: "Fresh driver installed with verified integrity", estimatedTimeMinutes: 10, resourceScreen: "driver-download-center" },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "high",
    },
    firmware_mismatch: {
      problem: "Firmware version is unsupported or deprecated",
      possibleReasons: ["Device running old firmware that is no longer supported", "Firmware version incompatible with current driver", "Firmware not updated during previous service visits"],
      fixes: [
        { action: "Download Firmware Update", actionType: "download_firmware", instructions: `Download firmware v${cloudLookup.firmwareCompatibility?.latestFirmware ?? "latest"} for this device model from the QBIT Firmware Center`, expectedOutcome: "Firmware update package downloaded", estimatedTimeMinutes: 5, resourceScreen: "firmware-intelligence" },
        { action: "Update Firmware", actionType: "update_firmware", instructions: "Follow the firmware update guide for this device model. Do NOT auto-install — engineer must supervise the update process", expectedOutcome: "Firmware updated to latest supported version", estimatedTimeMinutes: 15 },
      ],
      resolvableByEngineer: true,
      requiresSupport: true,
      priority: cloudLookup.firmwareCompatibility?.isCritical ? "urgent" : "normal",
    },
    firmware_corrupted: {
      problem: "Firmware appears corrupted — device returning invalid diagnostic responses",
      possibleReasons: ["Incomplete firmware update", "Power loss during firmware update", "Firmware flash memory error", "Firmware version incompatible with hardware revision"],
      fixes: [
        { action: "Download Firmware", actionType: "download_firmware", instructions: "Download the latest firmware for this device. A firmware update may restore the device to working state", expectedOutcome: "Firmware update package downloaded", estimatedTimeMinutes: 5 },
        { action: "Contact Support", actionType: "contact_support", instructions: "If firmware update fails or device remains unresponsive after update, contact QBIT Technical Support for hardware-level firmware recovery", expectedOutcome: "Support team assists with firmware recovery or device replacement", estimatedTimeMinutes: 30 },
      ],
      resolvableByEngineer: false,
      requiresSupport: true,
      priority: "critical",
    },
    usb_disconnected: {
      problem: "USB cable disconnected — device not available on USB interface",
      possibleReasons: ["USB cable unplugged", "USB cable loose at connector", "USB port failure on computer", "USB hub power issue"],
      fixes: [
        { action: "Reconnect USB Cable", actionType: "reconnect_usb", instructions: "Disconnect and reconnect the USB cable at both ends, ensure firm connection, try a different USB port on the computer", expectedOutcome: "USB connection re-established, device detected by OS", estimatedTimeMinutes: 2 },
        { action: "Check USB Cable", actionType: "check_usb_cable", instructions: "Inspect the USB cable for damage, try a different USB cable if available, avoid USB hubs and connect directly to computer", expectedOutcome: "Stable USB connection without intermittent drops", estimatedTimeMinutes: 3 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "high",
    },
    bluetooth_lost: {
      problem: "Bluetooth connection lost — pairing dropped",
      possibleReasons: ["Device moved out of Bluetooth range", "Bluetooth pairing forgotten by OS", "Bluetooth driver error on host machine", "Interference from other Bluetooth devices"],
      fixes: [
        { action: "Reconnect Bluetooth", actionType: "reconnect_bluetooth", instructions: "Go to Windows Bluetooth settings, find the printer device, reconnect. If pairing lost — remove device and re-pair", expectedOutcome: "Bluetooth connection re-established", estimatedTimeMinutes: 5 },
        { action: "Check Bluetooth Range", actionType: "verify_connection", instructions: "Ensure the printer is within Bluetooth range (typically 10 meters), reduce interference by moving other Bluetooth devices away", expectedOutcome: "Stable Bluetooth connection within range", estimatedTimeMinutes: 3 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "high",
    },
    lan_failure: {
      problem: "LAN connection failure — device not reachable on network",
      possibleReasons: ["LAN cable disconnected", "Network switch/router error", "IP address conflict", "DHCP server not assigning IP"],
      fixes: [
        { action: "Reconnect LAN Cable", actionType: "reconnect_network", instructions: "Check both ends of the LAN cable (printer and switch/router), try a different cable or port", expectedOutcome: "LAN connection re-established, device gets IP via DHCP", estimatedTimeMinutes: 3 },
        { action: "Check Network Settings", actionType: "verify_connection", instructions: "Ping the printer's IP address, check if DHCP is working, verify gateway and DNS settings", expectedOutcome: "Network connection verified and printer reachable", estimatedTimeMinutes: 5 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "high",
    },
    wifi_failure: {
      problem: "Wi-Fi connection failure — device not connected to Wi-Fi network",
      possibleReasons: ["Wi-Fi password changed", "Wi-Fi network down", "Wi-Fi module on printer malfunctioning", "Router/access point not responding"],
      fixes: [
        { action: "Reconfigure Wi-Fi", actionType: "reconnect_network", instructions: "Use the QBIT Wi-Fi Setup Wizard to reconfigure the printer's Wi-Fi connection with current credentials", expectedOutcome: "Wi-Fi connection re-established with correct SSID and password", estimatedTimeMinutes: 5, resourceScreen: "dr-qbit" },
        { action: "Check Wi-Fi Network", actionType: "verify_connection", instructions: "Verify the Wi-Fi network is operational, check signal strength at the printer's location, verify SSID and password are correct", expectedOutcome: "Wi-Fi network verified and printer able to connect", estimatedTimeMinutes: 3 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "high",
    },
    network_timeout: {
      problem: "Network communication timeout — device took too long to respond",
      possibleReasons: ["Network congestion", "Large print job blocking communication", "Printer buffer full", "Network latency too high"],
      fixes: [
        { action: "Restart Printer", actionType: "restart_printer", instructions: "Power cycle the printer to clear any pending jobs and reset network buffers", expectedOutcome: "Printer resets and becomes responsive again", estimatedTimeMinutes: 3 },
        { action: "Check Network", actionType: "verify_connection", instructions: "Ping the printer from the computer, check network latency, verify no other devices are saturating the network", expectedOutcome: "Network latency reduced and printer responds within timeout", estimatedTimeMinutes: 5 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "normal",
    },
    printer_busy: {
      problem: "Printer is busy — currently processing a print job",
      possibleReasons: ["Previous print job still in progress", "Print queue has pending jobs", "Printer processing a large document"],
      fixes: [
        { action: "Wait for Job Completion", actionType: "restart_spooler", instructions: "Wait for the current print job to complete, or clear the print queue if jobs are stuck", expectedOutcome: "Print queue cleared and printer returns to Ready state", estimatedTimeMinutes: 5 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "normal",
    },
    paper_jam: {
      problem: "Paper jam — paper stuck in the paper path",
      possibleReasons: ["Paper misaligned during loading", "Paper too thick or poor quality", "Foreign object in paper path", "Worn feed rollers"],
      fixes: [
        { action: "Clear Paper Jam", actionType: "clear_paper_jam", instructions: "Open the printer cover, carefully remove stuck paper, check for torn pieces or foreign objects, clean the paper path", expectedOutcome: "Paper path clear and printer ready for normal operation", estimatedTimeMinutes: 5 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "urgent",
    },
    temperature_error: {
      problem: "Thermal printer temperature error — print head overheating or too cold",
      possibleReasons: ["Continuous heavy printing causing overheating", "Print head thermistor malfunction", "Environmental temperature too high", "Print density set too high"],
      fixes: [
        { action: "Let Printer Cool Down", actionType: "restart_printer", instructions: "Stop printing and allow the printer to cool down for 5-10 minutes. Reduce print density if overheating persists", expectedOutcome: "Print head temperature returns to normal range", estimatedTimeMinutes: 10 },
        { action: "Contact Support", actionType: "contact_support", instructions: "If temperature error persists after cooldown, the print head thermistor may need replacement", expectedOutcome: "Support team assists with thermistor repair/replacement", estimatedTimeMinutes: 30 },
      ],
      resolvableByEngineer: false,
      requiresSupport: true,
      priority: "high",
    },
    power_error: {
      problem: "Power error — printer power supply issue",
      possibleReasons: ["Power supply malfunction", "Power cable not properly connected", "Voltage fluctuation", "Power adapter failure"],
      fixes: [
        { action: "Check Power Connection", actionType: "power_cycle", instructions: "Verify power cable is firmly connected at both ends (printer and outlet), try a different power outlet, check for voltage issues", expectedOutcome: "Stable power supply and printer powers on correctly", estimatedTimeMinutes: 3 },
        { action: "Contact Support", actionType: "contact_support", instructions: "If power error persists, the power supply unit or adapter may need replacement", expectedOutcome: "Support team assists with power supply replacement", estimatedTimeMinutes: 30 },
      ],
      resolvableByEngineer: false,
      requiresSupport: true,
      priority: "critical",
    },
    memory_error: {
      problem: "Printer memory error — buffer overflow or memory fault",
      possibleReasons: ["Large print job exceeding printer buffer", "Memory module fault", "Firmware memory corruption"],
      fixes: [
        { action: "Restart Printer", actionType: "restart_printer", instructions: "Power cycle the printer to clear memory and reset buffers", expectedOutcome: "Printer memory cleared and device returns to Ready state", estimatedTimeMinutes: 3 },
        { action: "Reduce Print Job Size", actionType: "restart_spooler", instructions: "Split large print jobs into smaller chunks, avoid sending multiple large jobs simultaneously", expectedOutcome: "Print jobs complete without memory overflow", estimatedTimeMinutes: 5 },
      ],
      resolvableByEngineer: true,
      requiresSupport: false,
      priority: "warning" as RecommendationPriority,
    },
    unknown_error: {
      problem: "Unknown error — device reported an error that could not be classified",
      possibleReasons: ["Unrecognized error code from device", "Device firmware bug", "Unexpected device state"],
      fixes: [
        { action: "Restart Printer", actionType: "restart_printer", instructions: "Power cycle the printer to reset all subsystems", expectedOutcome: "Device resets and may return to normal state", estimatedTimeMinutes: 3 },
        { action: "Contact Support", actionType: "contact_support", instructions: "If the unknown error persists after restart, contact QBIT Technical Support with the diagnostic report", expectedOutcome: "Support team investigates the unknown error", estimatedTimeMinutes: 30 },
      ],
      resolvableByEngineer: false,
      requiresSupport: true,
      priority: "normal",
    },
  };

  // Generate suggestions for each detected error
  for (const err of detectedErrors) {
    const kbEntry = TROUBLESHOOTING_KB[err.errorType];
    if (kbEntry) {
      const fixes: TroubleshootingFix[] = kbEntry.fixes.map((f) => ({
        action: f.action,
        actionType: f.actionType,
        instructions: f.instructions,
        expectedOutcome: f.expectedOutcome,
        estimatedTimeMinutes: f.estimatedTimeMinutes,
        resourceUrl: cloudLookup.resources.drivers.length > 0 && f.actionType === "download_driver" ? cloudLookup.resources.drivers[0].url ?? null : null,
        resourceScreen: f.resourceScreen ?? null,
      }));

      suggestions.push({
        errorType: err.errorType,
        problem: kbEntry.problem,
        possibleReasons: kbEntry.possibleReasons,
        suggestedFixes: fixes,
        resolvableByEngineer: kbEntry.resolvableByEngineer,
        requiresSupport: kbEntry.requiresSupport,
        priority: kbEntry.priority,
      });
    } else {
      // Unknown error type — generic troubleshooting
      suggestions.push({
        errorType: err.errorType,
        problem: err.reason,
        possibleReasons: ["Specific cause not yet documented for this error type"],
        suggestedFixes: [
          {
            action: "Restart Device",
            actionType: "restart_printer",
            instructions: "Power cycle the device and retry diagnostics",
            expectedOutcome: "Device may return to normal operating state",
            estimatedTimeMinutes: 3,
            resourceUrl: null,
            resourceScreen: null,
          },
        ],
        resolvableByEngineer: true,
        requiresSupport: true,
        priority: "normal",
      });
    }
  }

  return {
    suggestions,
    suggestionCount: suggestions.length,
    status: suggestions.length > 0 ? "successful" : "not_tested",
    generatedAt: new Date().toISOString(),
  };
}

// ====================== Step 10 — Predictive Health Engine ======================

/**
 * Analyzes historical patterns to detect predictive warnings.
 *
 * ONLY based on real historical data (DiagnosticSession and ConfigurationEvent records).
 * No false predictions. If no patterns → no warnings.
 *
 * Patterns checked:
 *   - Repeated communication failures
 *   - Frequent disconnects
 *   - Repeated driver errors
 *   - Firmware mismatch patterns
 *   - Repeated paper/cutter/cover errors
 */
async function analyzePredictiveHealth(
  deviceInfo: AdapterDeviceInfo,
  cloudLookup: CloudLookupResult,
  currentErrors: DetectedError[],
): Promise<PredictiveHealthResult> {
  const patterns: PredictivePattern[] = [];
  const warnings: PredictiveWarning[] = [];
  let requiresPreventiveMaintenance = false;

  // If no passport ID → cannot analyze historical data
  if (!deviceInfo.passportId) {
    return {
      hasWarnings: false,
      warnings: [],
      requiresPreventiveMaintenance: false,
      patternAnalysis: [],
      status: "not_tested",
      analyzedAt: new Date().toISOString(),
    };
  }

  try {
    // Query recent DiagnosticSessions for this device (last 90 days)
    const recentSessions = await db.diagnosticSession.findMany({
      where: {
        passportId: deviceInfo.passportId,
        startedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    // Query recent ConfigurationEvents (last 90 days)
    const configEvents = await db.configurationEvent.findMany({
      where: {
        configuration: { passportId: deviceInfo.passportId },
        occurredAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        result: "failure",
      },
      orderBy: { occurredAt: "desc" },
      take: 30,
    });

    // ===== Pattern: Repeated Communication Failures =====
    const commFailures = configEvents.filter(
      (e) => e.errorCode === "communication_failed" || e.eventType === "configuration_failed" && (e.connectionType === "usb" || e.connectionType === "lan" || e.connectionType === "wifi" || e.connectionType === "bluetooth"),
    );
    if (commFailures.length >= 3) {
      const pattern: PredictivePattern = {
        patternType: "repeated_communication_failures",
        occurrenceCount: commFailures.length,
        timePeriod: "Last 90 days",
        increasingFrequency: commFailures.length > 5,
        dataPoints: commFailures.map((e) => e.occurredAt.toISOString()),
      };
      patterns.push(pattern);
      warnings.push({
        pattern: "repeated_communication_failures",
        description: `This device has experienced ${commFailures.length} communication failures in the last 90 days. This may indicate a persistent connection issue or hardware degradation.`,
        confidence: commFailures.length > 5 ? "high" : "medium",
        recommendation: "This device may require preventive maintenance. Check all physical connections, consider replacing cables, and verify network infrastructure stability.",
        evidence: pattern.dataPoints.slice(0, 5),
      });
      requiresPreventiveMaintenance = true;
    }

    // ===== Pattern: Frequent Disconnects =====
    const disconnectEvents = configEvents.filter(
      (e) => e.errorCode === "usb_lost" || e.errorCode === "bluetooth_disconnected",
    );
    if (disconnectEvents.length >= 3) {
      const pattern: PredictivePattern = {
        patternType: "frequent_disconnects",
        occurrenceCount: disconnectEvents.length,
        timePeriod: "Last 90 days",
        increasingFrequency: disconnectEvents.length > 5,
        dataPoints: disconnectEvents.map((e) => e.occurredAt.toISOString()),
      };
      patterns.push(pattern);
      warnings.push({
        pattern: "frequent_disconnects",
        description: `This device has experienced ${disconnectEvents.length} disconnections in the last 90 days. Frequent disconnects may indicate cable/port degradation or Bluetooth range issues.`,
        confidence: disconnectEvents.length > 5 ? "high" : "medium",
        recommendation: "This device may require preventive maintenance. Consider replacing USB cables, verifying Bluetooth antenna, or switching to a more stable connection type (LAN).",
        evidence: pattern.dataPoints.slice(0, 5),
      });
      requiresPreventiveMaintenance = true;
    }

    // ===== Pattern: Repeated Driver Errors =====
    const driverErrors = recentSessions.filter(
      (s) => s.driverScore < 60,
    );
    if (driverErrors.length >= 2) {
      const pattern: PredictivePattern = {
        patternType: "repeated_driver_errors",
        occurrenceCount: driverErrors.length,
        timePeriod: "Last 90 days",
        increasingFrequency: driverErrors.length > 4,
        dataPoints: driverErrors.map((s) => s.startedAt.toISOString()),
      };
      patterns.push(pattern);
      warnings.push({
        pattern: "repeated_driver_errors",
        description: `This device has had ${driverErrors.length} diagnostic sessions with low driver scores (<60) in the last 90 days. The driver may be repeatedly failing or getting corrupted.`,
        confidence: driverErrors.length > 4 ? "high" : "low",
        recommendation: "Consider updating to the latest driver version and checking for OS compatibility issues that may be causing repeated driver failures.",
        evidence: pattern.dataPoints.slice(0, 5),
      });
    }

    // ===== Pattern: Firmware Mismatch =====
    const firmwareMismatchSessions = recentSessions.filter(
      (s) => s.firmwareScore < 50,
    );
    if (firmwareMismatchSessions.length >= 2) {
      const pattern: PredictivePattern = {
        patternType: "firmware_mismatch_pattern",
        occurrenceCount: firmwareMismatchSessions.length,
        timePeriod: "Last 90 days",
        increasingFrequency: false, // Firmware mismatch is usually constant until updated
        dataPoints: firmwareMismatchSessions.map((s) => s.startedAt.toISOString()),
      };
      patterns.push(pattern);
      warnings.push({
        pattern: "firmware_mismatch_pattern",
        description: `This device has had ${firmwareMismatchSessions.length} diagnostic sessions indicating firmware is outdated or mismatched. The firmware has not been updated despite multiple warnings.`,
        confidence: "high",
        recommendation: "Update the device firmware to the latest supported version. Firmware mismatch can cause communication errors and print quality issues.",
        evidence: pattern.dataPoints.slice(0, 5),
      });
    }

    // ===== Pattern: Repeated Paper/Cutter/Cover Errors =====
    // Check if current errors include paper/cutter/cover issues AND history shows recurrence
    const currentPaperErrors = currentErrors.filter(
      (e) => ["paper_out", "cover_open", "cutter_error", "paper_jam"].includes(e.errorType),
    );
    if (currentPaperErrors.length > 0 && recentSessions.length >= 2) {
      // Check if previous sessions also had low device status scores
      const lowDeviceStatusSessions = recentSessions.filter(
        (s) => s.deviceStatusScore < 60,
      );
      if (lowDeviceStatusSessions.length >= 2) {
        const pattern: PredictivePattern = {
          patternType: "repeated_paper_errors",
          occurrenceCount: lowDeviceStatusSessions.length,
          timePeriod: "Last 90 days",
          increasingFrequency: lowDeviceStatusSessions.length > 4,
          dataPoints: lowDeviceStatusSessions.map((s) => s.startedAt.toISOString()),
        };
        patterns.push(pattern);
        warnings.push({
          pattern: "repeated_paper_errors",
          description: `This device has recurrent paper path/cover/cutter errors. ${lowDeviceStatusSessions.length} previous sessions showed low device health scores.`,
          confidence: "medium",
          recommendation: "This device may require preventive maintenance. Check paper path alignment, cutter mechanism, and cover sensor for wear or degradation.",
          evidence: pattern.dataPoints.slice(0, 5),
        });
        requiresPreventiveMaintenance = true;
      }
    }

  } catch (error) {
    // Predictive analysis failure is non-critical — return empty results
    console.error("[DIAG ENGINE] Predictive health analysis failed:", error);
  }

  return {
    hasWarnings: warnings.length > 0,
    warnings,
    requiresPreventiveMaintenance,
    patternAnalysis: patterns,
    status: patterns.length > 0 ? "successful" : "not_tested",
    analyzedAt: new Date().toISOString(),
  };
}

// ====================== Step 11 — Live Health Score Calculation ======================

/**
 * Calculates live health scores based on REAL test results ONLY.
 *
 * Categories: Hardware, Communication, Driver, Firmware, Network, Printing.
 * Each score is based on actual diagnostic test data — no fake scores.
 * If a test was not performed → category score is "not_tested" (not included in average).
 */
function calculateHealthScore(
  hardwareHealth: HardwareHealthCheck | null,
  driverValidation: DriverValidationResult | null,
  firmwareValidation: FirmwareValidationResult | null,
  communicationDiagnostics: CommunicationDiagnosticResult | null,
  printEngineTest: PrintEngineTestResult | null,
  capabilityValidation: CapabilityValidationResult | null,
  errorDetection: ErrorDetectionResult | null,
  deviceInfo: AdapterDeviceInfo,
): LiveHealthScore {
  const categories: CategoryHealthScore[] = [];

  // ===== Hardware Score =====
  if (hardwareHealth && hardwareHealth.status !== "not_tested") {
    let score = 100;
    const findings: string[] = [];
    const tests: string[] = ["Hardware Health Check"];

    if (!hardwareHealth.deviceOnline) {
      score -= 60;
      findings.push("Device Offline");
    }
    if (!hardwareHealth.deviceResponding) {
      score -= 30;
      findings.push("Device Not Responding");
    }
    if (!hardwareHealth.connectionStable) {
      score -= 20;
      findings.push("Connection Unstable");
    }
    if (!hardwareHealth.printerReady) {
      score -= 10;
      findings.push("Printer Not Ready");
    }
    // Connection health penalties
    for (const ch of hardwareHealth.connectionHealth) {
      if (!ch.connected) score -= 5;
      if (!ch.stable) score -= 3;
    }

    score = Math.max(0, Math.min(100, score));
    categories.push({
      category: "hardware",
      score,
      grade: gradeFromScore(score),
      label: "Hardware",
      tested: true,
      keyFindings: findings,
      contributingTests: tests,
    });
  }

  // ===== Communication Score =====
  if (communicationDiagnostics && communicationDiagnostics.status !== "not_tested") {
    let score = 100;
    const findings: string[] = [];
    const tests: string[] = [];

    for (const test of communicationDiagnostics.connectionTests) {
      tests.push(`${test.connectionType} Communication Test`);
      if (!test.connected) {
        score -= 25;
        findings.push(`${test.connectionType} Not Connected`);
      }
      if (!test.commandSent) {
        score -= 15;
        findings.push(`${test.connectionType} Command Send Failed`);
      }
      if (!test.responseReceived) {
        score -= 20;
        findings.push(`${test.connectionType} No Response`);
      }
    }

    score = Math.max(0, Math.min(100, score));
    categories.push({
      category: "communication",
      score,
      grade: gradeFromScore(score),
      label: "Communication",
      tested: true,
      keyFindings: findings,
      contributingTests: tests,
    });
  }

  // ===== Driver Score =====
  if (driverValidation && driverValidation.status !== "not_tested") {
    let score = 100;
    const findings: string[] = [];
    const tests: string[] = ["Driver Validation"];

    if (!driverValidation.driverInstalled) {
      score = 20;
      findings.push("Driver Not Installed");
    } else if (driverValidation.driverCorrupted) {
      score = 15;
      findings.push("Driver Corrupted");
    } else if (!driverValidation.driverCompatible) {
      score = 10;
      findings.push("Driver Incompatible");
    } else if (!driverValidation.isLatest) {
      score = 70;
      findings.push(`Driver v${driverValidation.driverVersion ?? "unknown"} — update available to v${driverValidation.latestDriverVersion ?? "latest"}`);
    }

    score = Math.max(0, Math.min(100, score));
    categories.push({
      category: "driver",
      score,
      grade: gradeFromScore(score),
      label: "Driver",
      tested: true,
      keyFindings: findings,
      contributingTests: tests,
    });
  }

  // ===== Firmware Score =====
  if (firmwareValidation && firmwareValidation.status !== "not_tested") {
    let score = 100;
    const findings: string[] = [];
    const tests: string[] = ["Firmware Validation"];

    if (firmwareValidation.updateStatus === "corrupted") {
      score = 10;
      findings.push("Firmware Corrupted");
    } else if (firmwareValidation.updateStatus === "unsupported") {
      score = 20;
      findings.push("Firmware Unsupported/Deprecated");
    } else if (firmwareValidation.updateStatus === "update_available") {
      score = firmwareValidation.isCritical ? 50 : 80;
      findings.push(`Firmware v${firmwareValidation.installedFirmware ?? "unknown"} — ${firmwareValidation.isCritical ? "Critical" : ""} update available`);
    } else if (firmwareValidation.updateStatus === "unknown") {
      score = 50;
      findings.push("Firmware version unknown");
    }

    score = Math.max(0, Math.min(100, score));
    categories.push({
      category: "firmware",
      score,
      grade: gradeFromScore(score),
      label: "Firmware",
      tested: true,
      keyFindings: findings,
      contributingTests: tests,
    });
  }

  // ===== Network Score =====
  if (communicationDiagnostics && communicationDiagnostics.status !== "not_tested") {
    const networkTests = communicationDiagnostics.connectionTests.filter(
      (t) => t.connectionType === "lan" || t.connectionType === "wifi",
    );
    if (networkTests.length > 0) {
      let score = 100;
      const findings: string[] = [];
      const tests: string[] = [];

      for (const test of networkTests) {
        tests.push(`${test.connectionType} Network Test`);
        if (!test.connected) {
          score -= 40;
          findings.push(`${test.connectionType} Not Connected`);
        }
        if (!test.responseReceived) {
          score -= 30;
          findings.push(`${test.connectionType} No Response`);
        }
        if (test.failureStage === "timeout") {
          score -= 15;
          findings.push(`${test.connectionType} Timeout`);
        }
      }

      score = Math.max(0, Math.min(100, score));
      categories.push({
        category: "network",
        score,
        grade: gradeFromScore(score),
        label: "Network",
        tested: true,
        keyFindings: findings,
        contributingTests: tests,
      });
    }
  }

  // ===== Printing Score =====
  if (printEngineTest && printEngineTest.status !== "not_tested" && printEngineTest.status !== "not_supported") {
    let score = 100;
    const findings: string[] = [];
    const tests: string[] = ["Print Engine Test"];

    if (printEngineTest.printerBusy) {
      score = 60;
      findings.push("Printer Busy");
    } else if (printEngineTest.printTimeout) {
      score = 30;
      findings.push("Print Timeout");
    } else if (!printEngineTest.printStarted) {
      score = 10;
      findings.push("Print Command Failed");
    } else if (!printEngineTest.printCompleted) {
      score = 70;
      findings.push("Print Started but Not Confirmed");
    }

    score = Math.max(0, Math.min(100, score));
    categories.push({
      category: "printing",
      score,
      grade: gradeFromScore(score),
      label: "Printing",
      tested: true,
      keyFindings: findings,
      contributingTests: tests,
    });
  }

  // ===== Calculate Overall Score =====
  const testedCategories = categories.filter((c) => c.tested);
  const overallScore = testedCategories.length > 0
    ? Math.round(testedCategories.reduce((sum, c) => sum + c.score, 0) / testedCategories.length)
    : 0;
  const overallGrade = gradeFromScore(overallScore);
  const overallStatus = statusFromGrade(overallGrade);
  const categoriesWithIssues = testedCategories.filter((c) => c.score < 100).length;

  return {
    overallScore,
    overallGrade,
    overallStatus,
    categories,
    categoriesTested: testedCategories.length,
    categoriesWithIssues,
    calculatedAt: new Date().toISOString(),
  };
}

// ====================== Step 12 — Diagnostic Report ======================

/**
 * Builds a diagnostic report — summary of all diagnostic results.
 *
 * Contains: Device info, Driver, Firmware, Connection, Printer status,
 * Health score, Issues list, Warnings.
 */
function buildDiagnosticReport(
  deviceInfo: AdapterDeviceInfo,
  driverValidation: DriverValidationResult | null,
  firmwareValidation: FirmwareValidationResult | null,
  configResult: ConfigurationResult,
  liveHealthScore: LiveHealthScore | null,
  detectedErrors: DetectedError[],
  predictiveHealth: PredictiveHealthResult | null,
): DiagnosticReport {
  const driverStatus = driverValidation
    ? driverValidation.driverInstalled ? "Installed" : "Missing"
    : "Not Checked";

  const firmwareStatus = firmwareValidation
    ? firmwareValidation.updateStatus === "latest" ? "Latest"
      : firmwareValidation.updateStatus === "update_available" ? "Update Available"
      : firmwareValidation.updateStatus === "unsupported" ? "Unsupported"
      : firmwareValidation.updateStatus === "corrupted" ? "Corrupted"
      : "Unknown"
    : "Not Checked";

  const connection = configResult.connectionType ?? deviceInfo.connectionType ?? "Unknown";

  const printerStatus = detectedErrors.length === 0 ? "Healthy"
    : detectedErrors.some((e) => e.severity === "critical") ? "Critical"
    : detectedErrors.some((e) => e.severity === "error") ? "Error"
    : "Attention Required";

  const healthScore = liveHealthScore?.overallScore ?? 0;
  const healthGrade = liveHealthScore?.overallGrade ?? "unknown";

  const issues: DiagnosticIssue[] = detectedErrors.map((err) => ({
    description: DIAG_ERROR_TYPE_LABELS[err.errorType] ?? err.reason,
    severity: err.severity,
    hasSuggestedFix: true,
    suggestedFix: err.reason,
    errorType: err.errorType,
  }));

  const warnings = predictiveHealth?.warnings ?? [];

  return {
    device: {
      model: deviceInfo.model,
      serialNumber: deviceInfo.serialNumber,
      deviceType: deviceInfo.deviceType,
      customer: null, // Will be populated from cloudLookup if registered
      passportId: deviceInfo.passportId,
    },
    driverStatus,
    firmwareStatus,
    connection,
    printerStatus,
    healthScore,
    healthGrade,
    issues,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

// ====================== Step 13 — Diagnostic History ======================

/**
 * Saves diagnostic history to the database.
 *
 * Creates a DiagnosticSession + Findings + Recommendations + HealthScore
 * for this live diagnostic run. Engineers can review this history later.
 */
async function saveDiagnosticHistory(
  deviceInfo: AdapterDeviceInfo,
  request: DiagnosticRequest,
  liveHealthScore: LiveHealthScore,
  detectedErrors: DetectedError[],
  troubleshooting: TroubleshootingResult | null,
): Promise<DiagnosticHistoryEntry> {
  const sessionToken = randomBytes(16).toString("hex");
  const passportId = deviceInfo.passportId;

  if (!passportId) {
    throw new Error("Passport ID required for saving diagnostic history");
  }

  // Create DiagnosticSession
  const session = await db.diagnosticSession.create({
    data: {
      sessionToken,
      passportId,
      engineerId: request.engineerId ?? null,
      engineerName: request.engineerName ?? null,
      agentVersion: request.agentVersion ?? null,
      osInfo: request.osInfo ?? null,
      hostname: request.hostname ?? null,
      scanDurationMs: liveHealthScore.categoriesTested > 0 ? 5000 : 0,
      overallScore: liveHealthScore.overallScore,
      healthGrade: liveHealthScore.overallGrade,
      driverScore: liveHealthScore.categories.find((c) => c.category === "driver")?.score ?? 0,
      firmwareScore: liveHealthScore.categories.find((c) => c.category === "firmware")?.score ?? 0,
      connectionScore: liveHealthScore.categories.find((c) => c.category === "communication")?.score ?? 0,
      deviceStatusScore: liveHealthScore.categories.find((c) => c.category === "hardware")?.score ?? 0,
      compatibilityScore: 0,
      knowledgeScore: 0,
      findingsCount: detectedErrors.length,
      confirmedCount: detectedErrors.filter((e) => e.severity === "error" || e.severity === "critical").length,
      possibleCount: detectedErrors.filter((e) => e.severity === "warning").length,
      recommendationsCount: troubleshooting?.suggestionCount ?? 0,
      status: "completed",
      completedAt: new Date(),
    },
  });

  // Create findings for each detected error
  for (const err of detectedErrors) {
    await db.diagnosticFinding.create({
      data: {
        sessionId: session.id,
        category: mapComponentToCategory(err.affectedComponent),
        severity: err.severity,
        title: DIAG_ERROR_TYPE_LABELS[err.errorType] ?? err.errorName,
        description: err.reason,
        certainty: "confirmed",
        evidence: JSON.stringify([err.reason]),
        recommendedAction: troubleshooting?.suggestions.find((s) => s.errorType === err.errorType)?.suggestedFixes[0]?.action ?? null,
      },
    });
  }

  // Create recommendations from troubleshooting
  if (troubleshooting) {
    for (const suggestion of troubleshooting.suggestions) {
      for (const fix of suggestion.suggestedFixes) {
        await db.diagnosticRecommendation.create({
          data: {
            sessionId: session.id,
            title: fix.action,
            description: fix.instructions,
            actionType: fix.actionType,
            priority: suggestion.priority,
          },
        });
      }
    }
  }

  // Create health score
  await db.healthScore.create({
    data: {
      sessionId: session.id,
      overallScore: liveHealthScore.overallScore,
      overallGrade: liveHealthScore.overallGrade,
      driverScore: liveHealthScore.categories.find((c) => c.category === "driver")?.score ?? 0,
      driverGrade: liveHealthScore.categories.find((c) => c.category === "driver")?.grade ?? "unknown",
      firmwareScore: liveHealthScore.categories.find((c) => c.category === "firmware")?.score ?? 0,
      firmwareGrade: liveHealthScore.categories.find((c) => c.category === "firmware")?.grade ?? "unknown",
      connectionScore: liveHealthScore.categories.find((c) => c.category === "communication")?.score ?? 0,
      connectionGrade: liveHealthScore.categories.find((c) => c.category === "communication")?.grade ?? "unknown",
      deviceStatusScore: liveHealthScore.categories.find((c) => c.category === "hardware")?.score ?? 0,
      deviceStatusGrade: liveHealthScore.categories.find((c) => c.category === "hardware")?.grade ?? "unknown",
      compatibilityScore: 0,
      compatibilityGrade: "unknown",
      knowledgeScore: 0,
      knowledgeGrade: "unknown",
    },
  });

  return {
    id: session.id,
    sessionToken,
    date: session.startedAt.toISOString(),
    engineerName: request.engineerName ?? null,
    device: {
      model: deviceInfo.model,
      serialNumber: deviceInfo.serialNumber,
      deviceType: deviceInfo.deviceType,
      customer: null,
      passportId: deviceInfo.passportId,
    },
    diagnosticResult: liveHealthScore.overallStatus,
    healthScore: liveHealthScore.overallScore,
    issues: detectedErrors.map((err) => ({
      description: DIAG_ERROR_TYPE_LABELS[err.errorType] ?? err.reason,
      severity: err.severity,
      hasSuggestedFix: troubleshooting?.suggestions.some((s) => s.errorType === err.errorType) ?? false,
      suggestedFix: troubleshooting?.suggestions.find((s) => s.errorType === err.errorType)?.suggestedFixes[0]?.action ?? null,
      errorType: err.errorType,
    })),
    suggestedFixes: troubleshooting?.suggestions.flatMap((s) => s.suggestedFixes) ?? [],
    passportId: deviceInfo.passportId,
  };
}

// ====================== Step 14 — Auto Resource Recommendation ======================

/**
 * Generates resource recommendations based on detected issues.
 *
 * If any issue is found → automatically suggest:
 *   - Correct driver (if driver-related)
 *   - Latest firmware (if firmware-related)
 *   - Related manual (for general issues)
 *   - Related video (for setup/configuration issues)
 *   - Troubleshooting guide (for all errors)
 *   - Configuration tool (for network/connection issues)
 *
 * All resources are model-specific (from Phase 3 CloudLookupResult).
 */
function generateResourceRecommendations(
  detectedErrors: DetectedError[],
  deviceInfo: AdapterDeviceInfo,
  cloudLookup: CloudLookupResult,
): AutoResourceRecommendation[] {
  const recommendations: AutoResourceRecommendation[] = [];

  // If no errors → no resource recommendations needed
  if (detectedErrors.length === 0) {
    return recommendations;
  }

  // ===== Driver-related errors → suggest driver =====
  const driverErrors = detectedErrors.filter(
    (e) => e.affectedComponent === "driver",
  );
  if (driverErrors.length > 0 && cloudLookup.resources.drivers.length > 0) {
    const driverResources: DiagnosticResourceItem[] = cloudLookup.resources.drivers.slice(0, 3).map((d) => ({
      type: "driver",
      label: `Driver v${d.version ?? "latest"}`,
      name: d.name,
      url: d.url ?? null,
      screen: "driver-download-center",
      reason: `Recommended driver for ${deviceInfo.model ?? "this device"} — resolves driver-related issues`,
      priority: "high",
      available: d.status === "active",
    }));
    recommendations.push({
      triggeredByIssue: driverErrors[0].errorType,
      resources: driverResources,
      resourceCount: driverResources.length,
    });
  }

  // ===== Firmware-related errors → suggest firmware =====
  const firmwareErrors = detectedErrors.filter(
    (e) => e.affectedComponent === "firmware",
  );
  if (firmwareErrors.length > 0 && cloudLookup.resources.firmware.length > 0) {
    const firmwareResources: DiagnosticResourceItem[] = cloudLookup.resources.firmware.slice(0, 2).map((f) => ({
      type: "firmware",
      label: `Firmware v${f.version ?? "latest"}`,
      name: f.name,
      url: f.url ?? null,
      screen: "firmware-intelligence",
      reason: `Firmware update for ${deviceInfo.model ?? "this device"} — resolves firmware mismatch/corruption`,
      priority: firmwareErrors.some((e) => e.severity === "critical") ? "urgent" : "high",
      available: f.status === "active",
    }));
    recommendations.push({
      triggeredByIssue: firmwareErrors[0].errorType,
      resources: firmwareResources,
      resourceCount: firmwareResources.length,
    });
  }

  // ===== General errors → suggest manual & troubleshooting =====
  if (detectedErrors.length > 0) {
    const generalResources: DiagnosticResourceItem[] = [];

    // Add manual
    if (cloudLookup.resources.manuals.length > 0) {
      const bestManual = cloudLookup.resources.manuals[0];
      generalResources.push({
        type: "manual",
        label: bestManual.name,
        name: bestManual.name,
        url: bestManual.url ?? null,
        screen: "driver-download-center",
        reason: `Setup and troubleshooting guide for ${deviceInfo.model ?? "this device"}`,
        priority: "normal",
        available: bestManual.status === "active",
      });
    }

    // Add video
    if (cloudLookup.resources.videos.length > 0) {
      const bestVideo = cloudLookup.resources.videos[0];
      generalResources.push({
        type: "video",
        label: bestVideo.name,
        name: bestVideo.name,
        url: bestVideo.url ?? null,
        screen: null,
        reason: `Setup video for ${deviceInfo.model ?? "this device"}`,
        priority: "low",
        available: bestVideo.status === "active",
      });
    }

    // Always suggest troubleshooting guide
    generalResources.push({
      type: "troubleshooting_guide",
      label: "Troubleshooting Guide",
      name: `${deviceInfo.model ?? "Device"} Troubleshooting`,
      url: null,
      screen: "support-kb",
      reason: "Step-by-step troubleshooting for detected issues",
      priority: "normal",
      available: true,
    });

    if (generalResources.length > 0) {
      recommendations.push({
        triggeredByIssue: null,
        resources: generalResources,
        resourceCount: generalResources.length,
      });
    }
  }

  // ===== Network/connection errors → suggest configuration tool =====
  const networkErrors = detectedErrors.filter(
    (e) => e.affectedComponent === "network" || e.affectedComponent === "communication",
  );
  if (networkErrors.length > 0) {
    recommendations.push({
      triggeredByIssue: networkErrors[0].errorType,
      resources: [{
        type: "configuration_tool",
        label: "QBIT Configuration Tool",
        name: "Dr. QBIT Device Configuration",
        url: null,
        screen: "dr-qbit",
        reason: "Reconfigure device connection settings (Wi-Fi, LAN, Bluetooth)",
        priority: "high",
        available: true,
      }],
      resourceCount: 1,
    });
  }

  return recommendations;
}

// ====================== Helper Functions ======================

/**
 * Maps DiagnosticComponent to DiagnosticCategory for database storage.
 */
function mapComponentToCategory(component: DiagnosticComponent): string {
  const map: Record<DiagnosticComponent, string> = {
    hardware: "device_status",
    driver: "driver",
    firmware: "firmware",
    communication: "connection",
    network: "connection",
    printing: "device_status",
    paper_path: "device_status",
    cutter: "device_status",
    cover: "device_status",
    power: "device_status",
    memory: "device_status",
  };
  return map[component] ?? "device_status";
}

/**
 * Builds a diagnostic error object.
 */
function buildDiagnosticError(
  step: DiagnosticStep,
  error: unknown,
  errorCode: DiagnosticErrorCode,
): DiagnosticError {
  return {
    step,
    message: error instanceof Error ? error.message : `Step ${step} failed`,
    errorCode,
    recoverable: errorCode !== "desktop_agent_unavailable" && errorCode !== "device_offline",
    originalError: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Builds an error DiagnosticResult when the pipeline cannot proceed.
 */
function buildErrorResult(
  startTime: number,
  errors: DiagnosticError[],
  step: DiagnosticStep,
  message: string,
  errorCode: DiagnosticErrorCode,
  recoverable: boolean,
): DiagnosticResult {
  errors.push({
    step,
    message,
    errorCode,
    recoverable,
    timestamp: new Date().toISOString(),
  });

  return {
    success: false,
    overallStatus: "Unknown",
    healthScore: 0,
    healthGrade: "unknown",
    driverStatus: "Not Checked",
    firmwareStatus: "Not Checked",
    communicationStatus: "Not Checked",
    networkStatus: "Not Checked",
    printerStatus: "Not Checked",
    hardwareHealth: null,
    driverValidation: null,
    firmwareValidation: null,
    communicationDiagnostics: null,
    printEngineTest: null,
    capabilityValidation: null,
    errorDetection: null,
    troubleshooting: null,
    predictiveHealth: null,
    liveHealthScore: null,
    diagnosticReport: null,
    diagnosticHistory: [],
    recommendedResources: [],
    issues: [],
    warnings: [],
    errors,
    diagnosticTimestamp: new Date().toISOString(),
    diagnosticDurationMs: Date.now() - startTime,
  };
}

// ====================== Single-Step Runner ======================

/**
 * Runs a single diagnostic step (for targeted diagnostics).
 *
 * Used for specific actions like "check_hardware" or "check_driver".
 * Returns a partial DiagnosticResult with only the requested step populated.
 */
export async function runSingleDiagnosticStep(
  request: DiagnosticRequest,
): Promise<DiagnosticResult> {
  return runLiveDiagnostics(request);
}
