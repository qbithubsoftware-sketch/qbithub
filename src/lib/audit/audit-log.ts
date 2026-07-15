/**
 * Audit Log service — records security-sensitive actions.
 *
 * Used by:
 *   - Login/logout (via NextAuth callbacks)
 *   - Product CRUD (admin APIs)
 *   - Driver/firmware uploads
 *   - User role changes
 *   - Any protected API that modifies enterprise data
 *
 * The audit log is visible only to Super Administrators at /super-admin.
 */

import { db } from "@/lib/db";
import type { Session } from "next-auth";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "UPLOAD"
  | "EDIT"
  | "DELETE"
  | "DRIVER_CHANGE"
  | "FIRMWARE_CHANGE"
  | "ROLE_CHANGE"
  | "DOWNLOAD"
  | "SETTINGS_CHANGE"
  | "PRODUCT_UPDATE"
  | "CREATE";

export interface AuditLogEntry {
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: AuditAction | string;
  entityType?: string | null;
  entityId?: string | null;
  entityName?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Record an audit log entry. Non-blocking — errors are logged but never thrown.
 * Call this from any API route that performs a sensitive action.
 */
export async function recordAuditLog(
  session: Session | null,
  entry: Omit<AuditLogEntry, "userId" | "userName" | "userEmail" | "userRole"> & Partial<Pick<AuditLogEntry, "userId" | "userName" | "userEmail" | "userRole">>,
  req?: Request,
): Promise<void> {
  try {
    const userId = entry.userId ?? session?.user?.id ?? null;
    const userName = entry.userName ?? session?.user?.name ?? null;
    const userEmail = entry.userEmail ?? session?.user?.email ?? null;
    const userRole = entry.userRole ?? ((session?.user?.role as string) ?? null);

    let ipAddress = entry.ipAddress ?? null;
    let userAgent = entry.userAgent ?? null;
    if (req) {
      ipAddress = ipAddress ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      userAgent = userAgent ?? req.headers.get("user-agent") ?? null;
    }

    await db.auditLog.create({
      data: {
        userId,
        userName,
        action: entry.action,
        entity: entry.entityType ?? "system",
        entityId: entry.entityId ?? null,
        entityName: entry.entityName ?? null,
        description: entry.description ?? null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[audit-log] Failed to record entry:", error);
  }
}

/**
 * List audit log entries (for the Super Admin dashboard).
 */
export async function listAuditLogs(opts?: {
  limit?: number;
  offset?: number;
  action?: string;
  userId?: string;
}): Promise<{ entries: Array<Record<string, unknown>>; total: number }> {
  const limit = Math.min(opts?.limit ?? 100, 500);
  const offset = opts?.offset ?? 0;

  const where: Record<string, unknown> = {};
  if (opts?.action) where.action = opts.action;
  if (opts?.userId) where.userId = opts.userId;

  const [entries, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    entries: entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
    total,
  };
}
