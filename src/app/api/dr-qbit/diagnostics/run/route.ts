/**
 * POST /api/dr-qbit/diagnostics/run — run diagnostics on a device passport
 * GET  /api/dr-qbit/diagnostics — list diagnostic sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import { runDiagnostics } from "@/lib/diagnostics/engine";
import type { HealthGrade } from "@/lib/diagnostics/types";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.passportId) {
    return NextResponse.json({ error: "Missing 'passportId' field" }, { status: 400 });
  }

  try {
    const result = await runDiagnostics({
      passportId: body.passportId,
      engineerId: session.user.id,
      engineerName: session.user.name ?? undefined,
      agentVersion: body.agentVersion,
      osInfo: body.osInfo,
      hostname: body.hostname,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to run diagnostics";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const passportId = url.searchParams.get("passportId");
  const healthGrade = url.searchParams.get("healthGrade");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

  const where: Record<string, unknown> = {};
  if (passportId) where.passportId = passportId;
  if (healthGrade) where.healthGrade = healthGrade as HealthGrade;

  const sessions = await db.diagnosticSession.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      _count: { select: { findings: true, recommendations: true } },
      passport: { include: { product: true } },
    },
  });

  return NextResponse.json({
    items: sessions.map((s) => ({
      id: s.id,
      sessionToken: s.sessionToken,
      passportId: s.passportId,
      passportNumber: s.passport?.passportNumber ?? null,
      productName: s.passport?.product?.name ?? null,
      engineerName: s.engineerName,
      overallScore: s.overallScore,
      healthGrade: s.healthGrade,
      driverScore: s.driverScore,
      firmwareScore: s.firmwareScore,
      connectionScore: s.connectionScore,
      deviceStatusScore: s.deviceStatusScore,
      compatibilityScore: s.compatibilityScore,
      knowledgeScore: s.knowledgeScore,
      findingsCount: s.findingsCount,
      confirmedCount: s.confirmedCount,
      possibleCount: s.possibleCount,
      recommendationsCount: s.recommendationsCount,
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
    })),
    total: sessions.length,
  });
}
