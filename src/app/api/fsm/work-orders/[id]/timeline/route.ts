/**
 * GET  /api/fsm/work-orders/[id]/timeline  — list timeline entries for a work order
 * POST /api/fsm/work-orders/[id]/timeline  — add a custom timeline entry (admin/engineer)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, requireEngineer } from "@/lib/fsm/api-helpers";
import { badRequest, forbidden, notFound } from "@/lib/errors/handler";
import { sanitizeText } from "@/lib/security/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await requireEngineer();
  if (!session) return forbidden("Engineer access required.");

  const { id } = await params;
  const wo = await db.workOrder.findUnique({ where: { id }, select: { assignedEngineerId: true } });
  if (!wo) return notFound("Work order not found.");

  const role = session.user.role as string;
  if (role === "installation_engineer" && wo.assignedEngineerId !== session.user.id) {
    return forbidden("Not assigned to you.");
  }

  const entries = await db.jobTimeline.findMany({
    where: { workOrderId: id },
    orderBy: { occurredAt: "asc" },
  });

  return NextResponse.json({
    items: entries.map((e) => ({
      id: e.id,
      status: e.status,
      label: e.label,
      description: e.description,
      actorName: e.actorName,
      occurredAt: e.occurredAt.toISOString(),
    })),
  });
}
export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireEngineer();
  if (!session) return forbidden("Engineer access required.");

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid JSON body.");

  const wo = await db.workOrder.findUnique({ where: { id }, select: { assignedEngineerId: true } });
  if (!wo) return notFound("Work order not found.");

  const role = session.user.role as string;
  if (role === "installation_engineer" && wo.assignedEngineerId !== session.user.id) {
    return forbidden("Not assigned to you.");
  }

  const entry = await db.jobTimeline.create({
    data: {
      workOrderId: id,
      status: sanitizeText(body.status ?? "note", 50),
      label: sanitizeText(body.label ?? "Note", 100),
      description: body.description ? sanitizeText(body.description, 500) : null,
      actorId: session.user.id,
      actorName: session.user.name ?? "Engineer",
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
