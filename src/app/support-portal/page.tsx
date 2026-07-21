/**
 * /support-portal — DEPRECATED.
 *
 * This route redirects to the Engineer Portal.
 * The Support module is built into the Engineer Portal.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SupportPortalRedirectPage() {
  redirect("/engineer");
}
