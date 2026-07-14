/**
 * POST /api/fsm/location — record engineer GPS location
 *
 * Body: { geoLat, geoLng, accuracy?, heading?, speed?, batteryLevel?, workOrderId? }
 *
 * Called by the mobile app:
 *   - On status transition (engineer clicks "On The Way")
 *   - Periodically (every 5 min while in transit)
 *   - On manual refresh
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireEngineerOrAdmin } from "@/lib/notifications/auth";
import { sanitizeText } from "@/lib/security/validation";

export async function POST(req: NextRequest) {
  const session = await requireEngineerOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Engineer access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { geoLat, geoLng } = body;
  if (typeof geoLat !== "number" || typeof geoLng !== "number") {
    return NextResponse.json(
      { error: "geoLat and geoLng are required (must be numbers)" },
      { status: 400 },
    );
  }

  // Validate lat/lng ranges
  if (geoLat < -90 || geoLat > 90 || geoLng < -180 || geoLng > 180) {
    return NextResponse.json(
      { error: "Invalid coordinates — lat must be [-90, 90], lng must be [-180, 180]" },
      { status: 400 },
    );
  }

  const location = await db.engineerLocation.create({
    data: {
      engineerId: session.user.id,
      workOrderId: typeof body.workOrderId === "string" ? body.workOrderId : null,
      geoLat,
      geoLng,
      accuracy: typeof body.accuracy === "number" ? body.accuracy : null,
      heading: typeof body.heading === "number" ? body.heading : null,
      speed: typeof body.speed === "number" ? body.speed : null,
      batteryLevel: typeof body.batteryLevel === "number" ? body.batteryLevel : null,
      isOnline: true,
    },
  });

  return NextResponse.json({ location: { id: location.id, capturedAt: location.capturedAt.toISOString() } }, { status: 201 });
}

/**
 * GET /api/fsm/location — latest location for the current engineer
 */
export async function GET(req: NextRequest) {
  const session = await requireEngineerOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Engineer access required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const workOrderId = url.searchParams.get("workOrderId");

  const where: Record<string, unknown> = { engineerId: session.user.id };
  if (workOrderId) where.workOrderId = workOrderId;

  const latest = await db.engineerLocation.findFirst({
    where,
    orderBy: { capturedAt: "desc" },
    take: 1,
  });

  return NextResponse.json({
    location: latest
      ? {
          id: latest.id,
          geoLat: latest.geoLat,
          geoLng: latest.geoLng,
          accuracy: latest.accuracy,
          heading: latest.heading,
          speed: latest.speed,
          batteryLevel: latest.batteryLevel,
          capturedAt: latest.capturedAt.toISOString(),
        }
      : null,
  });
}
