/**
 * POST /api/dr-qbit/passports/generate — manually generate a passport from a detected device
 *
 * Body: { detectedDeviceId: string, productId?: string }
 *
 * Creates (or updates) a DevicePassport + DriverInformation + initial DriverHistory entry.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/notifications/auth";
import { generatePassport } from "@/lib/passport/generator";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.detectedDeviceId) {
    return NextResponse.json({ error: "Missing 'detectedDeviceId' field" }, { status: 400 });
  }

  try {
    const result = await generatePassport({
      detectedDeviceId: body.detectedDeviceId,
      productId: body.productId,
    });
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate passport";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
