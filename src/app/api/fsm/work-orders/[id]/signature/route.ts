/**
 * POST /api/fsm/work-orders/[id]/signature — record customer signature
 *
 * Body: { signerName, dataUrl (PNG from canvas.toDataURL()), }
 */

import { NextRequest, NextResponse } from "next/server";
import { db, requireFieldEngineer } from "@/lib/fsm/api-helpers";
import { badRequest, forbidden, notFound } from "@/lib/errors/handler";
import { sanitizeText, validateRequired } from "@/lib/security/validation";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

interface Params {
  params: Promise<{ id: string }>;
}

const MAX_SIG_BYTES = 200 * 1024; // 200KB PNG

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireFieldEngineer();
  if (!session) return forbidden("Field engineer access required.");

  const { id } = await params;
  const wo = await db.workOrder.findUnique({
    where: { id },
    select: { id: true, jobNumber: true, assignedEngineerId: true },
  });
  if (!wo) return notFound("Work order not found.");

  const role = session.user.role as string;
  if (role === "installation_engineer" && wo.assignedEngineerId !== session.user.id) {
    return forbidden("Not assigned to you.");
  }

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid JSON body.");

  const missing = validateRequired(body, ["signerName", "dataUrl"]);
  if (missing.length > 0) return badRequest(`Missing fields: ${missing.join(", ")}`);

  const dataUrl: string = body.dataUrl;
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) return badRequest("Invalid signature data URL (must be PNG).");
  const base64 = match[1];
  if (base64.length > MAX_SIG_BYTES) return badRequest("Signature too large.");

  const buffer = Buffer.from(base64, "base64");
  const fileName = `signature-${randomUUID().slice(0, 8)}.png`;
  const relativeDir = join("uploads", "fsm", wo.jobNumber);
  const absoluteDir = join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  const absolutePath = join(absoluteDir, fileName);
  await writeFile(absolutePath, buffer);
  const storagePath = `/${relativeDir}/${fileName}`;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  const signature = await db.customerSignature.create({
    data: {
      workOrderId: id,
      storagePath,
      signerName: sanitizeText(body.signerName, 100),
      ipAddress: ip,
      userAgent,
    },
  });

  return NextResponse.json({ signature }, { status: 201 });
}
