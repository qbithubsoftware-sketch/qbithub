/**
 * Admin QR API — `/api/admin/qr`.
 * GET: list QR mappings (admin only).
 * POST: generate QR codes in bulk (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { log } from "@/lib/monitoring/logger";
import { sanitizeText, validateRequired } from "@/lib/security/validation";
import { badRequest, forbidden, internalError } from "@/lib/errors/handler";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "administrator") return forbidden();

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");

  const where = entityType ? { entityType } : {};

  try {
    const mappings = await db.qRMapping.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ mappings, total: mappings.length });
  } catch (err) {
    return internalError(err as Error, { route: "qr-list" });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "administrator") return forbidden();

  const body = await req.json();
  const { entityType, entityId, qrType, targetUrl } = body;
  const missing = validateRequired(body, ["entityType", "entityId", "qrType", "targetUrl"]);
  if (missing.length > 0) return badRequest(`Missing fields: ${missing.join(", ")}`);

  try {
    // Generate QR code image URL
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sanitizeText(targetUrl, 500))}`;

    const mapping = await db.qRMapping.create({
      data: {
        entityType: sanitizeText(entityType, 50),
        entityId: sanitizeText(entityId, 100),
        qrType: sanitizeText(qrType, 50),
        targetUrl: sanitizeText(targetUrl, 500),
        qrImageUrl,
      },
    });
    log.info("QR code generated", { mappingId: mapping.id, entityType, entityId, user: session.user.id });
    return NextResponse.json({ mapping }, { status: 201 });
  } catch (err) {
    return internalError(err as Error, { route: "qr-generate" });
  }
}
