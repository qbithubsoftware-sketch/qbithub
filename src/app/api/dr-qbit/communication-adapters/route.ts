/**
 * GET  /api/dr-qbit/communication-adapters — list all adapter definitions
 * POST /api/dr-qbit/communication-adapters — create a new adapter definition (admin only)
 *
 * Communication Adapter Definitions are the formal registry for protocol handling.
 * Each adapter handles a specific device category's communication protocol.
 * The Configuration Engine and Diagnostic Engine use adapters at runtime.
 * New adapters can be registered without core engine changes.
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
  const protocol = url.searchParams.get("protocol");
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  const where: Record<string, unknown> = {};
  if (!includeInactive) where.isActive = true;
  if (protocol) where.protocol = protocol;

  const adapters = await db.communicationAdapterDefinition.findMany({
    where,
    orderBy: { sortIndex: "asc" },
    include: {
      categoryAdapters: { include: { category: true } },
      adapterConnectionTypes: { include: { connectionType: true } },
    },
  });

  return NextResponse.json({
    items: adapters.map((adapter) => ({
      id: adapter.id,
      slug: adapter.slug,
      name: adapter.name,
      description: adapter.description,
      adapterClass: adapter.adapterClass,
      protocol: adapter.protocol,
      requiresDesktopAgent: adapter.requiresDesktopAgent,
      supportsLiveDiagnostics: adapter.supportsLiveDiagnostics,
      supportsConfiguration: adapter.supportsConfiguration,
      supportsFirmwareOps: adapter.supportsFirmwareOps,
      isActive: adapter.isActive,
      sortIndex: adapter.sortIndex,
      applicableCategories: adapter.categoryAdapters.map((ca) => ({
        categoryId: ca.categoryId,
        slug: ca.category.slug,
        name: ca.category.name,
        isPrimary: ca.isPrimary,
      })),
      applicableConnectionTypes: adapter.adapterConnectionTypes.map((act) => ({
        connectionTypeId: act.connectionTypeId,
        slug: act.connectionType.slug,
        name: act.connectionType.name,
        supportsDiscovery: act.supportsDiscovery,
        supportsConfiguration: act.supportsConfiguration,
        supportsDiagnostics: act.supportsDiagnostics,
      })),
    })),
    total: adapters.length,
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

  if (!body.slug || !body.name || !body.adapterClass) {
    return NextResponse.json(
      { error: "Missing required fields: slug, name, adapterClass" },
      { status: 400 },
    );
  }

  // Check uniqueness
  const existing = await db.communicationAdapterDefinition.findFirst({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json(
      { error: `Adapter with slug "${body.slug}" already exists` },
      { status: 409 },
    );
  }

  const adapter = await db.communicationAdapterDefinition.create({
    data: {
      slug: body.slug,
      name: body.name,
      description: body.description ?? null,
      adapterClass: body.adapterClass,
      protocol: body.protocol ?? null,
      requiresDesktopAgent: body.requiresDesktopAgent ?? false,
      supportsLiveDiagnostics: body.supportsLiveDiagnostics ?? true,
      supportsConfiguration: body.supportsConfiguration ?? true,
      supportsFirmwareOps: body.supportsFirmwareOps ?? false,
      isActive: body.isActive ?? true,
      sortIndex: body.sortIndex ?? 0,
    },
  });

  // Auto-link to categories if provided
  if (body.categorySlugs && body.categorySlugs.length > 0) {
    for (const slug of body.categorySlugs) {
      const category = await db.deviceCategory.findUnique({ where: { slug } });
      if (category) {
        await db.categoryAdapterMapping.create({
          data: {
            categoryId: category.id,
            adapterId: adapter.id,
            isPrimary: slug === body.primaryCategorySlug,
            sortIndex: adapter.sortIndex,
          },
        });
      }
    }
  }

  // Auto-link to connection types if provided
  if (body.connectionTypeSlugs && body.connectionTypeSlugs.length > 0) {
    for (const slug of body.connectionTypeSlugs) {
      const ct = await db.connectionTypeDefinition.findUnique({ where: { slug } });
      if (ct) {
        await db.adapterConnectionType.create({
          data: {
            adapterId: adapter.id,
            connectionTypeId: ct.id,
            supportsDiscovery: ct.supportsDiscovery,
            supportsConfiguration: ct.supportsConfiguration,
            supportsDiagnostics: ct.supportsDiagnostics,
            sortIndex: ct.sortIndex,
          },
        });
      }
    }
  }

  return NextResponse.json({
    adapter: {
      id: adapter.id,
      slug: adapter.slug,
      name: adapter.name,
      adapterClass: adapter.adapterClass,
    },
    message: `Communication adapter "${adapter.name}" created. Dr. QBIT will use this adapter for devices in linked categories.`,
  }, { status: 201 });
}
