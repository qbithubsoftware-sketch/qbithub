/**
 * GET /api/analytics/service
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/notifications/auth";
import { getServiceAnalytics } from "@/lib/analytics/queries";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const data = await getServiceAnalytics();
  return NextResponse.json(data);
}
