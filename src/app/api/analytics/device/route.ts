/**
 * GET /api/analytics/device
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/notifications/auth";
import { getDeviceAnalytics } from "@/lib/analytics/queries";

export async function GET(req: NextRequest) {
  try {

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const data = await getDeviceAnalytics();
  return NextResponse.json(data);

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/analytics/device/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
