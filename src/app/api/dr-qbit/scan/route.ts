/**
 * POST /api/dr-qbit/scan — receive scan results from the Desktop Agent
 *
 * This is the primary endpoint the Desktop Companion Agent calls after
 * completing a hardware scan. The agent sends all detected devices in
 * one batch; the server creates a ScanSession + DetectedDevice rows +
 * UnknownDevice rows for unmatched devices.
 *
 * Authentication: shared secret (DESKTOP_AGENT_SECRET env var).
 * The browser NEVER calls this endpoint directly — only the Desktop Agent does.
 *
 * Body: DesktopAgentScanPayload
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateAgentSecret, extractAgentSecret } from "@/lib/drqbit/desktop-agent-auth";
import { matchDevice } from "@/lib/drqbit/device-matcher";
import { type RawDetectedDevice, type DeviceConnection } from "@/lib/drqbit/types";
import { sanitizeText } from "@/lib/security/validation";
import { randomBytes } from "node:crypto";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Authenticate the Desktop Agent
  const authHeader = req.headers.get("authorization");
  const secret = extractAgentSecret(authHeader, body.agentSecret);
  if (!validateAgentSecret(secret)) {
    return NextResponse.json(
      { error: "Invalid or missing agent secret. Set DESKTOP_AGENT_SECRET env var." },
      { status: 401 },
    );
  }

  // Validate devices array
  if (!Array.isArray(body.devices)) {
    return NextResponse.json({ error: "Missing 'devices' array" }, { status: 400 });
  }

  // Generate session token
  const sessionToken = randomBytes(16).toString("hex");

  // Create scan session
  const session = await db.scanSession.create({
    data: {
      sessionToken,
      engineerId: body.engineerId ?? null,
      engineerName: body.engineerName ?? null,
      customerId: body.customerId ?? null,
      customerName: body.customerName ?? null,
      workOrderId: body.workOrderId ?? null,
      agentVersion: body.agentVersion ?? null,
      osInfo: body.osInfo ?? null,
      hostname: body.hostname ?? null,
      scanDurationMs: body.scanDurationMs ?? null,
      status: "completed",
      completedAt: new Date(),
    },
  });

  let usbCount = 0;
  let comCount = 0;
  let lanCount = 0;
  let wifiCount = 0;
  let bluetoothCount = 0;

  // Process each detected device
  const detectedDevices: Array<{ id: string; matched: boolean }> = [];
  const unknownDevices: Array<{ id: string }> = [];

  for (const raw of body.devices as RawDetectedDevice[]) {
    const connectionType = raw.connectionType as DeviceConnection;
    if (connectionType === "usb") usbCount++;
    else if (connectionType === "com") comCount++;
    else if (connectionType === "lan") lanCount++;
    else if (connectionType === "wifi") wifiCount++;
    else if (connectionType === "bluetooth") bluetoothCount++;

    // Match against Product Library
    const match = await matchDevice(raw);

    if (match.isUnknown) {
      // Create UnknownDevice row
      const unknown = await db.unknownDevice.create({
        data: {
          scanSessionId: session.id,
          hardwareId: raw.hardwareId ?? null,
          vendorId: raw.vendorId?.toUpperCase() ?? null,
          productIdCode: raw.productIdCode?.toUpperCase() ?? null,
          deviceName: raw.deviceName ?? null,
          manufacturer: raw.manufacturer ?? null,
          model: raw.model ?? null,
          connectionType: raw.connectionType ?? null,
          port: raw.port ?? null,
          macAddress: raw.macAddress?.toUpperCase() ?? null,
          ipAddress: raw.ipAddress ?? null,
        },
      });
      unknownDevices.push({ id: unknown.id });
    } else {
      // Create DetectedDevice row with match
      const device = await db.detectedDevice.create({
        data: {
          scanSessionId: session.id,
          connectionType: raw.connectionType,
          port: raw.port ?? null,
          deviceName: raw.deviceName ?? null,
          manufacturer: raw.manufacturer ?? null,
          brand: raw.brand ?? null,
          model: raw.model ?? null,
          hardwareId: raw.hardwareId ?? null,
          vendorId: raw.vendorId?.toUpperCase() ?? null,
          productIdCode: raw.productIdCode?.toUpperCase() ?? null,
          serialNumber: raw.serialNumber ?? null,
          usbVersion: raw.usbVersion ?? null,
          osInfo: raw.osInfo ?? null,
          architecture: raw.architecture ?? null,
          ipAddress: raw.ipAddress ?? null,
          macAddress: raw.macAddress?.toUpperCase() ?? null,
          hostname: raw.hostname ?? null,
          openPorts: raw.openPorts ? JSON.stringify(raw.openPorts) : null,
          signalQuality: raw.signalQuality ?? null,
          status: raw.status ?? "ready",
          matchedProductId: match.matchedProductId,
          matchConfidence: match.matchConfidence,
          matchMethod: match.matchMethod,
        },
      });
      detectedDevices.push({ id: device.id, matched: true });
    }
  }

  // Update session with counts
  const updatedSession = await db.scanSession.update({
    where: { id: session.id },
    data: {
      deviceCount: detectedDevices.length + unknownDevices.length,
      usbCount,
      comCount,
      lanCount,
      wifiCount,
      bluetoothCount,
    },
  });

  return NextResponse.json({
    sessionId: session.id,
    sessionToken,
    deviceCount: updatedSession.deviceCount,
    matchedCount: detectedDevices.length,
    unknownCount: unknownDevices.length,
    counts: {
      usb: usbCount,
      com: comCount,
      lan: lanCount,
      wifi: wifiCount,
      bluetooth: bluetoothCount,
    },
  }, { status: 201 });
}

/**
 * GET /api/dr-qbit/scan — list recent scan sessions (engineer/admin view)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

  const sessions = await db.scanSession.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      _count: {
        select: { detectedDevices: true, unknownDevices: true },
      },
    },
  });

  return NextResponse.json({
    items: sessions.map((s) => ({
      id: s.id,
      sessionToken: s.sessionToken,
      engineerId: s.engineerId,
      engineerName: s.engineerName,
      customerName: s.customerName,
      workOrderId: s.workOrderId,
      agentVersion: s.agentVersion,
      osInfo: s.osInfo,
      hostname: s.hostname,
      scanDurationMs: s.scanDurationMs,
      deviceCount: s.deviceCount,
      matchedCount: s._count.detectedDevices,
      unknownCount: s._count.unknownDevices,
      usbCount: s.usbCount,
      comCount: s.comCount,
      lanCount: s.lanCount,
      wifiCount: s.wifiCount,
      bluetoothCount: s.bluetoothCount,
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
    })),
    total: sessions.length,
  });
}
