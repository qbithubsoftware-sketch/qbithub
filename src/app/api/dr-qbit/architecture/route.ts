/**
 * GET /api/dr-qbit/architecture — resolve complete architecture for a product
 *
 * This is the primary endpoint that Dr. QBIT engines call to get
 * device architecture info (category, capabilities, connections, adapters).
 * All data is loaded from the database — no hardcoded definitions.
 *
 * Query params:
 *   - productId: resolve architecture for a specific product
 *   - categorySlug: resolve defaults for a category (for unmatched devices)
 *   - full: if "true", load all definitions (categories + capabilities + connections + adapters)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/notifications/auth";
import {
  loadDeviceCategories,
  loadCapabilityDefinitions,
  loadConnectionTypeDefinitions,
  loadCommunicationAdapters,
  resolveArchitectureForProduct,
  getCategoryDefaults,
  getApplicableAdaptersForCategory,
  loadKnownVendorIds,
  loadDeviceKeywordPatterns,
  loadDiscoveryConnectionTypes,
} from "@/lib/drqbit/device-architecture";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  const categorySlug = url.searchParams.get("categorySlug");
  const full = url.searchParams.get("full") === "true";
  const vendorIds = url.searchParams.get("vendorIds") === "true";
  const keywords = url.searchParams.get("keywords") === "true";
  const discoveryTypes = url.searchParams.get("discoveryTypes") === "true";

  // If requesting full architecture definitions
  if (full) {
    const [categories, capabilities, connectionTypes, adapters] = await Promise.all([
      loadDeviceCategories(),
      loadCapabilityDefinitions(),
      loadConnectionTypeDefinitions(),
      loadCommunicationAdapters(),
    ]);

    return NextResponse.json({
      categories,
      capabilities,
      connectionTypes,
      adapters,
      total: {
        categories: categories.length,
        capabilities: capabilities.length,
        connectionTypes: connectionTypes.length,
        adapters: adapters.length,
      },
    });
  }

  // If requesting vendor IDs for discovery
  if (vendorIds) {
    const vids = await loadKnownVendorIds();
    return NextResponse.json({ vendorIds: vids, total: vids.length });
  }

  // If requesting keyword patterns for discovery
  if (keywords) {
    const patterns = await loadDeviceKeywordPatterns();
    return NextResponse.json({ keywords: patterns, total: patterns.length });
  }

  // If requesting discovery-supported connection types
  if (discoveryTypes) {
    const types = await loadDiscoveryConnectionTypes();
    return NextResponse.json({ connectionTypes: types, total: types.length });
  }

  // If resolving architecture for a specific product
  if (productId) {
    const resolution = await resolveArchitectureForProduct(productId);
    return NextResponse.json({ resolution });
  }

  // If resolving defaults for a category
  if (categorySlug) {
    const defaults = await getCategoryDefaults(categorySlug);
    const adapters = await getApplicableAdaptersForCategory(categorySlug);
    return NextResponse.json({ defaults, adapters });
  }

  // Default: return summary of available definitions
  const categories = await loadDeviceCategories();
  return NextResponse.json({
    message: "Dr. QBIT Architecture Engine — use query params to resolve device architecture",
    availableCategories: categories.length,
    queryParams: {
      productId: "Resolve full architecture for a product",
      categorySlug: "Resolve defaults + adapters for a category",
      full: "true — Load all definitions (categories, capabilities, connections, adapters)",
      vendorIds: "true — Load known QBIT vendor IDs from DB",
      keywords: "true — Load device detection keyword patterns from DB",
      discoveryTypes: "true — Load connection types that support discovery scanning",
    },
  });
}
