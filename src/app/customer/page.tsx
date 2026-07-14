/**
 * /customer — V3 Customer Portal route.
 *
 * Same as /account — renders the CustomerDashboard component.
 * Both /customer and /account work for backward compatibility.
 *
 * SECURITY: Client-side auth check via useSession.
 *   - Unauthenticated → redirect to /accounts/login
 *   - Staff (admin/engineer/support) → redirect to /portal (their own portal)
 *   - public_customer → render dashboard
 */

import { CustomerDashboard } from "@/components/qbit/public/CustomerDashboard";

export const dynamic = "force-dynamic";

export default function CustomerPage() {
  return <CustomerDashboard />;
}

export async function generateMetadata() {
  return {
    title: "My Account — QBIT Hub",
    description: "Your registered devices, warranty status, downloads, and support tickets.",
  };
}
