/**
 * GET /api/dr-qbit/firmware/[passportId]/history — firmware history for a passport
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/notifications/auth";
import type { FirmwareHistoryDTO, FirmwareEventType } from "@/lib/firmware/types";

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

  const history = await db.firmwareHistory.findMany({
    where: { passportId },
    orderBy: { occurredAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    items: history.map((h) => ({
      id: h.id,
      eventType: h.eventType as FirmwareEventType,
      oldVersion: h.oldVersion,
      newVersion: h.newVersion,
      performedByName: h.performedByName,
      updateMethod: h.updateMethod,
      notes: h.notes,
      occurredAt: h.occurredAt.toISOString(),
    })) satisfies FirmwareHistoryDTO[],
    total: history.length,
  });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/dr-qbit/firmware/[passportId]/history/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
