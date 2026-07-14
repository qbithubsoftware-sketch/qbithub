/**
 * GET /api/dr-qbit/firmware/[passportId] — firmware info for a specific passport
 *
 * Returns FirmwareInformation + latest release details + compatibility status.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/notifications/auth";
import { mapFirmwareInfoDTO } from "../route";

interface Params {
  params: Promise<{ passportId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {

  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { passportId } = await params;

  const info = await db.firmwareInformation.findUnique({
    where: { passportId },
    include: {
      passport: { include: { product: true } },
      latestRelease: {
        include: {
          firmware: true,
          // SECURITY: Don't expose storagePath — use download ID for /api/downloads/[id]/file
          download: { select: { id: true, fileSize: true, checksum: true } },
        },
      },
    },
  });

  if (!info) {
    return NextResponse.json(
      { error: "Firmware information not found for this passport" },
      { status: 404 },
    );
  }

  // Enrich with download URL + file size from Download record
  const enriched = {
    ...info,
    latestDownloadUrl: info.latestRelease?.download ? `/api/downloads/${info.latestRelease.download.id}/file` : null,
    latestFileSize: info.latestRelease?.download?.fileSize ?? info.latestFileSize,
    latestChecksum: info.latestRelease?.download?.checksum ?? info.latestChecksum,
  };

  return NextResponse.json(mapFirmwareInfoDTO(enriched));

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/dr-qbit/firmware/[passportId]/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
