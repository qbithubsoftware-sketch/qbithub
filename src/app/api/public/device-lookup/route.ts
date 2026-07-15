/**
 * GET /api/public/device-lookup?serialNumber=XYZ
 *
 * Public device lookup by serial number. Returns LIMITED information
 * (product info + downloads only — NO customer/warranty/purchase data).
 *
 * SECURITY: No auth required. Customer-specific fields are stripped.
 *   - Shows: product name, model, brand, image, device status, drivers,
 *     manuals, videos, installation guide, specs
 *   - Hides: customer name, mobile, email, GST, address, purchase date,
 *     invoice, warranty details, installation history, engineer name
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const serialNumber = url.searchParams.get("serialNumber")?.trim();

    if (!serialNumber) {
      return NextResponse.json({ error: "Serial number is required" }, { status: 400 });
    }

    // Search PurchaseRecord by serial number
    const purchase = await db.purchaseRecord.findFirst({
      where: {
        serialNumber: { equals: serialNumber, mode: "insensitive" },
      },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, model: true, brand: true,
            category: true, deviceType: true, imageUrl: true, description: true,
            driverDownloadUrl: true, manualUrl: true, brochureUrl: true,
            datasheetUrl: true, sdkUrl: true, utilityUrl: true,
            installationGuideUrl: true, knowledgeBaseUrl: true,
            latestDriverVersion: true, latestFirmwareVersion: true,
            qrCodeUrl: true,
            mediaFiles: { orderBy: { sortIndex: "asc" } },
          },
        },
      },
    });

    // Fallback: FSMCustomerAsset
    if (!purchase) {
      const asset = await db.fSMCustomerAsset.findFirst({
        where: { serialNumber: { equals: serialNumber, mode: "insensitive" } },
      });

      if (!asset) {
        return NextResponse.json({ found: false, message: "No device found with this Serial Number." });
      }

      const product = asset.model
        ? await db.qbitProduct.findFirst({
            where: { model: asset.model },
            select: {
              id: true, name: true, slug: true, model: true, brand: true,
              category: true, deviceType: true, imageUrl: true, description: true,
              driverDownloadUrl: true, manualUrl: true, brochureUrl: true,
              datasheetUrl: true, sdkUrl: true, utilityUrl: true,
              installationGuideUrl: true, knowledgeBaseUrl: true,
              latestDriverVersion: true, latestFirmwareVersion: true, qrCodeUrl: true,
              mediaFiles: true,
            },
          })
        : null;

      // SECURITY: Return ONLY public product info — no customer/warranty/purchase data
      return NextResponse.json({
        found: true,
        device: {
          productName: product?.name ?? asset.productName,
          modelNumber: asset.model,
          brand: product?.brand ?? null,
          category: product?.category ?? null,
          productImage: product?.imageUrl ?? null,
          deviceStatus: asset.warrantyStatus ?? "unknown",
          serialNumber: asset.serialNumber,
        },
        drivers: product ? {
          driverDownloadUrl: product.driverDownloadUrl,
          manualUrl: product.manualUrl,
          brochureUrl: product.brochureUrl,
          datasheetUrl: product.datasheetUrl,
          sdkUrl: product.sdkUrl,
          utilityUrl: product.utilityUrl,
          installationGuideUrl: product.installationGuideUrl,
          latestDriverVersion: product.latestDriverVersion,
          latestFirmwareVersion: product.latestFirmwareVersion,
          mediaFiles: product.mediaFiles,
        } : null,
        // SECURITY: customer, warranty, purchase, installation fields are NOT included
      });
    }

    // SECURITY: Return ONLY public product info from PurchaseRecord
    return NextResponse.json({
      found: true,
      device: {
        productName: purchase.productName,
        modelNumber: purchase.modelNumber,
        brand: purchase.brand ?? purchase.product?.brand ?? null,
        category: purchase.product?.category ?? null,
        productImage: purchase.product?.imageUrl ?? null,
        deviceStatus: purchase.installationStatus,
        serialNumber: purchase.serialNumber,
      },
      drivers: purchase.product ? {
        driverDownloadUrl: purchase.product.driverDownloadUrl,
        manualUrl: purchase.product.manualUrl,
        brochureUrl: purchase.product.brochureUrl,
        datasheetUrl: purchase.product.datasheetUrl,
        sdkUrl: purchase.product.sdkUrl,
        utilityUrl: purchase.product.utilityUrl,
        installationGuideUrl: purchase.product.installationGuideUrl,
        latestDriverVersion: purchase.product.latestDriverVersion,
        latestFirmwareVersion: purchase.product.latestFirmwareVersion,
        mediaFiles: purchase.product.mediaFiles,
      } : null,
      // SECURITY: customer, warranty, purchase, installation fields are NOT included
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/public/device-lookup:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
