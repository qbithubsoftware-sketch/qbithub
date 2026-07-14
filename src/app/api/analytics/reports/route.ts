/**
 * POST /api/analytics/reports — generate an analytics report
 * GET  /api/analytics/reports — list analytics reports
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import { getExecutiveDashboard } from "@/lib/analytics/queries";
import { sanitizeText } from "@/lib/security/validation";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.reportType) {
    return NextResponse.json({ error: "Missing 'reportType' field" }, { status: 400 });
  }

  const exec = await getExecutiveDashboard();

  const reportCount = await db.fleetReport.count();
  const reportNumber = `RPT-ANALYTICS-2026-${(1000 + reportCount + 1).toString()}`;

  const report = await db.fleetReport.create({
    data: {
      reportNumber,
      reportType: sanitizeText(body.reportType, 50),
      filters: body.filters ? JSON.stringify(body.filters) : null,
      totalDevices: exec.totalInstalledDevices,
      healthyDevices: exec.totalActiveDevices,
      offlineDevices: 0,
      attentionDevices: exec.openWorkOrders,
      warrantyExpiring: 0,
      generatedById: session.user.id,
      generatedByName: session.user.name ?? "Admin",
      exportFormat: body.exportFormat ?? "pdf",
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);

  const reports = await db.fleetReport.findMany({
    where: { reportType: { contains: "analytics" } },
    orderBy: { generatedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    items: reports.map((r) => ({
      id: r.id,
      reportNumber: r.reportNumber,
      reportType: r.reportType,
      totalDevices: r.totalDevices,
      healthyDevices: r.healthyDevices,
      attentionDevices: r.attentionDevices,
      generatedByName: r.generatedByName,
      generatedAt: r.generatedAt.toISOString(),
    })),
    total: reports.length,
  });
}
