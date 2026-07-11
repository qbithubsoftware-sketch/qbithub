"use client";

/**
 * 403 — Forbidden.
 *
 * Shown when an authenticated user tries to access a resource their role
 * is not permitted to view.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { ScreenSwitcher } from "@/components/qbit/shells/ScreenSwitcher";
import { useNavigation } from "@/lib/navigation/store";

export default function ForbiddenPage() {
  const navigate = useNavigation((s) => s.navigate);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-qbit-background p-6 text-center">
      <div className="fixed top-4 right-4 z-50">
        <ScreenSwitcher />
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-qbit-error-container text-qbit-on-error-container">
        <Icon name="lock_person" className="text-[40px]" filled />
      </div>
      <p className="mt-6 text-5xl font-bold text-qbit-on-surface">403</p>
      <h1 className="mt-2 text-xl font-semibold text-qbit-on-surface">
        Access Forbidden
      </h1>
      <p className="mt-2 max-w-md text-sm text-qbit-on-surface-variant">
        Your account does not have permission to view this page. If you believe
        this is an error, contact your QBIT Hub administrator.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <QbitButton variant="primary" icon="home" onClick={() => navigate("login")}>
          Back to Login
        </QbitButton>
        <QbitButton
          variant="outline"
          icon="support_agent"
          onClick={() => navigate("ai-support-center")}
        >
          Contact Support
        </QbitButton>
      </div>
    </div>
  );
}
