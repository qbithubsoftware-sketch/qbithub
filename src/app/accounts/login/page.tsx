/**
 * /accounts/login — V3 customer login page.
 *
 * Reuses the existing LoginPage component (with its Stitch design — two-panel
 * layout, brand panel + form). Wraps it in PublicLayout so the public header
 * and footer remain visible (consistent with Microsoft / Apple support portals).
 *
 * After successful auth, the LoginPage component hard-navigates to /portal
 * which mounts the Zustand app shell and routes to the user's role-based home
 * screen.
 */

import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { LoginPage } from "@/components/qbit/pages/LoginPage";

export const dynamic = "force-dynamic";

export default function AccountsLoginPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-12 md:py-16">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-qbit-on-surface">Sign in to QBIT Hub</h1>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Access your registered devices, warranty, downloads, and support tickets.
          </p>
        </div>
        {/* The LoginPage component renders the actual form. We render it inside
            a surface card so it looks consistent with the public portal design. */}
        <div className="rounded-2xl border border-qbit-outline-variant bg-white p-6 shadow-sm md:p-8">
          <LoginPage />
        </div>
        <p className="mt-4 text-center text-xs text-qbit-on-surface-variant">
          By signing in, you agree to our{" "}
          <a href="/support" className="font-semibold text-qbit-primary hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="/support" className="font-semibold text-qbit-primary hover:underline">Privacy Policy</a>.
        </p>
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
