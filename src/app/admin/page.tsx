/**
 * /admin — entry route for administrator portal.
 *
 * Checks auth + role. If the user is authenticated as an administrator,
 * hard-redirects to /portal (which mounts the Zustand admin dashboard at
 * screen id "home"). Otherwise redirects to /accounts/login.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

export default async function AdminEntryPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as string | undefined) ?? null;

  if (!session || role !== "administrator") {
    redirect("/accounts/login?from=/admin");
  }

  // Authenticated administrator → mount the Zustand app shell at admin home.
  redirect("/portal");
}
