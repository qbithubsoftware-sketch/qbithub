/**
 * GET /api/fleet/stats — aggregate fleet statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/notifications/auth";
import { getFleetStats } from "@/lib/fleet/queries";
import type { FleetFilters } from "@/lib/fleet/types";

export async function GET(req: NextRequest) {
  try {

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const filters: FleetFilters = {
    customerId: url.searchParams.get("customerId") ?? undefined,
    branchId: url.searchParams.get("branchId") ?? undefined,
    deviceType: url.searchParams.get("deviceType") ?? undefined,
  };

  const stats = await getFleetStats(filters);

  return NextResponse.json(stats);

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/fleet/stats/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
