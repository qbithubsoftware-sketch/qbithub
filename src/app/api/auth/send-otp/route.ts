/**
 * POST /api/auth/send-otp
 *
 * Sends an OTP to the customer's registered mobile number via the
 * Purchase Database provider (SMS gateway / WhatsApp).
 *
 * Body: { mobileNumber: string }
 * Response: { success, reference?, maskedMobile?, expiresIn?, message }
 *
 * NOTE: When the Purchase Database provider is not configured (placeholder),
 * this returns success: false with an explanatory message — never a fake OTP.
 */

import { NextRequest, NextResponse } from "next/server";
import { purchaseDbRegistry, normalizeMobileNumber, isValidMobileNumber } from "@/lib/auth/purchase-database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.mobileNumber || typeof body.mobileNumber !== "string") {
      return NextResponse.json(
        { success: false, message: "Mobile number is required" },
        { status: 400 },
      );
    }

    const mobileNumber = normalizeMobileNumber(body.mobileNumber);
    if (!isValidMobileNumber(mobileNumber)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 10-digit mobile number." },
        { status: 400 },
      );
    }

    const provider = purchaseDbRegistry.get();
    const result = await provider.sendOtp(mobileNumber);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API ERROR] POST /api/auth/send-otp:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while sending OTP." },
      { status: 500 },
    );
  }
}
