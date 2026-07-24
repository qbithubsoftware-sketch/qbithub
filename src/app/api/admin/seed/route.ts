/**
 * POST /api/admin/seed — Production seed endpoint.
 * Seeds the database with QBIT product data, resources, knowledge articles,
 * FAQs, error codes, installation guides, and admin user.
 * Called after initial deployment to populate the production database.
 */

import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const results: Record<string, number> = {};

    // 1. Seed Download Categories
    const downloadCategories = [
      { name: "Driver", slug: "driver", icon: "memory", sortIndex: 0 },
      { name: "Firmware", slug: "firmware", icon: "upgrade", sortIndex: 1 },
      { name: "Manual", slug: "manual", icon: "menu_book", sortIndex: 2 },
      { name: "SDK", slug: "sdk", icon: "code", sortIndex: 3 },
      { name: "Utility", slug: "utility", icon: "build", sortIndex: 4 },
      { name: "Brochure", slug: "brochure", icon: "picture_as_pdf", sortIndex: 5 },
    ];
    for (const cat of downloadCategories) {
      await db.downloadCategory.upsert({ where: { slug: cat.slug }, update: cat, create: cat });
    }
    results.downloadCategories = downloadCategories.length;

    // 2. Seed Knowledge Categories
    const knowledgeCategories = [
      { name: "Products", slug: "products", icon: "devices", description: "Product setup, configuration, and usage", sortIndex: 0 },
      { name: "Drivers", slug: "drivers", icon: "memory", description: "Driver installation, troubleshooting, and updates", sortIndex: 1 },
      { name: "Installation", slug: "installation", icon: "build", description: "Hardware installation and setup guides", sortIndex: 2 },
      { name: "Firmware", slug: "firmware", icon: "upgrade", description: "Firmware updates and compatibility", sortIndex: 3 },
      { name: "Networking", slug: "networking", icon: "wifi", description: "LAN, Wi-Fi, and Bluetooth setup", sortIndex: 4 },
      { name: "Troubleshooting", slug: "troubleshooting", icon: "help", description: "Common issues and solutions", sortIndex: 5 },
      { name: "Enterprise", slug: "enterprise", icon: "business", description: "Enterprise deployment and best practices", sortIndex: 6 },
    ];
    const kCatIds: Record<string, string> = {};
    for (const cat of knowledgeCategories) {
      const record = await db.knowledgeCategory.upsert({ where: { slug: cat.slug }, update: cat, create: cat });
      kCatIds[cat.slug] = record.id;
    }
    results.knowledgeCategories = knowledgeCategories.length;

    // 3. Seed Operating Systems
    const osData = [
      { name: "Windows 10", slug: "win10", icon: "desktop_windows", sortIndex: 0 },
      { name: "Windows 11", slug: "win11", icon: "desktop_windows", sortIndex: 1 },
      { name: "Ubuntu 22.04 LTS", slug: "ubuntu-2204", icon: "linux", sortIndex: 2 },
      { name: "Android 11", slug: "android-11", icon: "phone_android", sortIndex: 3 },
      { name: "Android 13", slug: "android-13", icon: "phone_android", sortIndex: 4 },
    ];
    for (const os of osData) {
      await db.operatingSystem.upsert({ where: { slug: os.slug }, update: os, create: os });
    }
    results.operatingSystems = osData.length;

    // 4. Seed Products
    const products = [
      {
        name: "P80 Alpha Thermal Printer", brand: "QBITHub", manufacturer: "QBITHub Technologies",
        model: "P80A", slug: "qbithub-thermal-printer-p80-alpha", deviceType: "thermal_printer",
        sku: "QBP-80A-001", serialPattern: "^P80[A-Z]-[0-9]{6}$",
        description: "Professional-grade 80mm thermal receipt printer for high-volume retail and hospitality.",
        imageUrl: "/uploads/products/p80-alpha.png", category: "thermal-printer",
        isFeatured: true, isTrending: true, badgeLabel: "Most Downloaded", startingPrice: "₹8,500",
        specifications: JSON.stringify([{ property: "Print Width", value: "80mm" }, { property: "Print Speed", value: "250mm/sec" }, { property: "Resolution", value: "203 DPI" }, { property: "Interface", value: "USB + Serial + LAN" }]),
        features: JSON.stringify([{ icon: "speed", title: "Ultra-Fast", description: "250mm/sec print speed" }, { icon: "print", title: "203 DPI", description: "Crisp resolution" }]),
        operatingSystems: JSON.stringify([{ icon: "desktop_windows", label: "Windows 10/11" }]),
        status: "active", isActive: true, isDraft: false, isPublished: true,
        viewCount: 1250, downloadCount: 890,
        latestDriverVersion: "v2.3.1", latestFirmwareVersion: "v3.1.0",
        supportsWifi: true, autoDriverInstall: true, sdkAvailable: true, firmwareConfigSupported: true,
        connectionTypes: "usb,lan", tags: "thermal printer, receipt printer, POS",
        aiDiagnosticsSupported: true, drQbitSupported: true, difficultyLevel: "Beginner", installationTime: "15 minutes",
      },
      {
        name: "S20 Pro 2D Barcode Scanner", brand: "QBITHub", manufacturer: "QBITHub Technologies",
        model: "S20P", slug: "qbithub-2d-barcode-scanner-s20-pro", deviceType: "barcode_scanner",
        sku: "QBS-20P-001", serialPattern: "^S20[P]-[0-9]{6}$",
        description: "Premium 2D barcode scanner for demanding retail, logistics, and healthcare applications.",
        imageUrl: "/uploads/products/s20-pro.png", category: "barcode-scanner",
        isFeatured: true, isTrending: false, badgeLabel: "Newly Released", startingPrice: "₹12,000",
        specifications: JSON.stringify([{ property: "Scan Rate", value: "60 fps" }, { property: "Resolution", value: "752 × 480" }, { property: "Interface", value: "USB HID + RS232 + KBW" }]),
        features: JSON.stringify([{ icon: "barcode_scanner", title: "Omnidirectional", description: "Scan from any angle" }, { icon: "verified", title: "All 1D/2D Codes", description: "QR, DataMatrix, PDF417" }]),
        operatingSystems: JSON.stringify([{ icon: "desktop_windows", label: "Windows 10/11" }, { icon: "phone_android", label: "Android 8+" }]),
        status: "active", isActive: true, isDraft: false, isPublished: true,
        viewCount: 980, downloadCount: 420,
        latestDriverVersion: "v1.2.0", latestFirmwareVersion: "v2.0.1",
        supportsWifi: false, autoDriverInstall: true, sdkAvailable: true, firmwareConfigSupported: false,
        connectionTypes: "usb", tags: "barcode scanner, 2D scanner, QR",
        aiDiagnosticsSupported: true, drQbitSupported: true, difficultyLevel: "Beginner", installationTime: "5 minutes",
      },
      {
        name: "V3 All-in-One POS Machine", brand: "QBITHub", manufacturer: "QBITHub Technologies",
        model: "V3POS", slug: "qbithub-pos-machine-v3", deviceType: "pos_machine",
        sku: "QBV-3POS-001", serialPattern: "^V3POS-[0-9]{6}$",
        description: "Powerful all-in-one POS terminal with 15.6\" touchscreen, Intel J1900, and complete peripheral suite.",
        imageUrl: "/uploads/products/v3-pos.png", category: "window-pos",
        isFeatured: true, isTrending: true, badgeLabel: "Most Popular", startingPrice: "₹45,000",
        specifications: JSON.stringify([{ property: "Display", value: "15.6\" PCAP" }, { property: "CPU", value: "Intel J1900" }, { property: "RAM", value: "4GB DDR3" }, { property: "Storage", value: "128GB SSD" }]),
        features: JSON.stringify([{ icon: "monitor", title: "15.6\" Touch", description: "Large PCAP display" }, { icon: "print", title: "Built-in Printer", description: "80mm thermal" }]),
        operatingSystems: JSON.stringify([{ icon: "desktop_windows", label: "Windows 10 IoT" }, { icon: "linux", label: "Ubuntu 22.04" }]),
        status: "active", isActive: true, isDraft: false, isPublished: true,
        viewCount: 3400, downloadCount: 2100,
        latestDriverVersion: "v1.5.2", latestFirmwareVersion: "v2.1.0",
        supportsWifi: true, autoDriverInstall: true, sdkAvailable: true, firmwareConfigSupported: true,
        connectionTypes: "usb,lan,wifi", tags: "POS machine, all-in-one, touchscreen",
        aiDiagnosticsSupported: true, drQbitSupported: true, difficultyLevel: "Intermediate", installationTime: "45 minutes",
      },
      {
        name: "P40 Portable Thermal Printer", brand: "QBITHub", manufacturer: "QBITHub Technologies",
        model: "P40", slug: "qbithub-portable-thermal-printer-p40", deviceType: "portable_printer",
        sku: "QBP-40-001", serialPattern: "^P40-[0-9]{6}$",
        description: "Compact, battery-powered 58mm thermal printer for mobile field operations.",
        imageUrl: "/uploads/products/p40-portable.png", category: "portable-printer",
        isFeatured: false, isTrending: true, badgeLabel: "Trending", startingPrice: "₹5,500",
        specifications: JSON.stringify([{ property: "Print Width", value: "58mm" }, { property: "Connectivity", value: "BT + USB-C" }, { property: "Battery", value: "2000mAh" }]),
        features: JSON.stringify([{ icon: "bluetooth", title: "Bluetooth", description: "Wireless pairing" }, { icon: "battery_charging_full", title: "Battery", description: "100+ receipts per charge" }]),
        operatingSystems: JSON.stringify([{ icon: "phone_android", label: "Android 6+" }, { icon: "apple", label: "iOS 12+" }]),
        status: "active", isActive: true, isDraft: false, isPublished: true,
        viewCount: 780, downloadCount: 560,
        latestDriverVersion: "v1.0.5", latestFirmwareVersion: "v1.2.0",
        supportsWifi: true, autoDriverInstall: true, sdkAvailable: true, firmwareConfigSupported: true,
        connectionTypes: "usb,bluetooth,wifi", tags: "portable printer, mobile printer, bluetooth",
        aiDiagnosticsSupported: true, drQbitSupported: true, difficultyLevel: "Beginner", installationTime: "10 minutes",
      },
      {
        name: "CD-101 Heavy-Duty Cash Drawer", brand: "QBITHub", manufacturer: "QBITHub Technologies",
        model: "CD101", slug: "qbithub-cash-drawer-cd-101", deviceType: "cash_drawer",
        sku: "QBC-101-001", serialPattern: "^CD101-[0-9]{6}$",
        description: "Professional-grade cash drawer with steel construction and RJ11 + USB interface.",
        imageUrl: "/uploads/products/cd-101.png", category: "cash-drawer",
        isFeatured: false, isTrending: false, startingPrice: "₹4,500",
        specifications: JSON.stringify([{ property: "Construction", value: "Steel" }, { property: "Tray", value: "5B/8C" }, { property: "Interface", value: "RJ11 + USB" }]),
        status: "active", isActive: true, isDraft: false, isPublished: true,
        latestDriverVersion: "N/A", latestFirmwareVersion: "N/A",
        supportsWifi: false, autoDriverInstall: false, connectionTypes: "usb",
        tags: "cash drawer, POS, RJ11",
        aiDiagnosticsSupported: false, drQbitSupported: true, difficultyLevel: "Beginner", installationTime: "10 minutes",
      },
      {
        name: "CD-9 Customer Display", brand: "QBITHub", manufacturer: "QBITHub Technologies",
        model: "CD9", slug: "qbithub-customer-display-cd-9", deviceType: "customer_display",
        sku: "QBD-9-001", serialPattern: "^CD9-[0-9]{6}$",
        description: "9-inch VFD/LCD customer display for crystal-clear transaction visibility.",
        imageUrl: "/uploads/products/cd-9-display.png", category: "customer-side-display",
        isFeatured: false, isTrending: false, startingPrice: "₹6,000",
        specifications: JSON.stringify([{ property: "Display", value: "9\" VFD/LCD" }, { property: "Interface", value: "USB + RS232" }]),
        status: "active", isActive: true, isDraft: false, isPublished: true,
        latestDriverVersion: "N/A", latestFirmwareVersion: "N/A",
        supportsWifi: false, autoDriverInstall: false, connectionTypes: "usb",
        tags: "customer display, VFD, POS display",
        aiDiagnosticsSupported: false, drQbitSupported: true, difficultyLevel: "Beginner", installationTime: "10 minutes",
      },
      {
        name: "AP5 Android POS Terminal", brand: "QBITHub", manufacturer: "QBITHub Technologies",
        model: "AP5", slug: "qbithub-android-pos-ap5", deviceType: "android_pos",
        sku: "QBA-AP5-001", serialPattern: "^AP5-[0-9]{6}$",
        description: "Premium Android POS terminal with 5.5\" HD touchscreen and NFC + fingerprint.",
        imageUrl: "/uploads/products/ap5-android.png", category: "android-pos",
        isFeatured: true, isTrending: true, badgeLabel: "Newly Released", startingPrice: "₹18,000",
        specifications: JSON.stringify([{ property: "Display", value: "5.5\" HD IPS" }, { property: "CPU", value: "Octa-core ARM" }, { property: "RAM", value: "3GB" }]),
        features: JSON.stringify([{ icon: "phone_android", title: "Android POS", description: "5.5\" HD display" }, { icon: "fingerprint", title: "NFC + Fingerprint", description: "Complete security suite" }]),
        operatingSystems: JSON.stringify([{ icon: "phone_android", label: "Android 11" }]),
        status: "active", isActive: true, isDraft: false, isPublished: true,
        viewCount: 1800, downloadCount: 1200,
        latestDriverVersion: "v1.0.0", latestFirmwareVersion: "v1.3.0",
        supportsWifi: true, autoDriverInstall: true, sdkAvailable: true, firmwareConfigSupported: true,
        connectionTypes: "usb,wifi,bluetooth,4g", tags: "Android POS, mobile POS, NFC",
        aiDiagnosticsSupported: true, drQbitSupported: true, difficultyLevel: "Intermediate", installationTime: "30 minutes",
      },
      {
        name: "L60 Label Printer", brand: "QBITHub", manufacturer: "QBITHub Technologies",
        model: "L60", slug: "qbithub-label-printer-l60", deviceType: "label_printer",
        sku: "QBL-60-001", serialPattern: "^L60-[0-9]{6}$",
        description: "Professional direct-thermal label printer for shipping labels and product tagging.",
        imageUrl: "/uploads/products/l60-label.png", category: "barcode-printer",
        isFeatured: false, isTrending: false, startingPrice: "₹14,000",
        specifications: JSON.stringify([{ property: "Print Width", value: "108mm (4-inch)" }, { property: "Speed", value: "150mm/sec" }, { property: "Resolution", value: "203 DPI" }]),
        features: JSON.stringify([{ icon: "label", title: "4-inch Width", description: "Standard shipping labels" }, { icon: "speed", title: "150mm/sec", description: "High-volume output" }]),
        operatingSystems: JSON.stringify([{ icon: "desktop_windows", label: "Windows 10/11" }, { icon: "linux", label: "Linux" }]),
        status: "active", isActive: true, isDraft: false, isPublished: true,
        viewCount: 560, downloadCount: 380,
        latestDriverVersion: "v2.0.1", latestFirmwareVersion: "N/A",
        supportsWifi: true, autoDriverInstall: true, sdkAvailable: true, firmwareConfigSupported: false,
        connectionTypes: "usb,lan,wifi", tags: "label printer, shipping label, barcode label",
        aiDiagnosticsSupported: true, drQbitSupported: true, difficultyLevel: "Beginner", installationTime: "20 minutes",
      },
    ];

    for (const product of products) {
      await db.qbitProduct.upsert({ where: { slug: product.slug }, update: product, create: product });
    }
    results.products = products.length;

    // 5. Seed Common Error Codes
    const errorCodes = [
      { code: "ERR_PAPER_OUT", meaning: "Paper roll is empty", possibleCause: "Paper roll depleted", resolution: "Replace the paper roll", severity: "warning" },
      { code: "ERR_COVER_OPEN", meaning: "Printer cover is open", possibleCause: "Cover not closed", resolution: "Close the cover firmly", severity: "warning" },
      { code: "ERR_HEAD_OVERTEMP", meaning: "Print head overheating", possibleCause: "Continuous high-volume printing", resolution: "Pause printing, clean head", severity: "error" },
      { code: "ERR_CUTTER_JAM", meaning: "Auto-cutter jammed", possibleCause: "Paper debris in cutter", resolution: "Remove debris, reset cutter", severity: "warning" },
      { code: "ERR_USB_DISCONNECT", meaning: "USB connection lost", possibleCause: "Cable disconnected", resolution: "Reconnect USB cable", severity: "error" },
      { code: "ERR_LAN_TIMEOUT", meaning: "LAN timeout", possibleCause: "Network issue", resolution: "Verify network, check IP settings", severity: "error" },
      { code: "ERR_BT_PAIR_FAIL", meaning: "Bluetooth pairing failed", possibleCause: "Device not in pairing mode", resolution: "Enable pairing mode, check range", severity: "warning" },
      { code: "ERR_NFC_READ_FAIL", meaning: "NFC read failure", possibleCause: "Card positioning issue", resolution: "Reposition card, verify compatibility", severity: "warning" },
    ];
    for (const ec of errorCodes) {
      await db.commonError.upsert({ where: { code: ec.code }, update: ec, create: ec });
    }
    results.errorCodes = errorCodes.length;

    // 6. Seed Super Admin User
    const bcrypt = require("bcryptjs");
    const adminHash = await bcrypt.hash("AdminQbit2024!", 12);
    await db.user.upsert({
      where: { email: "admin@qbithub.com" },
      update: { role: "super_admin", passwordHash: adminHash },
      create: { email: "admin@qbithub.com", name: "QBIT Super Admin", role: "super_admin", passwordHash: adminHash },
    });
    results.users = 1;

    // 7. Seed Announcement
    await db.announcement.upsert({
      where: { id: "welcome-announcement" },
      update: {},
      create: {
        id: "welcome-announcement",
        title: "Welcome to QBIT Hub Enterprise Support Portal",
        body: "Your comprehensive resource for drivers, firmware, manuals, installation guides, and Dr. QBIT diagnostics. Browse our product catalog, search by serial number, or use Dr. QBIT to auto-detect your connected hardware.",
        type: "info",
        severity: "info",
        visibility: "public",
        active: true,
      },
    });
    results.announcements = 1;

    return NextResponse.json({
      success: true,
      message: "Database seeded with production data",
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const counts = {
      products: await db.qbitProduct.count(),
      resources: await db.resource.count(),
      articles: await db.knowledgeArticle.count(),
      categories: await db.knowledgeCategory.count(),
      guides: await db.installationGuide.count(),
      errorCodes: await db.commonError.count(),
      users: await db.user.count(),
      announcements: await db.announcement.count(),
    };
    return NextResponse.json({ status: "ok", counts });
  } catch (error: unknown) {
    return NextResponse.json({ status: "error", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
