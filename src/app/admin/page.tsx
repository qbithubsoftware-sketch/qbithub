/**
 * /admin — entry route for administrator portal.
 *
 * SECURITY: Checks auth + role. If unauthenticated → redirect to /accounts/login.
 * If authenticated but wrong role (customer/engineer/dealer/viewer/sales) → render 403.
 * If administrator → redirect to /portal (admin dashboard).
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { ForbiddenNotice } from "@/components/qbit/public/ForbiddenNotice";

export const dynamic = "force-dynamic";

export default async function AdminEntryPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as string | undefined) ?? null;

  if (!session || !role) {
    redirect("/accounts/login?from=/admin");
  }

  if (role !== "administrator") {
    // Authenticated but wrong role — show 403 Forbidden.
    return (
      <PublicLayout>
        <ForbiddenNotice
          role={role}
          attemptedRoute="/admin"
          requiredRoles={["administrator"]}
        />
      </PublicLayout>
    );
  }

  // Authenticated administrator → mount the Zustand app shell at admin home.
  redirect("/portal");
}
