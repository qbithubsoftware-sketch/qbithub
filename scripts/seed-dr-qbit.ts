/**
 * Seed Dr. QBIT Device Detection Engine — products, signatures, scan sessions, devices.
 *
 * Run with: `npx tsx scripts/seed-dr-qbit.ts`
 *
 * Creates:
 *   - 6 QbitProduct rows (T-800 printer, BS-550 scanner, HUB-X Pro, etc.)
 *   - 4 HardwareSignature rows (VID/PID mappings for known products)
 *   - 2 ScanSession rows (demo scans)
 *   - 5 DetectedDevice rows (matched devices across USB/COM/LAN/WiFi)
 *   - 2 UnknownDevice rows (unmapped — for admin mapping demo)
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding Dr. QBIT Device Detection Engine...");

  // -------- 1. QBIT Products --------
  const products = [
    {
      id: "prod_t800",
      name: "QBIT T-800 Thermal Printer",
      brand: "QBIT",
      manufacturer: "QBIT Technologies",
      model: "T-800",
      deviceType: "thermal_printer",
      description: "High-speed 80mm thermal receipt printer with USB + LAN + WiFi connectivity.",
      driverDownloadUrl: "https://qbithub.vercel.app/?screen=driver-download-center&category=driver&model=T-800",
      manualUrl: "https://qbithub.vercel.app/?screen=driver-download-center&category=manual&model=T-800",
      installationGuideUrl: "https://qbithub.vercel.app/?screen=installation-center&model=T-800",
      knowledgeBaseUrl: "https://qbithub.vercel.app/?screen=ai-support-center",
    },
    {
      id: "prod_bs550",
      name: "QBIT BS-550 Barcode Scanner",
      brand: "QBIT",
      manufacturer: "QBIT Technologies",
      model: "BS-550",
      deviceType: "barcode_scanner",
      description: "2D omnidirectional barcode scanner with USB HID + RS-232 interfaces.",
    },
    {
      id: "prod_hubx",
      name: "QBIT HUB-X Pro Hub",
      brand: "QBIT",
      manufacturer: "QBIT Technologies",
      model: "HUB-X-Pro",
      deviceType: "windows_pos",
      description: "All-in-one POS terminal with 15.6\" touchscreen, Windows 11 IoT Enterprise.",
    },
    {
      id: "prod_cd200",
      name: "QBIT CD-200 Cash Drawer",
      brand: "QBIT",
      manufacturer: "QBIT Technologies",
      model: "CD-200",
      deviceType: "cash_drawer",
      description: "Compact cash drawer with 12V RJ-11 trigger + USB interface.",
    },
    {
      id: "prod_ld300",
      name: "QBIT LD-300 Label Printer",
      brand: "QBIT",
      manufacturer: "QBIT Technologies",
      model: "LD-300",
      deviceType: "label_printer",
      description: "Direct thermal label printer, 4-inch print width, USB + LAN.",
    },
    {
      id: "prod_ws100",
      name: "QBIT WS-100 Weighing Scale",
      brand: "QBIT",
      manufacturer: "QBIT Technologies",
      model: "WS-100",
      deviceType: "weighing_scale",
      description: "Precision retail weighing scale with COM port + LAN connectivity.",
    },
  ];

  for (const p of products) {
    await db.qbitProduct.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }
  console.log(`  ✓ ${products.length} QBIT products seeded`);

  // -------- 2. Hardware Signatures (VID/PID + MAC prefix) --------
  const signatures = [
    // T-800 printer — USB VID 0x1E90 (QBIT), PID 0x8001
    { productId: "prod_t800", vendorId: "1E90", productIdCode: "8001", connectionType: "usb", manufacturer: "QBIT Technologies", model: "T-800" },
    // T-800 printer — LAN MAC prefix 00:1E:90 (QBIT OUI)
    { productId: "prod_t800", macPrefix: "00:1E:90", connectionType: "lan", manufacturer: "QBIT Technologies", model: "T-800", openPorts: "[9100, 515]" },
    // BS-550 scanner — USB VID 0x1E90, PID 0x5501
    { productId: "prod_bs550", vendorId: "1E90", productIdCode: "5501", connectionType: "usb", manufacturer: "QBIT Technologies", model: "BS-550" },
    // HUB-X Pro — USB VID 0x1E90, PID 0x9001
    { productId: "prod_hubx", vendorId: "1E90", productIdCode: "9001", connectionType: "usb", manufacturer: "QBIT Technologies", model: "HUB-X-Pro" },
    // CD-200 cash drawer — USB VID 0x1E90, PID 0xC200
    { productId: "prod_cd200", vendorId: "1E90", productIdCode: "C200", connectionType: "usb", manufacturer: "QBIT Technologies", model: "CD-200" },
    // LD-300 label printer — LAN MAC prefix 00:1E:90
    { productId: "prod_ld300", macPrefix: "00:1E:90", connectionType: "lan", manufacturer: "QBIT Technologies", model: "LD-300" },
  ];

  for (const sig of signatures) {
    const existing = await db.hardwareSignature.findFirst({
      where: { productId: sig.productId, vendorId: sig.vendorId ?? null, productIdCode: sig.productIdCode ?? null },
    });
    if (!existing) {
      await db.hardwareSignature.create({ data: sig });
    }
  }
  console.log(`  ✓ ${signatures.length} hardware signatures seeded`);

  // -------- 3. Scan Sessions --------
  const engineer = await db.user.findUnique({ where: { email: "engineer@qbithub.com" } });
  const customer = await db.fSMCustomer.findUnique({ where: { id: "cust_retailx" } });
  const workOrder = await db.workOrder.findUnique({ where: { id: "wo_94281" } });

  // Session 1: Recent scan at RetailX Mart
  const session1 = await db.scanSession.upsert({
    where: { sessionToken: "scan_retailx_001" },
    update: {},
    create: {
      sessionToken: "scan_retailx_001",
      engineerId: engineer?.id ?? null,
      engineerName: engineer?.name ?? "Alex Chen",
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? "Vikram Patel",
      workOrderId: workOrder?.id ?? null,
      agentVersion: "2.0.1",
      osInfo: "Windows 11 Pro x64",
      hostname: "ENGINEER-LAPTOP-01",
      scanDurationMs: 3420,
      deviceCount: 4,
      usbCount: 2,
      comCount: 1,
      lanCount: 1,
      wifiCount: 0,
      status: "completed",
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });
  console.log(`  ✓ Scan session 1: ${session1.sessionToken}`);

  // Session 2: Older scan at a different site
  const session2 = await db.scanSession.upsert({
    where: { sessionToken: "scan_medico_001" },
    update: {},
    create: {
      sessionToken: "scan_medico_001",
      engineerId: engineer?.id ?? null,
      engineerName: engineer?.name ?? "Alex Chen",
      customerId: "cust_medico",
      customerName: "Dr. Anjali Sharma",
      agentVersion: "2.0.0",
      osInfo: "Windows 10 Pro x64",
      hostname: "ENGINEER-LAPTOP-01",
      scanDurationMs: 2890,
      deviceCount: 3,
      usbCount: 1,
      comCount: 0,
      lanCount: 1,
      wifiCount: 1,
      status: "completed",
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });
  console.log(`  ✓ Scan session 2: ${session2.sessionToken}`);

  // -------- 4. Detected Devices (matched) --------
  // Session 1 devices
  const detectedDevices = [
    // USB — T-800 Thermal Printer (matched via VID/PID)
    {
      scanSessionId: session1.id,
      connectionType: "usb",
      port: "USB001",
      deviceName: "QBIT T-800 Thermal Printer",
      manufacturer: "QBIT Technologies",
      brand: "QBIT",
      model: "T-800",
      hardwareId: "USB\\VID_1E90&PID_8001\\T800SN001",
      vendorId: "1E90",
      productIdCode: "8001",
      serialNumber: "T800-SN-001",
      usbVersion: "2.0",
      status: "ready",
      matchedProductId: "prod_t800",
      matchConfidence: 1.0,
      matchMethod: "vid_pid",
    },
    // USB — BS-550 Barcode Scanner (matched via VID/PID)
    {
      scanSessionId: session1.id,
      connectionType: "usb",
      port: "USB002",
      deviceName: "QBIT BS-550 Barcode Scanner",
      manufacturer: "QBIT Technologies",
      brand: "QBIT",
      model: "BS-550",
      hardwareId: "USB\\VID_1E90&PID_5501\\BS550SN001",
      vendorId: "1E90",
      productIdCode: "5501",
      serialNumber: "BS550-SN-001",
      usbVersion: "2.0",
      status: "ready",
      matchedProductId: "prod_bs550",
      matchConfidence: 1.0,
      matchMethod: "vid_pid",
    },
    // COM — CD-200 Cash Drawer (matched via VID/PID on USB-COM adapter)
    {
      scanSessionId: session1.id,
      connectionType: "com",
      port: "COM3",
      deviceName: "QBIT CD-200 Cash Drawer",
      manufacturer: "QBIT Technologies",
      brand: "QBIT",
      model: "CD-200",
      vendorId: "1E90",
      productIdCode: "C200",
      status: "ready",
      matchedProductId: "prod_cd200",
      matchConfidence: 1.0,
      matchMethod: "vid_pid",
    },
    // LAN — T-800 printer (second unit, network) matched via MAC prefix
    {
      scanSessionId: session1.id,
      connectionType: "lan",
      port: "192.168.1.50:9100",
      deviceName: "QBIT T-800 Thermal Printer",
      manufacturer: "QBIT Technologies",
      brand: "QBIT",
      model: "T-800",
      ipAddress: "192.168.1.50",
      macAddress: "00:1E:90:AB:CD:01",
      hostname: "QBIT-T800-LAN",
      openPorts: "[9100, 515, 80]",
      status: "ready",
      matchedProductId: "prod_t800",
      matchConfidence: 0.9,
      matchMethod: "mac_prefix",
    },
  ];

  for (const d of detectedDevices) {
    const existing = await db.detectedDevice.findFirst({
      where: { scanSessionId: d.scanSessionId, vendorId: d.vendorId ?? null, productIdCode: d.productIdCode ?? null, port: d.port ?? null },
    });
    if (!existing) {
      await db.detectedDevice.create({ data: d });
    }
  }
  console.log(`  ✓ ${detectedDevices.length} detected devices seeded (session 1)`);

  // Session 2 devices
  const session2Devices = [
    // WiFi — HUB-X Pro (matched via model)
    {
      scanSessionId: session2.id,
      connectionType: "wifi",
      port: "192.168.1.100",
      deviceName: "QBIT HUB-X Pro",
      manufacturer: "QBIT Technologies",
      brand: "QBIT",
      model: "HUB-X-Pro",
      ipAddress: "192.168.1.100",
      macAddress: "00:1E:90:EF:01:01",
      hostname: "HUBX-PRO-001",
      signalQuality: 85,
      status: "ready",
      matchedProductId: "prod_hubx",
      matchConfidence: 0.8,
      matchMethod: "manufacturer_model",
    },
    // LAN — LD-300 Label Printer
    {
      scanSessionId: session2.id,
      connectionType: "lan",
      port: "192.168.1.60:9100",
      deviceName: "QBIT LD-300 Label Printer",
      manufacturer: "QBIT Technologies",
      brand: "QBIT",
      model: "LD-300",
      ipAddress: "192.168.1.60",
      macAddress: "00:1E:90:AB:CD:02",
      hostname: "QBIT-LD300",
      openPorts: "[9100]",
      status: "ready",
      matchedProductId: "prod_ld300",
      matchConfidence: 0.9,
      matchMethod: "mac_prefix",
    },
  ];

  for (const d of session2Devices) {
    const existing = await db.detectedDevice.findFirst({
      where: { scanSessionId: d.scanSessionId, macAddress: d.macAddress },
    });
    if (!existing) {
      await db.detectedDevice.create({ data: d });
    }
  }
  console.log(`  ✓ ${session2Devices.length} detected devices seeded (session 2)`);

  // -------- 5. Unknown Devices (unmapped — for admin mapping demo) --------
  const unknownDevices = [
    // Unknown USB device — VID 0x1234 (not in our signature DB)
    {
      scanSessionId: session1.id,
      hardwareId: "USB\\VID_1234&PID_5678\\UNKNOWN001",
      vendorId: "1234",
      productIdCode: "5678",
      deviceName: "Generic USB Device",
      manufacturer: "Unknown",
      model: "Unknown",
      connectionType: "usb",
      port: "USB003",
    },
    // Unknown LAN device — unrecognized MAC prefix
    {
      scanSessionId: session2.id,
      hardwareId: null,
      vendorId: null,
      productIdCode: null,
      deviceName: "Unknown Network Printer",
      manufacturer: "Unknown",
      model: "Unknown",
      connectionType: "lan",
      port: "192.168.1.77:9100",
      macAddress: "AA:BB:CC:DD:EE:FF",
      ipAddress: "192.168.1.77",
    },
  ];

  for (const d of unknownDevices) {
    const existing = await db.unknownDevice.findFirst({
      where: { scanSessionId: d.scanSessionId, vendorId: d.vendorId ?? null, macAddress: d.macAddress ?? null },
    });
    if (!existing) {
      await db.unknownDevice.create({ data: d });
    }
  }
  console.log(`  ✓ ${unknownDevices.length} unknown devices seeded (for admin mapping demo)`);

  console.log("\nDone. Dr. QBIT Device Detection Engine seeded.");
  console.log("\nDemo data summary:");
  console.log("  - 6 QBIT products (T-800, BS-550, HUB-X Pro, CD-200, LD-300, WS-100)");
  console.log("  - 6 hardware signatures (VID/PID + MAC prefix)");
  console.log("  - 2 scan sessions (RetailX + Medico)");
  console.log("  - 6 detected devices (all matched, 4 USB + 1 COM + 3 LAN + 1 WiFi)");
  console.log("  - 2 unknown devices (for admin mapping demo)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
