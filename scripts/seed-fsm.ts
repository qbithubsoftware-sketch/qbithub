/**
 * FSM seed script — populates demo customers, assets, and work orders.
 *
 * Run with: `npx tsx scripts/seed-fsm.ts`
 *
 * Creates:
 *   - 4 FSM customers
 *   - 5 customer assets (printers + scanners)
 *   - 12 work orders across all 9 types and various statuses
 *   - Timeline entries for each status transition
 *   - Engineer notes for active jobs
 *   - Notification log entries
 *
 * NEVER seeds: price, cost, margin, commission, invoice data.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding QBIT FSM demo data...");

  // -------- 1. Customers --------
  const customers = await Promise.all([
    db.fSMCustomer.upsert({
      where: { id: "cust_retailx" },
      update: {},
      create: {
        id: "cust_retailx",
        name: "Vikram Patel",
        companyName: "RetailX Mart Pvt Ltd",
        phone: "+919876543210",
        email: "vikram@retailx.in",
        addressLine: "Shop 14, Brigade Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
        geoLat: 12.9716,
        geoLng: 77.5946,
      },
    }),
    db.fSMCustomer.upsert({
      where: { id: "cust_medico" },
      update: {},
      create: {
        id: "cust_medico",
        name: "Dr. Anjali Sharma",
        companyName: "Medico Hospital",
        phone: "+919811111111",
        email: "anjali@medico.in",
        addressLine: "Block C, Medical Enclave",
        city: "New Delhi",
        state: "Delhi",
        postalCode: "110029",
        country: "India",
        geoLat: 28.5681,
        geoLng: 77.2104,
      },
    }),
    db.fSMCustomer.upsert({
      where: { id: "cust_logipro" },
      update: {},
      create: {
        id: "cust_logipro",
        name: "Rohit Mehta",
        companyName: "LogiPro Warehousing",
        phone: "+919822222222",
        email: "rohit@logipro.in",
        addressLine: "Warehouse 7, MIDC Phase 2",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411019",
        country: "India",
        geoLat: 18.5597,
        geoLng: 73.8135,
      },
    }),
    db.fSMCustomer.upsert({
      where: { id: "cust_cafebloom" },
      update: {},
      create: {
        id: "cust_cafebloom",
        name: "Priya Nair",
        companyName: "Cafe Bloom",
        phone: "+919833333333",
        email: "priya@cafebloom.in",
        addressLine: "Marine Drive, Opp. Nariman Point",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400021",
        country: "India",
        geoLat: 18.9436,
        geoLng: 72.8235,
      },
    }),
  ]);
  console.log(`  ✓ ${customers.length} customers upserted`);

  // -------- 2. Customer assets (devices) --------
  const assets = await Promise.all([
    db.fSMCustomerAsset.upsert({
      where: { serialNumber: "T800-SN-001" },
      update: {},
      create: {
        id: "asset_t800_001",
        customerId: "cust_retailx",
        productName: "QBIT T-800 Thermal Printer",
        model: "T-800",
        serialNumber: "T800-SN-001",
        qrCode: "https://hub.qbit.com/asset/T800-SN-001",
        purchaseDate: new Date("2025-08-12"),
        warrantyStatus: "active",
        warrantyExpiry: new Date("2027-08-12"),
        firmwareVersion: "4.0.2",
        driverVersion: "2.4.1",
      },
    }),
    db.fSMCustomerAsset.upsert({
      where: { serialNumber: "T800-SN-002" },
      update: {},
      create: {
        id: "asset_t800_002",
        customerId: "cust_medico",
        productName: "QBIT T-800 Thermal Printer",
        model: "T-800",
        serialNumber: "T800-SN-002",
        qrCode: "https://hub.qbit.com/asset/T800-SN-002",
        purchaseDate: new Date("2025-06-01"),
        warrantyStatus: "active",
        warrantyExpiry: new Date("2027-06-01"),
        firmwareVersion: "3.9.0",
        driverVersion: "2.3.8",
      },
    }),
    db.fSMCustomerAsset.upsert({
      where: { serialNumber: "BS550-SN-001" },
      update: {},
      create: {
        id: "asset_bs550_001",
        customerId: "cust_logipro",
        productName: "QBIT BS-550 Barcode Scanner",
        model: "BS-550",
        serialNumber: "BS550-SN-001",
        qrCode: "https://hub.qbit.com/asset/BS550-SN-001",
        purchaseDate: new Date("2024-11-20"),
        warrantyStatus: "active",
        warrantyExpiry: new Date("2026-11-20"),
        firmwareVersion: "1.7.0",
        driverVersion: "1.4.2",
      },
    }),
    db.fSMCustomerAsset.upsert({
      where: { serialNumber: "T800-SN-003" },
      update: {},
      create: {
        id: "asset_t800_003",
        customerId: "cust_cafebloom",
        productName: "QBIT T-800 Thermal Printer",
        model: "T-800",
        serialNumber: "T800-SN-003",
        qrCode: "https://hub.qbit.com/asset/T800-SN-003",
        purchaseDate: new Date("2024-03-15"),
        warrantyStatus: "expired",
        warrantyExpiry: new Date("2026-03-15"),
        firmwareVersion: "3.5.2",
        driverVersion: "2.1.0",
      },
    }),
    db.fSMCustomerAsset.upsert({
      where: { serialNumber: "HUBX-SN-001" },
      update: {},
      create: {
        id: "asset_hubx_001",
        customerId: "cust_retailx",
        productName: "QBIT HUB-X Pro Hub",
        model: "HUB-X-Pro",
        serialNumber: "HUBX-SN-001",
        qrCode: "https://hub.qbit.com/asset/HUBX-SN-001",
        purchaseDate: new Date("2025-09-05"),
        warrantyStatus: "active",
        warrantyExpiry: new Date("2027-09-05"),
        firmwareVersion: "1.2.0",
        driverVersion: "1.0.4",
      },
    }),
  ]);
  console.log(`  ✓ ${assets.length} customer assets upserted`);

  // -------- 3. Engineer user (existing) --------
  const engineer = await db.user.findUnique({
    where: { email: "engineer@qbithub.com" },
  });
  if (!engineer) {
    throw new Error("Engineer user not found. Run scripts/seed-users.ts first.");
  }

  // -------- 4. Work orders --------
  const now = new Date();
  const today = new Date(now);
  today.setHours(10, 30, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(11, 0, 0, 0);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(15, 0, 0, 0);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(9, 30, 0, 0);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(13, 0, 0, 0);

  type WOInput = {
    id: string;
    jobNumber: string;
    publicTrackingCode: string;
    type: string;
    status: string;
    priority: string;
    customerId: string;
    assetId?: string;
    assignedEngineerId: string;
    scheduledDate: Date;
    scheduledTime: string;
    estimatedMinutes: number;
    description: string;
    arrivedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    rescheduledFrom?: Date;
    rescheduledTo?: Date;
  };

  const woInputs: WOInput[] = [
    // Today — in-progress
    {
      id: "wo_94281",
      jobNumber: "WO-94281",
      publicTrackingCode: "TRK-9F2A4B",
      type: "installation",
      status: "arrived",
      priority: "high",
      customerId: "cust_retailx",
      assetId: "asset_t800_001",
      assignedEngineerId: engineer.id,
      scheduledDate: today,
      scheduledTime: "10:30",
      estimatedMinutes: 90,
      description: "New T-800 printer installation at billing counter #3. Customer requested anti-paper-jam configuration.",
      arrivedAt: new Date(now.getTime() - 15 * 60 * 1000),
    },
    {
      id: "wo_94282",
      jobNumber: "WO-94282",
      publicTrackingCode: "TRK-3C7E91",
      type: "firmware_update",
      status: "pending",
      priority: "normal",
      customerId: "cust_medico",
      assetId: "asset_t800_002",
      assignedEngineerId: engineer.id,
      scheduledDate: today,
      scheduledTime: "15:00",
      estimatedMinutes: 45,
      description: "Firmware upgrade from 3.9.0 → 4.0.2 to fix receipt formatting issue at pharmacy counter.",
    },
    // Upcoming
    {
      id: "wo_94283",
      jobNumber: "WO-94283",
      publicTrackingCode: "TRK-5D8F22",
      type: "relocation",
      status: "pending",
      priority: "normal",
      customerId: "cust_logipro",
      assetId: "asset_bs550_001",
      assignedEngineerId: engineer.id,
      scheduledDate: tomorrow,
      scheduledTime: "14:00",
      estimatedMinutes: 120,
      description: "Move BS-550 scanner from warehouse 7 to warehouse 9. Recalibrate after relocation.",
    },
    {
      id: "wo_94284",
      jobNumber: "WO-94284",
      publicTrackingCode: "TRK-9A1B77",
      type: "troubleshooting",
      status: "pending",
      priority: "urgent",
      customerId: "cust_cafebloom",
      assetId: "asset_t800_003",
      assignedEngineerId: engineer.id,
      scheduledDate: tomorrow,
      scheduledTime: "10:00",
      estimatedMinutes: 60,
      description: "Printer not powering on after recent power surge. Customer reports burnt smell near power port.",
    },
    {
      id: "wo_94285",
      jobNumber: "WO-94285",
      publicTrackingCode: "TRK-2E4C60",
      type: "training",
      status: "pending",
      priority: "low",
      customerId: "cust_retailx",
      assignedEngineerId: engineer.id,
      scheduledDate: dayAfter,
      scheduledTime: "11:00",
      estimatedMinutes: 90,
      description: "Staff training session on new POS workflow for 6 cashiers.",
    },
    // Completed
    {
      id: "wo_94280",
      jobNumber: "WO-94280",
      publicTrackingCode: "TRK-1F2A3B",
      type: "installation",
      status: "completed",
      priority: "normal",
      customerId: "cust_retailx",
      assetId: "asset_hubx_001",
      assignedEngineerId: engineer.id,
      scheduledDate: yesterday,
      scheduledTime: "15:00",
      estimatedMinutes: 75,
      description: "HUB-X Pro installation at new self-checkout kiosk.",
      arrivedAt: new Date(yesterday.getTime() + 5 * 60 * 1000),
      startedAt: new Date(yesterday.getTime() + 10 * 60 * 1000),
      completedAt: new Date(yesterday.getTime() + 70 * 60 * 1000),
    },
    {
      id: "wo_94279",
      jobNumber: "WO-94279",
      publicTrackingCode: "TRK-7B8C44",
      type: "driver_installation",
      status: "completed",
      priority: "normal",
      customerId: "cust_medico",
      assetId: "asset_t800_002",
      assignedEngineerId: engineer.id,
      scheduledDate: twoDaysAgo,
      scheduledTime: "09:30",
      estimatedMinutes: 30,
      description: "Driver reinstall after OS upgrade on pharmacy workstation.",
      arrivedAt: new Date(twoDaysAgo.getTime() + 5 * 60 * 1000),
      startedAt: new Date(twoDaysAgo.getTime() + 8 * 60 * 1000),
      completedAt: new Date(twoDaysAgo.getTime() + 28 * 60 * 1000),
    },
    {
      id: "wo_94270",
      jobNumber: "WO-94270",
      publicTrackingCode: "TRK-3A2B91",
      type: "device_health_check",
      status: "completed",
      priority: "low",
      customerId: "cust_logipro",
      assetId: "asset_bs550_001",
      assignedEngineerId: engineer.id,
      scheduledDate: lastWeek,
      scheduledTime: "13:00",
      estimatedMinutes: 40,
      description: "Quarterly device health check and preventive maintenance.",
      arrivedAt: new Date(lastWeek.getTime() + 5 * 60 * 1000),
      startedAt: new Date(lastWeek.getTime() + 10 * 60 * 1000),
      completedAt: new Date(lastWeek.getTime() + 35 * 60 * 1000),
    },
    // Delayed (scheduled in the past, still pending)
    {
      id: "wo_94278",
      jobNumber: "WO-94278",
      publicTrackingCode: "TRK-9D1E55",
      type: "inspection",
      status: "pending",
      priority: "high",
      customerId: "cust_medico",
      assetId: "asset_t800_002",
      assignedEngineerId: engineer.id,
      scheduledDate: yesterday,
      scheduledTime: "11:00",
      estimatedMinutes: 30,
      description: "Scheduled safety inspection — delayed due to engineer unavailability.",
    },
    // Cancelled
    {
      id: "wo_94275",
      jobNumber: "WO-94275",
      publicTrackingCode: "TRK-4F5G66",
      type: "reinstallation",
      status: "cancelled",
      priority: "low",
      customerId: "cust_cafebloom",
      assetId: "asset_t800_003",
      assignedEngineerId: engineer.id,
      scheduledDate: lastWeek,
      scheduledTime: "16:00",
      estimatedMinutes: 60,
      description: "Reinstallation cancelled by customer — device being replaced under separate contract.",
    },
    // Rescheduled
    {
      id: "wo_94277",
      jobNumber: "WO-94277",
      publicTrackingCode: "TRK-8H3J22",
      type: "troubleshooting",
      status: "rescheduled",
      priority: "normal",
      customerId: "cust_logipro",
      assetId: "asset_bs550_001",
      assignedEngineerId: engineer.id,
      scheduledDate: tomorrow,
      scheduledTime: "16:00",
      estimatedMinutes: 45,
      description: "Scanner calibration issue — rescheduled from yesterday due to customer site closure.",
      rescheduledFrom: lastWeek,
    },
    // Pending acceptance
    {
      id: "wo_94286",
      jobNumber: "WO-94286",
      publicTrackingCode: "TRK-6K9L88",
      type: "driver_installation",
      status: "pending",
      priority: "normal",
      customerId: "cust_retailx",
      assetId: "asset_t800_001",
      assignedEngineerId: engineer.id,
      scheduledDate: dayAfter,
      scheduledTime: "15:30",
      estimatedMinutes: 35,
      description: "Driver update for T-800 to v2.4.2 — patches barcode printing alignment.",
    },
  ];

  for (const input of woInputs) {
    const wo = await db.workOrder.upsert({
      where: { id: input.id },
      update: {
        jobNumber: input.jobNumber,
        publicTrackingCode: input.publicTrackingCode,
        type: input.type,
        status: input.status,
        priority: input.priority,
        customerId: input.customerId,
        assetId: input.assetId ?? null,
        assignedEngineerId: input.assignedEngineerId,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
        estimatedMinutes: input.estimatedMinutes,
        description: input.description,
        arrivedAt: input.arrivedAt ?? null,
        startedAt: input.startedAt ?? null,
        completedAt: input.completedAt ?? null,
      },
      create: {
        ...input,
        assetId: input.assetId ?? null,
        arrivedAt: input.arrivedAt ?? null,
        startedAt: input.startedAt ?? null,
        completedAt: input.completedAt ?? null,
      },
    });
    console.log(`  ✓ ${wo.jobNumber.padEnd(10)} → ${wo.type.padEnd(20)} | ${wo.status}`);
  }

  // -------- 5. Timeline entries --------
  const timelineSeeds: Array<{ woId: string; status: string; label: string; description: string | null; offsetMin: number }> = [
    { woId: "wo_94281", status: "pending", label: "Job Assigned", description: "Work order created and assigned to field engineer.", offsetMin: -120 },
    { woId: "wo_94281", status: "accepted", label: "Engineer Accepted", description: "Engineer acknowledged the job.", offsetMin: -100 },
    { woId: "wo_94281", status: "on_the_way", label: "Engineer On The Way", description: "Engineer departed from previous site.", offsetMin: -30 },
    { woId: "wo_94281", status: "arrived", label: "Engineer Arrived", description: "Engineer reached customer location.", offsetMin: -15 },

    { woId: "wo_94280", status: "pending", label: "Job Assigned", description: null, offsetMin: -180 },
    { woId: "wo_94280", status: "accepted", label: "Engineer Accepted", description: null, offsetMin: -160 },
    { woId: "wo_94280", status: "on_the_way", label: "Engineer On The Way", description: null, offsetMin: -85 },
    { woId: "wo_94280", status: "arrived", label: "Engineer Arrived", description: null, offsetMin: -65 },
    { woId: "wo_94280", status: "installing", label: "Installation Started", description: "Mounting HUB-X Pro and routing cables.", offsetMin: -60 },
    { woId: "wo_94280", status: "testing", label: "Testing", description: "Ran connectivity and print queue tests.", offsetMin: -25 },
    { woId: "wo_94280", status: "completed", label: "Completed", description: "Handover complete. Customer signed off.", offsetMin: -5 },

    { woId: "wo_94279", status: "pending", label: "Job Assigned", description: null, offsetMin: -60 },
    { woId: "wo_94279", status: "accepted", label: "Engineer Accepted", description: null, offsetMin: -45 },
    { woId: "wo_94279", status: "completed", label: "Completed", description: "Driver v2.4.1 installed. Test print successful.", offsetMin: -10 },
  ];

  for (const t of timelineSeeds) {
    const occurredAt = new Date(now.getTime() + t.offsetMin * 60 * 1000);
    await db.jobTimeline.create({
      data: {
        workOrderId: t.woId,
        status: t.status,
        label: t.label,
        description: t.description,
        actorName: "Alex Chen",
        occurredAt,
      },
    });
  }
  console.log(`  ✓ ${timelineSeeds.length} timeline entries seeded`);

  // -------- 6. Engineer notes --------
  await db.engineerNote.create({
    data: {
      workOrderId: "wo_94281",
      authorId: engineer.id,
      authorName: "Alex Chen",
      body: "Customer site parking is tight — bring equipment cart from van.",
      isInternal: true,
    },
  });
  await db.engineerNote.create({
    data: {
      workOrderId: "wo_94284",
      authorId: engineer.id,
      authorName: "Alex Chen",
      body: "Likely power supply board damage — bring spare PSU-12V unit just in case.",
      isInternal: true,
    },
  });
  console.log(`  ✓ 2 engineer notes seeded`);

  // -------- 7. Notification logs --------
  const notifSeeds: Array<{ woId: string; channel: string; template: string; recipient: string; subject: string | null; body: string }> = [
    {
      woId: "wo_94281",
      channel: "whatsapp",
      template: "job_assigned",
      recipient: "+919876543210",
      subject: null,
      body: "QBIT Hub: Your installation job WO-94281 has been assigned. Engineer Alex Chen will arrive at 10:30 AM.",
    },
    {
      woId: "wo_94281",
      channel: "whatsapp",
      template: "engineer_accepted",
      recipient: "+919876543210",
      subject: null,
      body: "QBIT Hub: Engineer Alex Chen has accepted your job WO-94281.",
    },
    {
      woId: "wo_94281",
      channel: "whatsapp",
      template: "engineer_on_the_way",
      recipient: "+919876543210",
      subject: null,
      body: "QBIT Hub: Engineer is on the way to your location. ETA 25 minutes.",
    },
    {
      woId: "wo_94280",
      channel: "email",
      template: "installation_completed",
      recipient: "vikram@retailx.in",
      subject: "Installation Complete — HUB-X Pro (WO-94280)",
      body: "Dear Vikram, your installation has been completed. Tracking link: https://hub.qbit.com/track/TRK-1F2A3B",
    },
  ];
  for (const n of notifSeeds) {
    await db.notificationLog.create({
      data: {
        workOrderId: n.woId,
        channel: n.channel,
        templateCode: n.template,
        recipient: n.recipient,
        subject: n.subject ?? "",
        body: n.body,
        status: "sent",
      },
    });
  }
  console.log(`  ✓ ${notifSeeds.length} notification logs seeded`);

  console.log("\nDone. FSM demo data populated.");
  console.log("\nDemo tracking codes (for /track page):");
  console.log("  WO-94281 / TRK-9F2A4B  (in-progress installation)");
  console.log("  WO-94280 / TRK-1F2A3B  (completed installation)");
  console.log("  WO-94284 / TRK-9A1B77  (urgent troubleshooting)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
