/**
 * Auth helpers for API routes.
 *
 * V3 RBAC layers:
 *   - requireAuth()              → any logged-in user
 *   - requireCustomer()          → public_customer role only
 *   - requireStaff()             → admin + installation + support engineers
 *   - requireEngineerOrAdmin()   → admin + installation_engineer
 *   - requireAdmin()             → administrator only
 *   - requireRoles(...roles)     → explicit role whitelist
 *
 * Every helper returns the session on success or null on failure.
 * Callers must check for null and return 401/403 accordingly.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import type { Role } from "@/lib/rbac/roles";

/** Any authenticated user. */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

/** Customer role only — for /api/account/* endpoints. */
export async function requireCustomer() {
  const session = await requireAuth();
  if (!session) return null;
  const role = session.user.role as Role;
  if (role !== "public_customer") return null;
  return session;
}

/** Administrator only. */
export async function requireAdmin() {
  const session = await requireAuth();
  if (!session) return null;
  const role = session.user.role as Role;
  if (role !== "administrator") return null;
  return session;
}

/** Admin or installation_engineer. */
export async function requireEngineerOrAdmin() {
  const session = await requireAuth();
  if (!session) return null;
  const role = session.user.role as Role;
  if (role !== "administrator" && role !== "installation_engineer") return null;
  return session;
}

/** Staff only: administrator + installation_engineer + support_engineer.
 *  Blocks public_customer, sales_executive, dealer, viewer. */
export async function requireStaff() {
  const session = await requireAuth();
  if (!session) return null;
  const role = session.user.role as Role;
  if (
    role !== "administrator" &&
    role !== "installation_engineer" &&
    role !== "support_engineer"
  ) {
    return null;
  }
  return session;
}

/** Explicit role whitelist. Returns session only if user's role is in the list. */
export async function requireRoles(...allowedRoles: Role[]) {
  const session = await requireAuth();
  if (!session) return null;
  const role = session.user.role as Role;
  if (!allowedRoles.includes(role)) return null;
  return session;
}

/** Cron secret — for Vercel Cron Jobs. */
export function requireCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

