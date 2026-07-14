/**
 * POST /api/dr-qbit/firmware/[passportId]/check-compatibility
 *
 * Runs compatibility check for a specific firmware release on this device.
 * Returns CompatibilityResult with isCompatible + reasons + warnings.
 *
 * SAFETY: This is the gatekeeper. If blocked=true, firmware update is NOT allowed.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/notifications/auth";
import { checkCompatibility } from "@/lib/firmware/compatibility-checker";

interface Params {
  params: Promise<{ passportId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { passportId } = await params;

  const body = await req.json().catch(() => null);
  if (!body?.firmwareReleaseId) {
    return NextResponse.json(
      { error: "Missing 'firmwareReleaseId' field" },
      { status: 400 },
    );
  }

  const result = await checkCompatibility({
    passportId,
    firmwareReleaseId: body.firmwareReleaseId,
  });

  // Update FirmwareInformation with compatibility check result
  const info = await db.firmwareInformation.findUnique({ where: { passportId } });
  if (info) {
    await db.firmwareInformation.update({
      where: { passportId },
      data: {
        compatibilityChecked: true,
        isCompatible: result.isCompatible,
        compatibilityReason: result.blocked
          ? result.reasons.join("; ")
          : result.warnings.length > 0
            ? result.warnings.join("; ")
            : null,
        lastCheckedAt: new Date(),
      },
    });

    // If blocked, create a FirmwareHistory entry
    if (result.blocked) {
      await db.firmwareHistory.create({
        data: {
          passportId,
          eventType: "block",
          newVersion: body.firmwareReleaseId,
          performedBy: session.user.id,
          performedByName: session.user.name ?? "Engineer",
          notes: `Update blocked: ${result.reasons.join("; ")}`,
        },
      });
    }
  }

  return NextResponse.json(result);
}
