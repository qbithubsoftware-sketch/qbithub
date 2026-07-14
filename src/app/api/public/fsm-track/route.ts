/**
 * POST /api/public/fsm-track — public tracking lookup (no auth required)
 *
 * Body: { trackingCode } OR { jobNumber }
 *
 * Returns a sanitized public view — NO internal notes, NO engineer email,
 * NO addresses beyond the city for privacy.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  type WorkOrderStatus,
  PROGRESS_STATUSES,
  customerLabelForStatus,
} from "@/lib/fsm/types";
import { apiHandler, badRequest, notFound } from "@/lib/errors/handler";

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid JSON body.");

  const code: string = body.trackingCode ?? body.jobNumber ?? "";
  if (!code || typeof code !== "string") {
    return badRequest("trackingCode is required.");
  }
  const normalized = code.trim().toUpperCase();

  const wo = await db.workOrder.findFirst({
    where: {
      OR: [
        { publicTrackingCode: normalized },
        { jobNumber: normalized },
      ],
    },
    include: {
      customer: true,
      asset: true,
      assignedEngineer: true,
      timeline: { orderBy: { occurredAt: "asc" } },
    },
  });

  if (!wo) return notFound("Tracking code not found. Please check and try again.");

  // Build a customer-safe timeline. Only forward-progress events are shown —
  // cancelled/rescheduled are surfaced as a single banner instead.
  const progressSet = new Set<WorkOrderStatus>(PROGRESS_STATUSES);
  const timeline = wo.timeline
    .filter((t) => progressSet.has(t.status as WorkOrderStatus))
    .map((t) => ({
      label: t.label,
      description: t.description,
      occurredAt: t.occurredAt.toISOString(),
    }));

  // Compute which progress milestones are "done" based on current status
  const currentStatusIdx = PROGRESS_STATUSES.indexOf(wo.status as WorkOrderStatus);
  const milestones = PROGRESS_STATUSES.map((status, idx) => ({
    label: customerLabelForStatus(status),
    done: idx <= currentStatusIdx && currentStatusIdx >= 0,
  }));

  return NextResponse.json({
    jobNumber: wo.jobNumber,
    type: wo.type,
    status: wo.status,
    scheduledDate: wo.scheduledDate.toISOString(),
    scheduledTime: wo.scheduledTime,
    // SECURITY: Don't expose engineer name publicly — only show "Engineer assigned" status.
    engineerAssigned: !!wo.assignedEngineer,
    engineerPhone: wo.assignedEngineer ? "+91 90000 00000" : null, // masked
    productName: wo.asset?.productName ?? null,
    model: wo.asset?.model ?? null,
    // SECURITY: Don't expose serial number, warranty status, or warranty expiry to public.
    // These are customer-PII fields and tracking codes are forwardable. Customers
    // should log in to /account to see their full warranty details.
    milestones,
    timeline,
  });
});
