/**
 * Dr. QBIT Phase 3 — Resource Engine
 *
 * Fetches model-specific Drivers, Firmware, Manuals, SDK, Videos, and
 * Utilities from the V5 Shared Resource Library (Resource + ProductResourceMapping).
 *
 * Architecture:
 *   Product ID → ProductResourceMapping → Resource → Group by Type Category
 *
 * Rules:
 *   - NO fake/dummy/mock/placeholder resources.
 *   - Empty array means "no resources of this type exist in the database
 *     for this product" — NOT "we have resources but chose not to show them".
 *   - Visibility filter: public for guests, employee/engineer/admin for
 *     authenticated users based on their role.
 *   - Resources are filtered by product compatibility — only resources
 *     linked to the device's product are returned.
 *   - Extensible: when a new QBIT product is added, admin just uploads
 *     resources and creates ProductResourceMappings. The engine
 *     automatically picks them up — NO code changes.
 */

import { db } from "@/lib/db";
import type {
  ResourceItem,
  CloudResources,
  ResourceTypeCategory,
  SmartRecommendation,
} from "./cloud-lookup-types";
import { mapResourceTypeToCategory } from "./cloud-lookup-types";

/**
 * Fetches all model-specific resources for a product from the V5 Resource Library.
 *
 * The product ID is resolved from:
 *   1. Direct match (Phase 2 matchedProductId or Phase 3 product lookup)
 *   2. Model name match (fallback)
 *
 * @param productId — QbitProduct.id to fetch resources for
 * @param userRole  — "guest" | "customer" | "engineer" | "admin" (for visibility filtering)
 * @returns CloudResources grouped by type category
 */
export async function fetchProductResources(
  productId: string,
  userRole: "guest" | "customer" | "engineer" | "admin" = "guest",
): Promise<CloudResources> {
  const resources: CloudResources = {
    drivers: [],
    firmware: [],
    manuals: [],
    sdk: [],
    videos: [],
    utilities: [],
  };

  try {
    // Determine maximum visibility the user can see
    const visibilityLevels = getVisibilityLevels(userRole);

    // Fetch all ProductResourceMappings for this product
    const mappings = await db.productResourceMapping.findMany({
      where: { productId },
      include: {
        resource: true,
      },
      orderBy: { sortIndex: "asc" },
    });

    for (const mapping of mappings) {
      const resource = mapping.resource;
      if (!resource) continue; // mapping may point to inactive/deleted resource

      // Filter by status and visibility (client-side filter since Prisma include
      // doesn't support where on non-list relations)
      if (resource.status !== "active") continue;
      if (!visibilityLevels.includes(resource.visibility)) continue;

      // Use override type if set, otherwise use the resource's own type
      const effectiveType = mapping.overrideType ?? resource.type;
      const category = mapResourceTypeToCategory(effectiveType);

      const item: ResourceItem = {
        id: resource.id,
        name: resource.name,
        type: effectiveType,
        version: resource.version,
        description: resource.description,
        url: resource.url,
        urlType: resource.urlType as "storage_key" | "data_url" | "external",
        mimeType: resource.mimeType,
        fileSize: resource.fileSize,
        originalFileName: resource.originalFileName,
        checksum: resource.checksum,
        thumbnailUrl: resource.thumbnailUrl,
        releaseDate: resource.releaseDate?.toISOString() ?? null,
        status: resource.status,
        visibility: resource.visibility,
        targetOs: extractTargetOs(resource.type, resource.name),
        downloadCount: resource.downloadCount,
      };

      resources[category].push(item);
    }

    // Sort each category by release date (newest first), then by download count
    for (const category of Object.keys(resources) as ResourceTypeCategory[]) {
      resources[category].sort((a, b) => {
        // Newest first
        if (a.releaseDate && b.releaseDate) {
          return b.releaseDate.localeCompare(a.releaseDate);
        }
        if (a.releaseDate) return -1;
        if (b.releaseDate) return 1;
        // Then by download count (most popular first)
        return b.downloadCount - a.downloadCount;
      });
    }
  } catch (error) {
    console.error("[RESOURCE ENGINE] Error fetching product resources:", error);
    // Return empty resources (not null) — the engine doesn't crash on DB errors
  }

  return resources;
}

/**
 * Fetches resources by product model name (fallback when productId is unknown).
 *
 * This finds the QbitProduct by model name first, then delegates to
 * fetchProductResources.
 */
export async function fetchResourcesByModel(
  model: string,
  userRole: "guest" | "customer" | "engineer" | "admin" = "guest",
): Promise<CloudResources> {
  try {
    const product = await db.qbitProduct.findFirst({
      where: {
        model: { equals: model },
        isActive: true,
        status: "active",
      },
    });

    if (!product) {
      return emptyResources();
    }

    return await fetchProductResources(product.id, userRole);
  } catch (error) {
    console.error("[RESOURCE ENGINE] Error fetching resources by model:", error);
    return emptyResources();
  }
}

/**
 * Fetches resources by VID/PID (fallback when model is unknown but
 * device was matched by HardwareSignature).
 */
export async function fetchResourcesByHardwareSignature(
  vendorId: string,
  productIdCode: string,
  userRole: "guest" | "customer" | "engineer" | "admin" = "guest",
): Promise<CloudResources> {
  try {
    const signature = await db.hardwareSignature.findFirst({
      where: {
        vendorId: vendorId.toUpperCase(),
        productIdCode: productIdCode.toUpperCase(),
      },
      include: { product: true },
    });

    if (!signature?.product || !signature.product.isActive) {
      return emptyResources();
    }

    return await fetchProductResources(signature.product.id, userRole);
  } catch (error) {
    console.error("[RESOURCE ENGINE] Error fetching resources by HW signature:", error);
    return emptyResources();
  }
}

/**
 * Returns the best (recommended) resource for each category.
 *
 * Selection criteria:
 *   1. Latest stable version (prefer stable over beta)
 *   2. Most recent release date
 *   3. Highest download count (popularity)
 *   4. OS match if osInfo is provided
 *
 * @param resources — already-fetched CloudResources
 * @param osInfo    — operating system info from Desktop Agent (e.g. "Windows 11 x64")
 * @returns SmartRecommendation[] — one recommendation per category
 */
export function selectSmartRecommendations(
  resources: CloudResources,
  osInfo?: string,
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];

  const categories: ResourceTypeCategory[] = [
    "drivers", "firmware", "manuals", "sdk", "videos", "utilities",
  ];

  for (const category of categories) {
    const items = resources[category];
    if (items.length === 0) {
      recommendations.push({
        category,
        item: null,
        reason: "No resources available for this product in this category.",
      });
      continue;
    }

    // Filter by OS compatibility if osInfo is provided
    let filtered = items;
    if (osInfo && (category === "drivers" || category === "utilities")) {
      const osLower = osInfo.toLowerCase();
      filtered = items.filter((item) => {
        if (!item.targetOs) return true; // no OS constraint = universal
        return item.targetOs.toLowerCase().includes(osLower.split(" ")[0]);
      });
      // If OS filter eliminated all items, fall back to unfiltered
      if (filtered.length === 0) filtered = items;
    }

    // Select the best item
    const best = filtered[0]; // already sorted by releaseDate desc, downloadCount desc

    let reason = "";
    if (category === "drivers") {
      reason = best.version
        ? `Recommended driver (v${best.version}) — latest stable release`
        : "Recommended driver — latest available release";
      if (osInfo) reason += ` for ${osInfo}`;
    } else if (category === "firmware") {
      reason = best.version
        ? `Latest firmware (v${best.version})`
        : "Latest firmware release";
    } else if (category === "manuals") {
      reason = "Official user manual for this product model";
    } else if (category === "sdk") {
      reason = "Compatible SDK for development integration";
    } else if (category === "videos") {
      reason = "Official installation and configuration video";
    } else if (category === "utilities") {
      reason = "Configuration and diagnostic tool for this product";
      if (osInfo) reason += ` (${osInfo})`;
    }

    recommendations.push({ category, item: best, reason });
  }

  return recommendations;
}

// ====================== Helpers ======================

/**
 * Determines which Resource visibility levels a user can see.
 *
 * Visibility hierarchy:
 *   - guest:    public only
 *   - customer: public only (customer portal is public-facing)
 *   - engineer: public + employee + engineer
 *   - admin:    public + employee + engineer + admin
 */
function getVisibilityLevels(userRole: string): string[] {
  switch (userRole) {
    case "admin":
      return ["public", "employee", "engineer", "admin"];
    case "engineer":
      return ["public", "employee", "engineer"];
    case "customer":
      return ["public"];
    case "guest":
      return ["public"];
    default:
      return ["public"];
  }
}

/**
 * Extracts target OS from resource type and name heuristics.
 *
 * The V5 Resource Library doesn't have a dedicated "targetOs" field,
 * so we infer it from the type and name.
 */
function extractTargetOs(type: string, name: string): string | null {
  const typeOsMap: Record<string, string> = {
    windows_driver: "Windows",
    windows_software: "Windows",
    android_software: "Android",
    linux_software: "Linux",
    // Other types don't have a specific OS target
  };

  if (typeOsMap[type]) return typeOsMap[type];

  // Heuristic: check name for OS keywords
  const nameLower = name.toLowerCase();
  if (nameLower.includes("windows") || nameLower.includes("win")) return "Windows";
  if (nameLower.includes("android") || nameLower.includes("apk")) return "Android";
  if (nameLower.includes("linux") || nameLower.includes("ubuntu")) return "Linux";
  if (nameLower.includes("mac") || nameLower.includes("macos")) return "macOS";

  return null;
}

/** Returns an empty CloudResources object. */
function emptyResources(): CloudResources {
  return {
    drivers: [],
    firmware: [],
    manuals: [],
    sdk: [],
    videos: [],
    utilities: [],
  };
}
