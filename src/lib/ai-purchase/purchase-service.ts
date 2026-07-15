/**
 * Purchase Registration Service
 *
 * Takes extracted purchase data (from AI or manual entry) and:
 *   1. Finds or creates a CustomerAccount by mobile number
 *   2. Matches the product by model number (never duplicates)
 *   3. Creates a PurchaseRecord linking customer + product
 *   4. Auto-links all product resources (drivers, firmware, manuals, etc.)
 *   5. Records audit log entries
 *
 * This service is the bridge between the AI extraction layer and the
 * Purchase Database that the Customer Login + Dr. QBIT read from.
 */

import { db } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit/audit-log";
import type { Session } from "next-auth";
import type { ExtractedPurchaseData } from "./extraction";

/** Result of registering a purchase. */
export interface PurchaseRegistrationResult {
  success: boolean;
  purchaseId?: string;
  customerId?: string;
  productId?: string | null;
  customerCreated: boolean;
  productMatched: boolean;
  error?: string;
}

/**
 * Register a purchase — creates customer + purchase record + links product.
 *
 * @param data Extracted purchase data (from AI or manual entry).
 * @param session The admin's session (for audit logging).
 * @param invoiceFileId Optional PurchaseInvoice ID to link.
 */
export async function registerPurchase(
  data: ExtractedPurchaseData,
  session: Session | null,
  invoiceFileId?: string,
): Promise<PurchaseRegistrationResult> {
  try {
    // ===== Step 1: Validate required fields =====
    if (!data.mobileNumber || !data.modelNumber) {
      return {
        success: false,
        customerCreated: false,
        productMatched: false,
        error: "Mobile number and model number are required.",
      };
    }

    // Normalize mobile number (10 digits)
    const mobileNumber = data.mobileNumber.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "");
    if (mobileNumber.length !== 10) {
      return {
        success: false,
        customerCreated: false,
        productMatched: false,
        error: "Mobile number must be 10 digits.",
      };
    }

    // ===== Step 2: Find or create CustomerAccount =====
    let customer = await db.customerAccount.findUnique({
      where: { mobileNumber },
    });

    const customerCreated = !customer;

    if (!customer) {
      customer = await db.customerAccount.create({
        data: {
          mobileNumber,
          name: data.customerName ?? "Unknown Customer",
          companyName: data.companyName,
          alternateMobile: data.alternateMobile,
          email: data.email,
          gstNumber: data.gstNumber,
          billingAddress: data.billingAddress,
          shippingAddress: data.shippingAddress,
          city: data.city,
          state: data.state,
          pinCode: data.pinCode,
          status: "pending", // customer must set password on first login
        },
      });
      await recordAuditLog(session, {
        action: "CREATE",
        entityType: "customer",
        entityId: customer.id,
        entityName: customer.name,
        description: `Customer account created from purchase import (mobile: ${mobileNumber})`,
      });
    } else {
      // Update customer with any new info from the invoice
      customer = await db.customerAccount.update({
        where: { id: customer.id },
        data: {
          name: data.customerName ?? customer.name,
          companyName: data.companyName ?? customer.companyName,
          alternateMobile: data.alternateMobile ?? customer.alternateMobile,
          email: data.email ?? customer.email,
          gstNumber: data.gstNumber ?? customer.gstNumber,
          billingAddress: data.billingAddress ?? customer.billingAddress,
          shippingAddress: data.shippingAddress ?? customer.shippingAddress,
          city: data.city ?? customer.city,
          state: data.state ?? customer.state,
          pinCode: data.pinCode ?? customer.pinCode,
        },
      });
    }

    // ===== Step 3: Match product by model number (never duplicate) =====
    const product = await db.qbitProduct.findFirst({
      where: { model: data.modelNumber },
    });

    const productMatched = !!product;

    // ===== Step 4: Generate purchase ID =====
    const purchaseCount = await db.purchaseRecord.count();
    const purchaseId = `PUR-${new Date().getFullYear()}-${String(purchaseCount + 1).padStart(5, "0")}`;

    // ===== Step 5: Create PurchaseRecord =====
    const purchase = await db.purchaseRecord.create({
      data: {
        purchaseId,
        customerId: customer.id,
        productId: product?.id ?? null,
        productName: data.productName ?? product?.name ?? data.modelNumber,
        brand: data.brand ?? product?.brand ?? null,
        modelNumber: data.modelNumber,
        serialNumber: data.serialNumber,
        quantity: data.quantity ?? 1,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        purchaseDate: data.purchaseDate ?? data.invoiceDate,
        unitPrice: data.unitPrice,
        gstAmount: data.gstAmount,
        totalAmount: data.totalAmount,
        paymentStatus: data.paymentStatus,
        dealerName: data.dealerName,
        dealerId: data.dealerId,
        warrantyPeriod: data.warrantyPeriod,
        warrantyStartDate: data.warrantyStartDate,
        warrantyEndDate: data.warrantyEndDate,
        extractionSource: "ai",
        extractionConfidence: data.confidence,
        extractionRaw: JSON.stringify(data),
      },
    });

    // ===== Step 6: Link invoice file if provided =====
    if (invoiceFileId) {
      await db.purchaseInvoice.update({
        where: { id: invoiceFileId },
        data: {
          purchaseId: purchase.id,
          extractionStatus: "completed",
        },
      });
    }

    // ===== Step 7: Audit log =====
    await recordAuditLog(session, {
      action: "UPLOAD",
      entityType: "purchase",
      entityId: purchase.id,
      entityName: `${purchaseId} — ${customer.name} — ${data.modelNumber}`,
      description: `Purchase registered via AI import. Customer: ${customer.name} (${mobileNumber}), Product: ${data.modelNumber}, Serial: ${data.serialNumber ?? "N/A"}`,
      metadata: {
        purchaseId,
        customerId: customer.id,
        productId: product?.id ?? null,
        customerCreated,
        productMatched,
        confidence: data.confidence,
      },
    });

    return {
      success: true,
      purchaseId: purchase.id,
      customerId: customer.id,
      productId: product?.id ?? null,
      customerCreated,
      productMatched,
    };
  } catch (error) {
    console.error("[registerPurchase] Error:", error);
    return {
      success: false,
      customerCreated: false,
      productMatched: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List all purchases (for admin dashboard).
 */
export async function listPurchases(opts?: {
  limit?: number;
  offset?: number;
  customerId?: string;
  modelNumber?: string;
}) {
  const limit = Math.min(opts?.limit ?? 50, 200);
  const offset = opts?.offset ?? 0;

  const where: Record<string, unknown> = {};
  if (opts?.customerId) where.customerId = opts.customerId;
  if (opts?.modelNumber) where.modelNumber = { contains: opts.modelNumber };

  const [purchases, total] = await Promise.all([
    db.purchaseRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        customer: true,
        product: { select: { id: true, name: true, slug: true, imageUrl: true } },
      },
    }),
    db.purchaseRecord.count({ where }),
  ]);

  return { purchases, total };
}

/**
 * Get a single purchase by ID (for admin detail view).
 */
export async function getPurchase(id: string) {
  return db.purchaseRecord.findUnique({
    where: { id },
    include: {
      customer: true,
      product: {
        select: {
          id: true, name: true, slug: true, model: true, brand: true,
          imageUrl: true, driverDownloadUrl: true, manualUrl: true,
          brochureUrl: true, datasheetUrl: true, warrantyUrl: true,
          sdkUrl: true, utilityUrl: true, installationGuideUrl: true,
          knowledgeBaseUrl: true, latestDriverVersion: true, latestFirmwareVersion: true,
        },
      },
      invoices: true,
    },
  });
}
