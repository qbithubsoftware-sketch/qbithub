/**
 * GET /api/dr-qbit/passports — list device passports
 *
 * Query params:
 *   - q: general search (serial, model, hardwareId, VID, PID)
 *   - deviceStatus: filter by device status
 *   - limit: number (default 50, max 200)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/notifications/auth";
import type { PassportDTO, PassportDeviceStatus } from "@/lib/passport/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const deviceStatus = url.searchParams.get("deviceStatus");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);

  const where: Record<string, unknown> = {};
  if (deviceStatus) where.deviceStatus = deviceStatus as PassportDeviceStatus;
  if (q) {
    where.OR = [
      { serialNumber: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { hardwareId: { contains: q, mode: "insensitive" } },
      { vendorId: { contains: q, mode: "insensitive" } },
      { productIdCode: { contains: q, mode: "insensitive" } },
      { deviceName: { contains: q, mode: "insensitive" } },
      { passportNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  const passports = await db.devicePassport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      product: true,
      driverInfo: true,
      warranty: true,
      driverHistory: { orderBy: { occurredAt: "desc" }, take: 10 },
    },
  });

  return NextResponse.json({
    items: passports.map(mapPassportDTO),
    total: passports.length,
  });
}

/** Maps a Prisma DevicePassport row (with includes) to the PassportDTO. */
function mapPassportDTO(p: typeof db.devicePassport extends never ? never : {
  id: string;
  passportNumber: string;
  detectedDeviceId: string | null;
  productId: string | null;
  hardwareId: string | null;
  vendorId: string | null;
  productIdCode: string | null;
  serialNumber: string | null;
  deviceName: string | null;
  manufacturer: string | null;
  brand: string | null;
  model: string | null;
  connectionType: string | null;
  port: string | null;
  usbVersion: string | null;
  osInfo: string | null;
  architecture: string | null;
  macAddress: string | null;
  ipAddress: string | null;
  deviceStatus: string;
  customerAssetId: string | null;
  firstDetectedAt: Date;
  lastScannedAt: Date | null;
  lastDriverUpdateAt: Date | null;
  lastFirmwareUpdateAt: Date | null;
  lastInstallationAt: Date | null;
  lastServiceAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string; name: string; brand: string; manufacturer: string | null;
    model: string; deviceType: string; description: string | null;
    driverDownloadUrl: string | null; manualUrl: string | null;
    installationGuideUrl: string | null; knowledgeBaseUrl: string | null;
  } | null;
  driverInfo: {
    installedDriverName: string | null;
    installedDriverVersion: string | null;
    installedDriverProvider: string | null;
    installedDriverDate: Date | null;
    latestDriverVersion: string | null;
    latestDriverReleaseDate: Date | null;
    latestDriverDownloadUrl: string | null;
    latestDriverFileSize: number | null;
    latestDriverReleaseNotes: string | null;
    driverStatus: string;
    supportedOses: string | null;
    lastCheckedAt: Date;
  } | null;
  warranty: {
    purchaseDate: Date | null;
    warrantyStartDate: Date | null;
    warrantyExpiryDate: Date | null;
    warrantyStatus: string;
    warrantyDaysRemaining: number | null;
    extendedWarranty: boolean;
    extendedExpiryDate: Date | null;
    warrantyProvider: string | null;
  } | null;
  driverHistory: Array<{
    id: string; eventType: string; oldVersion: string | null;
    newVersion: string | null; driverName: string | null;
    driverProvider: string | null; performedByName: string | null;
    notes: string | null; occurredAt: Date;
  }>;
}): PassportDTO {
  return {
    id: p.id,
    passportNumber: p.passportNumber,
    detectedDeviceId: p.detectedDeviceId,
    productId: p.productId,
    hardwareId: p.hardwareId,
    vendorId: p.vendorId,
    productIdCode: p.productIdCode,
    serialNumber: p.serialNumber,
    deviceName: p.deviceName,
    manufacturer: p.manufacturer,
    brand: p.brand,
    model: p.model,
    connectionType: p.connectionType as never,
    port: p.port,
    usbVersion: p.usbVersion,
    osInfo: p.osInfo,
    architecture: p.architecture,
    macAddress: p.macAddress,
    ipAddress: p.ipAddress,
    deviceStatus: p.deviceStatus as never,
    product: p.product ? {
      id: p.product.id,
      name: p.product.name,
      brand: p.product.brand,
      manufacturer: p.product.manufacturer,
      model: p.product.model,
      deviceType: p.product.deviceType,
      description: p.product.description,
      driverDownloadUrl: p.product.driverDownloadUrl,
      manualUrl: p.product.manualUrl,
      installationGuideUrl: p.product.installationGuideUrl,
      knowledgeBaseUrl: p.product.knowledgeBaseUrl,
    } : null,
    driverInfo: p.driverInfo ? {
      installedDriverName: p.driverInfo.installedDriverName,
      installedDriverVersion: p.driverInfo.installedDriverVersion,
      installedDriverProvider: p.driverInfo.installedDriverProvider,
      installedDriverDate: p.driverInfo.installedDriverDate?.toISOString() ?? null,
      latestDriverVersion: p.driverInfo.latestDriverVersion,
      latestDriverReleaseDate: p.driverInfo.latestDriverReleaseDate?.toISOString() ?? null,
      latestDriverDownloadUrl: p.driverInfo.latestDriverDownloadUrl,
      latestDriverFileSize: p.driverInfo.latestDriverFileSize,
      latestDriverReleaseNotes: p.driverInfo.latestDriverReleaseNotes,
      driverStatus: p.driverInfo.driverStatus as never,
      supportedOses: p.driverInfo.supportedOses ? JSON.parse(p.driverInfo.supportedOses) : null,
      lastCheckedAt: p.driverInfo.lastCheckedAt.toISOString(),
    } : null,
    warranty: p.warranty ? {
      purchaseDate: p.warranty.purchaseDate?.toISOString() ?? null,
      warrantyStartDate: p.warranty.warrantyStartDate?.toISOString() ?? null,
      warrantyExpiryDate: p.warranty.warrantyExpiryDate?.toISOString() ?? null,
      warrantyStatus: p.warranty.warrantyStatus as never,
      warrantyDaysRemaining: p.warranty.warrantyDaysRemaining,
      extendedWarranty: p.warranty.extendedWarranty,
      extendedExpiryDate: p.warranty.extendedExpiryDate?.toISOString() ?? null,
      warrantyProvider: p.warranty.warrantyProvider,
    } : null,
    firstDetectedAt: p.firstDetectedAt.toISOString(),
    lastScannedAt: p.lastScannedAt?.toISOString() ?? null,
    lastDriverUpdateAt: p.lastDriverUpdateAt?.toISOString() ?? null,
    lastFirmwareUpdateAt: p.lastFirmwareUpdateAt?.toISOString() ?? null,
    lastInstallationAt: p.lastInstallationAt?.toISOString() ?? null,
    lastServiceAt: p.lastServiceAt?.toISOString() ?? null,
    customerAssetId: p.customerAssetId,
    driverHistory: p.driverHistory.map((h) => ({
      id: h.id,
      eventType: h.eventType as never,
      oldVersion: h.oldVersion,
      newVersion: h.newVersion,
      driverName: h.driverName,
      driverProvider: h.driverProvider,
      performedByName: h.performedByName,
      notes: h.notes,
      occurredAt: h.occurredAt.toISOString(),
    })),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export { mapPassportDTO };
