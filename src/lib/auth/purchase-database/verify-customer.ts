/**
 * CustomerVerificationService — 4-step customer verification against the
 * Purchase Database.
 *
 * Verification steps (all must pass for dashboard access):
 *   1. Mobile number exists in Purchase Database
 *   2. Customer exists + account is active
 *   3. Purchase record exists (customer has bought at least one QBIT product)
 *   4. Product registration exists (if applicable — see note below)
 *
 * If ANY step fails, dashboard access is denied with a specific reason code.
 *
 * The service is provider-agnostic — it uses whatever PurchaseDatabaseProvider
 * is registered in the provider registry. Swap the provider → no service changes.
 */

import { purchaseDbRegistry } from "./provider-registry";
import { PurchaseDatabaseNotConfiguredError } from "./PlaceholderProvider";
import {
  CustomerVerificationReason,
  type CustomerVerificationResult,
} from "./types";

/** Normalize a mobile number to 10 digits (strip country code, spaces, dashes). */
export function normalizeMobileNumber(input: string): string {
  let digits = input.replace(/\D/g, "");
  // Strip leading 91 (India country code) if present
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  // Strip leading 0 if present
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

/** Validate that a mobile number is a 10-digit Indian mobile number. */
export function isValidMobileNumber(input: string): boolean {
  const normalized = normalizeMobileNumber(input);
  return /^\d{10}$/.test(normalized) && /^[6-9]/.test(normalized);
}

/**
 * Verify a customer by their registered mobile number.
 *
 * @param rawMobileNumber The mobile number entered by the user (will be normalized).
 * @returns Verification result with reason code + customer/purchase/product data.
 */
export async function verifyCustomerByMobile(
  rawMobileNumber: string,
): Promise<CustomerVerificationResult> {
  const mobileNumber = normalizeMobileNumber(rawMobileNumber);
  if (!isValidMobileNumber(mobileNumber)) {
    return {
      verified: false,
      reason: CustomerVerificationReason.MOBILE_NOT_FOUND,
      message:
        "Please enter a valid 10-digit mobile number registered with your QBIT product purchase.",
    };
  }

  const provider = purchaseDbRegistry.get();

  let customer;
  try {
    customer = await provider.findCustomerByMobile(mobileNumber);
  } catch (err) {
    if (err instanceof PurchaseDatabaseNotConfiguredError) {
      return {
        verified: false,
        reason: CustomerVerificationReason.PROVIDER_NOT_CONFIGURED,
        message:
          "Customer verification is temporarily unavailable. The Purchase Database is being integrated. Please try again later or contact QBIT Support.",
      };
    }
    console.error("[verifyCustomerByMobile] Unexpected error:", err);
    return {
      verified: false,
      reason: CustomerVerificationReason.INTERNAL_ERROR,
      message: "An unexpected error occurred during verification. Please try again.",
    };
  }

  // Step 1: Mobile number must exist in Purchase Database
  if (!customer) {
    return {
      verified: false,
      reason: CustomerVerificationReason.MOBILE_NOT_FOUND,
      message:
        "This mobile number is not associated with any registered QBIT product. Please contact your dealer or QBIT Support.",
    };
  }

  // Step 2: Customer account must be active
  if (customer.status !== "active") {
    return {
      verified: false,
      reason: CustomerVerificationReason.CUSTOMER_INACTIVE,
      message:
        "Your customer account is not active. Please contact QBIT Support to reactivate your account.",
      customer,
    };
  }

  // Step 3: At least one purchase record must exist
  let purchases: Awaited<ReturnType<typeof provider.listPurchasesByCustomer>> = [];
  try {
    purchases = await provider.listPurchasesByCustomer(customer.customerId);
  } catch (err) {
    if (err instanceof PurchaseDatabaseNotConfiguredError) {
      return {
        verified: false,
        reason: CustomerVerificationReason.PROVIDER_NOT_CONFIGURED,
        message:
          "Purchase record verification is temporarily unavailable. Please try again later.",
        customer,
      };
    }
    console.error("[verifyCustomerByMobile] listPurchases error:", err);
    return {
      verified: false,
      reason: CustomerVerificationReason.INTERNAL_ERROR,
      message: "An unexpected error occurred while checking purchase records.",
      customer,
    };
  }

  if (purchases.length === 0) {
    return {
      verified: false,
      reason: CustomerVerificationReason.NO_PURCHASE_RECORD,
      message:
        "No purchase records found for this mobile number. Please contact your dealer or QBIT Support.",
      customer,
    };
  }

  // Step 4: At least one product registration must exist (if applicable).
  // NOTE: Product registration is OPTIONAL for the first login — a customer
  // who just bought a QBIT product may not have registered it yet. The brief
  // says "Product registration exists (if applicable)" — so we don't fail
  // verification if there are no registered products, we just include the
  // empty list in the result so the UI can prompt the user to register.
  let registeredProducts: Awaited<ReturnType<typeof provider.listRegisteredProducts>> = [];
  try {
    registeredProducts = await provider.listRegisteredProducts(customer.customerId);
  } catch (err) {
    if (err instanceof PurchaseDatabaseNotConfiguredError) {
      return {
        verified: false,
        reason: CustomerVerificationReason.PROVIDER_NOT_CONFIGURED,
        message:
          "Product registration verification is temporarily unavailable. Please try again later.",
        customer,
        purchases,
      };
    }
    console.error("[verifyCustomerByMobile] listRegisteredProducts error:", err);
    return {
      verified: false,
      reason: CustomerVerificationReason.INTERNAL_ERROR,
      message: "An unexpected error occurred while checking product registrations.",
      customer,
      purchases,
    };
  }

  // All checks passed — customer is authorized.
  return {
    verified: true,
    reason: CustomerVerificationReason.VERIFIED,
    message: "Customer verified successfully.",
    customer,
    purchases,
    registeredProducts,
  };
}
