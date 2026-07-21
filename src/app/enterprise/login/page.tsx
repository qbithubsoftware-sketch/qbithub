/**
 * /enterprise/login — Enterprise Portal Login (SEPARATE from Customer Login).
 *
 * This is the EMPLOYEE-ONLY login page. It reuses the existing staff
 * LoginPage component (Corporate Email + Password + SSO — the original
 * Stitch design shown in Screenshot 455).
 *
 * CRITICAL: This page is completely independent from /accounts/login.
 *   - /accounts/login → Customer Login (Mobile Number + Password)
 *   - /enterprise/login → Enterprise Login (Corporate Email + Password)
 *
 * After successful auth, the LoginPage component redirects to /portal
 * which mounts the Zustand app shell. The AuthGuard in /portal then
 * routes the user to their role's home screen.
 *
 * Employees (super_admin, administrator, installation_engineer)
 * log in HERE. Engineers land on the Engineer Portal (/engineer).
 * The two flows NEVER mix.
 */

import { LoginPage } from "@/components/qbit/pages/LoginPage";

export const dynamic = "force-dynamic";

export default function EnterpriseLoginPage() {
  // Render the existing staff LoginPage as-is. It has its own two-panel
  // Stitch design (brand panel + form panel) — no PublicLayout wrapper.
  return <LoginPage />;
}

export async function generateMetadata() {
  return {
    title: "Enterprise Login — QBIT Hub",
    description: "Employee login for QBIT Hub Enterprise Portal. Authorized personnel only.",
    robots: {
      index: false,    // Don't index the enterprise login page
      follow: false,
    },
  };
}
