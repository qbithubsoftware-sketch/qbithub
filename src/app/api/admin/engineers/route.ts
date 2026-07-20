/**
 * GET /api/admin/engineers — list all engineers with status, job counts, and activity
 *
 * Returns installation_engineer + support_engineer users with:
 *   - Total assigned jobs, pending, in-progress, completed counts
 *   - Active/inactive status (based on recent activity)
 *   - Latest assignment date
 *
 * SECURITY: Super Admin or Administrator only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    // Fetch all engineer-role users
    const engineers = await db.user.findMany({
      where: {
        role: { in: ["installation_engineer", "support_engineer"] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        assignedWorkOrders: {
          select: {
            id: true,
            status: true,
            scheduledDate: true,
            completedAt: true,
            createdAt: true,
            customer: { select: { name: true } },
            asset: { select: { productName: true, model: true } },
            jobNumber: true,
            type: true,
          },
          orderBy: { scheduledDate: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const items = engineers.map((eng) => {
      const jobs = eng.assignedWorkOrders;
      const pending = jobs.filter(
        (j) => j.status === "pending" || j.status === "accepted"
      );
      const inProgress = jobs.filter(
        (j) =>
          j.status === "on_the_way" ||
          j.status === "arrived" ||
          j.status === "installing" ||
          j.status === "testing"
      );
      const completed = jobs.filter((j) => j.status === "completed");
      const delayed = jobs.filter(
        (j) =>
          (j.status === "pending" || j.status === "accepted") &&
          new Date(j.scheduledDate) < now
      );

      // Consider active if updated within last 7 days or has pending/in-progress jobs
      const isActive =
        eng.updatedAt >= sevenDaysAgo ||
        pending.length > 0 ||
        inProgress.length > 0;

      const latestJob = jobs[0] ?? null;

      return {
        id: eng.id,
        email: eng.email,
        name: eng.name ?? "Unnamed Engineer",
        image: eng.image,
        role: eng.role,
        status: (isActive ? "active" : "inactive") as "active" | "inactive",
        jobStats: {
          total: jobs.length,
          pending: pending.length,
          inProgress: inProgress.length,
          completed: completed.length,
          delayed: delayed.length,
        },
        latestAssignment: latestJob
          ? {
              jobNumber: latestJob.jobNumber,
              type: latestJob.type,
              customerName: latestJob.customer.name,
              productName: latestJob.asset?.productName ?? null,
              scheduledDate: latestJob.scheduledDate.toISOString(),
              status: latestJob.status,
            }
          : null,
        createdAt: eng.createdAt.toISOString(),
        updatedAt: eng.updatedAt.toISOString(),
      };
    });

    // Summary stats
    const summary = {
      totalEngineers: items.length,
      activeEngineers: items.filter((e) => e.status === "active").length,
      inactiveEngineers: items.filter((e) => e.status === "inactive").length,
      totalPending: items.reduce((sum, e) => sum + e.jobStats.pending, 0),
      totalInProgress: items.reduce((sum, e) => sum + e.jobStats.inProgress, 0),
      totalCompleted: items.reduce((sum, e) => sum + e.jobStats.completed, 0),
      totalDelayed: items.reduce((sum, e) => sum + e.jobStats.delayed, 0),
    };

    return NextResponse.json({ items, summary, total: items.length });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/engineers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
