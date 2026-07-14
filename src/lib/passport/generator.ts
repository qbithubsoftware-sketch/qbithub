/**
 * Passport generator — auto-creates a DevicePassport from a DetectedDevice.
 *
 * Called when:
 *   1. A device scan matches a product (POST /api/dr-qbit/scan flow)
 *   2. An admin manually triggers passport generation
 *   3. An unknown device is mapped to a product
 *
 * The passport becomes the single source of truth — all subsequent scans
 * update the existing passport rather than creating a new one.
 */

import { db } from "@/lib/db";
import type { PassportDeviceStatus, DriverComparisonStatus } from "./types";

interface GeneratePassportArgs {
  detectedDeviceId: string;
  productId?: string;
}

/**
 * Generates (or updates) a DevicePassport from a DetectedDevice.
 * If a passport already exists for this device, it's updated.
 */
export async function generatePassport(args: GeneratePassportArgs): Promise<{
  passportId: string;
  passportNumber: string;
  created: boolean;
}> {
  const device = await db.detectedDevice.findUnique({
    where: { id: args.detectedDeviceId },
    include: { matchedProduct: true },
  });

  if (!device) {
    throw new Error("Detected device not found");
  }

  const productId = args.productId ?? device.matchedProductId;
  if (!productId) {
    throw new Error("Cannot generate passport — device has no matched product. Map the device first.");
  }

  const product = await db.qbitProduct.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  // Check if a passport already exists for this detected device
  const existing = await db.devicePassport.findUnique({
    where: { detectedDeviceId: device.id },
  });

  const passportNumber = existing?.passportNumber ?? await generatePassportNumber();

  if (existing) {
    // Update existing passport
    const updated = await db.devicePassport.update({
      where: { id: existing.id },
      data: {
        productId,
        deviceName: device.deviceName,
        manufacturer: device.manufacturer,
        brand: device.brand,
        model: device.model,
        hardwareId: device.hardwareId,
        vendorId: device.vendorId,
        productIdCode: device.productIdCode,
        serialNumber: device.serialNumber,
        connectionType: device.connectionType,
        port: device.port,
        usbVersion: device.usbVersion,
        osInfo: device.osInfo,
        architecture: device.architecture,
        macAddress: device.macAddress,
        ipAddress: device.ipAddress,
        lastScannedAt: new Date(),
      },
    });

    // Update driver intelligence
    await updateDriverInfo(updated.id, productId);

    return { passportId: updated.id, passportNumber: updated.passportNumber, created: false };
  }

  // Create new passport
  const passport = await db.devicePassport.create({
    data: {
      passportNumber,
      detectedDeviceId: device.id,
      productId,
      deviceName: device.deviceName,
      manufacturer: device.manufacturer,
      brand: device.brand,
      model: device.model,
      hardwareId: device.hardwareId,
      vendorId: device.vendorId,
      productIdCode: device.productIdCode,
      serialNumber: device.serialNumber,
      connectionType: device.connectionType,
      port: device.port,
      usbVersion: device.usbVersion,
      osInfo: device.osInfo,
      architecture: device.architecture,
      macAddress: device.macAddress,
      ipAddress: device.ipAddress,
      deviceStatus: "ready",
      firstDetectedAt: device.firstDetectedAt,
      lastScannedAt: new Date(),
    },
  });

  // Create driver info
  await updateDriverInfo(passport.id, productId);

  // Create initial driver history entry
  await db.driverHistory.create({
    data: {
      passportId: passport.id,
      eventType: "scan",
      driverName: "Device Passport Created",
      performedBy: "system",
      performedByName: "Dr. QBIT",
      notes: `Passport auto-generated from scan. Product: ${product.name}`,
    },
  });

  return { passportId: passport.id, passportNumber: passport.passportNumber, created: true };
}

/**
 * Updates driver intelligence for a passport.
 * Compares installed driver (from Desktop Agent) with QBIT Driver Library.
 */
async function updateDriverInfo(passportId: string, productId: string): Promise<void> {
  // Fetch latest driver version from the existing Driver/DriverVersion tables
  const driver = await db.driver.findFirst({
    where: { productId },
    include: {
      versions: {
        orderBy: { releaseDate: "desc" },
        take: 1,
      },
    },
  });

  // For demo: simulate installed driver data (in production, Desktop Agent reports this)
  const installedDriverName = driver?.name ?? null;
  const installedDriverVersion = driver?.versions[0]?.version
    ? decrementVersion(driver.versions[0].version)
    : null;
  const installedDriverProvider = "QBIT Technologies";
  const installedDriverDate = driver?.versions[0]?.releaseDate
    ? new Date(driver.versions[0].releaseDate.getTime() - 90 * 24 * 60 * 60 * 1000)
    : null;

  const latestVersion = driver?.versions[0]?.version ?? null;
  const latestReleaseDate = driver?.versions[0]?.releaseDate ?? null;

  // Determine driver status
  let driverStatus: DriverComparisonStatus;
  if (!latestVersion) {
    driverStatus = "unsupported";
  } else if (!installedDriverVersion) {
    driverStatus = "missing";
  } else if (installedDriverVersion === latestVersion) {
    driverStatus = "installed";
  } else {
    driverStatus = "update_available";
  }

  // Compute device status from driver status
  let deviceStatus: PassportDeviceStatus = "ready";
  if (driverStatus === "missing") deviceStatus = "driver_missing";
  else if (driverStatus === "update_available") deviceStatus = "driver_outdated";
  else if (driverStatus === "unsupported") deviceStatus = "unsupported";

  // Get download URL from existing Download table
  let downloadUrl: string | null = null;
  let fileSize: number | null = null;
  let releaseNotes: string | null = null;
  if (driver?.versions[0]?.downloadId) {
    const download = await db.download.findUnique({
      where: { id: driver.versions[0].downloadId },
      select: { storagePath: true, fileSize: true },
    });
    if (download) {
      downloadUrl = download.storagePath;
      fileSize = download.fileSize;
    }
  }

  // Upsert DriverInformation
  await db.driverInformation.upsert({
    where: { passportId },
    update: {
      installedDriverName,
      installedDriverVersion,
      installedDriverProvider,
      installedDriverDate,
      latestDriverVersion: latestVersion,
      latestDriverReleaseDate: latestReleaseDate,
      latestDriverDownloadUrl: downloadUrl,
      latestDriverFileSize: fileSize,
      latestDriverReleaseNotes: releaseNotes,
      driverStatus,
      lastCheckedAt: new Date(),
    },
    create: {
      passportId,
      installedDriverName,
      installedDriverVersion,
      installedDriverProvider,
      installedDriverDate,
      latestDriverVersion: latestVersion,
      latestDriverReleaseDate: latestReleaseDate,
      latestDriverDownloadUrl: downloadUrl,
      latestDriverFileSize: fileSize,
      latestDriverReleaseNotes: releaseNotes,
      driverStatus,
      supportedOses: JSON.stringify(["Windows 11", "Windows 10", "Ubuntu 22.04"]),
      lastCheckedAt: new Date(),
    },
  });

  // Update passport device status
  await db.devicePassport.update({
    where: { id: passportId },
    data: { deviceStatus },
  });
}

/** Generates a sequential passport number: PASS-2026-00001 */
async function generatePassportNumber(): Promise<string> {
  const count = await db.devicePassport.count();
  return `PASS-2026-${(count + 1).toString().padStart(5, "0")}`;
}

/** Decrements a version string by one patch level (for demo installed-version simulation). */
function decrementVersion(version: string): string {
  const parts = version.split(".");
  if (parts.length >= 3) {
    const patch = parseInt(parts[2], 10);
    if (patch > 0) {
      parts[2] = (patch - 1).toString();
    }
  }
  return parts.join(".");
}
