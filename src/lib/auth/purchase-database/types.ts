/**
 * Type definitions for the Purchase Database authentication module.
 *
 * These types define the contract between QBIT Hub's authentication layer
 * and the future Purchase Database / ERP / CRM integration.
 *
 * No implementation here — just types. This keeps the architecture modular
 * so the actual Purchase Database can be connected later without changing
 * the UI or authentication flow.
 */

/** A customer record from the Purchase Database. */
export interface PurchaseCustomerRecord {
  /** Unique customer ID in the Purchase Database (e.g. ERP customer code). */
  customerId: string;
  /** Customer's full name as recorded on the original invoice. */
  name: string;
  /**
   * Registered mobile number — MUST exactly match the mobile number on the
   * original invoice/bill at the time of product purchase.
   * Stored as 10 digits (no country code) for India.
   */
  mobileNumber: string;
  /** Optional email — may not be present on all purchase records. */
  email?: string | null;
  /** Company name, if the purchase was B2B. */
  companyName?: string | null;
  /** Customer account status. */
  status: "active" | "inactive" | "blocked";
  /** Timestamp when the customer record was created in the Purchase DB. */
  registeredAt: Date;
}

/** A purchase/invoice record from the Purchase Database. */
export interface PurchaseRecord {
  /** Unique invoice/bill number. */
  invoiceNumber: string;
  /** Customer who made the purchase. */
  customerId: string;
  /** Customer's mobile number (denormalized for fast lookup). */
  mobileNumber: string;
  /** Date of purchase. */
  purchaseDate: Date;
  /** Product model purchased (e.g. "T-800", "HUB-X Pro"). */
  productModel: string;
  /** Serial number of the purchased device (if recorded at sale time). */
  serialNumber?: string | null;
  /** Dealer/channel partner who processed the sale. */
  dealerCode?: string | null;
  /** Invoice amount (optional — for audit purposes only). */
  invoiceAmount?: number | null;
  /** Currency code (e.g. "INR"). */
  currency?: string | null;
  /** Warranty start date (usually = purchase date). */
  warrantyStartDate?: Date | null;
  /** Warranty end date (usually = purchaseDate + warranty period). */
  warrantyEndDate?: Date | null;
  /** Whether this purchase has been linked to a registered product in QBIT Hub. */
  productRegistered: boolean;
}

/** A registered product (linked to a purchase + customer in QBIT Hub). */
export interface RegisteredProductRecord {
  /** Unique registration ID in QBIT Hub. */
  registrationId: string;
  /** Customer who owns this product. */
  customerId: string;
  /** The purchase/invoice this registration is based on. */
  invoiceNumber: string;
  /** Product model. */
  productModel: string;
  /** Serial number of the device. */
  serialNumber: string;
  /** Registration date. */
  registeredAt: Date;
  /** Registration status. */
  status: "active" | "transferred" | "returned";
}

/** The result of verifying a mobile number against the Purchase Database. */
export interface CustomerVerificationResult {
  /** Whether the verification succeeded (all 4 checks passed). */
  verified: boolean;
  /** Overall reason code — see CustomerVerificationReason. */
  reason: CustomerVerificationReason;
  /** Human-readable message safe to show to the end user. */
  message: string;
  /** The customer record, if found. */
  customer?: PurchaseCustomerRecord;
  /** The customer's purchase records, if any. */
  purchases?: PurchaseRecord[];
  /** The customer's registered products, if any. */
  registeredProducts?: RegisteredProductRecord[];
}

/** Reason codes for verification outcomes. */
export enum CustomerVerificationReason {
  /** All checks passed — customer is authorized. */
  VERIFIED = "VERIFIED",
  /** The mobile number was not found in the Purchase Database. */
  MOBILE_NOT_FOUND = "MOBILE_NOT_FOUND",
  /** The mobile number was found but the customer account is inactive/blocked. */
  CUSTOMER_INACTIVE = "CUSTOMER_INACTIVE",
  /** The customer exists but has no purchase records. */
  NO_PURCHASE_RECORD = "NO_PURCHASE_RECORD",
  /** The customer has purchases but no registered products yet. */
  NO_REGISTERED_PRODUCT = "NO_REGISTERED_PRODUCT",
  /** The Purchase Database provider is not configured (integration pending). */
  PROVIDER_NOT_CONFIGURED = "PROVIDER_NOT_CONFIGURED",
  /** An unexpected error occurred during verification. */
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/** OTP request result. */
export interface OtpRequestResult {
  success: boolean;
  /** The OTP reference code sent to the user (NOT the OTP itself). */
  reference?: string;
  /** Masked mobile number showing where the OTP was sent. */
  maskedMobile?: string;
  /** Expiry in seconds. */
  expiresIn?: number;
  message: string;
}

/** OTP verification result. */
export interface OtpVerifyResult {
  verified: boolean;
  message: string;
  /** The mobile number that was verified, if successful. */
  mobileNumber?: string;
}
