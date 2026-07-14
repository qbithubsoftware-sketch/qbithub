/**
 * PurchaseDatabaseProvider — abstract interface defining the contract
 * between QBIT Hub's authentication layer and the future Purchase Database /
 * ERP / CRM integration.
 *
 * This is the ONLY interface that needs to be implemented when the real
 * Purchase Database is connected. The rest of the auth flow (UI, API routes,
 * verification service) stays unchanged.
 *
 * Implementation steps for future integration:
 *   1. Create a new file: `ErpPurchaseProvider.ts` implementing this interface.
 *   2. Add it to the provider registry: `provider-registry.ts`.
 *   3. Set the env var: `PURCHASE_DB_PROVIDER=erp`.
 *   4. Done — no UI or auth flow changes needed.
 */

import type {
  PurchaseCustomerRecord,
  PurchaseRecord,
  RegisteredProductRecord,
  OtpRequestResult,
  OtpVerifyResult,
} from "./types";

export interface PurchaseDatabaseProvider {
  /** Provider identifier (e.g. "placeholder", "erp", "crm"). */
  readonly name: string;

  /**
   * Look up a customer by their registered mobile number.
   *
   * The mobile number MUST exactly match the number recorded at the time of
   * product purchase and stored on the original invoice/bill.
   *
   * Returns null if the mobile number is not found in the Purchase Database.
   */
  findCustomerByMobile(mobileNumber: string): Promise<PurchaseCustomerRecord | null>;

  /**
   * List all purchase/invoice records for a customer.
   *
   * @param customerId The customer's ID in the Purchase Database.
   * @returns Array of purchase records (empty if none).
   */
  listPurchasesByCustomer(customerId: string): Promise<PurchaseRecord[]>;

  /**
   * List all products registered by this customer in QBIT Hub
   * (linked to their purchase records).
   *
   * @param customerId The customer's ID in the Purchase Database.
   * @returns Array of registered products (empty if none).
   */
  listRegisteredProducts(customerId: string): Promise<RegisteredProductRecord[]>;

  /**
   * Send an OTP to the customer's registered mobile number.
   *
   * The provider is responsible for the actual delivery (SMS gateway,
   * WhatsApp Business API, etc.). The OTP itself MUST NOT be returned —
   * only a reference code + masked mobile number.
   *
   * @param mobileNumber The customer's registered mobile number.
   * @returns OTP request result with reference code.
   */
  sendOtp(mobileNumber: string): Promise<OtpRequestResult>;

  /**
   * Verify an OTP submitted by the user.
   *
   * @param mobileNumber The mobile number the OTP was sent to.
   * @param otp The 6-digit OTP entered by the user.
   * @param reference The OTP reference code returned by sendOtp().
   */
  verifyOtp(mobileNumber: string, otp: string, reference: string): Promise<OtpVerifyResult>;
}
