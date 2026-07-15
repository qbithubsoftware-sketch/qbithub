/**
 * GET /api/admin/purchases — list all purchase records.
 *
 * SECURITY: Super Admin or Administrator only.
 *
 * Query params:
 *   ?limit=50    — max items (default 50, max 200)
 *   ?offset=0    — pagination offset
 *   ?customerId= — filter by customer
 *   ?modelNumber= — filter by model
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { listPurchases } from "@/lib/ai-purchase/purchase-service";

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const customerId = url.searchParams.get("customerId") ?? undefined;
    const modelNumber = url.searchParams.get("modelNumber") ?? undefined;

    const result = await listPurchases({ limit, offset, customerId, modelNumber });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/purchases:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
