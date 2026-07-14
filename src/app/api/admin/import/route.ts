/**
 * Admin Import API — `/api/admin/import`.
 * POST: create a new import job (admin only).
 * GET: list import jobs (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { log } from "@/lib/monitoring/logger";
import { sanitizeText, validateRequired } from "@/lib/security/validation";
import { badRequest, forbidden, internalError } from "@/lib/errors/handler";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (session.user.role !== "administrator") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const jobs = await db.importJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { logs: true } } },
    });
    return NextResponse.json({ jobs });
  } catch (err) {
    return internalError(err as Error, { route: "import-list" });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json();
  const missing = validateRequired(body, ["type", "fileName", "fileSize"]);
  if (missing.length > 0) return badRequest(`Missing fields: ${missing.join(", ")}`);

  try {
    const job = await db.importJob.create({
      data: {
        type: sanitizeText(body.type, 50),
        fileName: sanitizeText(body.fileName, 255),
        fileSize: Number(body.fileSize) || 0,
        totalRows: Number(body.totalRows) || 0,
        startedBy: session.user.id,
        status: "pending",
      },
    });
    log.info("Import job created", { jobId: job.id, type: job.type, user: session.user.id });
    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    return internalError(err as Error, { route: "import-create" });
  }
}
