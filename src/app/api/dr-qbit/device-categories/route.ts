/**
 * GET  /api/dr-qbit/device-categories — list all device categories
 * POST /api/dr-qbit/device-categories — create a new device category (admin only)
 *
 * Device Categories are the formal taxonomy for product categorization.
 * Admin can add new categories (e.g. "RFID Device", "NFC Reader") without
 * code changes. Dr. QBIT reads categories from DB at runtime.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/notifications/auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const productFamily = url.searchParams.get("productFamily");
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  const where: Record<string, unknown> = {};
  if (!includeInactive) where.isActive = true;
  if (productFamily) where.productFamily = productFamily;

  const categories = await db.deviceCategory.findMany({
    where,
    orderBy: { sortIndex: "asc" },
    include: {
      _count: {
        select: {
          products: true,
          categoryCapabilities: true,
          categoryConnectionTypes: true,
          categoryAdapters: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      productFamily: cat.productFamily,
      supportedInterfaces: cat.supportedInterfaces ? JSON.parse(cat.supportedInterfaces) : [],
      defaultProtocol: cat.defaultProtocol,
      supportedOS: cat.supportedOS ? JSON.parse(cat.supportedOS) : [],
      sortIndex: cat.sortIndex,
      isActive: cat.isActive,
      isPublic: cat.isPublic,
      status: cat.status,
      productCount: cat._count.products,
      capabilityCount: cat._count.categoryCapabilities,
      connectionTypeCount: cat._count.categoryConnectionTypes,
      adapterCount: cat._count.categoryAdapters,
    })),
    total: categories.length,
  });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.slug || !body.name) {
    return NextResponse.json(
      { error: "Missing required fields: slug, name" },
      { status: 400 },
    );
  }

  // Check slug uniqueness
  const existing = await db.deviceCategory.findFirst({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json(
      { error: `Category with slug "${body.slug}" already exists` },
      { status: 409 },
    );
  }

  // Check name uniqueness
  const existingName = await db.deviceCategory.findFirst({ where: { name: body.name } });
  if (existingName) {
    return NextResponse.json(
      { error: `Category with name "${body.name}" already exists` },
      { status: 409 },
    );
  }

  const category = await db.deviceCategory.create({
    data: {
      slug: body.slug,
      name: body.name,
      description: body.description ?? null,
      icon: body.icon ?? null,
      productFamily: body.productFamily ?? null,
      supportedInterfaces: body.supportedInterfaces ? JSON.stringify(body.supportedInterfaces) : null,
      defaultProtocol: body.defaultProtocol ?? null,
      supportedOS: body.supportedOS ? JSON.stringify(body.supportedOS) : null,
      sortIndex: body.sortIndex ?? 0,
      isActive: body.isActive ?? true,
      isPublic: body.isPublic ?? true,
      status: body.status ?? "active",
    },
  });

  // Auto-link capabilities if provided
  if (body.defaultCapabilitySlugs && body.defaultCapabilitySlugs.length > 0) {
    for (const slug of body.defaultCapabilitySlugs) {
      const cap = await db.capabilityDefinition.findUnique({ where: { slug } });
      if (cap) {
        await db.categoryCapability.create({
          data: {
            categoryId: category.id,
            capabilityId: cap.id,
            isDefault: true,
            sortIndex: cap.sortIndex,
          },
        });
      }
    }
  }

  // Auto-link connection types if provided
  if (body.defaultConnectionTypeSlugs && body.defaultConnectionTypeSlugs.length > 0) {
    for (const slug of body.defaultConnectionTypeSlugs) {
      const ct = await db.connectionTypeDefinition.findUnique({ where: { slug } });
      if (ct) {
        await db.categoryConnectionType.create({
          data: {
            categoryId: category.id,
            connectionTypeId: ct.id,
            isDefault: true,
            sortIndex: ct.sortIndex,
          },
        });
      }
    }
  }

  // Auto-link adapters if provided
  if (body.adapterSlugs && body.adapterSlugs.length > 0) {
    for (const slug of body.adapterSlugs) {
      const adapter = await db.communicationAdapterDefinition.findUnique({ where: { slug } });
      if (adapter) {
        await db.categoryAdapterMapping.create({
          data: {
            categoryId: category.id,
            adapterId: adapter.id,
            isPrimary: slug === body.primaryAdapterSlug,
            sortIndex: adapter.sortIndex,
          },
        });
      }
    }
  }

  return NextResponse.json({
    category: {
      id: category.id,
      slug: category.slug,
      name: category.name,
    },
    message: `Device category "${category.name}" created successfully. Dr. QBIT will automatically support devices in this category.`,
  }, { status: 201 });
}
