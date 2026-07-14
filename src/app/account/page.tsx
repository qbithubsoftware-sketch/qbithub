/**
 * /account — V3 customer dashboard route.
 *
 * Client component (uses useSession for client-side auth check + redirect).
 * Renders the CustomerDashboard component which fetches registered devices
 * from /api/account/devices and displays them with warranty info.
 */

import { CustomerDashboard } from "@/components/qbit/public/CustomerDashboard";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return <CustomerDashboard />;
}

export async function generateMetadata() {
  return {
    title: "My Account — QBIT Hub",
    description: "Your registered devices, warranty status, downloads, and support tickets.",
  };
}
