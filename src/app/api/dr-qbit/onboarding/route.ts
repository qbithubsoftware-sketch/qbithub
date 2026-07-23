/**
 * POST /api/dr-qbit/onboarding — 7-step new device onboarding
 * GET  /api/dr-qbit/onboarding — get onboarding status/preview
 *
 * Admin follows 7 steps to add a new QBIT hardware product:
 *   Step 1: Create Product
 *   Step 2: Upload Drivers
 *   Step 3: Upload Firmware
 *   Step 4: Upload Manuals
 *   Step 5: Upload SDK (optional)
 *   Step 6: Create Device Profile (auto-assign category defaults)
 *   Step 7: Assign Capability Profile
 *
 * After onboarding, Dr. QBIT automatically supports the device.
 * NO core engine code changes required.
 *
 * If the device uses a NEW communication protocol, admin also provides
 * a new adapter definition — the engine handles it automatically.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/notifications/auth";
import { onboardNewDevice } from "@/lib/drqbit/device-architecture";

export async function GET(req: NextRequest) {
  // Preview: what categories, capabilities, connection types, and adapters are available
  // This helps admin plan the onboarding before submitting
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { db } = await import("@/lib/db");

  const categories = await db.deviceCategory.findMany({
    where: { isActive: true },
    orderBy: { sortIndex: "asc" },
    select: { id: true, slug: true, name: true, icon: true, productFamily: true },
  });

  const capabilities = await db.capabilityDefinition.findMany({
    where: { isActive: true, isQbitRelevant: true },
    orderBy: [{ capabilityGroup: "asc" }, { sortIndex: "asc" }],
    select: { id: true, slug: true, name: true, icon: true, capabilityGroup: true },
  });

  const connectionTypes = await db.connectionTypeDefinition.findMany({
    where: { isActive: true },
    orderBy: { sortIndex: "asc" },
    select: { id: true, slug: true, name: true, icon: true, supportsDiscovery: true },
  });

  const adapters = await db.communicationAdapterDefinition.findMany({
    where: { isActive: true },
    orderBy: { sortIndex: "asc" },
    select: { id: true, slug: true, name: true, adapterClass: true, protocol: true },
  });

  return NextResponse.json({
    message: "Onboarding preview — use these definitions to plan your new device onboarding",
    availableCategories: categories,
    availableCapabilities: capabilities,
    availableConnectionTypes: connectionTypes,
    availableAdapters: adapters,
    steps: [
      "Step 1: Create Product (name, brand, model, category)",
      "Step 2: Upload Drivers (provide driver resource IDs)",
      "Step 3: Upload Firmware (provide firmware resource IDs)",
      "Step 4: Upload Manuals (provide manual resource IDs)",
      "Step 5: Upload SDK (optional — provide SDK resource IDs)",
      "Step 6: Create Device Profile (auto-assigned from category defaults)",
      "Step 7: Assign Capability Profile (override defaults if needed)",
      "Optional: Create new Communication Adapter (if new protocol)",
      "Optional: Add Hardware Signatures (VID/PID for auto-detection)",
    ],
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

  // Required fields for Step 1
  if (!body.name || !body.model || !body.categorySlug || !body.deviceType) {
    return NextResponse.json(
      { error: "Missing required fields: name, model, categorySlug, deviceType" },
      { status: 400 },
    );
  }

  // Generate slug from model if not provided
  const slug = body.slug || body.model.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const result = await onboardNewDevice({
    name: body.name,
    brand: body.brand || "QBIT",
    model: body.model,
    slug,
    categorySlug: body.categorySlug,
    deviceType: body.deviceType,
    sku: body.sku,
    description: body.description,
    driverResourceIds: body.driverResourceIds || [],
    firmwareResourceIds: body.firmwareResourceIds || [],
    manualResourceIds: body.manualResourceIds || [],
    sdkResourceIds: body.sdkResourceIds || [],
    capabilitySlugs: body.capabilitySlugs,
    connectionTypeSlugs: body.connectionTypeSlugs,
    newAdapterSlug: body.newAdapterSlug,
    newAdapterName: body.newAdapterName,
    newAdapterClass: body.newAdapterClass,
    newAdapterProtocol: body.newAdapterProtocol,
    hardwareSignatures: body.hardwareSignatures,
  });

  if (result.success) {
    return NextResponse.json({
      result,
      message: `Product "${body.name}" onboarded successfully. Dr. QBIT now supports this device. ${result.summary}`,
    }, { status: 201 });
  } else {
    return NextResponse.json({
      result,
      error: "Onboarding failed. Check the errors array for details.",
    }, { status: 400 });
  }
}
