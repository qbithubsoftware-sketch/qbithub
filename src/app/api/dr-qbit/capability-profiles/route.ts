/**
 * GET  /api/dr-qbit/capability-profiles — list all capability definitions
 * POST /api/dr-qbit/capability-profiles — create a new capability definition (admin only)
 *
 * Capability Definitions are the master list of all possible device capabilities.
 * Database-driven — NEVER hardcoded. Admin can add new capabilities via API.
 * When a new hardware type needs new capabilities (e.g. "rfid_read_write"),
 * admin creates a CapabilityDefinition and links it to products.
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
  const capabilityGroup = url.searchParams.get("capabilityGroup");
  const qbitRelevantOnly = url.searchParams.get("qbitRelevant") !== "false";
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  const where: Record<string, unknown> = {};
  if (!includeInactive) where.isActive = true;
  if (qbitRelevantOnly) where.isQbitRelevant = true;
  if (capabilityGroup) where.capabilityGroup = capabilityGroup;

  const capabilities = await db.capabilityDefinition.findMany({
    where,
    orderBy: [{ capabilityGroup: "asc" }, { sortIndex: "asc" }],
    include: {
      _count: {
        select: {
          productCapabilities: true,
          categoryCapabilities: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: capabilities.map((cap) => ({
      id: cap.id,
      slug: cap.slug,
      name: cap.name,
      description: cap.description,
      icon: cap.icon,
      capabilityGroup: cap.capabilityGroup,
      isQbitRelevant: cap.isQbitRelevant,
      affectsDiscovery: cap.affectsDiscovery,
      affectsConfiguration: cap.affectsConfiguration,
      affectsDiagnostics: cap.affectsDiagnostics,
      affectsLifecycle: cap.affectsLifecycle,
      sortIndex: cap.sortIndex,
      isActive: cap.isActive,
      productCount: cap._count.productCapabilities,
      categoryCount: cap._count.categoryCapabilities,
    })),
    total: capabilities.length,
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
  const existing = await db.capabilityDefinition.findFirst({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json(
      { error: `Capability with slug "${body.slug}" already exists` },
      { status: 409 },
    );
  }

  const existingName = await db.capabilityDefinition.findFirst({ where: { name: body.name } });
  if (existingName) {
    return NextResponse.json(
      { error: `Capability with name "${body.name}" already exists` },
      { status: 409 },
    );
  }

  const capability = await db.capabilityDefinition.create({
    data: {
      slug: body.slug,
      name: body.name,
      description: body.description ?? null,
      icon: body.icon ?? null,
      capabilityGroup: body.capabilityGroup ?? null,
      isQbitRelevant: body.isQbitRelevant ?? true,
      affectsDiscovery: body.affectsDiscovery ?? false,
      affectsConfiguration: body.affectsConfiguration ?? false,
      affectsDiagnostics: body.affectsDiagnostics ?? false,
      affectsLifecycle: body.affectsLifecycle ?? false,
      sortIndex: body.sortIndex ?? 0,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json({
    capability: {
      id: capability.id,
      slug: capability.slug,
      name: capability.name,
    },
    message: `Capability "${capability.name}" created. Link it to products via ProductCapability or to categories via CategoryCapability.`,
  }, { status: 201 });
}
