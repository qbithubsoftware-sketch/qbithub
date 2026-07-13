/**
 * GET /api/fsm/work-orders/[id]/notifications — list notifications sent for a work order
 */

import { NextRequest, NextResponse } from "next/server";
import { db, requireEngineer } from "@/lib/fsm/api-helpers";
import { forbidden, notFound } from "@/lib/errors/handler";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await requireEngineer();
  if (!session) return forbidden("Engineer access required.");

  const { id } = await params;
  const wo = await db.workOrder.findUnique({
    where: { id },
    select: { assignedEngineerId: true },
  });
  if (!wo) return notFound("Work order not found.");

  const role = session.user.role as string;
  if (role === "installation_engineer" && wo.assignedEngineerId !== session.user.id) {
    return forbidden("Not assigned to you.");
  }

  const notifications = await db.notificationLog.findMany({
    where: { workOrderId: id },
    orderBy: { sentAt: "desc" },
  });

  return NextResponse.json({
    items: notifications.map((n) => ({
      id: n.id,
      channel: n.channel,
      template: n.template,
      recipient: n.recipient,
      subject: n.subject,
      body: n.body,
      status: n.status,
      sentAt: n.sentAt.toISOString(),
    })),
  });
}
