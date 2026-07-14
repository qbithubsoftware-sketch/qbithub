/**
 * GET    /api/admin/products/[id] — fetch single product
 * PUT    /api/admin/products/[id] — update product
 * DELETE /api/admin/products/[id] — delete product (soft delete: isActive=false)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";
import { sanitizeText } from "@/lib/security/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const { id } = await params;
    const product = await db.qbitProduct.findUnique({
      where: { id },
      include: { _count: { select: { hardwareSignatures: true, detectedDevices: true, devicePassports: true } } },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const existing = await db.qbitProduct.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Check model uniqueness if changing
    if (body.model && body.model !== existing.model) {
      const dup = await db.qbitProduct.findUnique({ where: { model: body.model } });
      if (dup) return NextResponse.json({ error: `Model "${body.model}" already exists` }, { status: 409 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = sanitizeText(body.name, 200);
    if (body.brand !== undefined) updateData.brand = sanitizeText(body.brand, 50);
    if (body.manufacturer !== undefined) updateData.manufacturer = body.manufacturer ? sanitizeText(body.manufacturer, 200) : null;
    if (body.model !== undefined) updateData.model = sanitizeText(body.model, 100);
    if (body.deviceType !== undefined) updateData.deviceType = sanitizeText(body.deviceType, 50);
    if (body.description !== undefined) updateData.description = body.description ? sanitizeText(body.description, 1000) : null;
    if (body.driverDownloadUrl !== undefined) updateData.driverDownloadUrl = body.driverDownloadUrl ?? null;
    if (body.manualUrl !== undefined) updateData.manualUrl = body.manualUrl ?? null;
    if (body.installationGuideUrl !== undefined) updateData.installationGuideUrl = body.installationGuideUrl ?? null;
    if (body.knowledgeBaseUrl !== undefined) updateData.knowledgeBaseUrl = body.knowledgeBaseUrl ?? null;
    if (body.isActive !== undefined) updateData.isActive = !!body.isActive;

    const updated = await db.qbitProduct.update({ where: { id }, data: updateData });
    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("[API ERROR] PUT /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const { id } = await params;
    const existing = await db.qbitProduct.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Soft delete: set isActive=false
    await db.qbitProduct.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ id, deleted: true, message: "Product deactivated (soft delete)" });
  } catch (error) {
    console.error("[API ERROR] DELETE /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
