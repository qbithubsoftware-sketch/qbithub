/**
 * GET /api/cron/reminders — process due reminders.
 *
 * Secured via CRON_SECRET env var (Authorization: Bearer <secret>).
 * On Vercel, configure as a Cron Job hitting this endpoint every 5 minutes.
 *
 * Also processes failed queue retries.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/notifications/auth";
import { processDueReminders } from "@/lib/notifications/reminders";
import { retryFailedQueues } from "@/lib/notifications/dispatcher";

export async function GET(req: NextRequest) {
  // Allow CRON_SECRET auth OR fall back to no-auth in development
  const authHeader = req.headers.get("authorization");
  const isDev = process.env.NODE_ENV !== "production";
  const secretOk = requireCronSecret(authHeader);

  if (!secretOk && !isDev) {
    return NextResponse.json(
      { error: "Unauthorized — provide Authorization: Bearer <CRON_SECRET>" },
      { status: 401 },
    );
  }

  const remindersResult = await processDueReminders();
  const queueResult = await retryFailedQueues();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    reminders: remindersResult,
    queueRetries: queueResult,
    environment: process.env.NODE_ENV,
  });
}
