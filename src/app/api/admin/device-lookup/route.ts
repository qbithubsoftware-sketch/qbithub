/**
 * GET /api/admin/device-lookup?serialNumber=XYZ
 *
 * Searches the Device Registry (PurchaseRecord + FSMCustomerAsset) by serial
 * number and returns ALL linked information in a single response:
 *   - Device info (product name, model, brand, category, image, status)
 *   - Customer info (name, company, mobile, email, GST, address)
 *   - Warranty (status, start, expiry, remaining days)
 *   - Driver downloads (from linked QbitProduct)
 *   - Documents (manual, brochure, datasheet, warranty PDF, etc.)
 *   - Installation resources (guide, video URLs, instructions, requirements)
 *   - Installation record (date, installed by, last service, AMC, firmware version)
 *   - QR code URL
 *
 * SECURITY: Super Admin or Administrator only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const serialNumber = url.searchParams.get("serialNumber")?.trim();

    if (!serialNumber) {
      return NextResponse.json({ error: "Serial number is required" }, { status: 400 });
    }

    // ===== Step 1: Search PurchaseRecord by serialNumber =====
    let purchase = await db.purchaseRecord.findFirst({
      where: {
        serialNumber: { equals: serialNumber, mode: "insensitive" },
      },
      include: {
        customer: true,
        product: {
          select: {
            id: true, name: true, slug: true, model: true, brand: true,
            category: true, deviceType: true, imageUrl: true, description: true,
            driverDownloadUrl: true, manualUrl: true, brochureUrl: true,
            datasheetUrl: true, warrantyUrl: true, sdkUrl: true, utilityUrl: true,
            installationGuideUrl: true, knowledgeBaseUrl: true,
            latestDriverVersion: true, latestFirmwareVersion: true,
            qrCodeUrl: true, status: true,
            installationInstructions: true, requiredSoftware: true,
            requiredDrivers: true, requiredAccessories: true,
            installationTime: true, difficultyLevel: true,
            mediaFiles: { orderBy: { sortIndex: "asc" } },
            specEntries: { orderBy: { sortIndex: "asc" } },
          },
        },
        invoices: true,
      },
    });

    // ===== Step 2: Fallback — search FSMCustomerAsset by serialNumber =====
    let asset = null;
    if (!purchase) {
      asset = await db.fSMCustomerAsset.findFirst({
        where: {
          serialNumber: { equals: serialNumber, mode: "insensitive" },
        },
        include: {
          customer: true,
        },
      });

      if (asset) {
        // Link to product by model
        const product = asset.model
          ? await db.qbitProduct.findFirst({
              where: { model: asset.model },
              select: {
                id: true, name: true, slug: true, model: true, brand: true,
                category: true, deviceType: true, imageUrl: true, description: true,
                driverDownloadUrl: true, manualUrl: true, brochureUrl: true,
                datasheetUrl: true, warrantyUrl: true, sdkUrl: true, utilityUrl: true,
                installationGuideUrl: true, knowledgeBaseUrl: true,
                latestDriverVersion: true, latestFirmwareVersion: true,
                qrCodeUrl: true, status: true,
                installationInstructions: true, requiredSoftware: true,
                requiredDrivers: true, requiredAccessories: true,
                installationTime: true, difficultyLevel: true,
                mediaFiles: { orderBy: { sortIndex: "asc" } },
                specEntries: { orderBy: { sortIndex: "asc" } },
              },
            })
          : null;

        return NextResponse.json({
          found: true,
          source: "fsm-asset",
          device: {
            productName: product?.name ?? asset.productName,
            modelNumber: asset.model,
            brand: product?.brand ?? null,
            category: product?.category ?? null,
            deviceType: product?.deviceType ?? null,
            productImage: product?.imageUrl ?? null,
            deviceStatus: asset.warrantyStatus ?? "unknown",
            serialNumber: asset.serialNumber,
            qrCode: asset.qrCode ?? product?.qrCodeUrl ?? null,
          },
          customer: {
            name: asset.customer.name,
            companyName: asset.customer.companyName ?? null,
            mobileNumber: asset.customer.phone,
            email: asset.customer.email ?? null,
            gstNumber: null,
            address: `${asset.customer.addressLine}, ${asset.customer.city ?? ""}, ${asset.customer.state ?? ""} ${asset.customer.postalCode ?? ""}`.trim(),
          },
          warranty: {
            status: asset.warrantyStatus ?? "unknown",
            startDate: asset.purchaseDate?.toISOString() ?? null,
            endDate: asset.warrantyExpiry?.toISOString() ?? null,
            remainingDays: asset.warrantyExpiry
              ? Math.max(0, Math.ceil((new Date(asset.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : null,
          },
          drivers: product ? {
            driverDownloadUrl: product.driverDownloadUrl,
            manualUrl: product.manualUrl,
            brochureUrl: product.brochureUrl,
            datasheetUrl: product.datasheetUrl,
            warrantyUrl: product.warrantyUrl,
            sdkUrl: product.sdkUrl,
            utilityUrl: product.utilityUrl,
            installationGuideUrl: product.installationGuideUrl,
            knowledgeBaseUrl: product.knowledgeBaseUrl,
            latestDriverVersion: product.latestDriverVersion,
            latestFirmwareVersion: product.latestFirmwareVersion,
            mediaFiles: product.mediaFiles,
          } : null,
          installation: {
            installationDate: null,
            installedBy: null,
            lastServiceDate: null,
            amcStatus: "none",
            firmwareVersion: asset.firmwareVersion ?? null,
            driverVersion: asset.driverVersion ?? null,
          },
          specifications: product?.specEntries ?? [],
        });
      }
    }

    // ===== Step 3: Not found =====
    if (!purchase) {
      return NextResponse.json({
        found: false,
        message: "No device found with this Serial Number.",
      });
    }

    // ===== Step 4: Build full response from PurchaseRecord =====
    const warrantyEndDate = purchase.warrantyEndDate;
    const remainingDays = warrantyEndDate
      ? Math.max(0, Math.ceil((new Date(warrantyEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;
    const warrantyStatus = !warrantyEndDate
      ? "unknown"
      : remainingDays === null
        ? "unknown"
        : remainingDays === 0
          ? "expired"
          : remainingDays <= 60
            ? "expiring_soon"
            : "active";

    return NextResponse.json({
      found: true,
      source: "purchase-record",
      device: {
        productName: purchase.productName,
        modelNumber: purchase.modelNumber,
        brand: purchase.brand ?? purchase.product?.brand ?? null,
        category: purchase.product?.category ?? null,
        deviceType: purchase.product?.deviceType ?? null,
        productImage: purchase.product?.imageUrl ?? null,
        deviceStatus: purchase.installationStatus,
        serialNumber: purchase.serialNumber,
        qrCode: purchase.product?.qrCodeUrl ?? null,
      },
      customer: {
        name: purchase.customer.name,
        companyName: purchase.customer.companyName ?? null,
        mobileNumber: purchase.customer.mobileNumber,
        email: purchase.customer.email ?? null,
        gstNumber: purchase.customer.gstNumber ?? null,
        address: [purchase.customer.billingAddress, purchase.customer.city, purchase.customer.state, purchase.customer.pinCode]
          .filter(Boolean)
          .join(", ") || null,
      },
      warranty: {
        status: warrantyStatus,
        startDate: purchase.warrantyStartDate?.toISOString() ?? null,
        endDate: warrantyEndDate?.toISOString() ?? null,
        remainingDays,
        period: purchase.warrantyPeriod,
      },
      drivers: purchase.product ? {
        driverDownloadUrl: purchase.product.driverDownloadUrl,
        manualUrl: purchase.product.manualUrl,
        brochureUrl: purchase.product.brochureUrl,
        datasheetUrl: purchase.product.datasheetUrl,
        warrantyUrl: purchase.product.warrantyUrl,
        sdkUrl: purchase.product.sdkUrl,
        utilityUrl: purchase.product.utilityUrl,
        installationGuideUrl: purchase.product.installationGuideUrl,
        knowledgeBaseUrl: purchase.product.knowledgeBaseUrl,
        latestDriverVersion: purchase.product.latestDriverVersion,
        latestFirmwareVersion: purchase.product.latestFirmwareVersion,
        mediaFiles: purchase.product.mediaFiles,
      } : null,
      installation: {
        installationDate: purchase.purchaseDate?.toISOString() ?? null,
        installedBy: purchase.assignedEngineerId ?? null,
        lastServiceDate: null,
        amcStatus: purchase.amcStatus,
        firmwareVersion: purchase.product?.latestFirmwareVersion ?? null,
        driverVersion: purchase.product?.latestDriverVersion ?? null,
      },
      installationResources: purchase.product ? {
        instructions: purchase.product.installationInstructions,
        requiredSoftware: purchase.product.requiredSoftware,
        requiredDrivers: purchase.product.requiredDrivers,
        requiredAccessories: purchase.product.requiredAccessories,
        installationTime: purchase.product.installationTime,
        difficultyLevel: purchase.product.difficultyLevel,
      } : null,
      specifications: purchase.product?.specEntries ?? [],
      purchase: {
        purchaseId: purchase.purchaseId,
        invoiceNumber: purchase.invoiceNumber,
        purchaseDate: purchase.purchaseDate?.toISOString() ?? null,
        dealerName: purchase.dealerName,
        totalAmount: purchase.totalAmount,
      },
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/device-lookup:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
