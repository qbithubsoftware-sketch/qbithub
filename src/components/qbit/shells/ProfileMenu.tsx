"use client";

/**
 * Profile dropdown — sits in the top bar where the original Stitch design
 * shows the avatar + user name.  Surfaces the user's role, theme toggle,
 * settings link, and sign-out action.
 *
 * Replaces the static avatar block in TopBar with a Radix dropdown that
 * preserves the exact same visual trigger (initials avatar + name + role).
 */

import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/qbit/primitives/Icon";
import { useNavigation } from "@/lib/navigation/store";
import { ROLE_LABELS, ROLE_ICONS, type Role } from "@/lib/rbac/roles";
import { cn } from "@/lib/utils";

export function ProfileMenu({
  className,
  compact = false,
}: {
  className?: string;
  /** When true, only the avatar circle is shown (mobile-compact mode). */
  compact?: boolean;
}) {
  const { data: session, status } = useSession();
  const navigate = useNavigation((s) => s.navigate);

  const user = session?.user;
  const role = user?.role as Role | undefined;
  const name = user?.name ?? "Guest";
  const email = user?.email ?? "";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Trigger button — matches the original Stitch avatar block exactly.
  const trigger = (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2 rounded-lg p-1 pl-2 transition-colors hover:bg-qbit-surface-container",
        className,
      )}
      aria-label="Open profile menu"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-qbit-primary text-xs font-bold text-qbit-on-primary ring-2 ring-white">
        {initials}
      </div>
      {!compact && name !== "Guest" && (
        <div className="hidden lg:block min-w-0 text-left">
          <p className="truncate text-xs font-semibold text-qbit-on-surface leading-tight">
            {name}
          </p>
          <p className="truncate text-[10px] text-qbit-on-surface-variant leading-tight">
            {role ? ROLE_LABELS[role] : "Signed out"}
          </p>
        </div>
      )}
    </button>
  );

  // If not authenticated, render the trigger without a dropdown (visual only).
  if (status !== "authenticated" || !user) {
    return trigger;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl border-qbit-outline-variant bg-qbit-surface-container-lowest p-0 shadow-2xl"
      >
        {/* Header — avatar + name + email + role badge */}
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-3 p-4 pb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-qbit-primary text-sm font-bold text-qbit-on-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-qbit-on-surface">
                {name}
              </p>
              <p className="truncate text-[11px] text-qbit-on-surface-variant">
                {email}
              </p>
            </div>
          </div>
          {role && (
            <div className="flex items-center gap-2 px-4 pb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-qbit-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-qbit-primary">
                <Icon name={ROLE_ICONS[role]} className="text-[12px]" filled />
                {ROLE_LABELS[role]}
              </span>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-qbit-outline-variant/60" />

        {/* Menu items — role-aware */}
        <div className="p-1.5">
          {/* Account Settings — only for admin roles */}
          {role === "super_administrator" || role === "administrator" ? (
            <DropdownMenuItem
              onSelect={() => navigate("system-settings")}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-qbit-on-surface cursor-pointer hover:bg-qbit-surface-container-low"
            >
              <Icon name="manage_accounts" className="text-[18px] text-qbit-on-surface-variant" />
              Account Settings
            </DropdownMenuItem>
          ) : null}
          {/* My Dashboard — navigate to role home screen */}
          <DropdownMenuItem
            onSelect={() => navigate(role === "installation_engineer" ? "engineer-portal" : role === "super_administrator" || role === "administrator" ? "home" : "product-library")}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-qbit-on-surface cursor-pointer hover:bg-qbit-surface-container-low"
          >
            <Icon name="dashboard" className="text-[18px] text-qbit-on-surface-variant" />
            My Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate("support-tickets")}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-qbit-on-surface cursor-pointer hover:bg-qbit-surface-container-low"
          >
            <Icon name="contact_support" className="text-[18px] text-qbit-on-surface-variant" />
            Help & Support
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-qbit-outline-variant/60" />

        {/* Sign out */}
        <div className="p-1.5">
          <DropdownMenuItem
            onSelect={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-qbit-error cursor-pointer hover:bg-qbit-error-container/40"
          >
            <Icon name="logout" className="text-[18px]" />
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
