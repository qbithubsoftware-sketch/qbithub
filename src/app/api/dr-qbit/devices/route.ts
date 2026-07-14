/**
 * GET /api/dr-qbit/devices — list detected devices (with optional filters)
 *
 * Query params:
 *   - sessionId: filter by scan session
 *   - connectionType: usb | com | lan | wifi | bluetooth
 *   - status: ready | offline | unknown | unsupported
 *   - matched: "true" | "false" — filter by match status
 *   - limit: number (default 100, max 500)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import type { DeviceConnection, DeviceStatus } from "@/lib/drqbit/types";
import { safeJsonParse, safeJsonArray } from "@/lib/utils/safe-json";

export async function GET(req: NextRequest) {
  try {

  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const connectionType = url.searchParams.get("connectionType");
  const status = url.searchParams.get("status");
  const matched = url.searchParams.get("matched");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

  const where: Record<string, unknown> = {};
  if (sessionId) where.scanSessionId = sessionId;
  if (connectionType) where.connectionType = connectionType as DeviceConnection;
  if (status) where.status = status as DeviceStatus;
  if (matched === "true") where.matchedProductId = { not: null };
  if (matched === "false") where.matchedProductId = null;

  const devices = await db.detectedDevice.findMany({
    where,
    orderBy: { firstDetectedAt: "desc" },
    take: limit,
    include: {
      matchedProduct: { select: { id: true, name: true, model: true, deviceType: true } },
    },
  });

  return NextResponse.json({
    items: devices.map((d) => ({
      id: d.id,
      scanSessionId: d.scanSessionId,
      connectionType: d.connectionType,
      port: d.port,
      deviceName: d.deviceName,
      manufacturer: d.manufacturer,
      brand: d.brand,
      model: d.model,
      hardwareId: d.hardwareId,
      vendorId: d.vendorId,
      productIdCode: d.productIdCode,
      serialNumber: d.serialNumber,
      usbVersion: d.usbVersion,
      osInfo: d.osInfo,
      architecture: d.architecture,
      ipAddress: d.ipAddress,
      macAddress: d.macAddress,
      hostname: d.hostname,
      openPorts: d.openPorts ? safeJsonParse(d.openPorts, null) : null,
      signalQuality: d.signalQuality,
      status: d.status,
      matchedProductId: d.matchedProductId,
      matchedProductName: d.matchedProduct?.name ?? null,
      matchedProductModel: d.matchedProduct?.model ?? null,
      matchedProductType: d.matchedProduct?.deviceType ?? null,
      matchConfidence: d.matchConfidence,
      matchMethod: d.matchMethod,
      firstDetectedAt: d.firstDetectedAt.toISOString(),
      lastSeenAt: d.lastSeenAt.toISOString(),
    })),
    total: devices.length,
  });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/dr-qbit/devices/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
