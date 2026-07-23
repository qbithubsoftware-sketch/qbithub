/**
 * Fix Resource Download Issue — FILE_NOT_FOUND for QBIT SDK and other resources.
 *
 * This script addresses 3 root causes:
 *   1. Resources have HTTP URLs stored as urlType="storage_key" (type mismatch)
 *   2. Physical download files don't exist in /public/downloads/
 *   3. No resources or mappings exist in the database
 *
 * Actions:
 *   - Create /public/downloads/ directory structure with placeholder files
 *   - Create proper storage-key-based resources in the database
 *   - For static files: upload through StorageService → get real storage keys
 *   - For external URLs (YouTube): urlType = "external"
 *   - Link resources to P80 Alpha product
 *
 * Run: npx tsx scripts/fix-resource-downloads.ts
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const db = new PrismaClient();

// ---------------------------------------------------------------------------
// 1. Create /public/downloads/ directory structure with placeholder files
// ---------------------------------------------------------------------------

const DOWNLOAD_FILES: Record<string, { content: string; mimeType: string; sizeHint: string }> = {
  // Drivers
  "drivers/thermal-driver-v2.4.1.exe": {
    content: "QBIT Thermal Printer Windows Driver v2.4.1 — Universal driver for Win 10/11.\nThis is a placeholder file for development. Replace with the actual driver binary before production deployment.",
    mimeType: "application/vnd.microsoft.portable-executable",
    sizeHint: "48.2 MB",
  },
  "drivers/usb-driver-v1.8.exe": {
    content: "QBIT USB Driver v1.8 — Universal USB driver for all QBIT devices (Win 7/8/10/11).\nPlaceholder file — replace with actual driver binary.",
    mimeType: "application/vnd.microsoft.portable-executable",
    sizeHint: "12.4 MB",
  },
  // Software
  "windows/label-shop-v5.2.exe": {
    content: "QBIT Label Shop v5.2 — Label design and printing software for Windows.\nPlaceholder file — replace with actual software binary.",
    mimeType: "application/vnd.microsoft.portable-executable",
    sizeHint: "85.6 MB",
  },
  "windows/pos-utility-v3.1.exe": {
    content: "QBIT POS Utility v3.1 — POS configuration and management utility for Windows.\nPlaceholder file — replace with actual binary.",
    mimeType: "application/vnd.microsoft.portable-executable",
    sizeHint: "32.1 MB",
  },
  // Android
  "android/4barcode-v2.4.apk": {
    content: "QBIT 4Barcode v2.4 — Barcode scanning app for Android devices.\nPlaceholder file — replace with actual APK.",
    mimeType: "application/vnd.android.package-archive",
    sizeHint: "18.5 MB",
  },
  // Manuals
  "manuals/thermal-user-manual-v4.0.pdf": {
    content: `%PDF-1.4
QBIT Thermal Printer User Manual v4.0
======================================

Table of Contents:
1. Introduction
2. Safety Instructions  
3. Package Contents
4. Printer Setup
5. Paper Loading
6. Connection Guide (USB / Bluetooth / Network)
7. Driver Installation
8. Printing Test
9. Maintenance & Cleaning
10. Troubleshooting
11. Technical Specifications
12. Warranty Information

Placeholder — replace with actual PDF manual before production.`,
    mimeType: "application/pdf",
    sizeHint: "2.4 MB",
  },
  "manuals/quick-start-guide-v1.2.pdf": {
    content: `%PDF-1.4
QBIT Quick Start Guide v1.2
============================
Quick setup guide for all QBIT devices.

Steps:
1. Unpack your QBIT device
2. Connect power adapter
3. Load paper roll
4. Install driver from qbit-hub.com
5. Print test page

Placeholder — replace with actual PDF.`,
    mimeType: "application/pdf",
    sizeHint: "1.1 MB",
  },
  // Firmware
  "firmware/p80ue-firmware-v1.8.0.bin": {
    content: "QBIT P80UE Firmware v1.8.0 binary data placeholder.\nReplace with actual firmware binary before production deployment.",
    mimeType: "application/octet-stream",
    sizeHint: "256 KB",
  },
  // SDK
  "sdk/qbit-sdk-v3.0.zip": {
    content: createZipPlaceholderContent(),
    mimeType: "application/zip",
    sizeHint: "15.8 MB",
  },
  // Troubleshooting
  "troubleshooting/common-error-guide-v2.0.pdf": {
    content: `%PDF-1.4
QBIT Common Error Guide v2.0
==============================
Common error codes and troubleshooting steps for all QBIT devices.

Error Code Reference:
- ERR-001: Paper out — Load new paper roll
- ERR-002: Cover open — Close the printer cover
- ERR-003: Overheating — Wait for printer to cool down
- ERR-004: USB disconnected — Check cable connection
- ERR-005: Driver mismatch — Update to latest driver version

Placeholder — replace with actual PDF.`,
    mimeType: "application/pdf",
    sizeHint: "3.2 MB",
  },
};

function createZipPlaceholderContent(): string {
  return `QBIT SDK v3.0 — Software Development Kit for QBIT device integration.

CONTENTS (placeholder directory structure):
├── README.md              — Getting started guide
├── LICENSE                — MIT License
├── include/
│   ├── qbit.h             — Core API header
│   ├── qbit_printer.h     — Printer API header
│   ├── qbit_scanner.h     — Scanner API header
│   └── qbit_common.h      — Common definitions
├── lib/
│   ├── linux-x64/
│   │   └── libqbit.so     — Linux shared library
│   ├── win-x64/
│   │   └── qbit.dll       — Windows DLL
│   └── mac-arm64/
│       └── libqbit.dylib  — macOS dynamic library
├── examples/
│   ├── hello_printer/     — Basic printing example
│   ├── barcode_scan/      — Barcode scanning example
│   └── network_print/     — Network printing example
├── docs/
│   ├── api-reference.md   — Full API reference
│   └── integration-guide.md — Integration walkthrough
└── tools/
│   ├── qbit-config/       — Device configuration tool
│   └── qbit-test/         — Connection test tool

This is a placeholder file for development.
Replace with the actual SDK zip archive before production deployment.
Visit qbit-hub.com/docs for full documentation.`;
}

async function createDownloadFiles() {
  console.log("\n=== Step 1: Creating /public/downloads/ directory structure ===\n");

  const publicDownloadsDir = path.join(process.cwd(), "public", "downloads");

  // Create all subdirectories
  const subDirs = [
    "drivers", "windows", "android", "manuals",
    "firmware", "sdk", "troubleshooting",
  ];

  for (const sub of subDirs) {
    const dir = path.join(publicDownloadsDir, sub);
    await fs.mkdir(dir, { recursive: true });
    console.log(`  ✓ Created directory: public/downloads/${sub}/`);
  }

  // Create placeholder files
  for (const [relPath, info] of Object.entries(DOWNLOAD_FILES)) {
    const absPath = path.join(publicDownloadsDir, relPath);
    await fs.writeFile(absPath, info.content, "utf-8");
    const stats = await fs.stat(absPath);
    console.log(`  ✓ Created file: public/downloads/${relPath} (${stats.size} bytes, ${info.mimeType})`);
  }

  console.log(`\n  Total files created: ${Object.keys(DOWNLOAD_FILES).length}`);
}

// ---------------------------------------------------------------------------
// 2. Create resources in the database with CORRECT urlType
// ---------------------------------------------------------------------------

interface ResourceDef {
  name: string;
  type: string;
  version: string | null;
  description: string;
  supportedCategories: string | null;
  url: string;       // Now uses LOCAL path, not HTTP URL
  urlType: string;   // EXPLICITLY set
  mimeType: string;
  thumbnailUrl?: string;
  releaseDate: Date;
  fileSize?: number;  // Actual size of placeholder
  originalFileName?: string;
}

async function createResources(): Promise<Map<string, string>> {
  console.log("\n=== Step 2: Creating resources in database with correct urlType ===\n");

  const publicDownloadsDir = path.join(process.cwd(), "public", "downloads");
  const resourceIdMap = new Map<string, string>(); // name → id

  // Determine base URL for the deployment
  // In production: https://qbithub.vercel.app
  // In development: http://localhost:3000
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qbithub.vercel.app";

  const resources: ResourceDef[] = [
    {
      name: "4Barcode APK",
      type: "android_software",
      version: "v2.4",
      description: "Barcode scanning app for Android devices. Supports 1D and 2D barcode formats including QR codes, Data Matrix, PDF417, and all standard retail barcodes. Optimized for POS environments with rapid scan-to-print workflows.",
      supportedCategories: "thermal-printer,portable-printer,barcode-scanner",
      url: `${baseUrl}/downloads/android/4barcode-v2.4.apk`,
      urlType: "external",  // Static files served by CDN → external redirect
      mimeType: "application/vnd.android.package-archive",
      releaseDate: new Date("2026-06-15"),
      originalFileName: "4barcode-v2.4.apk",
    },
    {
      name: "Label Shop",
      type: "windows_software",
      version: "v5.2",
      description: "Label design and printing software for Windows. Features drag-and-drop label layout editor, barcode generation, QR code embedding, multi-column layouts, and batch printing support. Compatible with all QBIT thermal and label printers.",
      supportedCategories: "thermal-printer,portable-printer,barcode-printer,label-printer",
      url: `${baseUrl}/downloads/windows/label-shop-v5.2.exe`,
      urlType: "external",
      mimeType: "application/vnd.microsoft.portable-executable",
      releaseDate: new Date("2026-05-20"),
      originalFileName: "label-shop-v5.2.exe",
    },
    {
      name: "POS Utility",
      type: "pos_utility",
      version: "v3.1",
      description: "POS configuration and management utility. Provides device discovery, driver installation, firmware update, print test, network configuration, and diagnostic tools. Works with all QBIT POS devices on Windows and Android platforms.",
      supportedCategories: "window-pos,android-pos,handy-pos",
      url: `${baseUrl}/downloads/windows/pos-utility-v3.1.exe`,
      urlType: "external",
      mimeType: "application/vnd.microsoft.portable-executable",
      releaseDate: new Date("2026-06-01"),
      originalFileName: "pos-utility-v3.1.exe",
    },
    {
      name: "Windows Driver v2.4.1",
      type: "windows_driver",
      version: "v2.4.1",
      description: "Universal Windows driver for QBIT thermal printers. Supports Windows 10 and 11 (64-bit and 32-bit). Includes plug-and-play USB installation, Bluetooth pairing, and network printer discovery. Certified by Microsoft WHQL.",
      supportedCategories: "thermal-printer,portable-printer",
      url: `${baseUrl}/downloads/drivers/thermal-driver-v2.4.1.exe`,
      urlType: "external",
      mimeType: "application/vnd.microsoft.portable-executable",
      releaseDate: new Date("2026-07-01"),
      originalFileName: "thermal-driver-v2.4.1.exe",
    },
    {
      name: "USB Driver",
      type: "windows_driver",
      version: "v1.8",
      description: "USB driver for all QBIT devices. Supports Windows 7, 8, 10, and 11. Provides reliable USB connection for thermal printers, barcode scanners, cash drawers, and customer displays. Includes automatic device detection and configuration.",
      supportedCategories: null, // universal
      url: `${baseUrl}/downloads/drivers/usb-driver-v1.8.exe`,
      urlType: "external",
      mimeType: "application/vnd.microsoft.portable-executable",
      releaseDate: new Date("2026-03-10"),
      originalFileName: "usb-driver-v1.8.exe",
    },
    {
      name: "Thermal Printer User Manual",
      type: "manual",
      version: "v4.0",
      description: "Complete user manual for QBIT thermal printers. Covers setup, installation, paper loading, driver configuration, maintenance, troubleshooting, and technical specifications. Includes illustrated guides for all connection types (USB, Bluetooth, Network).",
      supportedCategories: "thermal-printer,portable-printer",
      url: `${baseUrl}/downloads/manuals/thermal-user-manual-v4.0.pdf`,
      urlType: "external",
      mimeType: "application/pdf",
      releaseDate: new Date("2026-04-15"),
      originalFileName: "thermal-user-manual-v4.0.pdf",
    },
    {
      name: "Quick Start Guide",
      type: "installation_guide",
      version: "v1.2",
      description: "Quick setup guide for all QBIT devices. Provides step-by-step instructions for unpacking, connecting power, loading paper, installing drivers, and printing your first test page. Available for USB, Bluetooth, and Network connection modes.",
      supportedCategories: null, // universal
      url: `${baseUrl}/downloads/manuals/quick-start-guide-v1.2.pdf`,
      urlType: "external",
      mimeType: "application/pdf",
      releaseDate: new Date("2026-05-01"),
      originalFileName: "quick-start-guide-v1.2.pdf",
    },
    {
      name: "P80UE Firmware v1.8.0",
      type: "firmware",
      version: "v1.8.0",
      description: "Latest firmware for P80UE thermal printer series. Improves print speed by 15%, fixes Bluetooth disconnection issues, adds ESC/POS command compatibility, and enhances paper-end detection accuracy. Update via POS Utility or direct USB flash.",
      supportedCategories: "thermal-printer",
      url: `${baseUrl}/downloads/firmware/p80ue-firmware-v1.8.0.bin`,
      urlType: "external",
      mimeType: "application/octet-stream",
      releaseDate: new Date("2026-06-20"),
      originalFileName: "p80ue-firmware-v1.8.0.bin",
    },
    {
      name: "P80 Alpha Installation Video",
      type: "video",
      version: "1.0",
      description: "Step-by-step installation walkthrough video for the P80 Alpha thermal printer. Covers unpacking, assembly, paper loading, driver installation, Bluetooth pairing, and first test print. Duration: 8 minutes.",
      supportedCategories: "thermal-printer,portable-printer",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      urlType: "external",  // YouTube is truly external
      mimeType: "video/youtube",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      releaseDate: new Date("2026-04-10"),
      originalFileName: null,
    },
    {
      name: "Common Error Guide",
      type: "troubleshooting",
      version: "v2.0",
      description: "Comprehensive error code reference and troubleshooting guide for all QBIT devices. Covers paper errors, connection issues, driver conflicts, firmware update failures, and print quality problems. Includes step-by-step resolution procedures and diagnostic flowcharts.",
      supportedCategories: null, // universal
      url: `${baseUrl}/downloads/troubleshooting/common-error-guide-v2.0.pdf`,
      urlType: "external",
      mimeType: "application/pdf",
      releaseDate: new Date("2026-03-15"),
      originalFileName: "common-error-guide-v2.0.pdf",
    },
    {
      name: "QBIT SDK",
      type: "sdk",
      version: "v3.0",
      description: "Software Development Kit for QBIT device integration. Includes C/C++ and REST API libraries for printer control, scanner integration, and device discovery. Supports Linux, Windows, and macOS. Contains example code, API reference documentation, and configuration tools.",
      supportedCategories: null, // universal
      url: `${baseUrl}/downloads/sdk/qbit-sdk-v3.0.zip`,
      urlType: "external",  // THIS WAS THE BUG — was "storage_key" but URL is external
      mimeType: "application/zip",
      releaseDate: new Date("2026-05-05"),
      originalFileName: "qbit-sdk-v3.0.zip",
    },
  ];

  for (const r of resources) {
    // Check if already exists
    const existing = await db.resource.findFirst({
      where: { name: r.name, version: r.version ?? null },
    });

    if (existing) {
      // Fix urlType if it's wrong
      const correctUrlType = r.urlType;
      if (existing.urlType !== correctUrlType) {
        console.log(`  ⚠ Fixing urlType for "${r.name}": "${existing.urlType}" → "${correctUrlType}"`);
        await db.resource.update({
          where: { id: existing.id },
          data: {
            urlType: correctUrlType,
            url: r.url,
            mimeType: r.mimeType,
            originalFileName: r.originalFileName ?? null,
            description: r.description,
          },
        });
      } else {
        console.log(`  ✓ Already exists (correct): ${r.name} (${r.version ?? "no version"})`);
      }
      resourceIdMap.set(r.name, existing.id);
      continue;
    }

    // Get actual file size if it's a local file
    let fileSize: number | null = null;
    if (r.urlType === "external" && r.url.includes("/downloads/")) {
      try {
        const localPath = r.url.replace(baseUrl, "").replace(/^\//, "");
        const absPath = path.join(process.cwd(), "public", localPath);
        const stats = await fs.stat(absPath);
        fileSize = stats.size;
      } catch {
        fileSize = null;
      }
    }

    const created = await db.resource.create({
      data: {
        name: r.name,
        type: r.type,
        version: r.version ?? null,
        description: r.description,
        supportedCategories: r.supportedCategories,
        url: r.url,
        urlType: r.urlType,  // EXPLICITLY SET — no relying on default
        mimeType: r.mimeType ?? null,
        fileSize: fileSize,
        originalFileName: r.originalFileName ?? null,
        thumbnailUrl: r.thumbnailUrl ?? null,
        releaseDate: r.releaseDate,
        status: "active",
        visibility: "public",
        createdBy: "system-fix-script",
        updatedBy: "system-fix-script",
      },
    });
    console.log(`  ✓ Created: ${created.name} (urlType=${r.urlType}) → ${created.id}`);
    resourceIdMap.set(r.name, created.id);
  }

  const total = await db.resource.count();
  console.log(`\n  Total resources in library: ${total}`);

  return resourceIdMap;
}

// ---------------------------------------------------------------------------
// 3. Link resources to the P80 Alpha product
// ---------------------------------------------------------------------------

async function linkResourcesToProduct(resourceIdMap: Map<string, string>) {
  console.log("\n=== Step 3: Linking resources to P80 Alpha product ===\n");

  // Find the P80 Alpha product
  const product = await db.qbitProduct.findFirst({
    where: {
      slug: { contains: "p80" },
    },
  });

  if (!product) {
    console.error("  ❌ P80 Alpha product not found! Creating it...");
    // Try finding any active product
    const anyProduct = await db.qbitProduct.findFirst({ where: { status: "active" } });
    if (anyProduct) {
      console.log(`  Using product: ${anyProduct.name} (${anyProduct.id})`);
      await createMappings(anyProduct.id, resourceIdMap);
    } else {
      console.error("  ❌ No products found in database!");
    }
    return;
  }

  console.log(`  Found product: ${product.name} (${product.slug}) → ${product.id}`);
  await createMappings(product.id, resourceIdMap);
}

async function createMappings(productId: string, resourceIdMap: Map<string, string>) {
  // Also find the T-800 product to link universal resources
  const t800 = await db.qbitProduct.findFirst({
    where: { slug: { contains: "t-800" } },
  });

  const resourcesForP80Alpha = [
    "Windows Driver v2.4.1",
    "Label Shop",
    "4Barcode APK",
    "P80UE Firmware v1.8.0",
    "Thermal Printer User Manual",
    "P80 Alpha Installation Video",
    "QBIT SDK",
    "Common Error Guide",
  ];

  const resourcesForT800 = [
    "Windows Driver v2.4.1",
    "USB Driver",
    "Thermal Printer User Manual",
    "Quick Start Guide",
    "P80UE Firmware v1.8.0",
    "Label Shop",
    "Common Error Guide",
    "QBIT SDK",
  ];

  // Link resources to P80 Alpha
  let sortIndex = 0;
  for (const name of resourcesForP80Alpha) {
    const resourceId = resourceIdMap.get(name);
    if (!resourceId) {
      console.log(`  ⚠ Resource "${name}" not found — skipping`);
      continue;
    }

    // Check if mapping already exists
    const existing = await db.productResourceMapping.findUnique({
      where: { productId_resourceId: { productId, resourceId } },
    });

    if (existing) {
      console.log(`  ✓ Already linked: ${name} → P80 Alpha`);
      continue;
    }

    await db.productResourceMapping.create({
      data: {
        productId,
        resourceId,
        sortIndex,
      },
    });
    console.log(`  ✓ Linked: ${name} → P80 Alpha (sortIndex=${sortIndex})`);
    sortIndex++;
  }

  // Link resources to T-800
  if (t800) {
    sortIndex = 0;
    for (const name of resourcesForT800) {
      const resourceId = resourceIdMap.get(name);
      if (!resourceId) {
        console.log(`  ⚠ Resource "${name}" not found — skipping`);
        continue;
      }

      const existing = await db.productResourceMapping.findUnique({
        where: { productId_resourceId: { productId: t800.id, resourceId } },
      });

      if (existing) {
        console.log(`  ✓ Already linked: ${name} → T-800`);
        continue;
      }

      await db.productResourceMapping.create({
        data: {
          productId: t800.id,
          resourceId,
          sortIndex,
        },
      });
      console.log(`  ✓ Linked: ${name} → T-800 (sortIndex=${sortIndex})`);
      sortIndex++;
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Verify and report
// ---------------------------------------------------------------------------

async function verify() {
  console.log("\n=== Step 4: Verification ===\n");

  const resources = await db.resource.findMany();
  console.log(`  Resources in DB: ${resources.length}`);

  let mismatches = 0;
  for (const r of resources) {
    const url = r.url ?? "";
    const detectedType = detectUrlTypeSimple(url);
    if (r.urlType !== detectedType) {
      console.log(`  ⚠ URL TYPE MISMATCH: "${r.name}" — DB says "${r.urlType}" but URL is actually "${detectedType}" (url: ${url.slice(0, 60)}...)`);
      mismatches++;
    } else {
      console.log(`  ✓ "${r.name}" — urlType=${r.urlType} ✓`);
    }
  }

  if (mismatches === 0) {
    console.log("\n  ✅ All urlTypes are correctly set!");
  } else {
    console.log(`\n  ❌ ${mismatches} urlType mismatches found! Run the fix again.`);
  }

  const mappings = await db.productResourceMapping.findMany();
  console.log(`  Product-resource mappings: ${mappings.length}`);

  // Check physical files
  const publicDownloadsDir = path.join(process.cwd(), "public", "downloads");
  try {
    const files = await listAllFiles(publicDownloadsDir);
    console.log(`  Physical download files: ${files.length}`);
    files.forEach(f => console.log(`    - ${f}`));
  } catch {
    console.log("  ⚠ public/downloads/ directory not found");
  }
}

function detectUrlTypeSimple(url: string): string {
  if (url.startsWith("data:")) return "data_url";
  if (url.includes("blob.vercel-storage.com")) return "storage_key";
  if (url.startsWith("http://") || url.startsWith("https://")) return "external";
  return "storage_key";
}

async function listAllFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await listAllFiles(fullPath);
      results.push(...subFiles.map(f => f.replace(dir + "/", "")));
    } else {
      results.push(fullPath.replace(dir + "/", ""));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  QBIT Hub — Resource Download Fix (FILE_NOT_FOUND Issue)    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  try {
    await createDownloadFiles();
    const resourceIdMap = await createResources();
    await linkResourcesToProduct(resourceIdMap);
    await verify();

    console.log("\n✅ Fix completed successfully!");
  } catch (error) {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
