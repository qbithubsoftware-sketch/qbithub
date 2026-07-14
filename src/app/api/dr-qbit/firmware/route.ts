/**
 * GET /api/dr-qbit/firmware — list firmware information for all passports
 *
 * Query params:
 *   - firmwareStatus: healthy | update_available | unsupported | unknown
 *   - limit: number (default 50, max 200)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import type { FirmwareInfoDTO, FirmwareStatus } from "@/lib/firmware/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const firmwareStatus = url.searchParams.get("firmwareStatus");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);

  const where: Record<string, unknown> = {};
  if (firmwareStatus) where.firmwareStatus = firmwareStatus as FirmwareStatus;

  const infos = await db.firmwareInformation.findMany({
    where,
    orderBy: { lastCheckedAt: "desc" },
    take: limit,
    include: {
      passport: { include: { product: true } },
      latestRelease: { include: { firmware: true } },
    },
  });

  return NextResponse.json({
    items: infos.map(mapFirmwareInfoDTO),
    total: infos.length,
  });
}

export function mapFirmwareInfoDTO(i: {
  id: string;
  passportId: string;
  installedVersion: string | null;
  installedBuildNumber: string | null;
  installedFirmwareDate: Date | null;
  installedFirmwareVendor: string | null;
  installedCompatibility: string | null;
  latestReleaseId: string | null;
  latestVersion: string | null;
  latestReleaseDate: Date | null;
  latestDownloadUrl: string | null;
  latestFileSize: number | null;
  latestChecksum: string | null;
  latestReleaseNotes: string | null;
  firmwareStatus: string;
  compatibilityChecked: boolean;
  isCompatible: boolean;
  compatibilityReason: string | null;
  lastCheckedAt: Date;
  latestRelease?: {
    id: string;
    version: string;
    buildNumber: string | null;
    releaseDate: Date;
    isCritical: boolean;
    isStable: boolean;
    downloadId: string | null;
    download?: { storagePath: string; fileSize: number } | null;
  } | null;
}): FirmwareInfoDTO {
  return {
    id: i.id,
    passportId: i.passportId,
    installedVersion: i.installedVersion,
    installedBuildNumber: i.installedBuildNumber,
    installedFirmwareDate: i.installedFirmwareDate?.toISOString() ?? null,
    installedFirmwareVendor: i.installedFirmwareVendor,
    installedCompatibility: i.installedCompatibility,
    latestReleaseId: i.latestReleaseId,
    latestVersion: i.latestVersion,
    latestReleaseDate: i.latestReleaseDate?.toISOString() ?? null,
    latestDownloadUrl: i.latestDownloadUrl,
    latestFileSize: i.latestFileSize,
    latestChecksum: i.latestChecksum,
    latestReleaseNotes: i.latestReleaseNotes,
    latestIsCritical: i.latestRelease?.isCritical ?? false,
    latestIsStable: i.latestRelease?.isStable ?? true,
    firmwareStatus: i.firmwareStatus as FirmwareStatus,
    compatibilityChecked: i.compatibilityChecked,
    isCompatible: i.isCompatible,
    compatibilityReason: i.compatibilityReason,
    lastCheckedAt: i.lastCheckedAt.toISOString(),
  };
}
