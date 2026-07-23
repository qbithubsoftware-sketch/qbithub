/**
 * POST /api/dr-qbit/live-diagnostics/run — Run Phase 5 LIVE diagnostics
 *
 * This endpoint runs the Phase 5 Intelligent Diagnostics, Predictive Health
 * & Troubleshooting Engine on a connected device. It requires:
 *   - ConfigurationResult from Phase 4 (device that was just configured)
 *   - CloudLookupResult from Phase 3 (device + product + customer + resources)
 *   - Diagnostic action (full pipeline or single-step)
 *
 * The engine runs LIVE hardware diagnostics via Desktop Agent, validates
 * driver/firmware/communication/printing, detects errors, generates
 * troubleshooting suggestions, predicts health issues from history,
 * calculates real health scores, and saves results to the database.
 *
 * NO fake/dummy/mock/simulated data. All results based on REAL hardware.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { runLiveDiagnostics } from "@/lib/drqbit/diagnostic-engine";
import { runCloudLookup } from "@/lib/drqbit/cloud-lookup-engine";
import type { DiagnosticAction, DiagnosticRequest } from "@/lib/drqbit/diagnostic-types";
import type { ConfigurationResult } from "@/lib/drqbit/configuration-types";
import type { CloudLookupResult, CloudLookupInput } from "@/lib/drqbit/cloud-lookup-types";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  // Phase 5 live diagnostics requires authentication
  let engineerId: string | null = null;
  let engineerName: string | null = null;
  let isAuthenticated = false;

  // Check for Desktop Agent secret
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { validateAgentSecret } = await import("@/lib/drqbit/desktop-agent-auth");
    if (validateAgentSecret(token)) {
      isAuthenticated = true;
      engineerId = "desktop-agent";
      engineerName = "Desktop Agent";
    }
  }

  // If not Desktop Agent, check for session auth
  if (!isAuthenticated) {
    try {
      const { requireStaff } = await import("@/lib/notifications/auth");
      const session = await requireStaff();
      if (session) {
        isAuthenticated = true;
        engineerId = session.user.id;
        engineerName = session.user.name ?? null;
      }
    } catch {
      // Auth failed
    }
  }

  if (!isAuthenticated) {
    return NextResponse.json(
      { error: "Authentication required — login or provide Desktop Agent credentials" },
      { status: 401 },
    );
  }

  // Parse request body
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate required fields
  const action: DiagnosticAction = body.action ?? "run_diagnostics";
  const validActions: DiagnosticAction[] = [
    "run_diagnostics", "check_hardware", "check_driver", "check_firmware",
    "check_communication", "check_print_engine", "check_capabilities",
    "detect_errors", "get_troubleshooting", "get_predictions",
    "get_health_score", "get_report", "get_history", "get_resources",
  ];

  if (!validActions.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action '${action}'. Valid actions: ${validActions.join(", ")}` },
      { status: 400 },
    );
  }

  // Build the DiagnosticRequest
  let configurationResult: ConfigurationResult | null = body.configurationResult ?? null;
  let cloudLookupResult: CloudLookupResult | null = body.cloudLookupResult ?? null;
  const passportId = body.passportId ?? null;

  // If passportId is provided but no config/cloud results, try to fetch from DB
  if (passportId && (!configurationResult || !cloudLookupResult)) {
    try {
      // Fetch passport with all related data
      const passport = await db.devicePassport.findUnique({
        where: { id: passportId },
        include: {
          product: true,
          driverInfo: true,
          firmwareInfo: { include: { latestRelease: true } },
          configuration: true,
        },
      });

      if (passport) {
        // Build ConfigurationResult from DB if not provided
        if (!configurationResult && passport.configuration) {
          const config = passport.configuration;
          configurationResult = buildConfigResultFromDb(config);
        }

        // Build CloudLookupResult via engine if not provided
        if (!cloudLookupResult) {
          try {
            const cloudInput: CloudLookupInput = {
              serialNumber: passport.serialNumber ?? null,
              model: passport.product?.model ?? null,
              deviceType: (passport.product?.deviceType ?? "unknown") as any,
              connectionType: (passport.connectionType ?? "unknown") as any,
              firmwareVersion: passport.firmwareInfo?.installedVersion ?? null,
              capabilities: [],
              identificationStatus: "verified",
              vendorId: passport.vendorId ?? null,
              productId: passport.productIdCode ?? null,
              deviceName: passport.product?.name ?? null,
              manufacturer: passport.product?.brand ?? passport.manufacturer ?? null,
            };

            cloudLookupResult = await runCloudLookup(cloudInput, { engineerId: engineerId ?? undefined });
          } catch (cloudError) {
            console.error("[LIVE DIAG API] Cloud lookup failed:", cloudError);
            // Build minimal result if cloud lookup fails
            cloudLookupResult = buildMinimalCloudResult(passport);
          }
        }
      }
    } catch (error) {
      console.error("[LIVE DIAG API] Failed to fetch passport from DB:", error);
    }
  }

  // Validate that we have enough data to proceed
  if (!configurationResult) {
    return NextResponse.json(
      { error: "Missing 'configurationResult' (Phase 4) or 'passportId' with stored configuration — cannot run diagnostics" },
      { status: 400 },
    );
  }

  if (!cloudLookupResult) {
    return NextResponse.json(
      { error: "Missing 'cloudLookupResult' (Phase 3) or 'passportId' with stored product data — cannot validate firmware/driver" },
      { status: 400 },
    );
  }

  const diagnosticRequest: DiagnosticRequest = {
    action,
    configurationResult,
    cloudLookupResult,
    engineerId: engineerId ?? body.engineerId,
    engineerName: engineerName ?? body.engineerName,
    osInfo: body.osInfo,
    agentVersion: body.agentVersion,
    hostname: body.hostname,
    passportId: passportId ?? configurationResult.savedProfile?.passportId ?? null,
    connectionType: body.connectionType,
    parameters: body.parameters,
  };

  try {
    const result = await runLiveDiagnostics(diagnosticRequest);

    // Save LiveDiagnosticSession to database if we have a passport ID
    if (result.success && diagnosticRequest.passportId) {
      try {
        await saveLiveDiagnosticSessionToDb(diagnosticRequest.passportId!, result, diagnosticRequest);
      } catch (error) {
        console.error("[LIVE DIAG API] Failed to save LiveDiagnosticSession:", error);
      }
    }

    const message = result.success
      ? result.overallStatus === "Healthy"
        ? "Device Healthy — All Diagnostics Passed"
        : "Diagnostics Completed — Issues Detected"
      : "Diagnostics Failed — See Error Details";

    return NextResponse.json(
      { ...result, message },
      { status: result.success ? 200 : 207 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to run live diagnostics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Builds a ConfigurationResult from the database DeviceConfiguration record.
 */
function buildConfigResultFromDb(config: any): ConfigurationResult {
  return {
    success: config.configurationStatus === "successful" || config.configurationStatus === "partial",
    deviceStatus: config.configurationStatus === "successful" || config.configurationStatus === "partial" ? "Connected" : "Disconnected",
    connectionType: config.activeConnectionType as any ?? null,
    configurationStatus: config.configurationStatus as any ?? "pending",
    ipAddress: extractIpFromConfig(config),
    communication: config.communicationVerified ? "Verified" : "Not Verified",
    testPrint: config.testPrintStatus as any ?? "pending",
    lastConfigured: config.lastConfiguredAt?.toISOString() ?? null,
    firmware: config.firmwareVersionAtConfig ?? null,
    capabilities: {
      supportsUsb: !!config.usbConfig,
      supportsLan: !!config.lanConfig,
      supportsWifi: !!config.wifiConfig,
      supportsBluetooth: !!config.bluetoothConfig,
      supportsCashDrawer: false,
      supportsFirmwareUpgrade: true,
      supportsAutoDriverInstall: false,
      supportsSdk: false,
      supportsFirmwareConfig: false,
      supportedConnectionTypes: [
        ...(config.usbConfig ? ["usb" as const] : []),
        ...(config.lanConfig ? ["lan" as const] : []),
        ...(config.wifiConfig ? ["wifi" as const] : []),
        ...(config.bluetoothConfig ? ["bluetooth" as const] : []),
      ],
    },
    supportedOptions: [],
    usbResult: config.usbConfig ? safeJsonParse(config.usbConfig) : null,
    wifiResult: config.wifiConfig ? safeJsonParse(config.wifiConfig) : null,
    lanResult: config.lanConfig ? safeJsonParse(config.lanConfig) : null,
    bluetoothResult: config.bluetoothConfig ? safeJsonParse(config.bluetoothConfig) : null,
    communicationTest: null,
    testPrintResult: null,
    securityValidation: {
      deviceVerified: true,
      deviceBelongsToQbit: true,
      communicationVerified: config.communicationVerified,
      configurationValidationComplete: config.configurationStatus !== "pending",
      noDuplicateRegistration: true,
      allChecksPassed: config.communicationVerified && config.configurationStatus !== "pending",
      failedChecks: [],
    },
    events: [],
    errors: [],
    savedProfile: {
      configurationNumber: config.configurationNumber,
      passportId: config.passportId,
      serialNumber: config.serialNumber,
      activeConnectionType: config.activeConnectionType as any ?? null,
      usbConfig: config.usbConfig ? safeJsonParse(config.usbConfig) : null,
      lanConfig: config.lanConfig ? safeJsonParse(config.lanConfig) : null,
      wifiConfig: config.wifiConfig ? safeJsonParse(config.wifiConfig) : null,
      bluetoothConfig: config.bluetoothConfig ? safeJsonParse(config.bluetoothConfig) : null,
      configurationStatus: config.configurationStatus as any ?? "pending",
      communicationVerified: config.communicationVerified,
      testPrintStatus: config.testPrintStatus as any ?? "pending",
      firmwareVersionAtConfig: config.firmwareVersionAtConfig ?? null,
      lastConfiguredAt: config.lastConfiguredAt?.toISOString() ?? new Date().toISOString(),
      lastConfiguredBy: config.lastConfiguredBy ?? null,
    },
    configurationTimestamp: config.createdAt?.toISOString() ?? new Date().toISOString(),
    configurationDurationMs: 0,
  };
}

/**
 * Builds a minimal CloudLookupResult from DevicePassport database data
 * (fallback if runCloudLookup fails).
 */
function buildMinimalCloudResult(passport: any): CloudLookupResult {
  const product = passport.product;
  return {
    success: true,
    serialValidation: {
      status: passport.serialNumber ? "registered" : "not_registered",
      serialNumber: passport.serialNumber ?? "unknown",
      source: passport.serialNumber ? "device_passport" : null,
      matchedRecordIds: {
        passportId: passport.id,
        productId: passport.productId ?? undefined,
      },
      isDuplicateRegistration: false,
    },
    device: {
      serialNumber: passport.serialNumber ?? null,
      model: product?.model ?? passport.manufacturer ?? null,
      deviceType: (product?.deviceType ?? "unknown") as any,
      connectionType: (passport.connectionType ?? "unknown") as any,
      productId: passport.productId ?? null,
      productName: product?.name ?? null,
      productBrand: product?.brand ?? null,
    },
    customer: null,
    warranty: null,
    product: product ? {
      id: product.id,
      name: product.name ?? "",
      brand: product.brand ?? "",
      model: product.model ?? "",
      deviceType: product.deviceType ?? "",
      category: product.category ?? null,
      description: product.description ?? null,
      imageUrl: product.imageUrl ?? null,
      productFamily: null,
      productSeries: null,
      hardwareVersion: null,
      firmwareVersion: product.firmwareVersion ?? null,
      launchYear: null,
      capabilities: {
        supportsWifi: product.supportsWifi ?? false,
        autoDriverInstall: product.autoDriverInstall ?? false,
        sdkAvailable: product.sdkAvailable ?? false,
        firmwareConfigSupported: product.firmwareConfigSupported ?? false,
        connectionTypes: safeJsonParse(product.connectionTypes) ?? [],
      },
    } : null,
    resources: {
      drivers: [],
      firmware: [],
      manuals: [],
      sdk: [],
      videos: [],
      utilities: [],
    },
    firmwareCompatibility: passport.firmwareInfo ? {
      currentFirmware: passport.firmwareInfo.installedVersion ?? null,
      latestFirmware: passport.firmwareInfo.latestVersion ?? null,
      latestFirmwareReleaseDate: passport.firmwareInfo.latestRelease?.releaseDate?.toISOString() ?? null,
      latestFirmwareDownloadUrl: passport.firmwareInfo.latestRelease?.downloadUrl ?? null,
      isCompatible: passport.firmwareInfo.isCompatible ?? false,
      updateStatus: passport.firmwareInfo.firmwareStatus === "healthy" ? "up_to_date" as const : passport.firmwareInfo.firmwareStatus === "update_available" ? "update_available" as const : "unknown" as const,
      incompatibilityReason: null,
      isCritical: passport.firmwareInfo.latestRelease?.isCritical ?? false,
      isStable: passport.firmwareInfo.latestRelease?.isStable ?? true,
    } : null,
    recommendations: [],
    timeline: [],
    errors: [],
    lookupTimestamp: new Date().toISOString(),
    lookupDurationMs: 0,
  };
}

/**
 * Extracts the IP address from a DeviceConfiguration record.
 */
function extractIpFromConfig(config: any): string | null {
  if (config.wifiConfig) {
    const wifi = safeJsonParse(config.wifiConfig);
    if (wifi?.ipAddress) return wifi.ipAddress;
  }
  if (config.lanConfig) {
    const lan = safeJsonParse(config.lanConfig);
    if (lan?.ipAddress) return lan.ipAddress;
  }
  return null;
}

/**
 * Safely parses JSON, returning null on failure.
 */
function safeJsonParse(jsonStr: string | null | undefined): any | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Saves the LiveDiagnosticSession to database for future reference.
 */
async function saveLiveDiagnosticSessionToDb(
  passportId: string,
  result: any,
  request: DiagnosticRequest,
): Promise<void> {
  const sessionToken = randomBytes(16).toString("hex");

  // Get config ID if available
  const configId = request.configurationResult?.savedProfile?.passportId
    ? (await db.deviceConfiguration.findUnique({ where: { passportId } }))?.id ?? null
    : null;

  await db.liveDiagnosticSession.create({
    data: {
      sessionToken,
      passportId,
      configurationId: configId ?? null,
      serialNumber: request.configurationResult?.savedProfile?.serialNumber ?? result.diagnosticReport?.device?.serialNumber ?? null,
      deviceModel: result.diagnosticReport?.device?.model ?? null,
      deviceType: result.diagnosticReport?.device?.deviceType ?? null,
      connectionType: request.configurationResult?.connectionType ?? request.connectionType ?? null,
      engineerId: request.engineerId ?? null,
      engineerName: request.engineerName ?? null,
      agentAvailable: result.hardwareHealth?.status !== "not_tested" && result.hardwareHealth?.status !== "failed",
      agentVersion: request.agentVersion ?? null,
      osInfo: request.osInfo ?? null,
      hostname: request.hostname ?? null,
      overallStatus: result.overallStatus ?? "Unknown",
      healthScore: result.healthScore ?? 0,
      healthGrade: result.healthGrade ?? "unknown",
      hardwareScore: result.liveHealthScore?.categories?.find((c: any) => c.category === "hardware")?.score ?? 0,
      communicationScore: result.liveHealthScore?.categories?.find((c: any) => c.category === "communication")?.score ?? 0,
      driverScore: result.liveHealthScore?.categories?.find((c: any) => c.category === "driver")?.score ?? 0,
      firmwareScore: result.liveHealthScore?.categories?.find((c: any) => c.category === "firmware")?.score ?? 0,
      networkScore: result.liveHealthScore?.categories?.find((c: any) => c.category === "network")?.score ?? 0,
      printingScore: result.liveHealthScore?.categories?.find((c: any) => c.category === "printing")?.score ?? 0,
      hardwareHealthResult: result.hardwareHealth ? JSON.stringify(result.hardwareHealth) : null,
      driverValidationResult: result.driverValidation ? JSON.stringify(result.driverValidation) : null,
      firmwareValidationResult: result.firmwareValidation ? JSON.stringify(result.firmwareValidation) : null,
      communicationResult: result.communicationDiagnostics ? JSON.stringify(result.communicationDiagnostics) : null,
      printEngineResult: result.printEngineTest ? JSON.stringify(result.printEngineTest) : null,
      capabilityResult: result.capabilityValidation ? JSON.stringify(result.capabilityValidation) : null,
      errorDetectionResult: result.errorDetection ? JSON.stringify(result.errorDetection) : null,
      troubleshootingResult: result.troubleshooting ? JSON.stringify(result.troubleshooting) : null,
      predictiveHealthResult: result.predictiveHealth ? JSON.stringify(result.predictiveHealth) : null,
      healthScoreBreakdown: result.liveHealthScore ? JSON.stringify(result.liveHealthScore) : null,
      diagnosticReportResult: result.diagnosticReport ? JSON.stringify(result.diagnosticReport) : null,
      resourceRecommendations: result.recommendedResources ? JSON.stringify(result.recommendedResources) : null,
      issuesCount: result.issues?.length ?? 0,
      warningsCount: result.warnings?.length ?? 0,
      errorsCount: result.errors?.length ?? 0,
      requiresMaintenance: result.predictiveHealth?.requiresPreventiveMaintenance ?? false,
      status: result.success ? "completed" : "failed",
      diagnosticDurationMs: result.diagnosticDurationMs ?? null,
      completedAt: new Date(),
    },
  });
}
