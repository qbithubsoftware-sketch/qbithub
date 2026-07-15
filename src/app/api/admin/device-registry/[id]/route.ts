/**
 * GET    /api/admin/device-registry/[id] — fetch single device record
 * PUT    /api/admin/device-registry/[id] — update device record
 * DELETE /api/admin/device-registry/[id] — soft delete device record
 *
 * SECURITY: Super Admin or Administrator only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { db } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit/audit-log";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const device = await db.purchaseRecord.findUnique({
      where: { id },
      include: {
        customer: true,
        product: {
          select: {
            id: true, name: true, slug: true, model: true, brand: true,
            category: true, imageUrl: true,
            driverDownloadUrl: true, manualUrl: true, brochureUrl: true,
            datasheetUrl: true, warrantyUrl: true, sdkUrl: true, utilityUrl: true,
            installationGuideUrl: true, knowledgeBaseUrl: true,
            latestDriverVersion: true, latestFirmwareVersion: true,
            qrCodeUrl: true,
            mediaFiles: { orderBy: { sortIndex: "asc" } },
          },
        },
      },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ device });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/device-registry/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const existing = await db.purchaseRecord.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Device not found" }, { status: 404 });

    // Serial Number uniqueness check (if changing)
    if (body.serialNumber && body.serialNumber !== existing.serialNumber) {
      const dup = await db.purchaseRecord.findFirst({
        where: { serialNumber: { equals: body.serialNumber, mode: "insensitive" } },
      });
      if (dup && dup.id !== id) {
        return NextResponse.json({ error: `Serial Number "${body.serialNumber}" already exists.` }, { status: 409 });
      }
    }

    // Update customer if needed
    if (body.customerName || body.mobileNumber) {
      const mobileNumber = body.mobileNumber?.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "") ?? null;
      await db.customerAccount.updateMany({
          where: { id: existing.customerId },
          data: {
            name: body.customerName ?? undefined,
            companyName: body.companyName ?? undefined,
            alternateMobile: body.alternateMobile ?? undefined,
            email: body.email ?? undefined,
            gstNumber: body.gstNumber ?? undefined,
            billingAddress: body.address ?? undefined,
            city: body.city ?? undefined,
            state: body.state ?? undefined,
            pinCode: body.pincode ?? undefined,
          },
        });
    }

    // Match product if model changed
    let productId = existing.productId;
    if (body.modelNumber && body.modelNumber !== existing.modelNumber) {
      const product = await db.qbitProduct.findUnique({ where: { model: body.modelNumber } });
      if (product) productId = product.id;
    }

    const updated = await db.purchaseRecord.update({
      where: { id },
      data: {
        serialNumber: body.serialNumber ?? undefined,
        productName: body.productName ?? undefined,
        brand: body.brand ?? undefined,
        modelNumber: body.modelNumber ?? undefined,
        productId: productId ?? undefined,
        invoiceNumber: body.invoiceNumber ?? undefined,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        invoiceDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        warrantyStartDate: body.warrantyStartDate ? new Date(body.warrantyStartDate) : undefined,
        warrantyEndDate: body.warrantyEndDate ? new Date(body.warrantyEndDate) : undefined,
        warrantyPeriod: body.warrantyDuration ?? undefined,
        installationStatus: body.deviceStatus ?? undefined,
        amcStatus: body.amcStatus ?? undefined,
        dealerName: body.dealerName ?? undefined,
        unitPrice: body.purchasePrice ? parseFloat(body.purchasePrice) : undefined,
        totalAmount: body.purchasePrice ? parseFloat(body.purchasePrice) : undefined,
      },
    });

    await recordAuditLog(session, {
      action: "EDIT",
      entityType: "device_registry",
      entityId: id,
      entityName: `${updated.serialNumber} — ${updated.productName}`,
      description: "Device record updated",
    });

    return NextResponse.json({ success: true, device: updated });
  } catch (error) {
    console.error("[API ERROR] PUT /api/admin/device-registry/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await db.purchaseRecord.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Device not found" }, { status: 404 });

    // Soft delete: set installationStatus to "returned"
    await db.purchaseRecord.update({
      where: { id },
      data: { installationStatus: "returned" },
    });

    await recordAuditLog(session, {
      action: "DELETE",
      entityType: "device_registry",
      entityId: id,
      entityName: `${existing.serialNumber} — ${existing.productName}`,
      description: "Device soft-deleted (marked as returned)",
    });

    return NextResponse.json({ success: true, message: "Device marked as returned (soft delete)" });
  } catch (error) {
    console.error("[API ERROR] DELETE /api/admin/device-registry/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
