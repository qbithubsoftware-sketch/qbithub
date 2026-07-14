/**
 * POST /api/dr-qbit/tests/run — run the full test suite on a device passport
 * GET  /api/dr-qbit/tests — list test sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireEngineerOrAdmin } from "@/lib/notifications/auth";
import { runTests } from "@/lib/test-center/runner";
import type { OverallTestStatus } from "@/lib/test-center/types";

export async function POST(req: NextRequest) {
  const session = await requireEngineerOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.passportId) {
    return NextResponse.json({ error: "Missing 'passportId' field" }, { status: 400 });
  }

  try {
    const result = await runTests({
      passportId: body.passportId,
      engineerId: session.user.id,
      engineerName: session.user.name ?? undefined,
      workOrderId: body.workOrderId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to run tests";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const session = await requireEngineerOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const passportId = url.searchParams.get("passportId");
  const overallStatus = url.searchParams.get("overallStatus");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

  const where: Record<string, unknown> = {};
  if (passportId) where.passportId = passportId;
  if (overallStatus) where.overallStatus = overallStatus as OverallTestStatus;

  const sessions = await db.deviceTestSession.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      passport: { include: { product: true } },
      _count: { select: { testResults: true } },
    },
  });

  return NextResponse.json({
    items: sessions.map((s) => ({
      id: s.id,
      sessionToken: s.sessionToken,
      passportId: s.passportId,
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
      skippedCount: s.skippedCount,
      notSupportedCount: s.notSupportedCount,
      overallScore: s.overallScore,
      overallStatus: s.overallStatus,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
      scanDurationMs: s.scanDurationMs,
      reportId: s.reportId,
    })),
    total: sessions.length,
  });
}
