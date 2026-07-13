/**
 * GET  /api/fsm/work-orders/[id]/photos  — list photos for a work order
 * POST /api/fsm/work-orders/[id]/photos  — record a new photo metadata entry
 *
 * NOTE: Photos are uploaded via base64 data URL for simplicity (no cloud storage
 * configured in this environment). The base64 is stored on disk under
 * /public/uploads/fsm/[jobNumber]/ and the path is recorded in the DB.
 *
 * In production, replace this with a presigned-URL flow (S3/Supabase).
 */

import { NextRequest, NextResponse } from "next/server";
import { db, requireFieldEngineer } from "@/lib/fsm/api-helpers";
import { badRequest, forbidden, internalError, notFound } from "@/lib/errors/handler";
import { sanitizeText } from "@/lib/security/validation";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

interface Params {
  params: Promise<{ id: string }>;
}

const ALLOWED_CATEGORIES = ["before", "setup", "cables", "after", "issue"] as const;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BASE64_BYTES = 4 * 1024 * 1024; // 4MB after base64 encoding ≈ 3MB image

export async function GET(req: NextRequest, { params }: Params) {
  const session = await requireFieldEngineer();
  if (!session) return forbidden("Field engineer access required.");

  const { id } = await params;
  const wo = await db.workOrder.findUnique({
    where: { id },
    select: { assignedEngineerId: true },
  });
  if (!wo) return notFound("Work order not found.");

  const role = session.user.role as string;
  if (role === "installation_engineer" && wo.assignedEngineerId !== session.user.id) {
    return forbidden("Not assigned to you.");
  }

  const photos = await db.workOrderPhoto.findMany({
    where: { workOrderId: id },
    orderBy: { capturedAt: "asc" },
  });

  return NextResponse.json({
    items: photos.map((p) => ({
      id: p.id,
      category: p.category,
      caption: p.caption,
      storagePath: p.storagePath,
      thumbnailPath: p.thumbnailPath,
      capturedAt: p.capturedAt.toISOString(),
    })),
  });
}
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

  const category = body.category;
  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    return badRequest(`Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`);
  }

  const dataUrl: string = body.dataUrl;
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return badRequest("Missing or invalid dataUrl.");
  }

  // Parse data URL: data:[<mime>];base64,<payload>
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return badRequest("Malformed data URL.");
  const [, mime, base64] = match;
  if (!ALLOWED_MIME.includes(mime as (typeof ALLOWED_MIME)[number])) {
    return badRequest(`Unsupported mime type: ${mime}`);
  }
  if (base64.length > MAX_BASE64_BYTES) {
    return badRequest("Image too large. Max 3MB after base64 encoding.");
  }

  const buffer = Buffer.from(base64, "base64");
  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  const fileName = `${category}-${randomUUID().slice(0, 8)}.${ext}`;
  const relativeDir = join("uploads", "fsm", wo.jobNumber);
  const absoluteDir = join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  const absolutePath = join(absoluteDir, fileName);
  await writeFile(absolutePath, buffer);
  const storagePath = `/${relativeDir}/${fileName}`;

  const photo = await db.workOrderPhoto.create({
    data: {
      workOrderId: id,
      category,
      caption: body.caption ? sanitizeText(body.caption, 200) : null,
      storagePath,
      mimeType: mime,
      fileSize: buffer.length,
      geoLat: body.geoLat ?? null,
      geoLng: body.geoLng ?? null,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
