/**
 * ForbiddenNotice — V3 security 403 page for wrong-role access.
 *
 * Rendered when an authenticated user tries to access a portal route their
 * role isn't allowed into (e.g. customer visiting /admin). Reuses the
 * existing Stitch design language: qbit-error-container, Material Symbols,
 * surface-card pattern.
 */

import Link from "next/link";
import { Icon } from "@/components/qbit/primitives/Icon";

interface Props {
  /** The user's current role (for display). */
  role: string;
  /** The route they tried to access (e.g. "/admin"). */
  attemptedRoute: string;
  /** The roles that ARE allowed (for display). */
  requiredRoles: string[];
}

export function ForbiddenNotice({ role, attemptedRoute, requiredRoles }: Props) {
  const roleLabel = role ? role.replace(/_/g, " ") : "unknown";
  const requiredLabel = requiredRoles.map((r) => r.replace(/_/g, " ")).join(", ");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center md:py-24">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-qbit-error-container text-qbit-on-error-container">
        <Icon name="lock_person" className="text-[40px]" filled />
      </div>
      <p className="mt-6 text-5xl font-bold text-qbit-on-surface">403</p>
      <h1 className="mt-2 text-xl font-semibold text-qbit-on-surface">
        Access Forbidden
      </h1>
      <p className="mt-3 max-w-md text-sm text-qbit-on-surface-variant">
        Your role
        <span className="font-semibold text-qbit-on-surface"> ({roleLabel}) </span>
        does not have permission to access{" "}
        <code className="rounded bg-qbit-surface-container px-1.5 py-0.5 text-xs font-mono text-qbit-primary">
          {attemptedRoute}
        </code>
        . This area requires: <span className="font-semibold">{requiredLabel}</span>.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
        >
          <Icon name="home" className="text-[18px]" />
          Go to Homepage
        </Link>
        <Link
          href="/accounts/login"
          className="inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-5 py-2.5 text-sm font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
        >
          <Icon name="switch_account" className="text-[18px]" />
          Switch Account
        </Link>
      </div>

      <p className="mt-8 max-w-md text-xs text-qbit-on-surface-variant">
        If you believe this is an error, please contact your administrator or{" "}
        <Link href="/support" className="font-semibold text-qbit-primary hover:underline">
          reach out to support
        </Link>
        .
      </p>
    </div>
  );
}
