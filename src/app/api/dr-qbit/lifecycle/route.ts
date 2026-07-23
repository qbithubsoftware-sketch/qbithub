/**
 * POST /api/dr-qbit/lifecycle — Run Phase 6 Enterprise Device Lifecycle Engine
 *
 * This endpoint runs the Phase 6 Enterprise Device Lifecycle, Auto Sync &
 * Smart Management Engine on a registered/connected device. It requires:
 *   - passportId (DevicePassport ID — the primary device reference)
 *   - Lifecycle action (full pipeline or single-step)
 *   - Optional: Phase 5 DiagnosticResult, Phase 3 CloudLookupResult
 *
 * The engine manages the complete device lifecycle: registration verification,
 * auto synchronization, lifecycle tracking, installation history, service history,
 * warranty intelligence, resource synchronization, firmware intelligence,
 * device analytics, engineer activity tracking, enterprise dashboard integration,
 * smart notifications, security, device timeline, and enterprise architecture.
 *
 * NO fake/dummy/mock/simulated data. All data from real DB and device events.
 */
import { NextRequest, NextResponse } from "next/server";
import { runLifecycleEngine, runSingleLifecycleStep } from "@/lib/drqbit/lifecycle-engine";
import type { LifecycleAction, LifecycleRequest } from "@/lib/drqbit/lifecycle-types";
import { db } from "@/lib/db";

// Valid lifecycle actions
const VALID_ACTIONS: LifecycleAction[] = [
  "run_lifecycle",
  "verify_registration",
  "sync_device",
  "get_lifecycle",
  "get_installation_history",
  "get_service_history",
  "check_warranty",
  "sync_resources",
  "check_firmware",
  "get_analytics",
  "get_engineer_activity",
  "get_dashboard_events",
  "get_notifications",
  "verify_security",
  "get_timeline",
  "register_device",
  "update_lifecycle_stage",
];

export async function POST(req: NextRequest) {
  // Phase 6 lifecycle requires authentication
  let engineerId: string | null = null;
  let engineerName: string | null = null;
  let engineerEmail: string | null = null;
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
      engineerEmail = null;
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
        engineerEmail = session.user.email ?? null;
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
  const action: LifecycleAction = body.action ?? "run_lifecycle";
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action '${action}'. Valid actions: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  const passportId = body.passportId ?? null;
  if (!passportId && action !== "run_lifecycle") {
    // Most single-step actions require a passportId
    return NextResponse.json(
      { error: "Missing 'passportId' — most lifecycle actions require a device reference" },
      { status: 400 },
    );
  }

  // Verify passport exists in database
  if (passportId) {
    const passport = await db.devicePassport.findUnique({
      where: { id: passportId },
      select: { id: true, passportNumber: true, serialNumber: true },
    });
    if (!passport) {
      return NextResponse.json(
        { error: `Device passport '${passportId}' not found in database` },
        { status: 404 },
      );
    }
  }

  // Build LifecycleRequest
  const lifecycleRequest: LifecycleRequest = {
    action,
    passportId: passportId ?? "",
    engineerId: engineerId ?? body.engineerId ?? null,
    engineerName: engineerName ?? body.engineerName ?? null,
    engineerEmail: engineerEmail ?? body.engineerEmail ?? null,
    diagnosticResult: body.diagnosticResult ?? null,
    cloudLookupResult: body.cloudLookupResult ?? null,
    configurationResult: body.configurationResult ?? null,
  };

  try {
    // Run the lifecycle engine
    const result = action === "run_lifecycle"
      ? await runLifecycleEngine(lifecycleRequest)
      : await runSingleLifecycleStep(lifecycleRequest, action);

    // Build response message
    const isSuccess = (result as any)?.success ?? false;
    const message = isSuccess
      ? action === "run_lifecycle"
        ? "Device Lifecycle Management Complete"
        : `Lifecycle Step '${action}' Completed`
      : "Lifecycle Engine Failed — See Error Details";

    return NextResponse.json(
      { ...result, message },
      { status: isSuccess ? 200 : 207 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to run lifecycle engine";
    console.error("[LIFECYCLE API] Error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/dr-qbit/lifecycle — Query lifecycle data
 *
 * Supports querying:
 *   - Device lifecycle status (by passportId or serialNumber)
 *   - Installation history
 *   - Service history
 *   - Warranty intelligence
 *   - Device timeline
 *   - Smart notifications
 *   - Device analytics counters
 *   - Engineer activity logs
 */
export async function GET(req: NextRequest) {
  // Require staff authentication
  let isAuthenticated = false;
  try {
    const { requireStaff } = await import("@/lib/notifications/auth");
    const session = await requireStaff();
    if (session) isAuthenticated = true;
  } catch {
    // Not authenticated
  }

  // Also allow Desktop Agent
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { validateAgentSecret } = await import("@/lib/drqbit/desktop-agent-auth");
    if (validateAgentSecret(token)) isAuthenticated = true;
  }

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Parse query parameters
  const { searchParams } = new URL(req.url);
  const passportId = searchParams.get("passportId");
  const serialNumber = searchParams.get("serialNumber");
  const queryType = searchParams.get("type") ?? "lifecycle"; // lifecycle | installation | service | warranty | timeline | notifications | analytics | engineer_activity | firmware
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

  if (!passportId && !serialNumber) {
    return NextResponse.json(
      { error: "Missing 'passportId' or 'serialNumber' query parameter" },
      { status: 400 },
    );
  }

  // Find passport
  const passport = await db.devicePassport.findFirst({
    where: {
      ...(passportId ? { id: passportId } : {}),
      ...(serialNumber ? { serialNumber } : {}),
    },
    include: {
      product: true,
      driverInfo: true,
      firmwareInfo: true,
      warranty: true,
      configuration: true,
      lifecycleCounter: true,
    },
  });

  if (!passport) {
    return NextResponse.json(
      { error: "Device not found" },
      { status: 404 },
    );
  }

  try {
    switch (queryType) {
      case "installation": {
        const records = await db.installationRecord.findMany({
          where: { passportId: passport.id },
          orderBy: { installationDate: "desc" },
          take: limit,
        });
        return NextResponse.json({ success: true, data: records });
      }

      case "service": {
        const entries = await db.serviceHistoryEntry.findMany({
          where: { passportId: passport.id },
          orderBy: { serviceDate: "desc" },
          take: limit,
        });
        return NextResponse.json({ success: true, data: entries });
      }

      case "warranty": {
        const warranty = passport.warranty;
        if (!warranty) {
          return NextResponse.json({
            success: true,
            data: { warrantyStatus: "unknown", warrantyColor: "unknown", message: "No warranty record found" },
          });
        }
        // Calculate warranty color from real dates
        const now = new Date();
        const expiryDate = warranty.warrantyExpiryDate;
        let remainingDays: number | null = null;
        let warrantyColor: string = "unknown";

        if (expiryDate) {
          remainingDays = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (remainingDays >= 300) warrantyColor = "green";
          else if (remainingDays >= 100) warrantyColor = "yellow";
          else if (remainingDays >= 30) warrantyColor = "orange";
          else warrantyColor = "red";
        }

        return NextResponse.json({
          success: true,
          data: {
            warrantyStatus: warranty.warrantyStatus,
            warrantyColor,
            remainingDays,
            expiryDate: expiryDate?.toISOString() ?? null,
            purchaseDate: warranty.purchaseDate?.toISOString() ?? null,
            warrantyStartDate: warranty.warrantyStartDate?.toISOString() ?? null,
            extendedWarranty: warranty.extendedWarranty,
            extendedExpiryDate: warranty.extendedExpiryDate?.toISOString() ?? null,
            warrantyProvider: warranty.warrantyProvider ?? null,
          },
        });
      }

      case "timeline": {
        const events = await db.deviceTimelineEvent.findMany({
          where: { passportId: passport.id },
          orderBy: { occurredAt: "asc" },
          take: limit,
        });
        return NextResponse.json({ success: true, data: events });
      }

      case "notifications": {
        const notifications = await db.smartNotification.findMany({
          where: { passportId: passport.id, deliveryStatus: { not: "expired" } },
          orderBy: { createdAt: "desc" },
          take: limit,
        });
        return NextResponse.json({ success: true, data: notifications });
      }

      case "analytics": {
        const counter = passport.lifecycleCounter;
        return NextResponse.json({
          success: true,
          data: counter ?? {
            totalScans: 0,
            totalDiagnostics: 0,
            successfulDiagnostics: 0,
            failedDiagnostics: 0,
            driverInstallCount: 0,
            driverUpdateCount: 0,
            firmwareUpdateCount: 0,
            serviceCount: 0,
            lifecycleStage: "discovered",
            isRegistered: !!passport.productId,
          },
        });
      }

      case "engineer_activity": {
        const logs = await db.engineerActivityLog.findMany({
          where: { passportId: passport.id },
          orderBy: { activityTime: "desc" },
          take: limit,
        });
        return NextResponse.json({ success: true, data: logs });
      }

      case "firmware": {
        const firmwareInfo = passport.firmwareInfo;
        if (!firmwareInfo) {
          return NextResponse.json({
            success: true,
            data: { firmwareStatus: "unknown", message: "No firmware information available" },
          });
        }
        return NextResponse.json({
          success: true,
          data: {
            installedFirmware: firmwareInfo.installedVersion ?? null,
            latestFirmware: firmwareInfo.latestVersion ?? null,
            updateAvailable: firmwareInfo.firmwareStatus === "update_available",
            firmwareStatus: firmwareInfo.firmwareStatus,
            recommendation: firmwareInfo.firmwareStatus === "update_available"
              ? "New firmware available for this device."
              : firmwareInfo.firmwareStatus === "healthy"
                ? "Device is running the latest firmware."
                : "Firmware information not available.",
            downloadUrl: firmwareInfo.latestDownloadUrl ?? null,
            releaseNotes: firmwareInfo.latestReleaseNotes ?? null,
            isCritical: firmwareInfo.latestReleaseId ? (await db.firmwareRelease.findUnique({ where: { id: firmwareInfo.latestReleaseId } }))?.isCritical ?? false : false,
          },
        });
      }

      default: {
        // Full lifecycle overview
        return NextResponse.json({
          success: true,
          data: {
            passportNumber: passport.passportNumber,
            serialNumber: passport.serialNumber,
            deviceName: passport.deviceName,
            model: passport.model ?? passport.product?.model ?? null,
            productId: passport.productId,
            product: passport.product ? {
              id: passport.product.id,
              name: passport.product.name,
              brand: passport.product.brand,
              model: passport.product.model,
              deviceType: passport.product.deviceType,
            } : null,
            isRegistered: !!passport.productId,
            lifecycleStage: passport.lifecycleCounter?.lifecycleStage ?? "discovered",
            deviceStatus: passport.deviceStatus,
            lastScannedAt: passport.lastScannedAt?.toISOString() ?? null,
            lastInstallationAt: passport.lastInstallationAt?.toISOString() ?? null,
            lastServiceAt: passport.lastServiceAt?.toISOString() ?? null,
            lastDriverUpdateAt: passport.lastDriverUpdateAt?.toISOString() ?? null,
            lastFirmwareUpdateAt: passport.lastFirmwareUpdateAt?.toISOString() ?? null,
            driverStatus: passport.driverInfo?.driverStatus ?? "unknown",
            firmwareStatus: passport.firmwareInfo?.firmwareStatus ?? "unknown",
            warrantyStatus: passport.warranty?.warrantyStatus ?? "unknown",
            configurationStatus: passport.configuration?.configurationStatus ?? "unknown",
          },
        });
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to query lifecycle data";
    console.error("[LIFECYCLE GET API] Error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
