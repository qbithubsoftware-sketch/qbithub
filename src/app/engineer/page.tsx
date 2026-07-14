/**
 * /engineer — entry route for engineer portal.
 *
 * Checks auth + role. If the user is authenticated as an engineer or admin,
 * hard-redirects to /portal (which mounts the Zustand app shell at the
 * role's home screen). Otherwise redirects to /accounts/login.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

const ENGINEER_ROLES = ["installation_engineer", "support_engineer", "administrator"];

export const dynamic = "force-dynamic";

export default async function EngineerEntryPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as string | undefined) ?? null;

  if (!session || !role) {
    redirect("/accounts/login?from=/engineer");
  }

  if (!ENGINEER_ROLES.includes(role)) {
    // Authenticated but wrong role — send them to their own dashboard.
    redirect("/portal");
  }

  // Authenticated engineer/admin → mount the Zustand app shell.
  redirect("/portal");
}
