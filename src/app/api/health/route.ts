/**
 * Health check endpoint — `/api/health`.
 *
 * Returns 200 if the application is healthy, 503 if any dependency
 * is down.  Used by load balancers and monitoring systems.
 */

import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    server: "ok",
  };

  // Check database connectivity
  try {
    const { db } = await import("@/lib/db");
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
    },
    { status: allOk ? 200 : 503 },
  );
}
