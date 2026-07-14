/**
 * POST /api/auth/verify-customer
 *
 * Verifies a mobile number against the Purchase Database using the
 * CustomerVerificationService. Returns the verification result.
 *
 * Body: { mobileNumber: string }
 * Response:
 *   200 — { verified: true, customer, purchases, registeredProducts }
 *   200 — { verified: false, reason, message }  (verification failed — see reason)
 *   400 — { error: "Mobile number is required" }
 *
 * This endpoint is called BEFORE sign-in to gate dashboard access:
 *   - If verified === true → proceed with sign-in
 *   - If verified === false → show the specific error message to the user
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCustomerByMobile } from "@/lib/auth/purchase-database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.mobileNumber || typeof body.mobileNumber !== "string") {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 },
      );
    }

    const result = await verifyCustomerByMobile(body.mobileNumber);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API ERROR] POST /api/auth/verify-customer:", error);
    return NextResponse.json(
      {
        verified: false,
        reason: "INTERNAL_ERROR",
        message: "An unexpected error occurred during verification.",
      },
      { status: 500 },
    );
  }
}
