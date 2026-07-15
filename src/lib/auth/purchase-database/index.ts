/**
 * Barrel export for the Purchase Database authentication module.
 *
 * Import path: `@/lib/auth/purchase-database`
 *
 * Architecture (modular — provider-agnostic):
 *
 *   types.ts                       — TypeScript interfaces (the contract)
 *   PurchaseDatabaseProvider.ts    — Abstract provider interface
 *   PlaceholderProvider.ts         — Throws NOT_IMPLEMENTED (no mock data)
 *   provider-registry.ts           — Factory: picks provider from env var
 *   verify-customer.ts             — 4-step CustomerVerificationService
 *
 * Future ERP/CRM integration:
 *   1. Implement `ErpPurchaseProvider` (in a new file).
 *   2. Register it in provider-registry.ts.
 *   3. Set `PURCHASE_DB_PROVIDER=erp` in env vars.
 *   4. Done — UI + API + auth flow unchanged.
 */

export type {
  PurchaseCustomerRecord,
  PurchaseRecord,
  RegisteredProductRecord,
  CustomerVerificationResult,
  OtpRequestResult,
  OtpVerifyResult,
} from "./types";

export { CustomerVerificationReason } from "./types";

export type { PurchaseDatabaseProvider } from "./PurchaseDatabaseProvider";
export { PlaceholderPurchaseProvider, PurchaseDatabaseNotConfiguredError } from "./PlaceholderProvider";
export { purchaseDbRegistry } from "./provider-registry";
export { verifyCustomerByMobile, normalizeMobileNumber, isValidMobileNumber } from "./verify-customer";
