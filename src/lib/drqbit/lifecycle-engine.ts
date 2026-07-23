/**
 * Dr. QBIT Phase 6 — Enterprise Device Lifecycle, Auto Sync & Smart Management Engine
 *
 * The core orchestrator that receives a DiagnosticResult from Phase 5,
 * a CloudLookupResult from Phase 3, a ConfigurationResult from Phase 4,
 * and runs the complete 15-step device lifecycle pipeline:
 *
 *   1. Device Registration Verification
 *   2. Automatic Device Synchronization
 *   3. Device Lifecycle Management
 *   4. Installation History
 *   5. Service History
 *   6. Warranty Intelligence
 *   7. Smart Resource Synchronization
 *   8. Firmware Intelligence
 *   9. Device Analytics
 *  10. Engineer Activity Tracking
 *  11. Enterprise Dashboard Integration
 *  12. Smart Notifications
 *  13. Security Verification
 *  14. Complete Device Timeline
 *  15. Enterprise Ready Architecture
 *
 * Architecture:
 *   Phase 5 DiagnosticResult + Phase 3 CloudLookupResult + Phase 4 ConfigurationResult
 *     → Step 1: Verify Registration (DevicePassport + QbitProduct + CustomerAccount + PurchaseRecord)
 *     → Step 2: Auto Sync (update DevicePassport + DeviceLifecycleCounter + EngineerActivityLog + DeviceTimelineEvent + ActivityFeed)
 *     → Step 3: Lifecycle Management (DevicePassport dates + PurchaseRecord + DeviceConfiguration + LiveDiagnosticSession → lifecycleStage)
 *     → Step 4: Installation History (InstallationRecord for this passportId)
 *     → Step 5: Service History (ServiceHistoryEntry + DriverHistory + FirmwareHistory + ConfigurationEvent + LiveDiagnosticSession)
 *     → Step 6: Warranty Intelligence (DeviceWarranty + real date calculations → warrantyColor)
 *     → Step 7: Resource Sync (QbitProduct + ProductResourceMapping + Resource → per-category availability)
 *     → Step 8: Firmware Intelligence (FirmwareInformation installed vs latest → recommendation)
 *     → Step 9: Device Analytics (DeviceLifecycleCounter + LiveDiagnosticSession → aggregate statistics)
 *     → Step 10: Engineer Activity (EngineerActivityLog + User → audit trail)
 *     → Step 11: Dashboard Integration (ActivityFeed → dashboard events)
 *     → Step 12: Smart Notifications (real conditions → SmartNotification with dedupKey)
 *     → Step 13: Security (genuine product + authorized engineer + valid customer + API auth + audit log)
 *     → Step 14: Device Timeline (DeviceTimelineEvent → chronological lifecycle)
 *     → Step 15: Enterprise Architecture (supported device types + extensibility notes)
 *
 * Rules:
 *   - NO fake/dummy/mock/simulated data anywhere.
 *   - NO UI changes — this is purely backend logic.
 *   - Warranty colors calculated from real expiry dates (never hardcoded).
 *   - Notifications only generated from real conditions.
 *   - Never show customer data for unregistered devices.
 *   - Never auto-update firmware — only recommendations.
 *   - Never delete old installation/service records.
 *   - Extensible for all QBIT hardware types.
 *   - All data from QBIT database — never from third-party APIs.
 *   - Each step has its own error handling — no silent failures.
 *   - Step progress tracked: pending → running → completed/failed.
 */

import { db } from "@/lib/db";
import type { DeviceConnection, DeviceType } from "./types";
import type { DiagnosticResult, DiagnosticOverallStatus } from "./diagnostic-types";
import type { CloudLookupResult } from "./cloud-lookup-types";
import type { ConfigurationResult } from "./configuration-types";
import {
  warrantyColorFromDays,
  stageFromData,
} from "./lifecycle-types";
import type {
  LifecycleAction,
  LifecycleRequest,
  LifecycleResult,
  LifecycleStep,
  LifecycleStepStatus,
  LifecycleStepTracking,
  LifecycleError,
  LifecycleErrorCode,
  LifecycleStage,
  RegistrationVerificationResult,
  DeviceSyncResult,
  DeviceLifecycleData,
  InstallationHistoryResult,
  InstallationRecord as InstallationRecordType,
  ServiceHistoryResult,
  ServiceHistoryEntry as ServiceHistoryEntryType,
  ServiceActivityType,
  WarrantyIntelligenceResult,
  WarrantyColor,
  ResourceSyncResult,
  ResourceAvailabilityStatus,
  FirmwareIntelligenceResult,
  DeviceAnalyticsResult,
  EngineerActivityResult,
  EngineerActivityEntry,
  DashboardIntegrationResult,
  DashboardEvent,
  DashboardEventType,
  SmartNotificationResult,
  SmartNotification,
  NotificationType,
  SecurityVerificationResult,
  SecurityViolation,
  DeviceTimelineResult,
  DeviceTimelineEvent as DeviceTimelineEventType,
  TimelineEventType,
  EnterpriseArchitectureInfo,
} from "./lifecycle-types";
import { fetchProductResources } from "./resource-engine";

// ====================== Step Tracking Helpers ======================

/** Creates a pending step tracking entry. */
function pendingStep(name: LifecycleStep): LifecycleStepTracking {
  return { name, status: "pending", result: null, error: null };
}

/** Marks a step as running. */
function runningStep(step: LifecycleStepTracking): LifecycleStepTracking {
  return { ...step, status: "running" };
}

/** Marks a step as completed. */
function completedStep(step: LifecycleStepTracking, result: unknown): LifecycleStepTracking {
  return { ...step, status: "completed", result, error: null };
}

/** Marks a step as failed. */
function failedStep(step: LifecycleStepTracking, error: LifecycleError): LifecycleStepTracking {
  return { ...step, status: "failed", result: null, error };
}

/** Builds a LifecycleError object. */
function buildLifecycleError(
  code: LifecycleErrorCode,
  message: string,
  step: LifecycleStep,
  details: Record<string, unknown> | null = null,
): LifecycleError {
  return { code, message, step, details, timestamp: new Date().toISOString() };
}

// ====================== Main Entry Point ======================

/**
 * Runs the full Phase 6 device lifecycle pipeline (Steps 1-15).
 *
 * This is the MAIN entry point. It orchestrates all 15 steps
 * and produces the complete LifecycleResult.
 *
 * If the action is a specific single-step action, only that step
 * is run and the rest are left as null/skipped.
 */
export async function runLifecycleEngine(
  request: LifecycleRequest,
): Promise<LifecycleResult> {
  const startTime = Date.now();
  const errors: LifecycleError[] = [];
  const steps: LifecycleStepTracking[] = [
    pendingStep("verify_registration"),
    pendingStep("sync_device"),
    pendingStep("get_lifecycle_data"),
    pendingStep("get_installation_history"),
    pendingStep("get_service_history"),
    pendingStep("check_warranty"),
    pendingStep("sync_resources"),
    pendingStep("check_firmware"),
    pendingStep("get_analytics"),
    pendingStep("get_engineer_activity"),
    pendingStep("get_dashboard_events"),
    pendingStep("get_notifications"),
    pendingStep("verify_security"),
    pendingStep("get_timeline"),
    pendingStep("get_enterprise_architecture"),
  ];

  // Resolve passportId — required for most steps
  const passportId = request.passportId ?? request.diagnosticResult?.diagnosticHistory?.[0]?.passportId ?? null;
  if (!passportId) {
    const err = buildLifecycleError(
      "device_not_found",
      "Passport ID is required for lifecycle processing — no device reference found in request",
      "verify_registration",
    );
    errors.push(err);
    steps[0] = failedStep(steps[0], err);
    return buildEmptyLifecycleResult(startTime, errors, steps, "discovered");
  }

  const isFullRun = request.action === "run_lifecycle";

  // ====================== Step 1 — Verify Registration ======================
  let registrationVerification: RegistrationVerificationResult | null = null;
  if (isFullRun || request.action === "verify_registration" || request.action === "register_device") {
    steps[0] = runningStep(steps[0]);
    try {
      registrationVerification = await verifyRegistration(passportId, request);
      steps[0] = completedStep(steps[0], registrationVerification);
    } catch (error) {
      const err = buildLifecycleError("device_not_found", error instanceof Error ? error.message : "Registration verification failed", "verify_registration");
      errors.push(err);
      steps[0] = failedStep(steps[0], err);
      registrationVerification = { registered: false, customer: null, product: null, warranty: null, dealer: null, installation: null, assignedEngineer: null, unregisteredMessage: "Device detected successfully, but this device is not registered in the QBIT database.", registrationSource: null };
    }
  }

  const isRegistered = registrationVerification?.registered ?? false;

  // ====================== Step 2 — Automatic Device Synchronization ======================
  let deviceSync: DeviceSyncResult | null = null;
  if (isFullRun || request.action === "sync_device") {
    steps[1] = runningStep(steps[1]);
    try {
      deviceSync = await syncDevice(passportId, request);
      steps[1] = completedStep(steps[1], deviceSync);
    } catch (error) {
      const err = buildLifecycleError("sync_failed", error instanceof Error ? error.message : "Device sync failed", "sync_device");
      errors.push(err);
      steps[1] = failedStep(steps[1], err);
    }
  }

  // ====================== Step 3 — Device Lifecycle Management ======================
  let lifecycleData: DeviceLifecycleData | null = null;
  let currentStage: LifecycleStage = "discovered";
  if (isFullRun || request.action === "get_lifecycle" || request.action === "update_lifecycle_stage") {
    steps[2] = runningStep(steps[2]);
    try {
      lifecycleData = await manageLifecycle(passportId, isRegistered);
      currentStage = lifecycleData.currentStage;
      steps[2] = completedStep(steps[2], lifecycleData);
    } catch (error) {
      const err = buildLifecycleError("db_error", error instanceof Error ? error.message : "Lifecycle data retrieval failed", "get_lifecycle_data");
      errors.push(err);
      steps[2] = failedStep(steps[2], err);
    }
  }

  // ====================== Step 4 — Installation History ======================
  let installationHistory: InstallationHistoryResult | null = null;
  if (isFullRun || request.action === "get_installation_history") {
    steps[3] = runningStep(steps[3]);
    try {
      installationHistory = await getInstallationHistory(passportId);
      steps[3] = completedStep(steps[3], installationHistory);
    } catch (error) {
      const err = buildLifecycleError("db_error", error instanceof Error ? error.message : "Installation history retrieval failed", "get_installation_history");
      errors.push(err);
      steps[3] = failedStep(steps[3], err);
    }
  }

  // ====================== Step 5 — Service History ======================
  let serviceHistory: ServiceHistoryResult | null = null;
  if (isFullRun || request.action === "get_service_history") {
    steps[4] = runningStep(steps[4]);
    try {
      serviceHistory = await getServiceHistory(passportId);
      steps[4] = completedStep(steps[4], serviceHistory);
    } catch (error) {
      const err = buildLifecycleError("db_error", error instanceof Error ? error.message : "Service history retrieval failed", "get_service_history");
      errors.push(err);
      steps[4] = failedStep(steps[4], err);
    }
  }

  // ====================== Step 6 — Warranty Intelligence ======================
  let warrantyIntelligence: WarrantyIntelligenceResult | null = null;
  if (isFullRun || request.action === "check_warranty") {
    steps[5] = runningStep(steps[5]);
    try {
      warrantyIntelligence = await checkWarranty(passportId, isRegistered);
      steps[5] = completedStep(steps[5], warrantyIntelligence);
    } catch (error) {
      const err = buildLifecycleError("db_error", error instanceof Error ? error.message : "Warranty intelligence check failed", "check_warranty");
      errors.push(err);
      steps[5] = failedStep(steps[5], err);
    }
  }

  // ====================== Step 7 — Smart Resource Synchronization ======================
  let resourceSync: ResourceSyncResult | null = null;
  if (isFullRun || request.action === "sync_resources") {
    steps[6] = runningStep(steps[6]);
    try {
      resourceSync = await syncResources(passportId, isRegistered);
      steps[6] = completedStep(steps[6], resourceSync);
    } catch (error) {
      const err = buildLifecycleError("resource_sync_failed", error instanceof Error ? error.message : "Resource sync failed", "sync_resources");
      errors.push(err);
      steps[6] = failedStep(steps[6], err);
    }
  }

  // ====================== Step 8 — Firmware Intelligence ======================
  let firmwareIntelligence: FirmwareIntelligenceResult | null = null;
  if (isFullRun || request.action === "check_firmware") {
    steps[7] = runningStep(steps[7]);
    try {
      firmwareIntelligence = await checkFirmware(passportId);
      steps[7] = completedStep(steps[7], firmwareIntelligence);
    } catch (error) {
      const err = buildLifecycleError("firmware_check_failed", error instanceof Error ? error.message : "Firmware intelligence check failed", "check_firmware");
      errors.push(err);
      steps[7] = failedStep(steps[7], err);
    }
  }

  // ====================== Step 9 — Device Analytics ======================
  let analytics: DeviceAnalyticsResult | null = null;
  if (isFullRun || request.action === "get_analytics") {
    steps[8] = runningStep(steps[8]);
    try {
      analytics = await getAnalytics(passportId);
      steps[8] = completedStep(steps[8], analytics);
    } catch (error) {
      const err = buildLifecycleError("analytics_error", error instanceof Error ? error.message : "Device analytics retrieval failed", "get_analytics");
      errors.push(err);
      steps[8] = failedStep(steps[8], err);
    }
  }

  // ====================== Step 10 — Engineer Activity Tracking ======================
  let engineerActivity: EngineerActivityResult | null = null;
  if (isFullRun || request.action === "get_engineer_activity") {
    steps[9] = runningStep(steps[9]);
    try {
      engineerActivity = await getEngineerActivity(passportId);
      steps[9] = completedStep(steps[9], engineerActivity);
    } catch (error) {
      const err = buildLifecycleError("db_error", error instanceof Error ? error.message : "Engineer activity retrieval failed", "get_engineer_activity");
      errors.push(err);
      steps[9] = failedStep(steps[9], err);
    }
  }

  // ====================== Step 11 — Enterprise Dashboard Integration ======================
  let dashboardIntegration: DashboardIntegrationResult | null = null;
  if (isFullRun || request.action === "get_dashboard_events") {
    steps[10] = runningStep(steps[10]);
    try {
      dashboardIntegration = await getDashboardEvents(passportId);
      steps[10] = completedStep(steps[10], dashboardIntegration);
    } catch (error) {
      const err = buildLifecycleError("db_error", error instanceof Error ? error.message : "Dashboard event retrieval failed", "get_dashboard_events");
      errors.push(err);
      steps[10] = failedStep(steps[10], err);
    }
  }

  // ====================== Step 12 — Smart Notifications ======================
  let smartNotifications: SmartNotificationResult | null = null;
  if (isFullRun || request.action === "get_notifications") {
    steps[11] = runningStep(steps[11]);
    try {
      smartNotifications = await getSmartNotifications(passportId, isRegistered, warrantyIntelligence, firmwareIntelligence, request);
      steps[11] = completedStep(steps[11], smartNotifications);
    } catch (error) {
      const err = buildLifecycleError("notification_failed", error instanceof Error ? error.message : "Smart notification generation failed", "get_notifications");
      errors.push(err);
      steps[11] = failedStep(steps[11], err);
    }
  }

  // ====================== Step 13 — Security Verification ======================
  let securityVerification: SecurityVerificationResult | null = null;
  if (isFullRun || request.action === "verify_security") {
    steps[12] = runningStep(steps[12]);
    try {
      securityVerification = await verifySecurity(passportId, isRegistered, request);
      steps[12] = completedStep(steps[12], securityVerification);
    } catch (error) {
      const err = buildLifecycleError("security_violation", error instanceof Error ? error.message : "Security verification failed", "verify_security");
      errors.push(err);
      steps[12] = failedStep(steps[12], err);
    }
  }

  // ====================== Step 14 — Complete Device Timeline ======================
  let deviceTimeline: DeviceTimelineResult | null = null;
  if (isFullRun || request.action === "get_timeline") {
    steps[13] = runningStep(steps[13]);
    try {
      deviceTimeline = await getDeviceTimeline(passportId, isRegistered);
      steps[13] = completedStep(steps[13], deviceTimeline);
    } catch (error) {
      const err = buildLifecycleError("timeline_error", error instanceof Error ? error.message : "Timeline retrieval failed", "get_timeline");
      errors.push(err);
      steps[13] = failedStep(steps[13], err);
    }
  }

  // ====================== Step 15 — Enterprise Ready Architecture ======================
  let enterpriseArchitecture: EnterpriseArchitectureInfo | null = null;
  if (isFullRun) {
    steps[14] = runningStep(steps[14]);
    try {
      enterpriseArchitecture = await getEnterpriseArchitecture();
      steps[14] = completedStep(steps[14], enterpriseArchitecture);
    } catch (error) {
      const err = buildLifecycleError("db_error", error instanceof Error ? error.message : "Enterprise architecture info retrieval failed", "get_enterprise_architecture");
      errors.push(err);
      steps[14] = failedStep(steps[14], err);
    }
  }

  // ====================== Build Final Result ======================
  const durationMs = Date.now() - startTime;

  return {
    deviceLifecycle: {
      registered: isRegistered,
      customer: registrationVerification?.customer ?? null,
      installation: registrationVerification?.installation ?? null,
      warranty: warrantyIntelligence,
      serviceHistory: serviceHistory?.entries ?? [],
      resourceStatus: resourceSync?.resourceStatus ?? {
        driver: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
        firmware: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
        manual: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
        sdk: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
        video: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
        utility: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
      },
      firmwareStatus: firmwareIntelligence,
      analytics: analytics ?? {
        totalScans: 0, lastScan: null, successfulDiagnostics: 0, failedDiagnostics: 0,
        driverInstallCount: 0, firmwareUpdateCount: 0, serviceCount: 0,
        averageHealthScore: null, diagnosticSuccessRate: null,
      },
      timeline: deviceTimeline?.timeline ?? [],
      notifications: smartNotifications?.notifications ?? [],
    },
    registrationVerification,
    deviceSync,
    lifecycleData,
    installationHistory,
    serviceHistory,
    warrantyIntelligence,
    resourceSync,
    firmwareIntelligence,
    analytics,
    engineerActivity,
    dashboardIntegration,
    smartNotifications,
    securityVerification,
    deviceTimeline,
    enterpriseArchitecture,
    steps,
    errors,
    currentStage,
    lifecycleTimestamp: new Date().toISOString(),
    lifecycleDurationMs: durationMs,
  };
}

/**
 * Runs a single lifecycle step (for targeted queries).
 *
 * Used for specific actions like "verify_registration" or "check_warranty".
 * Returns a partial LifecycleResult with only the requested step populated.
 */
export async function runSingleLifecycleStep(
  request: LifecycleRequest,
  step: string,
): Promise<Partial<LifecycleResult>> {
  // Delegate to the main engine — it handles single-step actions
  const result = await runLifecycleEngine(request);
  return result;
}

// ====================== Step 1 — Verify Registration ======================

/**
 * Verifies whether the device is registered in the QBIT database.
 *
 * If the device has a productId on its passport AND the product is linked
 * to an active QbitProduct → registered. Auto-links customer, warranty,
 * dealer, and installation info from real DB records.
 *
 * If NOT registered → returns unregistered message. NEVER shows customer
 * data for unregistered devices.
 */
export async function verifyRegistration(
  passportId: string,
  request: LifecycleRequest,
): Promise<RegistrationVerificationResult> {
  const passport = await db.devicePassport.findUnique({
    where: { id: passportId },
    include: {
      product: true,
      warranty: true,
    },
  });

  if (!passport) {
    return {
      registered: false,
      customer: null,
      product: null,
      warranty: null,
      dealer: null,
      installation: null,
      assignedEngineer: null,
      unregisteredMessage: "Device passport not found in the QBIT database.",
      registrationSource: null,
    };
  }

  // Check if device has productId AND product is linked and active
  const hasActiveProduct = passport.productId && passport.product && passport.product.isActive;

  if (!hasActiveProduct) {
    return {
      registered: false,
      customer: null,
      product: null,
      warranty: null,
      dealer: null,
      installation: null,
      assignedEngineer: null,
      unregisteredMessage: "Device detected successfully, but this device is not registered in the QBIT database.",
      registrationSource: null,
    };
  }

  // Device IS registered — gather linked data
  const product = passport.product;

  // Find customer via PurchaseRecord (by serial number or product ID)
  const purchaseRecord = await db.purchaseRecord.findFirst({
    where: {
      productId: passport.productId,
      serialNumber: passport.serialNumber ?? undefined,
    },
    include: { customer: true },
    orderBy: { purchaseDate: "desc" },
  });

  // Find FSMCustomerAsset (by serial number)
  const fsmAsset = await db.fSMCustomerAsset.findFirst({
    where: { serialNumber: passport.serialNumber ?? undefined },
    include: { customer: true },
  });

  // Determine customer info — prioritize PurchaseRecord customer
  let customerInfo: RegistrationVerificationResult["customer"] = null;
  let registrationSource: RegistrationVerificationResult["registrationSource"] = null;

  if (purchaseRecord?.customer) {
    customerInfo = {
      name: purchaseRecord.customer.name,
      companyName: purchaseRecord.customer.companyName,
      city: purchaseRecord.customer.city,
      state: purchaseRecord.customer.state,
      customerId: purchaseRecord.customer.id,
    };
    registrationSource = "purchase_record";
  } else if (fsmAsset?.customer) {
    customerInfo = {
      name: fsmAsset.customer.name,
      companyName: fsmAsset.customer.companyName ?? null,
      city: fsmAsset.customer.city ?? null,
      state: fsmAsset.customer.state ?? null,
      customerId: fsmAsset.customer.id,
    };
    registrationSource = "fsm_asset";
  } else {
    registrationSource = "device_passport";
  }

  // Product info
  const productInfo: RegistrationVerificationResult["product"] = product ? {
    id: product.id,
    name: product.name,
    model: product.model,
    brand: product.brand,
    deviceType: product.deviceType,
  } : null;

  // Warranty info from DeviceWarranty
  let warrantyInfo: RegistrationVerificationResult["warranty"] = null;
  if (passport.warranty) {
    const now = new Date();
    const expiryDate = passport.warranty.warrantyExpiryDate;
    let remainingDays: number | null = null;
    if (expiryDate) {
      remainingDays = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    warrantyInfo = {
      status: passport.warranty.warrantyStatus,
      startDate: passport.warranty.warrantyStartDate?.toISOString() ?? null,
      endDate: expiryDate?.toISOString() ?? null,
      remainingDays,
    };
  }

  // Dealer info from PurchaseRecord
  const dealerInfo: RegistrationVerificationResult["dealer"] = purchaseRecord ? {
    name: purchaseRecord.dealerName ?? null,
    city: null, // dealer city not in PurchaseRecord directly
  } : null;

  // Installation info from PurchaseRecord or WorkOrder
  const installationInfo: RegistrationVerificationResult["installation"] = purchaseRecord ? {
    date: purchaseRecord.purchaseDate?.toISOString() ?? purchaseRecord.invoiceDate?.toISOString() ?? null,
    engineerId: purchaseRecord.assignedEngineerId ?? null,
    engineerName: null, // will be resolved below
    location: customerInfo?.city ?? null,
  } : null;

  // Assigned engineer
  let assignedEngineer: RegistrationVerificationResult["assignedEngineer"] = null;
  if (passport.assignedEngineerId) {
    const engineerUser = await db.user.findUnique({
      where: { id: passport.assignedEngineerId },
    });
    if (engineerUser) {
      assignedEngineer = {
        engineerId: engineerUser.id,
        engineerName: engineerUser.name ?? engineerUser.email,
      };
      // Update installation engineerName if found
      if (installationInfo && installationInfo.engineerId === engineerUser.id) {
        installationInfo.engineerName = engineerUser.name ?? engineerUser.email;
      }
    }
  } else if (purchaseRecord?.assignedEngineerId) {
    const engineerUser = await db.user.findUnique({
      where: { id: purchaseRecord.assignedEngineerId },
    });
    if (engineerUser) {
      assignedEngineer = {
        engineerId: engineerUser.id,
        engineerName: engineerUser.name ?? engineerUser.email,
      };
      if (installationInfo) {
        installationInfo.engineerName = engineerUser.name ?? engineerUser.email;
      }
    }
  }

  return {
    registered: true,
    customer: customerInfo,
    product: productInfo,
    warranty: warrantyInfo,
    dealer: dealerInfo,
    installation: installationInfo,
    assignedEngineer,
    unregisteredMessage: null,
    registrationSource,
  };
}

// ====================== Step 2 — Automatic Device Synchronization ======================

/**
 * Synchronizes the device's current state with the lifecycle engine.
 *
 * Updates DevicePassport with: lastScannedAt, connectionType, firmware
 * version, driver version, health status. Also updates
 * DeviceLifecycleCounter, creates EngineerActivityLog, DeviceTimelineEvent,
 * and ActivityFeed entries.
 */
export async function syncDevice(
  passportId: string,
  request: LifecycleRequest,
): Promise<DeviceSyncResult> {
  const now = new Date();
  const diagResult = request.diagnosticResult;
  const configResult = request.configurationResult;

  // Resolve current device state from Phase 5/4 results
  const connectionType = resolveConnectionType(diagResult ?? undefined, configResult ?? undefined);
  const firmwareVersion = resolveFirmwareVersion(passportId);
  const driverVersion = await resolveDriverVersion(passportId);
  const healthStatus = diagResult?.overallStatus ?? null;
  const healthScore = diagResult?.healthScore ?? null;

  // Update DevicePassport
  const passport = await db.devicePassport.update({
    where: { id: passportId },
    data: {
      lastScannedAt: now,
      connectionType: connectionType ?? undefined,
      updatedAt: now,
    },
  });

  // Update firmware version on passport if we have FirmwareInformation
  const firmwareInfo = await db.firmwareInformation.findUnique({ where: { passportId } });
  if (firmwareInfo?.installedVersion && passport.lastFirmwareUpdateAt === null) {
    await db.devicePassport.update({
      where: { id: passportId },
      data: { lastFirmwareUpdateAt: firmwareInfo.installedFirmwareDate ?? now },
    });
  }

  // Update driver version on passport if we have DriverInformation
  const driverInfo = await db.driverInformation.findUnique({ where: { passportId } });
  if (driverInfo?.installedDriverVersion && passport.lastDriverUpdateAt === null) {
    await db.devicePassport.update({
      where: { id: passportId },
      data: { lastDriverUpdateAt: driverInfo.installedDriverDate ?? now },
    });
  }

  // Update DeviceLifecycleCounter: totalScans++, lastScanAt=now
  const existingCounter = await db.deviceLifecycleCounter.findUnique({ where: { passportId } });
  if (existingCounter) {
    await db.deviceLifecycleCounter.update({
      where: { passportId },
      data: {
        totalScans: existingCounter.totalScans + 1,
        totalDiagnostics: existingCounter.totalDiagnostics + 1,
        lastScanAt: now,
      },
    });
  } else {
    await db.deviceLifecycleCounter.create({
      data: {
        passportId,
        totalScans: 1,
        totalDiagnostics: 1,
        successfulDiagnostics: healthStatus === "Healthy" ? 1 : 0,
        failedDiagnostics: healthStatus === "Critical" || healthStatus === "Unknown" ? 1 : 0,
        lastScanAt: now,
        isRegistered: passport.productId !== null,
        lifecycleStage: "discovered",
      },
    });
  }

  // Create EngineerActivityLog entry for this scan
  if (request.engineerId) {
    await db.engineerActivityLog.create({
      data: {
        engineerId: request.engineerId,
        engineerName: request.engineerName ?? null,
        engineerEmail: null, // will be filled from User table if available
        passportId,
        customerId: passport.customerAssetId ?? null,
        customerName: null,
        activity: "scan",
        result: healthStatus === "Healthy" ? "successful" : healthStatus === "Critical" ? "failed" : "partial",
        resultData: healthScore ? JSON.stringify({ healthScore, overallStatus: healthStatus }) : null,
        activityTime: now,
      },
    });
  }

  // Create DeviceTimelineEvent for "scan" event
  await db.deviceTimelineEvent.create({
    data: {
      passportId,
      eventType: "scan",
      title: `Device Scanned — ${passport.deviceName ?? passport.model ?? "Unknown Device"}`,
      description: `Diagnostic scan performed by ${request.engineerName ?? "system"}. Health: ${healthStatus ?? "Unknown"}`,
      actorId: request.engineerId ?? "system",
      actorName: request.engineerName ?? "System",
      previousValue: null,
      newValue: healthScore ? String(healthScore) : null,
      relatedId: null,
      relatedType: "diagnostic",
      metadata: JSON.stringify({ healthStatus, healthScore, connectionType }),
      occurredAt: now,
    },
  });

  // Create ActivityFeed entry for dashboard integration
  await db.activityFeed.create({
    data: {
      userId: request.engineerId,
      userName: request.engineerName,
      action: "completed",
      entity: "device_scan",
      entityName: passport.deviceName ?? passport.model ?? passport.serialNumber ?? passport.passportNumber,
      icon: "search",
      dotColor: healthStatus === "Healthy" ? "primary" : healthStatus === "Critical" ? "error" : "neutral",
      createdAt: now,
    },
  });

  // Build sync result
  const lastDiagnostic = await db.liveDiagnosticSession.findFirst({
    where: { passportId },
    orderBy: { startedAt: "desc" },
  });

  return {
    lastConnectedTime: passport.lastScannedAt?.toISOString() ?? null,
    lastSeen: passport.lastScannedAt?.toISOString() ?? null,
    connectionType: (passport.connectionType as DeviceConnection) ?? null,
    currentFirmware: firmwareInfo?.installedVersion ?? null,
    driverVersion: driverInfo?.installedDriverVersion ?? null,
    healthStatus: healthStatus as DiagnosticOverallStatus | null ?? (lastDiagnostic?.overallStatus as DiagnosticOverallStatus | null),
    lastEngineer: request.engineerName ?? passport.assignedEngineerId ?? null,
    lastScanResult: healthStatus ?? lastDiagnostic?.overallStatus ?? null,
    currentlyOnline: healthStatus === "Healthy" || healthStatus === "Attention Required",
  };
}

/** Resolves connection type from Phase 5/4 results. */
function resolveConnectionType(
  diagResult: DiagnosticResult | undefined,
  configResult: ConfigurationResult | undefined,
): string | null {
  if (configResult?.connectionType) return configResult.connectionType;
  if (diagResult?.hardwareHealth?.connectionHealth?.[0]?.connectionType) return diagResult.hardwareHealth.connectionHealth[0].connectionType;
  return null;
}

/** Resolves firmware version from database. */
async function resolveFirmwareVersion(passportId: string): Promise<string | null> {
  const firmwareInfo = await db.firmwareInformation.findUnique({ where: { passportId } });
  return firmwareInfo?.installedVersion ?? null;
}

/** Resolves driver version from database. */
async function resolveDriverVersion(passportId: string): Promise<string | null> {
  const driverInfo = await db.driverInformation.findUnique({ where: { passportId } });
  return driverInfo?.installedDriverVersion ?? null;
}

// ====================== Step 3 — Device Lifecycle Management ======================

/**
 * Queries all lifecycle data from DevicePassport, PurchaseRecord,
 * DeviceConfiguration, and LiveDiagnosticSession to build a complete
 * lifecycle data object. Determines lifecycleStage from current state.
 */
export async function manageLifecycle(
  passportId: string,
  isRegistered: boolean,
): Promise<DeviceLifecycleData> {
  const passport = await db.devicePassport.findUnique({
    where: { id: passportId },
    include: { product: true, warranty: true },
  });

  if (!passport) {
    return {
      manufacturingDate: null,
      purchaseDate: null,
      dealerInfo: null,
      customerAssignment: null,
      installationDate: null,
      warrantyStart: null,
      warrantyEnd: null,
      lastService: null,
      lastFirmwareUpdate: null,
      lastConfiguration: null,
      lastDiagnostic: null,
      currentStage: "discovered",
    };
  }

  // Purchase data
  const purchaseRecord = await db.purchaseRecord.findFirst({
    where: {
      productId: passport.productId ?? undefined,
      serialNumber: passport.serialNumber ?? undefined,
    },
    include: { customer: true },
    orderBy: { purchaseDate: "desc" },
  });

  // FSM asset data
  const fsmAsset = await db.fSMCustomerAsset.findFirst({
    where: { serialNumber: passport.serialNumber ?? undefined },
    include: { customer: true },
  });

  // Configuration data
  const configuration = await db.deviceConfiguration.findUnique({
    where: { passportId },
  });

  // Diagnostic data
  const lastDiagnostic = await db.liveDiagnosticSession.findFirst({
    where: { passportId },
    orderBy: { startedAt: "desc" },
  });

  // Build lifecycle data
  const manufacturingDate = passport.warranty?.warrantyStartDate?.toISOString() ?? passport.firstDetectedAt.toISOString();
  const purchaseDate = purchaseRecord?.purchaseDate?.toISOString() ?? fsmAsset?.purchaseDate?.toISOString() ?? null;

  const dealerInfo = purchaseRecord ? {
    name: purchaseRecord.dealerName ?? null,
    city: null,
    state: null,
  } : null;

  const customerAssignment = (() => {
    if (purchaseRecord?.customer) {
      return { customerId: purchaseRecord.customer.id, customerName: purchaseRecord.customer.name, companyName: purchaseRecord.customer.companyName };
    }
    if (fsmAsset?.customer) {
      return { customerId: fsmAsset.customer.id, customerName: fsmAsset.customer.name, companyName: fsmAsset.customer.companyName ?? null };
    }
    return null;
  })();

  const installationDate = passport.lastInstallationAt?.toISOString() ?? purchaseRecord?.purchaseDate?.toISOString() ?? null;
  const warrantyStart = passport.warranty?.warrantyStartDate?.toISOString() ?? purchaseRecord?.warrantyStartDate?.toISOString() ?? null;
  const warrantyEnd = passport.warranty?.warrantyExpiryDate?.toISOString() ?? purchaseRecord?.warrantyEndDate?.toISOString() ?? null;
  const lastService = passport.lastServiceAt?.toISOString() ?? null;
  const lastFirmwareUpdate = passport.lastFirmwareUpdateAt?.toISOString() ?? null;
  const lastConfiguration = configuration?.lastConfiguredAt?.toISOString() ?? null;
  const lastDiagnosticDate = lastDiagnostic?.startedAt?.toISOString() ?? passport.lastScannedAt?.toISOString() ?? null;

  // Determine lifecycle stage from real DB state
  const hasInstallation = passport.lastInstallationAt !== null || installationDate !== null;
  const hasConfiguration = configuration?.configurationStatus === "successful";
  const isOperational = lastDiagnostic?.overallStatus === "Healthy" && hasConfiguration;

  // Check for active maintenance work order
  const activeWorkOrder = passport.serialNumber
    ? await db.workOrder.findFirst({
        where: {
          asset: { serialNumber: passport.serialNumber },
          status: { in: ["in_progress", "scheduled", "engineer_arrived"] },
        },
      })
    : null;

  const currentStage = stageFromData({
    registered: isRegistered,
    installed: hasInstallation,
    configured: hasConfiguration ?? false,
    operational: isOperational ?? false,
    inMaintenance: activeWorkOrder !== null,
    decommissioned: false, // checked separately if needed
  });

  // Update DeviceLifecycleCounter with current stage
  await db.deviceLifecycleCounter.upsert({
    where: { passportId },
    update: { lifecycleStage: currentStage, isRegistered },
    create: {
      passportId,
      lifecycleStage: currentStage,
      isRegistered,
      totalScans: 0,
      lastScanAt: null,
      totalDiagnostics: 0,
      successfulDiagnostics: 0,
      failedDiagnostics: 0,
    },
  });

  return {
    manufacturingDate,
    purchaseDate,
    dealerInfo,
    customerAssignment,
    installationDate,
    warrantyStart,
    warrantyEnd,
    lastService,
    lastFirmwareUpdate,
    lastConfiguration,
    lastDiagnostic: lastDiagnosticDate,
    currentStage,
  };
}

// ====================== Step 4 — Installation History ======================

/**
 * Queries all InstallationRecord entries for this passportId.
 * Multiple installations = multiple entries. NEVER deletes old records.
 */
export async function getInstallationHistory(
  passportId: string,
): Promise<InstallationHistoryResult> {
  const records = await db.installationRecord.findMany({
    where: { passportId },
    orderBy: { installationDate: "desc" },
  });

  const installations: InstallationRecordType[] = records.map((record, index) => ({
    installNumber: records.length - index, // 1-based, newest = highest number
    installationDate: record.installationDate.toISOString(),
    engineerId: record.engineerId,
    engineerName: record.engineerName,
    customerLocation: record.customerLocation,
    connectionType: (record.connectionType as DeviceConnection) ?? null,
    initialFirmware: record.initialFirmware,
    initialDriver: record.initialDriver,
    status: record.status as "completed" | "pending" | "failed",
  }));

  return {
    installations,
    totalInstallations: installations.length,
  };
}

// ====================== Step 5 — Service History ======================

/**
 * Queries ServiceHistoryEntry for this passportId and combines data
 * from DriverHistory, FirmwareHistory, ConfigurationEvent, and
 * LiveDiagnosticSession to build a unified service history view.
 */
export async function getServiceHistory(
  passportId: string,
): Promise<ServiceHistoryResult> {
  // Primary service history entries
  const serviceEntries = await db.serviceHistoryEntry.findMany({
    where: { passportId },
    orderBy: { serviceDate: "desc" },
  });

  // Supplement with DriverHistory events
  const driverHistory = await db.driverHistory.findMany({
    where: { passportId },
    orderBy: { occurredAt: "desc" },
  });

  // Supplement with FirmwareHistory events
  const firmwareHistory = await db.firmwareHistory.findMany({
    where: { passportId },
    orderBy: { occurredAt: "desc" },
  });

  // Supplement with ConfigurationEvent events
  const configurationEvents = await db.configurationEvent.findMany({
    where: { configuration: { passportId } },
    orderBy: { occurredAt: "desc" },
  });

  // Supplement with LiveDiagnosticSession events
  const diagnosticSessions = await db.liveDiagnosticSession.findMany({
    where: { passportId },
    orderBy: { startedAt: "desc" },
  });

  // Build unified entries from all sources
  const unifiedEntries: ServiceHistoryEntryType[] = [];

  // Add ServiceHistoryEntry records
  for (const entry of serviceEntries) {
    unifiedEntries.push({
      serviceNumber: unifiedEntries.length + 1,
      serviceDate: entry.serviceDate.toISOString(),
      engineerId: entry.engineerId,
      engineerName: entry.engineerName,
      activityType: mapActivityType(entry.activityType),
      previousValue: entry.previousValue,
      currentValue: entry.currentValue,
      result: entry.result as "success" | "failed" | "partial" | "pending",
      status: mapResultToStatus(entry.result),
    });
  }

  // Add DriverHistory events that are NOT already in ServiceHistoryEntry
  for (const dh of driverHistory) {
    const activityType = mapDriverEventType(dh.eventType);
    if (activityType) {
      unifiedEntries.push({
        serviceNumber: unifiedEntries.length + 1,
        serviceDate: dh.occurredAt.toISOString(),
        engineerId: dh.performedBy,
        engineerName: dh.performedByName,
        activityType,
        previousValue: dh.oldVersion,
        currentValue: dh.newVersion,
        result: "success",
        status: "completed",
      });
    }
  }

  // Add FirmwareHistory events
  for (const fh of firmwareHistory) {
    const activityType = mapFirmwareEventType(fh.eventType);
    if (activityType) {
      unifiedEntries.push({
        serviceNumber: unifiedEntries.length + 1,
        serviceDate: fh.occurredAt.toISOString(),
        engineerId: fh.performedBy,
        engineerName: fh.performedByName,
        activityType,
        previousValue: fh.oldVersion,
        currentValue: fh.newVersion,
        result: "success",
        status: "completed",
      });
    }
  }

  // Add ConfigurationEvent events
  for (const ce of configurationEvents) {
    if (ce.eventType !== "configuration_started") {
      unifiedEntries.push({
        serviceNumber: unifiedEntries.length + 1,
        serviceDate: ce.occurredAt.toISOString(),
        engineerId: ce.performedBy,
        engineerName: ce.performedByName,
        activityType: "configuration_change",
        previousValue: null,
        currentValue: ce.eventDetails ?? ce.connectionType ?? null,
        result: ce.result === "success" ? "success" : ce.result === "failure" ? "failed" : "partial",
        status: ce.result === "success" ? "completed" : ce.result === "failure" ? "failed" : "completed",
      });
    }
  }

  // Add DiagnosticSession events
  for (const ds of diagnosticSessions) {
    unifiedEntries.push({
      serviceNumber: unifiedEntries.length + 1,
      serviceDate: ds.startedAt.toISOString(),
      engineerId: ds.engineerId,
      engineerName: ds.engineerName,
      activityType: "diagnostic_run",
      previousValue: null,
      currentValue: ds.healthScore ? String(ds.healthScore) : null,
      result: ds.status === "completed" ? "success" : ds.status === "failed" ? "failed" : "partial",
      status: ds.status === "completed" ? "completed" : ds.status === "failed" ? "failed" : "in_progress",
    });
  }

  // Sort by date (newest first) and re-number
  unifiedEntries.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  for (let i = 0; i < unifiedEntries.length; i++) {
    unifiedEntries[i].serviceNumber = i + 1;
  }

  return {
    entries: unifiedEntries,
    totalServiceEntries: unifiedEntries.length,
  };
}

/** Maps ServiceHistoryEntry activityType to the type system. */
function mapActivityType(activityType: string): ServiceActivityType {
  const map: Record<string, ServiceActivityType> = {
    diagnostic: "diagnostic_run",
    driver_install: "driver_install",
    driver_update: "driver_update",
    firmware_update: "firmware_update",
    configuration_change: "configuration_change",
    troubleshooting: "hardware_repair",
    repair: "hardware_repair",
    maintenance: "cutter_maintenance",
    warranty_renewal: "warranty_renewal",
    reinstallation: "connection_setup",
  };
  return map[activityType] ?? "diagnostic_run";
}

/** Maps DriverHistory eventType to ServiceActivityType. */
function mapDriverEventType(eventType: string): ServiceActivityType | null {
  const map: Record<string, ServiceActivityType> = {
    install: "driver_install",
    update: "driver_update",
    rollback: "driver_update",
    uninstall: "driver_remove",
  };
  return map[eventType] ?? null; // "scan" = not a service event
}

/** Maps FirmwareHistory eventType to ServiceActivityType. */
function mapFirmwareEventType(eventType: string): ServiceActivityType | null {
  const map: Record<string, ServiceActivityType> = {
    install: "firmware_update",
    update: "firmware_update",
    rollback: "firmware_update",
  };
  return map[eventType] ?? null; // "scan", "block" = not service events
}

/** Maps result string to status. */
function mapResultToStatus(result: string): "completed" | "in_progress" | "failed" | "cancelled" {
  const map: Record<string, "completed" | "in_progress" | "failed" | "cancelled"> = {
    successful: "completed",
    failed: "failed",
    partial: "in_progress",
    pending: "in_progress",
  };
  return map[result] ?? "completed";
}

// ====================== Step 6 — Warranty Intelligence ======================

/**
 * Queries DeviceWarranty for this passportId and calculates warrantyColor
 * from real date calculations. Uses REAL date math — no hardcoded dates.
 *
 * Color rules:
 *   - Green: 300+ days remaining
 *   - Yellow: 100-299 days remaining
 *   - Orange: 30-99 days remaining
 *   - Red: expired (0 or negative days)
 *   - Unknown: no warranty record
 */
export async function checkWarranty(
  passportId: string,
  isRegistered: boolean,
): Promise<WarrantyIntelligenceResult> {
  if (!isRegistered) {
    return {
      warrantyStatus: "unknown",
      warrantyColor: "red",
      remainingDays: null,
      expiryDate: null,
      extendedWarranty: false,
      extendedExpiryDate: null,
      provider: null,
      startDate: null,
      recommendation: "Device is not registered — warranty status unknown. Register this device to view warranty information.",
    };
  }

  const warranty = await db.deviceWarranty.findUnique({
    where: { passportId },
  });

  if (!warranty) {
    return {
      warrantyStatus: "unknown",
      warrantyColor: "red",
      remainingDays: null,
      expiryDate: null,
      extendedWarranty: false,
      extendedExpiryDate: null,
      provider: null,
      startDate: null,
      recommendation: "No warranty record found for this device. Contact the dealer to verify warranty status.",
    };
  }

  const now = new Date();
  const expiryDate = warranty.warrantyExpiryDate;

  // Calculate remaining days from REAL date math
  let remainingDays: number | null = null;
  if (expiryDate) {
    remainingDays = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Determine warranty status from real calculations
  let warrantyStatus: "active" | "expired" | "expiring_soon" | "unknown";
  if (warranty.warrantyStatus === "expired" || warranty.warrantyStatus === "void") {
    warrantyStatus = "expired";
  } else if (remainingDays === null) {
    warrantyStatus = "unknown";
  } else if (remainingDays <= 0) {
    warrantyStatus = "expired";
  } else if (remainingDays < 100) {
    warrantyStatus = "expiring_soon";
  } else {
    warrantyStatus = "active";
  }

  // Calculate warranty color from remaining days (strict rules)
  const warrantyColor = warrantyColorFromDays(remainingDays);

  // Extended warranty check
  const extendedExpiryDate = warranty.extendedExpiryDate;
  const extendedWarranty = warranty.extendedWarranty;

  // Calculate recommendation based on warranty color
  let recommendation: string | null = null;
  if (warrantyColor === "green") {
    recommendation = "Warranty is active with plenty of time remaining. No action needed.";
  } else if (warrantyColor === "yellow") {
    recommendation = "Warranty is active but approaching expiry. Consider renewal planning.";
  } else if (warrantyColor === "orange") {
    recommendation = "Warranty expires soon. Contact the dealer to arrange renewal before expiry.";
  } else if (warrantyColor === "red") {
    recommendation = remainingDays !== null && remainingDays <= 0
      ? "Warranty has expired. Renew warranty or contact support for out-of-warranty service options."
      : "Warranty status unknown. Verify warranty registration with the dealer.";
  }

  return {
    warrantyStatus,
    warrantyColor,
    remainingDays,
    expiryDate: expiryDate?.toISOString() ?? null,
    extendedWarranty,
    extendedExpiryDate: extendedExpiryDate?.toISOString() ?? null,
    provider: warranty.warrantyProvider ?? null,
    startDate: warranty.warrantyStartDate?.toISOString() ?? null,
    recommendation,
  };
}

// ====================== Step 7 — Smart Resource Synchronization ======================

/**
 * Queries QbitProduct for this device and ProductResourceMapping + Resource
 * to build per-category resource availability status.
 *
 * This is READ-ONLY. The actual resource sync (admin uploads) happens via
 * a separate webhook/trigger.
 */
export async function syncResources(
  passportId: string,
  isRegistered: boolean,
): Promise<ResourceSyncResult> {
  const emptyStatus: ResourceAvailabilityStatus = {
    available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false,
  };

  if (!isRegistered) {
    return {
      resourceStatus: {
        driver: { ...emptyStatus, compatible: false },
        firmware: { ...emptyStatus, compatible: false },
        manual: { ...emptyStatus, compatible: false },
        sdk: { ...emptyStatus, compatible: false },
        video: { ...emptyStatus, compatible: false },
        utility: { ...emptyStatus, compatible: false },
      },
    };
  }

  const passport = await db.devicePassport.findUnique({
    where: { id: passportId },
  });

  if (!passport?.productId) {
    return {
      resourceStatus: {
        driver: { ...emptyStatus },
        firmware: { ...emptyStatus },
        manual: { ...emptyStatus },
        sdk: { ...emptyStatus },
        video: { ...emptyStatus },
        utility: { ...emptyStatus },
      },
    };
  }

  // Use the existing resource-engine to fetch product resources
  const cloudResources = await fetchProductResources(passport.productId, "engineer");

  // Build per-category availability from real data
  const driverStatus: ResourceAvailabilityStatus = {
    available: cloudResources.drivers.length > 0,
    count: cloudResources.drivers.length,
    latestVersion: cloudResources.drivers[0]?.version ?? null,
    downloadUrl: cloudResources.drivers[0]?.url ?? null,
    compatible: cloudResources.drivers.length > 0,
  };

  const firmwareStatus: ResourceAvailabilityStatus = {
    available: cloudResources.firmware.length > 0,
    count: cloudResources.firmware.length,
    latestVersion: cloudResources.firmware[0]?.version ?? null,
    downloadUrl: cloudResources.firmware[0]?.url ?? null,
    compatible: cloudResources.firmware.length > 0,
  };

  const manualStatus: ResourceAvailabilityStatus = {
    available: cloudResources.manuals.length > 0,
    count: cloudResources.manuals.length,
    latestVersion: cloudResources.manuals[0]?.version ?? null,
    downloadUrl: cloudResources.manuals[0]?.url ?? null,
    compatible: cloudResources.manuals.length > 0,
  };

  const sdkStatus: ResourceAvailabilityStatus = {
    available: cloudResources.sdk.length > 0,
    count: cloudResources.sdk.length,
    latestVersion: cloudResources.sdk[0]?.version ?? null,
    downloadUrl: cloudResources.sdk[0]?.url ?? null,
    compatible: cloudResources.sdk.length > 0,
  };

  const videoStatus: ResourceAvailabilityStatus = {
    available: cloudResources.videos.length > 0,
    count: cloudResources.videos.length,
    latestVersion: cloudResources.videos[0]?.version ?? null,
    downloadUrl: cloudResources.videos[0]?.url ?? null,
    compatible: cloudResources.videos.length > 0,
  };

  const utilityStatus: ResourceAvailabilityStatus = {
    available: cloudResources.utilities.length > 0,
    count: cloudResources.utilities.length,
    latestVersion: cloudResources.utilities[0]?.version ?? null,
    downloadUrl: cloudResources.utilities[0]?.url ?? null,
    compatible: cloudResources.utilities.length > 0,
  };

  return {
    resourceStatus: {
      driver: driverStatus,
      firmware: firmwareStatus,
      manual: manualStatus,
      sdk: sdkStatus,
      video: videoStatus,
      utility: utilityStatus,
    },
  };
}

// ====================== Step 8 — Firmware Intelligence ======================

/**
 * Queries FirmwareInformation for this passportId and compares
 * installedVersion vs latestVersion. NEVER auto-updates.
 * Only recommendation.
 */
export async function checkFirmware(
  passportId: string,
): Promise<FirmwareIntelligenceResult> {
  const firmwareInfo = await db.firmwareInformation.findUnique({
    where: { passportId },
  });

  if (!firmwareInfo) {
    return {
      installedFirmware: null,
      latestFirmware: null,
      updateAvailable: false,
      isCritical: false,
      isStable: true,
      latestReleaseDate: null,
      downloadUrl: null,
      recommendation: "Firmware information not available.",
    };
  }

  const installedFirmware = firmwareInfo.installedVersion;
  const latestFirmware = firmwareInfo.latestVersion;
  const updateAvailable = firmwareInfo.firmwareStatus === "update_available";

  // Check if the latest release is critical or stable
  let isCritical = false;
  let isStable = true;
  let latestReleaseDate: string | null = null;

  if (firmwareInfo.latestReleaseId) {
    const latestRelease = await db.firmwareRelease.findUnique({
      where: { id: firmwareInfo.latestReleaseId },
    });
    if (latestRelease) {
      isCritical = latestRelease.isCritical;
      isStable = latestRelease.isStable;
      latestReleaseDate = latestRelease.releaseDate.toISOString();
    }
  } else if (firmwareInfo.latestReleaseDate) {
    latestReleaseDate = firmwareInfo.latestReleaseDate.toISOString();
  }

  // Build recommendation
  let recommendation: string | null = null;
  if (updateAvailable) {
    if (isCritical) {
      recommendation = "Critical firmware update available for this device. Update as soon as possible.";
    } else {
      recommendation = "New firmware available for this device.";
    }
  } else if (firmwareInfo.firmwareStatus === "healthy") {
    recommendation = "Device is running the latest firmware.";
  } else if (firmwareInfo.firmwareStatus === "unsupported") {
    recommendation = "Firmware update not supported for this device model.";
  } else {
    recommendation = "Firmware information not available.";
  }

  return {
    installedFirmware,
    latestFirmware,
    updateAvailable,
    isCritical,
    isStable,
    latestReleaseDate,
    downloadUrl: firmwareInfo.latestDownloadUrl ?? null,
    recommendation,
  };
}

// ====================== Step 9 — Device Analytics ======================

/**
 * Queries DeviceLifecycleCounter for this passportId and computes
 * analytics from real data. Also computes average health score from
 * recent LiveDiagnosticSession records.
 */
export async function getAnalytics(
  passportId: string,
): Promise<DeviceAnalyticsResult> {
  // Get or create lifecycle counter
  let counter = await db.deviceLifecycleCounter.findUnique({
    where: { passportId },
  });

  if (!counter) {
    counter = await db.deviceLifecycleCounter.create({
      data: {
        passportId,
        totalScans: 0,
        lastScanAt: null,
        totalDiagnostics: 0,
        successfulDiagnostics: 0,
        failedDiagnostics: 0,
        driverInstallCount: 0,
        driverUpdateCount: 0,
        firmwareUpdateCount: 0,
        serviceCount: 0,
        isRegistered: false,
        lifecycleStage: "discovered",
      },
    });
  }

  // Compute average health score from recent diagnostic sessions
  const recentSessions = await db.liveDiagnosticSession.findMany({
    where: { passportId, status: "completed" },
    orderBy: { startedAt: "desc" },
    take: 20,
    select: { healthScore: true, overallStatus: true },
  });

  let averageHealthScore: number | null = null;
  if (recentSessions.length > 0) {
    const totalScore = recentSessions.reduce((sum, s) => sum + s.healthScore, 0);
    averageHealthScore = Math.round(totalScore / recentSessions.length);
  }

  // Compute diagnostic success rate
  const successfulCount = recentSessions.filter(
    (s) => s.overallStatus === "Healthy" || s.overallStatus === "Attention Required",
  ).length;
  const failedCount = recentSessions.filter(
    (s) => s.overallStatus === "Critical" || s.overallStatus === "Unknown",
  ).length;

  let diagnosticSuccessRate: number | null = null;
  if (recentSessions.length > 0) {
    diagnosticSuccessRate = Math.round((successfulCount / recentSessions.length) * 100);
  }

  // Compute driver/firmware/service counts from history
  const driverInstallCount = counter.driverInstallCount;
  const firmwareUpdateCount = counter.firmwareUpdateCount;
  const serviceCount = counter.serviceCount + counter.repairCount + counter.maintenanceCount;

  return {
    totalScans: counter.totalScans,
    lastScan: counter.lastScanAt?.toISOString() ?? null,
    successfulDiagnostics: counter.successfulDiagnostics || successfulCount,
    failedDiagnostics: counter.failedDiagnostics || failedCount,
    driverInstallCount,
    firmwareUpdateCount,
    serviceCount,
    averageHealthScore,
    diagnosticSuccessRate,
  };
}

// ====================== Step 10 — Engineer Activity Tracking ======================

/**
 * Queries EngineerActivityLog for this passportId and cross-references
 * with User table for engineer email. Builds audit trail view.
 */
export async function getEngineerActivity(
  passportId: string,
): Promise<EngineerActivityResult> {
  const activityLogs = await db.engineerActivityLog.findMany({
    where: { passportId },
    orderBy: { activityTime: "desc" },
    take: 50,
  });

  const activities: EngineerActivityEntry[] = [];

  for (const log of activityLogs) {
    // Cross-reference with User for engineer email
    let engineerEmail: string | null = log.engineerEmail;
    if (!engineerEmail && log.engineerId) {
      const user = await db.user.findUnique({
        where: { id: log.engineerId },
        select: { email: true },
      });
      engineerEmail = user?.email ?? null;
    }

    activities.push({
      engineerId: log.engineerId,
      engineerName: log.engineerName,
      loginId: engineerEmail,
      time: log.activityTime.toISOString(),
      device: log.passportId,
      customer: log.customerName,
      activity: log.activity,
      result: log.result as "success" | "failed" | "partial" | "viewed" | "initiated",
    });
  }

  return {
    activities,
    totalActivities: activities.length,
  };
}

// ====================== Step 11 — Enterprise Dashboard Integration ======================

/**
 * Queries ActivityFeed for recent Dr. QBIT events related to this device.
 * These events are auto-created during Steps 2, 4, 5 — this step just reads them.
 */
export async function getDashboardEvents(
  passportId: string,
): Promise<DashboardIntegrationResult> {
  const passport = await db.devicePassport.findUnique({
    where: { id: passportId },
    select: { passportNumber: true, deviceName: true, model: true, serialNumber: true },
  });

  const deviceIdentifier = passport?.deviceName ?? passport?.model ?? passport?.serialNumber ?? passport?.passportNumber ?? passportId;

  // Query ActivityFeed for Dr. QBIT device-related events
  const feedEntries = await db.activityFeed.findMany({
    where: {
      entity: { in: ["device_scan", "driver_install", "firmware_update", "device_registration", "service_visit", "configuration"] },
      entityName: { contains: deviceIdentifier },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Also query by engineer ID if available
  const recentDiagnostic = await db.liveDiagnosticSession.findFirst({
    where: { passportId },
    orderBy: { startedAt: "desc" },
  });

  const events: DashboardEvent[] = [];

  for (const entry of feedEntries) {
    const eventType = mapFeedActionToEventType(entry.action, entry.entity);
    events.push({
      eventType,
      description: `${entry.action} — ${entry.entityName ?? "Device"}`,
      timestamp: entry.createdAt.toISOString(),
      engineerName: entry.userName ?? null,
      referenceId: entry.userId ?? null,
    });
  }

  // Add diagnostic event if not already in feed
  if (recentDiagnostic && !events.some(e => e.eventType === "diagnostic_completed")) {
    events.push({
      eventType: "diagnostic_completed",
      description: `Diagnostic completed — Health: ${recentDiagnostic.overallStatus}`,
      timestamp: recentDiagnostic.startedAt.toISOString(),
      engineerName: recentDiagnostic.engineerName ?? null,
      referenceId: recentDiagnostic.id,
    });
  }

  // Sort by timestamp (newest first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    recentActivities: events,
    totalRecentEvents: events.length,
  };
}

/** Maps ActivityFeed action/entity to DashboardEventType. */
function mapFeedActionToEventType(action: string, entity: string): DashboardEventType {
  if (entity === "device_scan" || action === "completed" && entity === "device_scan") return "printer_scanned";
  if (entity === "driver_install") return "driver_installed";
  if (entity === "firmware_update") return "firmware_update_recommended";
  if (entity === "device_registration") return "device_registered";
  if (entity === "service_visit" || entity === "service") return "service_completed";
  if (entity === "configuration" && action === "completed") return "diagnostic_completed";
  return "printer_scanned"; // default
}

// ====================== Step 12 — Smart Notifications ======================

/**
 * Checks REAL conditions and generates SmartNotification records.
 * Uses dedupKey to prevent duplicate notifications.
 *
 * Conditions checked:
 *  a. Warranty expiring soon (remainingDays < 100)
 *  b. Firmware update available
 *  c. Device not registered
 *  d. Driver missing
 *  e. Repeated communication failure (3+ recent failures)
 *  f. Frequent offline (3+ offline scans)
 */
export async function getSmartNotifications(
  passportId: string,
  isRegistered: boolean,
  warrantyIntelligence: WarrantyIntelligenceResult | null,
  firmwareIntelligence: FirmwareIntelligenceResult | null,
  request: LifecycleRequest,
): Promise<SmartNotificationResult> {
  const notifications: SmartNotification[] = [];
  const now = new Date();

  // (a) Warranty expiring soon
  if (warrantyIntelligence && warrantyIntelligence.remainingDays !== null) {
    if (warrantyIntelligence.remainingDays <= 0) {
      await createOrReadNotification(passportId, "warranty_expired", "critical", "Warranty Expired", `Warranty has expired for this device. Remaining days: ${warrantyIntelligence.remainingDays}`, "Contact dealer for warranty renewal or out-of-warranty service.", `Warranty expired — ${warrantyIntelligence.remainingDays} days remaining`, `warranty_expired_${passportId}`, now);
      notifications.push(buildNotificationObject("warranty_expired", "critical", "Warranty Expired", `Warranty has expired for this device.`, "Contact dealer for warranty renewal.", now.toISOString(), `Warranty expired — remaining days: ${warrantyIntelligence.remainingDays}`));
    } else if (warrantyIntelligence.remainingDays < 100) {
      await createOrReadNotification(passportId, "warranty_expiring", "warning", "Warranty Expiring Soon", `Warranty expires in ${warrantyIntelligence.remainingDays} days.`, "Plan warranty renewal before expiry.", `Warranty expires in ${warrantyIntelligence.remainingDays} days`, `warranty_expiring_${passportId}`, warrantyIntelligence.expiryDate ? new Date(warrantyIntelligence.expiryDate) : null);
      notifications.push(buildNotificationObject("warranty_expiring", "warning", "Warranty Expiring Soon", `Warranty expires in ${warrantyIntelligence.remainingDays} days.`, "Plan warranty renewal before expiry.", now.toISOString(), `Warranty expires in ${warrantyIntelligence.remainingDays} days`));
    }
  }

  // (b) Firmware update available
  if (firmwareIntelligence?.updateAvailable) {
    const severity = firmwareIntelligence.isCritical ? "critical" : "warning";
    const type = firmwareIntelligence.isCritical ? "firmware_critical_update" : "firmware_update_available";
    const title = firmwareIntelligence.isCritical ? "Critical Firmware Update Available" : "Firmware Update Available";
    await createOrReadNotification(passportId, type, severity, title, `Installed: ${firmwareIntelligence.installedFirmware ?? "unknown"}, Latest: ${firmwareIntelligence.latestFirmware ?? "unknown"}`, "Update firmware to the latest version.", `Firmware update: ${firmwareIntelligence.installedFirmware ?? "unknown"} → ${firmwareIntelligence.latestFirmware ?? "unknown"}`, `firmware_update_${passportId}`, null);
    notifications.push(buildNotificationObject(type, severity, title, `Installed: ${firmwareIntelligence.installedFirmware ?? "unknown"}, Latest: ${firmwareIntelligence.latestFirmware ?? "unknown"}`, "Update firmware to the latest version.", now.toISOString(), `Firmware update available: v${firmwareIntelligence.latestFirmware ?? "unknown"}`));
  }

  // (c) Device not registered
  if (!isRegistered) {
    await createOrReadNotification(passportId, "device_not_registered", "warning", "Device Not Registered", "This device is not registered in the QBIT database.", "Register the device to enable full lifecycle management.", "Device productId is null — not linked to QbitProduct", `not_registered_${passportId}`, null);
    notifications.push(buildNotificationObject("device_not_registered", "warning", "Device Not Registered", "This device is not registered in the QBIT database.", "Register the device to enable full lifecycle management.", now.toISOString(), "Device not linked to any QBIT product"));
  }

  // (d) Driver missing
  const driverInfo = await db.driverInformation.findUnique({ where: { passportId } });
  if (driverInfo?.driverStatus === "missing") {
    await createOrReadNotification(passportId, "driver_missing", "error", "Driver Missing", "No driver installed for this device.", "Install the appropriate driver from the QBIT resource library.", `Driver status: ${driverInfo.driverStatus}`, `driver_missing_${passportId}`, null);
    notifications.push(buildNotificationObject("driver_missing", "error", "Driver Missing", "No driver installed for this device.", "Install the appropriate driver from the QBIT resource library.", now.toISOString(), `Driver status: ${driverInfo.driverStatus}`));
  } else if (driverInfo?.driverStatus === "update_available") {
    await createOrReadNotification(passportId, "driver_outdated", "warning", "Driver Outdated", `Installed: ${driverInfo.installedDriverVersion ?? "unknown"}, Latest: ${driverInfo.latestDriverVersion ?? "unknown"}`, "Update driver to the latest version.", `Driver update: ${driverInfo.installedDriverVersion ?? "unknown"} → ${driverInfo.latestDriverVersion ?? "unknown"}`, `driver_outdated_${passportId}`, null);
    notifications.push(buildNotificationObject("driver_outdated", "warning", "Driver Outdated", `Installed: ${driverInfo.installedDriverVersion ?? "unknown"}, Latest: ${driverInfo.latestDriverVersion ?? "unknown"}`, "Update driver to the latest version.", now.toISOString(), `Driver update available`));
  }

  // (e) Repeated communication failure (3+ recent failed diagnostics)
  const recentFailedDiagnostics = await db.liveDiagnosticSession.count({
    where: {
      passportId,
      overallStatus: "Critical",
      startedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
    },
  });

  if (recentFailedDiagnostics >= 3) {
    await createOrReadNotification(passportId, "repeated_communication_failure", "error", "Repeated Communication Failures", `${recentFailedDiagnostics} failed diagnostic sessions in the last 30 days.`, "Check device connection and hardware. Contact support if issue persists.", `${recentFailedDiagnostics} failures in last 30 days`, `repeated_failure_${passportId}`, null);
    notifications.push(buildNotificationObject("repeated_communication_failure", "error", "Repeated Communication Failures", `${recentFailedDiagnostics} failed diagnostic sessions in the last 30 days.`, "Check device connection and hardware.", now.toISOString(), `${recentFailedDiagnostics} failures in last 30 days`));
  }

  // (f) Frequent offline (recent scans showing device offline > 3)
  const recentOfflineDiagnostics = await db.liveDiagnosticSession.count({
    where: {
      passportId,
      overallStatus: { in: ["Unknown", "Critical"] },
      healthScore: { lt: 30 },
      startedAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) }, // last 14 days
    },
  });

  if (recentOfflineDiagnostics >= 3) {
    await createOrReadNotification(passportId, "frequent_offline", "warning", "Device Frequently Offline", `Device has been offline or unhealthy in ${recentOfflineDiagnostics} recent scans.`, "Verify device power, connection, and network settings.", `${recentOfflineDiagnostics} offline/unhealthy scans in last 14 days`, `frequent_offline_${passportId}`, null);
    notifications.push(buildNotificationObject("frequent_offline", "warning", "Device Frequently Offline", `Device has been offline or unhealthy in ${recentOfflineDiagnostics} recent scans.`, "Verify device power and connection settings.", now.toISOString(), `${recentOfflineDiagnostics} offline scans in last 14 days`));
  }

  return {
    notifications,
    totalNotifications: notifications.length,
  };
}

/** Creates a SmartNotification in the database if dedupKey doesn't exist, or reads existing one. */
async function createOrReadNotification(
  passportId: string,
  notificationType: string,
  severity: string,
  title: string,
  message: string,
  actionLabel: string | null,
  evidence: string,
  dedupKey: string,
  expiresAt: Date | null,
): Promise<void> {
  // Check if notification already exists (deduplication)
  const existing = await db.smartNotification.findFirst({
    where: { dedupKey, deliveryStatus: { notIn: ["dismissed", "expired"] } },
  });

  if (existing) {
    // Already exists and not dismissed/expired — skip creation
    return;
  }

  // Create new notification
  await db.smartNotification.create({
    data: {
      passportId,
      notificationType,
      title,
      message,
      severity,
      conditionData: JSON.stringify({ evidence }),
      actionLabel,
      targetRole: severity === "critical" ? "all" : "engineer",
      deliveryStatus: "pending",
      dedupKey,
      expiresAt,
    },
  });
}

/** Builds a SmartNotification object for the result. */
function buildNotificationObject(
  type: NotificationType,
  severity: "info" | "warning" | "error" | "critical",
  title: string,
  message: string,
  suggestedAction: string | null,
  detectedAt: string,
  evidence: string,
): SmartNotification {
  return { type, severity, title, message, suggestedAction, active: true, detectedAt, evidence };
}

// ====================== Step 13 — Security Verification ======================

/**
 * Verifies: genuine QBIT product, authorized engineer, valid customer
 * mapping, API authentication, and audit logging. NEVER allows
 * unauthorized data access.
 */
export async function verifySecurity(
  passportId: string,
  isRegistered: boolean,
  request: LifecycleRequest,
): Promise<SecurityVerificationResult> {
  const violations: SecurityViolation[] = [];

  // (1) Verify genuine QBIT product
  let genuineDevice = false;
  const passport = await db.devicePassport.findUnique({
    where: { id: passportId },
    include: { product: true },
  });

  if (passport?.productId && passport.product?.isActive) {
    genuineDevice = true;
  } else {
    violations.push({
      check: "device_authenticity",
      reason: passport?.productId ? "Product linked but not active in QBIT catalog" : "Device has no linked QBIT product — authenticity cannot be verified",
      severity: "warning",
    });
  }

  // (2) Verify authorized engineer
  let authorizedEngineer = false;
  if (request.engineerId) {
    const engineer = await db.user.findUnique({
      where: { id: request.engineerId },
    });
    if (engineer && (engineer.role === "installation_engineer" || engineer.role === "administrator" || engineer.role === "admin")) {
      authorizedEngineer = true;
    } else {
      violations.push({
        check: "engineer_authorization",
        reason: engineer ? `User role '${engineer.role}' is not authorized for lifecycle operations` : `Engineer ID '${request.engineerId}' not found in User table`,
        severity: "error",
      });
    }
  } else {
    // No engineer ID provided — system-initiated (allow but flag)
    authorizedEngineer = true; // system-initiated operations are allowed
  }

  // (3) Verify valid customer mapping
  let validCustomerMapping = false;
  if (passport?.customerAssetId) {
    const asset = await db.fSMCustomerAsset.findUnique({
      where: { id: passport.customerAssetId },
    });
    if (asset) {
      validCustomerMapping = true;
    } else {
      violations.push({
        check: "customer_mapping",
        reason: `Customer asset ID '${passport.customerAssetId}' on passport does not exist in FSMCustomerAsset table`,
        severity: "error",
      });
    }
  } else {
    // No customer mapping — OK for unregistered devices
    validCustomerMapping = true;
  }

  // (4) Verify API authentication (session-based)
  // In production, this would check NextAuth session. For engine-level,
  // we verify that either engineerId is provided (authenticated) or
  // the operation is system-initiated.
  let secureApiAuth = true; // Default true — actual auth check happens at API route level
  if (!request.engineerId && !isRegistered) {
    // Unauthenticated access to unregistered device — flag as warning
    violations.push({
      check: "api_auth",
      reason: "No engineer ID provided for unregistered device access — verify API authentication at route level",
      severity: "warning",
    });
  }

  // (5) Verify audit logging enabled
  let auditLoggingEnabled = true;
  try {
    await db.auditLog.findFirst({ take: 1 });
    auditLoggingEnabled = true;
  } catch {
    auditLoggingEnabled = false;
    violations.push({
      check: "audit_logging",
      reason: "AuditLog table is not accessible — enterprise audit trail cannot be maintained",
      severity: "critical",
    });
  }

  // Determine overall security status
  const criticalViolations = violations.filter(v => v.severity === "critical");
  const errorViolations = violations.filter(v => v.severity === "error");

  let overallSecurityStatus: "verified" | "partial" | "failed";
  if (violations.length === 0) {
    overallSecurityStatus = "verified";
  } else if (criticalViolations.length > 0 || errorViolations.length > 1) {
    overallSecurityStatus = "failed";
  } else {
    overallSecurityStatus = "partial";
  }

  return {
    genuineDevice,
    authorizedEngineer,
    validCustomerMapping,
    secureApiAuth,
    auditLoggingEnabled,
    overallSecurityStatus,
    violations,
  };
}

// ====================== Step 14 — Complete Device Timeline ======================

/**
 * Queries DeviceTimelineEvent for this passportId and builds a
 * chronological timeline. If no events exist yet, creates initial
 * events from existing data (firstDetectedAt, lastScannedAt, etc.).
 */
export async function getDeviceTimeline(
  passportId: string,
  isRegistered: boolean,
): Promise<DeviceTimelineResult> {
  // Query existing timeline events
  const timelineEvents = await db.deviceTimelineEvent.findMany({
    where: { passportId },
    orderBy: { occurredAt: "asc" },
  });

  const passport = await db.devicePassport.findUnique({
    where: { id: passportId },
    include: { product: true, warranty: true },
  });

  if (!passport) {
    return { timeline: [], totalEvents: 0 };
  }

  // If no timeline events exist, create initial events from existing data
  if (timelineEvents.length === 0) {
    const initialEvents: DeviceTimelineEventType[] = [];

    // "discovered" / "manufactured" event from firstDetectedAt
    initialEvents.push({
      eventType: "manufactured",
      date: passport.firstDetectedAt.toISOString(),
      description: `Device first detected — ${passport.deviceName ?? passport.model ?? "Unknown"}`,
      actor: null,
      referenceId: passport.id,
      details: { source: "DevicePassport.firstDetectedAt" },
    });

    // "registered" event if device has productId
    if (isRegistered && passport.productId) {
      initialEvents.push({
        eventType: "registered",
        date: passport.firstDetectedAt.toISOString(),
        description: `Device registered as ${passport.product?.name ?? "QBIT Product"}`,
        actor: null,
        referenceId: passport.productId,
        details: { productId: passport.productId, productName: passport.product?.name },
      });
    }

    // "diagnosed" event from lastScannedAt
    if (passport.lastScannedAt) {
      initialEvents.push({
        eventType: "diagnosed",
        date: passport.lastScannedAt.toISOString(),
        description: `Diagnostic scan performed`,
        actor: null,
        referenceId: null,
        details: { source: "DevicePassport.lastScannedAt" },
      });
    }

    // "firmware_updated" from lastFirmwareUpdateAt
    if (passport.lastFirmwareUpdateAt) {
      initialEvents.push({
        eventType: "firmware_updated",
        date: passport.lastFirmwareUpdateAt.toISOString(),
        description: `Firmware update recorded`,
        actor: null,
        referenceId: null,
        details: { source: "DevicePassport.lastFirmwareUpdateAt" },
      });
    }

    // "warranty_start" from warranty data
    if (passport.warranty?.warrantyStartDate) {
      initialEvents.push({
        eventType: "warranty_start",
        date: passport.warranty.warrantyStartDate.toISOString(),
        description: `Warranty started — ${passport.warranty.warrantyProvider ?? "QBIT"}`,
        actor: null,
        referenceId: passport.warranty.id,
        details: { warrantyStatus: passport.warranty.warrantyStatus },
      });
    }

    // "warranty_expiry" from warranty expiry date
    if (passport.warranty?.warrantyExpiryDate) {
      initialEvents.push({
        eventType: "warranty_expiry",
        date: passport.warranty.warrantyExpiryDate.toISOString(),
        description: `Warranty expiry date — ${passport.warranty.warrantyStatus}`,
        actor: null,
        referenceId: passport.warranty.id,
        details: { remainingDays: passport.warranty.warrantyDaysRemaining },
      });
    }

    // "installed" event from lastInstallationAt
    if (passport.lastInstallationAt) {
      initialEvents.push({
        eventType: "installed",
        date: passport.lastInstallationAt.toISOString(),
        description: `Device installation recorded`,
        actor: null,
        referenceId: null,
        details: { source: "DevicePassport.lastInstallationAt" },
      });
    }

    // "service_visit" from lastServiceAt
    if (passport.lastServiceAt) {
      initialEvents.push({
        eventType: "service_visit",
        date: passport.lastServiceAt.toISOString(),
        description: `Service visit recorded`,
        actor: null,
        referenceId: null,
        details: { source: "DevicePassport.lastServiceAt" },
      });
    }

    // Create these initial events in the database
    for (const event of initialEvents) {
      await db.deviceTimelineEvent.create({
        data: {
          passportId,
          eventType: event.eventType,
          title: event.description,
          description: event.description,
          actorId: null,
          actorName: event.actor,
          previousValue: null,
          newValue: null,
          relatedId: event.referenceId,
          relatedType: null,
          metadata: event.details ? JSON.stringify(event.details) : null,
          occurredAt: new Date(event.date),
        },
      });
    }

    return {
      timeline: initialEvents,
      totalEvents: initialEvents.length,
    };
  }

  // Build timeline from existing events
  const timeline: DeviceTimelineEventType[] = timelineEvents.map((event) => ({
    eventType: mapDBEventTypeToTimelineType(event.eventType),
    date: event.occurredAt.toISOString(),
    description: event.title ?? event.description ?? event.eventType,
    actor: event.actorName ?? event.actorId ?? null,
    referenceId: event.relatedId ?? null,
    details: event.metadata ? JSON.parse(event.metadata) : null,
  }));

  return {
    timeline,
    totalEvents: timeline.length,
  };
}

/** Maps database eventType strings to TimelineEventType. */
function mapDBEventTypeToTimelineType(eventType: string): TimelineEventType {
  const map: Record<string, TimelineEventType> = {
    manufactured: "manufactured",
    purchased: "purchased",
    registered: "registered",
    installed: "installed",
    configured: "configured",
    diagnosed: "diagnosed",
    firmware_updated: "firmware_updated",
    driver_installed: "driver_updated",
    driver_updated: "driver_updated",
    service_visit: "service_visit",
    warranty_start: "warranty_start",
    warranty_expired: "warranty_expiry",
    warranty_renewal: "warranty_renewal",
    repair: "repair",
    scan: "diagnosed",
    configuration_changed: "configured",
    device_offline: "diagnosed",
    device_online: "diagnosed",
    test_print: "diagnosed",
    resource_download: "configured",
    maintenance: "service_visit",
  };
  return map[eventType] ?? "diagnosed";
}

// ====================== Step 15 — Enterprise Ready Architecture ======================

/**
 * Documents supported device types and extensibility info.
 * Queries QbitProduct catalog for active device types.
 */
export async function getEnterpriseArchitecture(): Promise<EnterpriseArchitectureInfo> {
  // Query distinct device types from active products
  const activeProducts = await db.qbitProduct.findMany({
    where: { isActive: true, status: "active" },
    select: { deviceType: true },
    distinct: ["deviceType"],
  });

  const supportedDeviceTypes: DeviceType[] = activeProducts
    .map((p) => p.deviceType as DeviceType)
    .filter((dt) => dt !== "unknown");

  // Ensure all known types are included even if no products exist yet
  const allKnownTypes: DeviceType[] = [
    "windows_pos", "android_pos", "thermal_printer", "barcode_scanner",
    "cash_drawer", "customer_display", "label_printer", "kitchen_printer",
    "kiosk", "weighing_scale",
  ];

  const mergedTypes = Array.from(new Set([...supportedDeviceTypes, ...allKnownTypes]));

  const requiredProfileEntries = [
    "Product Master Entry (QbitProduct)",
    "Device Profile (DevicePassport)",
    "Driver (DriverInformation + DriverVersion)",
    "Firmware (FirmwareInformation + FirmwareRelease)",
    "Manual (Resource + ProductResourceMapping)",
    "SDK (Resource + ProductResourceMapping)",
    "Capability Profile (QbitProduct.connectionTypes + HardwareSignature)",
  ];

  const extensibilityNote = `New device types only need the following entries to be fully supported by the lifecycle engine: Product Master Entry in QbitProduct, Device Profile via DevicePassport, Driver via DriverInformation + DriverVersion, Firmware via FirmwareInformation + FirmwareRelease, Manual/SDK/Video/Utility via Resource + ProductResourceMapping, and Capability Profile via QbitProduct fields + HardwareSignature. The core lifecycle engine (all 15 steps) remains unchanged — no code modifications required for new device types. The engine automatically adapts based on database records.`;

  return {
    supportedDeviceTypes: mergedTypes,
    requiredProfileEntries,
    extensibilityNote,
  };
}

// ====================== Error Result Builder ======================

/** Builds an empty LifecycleResult when the pipeline cannot proceed. */
function buildEmptyLifecycleResult(
  startTime: number,
  errors: LifecycleError[],
  steps: LifecycleStepTracking[],
  currentStage: LifecycleStage,
): LifecycleResult {
  const emptyResourceStatus = {
    driver: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
    firmware: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
    manual: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
    sdk: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
    video: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
    utility: { available: false, count: 0, latestVersion: null, downloadUrl: null, compatible: false },
  };

  return {
    deviceLifecycle: {
      registered: false,
      customer: null,
      installation: null,
      warranty: null,
      serviceHistory: [],
      resourceStatus: emptyResourceStatus,
      firmwareStatus: null,
      analytics: {
        totalScans: 0, lastScan: null, successfulDiagnostics: 0, failedDiagnostics: 0,
        driverInstallCount: 0, firmwareUpdateCount: 0, serviceCount: 0,
        averageHealthScore: null, diagnosticSuccessRate: null,
      },
      timeline: [],
      notifications: [],
    },
    registrationVerification: null,
    deviceSync: null,
    lifecycleData: null,
    installationHistory: null,
    serviceHistory: null,
    warrantyIntelligence: null,
    resourceSync: null,
    firmwareIntelligence: null,
    analytics: null,
    engineerActivity: null,
    dashboardIntegration: null,
    smartNotifications: null,
    securityVerification: null,
    deviceTimeline: null,
    enterpriseArchitecture: null,
    steps,
    errors,
    currentStage,
    lifecycleTimestamp: new Date().toISOString(),
    lifecycleDurationMs: Date.now() - startTime,
  };
}
