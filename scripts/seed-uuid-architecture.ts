/**
 * Seed script for QBIT Universal Device Identity Architecture
 *
 * Creates demo devices showcasing the UUID architecture:
 *   1. Device with unique serial (normal case)
 *   2. Device with duplicate serial (demonstrates resolution)
 *   3. Device with chip UID (high-quality fingerprint)
 *   4. Device with Bluetooth MAC (high-quality fingerprint)
 */

import { db } from "../src/lib/db";

async function main() {
  console.log("[Seed UUID Architecture] Starting...");

  // Get or create a customer account
  const customer = await db.customerAccount.upsert({
    where: { mobileNumber: "9876543210" },
    update: {},
    create: {
      mobileNumber: "9876543210",
      name: "Rajesh Kumar",
      companyName: "Sharma Retail Pvt Ltd",
      email: "rajesh@sharmaretail.com",
      gstNumber: "29AAACR5055K1Z5",
      city: "Bangalore",
      state: "Karnataka",
      pinCode: "560001",
      status: "active",
    },
  });

  // Get or create a dealer user
  const dealer = await db.user.upsert({
    where: { email: "dealer@qbit.tech" },
    update: {},
    create: {
      email: "dealer@qbit.tech",
      name: "Vikram Singh",
      role: "dealer",
      passwordHash: "demo_hash",
    },
  });

  // Get an existing product or create one
  let product = await db.qbitProduct.findFirst({
    where: { model: "T-800" },
  });

  if (!product) {
    product = await db.qbitProduct.create({
      data: {
        name: "QBIT T-800 Thermal Printer",
        brand: "QBIT",
        model: "T-800",
        slug: "qbit-t-800-thermal-printer",
        deviceType: "thermal_printer",
        category: "thermal-printer",
        description: "Professional 80mm thermal receipt printer with auto-cutter",
        imageUrl: "/qbit-hero-illustration.png",
        isActive: true,
        status: "active",
        isFeatured: true,
        isTrending: true,
        latestDriverVersion: "v2.4.1",
      },
    });
  }

  let product2 = await db.qbitProduct.findFirst({
    where: { model: "P80 Alpha" },
  });

  if (!product2) {
    product2 = await db.qbitProduct.create({
      data: {
        name: "QBIT P80 Alpha Portable Printer",
        brand: "QBIT",
        model: "P80 Alpha",
        slug: "qbit-p80-alpha-portable-printer",
        deviceType: "portable_printer",
        category: "portable-printer",
        description: "Bluetooth portable receipt printer for mobile POS",
        imageUrl: "/qbit-hero-illustration.png",
        isActive: true,
        status: "active",
        isFeatured: true,
        isTrending: true,
        latestDriverVersion: "v1.8.0",
      },
    });
  }

  // === Device 1: Normal device with unique serial ===
  const uuid1 = "QBT-7F31B5D4-9A81-4D2E-AB74-1C57A91F93D2";
  const existing1 = await db.devicePassport.findUnique({ where: { deviceUuid: uuid1 } });
  if (!existing1) {
    await db.devicePassport.create({
      data: {
        passportNumber: "PASS-000001",
        deviceUuid: uuid1,
        serialNumber: "QBT-T800-2026-001",
        deviceName: "QBIT T-800 Thermal Printer",
        manufacturer: "QBIT Technologies",
        brand: "QBIT",
        model: "T-800",
        productCode: "QBT-T800",
        firmwareVersion: "v5.1.0",
        hardwareRevision: "Rev C",
        vendorId: "0x04B8",
        productIdCode: "0x0202",
        connectionType: "usb",
        chipUid: "STM32F103-UID-7F31B5D4",
        factoryDeviceUuid: "QBT-FACTORY-7F31B5D4",
        usbDeviceInstanceId: "USB\\VID_04B8&PID_0202\\QBT-T800-2026-001",
        usbContainerId: "{7f31b5d4-9a81-4d2e-ab74-1c57a91f93d2}",
        hardwareFingerprint: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
        fingerprintQuality: "high",
        primaryIdentifier: "chipUid",
        duplicateSerialFlag: false,
        qrCode: `QBT://DEVICE/${uuid1}`,
        productImage: product.imageUrl,
        productCategory: "thermal_printer",
        productId: product.id,
        customerId: customer.id,
        dealerId: dealer.id,
        invoiceNumber: "INV-2026-001",
        purchaseDate: new Date("2026-03-15"),
        warrantyStartDate: new Date("2026-03-15"),
        warrantyEndDate: new Date("2027-03-15"),
        registrationDate: new Date("2026-03-15"),
        activationDate: new Date("2026-03-16"),
        deviceStatus: "active",
        firstConnectedAt: new Date("2026-03-15"),
        lastConnectedAt: new Date("2026-07-20"),
        connectionCount: 12,
        firstDetectedAt: new Date("2026-03-15"),
      },
    });
    console.log("[Seed UUID] Created Device 1: QBT-T800-2026-001 (unique serial)");
  } else {
    console.log("[Seed UUID] Device 1 already exists");
  }

  // === Device 2: Device with duplicate serial (demonstrates resolution) ===
  const uuid2 = "QBT-A2C3E4F5-6789-4BCD-EF01-23456789ABCD";
  const existing2 = await db.devicePassport.findUnique({ where: { deviceUuid: uuid2 } });
  if (!existing2) {
    await db.devicePassport.create({
      data: {
        passportNumber: "PASS-000002",
        deviceUuid: uuid2,
        // SAME serial as Device 3 — demonstrates duplicate serial handling!
        serialNumber: "QBT-P80-DUP-SERIAL",
        deviceName: "QBIT P80 Alpha Portable Printer",
        manufacturer: "QBIT Technologies",
        brand: "QBIT",
        model: "P80 Alpha",
        productCode: "QBT-P80A",
        firmwareVersion: "v1.8.0",
        hardwareRevision: "Rev A",
        vendorId: "0x04B8",
        productIdCode: "0x0303",
        connectionType: "bluetooth",
        bluetoothMacAddress: "AA:BB:CC:DD:EE:01",
        usbDeviceInstanceId: "USB\\VID_04B8&PID_0303\\QBT-P80-DUP-SERIAL-A2C3",
        hardwareFingerprint: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
        fingerprintQuality: "high",
        primaryIdentifier: "bluetoothMac",
        duplicateSerialFlag: true,
        qrCode: `QBT://DEVICE/${uuid2}`,
        productImage: product2.imageUrl,
        productCategory: "portable_printer",
        productId: product2.id,
        customerId: customer.id,
        dealerId: dealer.id,
        invoiceNumber: "INV-2026-002",
        purchaseDate: new Date("2026-04-10"),
        warrantyStartDate: new Date("2026-04-10"),
        warrantyEndDate: new Date("2027-04-10"),
        registrationDate: new Date("2026-04-10"),
        activationDate: new Date("2026-04-11"),
        deviceStatus: "active",
        firstConnectedAt: new Date("2026-04-10"),
        lastConnectedAt: new Date("2026-07-18"),
        connectionCount: 8,
        firstDetectedAt: new Date("2026-04-10"),
      },
    });
    console.log("[Seed UUID] Created Device 2: QBT-P80-DUP-SERIAL (duplicate serial, resolved by UUID)");
  } else {
    console.log("[Seed UUID] Device 2 already exists");
  }

  // === Device 3: Another device with SAME serial number (duplicate) ===
  const uuid3 = "QBT-F6E5D4C3-B2A1-9876-5432-10FEDCBA9876";
  const existing3 = await db.devicePassport.findUnique({ where: { deviceUuid: uuid3 } });
  if (!existing3) {
    await db.devicePassport.create({
      data: {
        passportNumber: "PASS-000003",
        deviceUuid: uuid3,
        // SAME serial as Device 2 — duplicate serial demonstration
        serialNumber: "QBT-P80-DUP-SERIAL",
        deviceName: "QBIT P80 Alpha Portable Printer",
        manufacturer: "QBIT Technologies",
        brand: "QBIT",
        model: "P80 Alpha",
        productCode: "QBT-P80A",
        firmwareVersion: "v1.7.5",
        hardwareRevision: "Rev B",
        vendorId: "0x04B8",
        productIdCode: "0x0303",
        connectionType: "bluetooth",
        bluetoothMacAddress: "AA:BB:CC:DD:EE:02",
        usbDeviceInstanceId: "USB\\VID_04B8&PID_0303\\QBT-P80-DUP-SERIAL-F6E5",
        hardwareFingerprint: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        fingerprintQuality: "high",
        primaryIdentifier: "bluetoothMac",
        duplicateSerialFlag: true,
        qrCode: `QBT://DEVICE/${uuid3}`,
        productImage: product2.imageUrl,
        productCategory: "portable_printer",
        productId: product2.id,
        // Different customer, dealer, and invoice
        customerId: customer.id,
        dealerId: dealer.id,
        invoiceNumber: "INV-2026-003",
        purchaseDate: new Date("2026-05-20"),
        warrantyStartDate: new Date("2026-05-20"),
        warrantyEndDate: new Date("2027-05-20"),
        registrationDate: new Date("2026-05-20"),
        deviceStatus: "active",
        firstConnectedAt: new Date("2026-05-20"),
        lastConnectedAt: new Date("2026-07-15"),
        connectionCount: 5,
        firstDetectedAt: new Date("2026-05-20"),
      },
    });
    console.log("[Seed UUID] Created Device 3: QBT-P80-DUP-SERIAL (duplicate serial, resolved by UUID)");
  } else {
    console.log("[Seed UUID] Device 3 already exists");
  }

  // === Device 4: Low-quality fingerprint (only VID+PID+Serial) ===
  const uuid4 = "QBT-11223344-5566-7788-99AA-BBCCDDEEFF00";
  const existing4 = await db.devicePassport.findUnique({ where: { deviceUuid: uuid4 } });
  if (!existing4) {
    await db.devicePassport.create({
      data: {
        passportNumber: "PASS-000004",
        deviceUuid: uuid4,
        serialNumber: "GENERIC-SN-12345",
        deviceName: "Generic Thermal Printer",
        manufacturer: "Generic Brand",
        brand: "Generic",
        model: "TP-58mm",
        firmwareVersion: "v1.0.0",
        vendorId: "0x04B8",
        productIdCode: "0x0202",
        connectionType: "usb",
        hardwareFingerprint: "d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5",
        fingerprintQuality: "low",
        primaryIdentifier: "usbSerialNumber",
        duplicateSerialFlag: false,
        qrCode: `QBT://DEVICE/${uuid4}`,
        productCategory: "thermal_printer",
        registrationDate: new Date("2026-06-01"),
        deviceStatus: "registered",
        firstConnectedAt: new Date("2026-06-01"),
        lastConnectedAt: new Date(),
        connectionCount: 3,
        firstDetectedAt: new Date("2026-06-01"),
      },
    });
    console.log("[Seed UUID] Created Device 4: Generic (low-quality fingerprint)");
  } else {
    console.log("[Seed UUID] Device 4 already exists");
  }

  // Create warranty records for devices with warranty
  for (const passportNum of ["PASS-000001", "PASS-000002", "PASS-000003"]) {
    const existingWarranty = await db.deviceWarranty.findFirst({
      where: { passport: { passportNumber: passportNum } },
    });
    if (!existingWarranty) {
      const passport = await db.devicePassport.findUnique({
        where: { passportNumber: passportNum },
      });
      if (passport) {
        await db.deviceWarranty.create({
          data: {
            passportId: passport.id,
            purchaseDate: passport.purchaseDate,
            warrantyStartDate: passport.warrantyStartDate,
            warrantyExpiryDate: passport.warrantyEndDate,
            warrantyStatus: passport.warrantyEndDate && new Date(passport.warrantyEndDate) > new Date() ? "active" : "expired",
            warrantyDaysRemaining: passport.warrantyEndDate
              ? Math.ceil((new Date(passport.warrantyEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null,
          },
        });
      }
    }
  }

  console.log("[Seed UUID Architecture] Complete!");
  console.log("  Device 1: UUID=QBT-7F31B5D4-9A81-4D2E-AB74-1C57A91F93D2 (unique serial)");
  console.log("  Device 2: UUID=QBT-A2C3E4F5-6789-4BCD-EF01-23456789ABCD (duplicate serial)");
  console.log("  Device 3: UUID=QBT-F6E5D4C3-B2A1-9876-5432-10FEDCBA9876 (same serial as Device 2)");
  console.log("  Device 4: UUID=QBT-11223344-5566-7788-99AA-BBCCDDEEFF00 (low-quality fingerprint)");
}

main()
  .catch((e) => {
    console.error("[Seed UUID Architecture] Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
