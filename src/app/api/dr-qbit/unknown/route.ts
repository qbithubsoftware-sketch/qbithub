/**
 * GET  /api/dr-qbit/unknown — list unknown (unmapped) devices
 * POST /api/dr-qbit/unknown/[id]/map — admin maps an unknown device to a product
 *
 * The mapping endpoint also creates a HardwareSignature so future scans
 * auto-match this device.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";
import { suggestClosestProducts } from "@/lib/drqbit/device-matcher";
import { sanitizeText } from "@/lib/security/validation";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
  const unmappedOnly = url.searchParams.get("unmapped") === "true";

  const where: Record<string, unknown> = {};
  if (unmappedOnly) where.mappedProductId = null;

  const devices = await db.unknownDevice.findMany({
    where,
    orderBy: { firstSeenAt: "desc" },
    take: limit,
    include: {
      mappedProduct: { select: { id: true, name: true, model: true } },
    },
  });

  return NextResponse.json({
    items: devices.map((d) => ({
      id: d.id,
      scanSessionId: d.scanSessionId,
      hardwareId: d.hardwareId,
      vendorId: d.vendorId,
      productIdCode: d.productIdCode,
      deviceName: d.deviceName,
      manufacturer: d.manufacturer,
      model: d.model,
      connectionType: d.connectionType,
      port: d.port,
      macAddress: d.macAddress,
      ipAddress: d.ipAddress,
      mappedProductId: d.mappedProductId,
      mappedProductName: d.mappedProduct?.name ?? null,
      mappedAt: d.mappedAt?.toISOString() ?? null,
      mappedByName: d.mappedByName,
      firstSeenAt: d.firstSeenAt.toISOString(),
    })),
    total: devices.length,
  });
}
