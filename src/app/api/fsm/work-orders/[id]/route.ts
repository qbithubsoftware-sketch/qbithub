/**
 * GET    /api/fsm/work-orders/[id]  — fetch full detail
 * PATCH  /api/fsm/work-orders/[id]  — update status (engineer accepts/rejects/advances)
 *
 * PATCH body:
 *   - action: "accept" | "reject" | "on_the_way" | "arrived"
 *             | "start" | "testing" | "complete" | "cancel" | "reschedule"
 *   - rescheduledTo?: ISO date (only for "reschedule")
 *   - reason?: string (for cancel/reschedule)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, requireEngineer } from "@/lib/fsm/api-helpers";
import {
  type WorkOrderStatus,
  customerLabelForStatus,
  toWorkOrderCardDTO,
} from "@/lib/fsm/types";
import { badRequest, forbidden, notFound } from "@/lib/errors/handler";
import { sanitizeText } from "@/lib/security/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await requireEngineer();
  if (!session) return forbidden("Engineer access required.");

  const { id } = await params;
  const wo = await db.workOrder.findUnique({
    where: { id },
    include: { customer: true, asset: true, assignedEngineer: true },
  });
  if (!wo) return notFound("Work order not found.");

  // Engineers only see their own assignments
  const role = session.user.role as string;
  if (role === "installation_engineer" && wo.assignedEngineerId !== session.user.id) {
    return forbidden("Not assigned to you.");
  }

  const card = toWorkOrderCardDTO(wo);
  return NextResponse.json({
    ...card,
    publicTrackingCode: wo.publicTrackingCode,
    customerId: wo.customerId,
    customerPhone: wo.customer.phone,
    customerEmail: wo.customer.email,
    geoLat: wo.customer.geoLat,
    geoLng: wo.customer.geoLng,
    assignedEngineerId: wo.assignedEngineerId,
    assignedEngineerName: wo.assignedEngineer?.name ?? null,
    assetId: wo.assetId,
    serialNumber: wo.asset?.serialNumber ?? null,
    qrCode: wo.asset?.qrCode ?? null,
    purchaseDate: wo.asset?.purchaseDate?.toISOString() ?? null,
    warrantyStatus: wo.asset?.warrantyStatus ?? null,
    warrantyExpiry: wo.asset?.warrantyExpiry?.toISOString() ?? null,
    firmwareVersion: wo.asset?.firmwareVersion ?? null,
    driverVersion: wo.asset?.driverVersion ?? null,
    description: wo.description,
    startedAt: wo.startedAt?.toISOString() ?? null,
    arrivedAt: wo.arrivedAt?.toISOString() ?? null,
    completedAt: wo.completedAt?.toISOString() ?? null,
  });
}
const ACTION_TO_STATUS: Record<string, WorkOrderStatus> = {
  accept: "accepted",
  reject: "cancelled",
  on_the_way: "on_the_way",
  arrived: "arrived",
  start: "installing",
  testing: "testing",
  complete: "completed",
  cancel: "cancelled",
};

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireEngineer();
  if (!session) return forbidden("Engineer access required.");

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || !body.action) return badRequest("Missing 'action' field.");

  const action: string = body.action;
  const wo = await db.workOrder.findUnique({ where: { id } });
  if (!wo) return notFound("Work order not found.");

  // Engineers only operate on their own assignments
  const role = session.user.role as string;
  if (role === "installation_engineer" && wo.assignedEngineerId !== session.user.id) {
    return forbidden("Not assigned to you.");
  }

  // Special handling for reschedule
  if (action === "reschedule") {
    if (!body.rescheduledTo) return badRequest("rescheduledTo is required for reschedule action.");
    const newDate = new Date(body.rescheduledTo);
    if (isNaN(newDate.getTime())) return badRequest("Invalid date for rescheduledTo.");

    const updated = await db.workOrder.update({
      where: { id },
      data: {
        status: "rescheduled",
        rescheduledFrom: wo.scheduledDate,
        rescheduledTo: newDate,
        scheduledDate: newDate,
      },
      include: { customer: true, asset: true },
    });

    await db.jobTimeline.create({
      data: {
        workOrderId: id,
        status: "rescheduled",
        label: "Rescheduled",
        description: body.reason ? sanitizeText(body.reason, 500) : "Rescheduled by engineer.",
        actorId: session.user.id,
        actorName: session.user.name ?? "Engineer",
      },
    });

    return NextResponse.json({ workOrder: toWorkOrderCardDTO(updated) });
  }

  const newStatus = ACTION_TO_STATUS[action];
  if (!newStatus) return badRequest(`Unknown action: ${action}`);

  // Update timestamps based on action
  const now = new Date();
  const updateData: Record<string, unknown> = { status: newStatus };
  if (action === "arrived") updateData.arrivedAt = now;
  if (action === "start") updateData.startedAt = now;
  if (action === "complete") updateData.completedAt = now;
  if (action === "cancel") updateData.cancelledAt = now;

  const updated = await db.workOrder.update({
    where: { id },
    data: updateData,
    include: { customer: true, asset: true },
  });

  await db.jobTimeline.create({
    data: {
      workOrderId: id,
      status: newStatus,
      label: customerLabelForStatus(newStatus),
      description: null,
      actorId: session.user.id,
      actorName: session.user.name ?? "Engineer",
    },
  });

  // Auto-send notification (logged only — no real email/WhatsApp provider wired)
  const templateMap: Record<string, string> = {
    accepted: "engineer_accepted",
    on_the_way: "engineer_on_the_way",
    arrived: "engineer_arrived",
    start: "installation_started",
    complete: newStatus === "completed" ? "installation_completed" : "service_completed",
  };
  const template = templateMap[action];
  if (template) {
    const messageTemplates: Record<string, string> = {
      engineer_accepted: `QBIT Hub: Engineer ${session.user.name ?? ""} has accepted your job ${wo.jobNumber}.`,
      engineer_on_the_way: `QBIT Hub: Engineer is on the way for job ${wo.jobNumber}. ETA shortly.`,
      engineer_arrived: `QBIT Hub: Engineer has arrived on site for job ${wo.jobNumber}.`,
      installation_started: `QBIT Hub: Installation has started for job ${wo.jobNumber}.`,
      installation_completed: `QBIT Hub: Your installation ${wo.jobNumber} is now complete. Thank you for choosing QBIT.`,
      service_completed: `QBIT Hub: Service visit ${wo.jobNumber} is complete. Tracking link: https://hub.qbit.com/track/${wo.publicTrackingCode}`,
    };

    await db.notificationLog.create({
      data: {
        workOrderId: id,
        channel: updated.customer.phone ? "whatsapp" : "email",
        template,
        recipient: updated.customer.phone ?? updated.customer.email ?? "",
        subject: template.startsWith("installation") ? `QBIT Hub — ${wo.jobNumber}` : "",
        body: messageTemplates[template] ?? "",
        status: "sent",
      },
    });
  }

  return NextResponse.json({ workOrder: toWorkOrderCardDTO(updated) });
}
