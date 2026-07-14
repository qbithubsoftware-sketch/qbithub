/**
 * /admin — Administrator Portal entry route.
 *
 * SECURITY: Server-side role guard. Only `administrator` role can access.
 *   - Unauthenticated → redirect to /accounts/login
 *   - Authenticated but wrong role (including super_administrator) → 403
 *   - Authenticated administrator → redirect to /portal (admin dashboard)
 *
 * Super Administrators have their own portal at /super-admin.
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

  redirect("/portal");
}
