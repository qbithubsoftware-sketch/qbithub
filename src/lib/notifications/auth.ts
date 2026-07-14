/**
 * Auth helpers for notification API routes.
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

/** Cron secret — for Vercel Cron Jobs. */
export function requireCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
