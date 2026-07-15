/** Quick verify migration on production DB. Run with: npx tsx scripts/verify-prod-db.ts */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const products = await db.qbitProduct.findMany({
    select: { id: true, name: true, model: true, slug: true, category: true, isActive: true },
    take: 20,
  });
  console.log("=== Products on production DB ===");
  for (const p of products) {
    console.log(`  ${p.slug ?? "(no slug)"}  ${p.model.padEnd(20)}  cat=${p.category ?? "(none)"}  active=${p.isActive}`);
  }
  console.log(`\nTotal: ${products.length}`);
  const counts = await Promise.all([
    db.productRelation.count(),
    db.productOS.count(),
    db.productMedia.count(),
    db.productSpecification.count(),
    db.productFeature.count(),
  ]);
  console.log(`\n=== New tables row counts ===`);
  console.log(`  ProductRelation:     ${counts[0]}`);
  console.log(`  ProductOS:           ${counts[1]}`);
  console.log(`  ProductMedia:        ${counts[2]}`);
  console.log(`  ProductSpecification:${counts[3]}`);
  console.log(`  ProductFeature:      ${counts[4]}`);
}
main().catch(console.error).finally(() => db.$disconnect());
