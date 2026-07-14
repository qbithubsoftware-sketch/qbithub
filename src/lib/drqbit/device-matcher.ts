/**
 * Device matcher — compares detected devices against the Product Library
 * (QbitProduct + HardwareSignature tables) to identify known hardware.
 *
 * Matching priority (highest to lowest confidence):
 *   1. VID + PID exact match (confidence: 1.0)
 *   2. MAC address prefix (OUI) match (confidence: 0.9)
 *   3. Hardware ID exact match (confidence: 0.95)
 *   4. Manufacturer + Model match (confidence: 0.8)
 *   5. Model-only match (confidence: 0.6)
 *
 * If no match: device is "unknown" and gets an UnknownDevice row for admin mapping.
 */

import { db } from "@/lib/db";
import type { RawDetectedDevice } from "./types";

export interface MatchResult {
  matchedProductId: string | null;
  matchedProductName: string | null;
  matchedProductModel: string | null;
  matchedProductType: string | null;
  matchConfidence: number | null;
  matchMethod: string | null;
  isUnknown: boolean;
}

/**
 * Attempts to match a raw detected device against the Product Library.
 * Returns null if no match found (device is "unknown").
 */
export async function matchDevice(raw: RawDetectedDevice): Promise<MatchResult> {
  // 1. VID + PID match
  if (raw.vendorId && raw.productIdCode) {
    const sig = await db.hardwareSignature.findFirst({
      where: {
        vendorId: raw.vendorId.toUpperCase(),
        productIdCode: raw.productIdCode.toUpperCase(),
      },
      include: { product: true },
    });
    if (sig?.product && sig.product.isActive) {
      return {
        matchedProductId: sig.product.id,
        matchedProductName: sig.product.name,
        matchedProductModel: sig.product.model,
        matchedProductType: sig.product.deviceType,
        matchConfidence: 1.0,
        matchMethod: "vid_pid",
        isUnknown: false,
      };
    }
  }

  // 2. Hardware ID match
  if (raw.hardwareId) {
    const sig = await db.hardwareSignature.findFirst({
      where: { hardwareId: raw.hardwareId },
      include: { product: true },
    });
    if (sig?.product && sig.product.isActive) {
      return {
        matchedProductId: sig.product.id,
        matchedProductName: sig.product.name,
        matchedProductModel: sig.product.model,
        matchedProductType: sig.product.deviceType,
        matchConfidence: 0.95,
        matchMethod: "hardware_id",
        isUnknown: false,
      };
    }
  }

  // 3. MAC address prefix (OUI) match
  if (raw.macAddress) {
    const macPrefix = raw.macAddress
      .split(":")
      .slice(0, 3)
      .join(":")
      .toUpperCase();
    const sig = await db.hardwareSignature.findFirst({
      where: { macPrefix },
      include: { product: true },
    });
    if (sig?.product && sig.product.isActive) {
      return {
        matchedProductId: sig.product.id,
        matchedProductName: sig.product.name,
        matchedProductModel: sig.product.model,
        matchedProductType: sig.product.deviceType,
        matchConfidence: 0.9,
        matchMethod: "mac_prefix",
        isUnknown: false,
      };
    }
  }

  // 4. Manufacturer + Model match
  if (raw.manufacturer && raw.model) {
    const product = await db.qbitProduct.findFirst({
      where: {
        manufacturer: { contains: raw.manufacturer },
        model: { contains: raw.model },
        isActive: true,
      },
    });
    if (product) {
      return {
        matchedProductId: product.id,
        matchedProductName: product.name,
        matchedProductModel: product.model,
        matchedProductType: product.deviceType,
        matchConfidence: 0.8,
        matchMethod: "manufacturer_model",
        isUnknown: false,
      };
    }
  }

  // 5. Model-only match
  if (raw.model) {
    const product = await db.qbitProduct.findFirst({
      where: {
        model: { contains: raw.model },
        isActive: true,
      },
    });
    if (product) {
      return {
        matchedProductId: product.id,
        matchedProductName: product.name,
        matchedProductModel: product.model,
        matchedProductType: product.deviceType,
        matchConfidence: 0.6,
        matchMethod: "model",
        isUnknown: false,
      };
    }
  }

  // No match — unknown device
  return {
    matchedProductId: null,
    matchedProductName: null,
    matchedProductModel: null,
    matchedProductType: null,
    matchConfidence: null,
    matchMethod: null,
    isUnknown: true,
  };
}

/**
 * Finds the closest supported product for an unknown device.
 * Used by the admin DeviceMapper UI to suggest mappings.
 */
export async function suggestClosestProducts(
  raw: Pick<RawDetectedDevice, "manufacturer" | "model" | "vendorId" | "deviceName">,
  limit = 5,
): Promise<Array<{
  id: string;
  name: string;
  model: string;
  brand: string;
  deviceType: string;
  confidence: number;
}>> {
  const suggestions: Array<{ id: string; name: string; model: string; brand: string; deviceType: string; confidence: number }> = [];

  // Try by partial model match
  if (raw.model) {
    const products = await db.qbitProduct.findMany({
      where: {
        OR: [
          { model: { contains: raw.model } },
          { name: { contains: raw.model } },
        ],
        isActive: true,
      },
      take: limit,
    });
    for (const p of products) {
      suggestions.push({
        id: p.id,
        name: p.name,
        model: p.model,
        brand: p.brand,
        deviceType: p.deviceType,
        confidence: 0.6,
      });
    }
  }

  // Try by manufacturer
  if (raw.manufacturer && suggestions.length < limit) {
    const products = await db.qbitProduct.findMany({
      where: {
        manufacturer: { contains: raw.manufacturer },
        isActive: true,
      },
      take: limit - suggestions.length,
    });
    for (const p of products) {
      if (!suggestions.find((s) => s.id === p.id)) {
        suggestions.push({
          id: p.id,
          name: p.name,
          model: p.model,
          brand: p.brand,
          deviceType: p.deviceType,
          confidence: 0.4,
        });
      }
    }
  }

  // If still nothing, return all active products
  if (suggestions.length === 0) {
    const products = await db.qbitProduct.findMany({
      where: { isActive: true },
      take: limit,
    });
    for (const p of products) {
      suggestions.push({
        id: p.id,
        name: p.name,
        model: p.model,
        brand: p.brand,
        deviceType: p.deviceType,
        confidence: 0.2,
      });
    }
  }

  return suggestions.slice(0, limit);
}
