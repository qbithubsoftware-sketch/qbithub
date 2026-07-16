/**
 * Populate download URLs (driver, manual, brochure, datasheet, warranty, sdk,
 * utility, installationGuide) + version info on all production products.
 *
 * Before running: source /tmp/prod-db.env
 * Then:           npx tsx scripts/populate-product-downloads.ts
 *
 * Strategy: For each product, generate deterministic URLs that point to the
 * QBIT downloads directory pattern. These can later be edited via the
 * Product Master admin UI to point to real files. We also fill in
 * latestDriverVersion and latestFirmwareVersion with sensible defaults
 * per category.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Base URL for downloads — can be replaced with real CDN later
const BASE = "https://qbithub.vercel.app/downloads";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function versionFor(category: string, type: "driver" | "firmware"): string {
  // Sensible defaults per category — admin can edit later
  if (type === "driver") {
    if (category.includes("thermal-printer")) return "v2.4.1";
    if (category.includes("barcode")) return "v1.8.0";
    if (category.includes("pos")) return "v3.2.0";
    if (category.includes("kiosk")) return "v1.5.2";
    if (category.includes("cash-drawer")) return "v1.0.0";
    if (category.includes("label")) return "v2.1.0";
    if (category.includes("display")) return "v1.2.0";
    return "v1.0.0";
  }
  // firmware
  if (category.includes("thermal-printer")) return "v1.8.0";
  if (category.includes("barcode")) return "v1.4.2";
  if (category.includes("pos")) return "v2.6.1";
  if (category.includes("kiosk")) return "v1.3.0";
  if (category.includes("display")) return "v0.9.5";
  return "v1.0.0";
}

async function main() {
  console.log("=== Populating download URLs on all products ===\n");

  const products = await db.qbitProduct.findMany({
    select: {
      id: true, name: true, model: true, slug: true, category: true,
      driverDownloadUrl: true, manualUrl: true, brochureUrl: true,
      datasheetUrl: true, warrantyUrl: true, sdkUrl: true,
      utilityUrl: true, installationGuideUrl: true,
      latestDriverVersion: true, latestFirmwareVersion: true,
    },
  });
  console.log(`Found ${products.length} products\n`);

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    // Skip products that already have ALL the URLs populated
    if (
      p.driverDownloadUrl &&
      p.manualUrl &&
      p.brochureUrl &&
      p.datasheetUrl &&
      p.warrantyUrl
    ) {
      skipped++;
      continue;
    }

    const slug = p.slug || slugify(p.model || p.name);
    const category = p.category ?? "";
    const driverVer = versionFor(category, "driver");
    const firmwareVer = versionFor(category, "firmware");

    await db.qbitProduct.update({
      where: { id: p.id },
      data: {
        driverDownloadUrl:    p.driverDownloadUrl    ?? `${BASE}/drivers/${slug}-driver-${driverVer}.exe`,
        manualUrl:            p.manualUrl            ?? `${BASE}/manuals/${slug}-user-manual.pdf`,
        brochureUrl:          p.brochureUrl          ?? `${BASE}/brochures/${slug}-brochure.pdf`,
        datasheetUrl:         p.datasheetUrl         ?? `${BASE}/datasheets/${slug}-datasheet.pdf`,
        warrantyUrl:          p.warrantyUrl          ?? `${BASE}/warranty/${slug}-warranty-terms.pdf`,
        sdkUrl:               p.sdkUrl               ?? `${BASE}/sdk/${slug}-sdk.zip`,
        utilityUrl:           p.utilityUrl           ?? `${BASE}/utilities/${slug}-config-tool.exe`,
        installationGuideUrl: p.installationGuideUrl ?? `${BASE}/guides/${slug}-installation-guide.pdf`,
        latestDriverVersion:  p.latestDriverVersion  ?? driverVer,
        latestFirmwareVersion:p.latestFirmwareVersion?? firmwareVer,
      },
    });

    updated++;
    console.log(`  ✓ ${p.slug.padEnd(20)} | ${p.name.substring(0, 35).padEnd(35)} | ${driverVer} / ${firmwareVer}`);
  }

  console.log(`\n=== Done ===`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (already populated): ${skipped}`);
  console.log(`  Total products: ${products.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
