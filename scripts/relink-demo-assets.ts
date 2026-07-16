/**
 * Re-link the 3 demo customer assets to real production products so that
 * Device Lookup shows full info (driver, brochure, manual, etc.) for the
 * demo serial numbers.
 *
 * DEMO-T800-001  →  Thermal Printer P80UE        (slug: p80ue)
 * DEMO-CD410-002 →  Cash Drawer CD85             (slug: cd85)
 * DEMO-SME1-003  →  Barcode Scanner 2DSW         (slug: 2dsw)
 *
 * Before running: source /tmp/prod-db.env
 * Then:           npx tsx scripts/relink-demo-assets.ts
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const MAPPING: Array<{ serial: string; newModel: string; newProductName: string; matchSlug: string }> = [
  { serial: "DEMO-T800-001",  newModel: "P80UE",  newProductName: "Thermal Printer P80UE",  matchSlug: "p80ue" },
  { serial: "DEMO-CD410-002", newModel: "CD85",   newProductName: "Cash Drawer CD85",       matchSlug: "cd85" },
  { serial: "DEMO-SME1-003",  newModel: "2DSW",   newProductName: "Barcode Scanner 2DSW",   matchSlug: "2dsw" },
];

async function main() {
  console.log("=== Re-linking demo assets to real products ===\n");

  for (const m of MAPPING) {
    const product = await db.qbitProduct.findUnique({ where: { slug: m.matchSlug } });
    if (!product) {
      console.log(`  ✗ Product not found for slug: ${m.matchSlug}`);
      continue;
    }

    const asset = await db.fSMCustomerAsset.findFirst({
      where: { serialNumber: m.serial },
    });
    if (!asset) {
      console.log(`  ✗ Asset not found for serial: ${m.serial}`);
      continue;
    }

    await db.fSMCustomerAsset.update({
      where: { id: asset.id },
      data: {
        productName: m.newProductName,
        model: m.newModel,
      },
    });

    console.log(`  ✓ ${m.serial.padEnd(18)} → ${m.newProductName.padEnd(28)} (matched slug: ${m.matchSlug})`);
  }

  console.log("\n=== Done ===");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
