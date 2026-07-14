/**
 * GET /api/dr-qbit/passports/[id] — fetch a single passport by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import { mapPassportDTO } from "../route";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {

  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const passport = await db.devicePassport.findUnique({
    where: { id },
    include: {
      product: true,
      driverInfo: true,
      warranty: true,
      driverHistory: { orderBy: { occurredAt: "desc" }, take: 20 },
    },
  });

  if (!passport) {
    return NextResponse.json({ error: "Passport not found" }, { status: 404 });
  }

  return NextResponse.json(mapPassportDTO(passport as never));

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/dr-qbit/passports/[id]/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
