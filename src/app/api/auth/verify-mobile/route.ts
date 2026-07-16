/**
 * POST /api/auth/verify-mobile
 *
 * Pre-registration mobile verification endpoint.
 *
 * Called when the user enters their mobile number on the registration form
 * (before they create a password). Returns:
 *   - Whether the mobile number has a registered QBIT device
 *   - The customer + device details (so the UI can show a confirmation card)
 *   - Whether an account already exists for this mobile
 *
 * This is READ-ONLY — it does NOT create an account. The actual account
 * creation happens at /api/auth/register.
 *
 * Body: { mobileNumber: string }
 * Response:
 *   200 — { verified: true, hasAccount: false, customer, registeredDevices }
 *   200 — { verified: true, hasAccount: true, redirectTo: "/accounts/login", message: "..." }
 *   200 — { verified: false, reason: "MOBILE_NOT_FOUND" | "NO_PURCHASE_RECORD" | ..., message: "..." }
 *   400 — { error: "Mobile number is required" }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCustomerByMobile, normalizeMobileNumber, isValidMobileNumber } from "@/lib/auth/purchase-database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.mobileNumber || typeof body.mobileNumber !== "string") {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 },
      );
    }

    const mobileNumber = normalizeMobileNumber(body.mobileNumber);
    if (!isValidMobileNumber(mobileNumber)) {
      return NextResponse.json({
        verified: false,
        reason: "INVALID_MOBILE",
        message: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
      });
    }

    // ===== Check for duplicate account FIRST =====
    const customerEmail = `${mobileNumber}@qbit.customer`;
    const existingUser = await db.user.findUnique({ where: { email: customerEmail } });
    if (existingUser) {
      return NextResponse.json({
        verified: false,
        hasAccount: true,
        reason: "DUPLICATE_ACCOUNT",
        message: "An account already exists for this mobile number. Please sign in instead.",
        redirectTo: "/accounts/login",
      });
    }

    // Also check CustomerAccount with linked userId
    const existingCustomerAccount = await db.customerAccount.findUnique({
      where: { mobileNumber },
      include: { user: true },
    });
    if (existingCustomerAccount?.userId) {
      return NextResponse.json({
        verified: false,
        hasAccount: true,
        reason: "DUPLICATE_ACCOUNT",
        message: "An account already exists for this mobile number. Please sign in instead.",
        redirectTo: "/accounts/login",
      });
    }

    // ===== Verify mobile against Device Registration Database =====
    const verification = await verifyCustomerByMobile(mobileNumber);
    if (!verification.verified) {
      return NextResponse.json({
        verified: false,
        hasAccount: false,
        reason: verification.reason,
        message: verification.message,
      });
    }

    // ===== Verified — return customer + device details =====
    const registeredDevices = (verification.registeredProducts ?? []).map((p) => ({
      productName: p.productModel,
      model: p.productModel,
      serialNumber: p.serialNumber,
      purchaseDate: p.registeredAt?.toISOString() ?? null,
      warrantyStatus: p.status === "active" ? "active" : "expired",
      warrantyExpiry: null,
    }));

    return NextResponse.json({
      verified: true,
      hasAccount: false,
      customer: {
        name: verification.customer?.name ?? "QBIT Customer",
        mobileNumber,
        companyName: verification.customer?.companyName ?? null,
        email: verification.customer?.email ?? null,
        city: null,
        state: null,
      },
      registeredDevices,
      totalDevices: registeredDevices.length,
    });
  } catch (error) {
    console.error("[API ERROR] POST /api/auth/verify-mobile:", error);
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
