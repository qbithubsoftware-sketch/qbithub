/**
 * POST /api/fsm/work-orders/[id]/report — generate a completion report
 *
 * Creates a CompletionReport row and returns it as JSON.
 * (PDF generation is intentionally NOT done here — the client uses the JSON
 *  to render a printable view + window.print() to produce a PDF. This avoids
 *  a heavy server-side PDF dependency and works on Vercel serverless.)
 *
 * Body: { summary, testsPerformed: [{name, result, notes}], partsReplaced: [...], recommendations }
 */

import { NextRequest, NextResponse } from "next/server";
import { db, requireFieldEngineer } from "@/lib/fsm/api-helpers";
import { badRequest, forbidden, notFound } from "@/lib/errors/handler";
import { sanitizeText, validateRequired } from "@/lib/security/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireFieldEngineer();
  if (!session) return forbidden("Field engineer access required.");

  const { id } = await params;
  const wo = await db.workOrder.findUnique({
    where: { id },
    select: { id: true, jobNumber: true, assignedEngineerId: true },
  });
  if (!wo) return notFound("Work order not found.");

  const role = session.user.role as string;
  if (role === "installation_engineer" && wo.assignedEngineerId !== session.user.id) {
    return forbidden("Not assigned to you.");
  }

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid JSON body.");

  const missing = validateRequired(body, ["summary", "testsPerformed"]);
  if (missing.length > 0) return badRequest(`Missing fields: ${missing.join(", ")}`);

  // Generate report number
  const reportCount = await db.completionReport.count();
  const reportNumber = `RPT-2026-${(1000 + reportCount).toString()}`;

  const report = await db.completionReport.create({
    data: {
      workOrderId: id,
      reportNumber,
      summary: sanitizeText(body.summary, 2000),
      testsPerformed: JSON.stringify(body.testsPerformed ?? []),
      partsReplaced: body.partsReplaced ? JSON.stringify(body.partsReplaced) : null,
      recommendations: body.recommendations ? sanitizeText(body.recommendations, 1000) : null,
      generatedById: session.user.id,
    },
  });

  // Mark the work order as completed (if not already)
  await db.workOrder.updateMany({
    where: { id, status: { not: "completed" } },
    data: { status: "completed", completedAt: new Date() },
  });

  // Add timeline entry
  await db.jobTimeline.create({
    data: {
      workOrderId: id,
      status: "completed",
      label: "Completed",
      description: `Report ${reportNumber} generated.`,
      actorId: session.user.id,
      actorName: session.user.name ?? "Engineer",
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}
export async function GET(req: NextRequest, { params }: Params) {
  const session = await requireFieldEngineer();
  if (!session) return forbidden("Field engineer access required.");

  const { id } = await params;
  const report = await db.completionReport.findUnique({ where: { workOrderId: id } });
  if (!report) return notFound("No report generated yet.");

  return NextResponse.json({
    report: {
      ...report,
      testsPerformed: JSON.parse(report.testsPerformed),
      partsReplaced: report.partsReplaced ? JSON.parse(report.partsReplaced) : null,
    },
  });
}
