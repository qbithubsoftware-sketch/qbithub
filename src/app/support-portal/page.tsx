/**
 * /support-portal — DEPRECATED.
 *
 * This route now redirects all traffic to the unified Engineer Portal.
 * The Support Engineer Portal has been merged into the Engineer Portal's
 * Support module. All support_engineer users should use /engineer instead.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SupportPortalRedirectPage() {
  redirect("/engineer");
}
