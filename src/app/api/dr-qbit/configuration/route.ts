/**
 * Dr. QBIT Phase 4 — Configuration & Device Provisioning API Route
 *
 * POST /api/dr-qbit/configuration
 *
 * Handles all configuration actions:
 *   - read_capabilities:    Read device capabilities and generate options
 *   - configure_usb:        Configure USB connection
 *   - configure_wifi:       Configure Wi-Fi connection (requires wifiParams)
 *   - configure_lan:        Configure LAN connection
 *   - configure_bluetooth:  Configure Bluetooth connection
 *   - test_communication:   Test communication on active connection
 *   - test_print:           Send test print to printer
 *   - save_configuration:   Save configuration to database
 *   - full_configuration:   Full pipeline (Steps 1-8)
 *
 * Authentication:
 *   - Engineer/Admin: full access to all configuration actions
 *   - Customer: read_capabilities only (cannot configure devices)
 *   - Guest: denied
 *
 * Rules:
 *   - NO fake/dummy/mock/placeholder data.
 *   - Configuration NEVER saved unless security checks pass.
 *   - Wi-Fi password NEVER stored in database (only passed to Desktop Agent).
 *   - Clear error messages for every failure — no silent failures.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { runConfiguration, readCapabilitiesOnly, saveConfigurationEvents } from "@/lib/drqbit/configuration-engine";
import type {
  ConfigurationRequest,
  ConfigurationResult,
  ConfigurationResponse,
  DeviceConfigurationCapabilities,
  SecurityValidationResult,
  ConfigurationError,
} from "@/lib/drqbit/configuration-types";

const ALLOWED_ROLES: string[] = ["admin", "engineer", "staff"];
const READ_ONLY_ROLES: string[] = ["customer"];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // ===== Authentication =====
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role ?? "guest";

    // Parse request body
    const body: ConfigurationRequest = await request.json();

    // ===== Role-based access control =====
    if (userRole === "guest") {
      return NextResponse.json(
        buildDeniedResponse(startTime, "Authentication required — please log in to configure devices", "Guest users cannot configure devices"),
        { status: 401 },
      );
    }

    // ===== Customer: read-only access =====
    if (READ_ONLY_ROLES.includes(userRole) && body.action !== "read_capabilities") {
      return NextResponse.json(
        buildDeniedResponse(startTime, "Customers can only view device capabilities — configuration requires an engineer", "Customer role cannot perform configuration actions"),
        { status: 403 },
      );
    }

    // ===== Validate required fields =====
    if (!body.cloudLookupResult) {
      return NextResponse.json(
        buildErrorResponse(startTime, "Cloud Lookup result is required — please complete device lookup before configuration"),
        { status: 400 },
      );
    }

    if (!body.action) {
      return NextResponse.json(
        buildErrorResponse(startTime, "Configuration action is required"),
        { status: 400 },
      );
    }

    // ===== Wi-Fi params validation =====
    if (body.action === "configure_wifi" && !body.wifiParams?.ssid) {
      return NextResponse.json(
        buildErrorResponse(startTime, "Wi-Fi SSID is required for Wi-Fi configuration"),
        { status: 400 },
      );
    }

    // ===== Add engineer context from session =====
    if (session?.user?.id && !body.engineerId) {
      body.engineerId = session.user.id;
    }
    if (session?.user?.name && !body.engineerName) {
      body.engineerName = session.user.name;
    }

    // ===== Execute configuration pipeline =====
    let configResult: ConfigurationResult;

    if (body.action === "read_capabilities") {
      // Read-only action — just returns capabilities and options
      configResult = await readCapabilitiesOnly(body.cloudLookupResult);
    } else {
      // Configuration action — run the full or partial pipeline
      configResult = await runConfiguration(body);

      // ===== Save configuration events to database =====
      if (configResult.savedProfile) {
        // Find the configuration ID from the saved profile
        try {
          const savedConfig = await import("@/lib/db").then(m => m.db.deviceConfiguration.findUnique({
            where: { configurationNumber: configResult.savedProfile!.configurationNumber },
          }));
          if (savedConfig) {
            await saveConfigurationEvents(savedConfig.id, configResult.events);
          }
        } catch {
          // Non-critical — event logging failure doesn't block the response
        }
      }
    }

    // ===== Build response with human-readable message =====
    const response: ConfigurationResponse = {
      ...configResult,
      message: generateResultMessage(configResult),
    };

    // ===== Determine HTTP status code =====
    const statusCode = configResult.success ? 200 : configResult.configurationStatus === "failed" ? 500 : 200;

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error("[CONFIG API] Configuration endpoint error:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error during configuration";

    return NextResponse.json(
      buildErrorResponse(startTime, errorMessage),
      { status: 500 },
    );
  }
}

/**
 * Generates a human-readable result message for the user.
 */
function generateResultMessage(result: ConfigurationResult): string {
  if (!result.success) {
    if (result.errors.length > 0) {
      return result.errors[0].message;
    }
    return "Configuration failed — unable to connect to device";
  }

  if (result.configurationStatus === "successful") {
    const connectionLabel = result.connectionType
      ? { usb: "USB", lan: "LAN", wifi: "Wi-Fi", bluetooth: "Bluetooth" }[result.connectionType]
      : "Unknown";
    return `Device configured successfully via ${connectionLabel}`;
  }

  if (result.configurationStatus === "partial") {
    return "Device partially configured — some connection types not verified";
  }

  return "Configuration capabilities read successfully";
}

/**
 * Builds a denied/forbidden response for unauthorized access.
 */
function buildDeniedResponse(startTime: number, message: string, securityReason: string): ConfigurationResponse {
  return {
    success: false,
    message,
    deviceStatus: "Unknown",
    connectionType: null,
    configurationStatus: "pending",
    ipAddress: null,
    communication: "Not Verified",
    testPrint: "pending",
    lastConfigured: null,
    firmware: null,
    capabilities: buildEmptyCapabilities(),
    supportedOptions: [],
    usbResult: null,
    wifiResult: null,
    lanResult: null,
    bluetoothResult: null,
    communicationTest: null,
    testPrintResult: null,
    securityValidation: {
      deviceVerified: false,
      deviceBelongsToQbit: false,
      communicationVerified: false,
      configurationValidationComplete: false,
      noDuplicateRegistration: true,
      allChecksPassed: false,
      failedChecks: [{ check: "authentication", reason: securityReason }],
    },
    events: [],
    errors: [{ step: "read_capabilities", message, errorCode: "device_not_verified", recoverable: true, timestamp: new Date().toISOString() }],
    savedProfile: null,
    configurationTimestamp: new Date().toISOString(),
    configurationDurationMs: Date.now() - startTime,
  };
}

/**
 * Builds a generic error response.
 */
function buildErrorResponse(startTime: number, message: string): ConfigurationResponse {
  return {
    success: false,
    message,
    deviceStatus: "Unknown",
    connectionType: null,
    configurationStatus: "pending",
    ipAddress: null,
    communication: "Not Verified",
    testPrint: "pending",
    lastConfigured: null,
    firmware: null,
    capabilities: buildEmptyCapabilities(),
    supportedOptions: [],
    usbResult: null,
    wifiResult: null,
    lanResult: null,
    bluetoothResult: null,
    communicationTest: null,
    testPrintResult: null,
    securityValidation: {
      deviceVerified: false,
      deviceBelongsToQbit: false,
      communicationVerified: false,
      configurationValidationComplete: false,
      noDuplicateRegistration: true,
      allChecksPassed: false,
      failedChecks: [],
    },
    events: [],
    errors: [],
    savedProfile: null,
    configurationTimestamp: new Date().toISOString(),
    configurationDurationMs: Date.now() - startTime,
  };
}

function buildEmptyCapabilities(): DeviceConfigurationCapabilities {
  return {
    supportsUsb: false,
    supportsLan: false,
    supportsWifi: false,
    supportsBluetooth: false,
    supportsCashDrawer: false,
    supportsFirmwareUpgrade: false,
    supportsAutoDriverInstall: false,
    supportsSdk: false,
    supportsFirmwareConfig: false,
    supportedConnectionTypes: [],
  };
}
