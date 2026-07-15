/**
 * GET  /api/admin/device-registry — list all device records (paginated, searchable)
 * POST /api/admin/device-registry — create a new device record
 *
 * SECURITY: Super Admin or Administrator only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { db } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit/audit-log";

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

    // Build where clause — search across serialNumber, customer name, mobile, model, invoice
    const where: Record<string, unknown> = {};
    if (search.trim()) {
      where.OR = [
        { serialNumber: { contains: search, mode: "insensitive" } },
        { productName: { contains: search, mode: "insensitive" } },
        { modelNumber: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { mobileNumber: { contains: search } } },
      ];
    }

    const [devices, total] = await Promise.all([
      db.purchaseRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          customer: { select: { id: true, name: true, mobileNumber: true, companyName: true, email: true } },
          product: { select: { id: true, name: true, slug: true, imageUrl: true, brand: true } },
        },
      }),
      db.purchaseRecord.count({ where }),
    ]);

    // Compute warranty status for each device
    const items = devices.map((d) => {
      const remainingDays = d.warrantyEndDate
        ? Math.max(0, Math.ceil((new Date(d.warrantyEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;
      const warrantyStatus = !d.warrantyEndDate
        ? "unknown"
        : remainingDays === null
          ? "unknown"
          : remainingDays === 0
            ? "expired"
            : remainingDays <= 60
              ? "expiring_soon"
              : "active";

      return {
        id: d.id,
        purchaseId: d.purchaseId,
        serialNumber: d.serialNumber,
        productName: d.productName,
        modelNumber: d.modelNumber,
        brand: d.brand,
        customerName: d.customer.name,
        customerMobile: d.customer.mobileNumber,
        companyName: d.customer.companyName,
        email: d.customer.email,
        purchaseDate: d.purchaseDate?.toISOString() ?? null,
        invoiceNumber: d.invoiceNumber,
        warrantyStartDate: d.warrantyStartDate?.toISOString() ?? null,
        warrantyEndDate: d.warrantyEndDate?.toISOString() ?? null,
        warrantyStatus,
        remainingDays,
        installationStatus: d.installationStatus,
        amcStatus: d.amcStatus,
        deviceStatus: d.installationStatus, // "active" | "inactive" | "in_repair" | "replaced" | "returned"
        productMatched: !!d.productId,
        productImage: d.product?.imageUrl ?? null,
        createdAt: d.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ items, total });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/device-registry:", error);
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
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    // ===== Validation =====
    if (!body.serialNumber) return NextResponse.json({ error: "Serial Number is required" }, { status: 400 });
    if (!body.productName) return NextResponse.json({ error: "Product Name is required" }, { status: 400 });
    if (!body.modelNumber) return NextResponse.json({ error: "Model Number is required" }, { status: 400 });
    if (!body.customerName) return NextResponse.json({ error: "Customer Name is required" }, { status: 400 });
    if (!body.mobileNumber) return NextResponse.json({ error: "Mobile Number is required" }, { status: 400 });
    if (!body.purchaseDate) return NextResponse.json({ error: "Purchase Date is required" }, { status: 400 });
    if (!body.warrantyStartDate) return NextResponse.json({ error: "Warranty Start Date is required" }, { status: 400 });
    if (!body.warrantyEndDate) return NextResponse.json({ error: "Warranty End Date is required" }, { status: 400 });

    // Serial Number uniqueness check
    const existing = await db.purchaseRecord.findFirst({
      where: { serialNumber: { equals: body.serialNumber, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json({ error: `Serial Number "${body.serialNumber}" already exists in the Device Registry.` }, { status: 409 });
    }

    // Warranty End Date cannot be before Start Date
    if (new Date(body.warrantyEndDate) < new Date(body.warrantyStartDate)) {
      return NextResponse.json({ error: "Warranty End Date cannot be before Warranty Start Date." }, { status: 400 });
    }

    // Purchase Date cannot be after today
    if (new Date(body.purchaseDate) > new Date()) {
      return NextResponse.json({ error: "Purchase Date cannot be in the future." }, { status: 400 });
    }

    // ===== Find or create CustomerAccount =====
    const mobileNumber = body.mobileNumber.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "");
    let customer = await db.customerAccount.findUnique({ where: { mobileNumber } });
    if (!customer) {
      customer = await db.customerAccount.create({
        data: {
          mobileNumber,
          name: body.customerName,
          companyName: body.companyName ?? null,
          alternateMobile: body.alternateMobile ?? null,
          email: body.email ?? null,
          gstNumber: body.gstNumber ?? null,
          billingAddress: body.address ?? null,
          city: body.city ?? null,
          state: body.state ?? null,
          pinCode: body.pincode ?? null,
          status: "pending",
        },
      });
    }

    // ===== Match product by model number =====
    const product = body.modelNumber
      ? await db.qbitProduct.findFirst({ where: { model: body.modelNumber } })
      : null;

    // ===== Generate purchase ID =====
    const purchaseCount = await db.purchaseRecord.count();
    const purchaseId = `DEV-${new Date().getFullYear()}-${String(purchaseCount + 1).padStart(5, "0")}`;

    // ===== Create device record =====
    const device = await db.purchaseRecord.create({
      data: {
        purchaseId,
        customerId: customer.id,
        productId: product?.id ?? null,
        productName: body.productName,
        brand: body.brand ?? product?.brand ?? null,
        modelNumber: body.modelNumber,
        serialNumber: body.serialNumber,
        quantity: 1,
        invoiceNumber: body.invoiceNumber ?? null,
        invoiceDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        unitPrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        totalAmount: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        dealerName: body.dealerName ?? null,
        warrantyPeriod: body.warrantyDuration ?? null,
        warrantyStartDate: new Date(body.warrantyStartDate),
        warrantyEndDate: new Date(body.warrantyEndDate),
        installationStatus: body.deviceStatus ?? "pending",
        amcStatus: body.amcStatus ?? "none",
        extractionSource: "manual",
        extractionConfidence: 100,
        extractionRaw: JSON.stringify(body),
      },
    });

    await recordAuditLog(session, {
      action: "CREATE",
      entityType: "device_registry",
      entityId: device.id,
      entityName: `${body.serialNumber} — ${body.productName} — ${body.customerName}`,
      description: `Device registered manually. Serial: ${body.serialNumber}, Model: ${body.modelNumber}`,
    });

    return NextResponse.json({ success: true, deviceId: device.id, purchaseId: device.purchaseId }, { status: 201 });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/device-registry:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
