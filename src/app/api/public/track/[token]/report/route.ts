/**
 * GET /api/public/track/[token]/report — download PDF completion report
 *
 * Returns the CompletionReport data as JSON. The client renders it as
 * printable HTML + window.print() for PDF export.
 *
 * Only available if:
 *   - Token is valid
 *   - Work order status === 'completed'
 *   - CompletionReport exists
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateTrackingToken } from "@/lib/tracking/tokens";
import { safeJsonParse, safeJsonArray } from "@/lib/utils/safe-json";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {

  const { token } = await params;
  const tokenInfo = await validateTrackingToken(token);
  if (!tokenInfo) {
    return NextResponse.json({ error: "Invalid or expired tracking link" }, { status: 404 });
  }

  const wo = await db.workOrder.findUnique({
    where: { id: tokenInfo.workOrderId },
    include: {
      customer: true,
      asset: true,
      assignedEngineer: true,
      report: true,
      signatures: { orderBy: { signedAt: "desc" }, take: 1 },
    },
  });

  if (!wo) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  if (wo.status !== "completed") {
    return NextResponse.json(
      { error: "Report not available — work order is not yet complete." },
      { status: 409 },
    );
  }

  if (!wo.report) {
    return NextResponse.json(
      { error: "Report not generated yet. Please check back later." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    report: {
      reportNumber: wo.report.reportNumber,
      summary: wo.report.summary,
      testsPerformed: safeJsonParse(wo.report.testsPerformed, []),
      partsReplaced: wo.report.partsReplaced ? safeJsonParse(wo.report.partsReplaced, null) : null,
      recommendations: wo.report.recommendations,
      generatedAt: wo.report.generatedAt.toISOString(),
    },
    workOrder: {
      jobNumber: wo.jobNumber,
      type: wo.type,
      status: wo.status,
      // SECURITY: Don't expose customer name, company, or full address to token-holders.
      // Tokens are forwardable. Customers see their own data at /account.
      customerName: null,
      companyName: null,
      address: null,
      productName: wo.asset?.productName ?? null,
      model: wo.asset?.model ?? null,
      // SECURITY: Don't expose serial number or warranty to token-holders.
      serialNumber: null,
      warrantyStatus: null,
      warrantyExpiry: null,
      scheduledDate: wo.scheduledDate.toISOString(),
      scheduledTime: wo.scheduledTime,
      completedAt: wo.completedAt?.toISOString() ?? null,
      // SECURITY: Don't expose engineer name — only show "Engineer assigned" status.
      engineerName: wo.assignedEngineer ? "Engineer assigned" : null,
      // SECURITY: Don't expose signature URL — it's a customer PII artifact.
      signatureUrl: null,
      signerName: null,
      signedAt: wo.signatures[0]?.signedAt.toISOString() ?? null,
    },
  });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/public/track/[token]/report/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
