/**
 * GET /api/dr-qbit/tests/[sessionId] — full test session detail with results
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import type { OverallTestStatus, TestStatus, TestType, TestCategory } from "@/lib/test-center/types";
import { safeJsonParse, safeJsonArray } from "@/lib/utils/safe-json";

interface Params {
  params: Promise<{ sessionId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {

  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { sessionId } = await params;

  const testSession = await db.deviceTestSession.findUnique({
    where: { id: sessionId },
    include: {
      passport: { include: { product: true } },
      testResults: { orderBy: { createdAt: "asc" } },
      report: true,
    },
  });

  if (!testSession) {
    return NextResponse.json({ error: "Test session not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: testSession.id,
    sessionToken: testSession.sessionToken,
    passportId: testSession.passportId,
    passportNumber: testSession.passport?.passportNumber ?? null,
    productName: testSession.passport?.product?.name ?? null,
    deviceType: testSession.deviceType,
    deviceName: testSession.deviceName,
    model: testSession.model,
    engineerName: testSession.engineerName,
    workOrderId: testSession.workOrderId,
    totalTests: testSession.totalTests,
    passedCount: testSession.passedCount,
    failedCount: testSession.failedCount,
    warningCount: testSession.warningCount,
    skippedCount: testSession.skippedCount,
    notSupportedCount: testSession.notSupportedCount,
    overallScore: testSession.overallScore,
    overallStatus: testSession.overallStatus as OverallTestStatus,
    startedAt: testSession.startedAt.toISOString(),
    completedAt: testSession.completedAt?.toISOString() ?? null,
    scanDurationMs: testSession.scanDurationMs,
    reportId: testSession.reportId,
    testResults: testSession.testResults.map((r) => ({
      id: r.id,
      testType: r.testType as TestType,
      testCategory: r.testCategory as TestCategory,
      testName: r.testName,
      status: r.status as TestStatus,
      duration: r.duration,
      message: r.message,
      details: r.details ? safeJsonParse(r.details, null) : null,
      possibleCause: r.possibleCause,
      kbArticleUrl: r.kbArticleUrl,
      recommendedAction: r.recommendedAction,
      startedAt: r.startedAt?.toISOString() ?? null,
      completedAt: r.completedAt?.toISOString() ?? null,
    })),
  });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/dr-qbit/tests/[sessionId]/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
