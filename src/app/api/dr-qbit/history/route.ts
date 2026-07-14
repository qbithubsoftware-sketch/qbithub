/**
 * GET /api/dr-qbit/history — scan session history with filters
 *
 * Query params:
 *   - engineerId: filter by engineer
 *   - customerId: filter by customer
 *   - status: running | completed | failed
 *   - limit: number (default 50, max 200)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";

export async function GET(req: NextRequest) {
  try {

  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const engineerId = url.searchParams.get("engineerId");
  const customerId = url.searchParams.get("customerId");
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);

  const where: Record<string, unknown> = {};
  if (engineerId) where.engineerId = engineerId;
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;

  const sessions = await db.scanSession.findMany({
    where,
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

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/dr-qbit/history/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
