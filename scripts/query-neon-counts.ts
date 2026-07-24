/**
 * Query Neon PostgreSQL database for all record counts.
 * Uses Prisma Client with DATABASE_URL pointing to Neon.
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('=== Neon PostgreSQL Database Record Counts ===\n');

  try {
    // 1. QbitProduct count
    const productCount = await db.qbitProduct.count();
    console.log(`1. QbitProduct (Products):       ${productCount}`);

    // 2. KnowledgeArticle count
    const articleCount = await db.knowledgeArticle.count();
    console.log(`2. KnowledgeArticle (KB articles): ${articleCount}`);

    // 3. Resource count
    const resourceCount = await db.resource.count();
    console.log(`3. Resource:                     ${resourceCount}`);

    // 4. DiagnosticSession count (Dr. QBIT sessions)
    const diagSessionCount = await db.diagnosticSession.count();
    console.log(`4. DiagnosticSession (Dr QBIT):  ${diagSessionCount}`);

    // 5. DiagnosticFinding count (Dr. QBIT findings)
    const diagFindingCount = await db.diagnosticFinding.count();
    console.log(`5. DiagnosticFinding (Dr QBIT):  ${diagFindingCount}`);

    // 6. KnowledgeCategory count
    const knowledgeCategoryCount = await db.knowledgeCategory.count();
    console.log(`6. KnowledgeCategory:            ${knowledgeCategoryCount}`);

    // 7. InstallationGuide count
    const guideCount = await db.installationGuide.count();
    console.log(`7. InstallationGuide:            ${guideCount}`);

    // 8. FAQ count
    const faqCount = await db.faq.count();
    console.log(`8. FAQ:                          ${faqCount}`);

    // 9. CommonError count
    const errorCodeCount = await db.commonError.count();
    console.log(`9. CommonError:                  ${errorCodeCount}`);

    // 10. User count
    const userCount = await db.user.count();
    console.log(`10. User:                        ${userCount}`);

    // 11. Download count
    const downloadCount = await db.download.count();
    console.log(`11. Download:                    ${downloadCount}`);

    // 12. Announcement count
    const announcementCount = await db.announcement.count();
    console.log(`12. Announcement:                ${announcementCount}`);

    // 13. DevicePassport count
    const devicePassportCount = await db.devicePassport.count();
    console.log(`13. DevicePassport:              ${devicePassportCount}`);

    // 14. ProductResourceMapping count
    const mappingCount = await db.productResourceMapping.count();
    console.log(`14. ProductResourceMapping:      ${mappingCount}`);

    // 15. Product detail: show all products with category
    console.log('\n=== Product Details ===');
    const products = await db.qbitProduct.findMany({
      select: { name: true, model: true, category: true, status: true, isFeatured: true },
      orderBy: { createdAt: 'desc' },
    });
    for (const p of products) {
      console.log(`  ${p.name} | model=${p.model} | cat=${p.category} | status=${p.status} | featured=${p.isFeatured}`);
    }

    // 16. Knowledge Article details
    console.log('\n=== Knowledge Article Details ===');
    const articles = await db.knowledgeArticle.findMany({
      select: { title: true, slug: true, category: true, status: true, viewCount: true },
    });
    for (const a of articles) {
      console.log(`  ${a.title} | slug=${a.slug} | cat=${a.category} | status=${a.status} | views=${a.viewCount}`);
    }

    // 17. Resource details
    console.log('\n=== Resource Details ===');
    const resources = await db.resource.findMany({
      select: { name: true, type: true, version: true, status: true, downloadCount: true },
    });
    for (const r of resources) {
      console.log(`  ${r.name} | type=${r.type} | ver=${r.version} | status=${r.status} | downloads=${r.downloadCount}`);
    }

    // 18. DiagnosticSession details
    console.log('\n=== Dr. QBIT Diagnostic Sessions ===');
    const diagSessions = await db.diagnosticSession.findMany({
      select: { id: true, status: true, deviceModel: true, createdAt: true },
      take: 10,
    });
    for (const s of diagSessions) {
      console.log(`  ${s.id} | model=${s.deviceModel || 'N/A'} | status=${s.status} | created=${s.createdAt}`);
    }

  } catch (error) {
    console.error('Query error:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
