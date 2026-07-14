/**
 * PlaceholderPurchaseProvider — placeholder implementation of
 * PurchaseDatabaseProvider.
 *
 * IMPORTANT: This is NOT a mock. It does NOT return any fake data.
 * It throws NOT_IMPLEMENTED errors for every method, so that:
 *   - The architecture is fully wired up and ready for the real integration.
 *   - Any code path that tries to call the Purchase Database fails loudly
 *     with a clear "not configured" message — never silently succeeds.
 *   - When the real ERP/CRM provider is implemented, this file can be
 *     deleted (or kept as a reference) without affecting anything else.
 *
 * When `PURCHASE_DB_PROVIDER` env var is not set (the default), the
 * provider registry returns an instance of this class.
 */

import type { PurchaseDatabaseProvider } from "./PurchaseDatabaseProvider";
import {
  CustomerVerificationReason,
  type PurchaseCustomerRecord,
  type PurchaseRecord,
  type RegisteredProductRecord,
  type OtpRequestResult,
  type OtpVerifyResult,
} from "./types";

export class PlaceholderPurchaseProvider implements PurchaseDatabaseProvider {
  readonly name = "placeholder";

  async findCustomerByMobile(_mobileNumber: string): Promise<PurchaseCustomerRecord | null> {
    throw new PurchaseDatabaseNotConfiguredError(
      "findCustomerByMobile",
      "Customer lookup by mobile number is not available — the Purchase Database provider is not configured.",
    );
  }

  async listPurchasesByCustomer(_customerId: string): Promise<PurchaseRecord[]> {
    throw new PurchaseDatabaseNotConfiguredError(
      "listPurchasesByCustomer",
      "Purchase records lookup is not available — the Purchase Database provider is not configured.",
    );
  }

  async listRegisteredProducts(_customerId: string): Promise<RegisteredProductRecord[]> {
    throw new PurchaseDatabaseNotConfiguredError(
      "listRegisteredProducts",
      "Registered products lookup is not available — the Purchase Database provider is not configured.",
    );
  }

  async sendOtp(_mobileNumber: string): Promise<OtpRequestResult> {
    return {
      success: false,
      message: "OTP delivery is not available — the Purchase Database / SMS gateway is not configured. Please use password login or contact QBIT Support.",
    };
  }

  async verifyOtp(_mobileNumber: string, _otp: string, _reference: string): Promise<OtpVerifyResult> {
    return {
      verified: false,
      message: "OTP verification is not available — the Purchase Database provider is not configured.",
    };
  }
}

/**
 * Custom error thrown when the Purchase Database provider is not configured.
 * The CustomerVerificationService catches this and returns a
 * PROVIDER_NOT_CONFIGURED result instead of crashing.
 */
export class PurchaseDatabaseNotConfiguredError extends Error {
  readonly methodName: string;
  readonly reasonCode = CustomerVerificationReason.PROVIDER_NOT_CONFIGURED;

  constructor(methodName: string, message: string) {
    super(message);
    this.name = "PurchaseDatabaseNotConfiguredError";
    this.methodName = methodName;
  }
}
