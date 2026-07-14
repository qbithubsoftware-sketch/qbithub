/**
 * GET /api/dr-qbit/passports/search — search passports by various fields
 *
 * Query params: q (general search), serialNumber, model, hardwareId, vendorId, productIdCode
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import { mapPassportDTO } from "../route";

export async function GET(req: NextRequest) {
  try {

  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const serialNumber = url.searchParams.get("serialNumber");
  const model = url.searchParams.get("model");
  const hardwareId = url.searchParams.get("hardwareId");
  const vendorId = url.searchParams.get("vendorId");
  const productIdCode = url.searchParams.get("productIdCode");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { serialNumber: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { hardwareId: { contains: q, mode: "insensitive" } },
      { vendorId: { contains: q, mode: "insensitive" } },
      { productIdCode: { contains: q, mode: "insensitive" } },
      { deviceName: { contains: q, mode: "insensitive" } },
      { passportNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  if (serialNumber) where.serialNumber = { contains: serialNumber, mode: "insensitive" };
  if (model) where.model = { contains: model, mode: "insensitive" };
  if (hardwareId) where.hardwareId = { contains: hardwareId, mode: "insensitive" };
  if (vendorId) where.vendorId = { contains: vendorId.toUpperCase(), mode: "insensitive" };
  if (productIdCode) where.productIdCode = { contains: productIdCode.toUpperCase(), mode: "insensitive" };

  const passports = await db.devicePassport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      product: true,
      driverInfo: true,
      warranty: true,
      driverHistory: { orderBy: { occurredAt: "desc" }, take: 5 },
    },
  });

  return NextResponse.json({
    items: passports.map((p) => mapPassportDTO(p as never)),
    total: passports.length,
  });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/dr-qbit/passports/search/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
