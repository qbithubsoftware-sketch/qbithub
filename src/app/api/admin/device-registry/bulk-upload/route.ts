/**
 * POST /api/admin/device-registry/bulk-upload
 *
 * Bulk upload device records from JSON array (parsed from CSV/Excel client-side).
 *
 * SECURITY: Super Admin or Administrator only.
 *
 * Body: { devices: Array<DeviceRegistryEntry> }
 * Response: { created: number, errors: Array<{ row: number, error: string }> }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { db } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit/audit-log";

interface BulkDeviceEntry {
  serialNumber: string;
  productName: string;
  modelNumber: string;
  brand?: string;
  customerName: string;
  companyName?: string;
  mobileNumber: string;
  alternateMobile?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  installationDate?: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  warrantyDuration?: string;
  dealerName?: string;
  salesExecutive?: string;
  purchasePrice?: string;
  deviceStatus?: string;
  amcStatus?: string;
  lastServiceDate?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body?.devices || !Array.isArray(body.devices)) {
      return NextResponse.json({ error: "Missing 'devices' array" }, { status: 400 });
    }

    const entries: BulkDeviceEntry[] = body.devices;
    let created = 0;
    const errors: Array<{ row: number; serial: string; error: string }> = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        // Validate required fields
        if (!entry.serialNumber || !entry.productName || !entry.modelNumber || !entry.customerName || !entry.mobileNumber) {
          errors.push({ row: i + 1, serial: entry.serialNumber ?? "?", error: "Missing required fields" });
          continue;
        }

        // Check serial number uniqueness
        const existing = await db.purchaseRecord.findFirst({
          where: { serialNumber: { equals: entry.serialNumber, mode: "insensitive" } },
        });
        if (existing) {
          errors.push({ row: i + 1, serial: entry.serialNumber, error: "Serial number already exists" });
          continue;
        }

        // Find or create customer
        const mobileNumber = entry.mobileNumber.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "");
        let customer = await db.customerAccount.findUnique({ where: { mobileNumber } });
        if (!customer) {
          customer = await db.customerAccount.create({
            data: {
              mobileNumber,
              name: entry.customerName,
              companyName: entry.companyName ?? null,
              alternateMobile: entry.alternateMobile ?? null,
              email: entry.email ?? null,
              gstNumber: entry.gstNumber ?? null,
              billingAddress: entry.address ?? null,
              city: entry.city ?? null,
              state: entry.state ?? null,
              pinCode: entry.pincode ?? null,
              status: "pending",
            },
          });
        }

        // Match product
        const product = await db.qbitProduct.findFirst({ where: { model: entry.modelNumber } });

        // Generate purchase ID
        const purchaseCount = await db.purchaseRecord.count();
        const purchaseId = `DEV-${new Date().getFullYear()}-${String(purchaseCount + 1).padStart(5, "0")}`;

        await db.purchaseRecord.create({
          data: {
            purchaseId,
            customerId: customer.id,
            productId: product?.id ?? null,
            productName: entry.productName,
            brand: entry.brand ?? product?.brand ?? null,
            modelNumber: entry.modelNumber,
            serialNumber: entry.serialNumber,
            invoiceNumber: entry.invoiceNumber ?? null,
            invoiceDate: entry.purchaseDate ? new Date(entry.purchaseDate) : null,
            purchaseDate: entry.purchaseDate ? new Date(entry.purchaseDate) : null,
            warrantyStartDate: entry.warrantyStartDate ? new Date(entry.warrantyStartDate) : null,
            warrantyEndDate: entry.warrantyEndDate ? new Date(entry.warrantyEndDate) : null,
            warrantyPeriod: entry.warrantyDuration ?? null,
            dealerName: entry.dealerName ?? null,
            unitPrice: entry.purchasePrice ? parseFloat(entry.purchasePrice) : null,
            totalAmount: entry.purchasePrice ? parseFloat(entry.purchasePrice) : null,
            installationStatus: entry.deviceStatus ?? "pending",
            amcStatus: entry.amcStatus ?? "none",
            extractionSource: "bulk_upload",
            extractionConfidence: 100,
            extractionRaw: JSON.stringify(entry),
          },
        });
        created++;
      } catch (e) {
        errors.push({ row: i + 1, serial: entry.serialNumber ?? "?", error: e instanceof Error ? e.message : "Unknown error" });
      }
    }

    await recordAuditLog(session, {
      action: "UPLOAD",
      entityType: "device_registry",
      entityName: `Bulk upload: ${created} created, ${errors.length} errors`,
      description: `Bulk device upload — ${entries.length} rows processed, ${created} created, ${errors.length} errors`,
      metadata: { total: entries.length, created, errors: errors.length },
    });

    return NextResponse.json({ created, errors, total: entries.length });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/device-registry/bulk-upload:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
