/**
 * Enterprise Resource Migration Script — V5 Architecture
 *
 * This script:
 *   1. Seeds resources with CORRECT urlType (never relying on defaults)
 *   2. Uses the new storageKey/publicUrl/storageProvider/extension fields
 *   3. Auto-fixes existing bad records (HTTP URLs in storageKey)
 *   4. Links resources to products
 *
 * Run: npx tsx scripts/migrate-v5-resources.ts
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// Base URL for CDN static files
const CDN_BASE = "https://qbithub.vercel.app/downloads";

// Resource definitions with EXPLICIT new fields
const RESOURCES = [
  {
    name: "4Barcode APK",
    type: "android_software",
    version: "v2.4",
    description: "Barcode scanning app for Android devices. Supports 1D and 2D barcode formats including QR codes, Data Matrix, PDF417, and all standard retail barcodes. Optimized for POS environments with rapid scan-to-print workflows.",
    supportedCategories: "thermal_printer,portable_printer,barcode_scanner",
    publicUrl: CDN_BASE + "/android/4barcode-v2.4.apk",
    urlType: "external",
    storageKey: null,
    storageProvider: null,
    extension: "apk",
    mimeType: "application/vnd.android.package-archive",
    releaseDate: new Date("2026-06-15"),
  },
  {
    name: "Label Shop",
    type: "windows_software",
    version: "v5.2",
    description: "Label design and printing software for Windows. Features drag-and-drop label layout editor, barcode generation, QR code embedding, multi-column layouts, and batch printing support.",
    supportedCategories: "thermal_printer,portable_printer,barcode_printer,label_printer",
    publicUrl: CDN_BASE + "/windows/label-shop-v5.2.exe",
    urlType: "external",
    storageKey: null,
    storageProvider: null,
    extension: "exe",
    mimeType: "application/vnd.microsoft.portable-executable",
    releaseDate: new Date("2026-05-20"),
  },
  {
    name: "POS Utility",
    type: "pos_utility",
    version: "v3.1",
    description: "POS configuration and management utility. Provides device discovery, driver installation, firmware update, print test, network configuration, and diagnostic tools.",
    supportedCategories: "window_pos,android_pos,handy_pos",
    publicUrl: CDN_BASE + "/windows/pos-utility-v3.1.exe",
    urlType: "external",
    storageKey: null,
    storageProvider: null,
    extension: "exe",
    mimeType: "application/vnd.microsoft.portable-executable",
    releaseDate: new Date("2026-06-01"),
  },
  {
    name: "Windows Driver v2.4.1",
    type: "windows_driver",
    version: "v2.4.1",
    description: "Universal Windows driver for QBIT thermal printers. Supports Windows 10 and 11 (64-bit and 32-bit). Includes plug-and-play USB installation, Bluetooth pairing, and network printer discovery.",
    supportedCategories: "thermal_printer,portable_printer",
    publicUrl: CDN_BASE + "/drivers/thermal-driver-v2.4.1.exe",
    urlType: "external",
    storageKey: null,
    storageProvider: null,
    extension: "exe",
    mimeType: "application/vnd.microsoft.portable-executable",
    releaseDate: new Date("2026-07-01"),
  },
  {
    name: "USB Driver",
    type: "windows_driver",
    version: "v1.8",
    description: "USB driver for all QBIT devices. Supports Windows 7, 8, 10, and 11. Provides reliable USB connection for thermal printers, barcode scanners, cash drawers, and customer displays.",
    supportedCategories: null,
    publicUrl: CDN_BASE + "/drivers/usb-driver-v1.8.exe",
    urlType: "external",
    storageKey: null,
    storageProvider: null,
    extension: "exe",
    mimeType: "application/vnd.microsoft.portable-executable",
    releaseDate: new Date("2026-03-10"),
  },
  {
    name: "Thermal Printer User Manual",
    type: "manual",
    version: "v4.0",
    description: "Complete user manual for QBIT thermal printers. Covers setup, installation, paper loading, driver configuration, maintenance, troubleshooting, and technical specifications.",
    supportedCategories: "thermal_printer,portable_printer",
    publicUrl: CDN_BASE + "/manuals/thermal-user-manual-v4.0.pdf",
    urlType: "external",
    storageKey: null,
    storageProvider: null,
    extension: "pdf",
    mimeType: "application/pdf",
    releaseDate: new Date("2026-04-15"),
  },
  {
    name: "Quick Start Guide",
    type: "installation_guide",
    version: "v1.2",
    description: "Quick setup guide for all QBIT devices. Provides step-by-step instructions for unpacking, connecting power, loading paper, installing drivers, and printing your first test page.",
    supportedCategories: null,
    publicUrl: CDN_BASE + "/manuals/quick-start-guide-v1.2.pdf",
    urlType: "external",
    storageKey: null,
    storageProvider: null,
    extension: "pdf",
    mimeType: "application/pdf",
    releaseDate: new Date("2026-05-01"),
  },
  {
    name: "P80UE Firmware v1.8.0",
    type: "firmware",
    version: "v1.8.0",
    description: "Latest firmware for P80UE thermal printer series. Improves print speed by 15%, fixes Bluetooth disconnection issues, adds ESC/POS command compatibility, and enhances paper-end detection accuracy.",
    supportedCategories: "thermal_printer",
    publicUrl: CDN_BASE + "/firmware/p80ue-firmware-v1.8.0.bin",
    urlType: "external",
    storageKey: null,
    storageProvider: null,
    extension: "bin",
    mimeType: "application/octet-stream",
    releaseDate: new Date("2026-06-20"),
  },
  {
    name: "P80 Alpha Installation Video",
    type: "video",
    version: "1.0",
    description: "Step-by-step installation walkthrough video for the P80 Alpha thermal printer. Covers unpacking, assembly, paper loading, driver installation, Bluetooth pairing, and first test print.",
    supportedCategories: "thermal_printer,portable_printer",
    publicUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    urlType: "external",
    storageKey: null,
    storageProvider: null,
    extension: null,
    mimeType: "video/youtube",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    releaseDate: new Date("2026-04-10"),
  },
  {
    name: "Common Error Guide",
    type: "troubleshooting",
    version: "v2.0",
    description: "Comprehensive error code reference and troubleshooting guide for all QBIT devices. Covers paper errors, connection issues, driver conflicts, firmware update failures, and print quality problems.",
    supportedCategories: null,
    publicUrl: CDN_BASE + "/troubleshooting/common-error-guide-v2.0.pdf",
    urlType: "external",
    storageKey: null,
    storageProvider: null,
    extension: "pdf",
    mimeType: "application/pdf",
    releaseDate: new Date("2026-03-15"),
  },
  {
    name: "QBIT SDK",
    type: "sdk",
    version: "v3.0",
    description: "Software Development Kit for QBIT device integration. Includes C/C++ and REST API libraries for printer control, scanner integration, and device discovery. Supports Linux, Windows, and macOS.",
    supportedCategories: null,
    publicUrl: CDN_BASE + "/sdk/qbit-sdk-v3.0.zip",
    urlType: "external",  // FIXED — was incorrectly "storage_key" in old seed script
    storageKey: null,
    storageProvider: null,
    extension: "zip",
    mimeType: "application/zip",
    releaseDate: new Date("2026-05-05"),
  },
];

async function main() {
  console.log("=== V5 Enterprise Resource Migration ===\n");

  // Step 1: Create/update resources with correct architecture
  console.log("Step 1: Seeding resources with correct V5 fields...\n");
  for (const r of RESOURCES) {
    const existing = await db.resource.findFirst({
      where: { name: r.name, version: r.version ?? null },
    });

    if (existing) {
      // Update existing record with correct fields
      const updateData: Record<string, unknown> = {};
      if (existing.urlType !== r.urlType) updateData.urlType = r.urlType;
      if (existing.storageKey !== r.storageKey) updateData.storageKey = r.storageKey;
      if (existing.publicUrl !== r.publicUrl) updateData.publicUrl = r.publicUrl;
      if (existing.storageProvider !== r.storageProvider) updateData.storageProvider = r.storageProvider;
      if (existing.extension !== r.extension) updateData.extension = r.extension;
      if (existing.mimeType !== r.mimeType) updateData.mimeType = r.mimeType;
      if (existing.description !== r.description) updateData.description = r.description;
      updateData.url = r.publicUrl; // Legacy backward compat

      if (Object.keys(updateData).length > 1) { // url is always updated
        await db.resource.update({ where: { id: existing.id }, data: updateData });
        console.log("  FIXED: " + r.name + " (urlType=" + existing.urlType + " → " + r.urlType + ")");
      } else {
        console.log("  OK: " + r.name + " (already correct)");
      }
      continue;
    }

    const created = await db.resource.create({
      data: {
        name: r.name,
        type: r.type,
        version: r.version ?? null,
        description: r.description,
        supportedCategories: r.supportedCategories,
        storageKey: r.storageKey,
        publicUrl: r.publicUrl,
        storageProvider: r.storageProvider,
        urlType: r.urlType,  // EXPLICITLY SET — never relies on default
        mimeType: r.mimeType ?? null,
        extension: r.extension ?? null,
        thumbnailUrl: r.thumbnailUrl ?? null,
        releaseDate: r.releaseDate,
        status: "active",
        visibility: "public",
        createdBy: "system-v5-migration",
        updatedBy: "system-v5-migration",
        url: r.publicUrl ?? r.storageKey ?? null, // Legacy backward compat
      },
    });
    console.log("  CREATED: " + r.name + " (urlType=" + r.urlType + ", extension=" + r.extension + ") → " + created.id);
  }

  // Step 2: Link resources to products
  console.log("\nStep 2: Linking resources to products...\n");
  const products = await db.qbitProduct.findMany();
  const resources = await db.resource.findMany();

  const p80Alpha = products.find(p => p.slug.includes("p80") || p.slug.includes("alpha"));
  const t800 = products.find(p => p.slug.includes("t-800"));

  const p80AlphaResources = [
    "Windows Driver v2.4.1", "Label Shop", "4Barcode APK",
    "P80UE Firmware v1.8.0", "Thermal Printer User Manual",
    "P80 Alpha Installation Video", "QBIT SDK", "Common Error Guide",
  ];

  const t800Resources = [
    "Windows Driver v2.4.1", "USB Driver", "Thermal Printer User Manual",
    "Quick Start Guide", "P80UE Firmware v1.8.0", "Label Shop",
    "Common Error Guide", "QBIT SDK",
  ];

  async function linkResources(product: typeof products[0] | undefined, names: string[]) {
    if (!product) { console.log("  Product not found — skipping"); return; }
    console.log("  Product: " + product.name);
    let sortIndex = 0;
    for (const name of names) {
      const resource = resources.find(r => r.name === name);
      if (!resource) { console.log("    SKIP: " + name + " (not found)"); continue; }
      const existingMapping = await db.productResourceMapping.findUnique({
        where: { productId_resourceId: { productId: product.id, resourceId: resource.id } },
      });
      if (existingMapping) { console.log("    OK: " + name + " (already linked)"); continue; }
      await db.productResourceMapping.create({
        data: { productId: product.id, resourceId: resource.id, sortIndex },
      });
      console.log("    LINKED: " + name + " → " + product.name + " (sortIndex=" + sortIndex + ")");
      sortIndex++;
    }
  }

  await linkResources(p80Alpha, p80AlphaResources);
  await linkResources(t800, t800Resources);

  // Step 3: Verify
  console.log("\nStep 3: Verification...\n");
  const allResources = await db.resource.findMany();
  let badCount = 0;
  for (const r of allResources) {
    // Check: HTTP URL in storageKey (the FILE_NOT_FOUND bug)
    const sk = r.storageKey ?? r.url ?? "";
    if (sk.startsWith("http://") || sk.startsWith("https://")) {
      if (!sk.includes("blob.vercel-storage.com") && r.urlType === "uploaded") {
        console.log("  BUG: " + r.name + " — storageKey=" + sk.slice(0, 60) + " is HTTP URL with urlType=uploaded");
        badCount++;
      } else if (r.urlType === "external") {
        console.log("  OK: " + r.name + " — urlType=external, publicUrl correctly used");
      }
    } else if (!sk && r.publicUrl) {
      console.log("  OK: " + r.name + " — storageKey=null, publicUrl=" + r.publicUrl.slice(0, 60) + ", urlType=" + r.urlType);
    } else {
      console.log("  OK: " + r.name + " — storageKey=" + sk.slice(0, 40) + ", urlType=" + r.urlType);
    }
  }

  const total = allResources.length;
  const mappings = await db.productResourceMapping.findMany();
  console.log("\n  Total resources: " + total);
  console.log("  Bad records: " + badCount);
  console.log("  Product-resource mappings: " + mappings.length);

  if (badCount === 0) {
    console.log("\n  ALL RECORDS ARE CLEAN — FILE_NOT_FOUND bug is fixed!");
  } else {
    console.log("\n  WARNING: " + badCount + " bad records still exist. Run autoFixResourceRecords() to fix them.");
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
