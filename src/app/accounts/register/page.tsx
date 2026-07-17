/**
 * /accounts/register — Secure Customer Account Registration page.
 *
 * CRITICAL: Does NOT modify the existing /accounts/login page. The login
 * page continues to work exactly as before. This is a SEPARATE page reached
 * when a visitor clicks "Register Product" (links have been updated to point
 * here instead of /support or /accounts/login).
 *
 * Flow:
 *   1. Customer enters the mobile number used at purchase time
 *   2. POST /api/auth/verify-mobile — verifies against Device Registration DB
 *      (FSMCustomer.phone + CustomerAccount.mobileNumber + must have at least
 *      one registered device via FSMCustomerAsset)
 *   3. If verified → show "Registered Device Found" card with customer name,
 *      product, serial, warranty, purchase date
 *   4. Customer creates a password (with strength indicator + confirm match)
 *   5. Accepts T&C
 *   6. POST /api/auth/register — creates User (role: public_customer) +
 *      CustomerAccount link → auto sign-in via NextAuth → redirect /customer
 *
 * Security:
 *   - Mobile verification required BEFORE password step
 *   - Duplicate account protection (server-side check)
 *   - Password strength rules (8+ chars, upper, lower, number, special)
 *   - Passwords hashed with bcrypt
 *   - T&C acceptance required
 *
 * UI: Same premium card style as /accounts/login — same PublicLayout wrapper,
 * same max-w-md container, same QbitButton + Icon primitives, same color palette.
 */

import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { CustomerRegistrationForm } from "@/components/qbit/public/CustomerRegistrationForm";

export const dynamic = "force-dynamic";

export default function AccountsRegisterPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-8 md:py-12">
        <CustomerRegistrationForm />
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Create Your QBIT Account — QBIT Hub",
    description: "Register your QBIT device to access warranty, drivers, downloads, manuals and support.",
  };
}
