/**
 * /support-portal — Support Executive Portal entry route.
 *
 * SECURITY: Server-side role guard. Only `support_engineer` role can access.
 *   - Unauthenticated → redirect to /accounts/login
 *   - Authenticated but wrong role → 403 Forbidden
 *   - Authenticated support_engineer → redirect to /portal (Zustand app
 *     at the AI Support Center screen)
 *
 * NOTE: We use /support-portal instead of /support because /support is already
 * the public Support Center page (accessible without login). This avoids a
 * URL conflict while keeping the public support page at /support.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { ForbiddenNotice } from "@/components/qbit/public/ForbiddenNotice";

export const dynamic = "force-dynamic";

export default async function SupportPortalEntryPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as string | undefined) ?? null;

  if (!session || !role) {
    redirect("/accounts/login?from=/support-portal");
  }

  if (role !== "support_engineer") {
    // Authenticated but wrong role — render 403 Forbidden.
    return (
      <PublicLayout>
        <ForbiddenNotice
          role={role}
          attemptedRoute="/support-portal"
          requiredRoles={["support_engineer"]}
        />
      </PublicLayout>
    );
  }

  // Authenticated support_engineer → mount the Zustand app shell.
  redirect("/portal");
}
