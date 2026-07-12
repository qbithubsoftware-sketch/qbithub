"use client";

/**
 * 404 — Not Found.
 *
 * Stitch-styled full-screen error page.  Shown by Next.js when no route
 * matches.  Includes a ScreenSwitcher so the user can navigate back to a
 * known screen.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { ScreenSwitcher } from "@/components/qbit/shells/ScreenSwitcher";
import { useNavigation } from "@/lib/navigation/store";

export default function NotFound() {
  const navigate = useNavigation((s) => s.navigate);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-qbit-background p-6 text-center">
      <div className="fixed top-4 right-4 z-50">
        <ScreenSwitcher />
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-qbit-surface-container-high text-qbit-on-surface-variant">
        <Icon name="search_off" className="text-[40px]" />
      </div>
      <p className="mt-6 text-5xl font-bold text-qbit-on-surface">404</p>
      <h1 className="mt-2 text-xl font-semibold text-qbit-on-surface">
        Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-sm text-qbit-on-surface-variant">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Use the dashboard button below to return to a known screen.
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
