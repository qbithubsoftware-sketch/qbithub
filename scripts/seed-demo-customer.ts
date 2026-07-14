/**
 * Seed a demo customer account for testing the V3 customer login flow.
 *
 * Creates:
 *   1. User row — email: 9876543210@qbit.customer, role: public_customer,
 *      password: Demo@1234 (bcrypt hashed)
 *   2. FSMCustomer row — name: Demo Customer, phone: 9876543210,
 *      email: 9876543210@qbit.customer
 *   3. FSMCustomerAsset rows — 2 demo registered devices (T-800 + CD-410)
 *      with warranty data
 *
 * After seeding, the customer can log in at /accounts/login with:
 *   Mobile Number: 9876543210
 *   Password: Demo@1234
 *
 * Run with: npx tsx scripts/seed-demo-customer.ts
 * (Uses the DATABASE_URL from .env — run locally with SQLite or against
 *  production Postgres by setting DATABASE_URL.)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_MOBILE = "9876543210";
const DEMO_PASSWORD = "Demo@1234";
const DEMO_EMAIL = `${DEMO_MOBILE}@qbit.customer`;

async function main() {
  console.log("=== Seeding demo customer account ===");
  console.log(`  Mobile:   +91 ${DEMO_MOBILE}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log("");

  // ===== 1. Create or update the User row =====
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const existingUser = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existingUser) {
    await db.user.update({
      where: { id: existingUser.id },
      data: {
        name: "Demo Customer",
        passwordHash,
        role: "public_customer",
      },
    });
    console.log(`  ✓ Updated existing User: ${existingUser.id}`);
  } else {
    const user = await db.user.create({
      data: {
        email: DEMO_EMAIL,
        name: "Demo Customer",
        passwordHash,
        role: "public_customer",
      },
    });
    console.log(`  ✓ Created User: ${user.id}`);
  }

  // ===== 2. Create or update the FSMCustomer row =====
  // This is what the DatabasePurchaseProvider looks up by phone number.
  let customer = await db.fSMCustomer.findFirst({
    where: {
      OR: [
        { phone: DEMO_MOBILE },
        { phone: `+91${DEMO_MOBILE}` },
        { phone: `91${DEMO_MOBILE}` },
      ],
    },
  });

  if (customer) {
    customer = await db.fSMCustomer.update({
      where: { id: customer.id },
      data: {
        name: "Demo Customer",
        phone: DEMO_MOBILE,
        email: DEMO_EMAIL,
        companyName: "Demo Retail Pvt Ltd",
        addressLine: "123, MG Road, Demo Tower",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
      },
    });
    console.log(`  ✓ Updated FSMCustomer: ${customer.id}`);
  } else {
    customer = await db.fSMCustomer.create({
      data: {
        name: "Demo Customer",
        phone: DEMO_MOBILE,
        email: DEMO_EMAIL,
        companyName: "Demo Retail Pvt Ltd",
        addressLine: "123, MG Road, Demo Tower",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
      },
    });
    console.log(`  ✓ Created FSMCustomer: ${customer.id}`);
  }

  // ===== 3. Create demo registered devices (FSMCustomerAsset) =====
  // Clear existing assets for this customer first
  await db.fSMCustomerAsset.deleteMany({ where: { customerId: customer.id } });

  const asset1 = await db.fSMCustomerAsset.create({
    data: {
      customerId: customer.id,
      productName: "QBIT T-800 Thermal Printer",
      model: "T-800",
      serialNumber: "DEMO-T800-001",
      qrCode: "QR-DEMO-T800-001",
      purchaseDate: new Date("2024-08-15"),
      warrantyStatus: "active",
      warrantyExpiry: new Date("2026-08-15"), // ~1 year remaining
      firmwareVersion: "v1.8.0",
      driverVersion: "v2.4.1",
    },
  });
  console.log(`  ✓ Created asset 1: ${asset1.productName} (S/N: ${asset1.serialNumber})`);

  const asset2 = await db.fSMCustomerAsset.create({
    data: {
      customerId: customer.id,
      productName: "CD-410 Cash Drawer",
      model: "CD-410",
      serialNumber: "DEMO-CD410-002",
      qrCode: "QR-DEMO-CD410-002",
      purchaseDate: new Date("2024-11-20"),
      warrantyStatus: "active",
      warrantyExpiry: new Date("2026-11-20"), // ~1.3 years remaining
      firmwareVersion: null,
      driverVersion: "v1.0.0",
    },
  });
  console.log(`  ✓ Created asset 2: ${asset2.productName} (S/N: ${asset2.serialNumber})`);

  const asset3 = await db.fSMCustomerAsset.create({
    data: {
      customerId: customer.id,
      productName: "ScanMaster Elite Wireless Scanner",
      model: "SM-E1",
      serialNumber: "DEMO-SME1-003",
      qrCode: "QR-DEMO-SME1-003",
      purchaseDate: new Date("2023-06-10"),
      warrantyStatus: "expired",
      warrantyExpiry: new Date("2024-06-10"), // expired
      firmwareVersion: "v1.0.2",
      driverVersion: "v1.0.4",
    },
  });
  console.log(`  ✓ Created asset 3: ${asset3.productName} (S/N: ${asset3.serialNumber}) — warranty expired`);

  console.log("");
  console.log("=== Demo customer ready! ===");
  console.log("");
  console.log("Login at: https://qbithub.vercel.app/accounts/login");
  console.log(`  Mobile Number: ${DEMO_MOBILE}`);
  console.log(`  Password:      ${DEMO_PASSWORD}`);
  console.log("");
  console.log("Dashboard: https://qbithub.vercel.app/account");
  console.log(`  3 registered devices (2 active warranty, 1 expired)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
