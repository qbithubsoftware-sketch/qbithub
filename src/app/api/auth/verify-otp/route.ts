/**
 * POST /api/auth/verify-otp
 *
 * Verifies an OTP submitted by the user. If verification succeeds AND the
 * mobile number passes the Purchase Database customer verification, the
 * endpoint returns the customer record so the caller can proceed with sign-in.
 *
 * Body: { mobileNumber: string, otp: string, reference: string }
 * Response: { verified, message, mobileNumber? }
 *
 * NOTE: OTP verification alone does NOT grant dashboard access. The caller
 * must still call /api/auth/verify-customer afterwards (or this endpoint
 * does both checks — see implementation below).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  purchaseDbRegistry,
  normalizeMobileNumber,
  isValidMobileNumber,
  verifyCustomerByMobile,
} from "@/lib/auth/purchase-database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.mobileNumber || !body?.otp || !body?.reference) {
      return NextResponse.json(
        { verified: false, message: "Mobile number, OTP, and reference are required." },
        { status: 400 },
      );
    }

    const mobileNumber = normalizeMobileNumber(body.mobileNumber);
    if (!isValidMobileNumber(mobileNumber)) {
      return NextResponse.json(
        { verified: false, message: "Invalid mobile number." },
        { status: 400 },
      );
    }

    const provider = purchaseDbRegistry.get();
    const otpResult = await provider.verifyOtp(mobileNumber, body.otp, body.reference);
    if (!otpResult.verified) {
      return NextResponse.json(otpResult);
    }

    // OTP verified — now run the 4-step customer verification.
    const customerResult = await verifyCustomerByMobile(mobileNumber);
    if (!customerResult.verified) {
      return NextResponse.json({
        verified: false,
        message: customerResult.message,
        reason: customerResult.reason,
      });
    }

    return NextResponse.json({
      verified: true,
      message: "OTP verified and customer authorized.",
      mobileNumber,
    });
  } catch (error) {
    console.error("[API ERROR] POST /api/auth/verify-otp:", error);
    return NextResponse.json(
      { verified: false, message: "An unexpected error occurred during OTP verification." },
      { status: 500 },
    );
  }
}
