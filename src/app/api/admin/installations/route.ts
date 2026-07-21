/**
 * GET  /api/admin/installations — list all installation work orders (admin view)
 * POST /api/admin/installations — create a new installation job
 *
 * GET query params:
 *   - status   — filter by status (comma-separated)
 *   - engineer — filter by assignedEngineerId
 *   - search   — search jobNumber, customer name, serial number
 *   - due      — "today" | "upcoming" | "all"
 *
 * POST body:
 *   - customerId       (required) — FSMCustomer.id, auto-fetched from Device Lookup
 *   - assetId          (optional) — FSMCustomerAsset.id
 *   - assignedEngineerId (required) — User.id of installation_engineer
 *   - scheduledDate    (required) — ISO date
 *   - scheduledTime    (optional) — "10:30"
 *   - type             (optional, defaults to "installation")
 *   - priority         (optional, defaults to "normal")
 *   - description      (optional) — internal notes
 *
 * SECURITY: Super Admin or Administrator only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { db } from "@/lib/db";
import { sanitizeText } from "@/lib/security/validation";

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status")?.split(",").filter(Boolean) ?? [];
    const engineerFilter = url.searchParams.get("engineer");
    const search = sanitizeText(url.searchParams.get("search") ?? "", 100);
    const due = url.searchParams.get("due") ?? "all";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (statusFilter.length > 0) {
      where.status = { in: statusFilter };
    }
    if (engineerFilter) {
      where.assignedEngineerId = engineerFilter;
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
    }

    const workOrders = await db.workOrder.findMany({
      where,
      include: {
        customer: true,
        asset: true,
        assignedEngineer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { scheduledDate: "desc" },
      take: 200,
    });

    const items = workOrders.map((wo) => ({
      id: wo.id,
      jobNumber: wo.jobNumber,
      type: wo.type,
      status: wo.status,
      priority: wo.priority,
      customerName: wo.customer.name,
      companyName: wo.customer.companyName,
      customerPhone: wo.customer.phone,
      customerEmail: wo.customer.email,
      address: wo.customer.addressLine,
      productName: wo.asset?.productName ?? null,
      model: wo.asset?.model ?? null,
      serialNumber: wo.asset?.serialNumber ?? null,
      assignedEngineerId: wo.assignedEngineerId,
      assignedEngineerName: wo.assignedEngineer?.name ?? null,
      scheduledDate: wo.scheduledDate.toISOString(),
      scheduledTime: wo.scheduledTime,
      estimatedMinutes: wo.estimatedMinutes,
      description: wo.description,
      completedAt: wo.completedAt?.toISOString() ?? null,
      isDelayed:
        (wo.status === "pending" || wo.status === "accepted") &&
        new Date(wo.scheduledDate) < now,
      createdAt: wo.createdAt.toISOString(),
    }));

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/installations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Required fields for installation assignment
    // Either customerId (existing FSMCustomer) OR _customerData (raw data for find-or-create)
    const hasCustomerId = !!body.customerId;
    const hasCustomerData = !!body._customerData;

    if (!hasCustomerId && !hasCustomerData) {
      return NextResponse.json(
        { error: "Missing required: provide either customerId or _customerData" },
        { status: 400 }
      );
    }

    if (!body.assignedEngineerId) {
      return NextResponse.json({ error: "Missing required field: assignedEngineerId" }, { status: 400 });
    }
    if (!body.scheduledDate) {
      return NextResponse.json({ error: "Missing required field: scheduledDate" }, { status: 400 });
    }

    let customerId: string;
    let assetId: string | null = body.assetId ?? null;

    // If raw customer data is provided, find-or-create FSMCustomer + FSMCustomerAsset
    if (hasCustomerData) {
      const cd = body._customerData;
      const dd = body._deviceData;

      // Find existing FSMCustomer by phone
      let fsmCustomer = await db.fSMCustomer.findFirst({
        where: { phone: cd.phone },
      });

      if (!fsmCustomer) {
        // Create FSMCustomer from raw data
        const addressParts = (cd.address ?? "").split(",").map((s: string) => s.trim());
        fsmCustomer = await db.fSMCustomer.create({
          data: {
            name: sanitizeText(cd.name, 200),
            phone: sanitizeText(cd.phone, 20),
            email: cd.email ? sanitizeText(cd.email, 200) : null,
            companyName: cd.companyName ? sanitizeText(cd.companyName, 200) : null,
            addressLine: sanitizeText(cd.address ?? "Address not provided", 500),
            city: addressParts.length > 1 ? sanitizeText(addressParts[1], 100) : null,
            state: addressParts.length > 2 ? sanitizeText(addressParts[2], 100) : null,
            postalCode: addressParts.length > 3 ? sanitizeText(addressParts[3], 20) : null,
          },
        });
      }

      customerId = fsmCustomer.id;

      // Find or create FSMCustomerAsset if device data provided
      if (dd?.serialNumber) {
        let fsmAsset = await db.fSMCustomerAsset.findFirst({
          where: { serialNumber: dd.serialNumber },
        });

        if (!fsmAsset) {
          fsmAsset = await db.fSMCustomerAsset.create({
            data: {
              customerId: fsmCustomer.id,
              productName: sanitizeText(dd.productName ?? "Unknown Device", 200),
              model: sanitizeText(dd.modelNumber ?? "", 100),
              serialNumber: sanitizeText(dd.serialNumber, 100),
              warrantyStatus: "unknown",
            },
          });
        }

        assetId = fsmAsset.id;
      }
    } else {
      // Use provided customerId directly
      customerId = body.customerId;
    }

    // Verify engineer exists and is an installation engineer
    const engineer = await db.user.findUnique({
      where: { id: body.assignedEngineerId },
    });
    if (!engineer || engineer.role !== "installation_engineer") {
      return NextResponse.json(
        { error: "Invalid engineer. Must be an installation engineer." },
        { status: 400 }
      );
    }

    // Verify FSMCustomer exists (for direct customerId path)
    if (hasCustomerId && !hasCustomerData) {
      const customer = await db.fSMCustomer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
    }

    // Verify asset exists if provided directly
    if (body.assetId && !hasCustomerData) {
      const asset = await db.fSMCustomerAsset.findUnique({
        where: { id: body.assetId },
      });
      if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }
    }

    // Generate job number and tracking code
    const jobCount = await db.workOrder.count();
    const jobNumber = `WO-${(94287 + jobCount).toString()}`;
    const publicTrackingCode = `TRK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const wo = await db.workOrder.create({
      data: {
        jobNumber,
        publicTrackingCode,
        type: sanitizeText(body.type ?? "installation", 50),
        status: "pending",
        priority: body.priority ?? "normal",
        customerId,
        assetId,
        assignedEngineerId: body.assignedEngineerId,
        scheduledDate: new Date(body.scheduledDate),
        scheduledTime: body.scheduledTime ? sanitizeText(body.scheduledTime, 10) : null,
        estimatedMinutes: body.estimatedMinutes ?? 60,
        description: body.description ? sanitizeText(body.description, 1000) : null,
      },
      include: {
        customer: true,
        asset: true,
        assignedEngineer: { select: { id: true, name: true } },
      },
    });

    // Initial timeline entry
    await db.jobTimeline.create({
      data: {
        workOrderId: wo.id,
        status: "pending",
        label: "Installation Assigned",
        description: `Assigned to ${engineer.name ?? "engineer"} by ${session.user.name ?? "admin"}.`,
        actorId: session.user.id,
        actorName: session.user.name ?? "Administrator",
      },
    });

    // Dispatch notification to engineer
    try {
      const { dispatch } = await import("@/lib/notifications/dispatcher");
      await dispatch({
        event: "job_assigned" as import("@/lib/notifications/types").NotificationEvent,
        recipientType: "engineer",
        recipientId: engineer.id,
        recipientContact: engineer.email,
        recipientName: engineer.name ?? "Engineer",
        workOrderId: wo.id,
        variables: {
          EngineerName: engineer.name ?? "Engineer",
          JobNumber: wo.jobNumber,
          JobType: wo.type.replace(/_/g, " "),
          CustomerName: wo.customer.name,
          CustomerPhone: wo.customer.phone,
          CustomerAddress: wo.customer.addressLine,
          Date: new Date(body.scheduledDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          Time: body.scheduledTime ?? "",
          ProductName: wo.asset?.productName ?? "",
        },
      });
    } catch (notifError) {
      // Non-fatal: don't block installation creation if notification fails
      console.error("[NOTIFICATION ERROR] Installation assignment:", notifError);
    }

    return NextResponse.json(
      {
        workOrder: {
          id: wo.id,
          jobNumber: wo.jobNumber,
          type: wo.type,
          status: wo.status,
          priority: wo.priority,
          customerName: wo.customer.name,
          companyName: wo.customer.companyName,
          productName: wo.asset?.productName ?? null,
          model: wo.asset?.model ?? null,
          assignedEngineerName: wo.assignedEngineer?.name ?? null,
          scheduledDate: wo.scheduledDate.toISOString(),
          scheduledTime: wo.scheduledTime,
          description: wo.description,
          publicTrackingCode: wo.publicTrackingCode,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/installations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
