/**
 * GET /api/dr-qbit/diagnostics/[sessionId] — full diagnostic session detail
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import { safeJsonParse, safeJsonArray } from "@/lib/utils/safe-json";
import type {
  DiagnosticCategory,
  FindingSeverity,
  CertaintyLevel,
  RecommendationAction,
  RecommendationPriority,
  HealthGrade,
} from "@/lib/diagnostics/types";

interface Params {
  params: Promise<{ sessionId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {

  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { sessionId } = await params;

  const diagSession = await db.diagnosticSession.findUnique({
    where: { id: sessionId },
    include: {
      passport: { include: { product: true } },
      findings: { orderBy: { createdAt: "asc" } },
      recommendations: { orderBy: { priority: "desc" } },
      healthScore: true,
    },
  });

  if (!diagSession) {
    return NextResponse.json({ error: "Diagnostic session not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: diagSession.id,
    sessionToken: diagSession.sessionToken,
    passportId: diagSession.passportId,
    passportNumber: diagSession.passport?.passportNumber ?? null,
    productName: diagSession.passport?.product?.name ?? null,
    deviceName: diagSession.passport?.deviceName ?? null,
    model: diagSession.passport?.model ?? null,
    engineerName: diagSession.engineerName,
    agentVersion: diagSession.agentVersion,
    osInfo: diagSession.osInfo,
    hostname: diagSession.hostname,
    scanDurationMs: diagSession.scanDurationMs,
    overallScore: diagSession.overallScore,
    healthGrade: diagSession.healthGrade as HealthGrade,
    driverScore: diagSession.driverScore,
    firmwareScore: diagSession.firmwareScore,
    connectionScore: diagSession.connectionScore,
    deviceStatusScore: diagSession.deviceStatusScore,
    compatibilityScore: diagSession.compatibilityScore,
    knowledgeScore: diagSession.knowledgeScore,
    findingsCount: diagSession.findingsCount,
    confirmedCount: diagSession.confirmedCount,
    possibleCount: diagSession.possibleCount,
    recommendationsCount: diagSession.recommendationsCount,
    status: diagSession.status,
    startedAt: diagSession.startedAt.toISOString(),
    completedAt: diagSession.completedAt?.toISOString() ?? null,
    findings: diagSession.findings.map((f) => ({
      id: f.id,
      category: f.category as DiagnosticCategory,
      severity: f.severity as FindingSeverity,
      title: f.title,
      description: f.description,
      certainty: f.certainty as CertaintyLevel,
      evidence: f.evidence ? safeJsonParse(f.evidence, []) : null,
      kbArticleId: f.kbArticleId,
      recommendedAction: f.recommendedAction,
      createdAt: f.createdAt.toISOString(),
    })),
    recommendations: diagSession.recommendations.map((r) => ({
      id: r.id,
      findingId: r.findingId,
      title: r.title,
      description: r.description,
      actionType: r.actionType as RecommendationAction,
      resourceUrl: r.resourceUrl,
      resourceScreen: r.resourceScreen,
      priority: r.priority as RecommendationPriority,
      createdAt: r.createdAt.toISOString(),
    })),
  });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/dr-qbit/diagnostics/[sessionId]/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
