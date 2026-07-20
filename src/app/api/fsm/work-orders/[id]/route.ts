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

  // Engineers only see their own assignments; admins/super_admins see all
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

  // Engineers only operate on their own assignments; admins/super_admins can operate on all
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

  // Dispatch notifications through the central Notification Automation Engine.
  // Maps FSM actions to NotificationEvent codes — the engine handles channel
  // routing, template lookup, variable substitution, and audit logging.
  const eventMap: Record<string, import("@/lib/notifications/types").NotificationEvent> = {
    accept: "customer_engineer_accepted",
    on_the_way: "customer_engineer_on_the_way",
    arrived: "customer_engineer_arrived",
    start: newStatus === "installing"
      ? (updated.type === "relocation"
          ? "customer_relocation_started"
          : updated.type === "troubleshooting" || updated.type === "inspection" || updated.type === "device_health_check"
            ? "customer_service_started"
            : "customer_installation_started")
      : "customer_installation_started",
    complete: newStatus === "completed"
      ? (updated.type === "relocation"
          ? "customer_relocation_completed"
          : updated.type === "troubleshooting" || updated.type === "inspection" || updated.type === "device_health_check"
            ? "customer_service_completed"
            : "customer_installation_completed")
      : "customer_service_completed",
  };
  const customerEvent = eventMap[action];
  if (customerEvent) {
    const { dispatch } = await import("@/lib/notifications/dispatcher");
    const scheduledDateStr = updated.scheduledDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Notify customer
    await dispatch({
      event: customerEvent,
      recipientType: "customer",
      recipientContact: updated.customer.phone ?? undefined,
      recipientName: updated.customer.name,
      workOrderId: id,
      variables: {
        CustomerName: updated.customer.name,
        CustomerPhone: updated.customer.phone ?? "",
        CustomerEmail: updated.customer.email ?? "",
        EngineerName: session.user.name ?? "your engineer",
        JobNumber: wo.jobNumber,
        JobType: updated.type.replace(/_/g, " "),
        JobStatus: newStatus,
        Date: scheduledDateStr,
        Time: updated.scheduledTime ?? "",
        ProductName: updated.asset?.productName ?? "",
        TrackingURL: `https://qbithub.vercel.app/?track=${wo.publicTrackingCode}`,
      },
    });

    // Notify admin for key events
    const adminEventMap: Record<string, import("@/lib/notifications/types").NotificationEvent> = {
      accept: "engineer_accepts",
      complete: newStatus === "completed"
        ? (updated.type === "relocation" ? "relocation_completed" : "service_completed")
        : "job_completed",
    };
    const adminEvent = adminEventMap[action];
    if (adminEvent) {
      // Find admins to notify
      const admins = await db.user.findMany({
        where: { role: "administrator" },
        select: { id: true, email: true, name: true },
      });
      for (const admin of admins) {
        await dispatch({
          event: adminEvent,
          recipientType: "admin",
          recipientId: admin.id,
          recipientContact: admin.email,
          recipientName: admin.name ?? "Admin",
          workOrderId: id,
          variables: {
            EngineerName: session.user.name ?? "",
            JobNumber: wo.jobNumber,
            JobType: updated.type.replace(/_/g, " "),
            JobStatus: newStatus,
            CustomerName: updated.customer.name,
            Date: scheduledDateStr,
            Time: updated.scheduledTime ?? "",
          },
        });
      }
    }
  }

  return NextResponse.json({ workOrder: toWorkOrderCardDTO(updated) });
}
