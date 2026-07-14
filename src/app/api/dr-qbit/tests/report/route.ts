/**
 * POST /api/dr-qbit/tests/report — generate a test report
 *
 * Body: { sessionId: string }
 * Creates a TestReport record with denormalized data for quick access.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireEngineerOrAdmin } from "@/lib/notifications/auth";

export async function POST(req: NextRequest) {
  const session = await requireEngineerOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.sessionId) {
    return NextResponse.json({ error: "Missing 'sessionId' field" }, { status: 400 });
  }

  const testSession = await db.deviceTestSession.findUnique({
    where: { id: body.sessionId },
    include: {
      passport: { include: { product: true } },
    },
  });

  if (!testSession) {
    return NextResponse.json({ error: "Test session not found" }, { status: 404 });
  }

  // Check if report already exists
  if (testSession.reportId) {
    const existing = await db.testReport.findUnique({ where: { id: testSession.reportId } });
    if (existing) {
      return NextResponse.json({ report: existing, message: "Report already generated" });
    }
  }

  // Generate report number
  const reportCount = await db.testReport.count();
  const reportNumber = `RPT-TEST-2026-${(1000 + reportCount + 1).toString()}`;

  const report = await db.testReport.create({
    data: {
      reportNumber,
      sessionId: testSession.id,
      customerName: null, // would be populated from work order customer
      companyName: null,
      engineerName: testSession.engineerName,
      deviceName: testSession.deviceName,
      model: testSession.model,
      serialNumber: testSession.passport?.serialNumber ?? null,
      overallScore: testSession.overallScore,
      overallStatus: testSession.overallStatus,
      passedCount: testSession.passedCount,
      failedCount: testSession.failedCount,
      warningCount: testSession.warningCount,
      totalTests: testSession.totalTests,
      generatedById: session.user.id,
      generatedByName: session.user.name ?? "Engineer",
    },
  });

  // Link report to session
  await db.deviceTestSession.update({
    where: { id: testSession.id },
    data: { reportId: report.id },
  });

  return NextResponse.json({ report }, { status: 201 });
}
