/**
 * GET /api/analytics/branch
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/notifications/auth";
import { getBranchAnalytics } from "@/lib/analytics/queries";

export async function GET(req: NextRequest) {
  try {

  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const data = await getBranchAnalytics();
  return NextResponse.json(data);

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/analytics/branch/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
