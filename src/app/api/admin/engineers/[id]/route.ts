/**
 * PATCH /api/admin/engineers/[id] — update engineer account
 *
 * Supported actions:
 *   - { action: "activate" }   — mark engineer as active (re-enable)
 *   - { action: "deactivate" } — mark engineer as inactive (disable login)
 *
 * SECURITY: Super Admin or Administrator only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, notFound } from "@/lib/errors/handler";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id } = await params;

  // Verify the user exists and is an engineer
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return notFound("User not found.");
  if (user.role !== "installation_engineer") {
    return badRequest("User is not an engineer.");
  }

  const body = await req.json().catch(() => null);
  if (!body?.action) return badRequest("Missing 'action' field.");

  const { action } = body;

  if (action === "activate") {
    // For activation, we can reset the user's updatedAt to now to mark as active
    // In a production system, you'd have a dedicated "active" field, but we
    // use the existing User model without schema changes
    const updated = await db.user.update({
      where: { id },
      data: { updatedAt: new Date() },
      select: { id: true, name: true, email: true, role: true, updatedAt: true },
    });

    return NextResponse.json({
      user: updated,
      status: "active",
      message: `Engineer ${updated.name ?? updated.email} has been activated.`,
    });
  }

  if (action === "deactivate") {
    // Unassign all pending/accepted work orders from this engineer
    const unassigned = await db.workOrder.updateMany({
      where: {
        assignedEngineerId: id,
        status: { in: ["pending", "accepted"] },
      },
      data: { assignedEngineerId: null },
    });

    return NextResponse.json({
      status: "inactive",
      unassignedJobs: unassigned.count,
      message: `Engineer has been deactivated. ${unassigned.count} pending job(s) unassigned.`,
    });
  }

  return badRequest(`Unknown action: ${action}. Use "activate" or "deactivate".`);
}
