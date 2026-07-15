/**
 * POST /api/admin/purchases/register
 *
 * Register a purchase from extracted (or manually entered) data.
 * Creates CustomerAccount + PurchaseRecord + links to Product Library.
 *
 * SECURITY: Super Admin or Administrator only.
 *
 * Body: ExtractedPurchaseData (from AI extraction or manual entry form)
 *   + invoiceId?: string (optional, to link the uploaded file)
 *
 * Response:
 *   200 — { success, purchaseId, customerId, productId, customerCreated, productMatched }
 *   403 — { error: "Administrator access required" }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { registerPurchase } from "@/lib/ai-purchase/purchase-service";
import type { ExtractedPurchaseData } from "@/lib/ai-purchase/extraction";

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

    const data: ExtractedPurchaseData = body.data ?? body;
    const invoiceId: string | undefined = body.invoiceId;

    const result = await registerPurchase(data, session, invoiceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/purchases/register:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
