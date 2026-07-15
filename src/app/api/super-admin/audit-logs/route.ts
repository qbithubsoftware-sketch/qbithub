/**
 * GET /api/super-admin/audit-logs — list audit log entries.
 *
 * SECURITY: Super Administrator only. Uses requireSuperAdmin().
 *
 * Query params:
 *   ?limit=100  — max entries (default 100, max 500)
 *   ?offset=0   — pagination offset
 *   ?action=    — filter by action type
 *   ?userId=    — filter by user
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/notifications/auth";
import { listAuditLogs } from "@/lib/audit/audit-log";

export async function GET(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) {
    return NextResponse.json({ error: "Super Administrator access required" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const action = url.searchParams.get("action") ?? undefined;
    const userId = url.searchParams.get("userId") ?? undefined;

    const result = await listAuditLogs({ limit, offset, action, userId });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API ERROR] GET /api/super-admin/audit-logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
