/**
 * Seed 3 demo customer devices with SNQBT serial numbers + add internal
 * (engineer/admin) media files to verify RBAC filtering.
 *
 * Devices:
 *   1. SNQBT000001  — Rahul Sharma / ABC Restaurant / Jaipur
 *      QBIT Thermal Printer P80UE / 365-day warranty / Active / ~273 days left
 *   2. SNQBT000002  — Priya Verma / Fresh Cafe / Delhi
 *      QBIT Barcode Scanner 2DSW / Expired warranty
 *   3. SNQBT000003  — Amit Patel / Retail Mart / Ahmedabad
 *      QBIT POS Machine W512 / Active warranty
 *
 * Also seeds ProductMedia rows for each product with mixed visibility:
 *   - 4 public media (Windows Driver, Android Driver, Manual, Installation Guide)
 *   - 2 engineer-only media (Engineer Repair Manual, Test Diagnostic Tool)
 *   - 2 admin-only media (Admin Security Tool, Internal Production Firmware)
 *
 * Verification: /api/public/serial-lookup should return ONLY the 4 public rows
 * for each device.
 *
 * Run with: source /tmp/prod-db.env && npx tsx scripts/seed-snqbt-demo.ts
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

interface DeviceSeed {
  serial: string;
  customer: { name: string; company: string; mobile: string; email: string; city: string; state: string; address: string };
  productSlug: string;
  purchaseDate: Date;
  warrantyExpiry: Date;
  warrantyStatus: "active" | "expired";
}

const DEVICES: DeviceSeed[] = [
  {
    serial: "SNQBT000001",
    customer: {
      name: "Rahul Sharma",
      company: "ABC Restaurant",
      mobile: "9829012345",
      email: "rahul.sharma@abcrestaurant.in",
      city: "Jaipur",
      state: "Rajasthan",
      address: "12, MI Road, Jaipur, Rajasthan 302001",
    },
    productSlug: "p80ue",
    // Purchase: 15 April 2026, 365-day warranty → expires 15 April 2027
    purchaseDate: new Date("2026-04-15"),
    warrantyExpiry: new Date("2027-04-15"),
    warrantyStatus: "active",
  },
  {
    serial: "SNQBT000002",
    customer: {
      name: "Priya Verma",
      company: "Fresh Cafe",
      mobile: "9910023456",
      email: "priya@freshcafe.in",
      city: "Delhi",
      state: "Delhi",
      address: "44, Connaught Place, New Delhi 110001",
    },
    productSlug: "2dsw",
    // Purchase: 10 Jan 2024, 1-year warranty → already expired
    purchaseDate: new Date("2024-01-10"),
    warrantyExpiry: new Date("2025-01-10"),
    warrantyStatus: "expired",
  },
  {
    serial: "SNQBT000003",
    customer: {
      name: "Amit Patel",
      company: "Retail Mart",
      mobile: "9090987654",
      email: "amit.patel@retailmart.in",
      city: "Ahmedabad",
      state: "Gujarat",
      address: "78, SG Highway, Ahmedabad, Gujarat 380015",
    },
    productSlug: "w512",
    // Purchase: 1 March 2026, 2-year warranty → Active
    purchaseDate: new Date("2026-03-01"),
    warrantyExpiry: new Date("2028-03-01"),
    warrantyStatus: "active",
  },
];

async function main() {
  console.log("=== Seeding 3 SNQBT demo devices + RBAC media files ===\n");

  for (const d of DEVICES) {
    console.log(`--- ${d.serial} (${d.customer.name}) ---`);

    // ===== 1. Get the linked product =====
    const product = await db.qbitProduct.findUnique({ where: { slug: d.productSlug } });
    if (!product) {
      console.log(`  ✗ Product not found for slug: ${d.productSlug}`);
      continue;
    }

    // ===== 2. Upsert FSMCustomer =====
    let customer = await db.fSMCustomer.findFirst({
      where: {
        OR: [
          { phone: d.customer.mobile },
          { email: d.customer.email },
        ],
      },
    });

    if (customer) {
      customer = await db.fSMCustomer.update({
        where: { id: customer.id },
        data: {
          name: d.customer.name,
          companyName: d.customer.company,
          phone: d.customer.mobile,
          email: d.customer.email,
          addressLine: d.customer.address,
          city: d.customer.city,
          state: d.customer.state,
          postalCode: null,
          country: "India",
        },
      });
    } else {
      customer = await db.fSMCustomer.create({
        data: {
          name: d.customer.name,
          companyName: d.customer.company,
          phone: d.customer.mobile,
          email: d.customer.email,
          addressLine: d.customer.address,
          city: d.customer.city,
          state: d.customer.state,
          country: "India",
        },
      });
    }
    console.log(`  ✓ FSMCustomer: ${customer.id}`);

    // ===== 3. Upsert FSMCustomerAsset (the device itself) =====
    const existingAsset = await db.fSMCustomerAsset.findUnique({
      where: { serialNumber: d.serial },
    });

    if (existingAsset) {
      await db.fSMCustomerAsset.update({
        where: { id: existingAsset.id },
        data: {
          customerId: customer.id,
          productName: product.name,
          model: product.model,
          serialNumber: d.serial,
          qrCode: `QR-${d.serial}`,
          purchaseDate: d.purchaseDate,
          warrantyStatus: d.warrantyStatus,
          warrantyExpiry: d.warrantyExpiry,
          firmwareVersion: product.latestFirmwareVersion ?? "v1.0.0",
          driverVersion: product.latestDriverVersion ?? "v1.0.0",
        },
      });
      console.log(`  ✓ Updated FSMCustomerAsset (S/N: ${d.serial})`);
    } else {
      await db.fSMCustomerAsset.create({
        data: {
          customerId: customer.id,
          productName: product.name,
          model: product.model,
          serialNumber: d.serial,
          qrCode: `QR-${d.serial}`,
          purchaseDate: d.purchaseDate,
          warrantyStatus: d.warrantyStatus,
          warrantyExpiry: d.warrantyExpiry,
          firmwareVersion: product.latestFirmwareVersion ?? "v1.0.0",
          driverVersion: product.latestDriverVersion ?? "v1.0.0",
        },
      });
      console.log(`  ✓ Created FSMCustomerAsset (S/N: ${d.serial})`);
    }

    // ===== 4. Seed ProductMedia rows with mixed visibility =====
    // Delete existing demo media for this product (only the ones we manage)
    // Keep existing media intact
    await db.productMedia.deleteMany({
      where: {
        productId: product.id,
        title: {
          in: [
            // Public
            "Windows Driver", "Android Driver", "User Manual", "Installation Guide",
            "Quick Start Guide", "Software Utility",
            // Engineer-only
            "Engineer Repair Manual", "Field Test Diagnostic Tool",
            // Admin-only
            "Admin Security Console", "Internal Factory Firmware",
          ],
        },
      },
    });

    const publicMedia: Array<{ type: string; title: string; visibility: string }> = [
      { type: "driver", title: "Windows Driver", visibility: "public" },
      { type: "driver", title: "Android Driver", visibility: "public" },
      { type: "manual", title: "User Manual", visibility: "public" },
      { type: "manual", title: "Installation Guide", visibility: "public" },
      { type: "manual", title: "Quick Start Guide", visibility: "public" },
      { type: "utility", title: "Software Utility", visibility: "public" },
    ];

    const engineerMedia: Array<{ type: string; title: string; visibility: string }> = [
      { type: "manual", title: "Engineer Repair Manual", visibility: "engineer" },
      { type: "utility", title: "Field Test Diagnostic Tool", visibility: "engineer" },
    ];

    const adminMedia: Array<{ type: string; title: string; visibility: string }> = [
      { type: "utility", title: "Admin Security Console", visibility: "admin" },
      { type: "firmware", title: "Internal Factory Firmware", visibility: "admin" },
    ];

    const allMedia = [...publicMedia, ...engineerMedia, ...adminMedia];

    for (let i = 0; i < allMedia.length; i++) {
      const m = allMedia[i];
      const slug = product.slug;
      const url = `https://qbithub.vercel.app/downloads/${m.type === "manual" ? "manuals" : m.type === "driver" ? "drivers" : m.type === "firmware" ? "firmware" : "utilities"}/${slug}-${m.title.toLowerCase().replace(/\s+/g, "-")}.${m.type === "manual" ? "pdf" : m.type === "firmware" ? "bin" : "exe"}`;
      await db.productMedia.create({
        data: {
          productId: product.id,
          type: m.type,
          title: m.title,
          url,
          mimeType: m.type === "manual" ? "application/pdf" : m.type === "firmware" ? "application/octet-stream" : "application/vnd.microsoft.portable-executable",
          sortIndex: i,
          visibility: m.visibility,
        },
      });
    }
    console.log(`  ✓ Seeded ${publicMedia.length} public + ${engineerMedia.length} engineer + ${adminMedia.length} admin media files`);
  }

  console.log("\n=== Done ===");
  console.log("");
  console.log("Demo devices ready. Test with:");
  for (const d of DEVICES) {
    console.log(`  Serial: ${d.serial}  →  ${d.customer.name} (${d.customer.company})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
