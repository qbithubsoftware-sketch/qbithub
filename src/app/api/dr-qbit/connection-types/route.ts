/**
 * GET  /api/dr-qbit/connection-types — list all connection type definitions
 * POST /api/dr-qbit/connection-types — create a new connection type (admin only)
 *
 * Connection Type Definitions replace the hardcoded DeviceConnection union.
 * Admin can add new connection types (Serial, NFC, Zigbee, Virtual Port)
 * without code changes. The Discovery Engine reads these at runtime.
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
  const supportsDiscovery = url.searchParams.get("supportsDiscovery") === "true";
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  const where: Record<string, unknown> = {};
  if (!includeInactive) where.isActive = true;
  if (supportsDiscovery) where.supportsDiscovery = true;

  const connectionTypes = await db.connectionTypeDefinition.findMany({
    where,
    orderBy: { sortIndex: "asc" },
    include: {
      _count: {
        select: {
          productConnectionTypes: true,
          categoryConnectionTypes: true,
          adapterConnectionTypes: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: connectionTypes.map((ct) => ({
      id: ct.id,
      slug: ct.slug,
      name: ct.name,
      description: ct.description,
      icon: ct.icon,
      protocol: ct.protocol,
      supportsDiscovery: ct.supportsDiscovery,
      requiresDesktopAgent: ct.requiresDesktopAgent,
      supportsConfiguration: ct.supportsConfiguration,
      supportsDiagnostics: ct.supportsDiagnostics,
      sortIndex: ct.sortIndex,
      isActive: ct.isActive,
      productCount: ct._count.productConnectionTypes,
      categoryCount: ct._count.categoryConnectionTypes,
      adapterCount: ct._count.adapterConnectionTypes,
    })),
    total: connectionTypes.length,
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

  // Check uniqueness
  const existing = await db.connectionTypeDefinition.findFirst({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json(
      { error: `Connection type with slug "${body.slug}" already exists` },
      { status: 409 },
    );
  }

  const ct = await db.connectionTypeDefinition.create({
    data: {
      slug: body.slug,
      name: body.name,
      description: body.description ?? null,
      icon: body.icon ?? null,
      protocol: body.protocol ?? null,
      supportsDiscovery: body.supportsDiscovery ?? false,
      requiresDesktopAgent: body.requiresDesktopAgent ?? false,
      supportsConfiguration: body.supportsConfiguration ?? true,
      supportsDiagnostics: body.supportsDiagnostics ?? true,
      sortIndex: body.sortIndex ?? 0,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json({
    connectionType: {
      id: ct.id,
      slug: ct.slug,
      name: ct.name,
    },
    message: `Connection type "${ct.name}" created. The Discovery Engine will automatically include it if supportsDiscovery=true.`,
  }, { status: 201 });
}
