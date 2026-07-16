/**
 * POST /api/auth/register
 *
 * Secure Customer Account Registration endpoint.
 *
 * FLOW:
 *   1. Validate input (mobile format, password strength, confirm match, T&C accepted)
 *   2. Normalize mobile number
 *   3. DUPLICATE ACCOUNT CHECK — has this mobile already got a User account?
 *      → If yes: reject with "account exists" + redirect to /accounts/login
 *   4. DEVICE REGISTRATION VERIFICATION — call verifyCustomerByMobile()
 *      → Searches FSMCustomer.phone + CustomerAccount.mobileNumber
 *      → Must find at least one registered device (FSMCustomerAsset or PurchaseRecord)
 *      → If no device found: reject with "no registered QBIT device" message
 *   5. Fetch customer + registered products + warranty info for response
 *   6. Create User row (role: public_customer, email: <mobile>@qbit.customer,
 *      passwordHash: bcrypt)
 *   7. Create / update CustomerAccount row linking userId + mobileNumber
 *   8. Return success — frontend calls signIn("credentials") to auto-login
 *
 * SECURITY:
 *   - Passwords hashed with bcrypt (10 rounds)
 *   - Mobile number normalized (strip +91, leading 0, non-digits)
 *   - Duplicate account protection (unique email + CustomerAccount.userId)
 *   - Device verification required (no registration without a registered device)
 *   - Password strength rules enforced server-side (defense in depth)
 *   - Rate limiting: rely on Vercel edge + NextAuth's built-in protection
 *
 * Body:
 *   { mobileNumber: string, password: string, confirmPassword: string,
 *     acceptTerms: boolean }
 *
 * Response:
 *   200 — { success: true, user: { id, email, name, role }, customer: {...}, redirectTo: "/customer" }
 *   400 — { success: false, error: "...", reason: "DUPLICATE_ACCOUNT" | "NO_REGISTERED_DEVICE" | "INVALID_INPUT" | "WEAK_PASSWORD" | "MISMATCH" | "TERMS_NOT_ACCEPTED" }
 *   500 — { success: false, error: "Internal server error" }
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { verifyCustomerByMobile, normalizeMobileNumber, isValidMobileNumber } from "@/lib/auth/purchase-database";

// Password rules:
//   - Minimum 8 characters
//   - One uppercase letter
//   - One lowercase letter
//   - One number
//   - One special character
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

interface RegisterRequest {
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as RegisterRequest | null;
    if (!body) {
      return NextResponse.json(
        { success: false, reason: "INVALID_INPUT", error: "Invalid request body." },
        { status: 400 },
      );
    }

    const { mobileNumber: rawMobile, password, confirmPassword, acceptTerms } = body;

    // ===== Step 1: Validate input =====
    if (!rawMobile || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, reason: "INVALID_INPUT", error: "All fields are required." },
        { status: 400 },
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { success: false, reason: "TERMS_NOT_ACCEPTED", error: "Please accept the Terms & Conditions and Privacy Policy to continue." },
        { status: 400 },
      );
    }

    const mobileNumber = normalizeMobileNumber(rawMobile);
    if (!isValidMobileNumber(mobileNumber)) {
      return NextResponse.json(
        { success: false, reason: "INVALID_INPUT", error: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9." },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, reason: "MISMATCH", error: "Passwords do not match." },
        { status: 400 },
      );
    }

    if (!PASSWORD_RE.test(password)) {
      return NextResponse.json(
        {
          success: false,
          reason: "WEAK_PASSWORD",
          error: "Password must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and one special character.",
        },
        { status: 400 },
      );
    }

    // ===== Step 2: Duplicate account check =====
    // Customer accounts use email format <mobile>@qbit.customer
    const customerEmail = `${mobileNumber}@qbit.customer`;
    const existingUser = await db.user.findUnique({ where: { email: customerEmail } });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          reason: "DUPLICATE_ACCOUNT",
          error: "An account already exists for this mobile number. Please sign in instead.",
          redirectTo: "/accounts/login",
        },
        { status: 409 },
      );
    }

    // Also check CustomerAccount table (in case User was deleted but CustomerAccount remains)
    const existingCustomerAccount = await db.customerAccount.findUnique({
      where: { mobileNumber },
      include: { user: true },
    });
    if (existingCustomerAccount?.userId) {
      return NextResponse.json(
        {
          success: false,
          reason: "DUPLICATE_ACCOUNT",
          error: "An account already exists for this mobile number. Please sign in instead.",
          redirectTo: "/accounts/login",
        },
        { status: 409 },
      );
    }

    // ===== Step 3: Device Registration Verification =====
    // This is the most important check — the mobile number MUST be linked to
    // at least one registered QBIT device in the Device Registration Database.
    const verification = await verifyCustomerByMobile(mobileNumber);
    if (!verification.verified) {
      return NextResponse.json(
        {
          success: false,
          reason: "NO_REGISTERED_DEVICE",
          error:
            "No registered QBIT device was found with this mobile number. " +
            "Please use the mobile number that was provided during product purchase or printed on your invoice. " +
            "If you believe this is an error, contact QBIT Support.",
        },
        { status: 403 },
      );
    }

    // ===== Step 4: All checks passed — create the account =====
    const passwordHash = await bcrypt.hash(password, 10);
    const customerName = verification.customer?.name ?? "QBIT Customer";

    // Create User row
    const user = await db.user.create({
      data: {
        email: customerEmail,
        name: customerName,
        passwordHash,
        role: "public_customer",
      },
    });

    // Upsert CustomerAccount (may already exist from AI invoice import with status="pending")
    let customerAccount;
    if (existingCustomerAccount) {
      customerAccount = await db.customerAccount.update({
        where: { id: existingCustomerAccount.id },
        data: {
          userId: user.id,
          status: "active",
          name: customerName,
          email: customerEmail,
        },
      });
    } else {
      // Try to find FSMCustomer to copy details
      const fsmCustomer = await db.fSMCustomer.findFirst({
        where: {
          OR: [
            { phone: mobileNumber },
            { phone: `+91${mobileNumber}` },
            { phone: `91${mobileNumber}` },
          ],
        },
      });

      customerAccount = await db.customerAccount.create({
        data: {
          mobileNumber,
          name: customerName,
          email: customerEmail,
          companyName: verification.customer?.companyName ?? fsmCustomer?.companyName ?? null,
          city: fsmCustomer?.city ?? null,
          state: fsmCustomer?.state ?? null,
          status: "active",
          userId: user.id,
        },
      });
    }

    // ===== Step 5: Build response with customer + device info =====
    const registeredDevices = (verification.registeredProducts ?? []).map((p) => ({
      productName: p.productModel,
      model: p.productModel,
      serialNumber: p.serialNumber,
      purchaseDate: p.registeredAt?.toISOString() ?? null,
      warrantyStatus: p.status === "active" ? "active" : "expired",
      warrantyExpiry: null,
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      customer: {
        name: customerName,
        mobileNumber,
        companyName: verification.customer?.companyName ?? null,
        email: verification.customer?.email ?? null,
      },
      registeredDevices,
      redirectTo: "/customer",
      message: "Your QBIT account has been created successfully.",
    });
  } catch (error) {
    console.error("[API ERROR] POST /api/auth/register:", error);
    return NextResponse.json(
      { success: false, reason: "INTERNAL_ERROR", error: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}
