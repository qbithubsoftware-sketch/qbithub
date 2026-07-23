/**
 * POST /api/dr-qbit/cloud-lookup — Phase 3 Cloud Lookup Endpoint
 *
 * Receives a Verified Device Profile from Phase 2 and runs the complete
 * Cloud Lookup pipeline:
 *   1. Validate Serial Number against QBIT database
 *   2. Fetch Product information (QbitProduct)
 *   3. Fetch Customer information (PurchaseRecord / FSMCustomerAsset)
 *   4. Fetch Warranty information (DeviceWarranty / PurchaseRecord)
 *   5. Fetch Resources (V5 Resource Library — drivers, firmware, manuals, SDK, videos, utilities)
 *   6. Check Firmware Compatibility
 *   7. Generate Smart Recommendations
 *   8. Build Device Timeline
 *   9. Security Validations
 *  10. Return CloudLookupResult for Phase 4
 *
 * Authentication:
 *   - Public: Guest/Customer can call this with a serial number
 *   - Staff: Engineer/Admin can call with full device profile
 *
 * Rules:
 *   - NO fake/dummy/mock/placeholder data.
 *   - If serial number is null → Cloud Lookup MUST NOT proceed.
 *   - Registered vs Not Registered devices handled differently.
 *   - API failure → graceful error handling, never cached/fake data.
 */

import { NextRequest, NextResponse } from "next/server";
import { runCloudLookup } from "@/lib/drqbit/cloud-lookup-engine";
import type { CloudLookupInput, CloudLookupResponse } from "@/lib/drqbit/cloud-lookup-types";
import type { DeviceConnection, DeviceType, IdentificationStatus } from "@/lib/drqbit/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.deviceProfile) {
      return NextResponse.json(
        { error: "Missing 'deviceProfile' in request body" },
        { status: 400 },
      );
    }

    // Parse and validate the device profile from Phase 2
    const rawProfile = body.deviceProfile;
    const deviceProfile: CloudLookupInput = {
      serialNumber: rawProfile.serialNumber ?? null,
      model: rawProfile.model ?? null,
      deviceType: (rawProfile.deviceType as DeviceType) ?? "unknown",
      connectionType: (rawProfile.connectionType as DeviceConnection) ?? "usb",
      firmwareVersion: rawProfile.firmwareVersion ?? null,
      capabilities: rawProfile.capabilities ?? [],
      identificationStatus: (rawProfile.identificationStatus as IdentificationStatus) ?? "unknown",
      vendorId: rawProfile.vendorId ?? null,
      productId: rawProfile.productId ?? null,
      deviceName: rawProfile.deviceName ?? null,
      manufacturer: rawProfile.manufacturer ?? null,
    };

    // Determine user role from session (if available)
    // For public access: role is "guest"
    // For authenticated staff: role is determined from session
    let userRole: "guest" | "customer" | "engineer" | "admin" = "guest";

    // Try to get session info (optional — this endpoint works for both public and authenticated users)
    try {
      // Note: We don't require authentication here because the serial number
      // IS the access key (like HP/Dell/Lenovo support portals).
      // However, we determine the role for visibility filtering.
      const sessionHeader = req.headers.get("x-user-role");
      if (sessionHeader) {
        const role = sessionHeader;
        if (role === "administrator" || role === "super_administrator") userRole = "admin";
        else if (role === "installation_engineer") userRole = "engineer";
        else if (role === "customer") userRole = "customer";
      }
    } catch {
      // No session available — treat as guest
    }

    // Run the complete Cloud Lookup pipeline
    const result = await runCloudLookup(deviceProfile, {
      engineerId: body.engineerId ?? undefined,
      osInfo: body.osInfo ?? undefined,
      language: body.language ?? undefined,
      userRole,
    });

    // Build the response with a human-readable message
    const response: CloudLookupResponse = {
      ...result,
      message: buildResponseMessage(result),
    };

    // Determine HTTP status code based on result
    let statusCode = 200;
    if (!result.success && result.serialValidation.status === "invalid") statusCode = 400;
    else if (result.errors.length > 0 && !result.success) statusCode = 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error("[API ERROR] POST /api/dr-qbit/cloud-lookup:", error);

    // Database/Network failure → graceful error, never cached/fake data
    return NextResponse.json(
      {
        error: "Unable to connect to QBIT Cloud. Please try again later.",
        success: false,
        serialValidation: {
          status: "invalid",
          serialNumber: "",
          source: null,
          matchedRecordIds: {},
          isDuplicateRegistration: false,
          errorMessage: "Service unavailable",
        },
        device: null,
        customer: null,
        warranty: null,
        product: null,
        resources: { drivers: [], firmware: [], manuals: [], sdk: [], videos: [], utilities: [] },
        firmwareCompatibility: null,
        recommendations: [],
        timeline: [],
        errors: [{
          step: "receive_device_profile",
          message: "Unable to connect to QBIT Cloud. Please try again later.",
          recoverable: true,
          timestamp: new Date().toISOString(),
        }],
        lookupTimestamp: new Date().toISOString(),
        lookupDurationMs: 0,
        message: "Unable to connect to QBIT Cloud. Please try again later.",
      },
      { status: 503 },
    );
  }
}

/**
 * Builds a human-readable response message based on the lookup result.
 */
function buildResponseMessage(result: import("@/lib/drqbit/cloud-lookup-types").CloudLookupResult): string {
  const { serialValidation } = result;

  if (serialValidation.status === "invalid" && !result.device?.serialNumber) {
    return "Unable to verify device. Serial Number not available.";
  }

  if (serialValidation.status === "invalid") {
    return "Invalid Device Identity. Unable to verify this device.";
  }

  if (serialValidation.status === "not_registered") {
    return "Device Detected Successfully. This serial number is not registered in the QBIT ecosystem.";
  }

  if (serialValidation.status === "registered") {
    const warrantyMsg = result.warranty
      ? ` Warranty: ${result.warranty.status === "active" ? "Active" : result.warranty.status === "expired" ? "Expired" : result.warranty.status === "expiring_soon" ? "Expiring Soon" : "Unknown"}`
      : "";

    const firmwareMsg = result.firmwareCompatibility
      ? result.firmwareCompatibility.updateStatus === "update_available"
        ? " Firmware Update Available"
        : result.firmwareCompatibility.updateStatus === "up_to_date"
          ? " Device is up to date"
          : ""
      : "";

    return `Device verified successfully.${warrantyMsg}${firmwareMsg}`;
  }

  return "Cloud Lookup completed.";
}
