/**
 * Seed Customer Live Tracking Portal — tracking tokens + demo feedback.
 *
 * Run with: `npx tsx scripts/seed-tracking.ts`
 *
 * Creates:
 *   - Tracking tokens for all existing FSM work orders (one token per WO)
 *   - Demo customer feedback for the completed work order (WO-94280)
 *   - Engineer rating aggregate updated
 */

import { PrismaClient } from "@prisma/client";
import { generateTrackingToken } from "../src/lib/tracking/types";

const db = new PrismaClient();

async function main() {
  console.log("Seeding Customer Live Tracking Portal data...");

  // -------- 1. Create tracking tokens for all work orders --------
  const workOrders = await db.workOrder.findMany({
    select: { id: true, jobNumber: true, publicTrackingCode: true },
  });

  console.log(`Found ${workOrders.length} work orders — creating tokens…`);
  let tokensCreated = 0;
  for (const wo of workOrders) {
    // Skip if token already exists
    const existing = await db.trackingToken.findFirst({
      where: { workOrderId: wo.id },
    });
    if (existing) {
      console.log(`  ⊘ ${wo.jobNumber} — token already exists: ${existing.token}`);
      continue;
    }

    const token = generateTrackingToken();
    await db.trackingToken.create({
      data: {
        token,
        workOrderId: wo.id,
        source: "email",
        isActive: true,
      },
    });
    console.log(`  ✓ ${wo.jobNumber} → token: ${token}`);
    tokensCreated++;
  }
  console.log(`  ${tokensCreated} new tokens created`);

  // -------- 2. Demo customer feedback for completed work order --------
  const completedWO = await db.workOrder.findFirst({
    where: { jobNumber: "WO-94280" },
    select: { id: true, assignedEngineerId: true },
  });

  if (completedWO) {
    const existingFeedback = await db.customerFeedback.findUnique({
      where: { workOrderId: completedWO.id },
    });
    if (!existingFeedback) {
      const feedback = await db.customerFeedback.create({
        data: {
          workOrderId: completedWO.id,
          overallRating: 5,
          punctualityRating: 5,
          professionalismRating: 5,
          qualityRating: 4,
          communicationRating: 5,
          comment: "Excellent service! Engineer was on time, professional, and explained everything clearly. The installation was completed quickly and the printer is working perfectly.",
          recommendImprovement: "It would be great to receive the installation guide via email before the engineer arrives, so we can prepare the site.",
          wouldRecommend: true,
          customerName: "Vikram Patel",
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
      });
      console.log(`  ✓ Demo feedback created for WO-94280 (5 stars)`);

      // Update engineer rating aggregate
      if (completedWO.assignedEngineerId) {
        const allFeedback = await db.customerFeedback.findMany({
          where: { workOrder: { assignedEngineerId: completedWO.assignedEngineerId } },
          select: {
            overallRating: true,
            punctualityRating: true,
            professionalismRating: true,
            qualityRating: true,
            communicationRating: true,
          },
        });

        const total = allFeedback.length;
        const avg = allFeedback.reduce((s, f) => s + f.overallRating, 0) / total;
        const avgOrNull = (sel: (f: typeof allFeedback[0]) => number | null): number | null => {
          const vals = allFeedback.map(sel).filter((v): v is number => v !== null);
          return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
        };

        await db.installationRating.upsert({
          where: { engineerId: completedWO.assignedEngineerId },
          update: {
            totalRatings: total,
            averageRating: Math.round(avg * 100) / 100,
            fiveStarCount: allFeedback.filter((f) => f.overallRating === 5).length,
            fourStarCount: allFeedback.filter((f) => f.overallRating === 4).length,
            threeStarCount: allFeedback.filter((f) => f.overallRating === 3).length,
            twoStarCount: allFeedback.filter((f) => f.overallRating === 2).length,
            oneStarCount: allFeedback.filter((f) => f.overallRating === 1).length,
            avgPunctuality: avgOrNull((f) => f.punctualityRating),
            avgProfessionalism: avgOrNull((f) => f.professionalismRating),
            avgQuality: avgOrNull((f) => f.qualityRating),
            avgCommunication: avgOrNull((f) => f.communicationRating),
            lastRatingAt: new Date(),
          },
          create: {
            engineerId: completedWO.assignedEngineerId,
            totalRatings: total,
            averageRating: Math.round(avg * 100) / 100,
            fiveStarCount: allFeedback.filter((f) => f.overallRating === 5).length,
            fourStarCount: allFeedback.filter((f) => f.overallRating === 4).length,
            threeStarCount: allFeedback.filter((f) => f.overallRating === 3).length,
            twoStarCount: allFeedback.filter((f) => f.overallRating === 2).length,
            oneStarCount: allFeedback.filter((f) => f.overallRating === 1).length,
            avgPunctuality: avgOrNull((f) => f.punctualityRating),
            avgProfessionalism: avgOrNull((f) => f.professionalismRating),
            avgQuality: avgOrNull((f) => f.qualityRating),
            avgCommunication: avgOrNull((f) => f.communicationRating),
            lastRatingAt: new Date(),
          },
        });
        console.log(`  ✓ Engineer rating aggregate updated (avg: ${avg.toFixed(2)} from ${total} rating(s))`);
      }
    } else {
      console.log(`  ⊘ WO-94280 — feedback already exists`);
    }
  }

  console.log("\nDone. Tracking portal data seeded.");

  // Print demo tracking URLs
  console.log("\n--- Demo Tracking URLs ---");
  const tokens = await db.trackingToken.findMany({
    where: { isActive: true },
    include: { workOrder: { select: { jobNumber: true, type: true, status: true } } },
    take: 5,
  });
  const baseUrl = "https://qbithub.vercel.app";
  for (const t of tokens) {
    console.log(`  ${t.workOrder.jobNumber} (${t.workOrder.status.padEnd(10)}) → ${baseUrl}/?track=${t.token}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
