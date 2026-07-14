/**
 * POST /api/admin/purchases/upload
 *
 * Upload a purchase document (invoice/warranty card/registration form) and
 * run AI extraction. Returns the extracted data for admin review.
 *
 * SECURITY: Super Admin or Administrator only.
 *
 * Body: multipart/form-data
 *   - file: The document file (PDF, PNG, JPG)
 *   - documentType: "invoice" | "gst_invoice" | "tax_invoice" | etc.
 *
 * Response:
 *   200 — { invoiceId, extracted: ExtractedPurchaseData }
 *   400 — { error: "No file uploaded" }
 *   403 — { error: "Administrator access required" }
 *   500 — { error: "Extraction failed" }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { db } from "@/lib/db";
import { extractPurchaseData } from "@/lib/ai-purchase/extraction";
import { recordAuditLog } from "@/lib/audit/audit-log";

export async function POST(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = (formData.get("documentType") as string) ?? "invoice";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read file into buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Create a PurchaseInvoice record (extraction status = processing)
    const invoice = await db.purchaseInvoice.create({
      data: {
        fileName: `invoice-${Date.now()}-${file.name}`,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storagePath: `/uploads/invoices/${Date.now()}-${file.name}`,
        documentType,
        extractionStatus: "processing",
        uploadedById: session.user.id,
        uploadedByName: session.user.name ?? null,
      },
    });

    // Run AI extraction
    const extractionResult = await extractPurchaseData(fileBuffer, file.type, file.name);

    if (!extractionResult.success || !extractionResult.data) {
      // Update invoice status to failed
      await db.purchaseInvoice.update({
        where: { id: invoice.id },
        data: {
          extractionStatus: "failed",
          extractionError: extractionResult.error ?? "Unknown extraction error",
        },
      });

      await recordAuditLog(session, {
        action: "UPLOAD",
        entityType: "purchase_invoice",
        entityId: invoice.id,
        entityName: file.name,
        description: `AI extraction failed for uploaded document: ${extractionResult.error}`,
      });

      // Return the invoice ID + error so admin can manually enter data
      return NextResponse.json({
        invoiceId: invoice.id,
        extracted: null,
        error: extractionResult.error,
        manualEntryRequired: true,
      });
    }

    // Update invoice status to completed
    await db.purchaseInvoice.update({
      where: { id: invoice.id },
      data: {
        extractionStatus: "completed",
      },
    });

    await recordAuditLog(session, {
      action: "UPLOAD",
      entityType: "purchase_invoice",
      entityId: invoice.id,
      entityName: file.name,
      description: `AI extraction completed. Confidence: ${extractionResult.data.confidence ?? "N/A"}%`,
      metadata: {
        documentType,
        extractedModel: extractionResult.data.modelNumber,
        extractedMobile: extractionResult.data.mobileNumber,
      },
    });

    return NextResponse.json({
      invoiceId: invoice.id,
      extracted: extractionResult.data,
    });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/purchases/upload:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
