/**
 * GET /api/cron/process-queues — retry failed email/WhatsApp queue items.
 *
 * Secured via CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/notifications/auth";
import { retryFailedQueues } from "@/lib/notifications/dispatcher";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isDev = process.env.NODE_ENV !== "production";
  const secretOk = requireCronSecret(authHeader);

  if (!secretOk && !isDev) {
    return NextResponse.json(
      { error: "Unauthorized — provide Authorization: Bearer <CRON_SECRET>" },
      { status: 401 },
    );
  }

  const result = await retryFailedQueues();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    ...result,
  });
}
