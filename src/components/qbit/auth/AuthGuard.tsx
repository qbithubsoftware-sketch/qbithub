"use client";

/**
 * AuthGuard — protects in-app screens using the NextAuth session + RBAC.
 *
 * Behaviour:
 *  1. While the session status is "loading", render a Stitch-styled
 *     loading skeleton.
 *  2. If unauthenticated and the target screen is not public, redirect
 *     to the login screen (in-app) and render the login page.
 *  3. If authenticated but the role lacks permission for the screen,
 *     render the 403 Forbidden screen.
 *  4. Otherwise render the children.
 */

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useNavigation } from "@/lib/navigation/store";
import { canAccessScreen, type Role } from "@/lib/rbac/roles";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { ScreenSwitcher } from "@/components/qbit/shells/ScreenSwitcher";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const current = useNavigation((s) => s.current);
  const navigate = useNavigation((s) => s.navigate);

  const role = (session?.user?.role as Role | undefined) ?? null;
  const isPublic = canAccessScreen(null, current); // empty roles = public

  // If unauthenticated and trying to view a protected screen, bounce to /accounts/login.
  // (V3 architecture: login is now a real Next.js route at /accounts/login, not an in-app screen.)
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" && !isPublic && current !== "login") {
      // Use a hard navigation to /accounts/login so the public portal shell takes over.
      if (typeof window !== "undefined") {
        window.location.href = "/accounts/login?from=" + encodeURIComponent(window.location.pathname);
      } else {
        navigate("login");
      }
    }
    // Authenticated user lands on /portal — send them to their role's home screen
    // instead of leaving them on the "login" screen id.
    if (status === "authenticated" && role && current === "login") {
      navigate(roleHomeScreen(role));
    }
  }, [status, isPublic, current, navigate, role]);

  // Loading state — Stitch-styled skeleton
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-qbit-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-primary">
            <Icon name="dataset" className="text-[28px] text-qbit-on-primary" filled />
            <span className="absolute inset-0 rounded-2xl border-2 border-qbit-primary/30 border-t-qbit-primary animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-qbit-on-surface">Authenticating</p>
            <p className="text-xs text-qbit-on-surface-variant">Verifying your session…</p>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated → render whatever the router points at (login screen).
  if (status === "unauthenticated") {
    // If they're on a public screen (e.g. product-overview), allow it.
    if (isPublic) return <>{children}</>;
    return <>{children}</>; // page.tsx will render LoginPage
  }

  // Authenticated — check RBAC.
  if (!canAccessScreen(role, current)) {
    return <ForbiddenScreen role={role} current={current} />;
  }

  return <>{children}</>;
}

/** Stitch-styled 403 screen. */
function ForbiddenScreen({
  role,
  current,
}: {
  role: Role | null;
  current: string;
}) {
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
        Your role
        {role && (
          <span className="font-semibold text-qbit-on-surface">
            {" "}
            ({role.replace(/_/g, " ")})
          </span>
        )}{" "}
        does not have permission to view the{" "}
        <code className="rounded bg-qbit-surface-container px-1.5 py-0.5 text-xs font-mono text-qbit-primary">
          {current}
        </code>{" "}
        screen. Contact your administrator if you believe this is an error.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <QbitButton
          variant="primary"
          icon="home"
          onClick={() => navigate(role ? roleHomeScreen(role) : "login")}
        >
          Go to my dashboard
        </QbitButton>
        <QbitButton variant="outline" icon="login" onClick={() => navigate("login")}>
          Switch account
        </QbitButton>
      </div>
    </div>
  );
}

/** Inline role → home screen mapping (mirrors rbac/roles.ts to avoid circular imports). */
function roleHomeScreen(role: Role): import("@/lib/navigation/store").ScreenId {
  switch (role) {
    case "administrator":
      return "home";
    case "installation_engineer":
      return "mobile-engineer";
    case "support_engineer":
      return "ai-support-center";
    case "sales_executive":
    case "dealer":
    case "viewer":
      return "product-library";
    case "public_customer":
      return "product-overview";
  }
}
