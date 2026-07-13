/**
 * Diagnostics Engine — the core analysis engine.
 *
 * Analyzes a device passport + driver info + firmware info + connection data
 * and produces:
 *   1. DiagnosticFindings (confirmed or possible — NEVER guessed)
 *   2. DiagnosticRecommendations (linked to KB articles + resources)
 *   3. HealthScore (per-category + overall, based on documented rules)
 *
 * SAFETY: The engine NEVER invents hardware failures. It NEVER claims physical
 * damage unless reported by the device. If certainty is low, it displays
 * "Possible Cause" or "Unable to Confirm".
 */

import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";
import {
  type DiagnosticCategory,
  type FindingSeverity,
  type CertaintyLevel,
  type HealthGrade,
  type RecommendationAction,
  type RecommendationPriority,
  gradeFromScore,
} from "./types";

interface RunDiagnosticsArgs {
  passportId: string;
  engineerId?: string;
  engineerName?: string;
  agentVersion?: string;
  osInfo?: string;
  hostname?: string;
}

interface FindingInput {
  category: DiagnosticCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  certainty: CertaintyLevel;
  evidence: string[];
  recommendedAction?: string;
}

interface RecommendationInput {
  findingIndex?: number;
  title: string;
  description?: string;
  actionType: RecommendationAction;
  resourceUrl?: string;
  resourceScreen?: string;
  priority: RecommendationPriority;
}

interface AnalysisResult {
  findings: FindingInput[];
  recommendations: RecommendationInput[];
  scores: {
    driver: number;
    firmware: number;
    connection: number;
    deviceStatus: number;
    compatibility: number;
    knowledge: number;
  };
}

/**
 * Runs a full diagnostic analysis on a device passport.
 * Creates a DiagnosticSession + Findings + Recommendations + HealthScore.
 */
export async function runDiagnostics(args: RunDiagnosticsArgs): Promise<{
  sessionId: string;
  sessionToken: string;
  overallScore: number;
  healthGrade: HealthGrade;
  findingsCount: number;
  recommendationsCount: number;
}> {
  const startTime = Date.now();

  // Fetch passport with all related data
  const passport = await db.devicePassport.findUnique({
    where: { id: args.passportId },
    include: {
      product: true,
      driverInfo: true,
      firmwareInfo: { include: { latestRelease: true } },
    },
  });

  if (!passport) {
    throw new Error("Device passport not found");
  }

  // Run the analysis
  const analysis = analyzeDevice(passport);

  // Create the diagnostic session
  const sessionToken = randomBytes(16).toString("hex");
  const overallScore = computeOverallScore(analysis.scores);
  const healthGrade = gradeFromScore(overallScore);

  const session = await db.diagnosticSession.create({
    data: {
      sessionToken,
      passportId: args.passportId,
      engineerId: args.engineerId ?? null,
      engineerName: args.engineerName ?? null,
      agentVersion: args.agentVersion ?? null,
      osInfo: args.osInfo ?? null,
      hostname: args.hostname ?? null,
      scanDurationMs: Date.now() - startTime,
      overallScore,
      healthGrade,
      driverScore: analysis.scores.driver,
      firmwareScore: analysis.scores.firmware,
      connectionScore: analysis.scores.connection,
      deviceStatusScore: analysis.scores.deviceStatus,
      compatibilityScore: analysis.scores.compatibility,
      knowledgeScore: analysis.scores.knowledge,
      findingsCount: analysis.findings.length,
      confirmedCount: analysis.findings.filter((f) => f.certainty === "confirmed").length,
      possibleCount: analysis.findings.filter((f) => f.certainty === "possible").length,
      recommendationsCount: analysis.recommendations.length,
      status: "completed",
      completedAt: new Date(),
    },
  });

  // Create findings
  const findingIds: string[] = [];
  for (const f of analysis.findings) {
    const finding = await db.diagnosticFinding.create({
      data: {
        sessionId: session.id,
        category: f.category,
        severity: f.severity,
        title: f.title,
        description: f.description,
        certainty: f.certainty,
        evidence: JSON.stringify(f.evidence),
        recommendedAction: f.recommendedAction ?? null,
      },
    });
    findingIds.push(finding.id);
  }

  // Create recommendations
  for (const r of analysis.recommendations) {
    await db.diagnosticRecommendation.create({
      data: {
        sessionId: session.id,
        findingId: r.findingIndex !== undefined ? findingIds[r.findingIndex] : null,
        title: r.title,
        description: r.description ?? null,
        actionType: r.actionType,
        resourceUrl: r.resourceUrl ?? null,
        resourceScreen: r.resourceScreen ?? null,
        priority: r.priority,
      },
    });
  }

  // Create health score breakdown
  await db.healthScore.create({
    data: {
      sessionId: session.id,
      overallScore,
      overallGrade: healthGrade,
      driverScore: analysis.scores.driver,
      driverGrade: gradeFromScore(analysis.scores.driver),
      firmwareScore: analysis.scores.firmware,
      firmwareGrade: gradeFromScore(analysis.scores.firmware),
      connectionScore: analysis.scores.connection,
      connectionGrade: gradeFromScore(analysis.scores.connection),
      deviceStatusScore: analysis.scores.deviceStatus,
      deviceStatusGrade: gradeFromScore(analysis.scores.deviceStatus),
      compatibilityScore: analysis.scores.compatibility,
      compatibilityGrade: gradeFromScore(analysis.scores.compatibility),
      knowledgeScore: analysis.scores.knowledge,
      knowledgeGrade: gradeFromScore(analysis.scores.knowledge),
      scoringRules: JSON.stringify({
        driver: "100 if installed=latest, 60 if update_available, 20 if missing, 0 if unsupported",
        firmware: "100 if healthy, 50 if update_available, 20 if unsupported, 0 if unknown",
        connection: "100 if ready, 0 if offline, 50 if unknown",
        deviceStatus: "100 if ready, 50 if busy/paused, 0 if error/offline",
        compatibility: "100 if compatible, 0 if blocked, 50 if unchecked",
        knowledge: "100 if KB articles linked, 50 if partial, 0 if none",
      }),
    },
  });

  return {
    sessionId: session.id,
    sessionToken,
    overallScore,
    healthGrade,
    findingsCount: analysis.findings.length,
    recommendationsCount: analysis.recommendations.length,
  };
}

/**
 * Analyzes a device passport and produces findings + recommendations + scores.
 * This is the core rules engine — NEVER guesses, only uses confirmed data.
 */
function analyzeDevice(passport: {
  id: string;
  deviceStatus: string;
  connectionType: string | null;
  port: string | null;
  vendorId: string | null;
  productIdCode: string | null;
  hardwareId: string | null;
  osInfo: string | null;
  product: { name: string; model: string; deviceType: string; driverDownloadUrl: string | null; manualUrl: string | null; installationGuideUrl: string | null; knowledgeBaseUrl: string | null } | null;
  driverInfo: {
    installedDriverVersion: string | null;
    latestDriverVersion: string | null;
    driverStatus: string;
    installedDriverProvider: string | null;
  } | null;
  firmwareInfo: {
    installedVersion: string | null;
    latestVersion: string | null;
    firmwareStatus: string;
    isCompatible: boolean;
    compatibilityChecked: boolean;
    latestReleaseNotes: string | null;
  } | null;
}): AnalysisResult {
  const findings: FindingInput[] = [];
  const recommendations: RecommendationInput[] = [];

  // ========== DRIVER ANALYSIS ==========
  let driverScore = 100;
  const driverInfo = passport.driverInfo;

  if (!driverInfo) {
    findings.push({
      category: "driver",
      severity: "warning",
      title: "Driver Information Not Available",
      description: "Driver information could not be read from the device. This may indicate the device is not connected or the Desktop Agent could not query the driver store.",
      certainty: "unable_to_confirm",
      evidence: ["No DriverInformation record found for this passport"],
    });
    driverScore = 0;
  } else {
    switch (driverInfo.driverStatus) {
      case "missing":
        findings.push({
          category: "driver",
          severity: "error",
          title: "Driver Missing",
          description: `No driver is installed for this device. The latest available driver is v${driverInfo.latestDriverVersion ?? "unknown"}.`,
          certainty: "confirmed",
          evidence: [`Driver status: ${driverInfo.driverStatus}`, `Installed version: none`],
          recommendedAction: "Download and install the recommended driver",
        });
        recommendations.push({
          findingIndex: findings.length - 1,
          title: "Download Recommended Driver",
          description: `Download driver v${driverInfo.latestDriverVersion ?? "latest"} from the QBIT Driver Center`,
          actionType: "download_driver",
          resourceScreen: "driver-download-center",
          priority: "high",
        });
        recommendations.push({
          findingIndex: findings.length - 1,
          title: "Install Driver",
          description: "After downloading, install the driver and restart the print spooler",
          actionType: "restart_spooler",
          priority: "high",
        });
        driverScore = 20;
        break;

      case "update_available":
        findings.push({
          category: "driver",
          severity: "warning",
          title: "Driver Update Available",
          description: `Installed driver v${driverInfo.installedDriverVersion} is outdated. Latest version is v${driverInfo.latestDriverVersion}.`,
          certainty: "confirmed",
          evidence: [
            `Installed: v${driverInfo.installedDriverVersion}`,
            `Latest: v${driverInfo.latestDriverVersion}`,
            `Comparison: installed < latest`,
          ],
          recommendedAction: "Download and install the latest driver",
        });
        recommendations.push({
          findingIndex: findings.length - 1,
          title: "Download Latest Driver",
          description: `Update from v${driverInfo.installedDriverVersion} to v${driverInfo.latestDriverVersion}`,
          actionType: "download_driver",
          resourceScreen: "driver-download-center",
          priority: "normal",
        });
        driverScore = 60;
        break;

      case "unsupported":
        findings.push({
          category: "driver",
          severity: "error",
          title: "Unsupported Driver",
          description: "The installed driver is not supported by QBIT. This may cause compatibility issues.",
          certainty: "confirmed",
          evidence: [`Driver status: unsupported`, `Provider: ${driverInfo.installedDriverProvider ?? "unknown"}`],
          recommendedAction: "Download the QBIT-recommended driver",
        });
        recommendations.push({
          findingIndex: findings.length - 1,
          title: "Download Compatible Driver",
          description: "Replace the unsupported driver with the QBIT-recommended version",
          actionType: "download_driver",
          resourceScreen: "driver-download-center",
          priority: "high",
        });
        driverScore = 0;
        break;

      case "installed":
        findings.push({
          category: "driver",
          severity: "info",
          title: "Driver Up to Date",
          description: `Driver v${driverInfo.installedDriverVersion} is the latest available version.`,
          certainty: "confirmed",
          evidence: [
            `Installed: v${driverInfo.installedDriverVersion}`,
            `Latest: v${driverInfo.latestDriverVersion}`,
            `Comparison: installed = latest`,
          ],
        });
        driverScore = 100;
        break;
    }
  }

  // ========== FIRMWARE ANALYSIS ==========
  let firmwareScore = 100;
  const firmwareInfo = passport.firmwareInfo;

  if (!firmwareInfo) {
    findings.push({
      category: "firmware",
      severity: "warning",
      title: "Firmware Information Not Available",
      description: "Firmware information could not be read from the device.",
      certainty: "unable_to_confirm",
      evidence: ["No FirmwareInformation record found"],
    });
    firmwareScore = 0;
  } else {
    switch (firmwareInfo.firmwareStatus) {
      case "update_available":
        findings.push({
          category: "firmware",
          severity: "warning",
          title: "Firmware Update Available",
          description: `Installed firmware v${firmwareInfo.installedVersion} is outdated. Latest version is v${firmwareInfo.latestVersion}.`,
          certainty: "confirmed",
          evidence: [
            `Installed: v${firmwareInfo.installedVersion}`,
            `Latest: v${firmwareInfo.latestVersion}`,
          ],
          recommendedAction: "Check compatibility and download the latest firmware",
        });
        recommendations.push({
          findingIndex: findings.length - 1,
          title: "Download Latest Firmware",
          description: `Update firmware from v${firmwareInfo.installedVersion} to v${firmwareInfo.latestVersion}`,
          actionType: "download_firmware",
          resourceScreen: "dr-qbit-firmware",
          priority: "normal",
        });
        firmwareScore = 50;
        break;

      case "unsupported":
        findings.push({
          category: "firmware",
          severity: "error",
          title: "Unsupported Firmware Version",
          description: `Firmware v${firmwareInfo.installedVersion} is no longer supported.`,
          certainty: "confirmed",
          evidence: [`Firmware status: unsupported`, `Installed: v${firmwareInfo.installedVersion}`],
          recommendedAction: "Update to the latest supported firmware",
        });
        recommendations.push({
          findingIndex: findings.length - 1,
          title: "Download Supported Firmware",
          description: "Replace the unsupported firmware with a supported version",
          actionType: "download_firmware",
          resourceScreen: "dr-qbit-firmware",
          priority: "high",
        });
        firmwareScore = 20;
        break;

      case "unknown":
        findings.push({
          category: "firmware",
          severity: "info",
          title: "Firmware Version Unknown",
          description: "Firmware version could not be read from the device. This is common for some device types.",
          certainty: "unable_to_confirm",
          evidence: ["Firmware status: unknown", "Installed version: not available"],
        });
        firmwareScore = 0;
        break;

      case "healthy":
        findings.push({
          category: "firmware",
          severity: "info",
          title: "Firmware Up to Date",
          description: `Firmware v${firmwareInfo.installedVersion} is the latest available version.`,
          certainty: "confirmed",
          evidence: [
            `Installed: v${firmwareInfo.installedVersion}`,
            `Latest: v${firmwareInfo.latestVersion}`,
          ],
        });
        firmwareScore = 100;
        break;
    }
  }

  // ========== CONNECTION ANALYSIS ==========
  let connectionScore = 100;
  if (passport.connectionType) {
    findings.push({
      category: "connection",
      severity: "info",
      title: `${passport.connectionType.toUpperCase()} Connection Detected`,
      description: `Device is connected via ${passport.connectionType}${passport.port ? ` on ${passport.port}` : ""}.`,
      certainty: "confirmed",
      evidence: [
        `Connection type: ${passport.connectionType}`,
        `Port: ${passport.port ?? "auto"}`,
      ],
    });

    if (passport.deviceStatus === "offline") {
      findings.push({
        category: "connection",
        severity: "error",
        title: "Device Offline",
        description: `The device is connected but reporting as offline. This may indicate a power issue or communication failure.`,
        certainty: "confirmed",
        evidence: [`Device status: offline`, `Connection: ${passport.connectionType}`],
        recommendedAction: "Verify USB/LAN connection and power on the printer",
      });
      recommendations.push({
        findingIndex: findings.length - 1,
        title: "Verify Connection",
        description: "Check the USB/LAN cable connection and ensure the device is powered on",
        actionType: "verify_connection",
        priority: "high",
      });
      recommendations.push({
        findingIndex: findings.length - 1,
        title: "Power Cycle Device",
        description: "Turn the device off, wait 10 seconds, then turn it back on",
        actionType: "power_cycle",
        priority: "normal",
      });
      connectionScore = 0;
    }
  } else {
    findings.push({
      category: "connection",
      severity: "warning",
      title: "Connection Type Unknown",
      description: "The connection type could not be determined for this device.",
      certainty: "unable_to_confirm",
      evidence: ["Connection type: null"],
    });
    connectionScore = 50;
  }

  // ========== DEVICE STATUS ANALYSIS ==========
  let deviceStatusScore = 100;
  switch (passport.deviceStatus) {
    case "ready":
      findings.push({
        category: "device_status",
        severity: "info",
        title: "Device Ready",
        description: "The device is reporting a ready status.",
        certainty: "confirmed",
        evidence: [`Device status: ${passport.deviceStatus}`],
      });
      deviceStatusScore = 100;
      break;

    case "driver_missing":
      findings.push({
        category: "device_status",
        severity: "error",
        title: "Device Not Ready — Driver Missing",
        description: "The device cannot function because no driver is installed.",
        certainty: "confirmed",
        evidence: [`Device status: ${passport.deviceStatus}`],
        recommendedAction: "Install the recommended driver",
      });
      deviceStatusScore = 0;
      break;

    case "driver_outdated":
      findings.push({
        category: "device_status",
        severity: "warning",
        title: "Device Not Ready — Driver Outdated",
        description: "The device may not function correctly with the outdated driver.",
        certainty: "confirmed",
        evidence: [`Device status: ${passport.deviceStatus}`],
        recommendedAction: "Update to the latest driver",
      });
      deviceStatusScore = 50;
      break;

    case "unsupported":
      findings.push({
        category: "device_status",
        severity: "error",
        title: "Unsupported Device",
        description: "This device is not supported by the QBIT system.",
        certainty: "confirmed",
        evidence: [`Device status: ${passport.deviceStatus}`],
        recommendedAction: "Contact QBIT support for assistance",
      });
      recommendations.push({
        findingIndex: findings.length - 1,
        title: "Contact Support",
        description: "This device may need manual configuration or is not yet supported",
        actionType: "contact_support",
        priority: "high",
      });
      deviceStatusScore = 0;
      break;

    case "unknown":
      findings.push({
        category: "device_status",
        severity: "info",
        title: "Device Status Unknown",
        description: "The device status could not be determined. This may indicate the device is not responding.",
        certainty: "unable_to_confirm",
        evidence: [`Device status: ${passport.deviceStatus}`],
        recommendedAction: "Run detection again after verifying the connection",
      });
      deviceStatusScore = 50;
      break;
  }

  // ========== COMPATIBILITY ANALYSIS ==========
  let compatibilityScore = 100;
  if (firmwareInfo) {
    if (firmwareInfo.compatibilityChecked) {
      if (firmwareInfo.isCompatible) {
        findings.push({
          category: "compatibility",
          severity: "info",
          title: "Compatibility Verified",
          description: "The device has been checked and is compatible with the latest firmware.",
          certainty: "confirmed",
          evidence: [`Compatibility checked: true`, `Is compatible: true`],
        });
        compatibilityScore = 100;
      } else {
        findings.push({
          category: "compatibility",
          severity: "error",
          title: "Compatibility Check Failed",
          description: "The device is not compatible with the latest firmware. Update is blocked.",
          certainty: "confirmed",
          evidence: [`Compatibility checked: true`, `Is compatible: false`],
          recommendedAction: "Contact QBIT support for a compatible firmware version",
        });
        compatibilityScore = 0;
      }
    } else {
      findings.push({
        category: "compatibility",
        severity: "info",
        title: "Compatibility Not Yet Checked",
        description: "Firmware compatibility has not been verified. Run a compatibility check before updating.",
        certainty: "unable_to_confirm",
        evidence: [`Compatibility checked: false`],
        recommendedAction: "Run compatibility check in the Firmware Intelligence module",
      });
      compatibilityScore = 50;
    }
  } else {
    compatibilityScore = 50;
  }

  // ========== KNOWLEDGE BASE LINKAGE ==========
  let knowledgeScore = 100;
  if (passport.product) {
    const hasResources = passport.product.driverDownloadUrl || passport.product.manualUrl || passport.product.installationGuideUrl || passport.product.knowledgeBaseUrl;

    if (hasResources) {
      findings.push({
        category: "compatibility",
        severity: "info",
        title: "Knowledge Base Resources Available",
        description: `Product "${passport.product.name}" has linked resources: manual, installation guide, and knowledge base articles.`,
        certainty: "confirmed",
        evidence: [
          `Product: ${passport.product.name}`,
          `Manual URL: ${passport.product.manualUrl ? "available" : "not linked"}`,
          `Installation guide: ${passport.product.installationGuideUrl ? "available" : "not linked"}`,
        ],
      });
      knowledgeScore = 100;
    } else {
      findings.push({
        category: "compatibility",
        severity: "warning",
        title: "Limited Knowledge Base Resources",
        description: "This product has limited linked resources. Some troubleshooting articles may not be available.",
        certainty: "confirmed",
        evidence: [`Product: ${passport.product.name}`, "No resource URLs linked"],
      });
      knowledgeScore = 50;
    }

    // Add general recommendations
    if (passport.product.manualUrl) {
      recommendations.push({
        title: "Open Manual",
        description: `Open the ${passport.product.name} manual`,
        actionType: "open_manual",
        resourceUrl: passport.product.manualUrl,
        priority: "low",
      });
    }
    recommendations.push({
      title: "Open Troubleshooting",
      description: "Browse the QBIT Knowledge Base for troubleshooting articles",
      actionType: "open_troubleshooting",
      resourceScreen: "ai-support-center",
      priority: "low",
    });
    recommendations.push({
      title: "Watch Video Tutorials",
      description: "Watch installation and troubleshooting videos",
      actionType: "watch_video",
      resourceScreen: "video-training-center",
      priority: "low",
    });
  } else {
    knowledgeScore = 0;
  }

  // ========== TEST PRINT RECOMMENDATION (always available) ==========
  recommendations.push({
    title: "Run Test Print",
    description: "After resolving issues, run a test print to verify the device is working",
    actionType: "run_test_print",
    priority: "low",
  });

  return {
    findings,
    recommendations,
    scores: {
      driver: driverScore,
      firmware: firmwareScore,
      connection: connectionScore,
      deviceStatus: deviceStatusScore,
      compatibility: compatibilityScore,
      knowledge: knowledgeScore,
    },
  };
}

/**
 * Computes the overall health score from category scores.
 * Weighted average — driver and device_status are most critical.
 */
function computeOverallScore(scores: {
  driver: number;
  firmware: number;
  connection: number;
  deviceStatus: number;
  compatibility: number;
  knowledge: number;
}): number {
  // Weights (must sum to 1.0)
  const weights = {
    driver: 0.25,        // most critical — can't work without a driver
    deviceStatus: 0.25,  // most critical — device must be ready
    connection: 0.20,    // critical — must be connected
    firmware: 0.15,      // important — but can work with outdated firmware
    compatibility: 0.10, // important — but not blocking unless checked
    knowledge: 0.05,     // informational — doesn't affect device function
  };

  const overall =
    scores.driver * weights.driver +
    scores.deviceStatus * weights.deviceStatus +
    scores.connection * weights.connection +
    scores.firmware * weights.firmware +
    scores.compatibility * weights.compatibility +
    scores.knowledge * weights.knowledge;

  return Math.round(overall);
}
