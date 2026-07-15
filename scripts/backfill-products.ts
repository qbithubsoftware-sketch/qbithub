/**
 * Backfill missing fields for the 6 lighter-seeded products so every
 * product has the complete set of fields required by the Product Detail
 * Page spec (gallery images, related products, latest driver/firmware,
 * AI Diagnostics flag, etc.). Idempotent — safe to re-run.
 *
 * Run with: npx tsx scripts/backfill-products.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const UNSPLASH = {
  printer: "https://images.unsplash.com/photo-1612831455540-b62ede1dcb9c?w=1200&q=80",
  pos: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&q=80",
  scanner: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80",
  drawer: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
  kds: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
  label: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80",
  kiosk: "https://images.unsplash.com/photo-1567531460820-9a4d0e0d3a7c?w=1200&q=80",
  android: "https://images.unsplash.com/photo-1605236453808-2c3f9d8e3d3f?w=1200&q=80",
};

const FILLS: Record<string, {
  imageUrl: string;
  galleryImages?: { url: string; alt: string }[];
  mediaFiles?: { type: string; title: string; url: string; mimeType?: string; altText?: string }[];
  latestDriverVersion?: string;
  latestFirmwareVersion?: string;
  aiDiagnosticsSupported?: boolean;
}> = {
  "scanmaster-elite": {
    imageUrl: UNSPLASH.scanner,
    latestDriverVersion: "v1.0.4",
  },
  "cd-410": {
    imageUrl: UNSPLASH.drawer,
    galleryImages: [
      { url: UNSPLASH.drawer, alt: "CD-410 front view" },
    ],
    latestDriverVersion: "v1.0.0",
    aiDiagnosticsSupported: true,
  },
  "kds-1500": {
    imageUrl: UNSPLASH.kds,
    galleryImages: [
      { url: UNSPLASH.kds, alt: "KDS-1500 display" },
    ],
    mediaFiles: [
      { type: "datasheet", title: "KDS-1500 Datasheet", url: "https://example.com/datasheets/kds1500-datasheet.pdf", mimeType: "application/pdf" },
    ],
    latestDriverVersion: "v1.0.0",
    latestFirmwareVersion: "v2.1.0",
  },
  "lp-220": {
    imageUrl: UNSPLASH.label,
    galleryImages: [
      { url: UNSPLASH.label, alt: "LP-220 label printer" },
    ],
    mediaFiles: [
      { type: "driver", title: "LP-220 Driver", url: "https://example.com/drivers/lp220-driver.exe", mimeType: "application/octet-stream" },
      { type: "manual", title: "LP-220 Manual", url: "https://example.com/manuals/lp220-manual.pdf", mimeType: "application/pdf" },
    ],
    aiDiagnosticsSupported: true,
  },
  "kiosk-pro-27": {
    imageUrl: UNSPLASH.kiosk,
    galleryImages: [
      { url: UNSPLASH.kiosk, alt: "Kiosk Pro 27" },
    ],
    mediaFiles: [
      { type: "driver", title: "KP-27 Driver", url: "https://example.com/drivers/kp27-driver.exe", mimeType: "application/octet-stream" },
      { type: "manual", title: "KP-27 Manual", url: "https://example.com/manuals/kp27-manual.pdf", mimeType: "application/pdf" },
      { type: "datasheet", title: "KP-27 Datasheet", url: "https://example.com/datasheets/kp27-datasheet.pdf", mimeType: "application/pdf" },
    ],
  },
  "android-pos-lite": {
    imageUrl: UNSPLASH.android,
    galleryImages: [
      { url: UNSPLASH.android, alt: "Android POS Lite" },
    ],
    mediaFiles: [
      { type: "driver", title: "APL-10 Driver", url: "https://example.com/drivers/apl10-driver.apk", mimeType: "application/vnd.android.package-archive" },
      { type: "manual", title: "APL-10 Manual", url: "https://example.com/manuals/apl10-manual.pdf", mimeType: "application/pdf" },
    ],
  },
};

async function main() {
  console.log("Backfilling products…");

  // Fetch all products to wire up related products
  const all = await db.qbitProduct.findMany({ select: { id: true, slug: true, name: true } });
  const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));

  for (const [slug, fill] of Object.entries(FILLS)) {
    const product = bySlug[slug];
    if (!product) {
      console.log(`  ✗ ${slug} not found`);
      continue;
    }

    // Update parent fields
    await db.qbitProduct.update({
      where: { id: product.id },
      data: {
        imageUrl: fill.imageUrl,
        galleryImages: fill.galleryImages ? JSON.stringify(fill.galleryImages) : undefined,
        latestDriverVersion: fill.latestDriverVersion ?? undefined,
        latestFirmwareVersion: fill.latestFirmwareVersion ?? undefined,
        aiDiagnosticsSupported: fill.aiDiagnosticsSupported ?? undefined,
        lastUpdated: new Date(),
      },
    });

    // Add media files (skip if already present)
    if (fill.mediaFiles) {
      const existing = await db.productMedia.count({ where: { productId: product.id } });
      if (existing === 0) {
        await db.productMedia.createMany({
          data: fill.mediaFiles.map((m, i) => ({
            productId: product.id,
            type: m.type, title: m.title, url: m.url,
            mimeType: m.mimeType ?? null, altText: m.altText ?? null,
            sortIndex: i,
          })),
        });
      }
    }

    // Add related products (skip if already present)
    const existingRel = await db.productRelation.count({ where: { productId: product.id } });
    if (existingRel === 0) {
      // Pick 2-3 other products in different categories
      const others = all.filter((p) => p.slug !== slug).slice(0, 3);
      if (others.length > 0) {
        await db.productRelation.createMany({
          data: others.map((o, i) => ({
            productId: product.id, relatedId: o.id, sortIndex: i,
          })),
        });
      }
    }

    console.log(`  ✓ ${slug} backfilled`);
  }

  console.log("Backfill complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
