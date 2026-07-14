/**
 * POST /api/fleet/reports — generate a fleet report
 * GET  /api/fleet/reports — list fleet reports
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import { getFleetStats } from "@/lib/fleet/queries";
import type { FleetFilters } from "@/lib/fleet/types";
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

  const filters: FleetFilters = body.filters ?? {};
  const stats = await getFleetStats(filters);

  const reportCount = await db.fleetReport.count();
  const reportNumber = `RPT-FLEET-2026-${(1000 + reportCount + 1).toString()}`;

  const report = await db.fleetReport.create({
    data: {
      reportNumber,
      reportType: sanitizeText(body.reportType, 50),
      filters: body.filters ? JSON.stringify(body.filters) : null,
      totalDevices: stats.totalDevices,
      healthyDevices: stats.online,
      offlineDevices: stats.offline,
      attentionDevices: stats.attentionRequired + stats.driverUpdateAvailable + stats.firmwareUpdateAvailable,
      warrantyExpiring: stats.outOfWarranty,
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
    orderBy: { generatedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    items: reports.map((r) => ({
      id: r.id,
      reportNumber: r.reportNumber,
      reportType: r.reportType,
      filters: r.filters,
      totalDevices: r.totalDevices,
      healthyDevices: r.healthyDevices,
      offlineDevices: r.offlineDevices,
      attentionDevices: r.attentionDevices,
      warrantyExpiring: r.warrantyExpiring,
      generatedByName: r.generatedByName,
      exportFormat: r.exportFormat,
      generatedAt: r.generatedAt.toISOString(),
    })),
    total: reports.length,
  });
}
