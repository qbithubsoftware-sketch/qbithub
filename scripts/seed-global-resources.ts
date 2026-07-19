/**
 * Seed V5 Global Resource Library with demo shared resources.
 *
 * Creates resources that can be linked to unlimited products via
 * ProductResourceMapping. Eliminates duplicate uploads.
 *
 * Run with: source /tmp/prod-db.env && npx tsx scripts/seed-global-resources.ts
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const RESOURCES = [
  {
    name: "4Barcode APK",
    type: "android_software",
    version: "v2.4",
    description: "Barcode scanning app for Android devices",
    supportedCategories: "thermal-printer,portable-printer,barcode-scanner",
    url: "https://qbithub.vercel.app/downloads/android/4barcode-v2.4.apk",
    mimeType: "application/vnd.android.package-archive",
    releaseDate: new Date("2026-06-15"),
  },
  {
    name: "Label Shop",
    type: "windows_software",
    version: "v5.2",
    description: "Label design and printing software for Windows",
    supportedCategories: "thermal-printer,portable-printer,barcode-printer,label-printer",
    url: "https://qbithub.vercel.app/downloads/windows/label-shop-v5.2.exe",
    mimeType: "application/vnd.microsoft.portable-executable",
    releaseDate: new Date("2026-05-20"),
  },
  {
    name: "POS Utility",
    type: "pos_utility",
    version: "v3.1",
    description: "POS configuration and management utility",
    supportedCategories: "window-pos,android-pos,handy-pos",
    url: "https://qbithub.vercel.app/downloads/windows/pos-utility-v3.1.exe",
    mimeType: "application/vnd.microsoft.portable-executable",
    releaseDate: new Date("2026-06-01"),
  },
  {
    name: "Windows Driver v2.4.1",
    type: "windows_driver",
    version: "v2.4.1",
    description: "Universal Windows driver for QBIT thermal printers (Win 10/11)",
    supportedCategories: "thermal-printer,portable-printer",
    url: "https://qbithub.vercel.app/downloads/drivers/thermal-driver-v2.4.1.exe",
    mimeType: "application/vnd.microsoft.portable-executable",
    releaseDate: new Date("2026-07-01"),
  },
  {
    name: "USB Driver",
    type: "windows_driver",
    version: "v1.8",
    description: "USB driver for all QBIT devices (Win 7/8/10/11)",
    supportedCategories: null, // universal — works with all categories
    url: "https://qbithub.vercel.app/downloads/drivers/usb-driver-v1.8.exe",
    mimeType: "application/vnd.microsoft.portable-executable",
    releaseDate: new Date("2026-03-10"),
  },
  {
    name: "Thermal Printer User Manual",
    type: "manual",
    version: "v4.0",
    description: "Complete user manual for QBIT thermal printers",
    supportedCategories: "thermal-printer,portable-printer",
    url: "https://qbithub.vercel.app/downloads/manuals/thermal-user-manual-v4.0.pdf",
    mimeType: "application/pdf",
    releaseDate: new Date("2026-04-15"),
  },
  {
    name: "Quick Start Guide",
    type: "installation_guide",
    version: "v1.2",
    description: "Quick setup guide for all QBIT devices",
    supportedCategories: null, // universal
    url: "https://qbithub.vercel.app/downloads/manuals/quick-start-guide-v1.2.pdf",
    mimeType: "application/pdf",
    releaseDate: new Date("2026-05-01"),
  },
  {
    name: "P80UE Firmware v1.8.0",
    type: "firmware",
    version: "v1.8.0",
    description: "Latest firmware for P80UE thermal printer series",
    supportedCategories: "thermal-printer",
    url: "https://qbithub.vercel.app/downloads/firmware/p80ue-firmware-v1.8.0.bin",
    mimeType: "application/octet-stream",
    releaseDate: new Date("2026-06-20"),
  },
  {
    name: "Installation Video — Thermal Printer Setup",
    type: "video",
    version: null,
    description: "Step-by-step installation walkthrough for thermal printers",
    supportedCategories: "thermal-printer,portable-printer",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    releaseDate: new Date("2026-04-10"),
  },
  {
    name: "Common Error Guide",
    type: "troubleshooting",
    version: "v2.0",
    description: "Common error codes and troubleshooting steps for all QBIT devices",
    supportedCategories: null, // universal
    url: "https://qbithub.vercel.app/downloads/troubleshooting/common-error-guide-v2.0.pdf",
    mimeType: "application/pdf",
    releaseDate: new Date("2026-03-15"),
  },
  {
    name: "QBIT SDK",
    type: "sdk",
    version: "v3.0",
    description: "Software Development Kit for QBIT device integration",
    supportedCategories: null, // universal
    url: "https://qbithub.vercel.app/downloads/sdk/qbit-sdk-v3.0.zip",
    mimeType: "application/zip",
    releaseDate: new Date("2026-05-05"),
  },
];

async function main() {
  console.log("=== Seeding V5 Global Resource Library ===\n");

  for (const r of RESOURCES) {
    // Check if resource already exists (by name + version)
    const existing = await db.resource.findFirst({
      where: { name: r.name, version: r.version ?? null },
    });
    if (existing) {
      console.log(`  ✓ Already exists: ${r.name} (${r.version ?? "no version"})`);
      continue;
    }
    const created = await db.resource.create({
      data: {
        name: r.name,
        type: r.type,
        version: r.version ?? null,
        description: r.description,
        supportedCategories: r.supportedCategories,
        url: r.url,
        mimeType: r.mimeType ?? null,
        thumbnailUrl: r.thumbnailUrl ?? null,
        releaseDate: r.releaseDate,
        status: "active",
        visibility: "public",
        createdBy: "system-seed",
        updatedBy: "system-seed",
      },
    });
    console.log(`  ✓ Created: ${created.name} (${created.type}) → ${created.id}`);
  }

  const total = await db.resource.count();
  console.log(`\n=== Done. Total resources in library: ${total} ===`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
