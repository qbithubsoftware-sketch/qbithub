/**
 * GET /api/fleet/stats — aggregate fleet statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/notifications/auth";
import { getFleetStats } from "@/lib/fleet/queries";
import type { FleetFilters } from "@/lib/fleet/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
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
}
