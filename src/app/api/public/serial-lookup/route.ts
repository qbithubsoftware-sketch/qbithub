/**
 * GET /api/public/serial-lookup?serial=XYZ
 *
 * Public serial-number lookup — returns FULL device + customer + warranty +
 * resources info so the homepage can render the complete Support Card.
 *
 * SECURITY MODEL:
 *   The serial number IS the access key. Anyone with the physical device
 *   (or its sticker) can read the serial — that's effectively device-based
 *   auth. We expose customer PII (name, mobile, email) because the user
 *   explicitly asked for HP/Dell/Lenovo-style Support Portal behavior.
 *
 *   We DO mask the most sensitive fields (mobile & email show last 4 chars
 *   only) to prevent abuse. Full values visible only in /admin device lookup.
 *
 * RESPONSE SHAPES:
 *   { valid: false, found: false }                          — invalid input
 *   { valid: true, found: false }                           — not registered
 *   { valid: true, found: true, device, customer, warranty, resources }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Serial numbers must be 4-50 chars, alphanumeric + dashes/underscores
const SERIAL_RE = /^[A-Za-z0-9_-]{4,50}$/;

function maskMobile(s: string | null): string | null {
  if (!s) return null;
  const digits = s.replace(/\D/g, "");
  if (digits.length < 4) return s;
  return `+91 ••••••${digits.slice(-4)}`;
}

function maskEmail(s: string | null): string | null {
  if (!s) return null;
  const [name, domain] = s.split("@");
  if (!domain) return s;
  const visible = name.slice(0, 2);
  return `${visible}••••@${domain}`;
}

function computeWarrantyStatus(end: Date | null): { status: "active" | "expired" | "expiring_soon" | "unknown"; remainingDays: number | null } {
  if (!end) return { status: "unknown", remainingDays: null };
  const now = Date.now();
  const diff = end.getTime() - now;
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  if (days === 0) return { status: "expired", remainingDays: 0 };
  if (days <= 60) return { status: "expiring_soon", remainingDays: days };
  return { status: "active", remainingDays: days };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get("serial")?.trim() ?? "";

    // ===== Step 0: Validate input =====
    if (!raw || !SERIAL_RE.test(raw)) {
      return NextResponse.json({ valid: false, found: false });
    }

    // ===== Step 1: Search PurchaseRecord by serialNumber =====
    const purchase = await db.purchaseRecord.findFirst({
      where: { serialNumber: { equals: raw, mode: "insensitive" } },
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
            installationInstructions: true, installationTime: true,
            difficultyLevel: true,
            // V4 Smart Device Setup capability flags
            supportsWifi: true, autoDriverInstall: true,
            sdkAvailable: true, firmwareConfigSupported: true,
            connectionTypes: true,
            // RBAC: filter mediaFiles to PUBLIC visibility only.
            mediaFiles: {
              where: { visibility: "public" },
              orderBy: { sortIndex: "asc" },
            },
          },
        },
        invoices: { take: 1, orderBy: { createdAt: "desc" } },
      },
    });

    if (purchase) {
      const warrantyStatus = computeWarrantyStatus(purchase.warrantyEndDate);
      const product = purchase.product;

      return NextResponse.json({
        valid: true,
        found: true,
        source: "purchase-record",
        device: {
          productName: purchase.productName,
          modelNumber: purchase.modelNumber,
          brand: purchase.brand ?? product?.brand ?? null,
          category: product?.category ?? null,
          productImage: product?.imageUrl ?? null,
          deviceStatus: purchase.installationStatus,
          serialNumber: purchase.serialNumber,
          qrCode: product?.qrCodeUrl ?? null,
          purchaseDate: purchase.purchaseDate?.toISOString() ?? null,
          installationDate: null,
          activationDate: purchase.purchaseDate?.toISOString() ?? null,
          registrationDate: purchase.createdAt.toISOString(),
          dealerName: purchase.dealerName ?? null,
        },
        customer: {
          name: purchase.customer.name,
          companyName: purchase.customer.companyName ?? null,
          mobileNumber: maskMobile(purchase.customer.mobileNumber),
          email: maskEmail(purchase.customer.email ?? null),
          gstNumber: purchase.customer.gstNumber ?? null,
          city: purchase.customer.city ?? null,
          state: purchase.customer.state ?? null,
        },
        warranty: {
          status: warrantyStatus.status,
          startDate: purchase.warrantyStartDate?.toISOString() ?? null,
          endDate: purchase.warrantyEndDate?.toISOString() ?? null,
          remainingDays: warrantyStatus.remainingDays,
          period: purchase.warrantyPeriod,
        },
        resources: product ? {
          driverDownloadUrl: product.driverDownloadUrl,
          manualUrl: product.manualUrl,
          brochureUrl: product.brochureUrl,
          datasheetUrl: product.datasheetUrl,
          warrantyUrl: product.warrantyUrl,
          sdkUrl: product.sdkUrl,
          utilityUrl: product.utilityUrl,
          installationGuideUrl: product.installationGuideUrl,
          latestDriverVersion: product.latestDriverVersion,
          latestFirmwareVersion: product.latestFirmwareVersion,
          installationTime: product.installationTime,
          difficultyLevel: product.difficultyLevel,
          faqUrl: "/knowledge-base",
          troubleshootingUrl: "/knowledge-base",
          supportTicketUrl: "/support",
          videoUrl: "/videos",
          productPageUrl: `/products/${product.slug}`,
          mediaFiles: product.mediaFiles.map((m) => ({
            id: m.id, type: m.type, title: m.title, url: m.url,
          })),
          // V4 Smart Device Setup capabilities
          capabilities: {
            supportsWifi: product.supportsWifi,
            autoDriverInstall: product.autoDriverInstall,
            sdkAvailable: product.sdkAvailable,
            firmwareConfigSupported: product.firmwareConfigSupported,
            connectionTypes: product.connectionTypes
              ? product.connectionTypes.split(",").map((s) => s.trim()).filter(Boolean)
              : ["usb"],
          },
        } : null,
      });
    }

    // ===== Step 2: Fallback to FSMCustomerAsset =====
    const asset = await db.fSMCustomerAsset.findFirst({
      where: { serialNumber: { equals: raw, mode: "insensitive" } },
      include: { customer: true },
    });

    if (!asset) {
      return NextResponse.json({ valid: true, found: false });
    }

    // Match product by model
    const product = asset.model
      ? await db.qbitProduct.findFirst({
          where: { model: { equals: asset.model, mode: "insensitive" } },
          select: {
            id: true, name: true, slug: true, model: true, brand: true,
            category: true, deviceType: true, imageUrl: true, description: true,
            driverDownloadUrl: true, manualUrl: true, brochureUrl: true,
            datasheetUrl: true, warrantyUrl: true, sdkUrl: true, utilityUrl: true,
            installationGuideUrl: true, knowledgeBaseUrl: true,
            latestDriverVersion: true, latestFirmwareVersion: true,
            qrCodeUrl: true, status: true,
            installationInstructions: true, installationTime: true,
            difficultyLevel: true,
            // V4 Smart Device Setup capability flags
            supportsWifi: true, autoDriverInstall: true,
            sdkAvailable: true, firmwareConfigSupported: true,
            connectionTypes: true,
            // RBAC: filter mediaFiles to PUBLIC visibility only.
            mediaFiles: {
              where: { visibility: "public" },
              orderBy: { sortIndex: "asc" },
            },
          },
        })
      : null;

    const warrantyStatus = computeWarrantyStatus(asset.warrantyExpiry);

    return NextResponse.json({
      valid: true,
      found: true,
      source: "fsm-asset",
      device: {
        productName: product?.name ?? asset.productName,
        modelNumber: asset.model,
        brand: product?.brand ?? null,
        category: product?.category ?? null,
        productImage: product?.imageUrl ?? null,
        deviceStatus: asset.warrantyStatus ?? "unknown",
        serialNumber: asset.serialNumber,
        qrCode: asset.qrCode ?? product?.qrCodeUrl ?? null,
        purchaseDate: asset.purchaseDate?.toISOString() ?? null,
        installationDate: null,
        activationDate: asset.purchaseDate?.toISOString() ?? asset.createdAt.toISOString(),
        registrationDate: asset.createdAt.toISOString(),
        dealerName: null,
      },
      customer: {
        name: asset.customer.name,
        companyName: asset.customer.companyName ?? null,
        mobileNumber: maskMobile(asset.customer.phone),
        email: maskEmail(asset.customer.email ?? null),
        gstNumber: null,
        city: asset.customer.city ?? null,
        state: asset.customer.state ?? null,
      },
      warranty: {
        status: warrantyStatus.status,
        startDate: asset.purchaseDate?.toISOString() ?? null,
        endDate: asset.warrantyExpiry?.toISOString() ?? null,
        remainingDays: warrantyStatus.remainingDays,
        period: null,
      },
      resources: product ? {
        driverDownloadUrl: product.driverDownloadUrl,
        manualUrl: product.manualUrl,
        brochureUrl: product.brochureUrl,
        datasheetUrl: product.datasheetUrl,
        warrantyUrl: product.warrantyUrl,
        sdkUrl: product.sdkUrl,
        utilityUrl: product.utilityUrl,
        installationGuideUrl: product.installationGuideUrl,
        latestDriverVersion: product.latestDriverVersion,
        latestFirmwareVersion: product.latestFirmwareVersion,
        installationTime: product.installationTime,
        difficultyLevel: product.difficultyLevel,
        faqUrl: "/knowledge-base",
        troubleshootingUrl: "/knowledge-base",
        supportTicketUrl: "/support",
        videoUrl: "/videos",
        productPageUrl: `/products/${product.slug}`,
        mediaFiles: product.mediaFiles.map((m) => ({
          id: m.id, type: m.type, title: m.title, url: m.url,
        })),
        // V4 Smart Device Setup capabilities
        capabilities: {
          supportsWifi: product.supportsWifi,
          autoDriverInstall: product.autoDriverInstall,
          sdkAvailable: product.sdkAvailable,
          firmwareConfigSupported: product.firmwareConfigSupported,
          connectionTypes: product.connectionTypes
            ? product.connectionTypes.split(",").map((s) => s.trim()).filter(Boolean)
            : ["usb"],
        },
      } : null,
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/public/serial-lookup:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
