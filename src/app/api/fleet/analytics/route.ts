/**
 * GET /api/fleet/analytics — fleet analytics (most installed, most active, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";
import { safeJsonParse, safeJsonArray } from "@/lib/utils/safe-json";

export async function GET(req: NextRequest) {
  try {

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Most installed devices (by device type)
  const passports = await db.devicePassport.findMany({
    include: { product: true, branch: { include: { customer: true } } },
    take: 10000,
  });

  const byDeviceType: Record<string, number> = {};
  const byProduct: Record<string, number> = {};
  const byEngineer: Record<string, { name: string; count: number }> = {};

  for (const p of passports) {
    const dt = p.product?.deviceType ?? "unknown";
    byDeviceType[dt] = (byDeviceType[dt] ?? 0) + 1;

    const pn = p.product?.name ?? "Unknown";
    byProduct[pn] = (byProduct[pn] ?? 0) + 1;

    if (p.assignedEngineerId) {
      if (!byEngineer[p.assignedEngineerId]) {
        byEngineer[p.assignedEngineerId] = { name: "Engineer", count: 0 };
      }
      byEngineer[p.assignedEngineerId].count++;
    }
  }

  const mostInstalledDevices = Object.entries(byDeviceType)
    .map(([deviceType, count]) => ({ deviceType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const mostServicedProducts = Object.entries(byProduct)
    .map(([productName, count]) => ({ productName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const mostActiveEngineers = Object.values(byEngineer)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((e) => ({ engineerName: e.name, deviceCount: e.count, scanCount: 0 }));

  // Most common issues (from diagnostic findings)
  const findings = await db.diagnosticFinding.groupBy({
    by: ["title"],
    _count: true,
    orderBy: { _count: { title: "desc" } },
    take: 10,
  });

  const mostCommonIssues = findings.map((f) => ({
    issue: f.title,
    count: f._count,
  }));

  // Warranty expiring soon (within 90 days)
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const warrantyExpiringSoon = await db.deviceWarranty.count({
    where: {
      warrantyStatus: "active",
      warrantyExpiryDate: { lte: ninetyDaysFromNow, gte: now },
    },
  });

  // Total customers + branches
  const totalCustomers = await db.fSMCustomer.count();
  const totalBranches = await db.branch.count();

  return NextResponse.json({
    mostInstalledDevices,
    mostCommonIssues,
    mostActiveEngineers,
    mostServicedProducts,
    warrantyExpiringSoon,
    totalCustomers,
    totalBranches,
  });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/fleet/analytics/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
