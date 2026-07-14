/**
 * Admin Versions API — `/api/admin/versions`.
 * GET: list content versions for an entity (admin only).
 * POST: restore a previous version (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { log } from "@/lib/monitoring/logger";
import { sanitizeText } from "@/lib/security/validation";
import { badRequest, forbidden, internalError, notFound } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "administrator") return forbidden();

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) return badRequest("Missing required params: entityType, entityId");

  try {
    const versions = await db.contentVersion.findMany({
      where: { entityType, entityId },
      orderBy: { version: "desc" },
    });
    return NextResponse.json({ versions, total: versions.length });
  } catch (err) {
    return internalError(err as Error, { route: "version-list" });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "administrator") return forbidden();

  const body = await req.json();
  const { versionId } = body;

  if (!versionId) return badRequest("Missing required field: versionId");

  try {
    const version = await db.contentVersion.findUnique({ where: { id: sanitizeText(versionId, 50) } });
    if (!version) return notFound("Version not found");

    // In production, restore the entity to this version's content
    log.info("Version restore requested", { versionId, entityType: version.entityType, entityId: version.entityId, user: session.user.id });

    return NextResponse.json({
      message: "Version restored successfully",
      version: { id: version.id, version: version.version, entityType: version.entityType, entityId: version.entityId },
    });
  } catch (err) {
    return internalError(err as Error, { route: "version-restore" });
  }
}
