/**
 * Seed Engineer Mobile Portal — demo location data.
 *
 * Run with: `npx tsx scripts/seed-mobile.ts`
 *
 * Creates:
 *   - Demo EngineerLocation pings for the engineer (showing a route)
 *   - Demo OfflineSyncQueue entries (to show the sync UI)
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding Engineer Mobile Portal demo data...");

  const engineer = await db.user.findUnique({
    where: { email: "engineer@qbithub.com" },
  });
  if (!engineer) {
    throw new Error("Engineer user not found. Run scripts/seed-users.ts first.");
  }

  // -------- 1. EngineerLocation pings (simulated route) --------
  // Simulate engineer traveling from Bengaluru center to RetailX Mart (Brigade Road)
  const routePoints = [
    { lat: 12.9716, lng: 77.5946, label: "Start (MG Road)" },
    { lat: 12.9750, lng: 77.5960, label: "In transit" },
    { lat: 12.9780, lng: 77.5970, label: "In transit" },
    { lat: 12.9800, lng: 77.5980, label: "In transit" },
    { lat: 12.9810, lng: 77.5990, label: "Approaching destination" },
  ];

  const wo = await db.workOrder.findUnique({ where: { id: "wo_94281" } });

  let locCount = 0;
  const now = new Date();
  for (let i = 0; i < routePoints.length; i++) {
    const point = routePoints[i];
    const capturedAt = new Date(now.getTime() - (routePoints.length - i) * 5 * 60 * 1000); // 5 min apart
    await db.engineerLocation.create({
      data: {
        engineerId: engineer.id,
        workOrderId: wo?.id ?? null,
        geoLat: point.lat,
        geoLng: point.lng,
        accuracy: 10 + Math.random() * 20,
        heading: 45 + i * 15,
        speed: i === 0 || i === routePoints.length - 1 ? 0 : 8 + Math.random() * 5,
        batteryLevel: 0.85 - i * 0.05,
        isOnline: true,
        capturedAt,
      },
    });
    locCount++;
  }
  console.log(`  ✓ ${locCount} location pings seeded (simulated route)`);

  // -------- 2. OfflineSyncQueue (demo entries — already synced) --------
  const demoSyncEntries = [
    {
      method: "PATCH",
      url: "/api/fsm/work-orders/wo_94281",
      body: JSON.stringify({ action: "accept" }),
      status: "synced",
      responseStatus: 200,
      responseBody: JSON.stringify({ workOrder: { id: "wo_94281", status: "accepted" } }),
      description: "Accept job WO-94281",
    },
    {
      method: "PATCH",
      url: "/api/fsm/work-orders/wo_94281",
      body: JSON.stringify({ action: "on_the_way" }),
      status: "synced",
      responseStatus: 200,
      responseBody: JSON.stringify({ workOrder: { id: "wo_94281", status: "on_the_way" } }),
      description: "On the way WO-94281",
    },
    {
      method: "PATCH",
      url: "/api/fsm/work-orders/wo_94281",
      body: JSON.stringify({ action: "arrived" }),
      status: "synced",
      responseStatus: 200,
      responseBody: JSON.stringify({ workOrder: { id: "wo_94281", status: "arrived" } }),
      description: "Arrived WO-94281",
    },
  ];

  let syncCount = 0;
  for (const entry of demoSyncEntries) {
    const existing = await db.offlineSyncQueue.findFirst({
      where: { engineerId: engineer.id, url: entry.url, body: entry.body },
    });
    if (existing) continue;

    await db.offlineSyncQueue.create({
      data: {
        engineerId: engineer.id,
        method: entry.method,
        url: entry.url,
        body: entry.body,
        status: entry.status,
        responseStatus: entry.responseStatus,
        responseBody: entry.responseBody,
        attempts: 1,
        syncedAt: new Date(now.getTime() - (3 - syncCount) * 30 * 60 * 1000),
        lastAttemptAt: new Date(now.getTime() - (3 - syncCount) * 30 * 60 * 1000),
        clientQueueId: `q_seed_${syncCount}`,
      },
    });
    syncCount++;
  }
  console.log(`  ✓ ${syncCount} sync queue entries seeded (historical, all synced)`);

  console.log("\nDone. Engineer Mobile Portal demo data populated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
