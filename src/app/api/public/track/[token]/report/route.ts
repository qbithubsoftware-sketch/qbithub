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

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
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
      testsPerformed: JSON.parse(wo.report.testsPerformed),
      partsReplaced: wo.report.partsReplaced ? JSON.parse(wo.report.partsReplaced) : null,
      recommendations: wo.report.recommendations,
      generatedAt: wo.report.generatedAt.toISOString(),
    },
    workOrder: {
      jobNumber: wo.jobNumber,
      type: wo.type,
      status: wo.status,
      customerName: wo.customer.name,
      companyName: wo.customer.companyName,
      address: wo.customer.addressLine,
      productName: wo.asset?.productName ?? null,
      model: wo.asset?.model ?? null,
      serialNumber: wo.asset?.serialNumber ?? null,
      warrantyStatus: wo.asset?.warrantyStatus ?? null,
      warrantyExpiry: wo.asset?.warrantyExpiry?.toISOString() ?? null,
      scheduledDate: wo.scheduledDate.toISOString(),
      scheduledTime: wo.scheduledTime,
      completedAt: wo.completedAt?.toISOString() ?? null,
      engineerName: wo.assignedEngineer?.name ?? null,
      signatureUrl: wo.signatures[0]?.storagePath ?? null,
      signerName: wo.signatures[0]?.signerName ?? null,
      signedAt: wo.signatures[0]?.signedAt.toISOString() ?? null,
    },
  });
}
