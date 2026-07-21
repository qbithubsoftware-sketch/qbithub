/**
 * /engineer — entry route for engineer portal.
 *
 * SECURITY: Checks auth + role. If unauthenticated → redirect to /enterprise/login.
 * If authenticated but wrong role (customer/dealer/sales) → render 403.
 * If correct role (installation_engineer/administrator) → redirect to /portal.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { ForbiddenNotice } from "@/components/qbit/public/ForbiddenNotice";

const ENGINEER_ROLES = ["installation_engineer", "administrator"];

export const dynamic = "force-dynamic";

export default async function EngineerEntryPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as string | undefined) ?? null;

  if (!session || !role) {
    redirect("/enterprise/login?from=/engineer");
  }

  if (!ENGINEER_ROLES.includes(role)) {
    // Authenticated but wrong role — show 403 Forbidden.
    return (
      <PublicLayout>
        <ForbiddenNotice
          role={role}
          attemptedRoute="/engineer"
          requiredRoles={ENGINEER_ROLES}
        />
      </PublicLayout>
    );
  }

  // Authenticated engineer/admin → mount the Zustand app shell.
  redirect("/portal");
}
