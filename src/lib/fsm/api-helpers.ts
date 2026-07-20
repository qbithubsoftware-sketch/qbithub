/**
 * FSM API helpers — session/role gating shared across all /api/fsm routes.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import type { Role } from "@/lib/rbac/roles";

/** Engineer or admin only. Returns the session or null. */
export async function requireEngineer() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = session.user.role as Role;
  if (role !== "installation_engineer" && role !== "administrator" && role !== "support_engineer" && role !== "super_administrator") {
    return null;
  }
  return session;
}

/** Strict: installation_engineer or administrator only (no support_engineer). */
export async function requireFieldEngineer() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = session.user.role as Role;
  if (role !== "installation_engineer" && role !== "administrator" && role !== "super_administrator") return null;
  return session;
}

/** Administrator only (includes super_administrator). */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = session.user.role as Role;
  if (role !== "administrator" && role !== "super_administrator") return null;
  return session;
}

export { db };
