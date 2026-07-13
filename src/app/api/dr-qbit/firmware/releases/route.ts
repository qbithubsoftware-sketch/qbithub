/**
 * GET /api/dr-qbit/firmware/releases — list firmware releases
 *
 * Query params:
 *   - firmwareId: filter by firmware master record
 *   - isLatest: "true" — only latest releases
 *   - isStable: "true" | "false"
 *   - limit: number (default 50, max 200)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import type { FirmwareReleaseDTO } from "@/lib/firmware/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const firmwareId = url.searchParams.get("firmwareId");
  const isLatest = url.searchParams.get("isLatest");
  const isStable = url.searchParams.get("isStable");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);

  const where: Record<string, unknown> = {};
  if (firmwareId) where.firmwareId = firmwareId;
  if (isLatest === "true") where.isLatest = true;
  if (isStable === "true") where.isStable = true;
  if (isStable === "false") where.isStable = false;

  const releases = await db.firmwareRelease.findMany({
    where,
    orderBy: { releaseDate: "desc" },
    take: limit,
    include: {
      firmware: true,
      download: { select: { storagePath: true, fileSize: true, checksum: true } },
    },
  });

  return NextResponse.json({
    items: releases.map((r) => ({
      id: r.id,
      firmwareId: r.firmwareId,
      firmwareName: r.firmware.name,
      version: r.version,
      buildNumber: r.buildNumber,
      releaseDate: r.releaseDate.toISOString(),
      downloadUrl: r.download?.storagePath ?? null,
      fileSize: r.download?.fileSize ?? r.fileSize,
      checksum: r.download?.checksum ?? r.checksum,
      releaseNotes: r.releaseNotes,
      isCritical: r.isCritical,
      isLatest: r.isLatest,
      isStable: r.isStable,
      supportedModels: r.supportedModels ? JSON.parse(r.supportedModels) : [],
      minOsVersion: r.minOsVersion,
    })) satisfies FirmwareReleaseDTO[],
    total: releases.length,
  });
}
