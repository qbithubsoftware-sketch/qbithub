"use client";

/**
 * 401 — Unauthorized.
 *
 * Shown when a user tries to access a protected resource without being
 * authenticated at all.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { ScreenSwitcher } from "@/components/qbit/shells/ScreenSwitcher";
import { useNavigation } from "@/lib/navigation/store";

export default function UnauthorizedPage() {
  const navigate = useNavigation((s) => s.navigate);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-qbit-background p-6 text-center">
      <div className="fixed top-4 right-4 z-50">
        <ScreenSwitcher />
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-700">
        <Icon name="no_accounts" className="text-[40px]" filled />
      </div>
      <p className="mt-6 text-5xl font-bold text-qbit-on-surface">401</p>
      <h1 className="mt-2 text-xl font-semibold text-qbit-on-surface">
        Authentication Required
      </h1>
      <p className="mt-2 max-w-md text-sm text-qbit-on-surface-variant">
        You need to sign in with your corporate account to access this resource.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <QbitButton variant="primary" icon="login" onClick={() => navigate("login")}>
          Sign In
        </QbitButton>
        <QbitButton
          variant="outline"
          icon="campaign"
          onClick={() => navigate("product-overview")}
        >
          View Public Pages
        </QbitButton>
      </div>
    </div>
  );
}
