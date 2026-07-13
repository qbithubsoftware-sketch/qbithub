/**
 * Seed Dr. QBIT Device Passport & Driver Intelligence.
 *
 * Run with: `npx tsx scripts/seed-passports.ts`
 *
 * Creates:
 *   - DevicePassport rows for existing detected devices (matched to products)
 *   - DriverInformation (installed vs latest comparison)
 *   - DeviceWarranty (warranty status + days remaining)
 *   - DriverHistory (initial scan event + driver install event)
 *
 * Reuses existing DetectedDevice + QbitProduct + Driver/DriverVersion tables.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding Dr. QBIT Device Passports...");

  // Fetch all detected devices that have a matched product
  const devices = await db.detectedDevice.findMany({
    where: { matchedProductId: { not: null } },
    include: { matchedProduct: true },
  });

  console.log(`Found ${devices.length} matched detected devices`);

  let passportCount = 0;
  let warrantyCount = 0;
  let historyCount = 0;

  for (const device of devices) {
    if (!device.matchedProduct) continue;

    // Check if passport already exists
    const existing = await db.devicePassport.findUnique({
      where: { detectedDeviceId: device.id },
    });
    if (existing) {
      console.log(`  ⊘ ${device.deviceName ?? device.matchedProduct.name} — passport already exists`);
      continue;
    }

    // Generate passport number
    const count = await db.devicePassport.count();
    const passportNumber = `PASS-2026-${(count + 1).toString().padStart(5, "0")}`;

    // Create passport
    const passport = await db.devicePassport.create({
      data: {
        passportNumber,
        detectedDeviceId: device.id,
        productId: device.matchedProduct.id,
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
        lastScannedAt: device.lastSeenAt,
      },
    });
    passportCount++;
    console.log(`  ✓ ${passport.passportNumber} — ${device.matchedProduct.name}`);

    // Create DriverInformation
    // Fetch driver from existing Driver table
    const driver = await db.driver.findFirst({
      where: { productId: device.matchedProduct.id },
      include: { versions: { orderBy: { releaseDate: "desc" }, take: 1 } },
    });

    const latestVersion = driver?.versions[0]?.version ?? "2.4.1";
    // Simulate installed version as one patch lower than latest
    const installedVersion = decrementVersion(latestVersion);
    const latestDate = driver?.versions[0]?.releaseDate ?? new Date("2026-06-01");
    const installedDate = new Date(latestDate.getTime() - 90 * 24 * 60 * 60 * 1000);

    const driverStatus = installedVersion === latestVersion ? "installed" : "update_available";

    await db.driverInformation.create({
      data: {
        passportId: passport.id,
        installedDriverName: driver?.name ?? `${device.matchedProduct.name} Driver`,
        installedDriverVersion: installedVersion,
        installedDriverProvider: "QBIT Technologies",
        installedDriverDate: installedDate,
        latestDriverVersion: latestVersion,
        latestDriverReleaseDate: latestDate,
        latestDriverDownloadUrl: device.matchedProduct.driverDownloadUrl,
        latestDriverFileSize: 15_360_000, // ~15MB
        latestDriverReleaseNotes: "Stability improvements and bug fixes.",
        driverStatus,
        supportedOses: JSON.stringify(["Windows 11", "Windows 10", "Ubuntu 22.04"]),
        lastCheckedAt: new Date(),
      },
    });

    // Update passport device status based on driver status
    if (driverStatus === "update_available") {
      await db.devicePassport.update({
        where: { id: passport.id },
        data: { deviceStatus: "driver_outdated" },
      });
    }

    // Create DriverHistory entries
    await db.driverHistory.create({
      data: {
        passportId: passport.id,
        eventType: "scan",
        driverName: "Device Passport Created",
        performedBy: "system",
        performedByName: "Dr. QBIT",
        notes: `Passport auto-generated from scan. Product: ${device.matchedProduct.name}`,
        occurredAt: passport.firstDetectedAt,
      },
    });
    historyCount++;

    await db.driverHistory.create({
      data: {
        passportId: passport.id,
        eventType: "install",
        oldVersion: null,
        newVersion: installedVersion,
        driverName: driver?.name ?? `${device.matchedProduct.name} Driver`,
        driverProvider: "QBIT Technologies",
        performedBy: "system",
        performedByName: "Desktop Agent",
        notes: "Driver installed (detected by Desktop Agent scan)",
        occurredAt: installedDate,
      },
    });
    historyCount++;

    // Create DeviceWarranty (for devices with serial numbers matching customer assets)
    const customerAsset = device.serialNumber
      ? await db.fSMCustomerAsset.findUnique({
          where: { serialNumber: device.serialNumber },
        })
      : null;

    if (customerAsset) {
      const purchaseDate = customerAsset.purchaseDate ?? new Date("2025-08-12");
      const warrantyExpiry = customerAsset.warrantyExpiry ?? new Date("2027-08-12");
      const now = new Date();
      const daysRemaining = Math.round((warrantyExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const warrantyStatus = daysRemaining > 0 ? "active" : "expired";

      await db.deviceWarranty.create({
        data: {
          passportId: passport.id,
          purchaseDate,
          warrantyStartDate: purchaseDate,
          warrantyExpiryDate: warrantyExpiry,
          warrantyStatus,
          warrantyDaysRemaining: daysRemaining,
          extendedWarranty: false,
          warrantyProvider: "QBIT Technologies",
        },
      });
      warrantyCount++;

      // Link passport to customer asset
      await db.devicePassport.update({
        where: { id: passport.id },
        data: { customerAssetId: customerAsset.id },
      });
    } else if (device.serialNumber) {
      // No customer asset — create default warranty based on detection date
      const purchaseDate = device.firstDetectedAt;
      const warrantyExpiry = new Date(purchaseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const daysRemaining = Math.round((warrantyExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      await db.deviceWarranty.create({
        data: {
          passportId: passport.id,
          purchaseDate,
          warrantyStartDate: purchaseDate,
          warrantyExpiryDate: warrantyExpiry,
          warrantyStatus: daysRemaining > 0 ? "active" : "expired",
          warrantyDaysRemaining: daysRemaining,
          warrantyProvider: "QBIT Technologies",
        },
      });
      warrantyCount++;
    }
  }

  console.log(`\nDone. Device Passport data seeded:`);
  console.log(`  ✓ ${passportCount} device passports created`);
  console.log(`  ✓ ${warrantyCount} warranty records created`);
  console.log(`  ✓ ${historyCount} driver history entries created`);

  // Print summary
  const allPassports = await db.devicePassport.findMany({
    include: { product: true, driverInfo: true, warranty: true },
  });
  console.log(`\n--- Passport Summary ---`);
  for (const p of allPassports) {
    console.log(
      `  ${p.passportNumber} | ${p.product?.name ?? "Unknown"} | ${p.deviceStatus} | ` +
      `Driver: ${p.driverInfo?.driverStatus ?? "?"} | Warranty: ${p.warranty?.warrantyStatus ?? "?"} ` +
      `(${p.warranty?.warrantyDaysRemaining ?? 0} days)`,
    );
  }
}

function decrementVersion(version: string): string {
  const parts = version.split(".");
  if (parts.length >= 3) {
    const patch = parseInt(parts[2], 10);
    if (patch > 0) parts[2] = (patch - 1).toString();
  }
  return parts.join(".");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
