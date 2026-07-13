/**
 * Seed Dr. QBIT Firmware Intelligence.
 *
 * Run with: `npx tsx scripts/seed-firmware.ts`
 *
 * Creates:
 *   - FirmwareRelease rows for existing Firmware master records (3-4 versions each)
 *   - FirmwareCompatibility rows (model + VID/PID constraints)
 *   - FirmwareInformation rows for existing device passports
 *   - FirmwareHistory entries (initial scan + install events)
 *
 * Reuses existing Firmware + Download + DevicePassport + QbitProduct tables.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding Dr. QBIT Firmware Intelligence...");

  // -------- 1. Fetch existing Firmware master records --------
  const firmwares = await db.firmware.findMany();
  console.log(`Found ${firmwares.length} existing Firmware master records`);

  if (firmwares.length === 0) {
    // Create firmware master records if none exist
    console.log("Creating Firmware master records...");
    const products = await db.qbitProduct.findMany();

    for (const product of products) {
      const fwName = `${product.name} Firmware`;
      await db.firmware.upsert({
        where: { name: fwName },
        update: { productId: product.id },
        create: { name: fwName, productId: product.id, description: `Firmware for ${product.name}` },
      });
    }
    console.log(`  ✓ Created firmware master records for ${products.length} products`);
  }

  const allFirmwares = await db.firmware.findMany();
  console.log(`Total firmware master records: ${allFirmwares.length}`);

  // -------- 2. Create FirmwareReleases --------
  let releaseCount = 0;
  for (const fw of allFirmwares) {
    // Check if releases already exist
    const existing = await db.firmwareRelease.findFirst({
      where: { firmwareId: fw.id },
    });
    if (existing) {
      continue;
    }

    // Create 3 versions: latest, previous, legacy
    const versions = [
      { version: "4.0.2", build: "build-4021", date: new Date("2026-06-15"), isLatest: true, isStable: true, isCritical: false },
      { version: "4.0.1", build: "build-4015", date: new Date("2026-04-10"), isLatest: false, isStable: true, isCritical: true },
      { version: "3.9.0", build: "build-3900", date: new Date("2025-11-20"), isLatest: false, isStable: true, isCritical: false },
    ];

    // Get product for supported models
    const product = fw.productId ? await db.qbitProduct.findUnique({ where: { id: fw.productId } }) : null;
    const supportedModels = product ? JSON.stringify([product.model]) : null;

    for (const v of versions) {
      await db.firmwareRelease.create({
        data: {
          firmwareId: fw.id,
          version: v.version,
          buildNumber: v.build,
          releaseDate: v.date,
          fileSize: 8_388_608 + Math.floor(Math.random() * 4_194_304), // 8-12 MB
          checksum: `sha256:${v.build}${Math.random().toString(36).slice(2, 10)}`,
          releaseNotes: v.isLatest
            ? "Latest stable release. Improvements:\n- Enhanced print quality for thermal printers\n- Fixed WiFi reconnection issue\n- Improved barcode scanning accuracy\n- Security patch for network stack"
            : v.isCritical
              ? "Critical update — security fix:\n- Fixed CVE-2026-XXXX (buffer overflow in network handler)\n- All users should update immediately\n- No breaking changes"
              : "Previous stable release:\n- Initial 4.x release\n- New driver compatibility layer\n- Bug fixes and stability improvements",
          isCritical: v.isCritical,
          isLatest: v.isLatest,
          isStable: v.isStable,
          supportedModels,
          minOsVersion: "Windows 10",
        },
      });
      releaseCount++;
    }
  }
  console.log(`  ✓ ${releaseCount} firmware releases created`);

  // -------- 3. Create FirmwareCompatibility --------
  const allReleases = await db.firmwareRelease.findMany({
    include: { firmware: true },
  });

  let compatCount = 0;
  for (const release of allReleases) {
    const product = release.firmware.productId
      ? await db.qbitProduct.findUnique({ where: { id: release.firmware.productId } })
      : null;

    if (!product) continue;

    // Check if compatibility already exists
    const existing = await db.firmwareCompatibility.findFirst({
      where: { firmwareReleaseId: release.id, deviceModel: product.model },
    });
    if (existing) continue;

    await db.firmwareCompatibility.create({
      data: {
        firmwareReleaseId: release.id,
        productId: product.id,
        deviceModel: product.model,
        hardwareIdPattern: null,
        vendorId: "1E90", // QBIT VID
        productIdCode: null, // any PID for this product
        isCompatible: true,
        notes: release.isCritical ? "Critical update — install immediately" : null,
      },
    });
    compatCount++;
  }
  console.log(`  ✓ ${compatCount} compatibility records created`);

  // -------- 4. Create FirmwareInformation for existing passports --------
  const passports = await db.devicePassport.findMany({
    include: { product: true },
  });

  let infoCount = 0;
  let historyCount = 0;
  for (const passport of passports) {
    // Skip if firmware info already exists
    const existing = await db.firmwareInformation.findUnique({
      where: { passportId: passport.id },
    });
    if (existing) continue;

    // Find the latest firmware release for this product
    const product = passport.product;
    if (!product) continue;

    const firmware = await db.firmware.findFirst({
      where: { productId: product.id },
    });
    if (!firmware) continue;

    const latestRelease = await db.firmwareRelease.findFirst({
      where: { firmwareId: firmware.id, isLatest: true },
      orderBy: { releaseDate: "desc" },
    });
    if (!latestRelease) continue;

    // Simulate installed version (one minor lower than latest)
    const installedVersion = decrementMinor(latestRelease.version);
    const installedDate = new Date(latestRelease.releaseDate.getTime() - 120 * 24 * 60 * 60 * 1000);

    // Determine firmware status
    let firmwareStatus = "update_available";
    if (installedVersion === latestRelease.version) {
      firmwareStatus = "healthy";
    }

    await db.firmwareInformation.create({
      data: {
        passportId: passport.id,
        installedVersion,
        installedBuildNumber: `build-${installedVersion.replace(/\./g, "")}0`,
        installedFirmwareDate: installedDate,
        installedFirmwareVendor: "QBIT Technologies",
        installedCompatibility: "Compatible",
        latestReleaseId: latestRelease.id,
        latestVersion: latestRelease.version,
        latestReleaseDate: latestRelease.releaseDate,
        latestFileSize: latestRelease.fileSize,
        latestChecksum: latestRelease.checksum,
        latestReleaseNotes: latestRelease.releaseNotes,
        firmwareStatus,
        compatibilityChecked: false,
        isCompatible: true,
        lastCheckedAt: new Date(),
      },
    });
    infoCount++;

    // Create firmware history entries
    await db.firmwareHistory.create({
      data: {
        passportId: passport.id,
        eventType: "scan",
        newVersion: installedVersion,
        performedBy: "system",
        performedByName: "Dr. QBIT",
        notes: `Firmware detected during device scan. Installed: v${installedVersion}, Latest: v${latestRelease.version}`,
        occurredAt: passport.firstDetectedAt,
      },
    });
    historyCount++;

    await db.firmwareHistory.create({
      data: {
        passportId: passport.id,
        eventType: "install",
        oldVersion: null,
        newVersion: installedVersion,
        performedBy: "system",
        performedByName: "Desktop Agent",
        updateMethod: "usb",
        notes: `Firmware v${installedVersion} installed (detected by Desktop Agent)`,
        occurredAt: installedDate,
      },
    });
    historyCount++;
  }

  console.log(`  ✓ ${infoCount} firmware information records created`);
  console.log(`  ✓ ${historyCount} firmware history entries created`);

  console.log("\nDone. Firmware Intelligence data seeded.");

  // Print summary
  const allInfo = await db.firmwareInformation.findMany({
    include: { passport: { include: { product: true } } },
  });
  console.log(`\n--- Firmware Summary ---`);
  for (const i of allInfo) {
    console.log(
      `  Passport ${i.passportId.slice(-8).toUpperCase()} | ${i.passport.product?.name ?? "Unknown"} | ` +
      `installed: v${i.installedVersion ?? "?"} latest: v${i.latestVersion ?? "?"} | ${i.firmwareStatus}`,
    );
  }
}

function decrementMinor(version: string): string {
  const parts = version.split(".");
  if (parts.length >= 2) {
    const minor = parseInt(parts[1], 10);
    if (minor > 0) parts[1] = (minor - 1).toString();
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
