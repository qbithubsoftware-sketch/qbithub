"use client";

/**
 * useAuth — thin wrapper around `useSession` that surfaces role-aware
 * helpers consumed by the shell and the page router.
 */

import { useSession } from "next-auth/react";
import { useNavigation } from "@/lib/navigation/store";
import {
  canAccessScreen,
  homeScreenForRole,
  filterNavItemsByRole,
  type Role,
} from "@/lib/rbac/roles";
import type { ScreenId } from "@/lib/navigation/store";

export function useAuth() {
  const { data: session, status } = useSession();
  const navigate = useNavigation((s) => s.navigate);

  const role = (session?.user?.role as Role | undefined) ?? null;
  const isAuthenticated = status === "authenticated" && !!role;
  const isLoading = status === "loading";

  return {
    session,
    status,
    user: session?.user,
    role,
    isAuthenticated,
    isLoading,
    canAccess: (screen: ScreenId) => canAccessScreen(role, screen),
    homeScreen: role ? homeScreenForRole(role) : ("login" as ScreenId),
    navigateHome: () => navigate(role ? homeScreenForRole(role) : "login"),
    filterNav: <T extends { screen?: ScreenId }>(items: T[]) =>
      filterNavItemsByRole(items, role),
  };
}
