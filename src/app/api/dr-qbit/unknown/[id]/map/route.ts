/**
 * POST /api/dr-qbit/unknown/[id]/map — admin maps an unknown device to a product
 *
 * Body: { productId: string, createSignature?: boolean (default true) }
 *
 * Side effects:
 *   1. Updates UnknownDevice.mappedProductId + mappedAt + mappedBy
 *   2. Creates a HardwareSignature so future scans auto-match
 *   3. (Optional) creates a DetectedDevice from the unknown device
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.productId) {
    return NextResponse.json({ error: "Missing 'productId' field" }, { status: 400 });
  }

  const unknown = await db.unknownDevice.findUnique({ where: { id } });
  if (!unknown) {
    return NextResponse.json({ error: "Unknown device not found" }, { status: 404 });
  }

  const product = await db.qbitProduct.findUnique({ where: { id: body.productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Update the unknown device with the mapping
  await db.unknownDevice.update({
    where: { id },
    data: {
      mappedProductId: body.productId,
      mappedAt: new Date(),
      mappedBy: session.user.id,
      mappedByName: session.user.name ?? "Admin",
    },
  });

  // Create a HardwareSignature so future scans auto-match (unless opted out)
  if (body.createSignature !== false) {
    const macPrefix = unknown.macAddress
      ? unknown.macAddress.split(":").slice(0, 3).join(":").toUpperCase()
      : null;

    // Check if a signature with the same VID+PID already exists
    const existingSig = await db.hardwareSignature.findFirst({
      where: {
        productId: body.productId,
        vendorId: unknown.vendorId ?? undefined,
        productIdCode: unknown.productIdCode ?? undefined,
      },
    });

    if (!existingSig) {
      await db.hardwareSignature.create({
        data: {
          productId: body.productId,
          vendorId: unknown.vendorId,
          productIdCode: unknown.productIdCode,
          hardwareId: unknown.hardwareId,
          manufacturer: unknown.manufacturer,
          model: unknown.model,
          macPrefix,
          connectionType: unknown.connectionType,
          notes: `Auto-created from unknown device mapping by ${session.user.name ?? "admin"} on ${new Date().toISOString()}`,
        },
      });
    }
  }

  return NextResponse.json({
    mapped: true,
    unknownDeviceId: id,
    productId: body.productId,
    productName: product.name,
    signatureCreated: body.createSignature !== false,
  });
}
