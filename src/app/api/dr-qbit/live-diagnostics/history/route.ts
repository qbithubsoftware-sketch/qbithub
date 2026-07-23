/**
 * GET /api/dr-qbit/live-diagnostics/history — Retrieve Phase 5 live diagnostic history
 *
 * Lists all LiveDiagnosticSessions for a device (by passportId or serialNumber).
 * Engineers can review the full diagnostic history for service records.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Authentication required
  let isAuthenticated = false;

  try {
    const { requireStaff } = await import("@/lib/notifications/auth");
    const session = await requireStaff();
    if (session) isAuthenticated = true;
  } catch {
    // Try Desktop Agent auth
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { validateAgentSecret } = await import("@/lib/drqbit/desktop-agent-auth");
      if (validateAgentSecret(token)) isAuthenticated = true;
    }
  }

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const passportId = url.searchParams.get("passportId");
  const serialNumber = url.searchParams.get("serialNumber");
  const overallStatus = url.searchParams.get("overallStatus");
  const healthGrade = url.searchParams.get("healthGrade");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

  const where: Record<string, unknown> = {};
  if (passportId) where.passportId = passportId;
  if (serialNumber) where.serialNumber = serialNumber;
  if (overallStatus) where.overallStatus = overallStatus;
  if (healthGrade) where.healthGrade = healthGrade;

  try {
    const sessions = await db.liveDiagnosticSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        passport: { include: { product: true } },
      },
    });

    return NextResponse.json({
      items: sessions.map((s) => ({
        id: s.id,
        sessionToken: s.sessionToken,
        passportId: s.passportId,
        serialNumber: s.serialNumber,
        deviceModel: s.deviceModel ?? s.passport?.product?.model ?? null,
        deviceType: s.deviceType,
        connectionType: s.connectionType,
        engineerName: s.engineerName,
        agentAvailable: s.agentAvailable,
        overallStatus: s.overallStatus,
        healthScore: s.healthScore,
        healthGrade: s.healthGrade,
        hardwareScore: s.hardwareScore,
        communicationScore: s.communicationScore,
        driverScore: s.driverScore,
        firmwareScore: s.firmwareScore,
        networkScore: s.networkScore,
        printingScore: s.printingScore,
        issuesCount: s.issuesCount,
        warningsCount: s.warningsCount,
        requiresMaintenance: s.requiresMaintenance,
        status: s.status,
        diagnosticDurationMs: s.diagnosticDurationMs,
        startedAt: s.startedAt.toISOString(),
        completedAt: s.completedAt?.toISOString() ?? null,
      })),
      total: sessions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve live diagnostic history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
