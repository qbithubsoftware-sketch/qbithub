/**
 * Admin Export API — `/api/admin/export`.
 * POST: generate an export (admin only).
 * GET: list export history (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { log } from "@/lib/monitoring/logger";
import { sanitizeText, validateRequired } from "@/lib/security/validation";
import { badRequest, forbidden, internalError } from "@/lib/errors/handler";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "administrator") return forbidden();
  // In production, return actual export jobs from DB
  return NextResponse.json({ exports: [], total: 0 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "administrator") return forbidden();

  const body = await req.json();
  const missing = validateRequired(body, ["type", "format"]);
  if (missing.length > 0) return badRequest(`Missing fields: ${missing.join(", ")}`);

  const type = sanitizeText(body.type, 50);
  const format = sanitizeText(body.format, 10);

  log.info("Export requested", { type, format, user: session.user.id });

  // In production, generate the actual file and return a download URL
  return NextResponse.json({
    message: "Export started",
    type,
    format,
    status: "processing",
  }, { status: 202 });
}
