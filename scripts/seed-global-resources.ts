/**
 * Seed V5 Global Resource Library with demo shared resources.
 *
 * V5 FIX: All resources now properly set storageKey, publicUrl, urlType,
 * storageProvider, and extension fields. This eliminates the root cause
 * of the FILE_NOT_FOUND bug (seed script previously omitted urlType,
 * causing Prisma default "uploaded" to misclassify HTTP URLs).
 *
 * External URLs → urlType="external", publicUrl=URL, storageKey=null
 * Uploaded files → urlType="uploaded", storageKey=local-key, publicUrl=null
 *
 * Run with: source /tmp/prod-db.env && npx tsx scripts/seed-global-resources.ts
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

/**
 * Determine urlType, storageKey, publicUrl, extension from a URL.
 * - HTTP URLs (non-Vercel-Blob) → external
 * - Vercel Blob URLs → uploaded (treated as storage keys)
 * - Local keys → uploaded
 */
function classifyUrl(url: string): {
  urlType: string;
  storageKey: string | null;
  publicUrl: string | null;
  storageProvider: string | null;
  extension: string | null;
} {
  const isVercelBlob = url.includes("blob.vercel-storage.com");
  const isHttp = url.startsWith("http://") || url.startsWith("https://");

  // Extract extension from URL path
  const pathPart = url.split("?")[0].split("#")[0];
  const extMatch = pathPart.match(/\.(?:apk|exe|msi|bin|hex|img|iso|rom|zip|rar|7z|pdf|docx|xlsx|csv|txt|xml|json|png|jpg|jpeg|webp|svg|gif|bmp|mp4|mov|avi|mkv|mp3|wav|aac|ogg|doc|xls|ppt|pptx|rtf|inf|cat|sys|cab|aab)$/i);
  const extension = extMatch ? extMatch[1].toLowerCase() : null;

  if (isVercelBlob) {
    return {
      urlType: "uploaded",
      storageKey: url,     // Vercel Blob URLs are storage keys
      publicUrl: url,      // Also the public-facing CDN URL
      storageProvider: "vercel-blob",
      extension,
    };
  }

  if (isHttp) {
    return {
      urlType: "external",
      storageKey: null,     // External URLs are NOT storage keys
      publicUrl: url,       // Used for display/redirect
      storageProvider: null,
      extension,
    };
  }

  // Local storage key
  return {
    urlType: "uploaded",
    storageKey: url,
    publicUrl: null,
    storageProvider: "local",
    extension,
  };
}

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

  // Phase 1: Fix existing broken records first
  console.log("Phase 1: Fix existing records with incorrect urlType...\n");
  const allResources = await db.resource.findMany({
    select: { id: true, name: true, url: true, storageKey: true, publicUrl: true, urlType: true, storageProvider: true },
  });

  let fixedCount = 0;
  for (const existing of allResources) {
    const effectiveUrl = existing.storageKey ?? existing.url ?? existing.publicUrl ?? "";
    if (!effectiveUrl) continue;

    const classification = classifyUrl(effectiveUrl);

    // Check if urlType matches
    if (existing.urlType !== classification.urlType) {
      console.log(`  FIX urlType: "${existing.name}" stored=${existing.urlType} → effective=${classification.urlType}`);
      await db.resource.update({
        where: { id: existing.id },
        data: {
          urlType: classification.urlType,
          storageKey: classification.storageKey,
          publicUrl: classification.publicUrl,
          storageProvider: classification.storageProvider,
        },
      });
      fixedCount++;
    }

    // Check if HTTP URL is in storageKey (broken mapping)
    if (existing.storageKey && (existing.storageKey.startsWith("http://") || existing.storageKey.startsWith("https://"))
        && !existing.storageKey.includes("blob.vercel-storage.com")) {
      console.log(`  FIX storageKey→publicUrl: "${existing.name}" moving HTTP URL from storageKey to publicUrl`);
      await db.resource.update({
        where: { id: existing.id },
        data: {
          storageKey: null,
          publicUrl: existing.storageKey,
          urlType: "external",
          url: existing.storageKey,
        },
      });
      fixedCount++;
    }
  }
  console.log(`  Fixed ${fixedCount} records.\n`);

  // Phase 2: Create new seed resources with proper V5 fields
  console.log("Phase 2: Create seed resources with V5 fields...\n");
  for (const r of RESOURCES) {
    // Check if resource already exists (by name + version)
    const existing = await db.resource.findFirst({
      where: { name: r.name, version: r.version ?? null },
    });
    if (existing) {
      console.log(`  ✓ Already exists: ${r.name} (${r.version ?? "no version"})`);
      continue;
    }

    const classification = classifyUrl(r.url);

    const created = await db.resource.create({
      data: {
        name: r.name,
        type: r.type,
        version: r.version ?? null,
        description: r.description,
        supportedCategories: r.supportedCategories,
        // V5 fields — properly classified
        storageKey: classification.storageKey,
        publicUrl: classification.publicUrl,
        storageProvider: classification.storageProvider,
        urlType: classification.urlType,
        extension: classification.extension,
        mimeType: r.mimeType ?? null,
        // Legacy field for backward compat
        url: r.url,
        thumbnailUrl: r.thumbnailUrl ?? null,
        releaseDate: r.releaseDate,
        status: "active",
        visibility: "public",
        createdBy: "system-seed",
        updatedBy: "system-seed",
      },
    });
    console.log(`  ✓ Created: ${created.name} (${created.type}, urlType=${classification.urlType}) → ${created.id}`);
  }

  // Phase 3: Link resources to P80 Alpha product
  console.log("\nPhase 3: Link resources to products...\n");
  const p80Alpha = await db.qbitProduct.findFirst({ where: { slug: "thermal-printer-p80-alpha" } });
  const t800 = await db.qbitProduct.findFirst({ where: { slug: "t-800-window-pos" } });

  if (p80Alpha) {
    const driver = await db.resource.findFirst({ where: { name: "Windows Driver v2.4.1" } });
    const firmware = await db.resource.findFirst({ where: { name: "P80UE Firmware v1.8.0" } });
    const manual = await db.resource.findFirst({ where: { name: "Thermal Printer User Manual" } });
    const qsg = await db.resource.findFirst({ where: { name: "Quick Start Guide" } });
    const video = await db.resource.findFirst({ where: { name: "Installation Video — Thermal Printer Setup" } });
    const errors = await db.resource.findFirst({ where: { name: "Common Error Guide" } });
    const sdk = await db.resource.findFirst({ where: { name: "QBIT SDK" } });

    const links = [
      { resourceId: driver?.id, overrideType: "windows_driver", sortIndex: 0 },
      { resourceId: firmware?.id, overrideType: "firmware", sortIndex: 1 },
      { resourceId: manual?.id, overrideType: "manual", sortIndex: 2 },
      { resourceId: qsg?.id, overrideType: "installation_guide", sortIndex: 3 },
      { resourceId: video?.id, overrideType: "video", sortIndex: 4 },
      { resourceId: errors?.id, overrideType: "troubleshooting", sortIndex: 5 },
      { resourceId: sdk?.id, overrideType: "sdk", sortIndex: 6 },
    ];

    for (const link of links) {
      if (!link.resourceId) continue;
      const existingMapping = await db.productResourceMapping.findFirst({
        where: { productId: p80Alpha.id, resourceId: link.resourceId },
      });
      if (existingMapping) {
        console.log(`  ✓ Already linked: P80 Alpha → ${link.overrideType}`);
        continue;
      }
      await db.productResourceMapping.create({
        data: {
          productId: p80Alpha.id,
          resourceId: link.resourceId,
          overrideType: link.overrideType,
          sortIndex: link.sortIndex,
        },
      });
      console.log(`  ✓ Linked: P80 Alpha → ${link.overrideType}`);
    }
  } else {
    console.log("  ⚠ P80 Alpha product not found — skipping product linking");
  }

  if (t800) {
    const posUtility = await db.resource.findFirst({ where: { name: "POS Utility" } });
    const labelShop = await db.resource.findFirst({ where: { name: "Label Shop" } });
    const usbDriver = await db.resource.findFirst({ where: { name: "USB Driver" } });

    const links = [
      { resourceId: posUtility?.id, overrideType: "pos_utility", sortIndex: 0 },
      { resourceId: labelShop?.id, overrideType: "windows_software", sortIndex: 1 },
      { resourceId: usbDriver?.id, overrideType: "windows_driver", sortIndex: 2 },
    ];

    for (const link of links) {
      if (!link.resourceId) continue;
      const existingMapping = await db.productResourceMapping.findFirst({
        where: { productId: t800.id, resourceId: link.resourceId },
      });
      if (existingMapping) {
        console.log(`  ✓ Already linked: T-800 → ${link.overrideType}`);
        continue;
      }
      await db.productResourceMapping.create({
        data: {
          productId: t800.id,
          resourceId: link.resourceId,
          overrideType: link.overrideType,
          sortIndex: link.sortIndex,
        },
      });
      console.log(`  ✓ Linked: T-800 → ${link.overrideType}`);
    }
  }

  const total = await db.resource.count();
  console.log(`\n=== Done. Total resources in library: ${total} ===`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
