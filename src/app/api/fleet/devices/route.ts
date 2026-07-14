/**
 * GET /api/fleet/devices — list fleet devices with filters + grouping
 * Query params: customerId, branchId, status, deviceType, brand, model,
 *   engineerId, warrantyStatus, connectionType, search, limit
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/notifications/auth";
import { getFleetDevices } from "@/lib/fleet/queries";
import type { FleetFilters, FleetDeviceStatus } from "@/lib/fleet/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const filters: FleetFilters = {
    customerId: url.searchParams.get("customerId") ?? undefined,
    branchId: url.searchParams.get("branchId") ?? undefined,
    status: (url.searchParams.get("status") as FleetDeviceStatus) ?? undefined,
    deviceType: url.searchParams.get("deviceType") ?? undefined,
    brand: url.searchParams.get("brand") ?? undefined,
    model: url.searchParams.get("model") ?? undefined,
    engineerId: url.searchParams.get("engineerId") ?? undefined,
    warrantyStatus: url.searchParams.get("warrantyStatus") ?? undefined,
    connectionType: url.searchParams.get("connectionType") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  };

  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10), 1000);

  const devices = await getFleetDevices(filters, limit);

  return NextResponse.json({
    items: devices,
    total: devices.length,
    filters,
  });
}
