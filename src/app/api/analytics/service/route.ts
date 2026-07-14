/**
 * GET /api/analytics/service
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/notifications/auth";
import { getServiceAnalytics } from "@/lib/analytics/queries";

export async function GET(req: NextRequest) {
  try {

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const data = await getServiceAnalytics();
  return NextResponse.json(data);

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/analytics/service/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
