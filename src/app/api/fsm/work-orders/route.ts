/**
 * GET  /api/fsm/work-orders          — list work orders for the current engineer
 * POST /api/fsm/work-orders          — create a new work order (admin only)
 *
 * Query params for GET:
 *   - status   — filter by status (comma-separated)
 *   - type     — filter by type
 *   - due      — "today" | "upcoming" | "delayed" | "all"
 *   - search   — fuzzy match on jobNumber / customer name / asset serial
 */

import { NextRequest, NextResponse } from "next/server";
import { db, requireEngineer, requireAdmin } from "@/lib/fsm/api-helpers";
import { toWorkOrderCardDTO } from "@/lib/fsm/types";
import { apiHandler, badRequest, forbidden, internalError } from "@/lib/errors/handler";
import { sanitizeText, validateRequired } from "@/lib/security/validation";

export const GET = apiHandler(async (req: NextRequest) => {
  const session = await requireEngineer();
  if (!session) return forbidden("Engineer access required.");

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const typeFilter = url.searchParams.get("type") ?? null;
  const due = url.searchParams.get("due") ?? "all";
  const search = sanitizeText(url.searchParams.get("search") ?? "", 100);

  const role = session.user.role as string;
  const engineerId = session.user.id;

  // Build where clause
  const where: Record<string, unknown> = {};

  // Installation engineers only see their assigned jobs; admins/super_admins see all.
  if (role === "installation_engineer") {
    where.assignedEngineerId = engineerId;
  }

  if (statusFilter.length > 0) {
    where.status = { in: statusFilter };
  }
  if (typeFilter) {
    where.type = typeFilter;
  }
  if (search) {
    where.OR = [
      { jobNumber: { contains: search } },
      { customer: { name: { contains: search } } },
      { asset: { serialNumber: { contains: search } } },
    ];
  }

  // Date filtering
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (due === "today") {
    where.scheduledDate = { gte: startOfToday, lte: endOfToday };
  } else if (due === "upcoming") {
    where.scheduledDate = { gt: endOfToday };
  } else if (due === "delayed") {
    where.scheduledDate = { lt: startOfToday };
    where.status = { in: ["pending", "accepted"] };
  }

  const workOrders = await db.workOrder.findMany({
    where,
    include: {
      customer: true,
      asset: true,
    },
    orderBy: { scheduledDate: "asc" },
    take: 100,
  });

  const items = workOrders.map((wo) => toWorkOrderCardDTO(wo, now));

  return NextResponse.json({ items, total: items.length });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const session = await requireAdmin();
  if (!session) return forbidden("Administrator access required.");

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid JSON body.");

  const required = ["type", "customerId", "scheduledDate", "scheduledTime"];
  const missing = validateRequired(body, required);
  if (missing.length > 0) return badRequest(`Missing fields: ${missing.join(", ")}`);

  // Generate job number and tracking code
  const jobCount = await db.workOrder.count();
  const jobNumber = `WO-${(94287 + jobCount).toString()}`;
  const publicTrackingCode = `TRK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const wo = await db.workOrder.create({
    data: {
      jobNumber,
      publicTrackingCode,
      type: sanitizeText(body.type, 50),
      status: "pending",
      priority: body.priority ?? "normal",
      customerId: body.customerId,
      assetId: body.assetId ?? null,
      assignedEngineerId: body.assignedEngineerId ?? null,
      scheduledDate: new Date(body.scheduledDate),
      scheduledTime: sanitizeText(body.scheduledTime, 10),
      estimatedMinutes: body.estimatedMinutes ?? 60,
      description: body.description ? sanitizeText(body.description, 1000) : null,
    },
    include: { customer: true, asset: true },
  });

  // Initial timeline entry
  await db.jobTimeline.create({
    data: {
      workOrderId: wo.id,
      status: "pending",
      label: "Job Assigned",
      description: "Work order created.",
      actorId: session.user.id,
      actorName: session.user.name ?? "Administrator",
    },
  });

  return NextResponse.json({ workOrder: toWorkOrderCardDTO(wo) }, { status: 201 });
});
