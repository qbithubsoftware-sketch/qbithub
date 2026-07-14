/**
 * /accounts/login — V3 customer login page.
 *
 * Uses the dedicated CustomerLoginPage component (mobile-number login +
 * Register Product / Activate Warranty / Need Support? quick links).
 * Wrapped in PublicLayout so the public header and footer remain visible.
 *
 * After successful auth, CustomerLoginPage hard-navigates:
 *   - public_customer role → /account (customer dashboard)
 *   - staff roles (admin/engineer/support) → /portal (Zustand app shell)
 */

import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { CustomerLoginPage } from "@/components/qbit/public/CustomerLoginPage";

export const dynamic = "force-dynamic";

export default function AccountsLoginPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-8 md:py-12">
        <CustomerLoginPage />
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Sign in — QBIT Hub",
    description: "Customer login to access your registered devices, warranty, downloads, and support.",
  };
}
