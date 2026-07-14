/**
 * GET /api/dr-qbit/tests/history — test session history
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireEngineerOrAdmin } from "@/lib/notifications/auth";

export async function GET(req: NextRequest) {
  try {

  const session = await requireEngineerOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);

  const sessions = await db.deviceTestSession.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      passport: { include: { product: true } },
    },
  });

  return NextResponse.json({
    items: sessions.map((s) => ({
      id: s.id,
      sessionToken: s.sessionToken,
      passportNumber: s.passport?.passportNumber ?? null,
      productName: s.passport?.product?.name ?? null,
      deviceType: s.deviceType,
      deviceName: s.deviceName,
      model: s.model,
      engineerName: s.engineerName,
      totalTests: s.totalTests,
      passedCount: s.passedCount,
      failedCount: s.failedCount,
      warningCount: s.warningCount,
      overallScore: s.overallScore,
      overallStatus: s.overallStatus,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
    })),
    total: sessions.length,
  });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/dr-qbit/tests/history/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
