/**
 * /super-admin — Super Administrator Portal entry route.
 *
 * SECURITY: Server-side role guard. Only `super_administrator` role can access.
 *   - Unauthenticated → redirect to /accounts/login
 *   - Authenticated but wrong role → 403 Forbidden
 *   - Authenticated super_administrator → redirect to /portal (Zustand app
 *     at admin home screen — the same AppShell is reused, RBAC gates which
 *     screens are visible)
 *
 * The Super Administrator sees everything an Administrator sees, PLUS
 * the Enterprise Product Upload Center, Audit Logs, User Role Management,
 * and all system controls.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { ForbiddenNotice } from "@/components/qbit/public/ForbiddenNotice";
import { portalRouteForRole } from "@/lib/rbac/roles";

export const dynamic = "force-dynamic";

export default async function SuperAdminEntryPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as string | undefined) ?? null;

  if (!session || !role) {
    redirect("/enterprise/login?from=/super-admin");
  }

  if (role !== "super_administrator") {
    // Authenticated but wrong role — render 403 Forbidden.
    return (
      <PublicLayout>
        <ForbiddenNotice
          role={role}
          attemptedRoute="/super-admin"
          requiredRoles={["super_administrator"]}
        />
      </PublicLayout>
    );
  }

  // Authenticated super_administrator → redirect to the correct portal.
  // (portalRouteForRole returns /super-admin, but we need to actually
  //  render the app shell — so we redirect to /portal where the Zustand
  //  app mounts at the role's home screen.)
  redirect(portalRouteForRole(role as never) === "/super-admin" ? "/portal" : portalRouteForRole(role as never));
}
