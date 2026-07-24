/**
 * Phase 0: FULL BACKUP of Neon PostgreSQL production database.
 * READ-ONLY. No modifications.
 * Creates: SQL dumps, JSON exports, schema backup, timestamp record.
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BACKUP_DIR = '/home/z/my-project/download/backups';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

const db = new PrismaClient();

async function backup() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`=== Phase 0: Full Backup ===`);
  console.log(`Timestamp: ${TIMESTAMP}`);
  console.log(`Backup dir: ${BACKUP_DIR}`);

  try {
    // 1. Prisma Schema Backup
    const schemaContent = require('fs').readFileSync('/tmp/qbithub_repo/prisma/schema.prisma', 'utf8');
    writeFileSync(join(BACKUP_DIR, `schema-prisma-${TIMESTAMP}.prisma`), schemaContent);
    console.log(`✅ Prisma schema backed up (${schemaContent.length} bytes)`);

    // 2. Dump ALL table counts
    const modelNames = Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$') && typeof db[k]?.count === 'function');
    const counts: Record<string, number> = {};
    for (const model of modelNames) {
      try {
        counts[model] = Number(await db[model].count());
      } catch (e: any) {
        counts[model] = -1; // table doesn't exist or schema drift
      }
    }
    writeFileSync(join(BACKUP_DIR, `all-table-counts-${TIMESTAMP}.json`), JSON.stringify(counts, null, 2));
    console.log(`✅ All table counts backed up (${modelNames.length} models)`);
    console.log(`   Tables with data: ${Object.values(counts).filter(c => c > 0).length}`);
    console.log(`   Empty tables: ${Object.values(counts).filter(c => c === 0).length}`);
    console.log(`   Missing tables: ${Object.values(counts).filter(c => c === -1).length}`);

    // 3. Product table backup (full export via raw SQL to avoid schema drift)
    const products = await db.$queryRawUnsafe('SELECT * FROM "QbitProduct"') as any[];
    writeFileSync(join(BACKUP_DIR, `qbit-product-full-${TIMESTAMP}.json`), JSON.stringify(products, null, 2));
    console.log(`✅ QbitProduct backed up (${products.length} records, columns: ${Object.keys(products[0] || {}).length})`);

    // 4. Resource table backup (raw SQL — without V5 columns)
    const resources = await db.$queryRawUnsafe('SELECT * FROM "Resource"') as any[];
    writeFileSync(join(BACKUP_DIR, `resource-full-${TIMESTAMP}.json`), JSON.stringify(resources, null, 2));
    console.log(`✅ Resource backed up (${resources.length} records, columns: ${Object.keys(resources[0] || {}).length})`);

    // 5. ProductResourceMapping backup
    const mappings = await db.$queryRawUnsafe('SELECT * FROM "ProductResourceMapping"') as any[];
    writeFileSync(join(BACKUP_DIR, `product-resource-mapping-${TIMESTAMP}.json`), JSON.stringify(mappings, null, 2));
    console.log(`✅ ProductResourceMapping backed up (${mappings.length} records)`);

    // 6. Knowledge tables backup (all empty but record structure)
    const kaCols = await db.$queryRawUnsafe("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='KnowledgeArticle' ORDER BY ordinal_position") as any[];
    writeFileSync(join(BACKUP_DIR, `knowledge-article-schema-${TIMESTAMP}.json`), JSON.stringify(kaCols, null, 2));
    console.log(`✅ KnowledgeArticle schema backed up (${kaCols.length} columns)`);

    // 7. All existing table schemas backup
    const allTableSchemas = await db.$queryRawUnsafe(
      "SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position"
    ) as any[];
    writeFileSync(join(BACKUP_DIR, `neon-full-schema-${TIMESTAMP}.json`), JSON.stringify(allTableSchemas, null, 2));
    console.log(`✅ Full Neon schema backed up (${allTableSchemas.length} column definitions across ${new Set(allTableSchemas.map(r => r.table_name)).size} tables)`);

    // 8. All table names in Neon
    const neonTables = await db.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    ) as any[];
    writeFileSync(join(BACKUP_DIR, `neon-table-list-${TIMESTAMP}.json`), JSON.stringify(neonTables, null, 2));
    console.log(`✅ Neon table list backed up (${neonTables.length} tables)`);

    // 9. Full data export for ALL populated tables
    const populatedModels = Object.entries(counts).filter(([_, c]) => c > 0).map(([m]) => m);
    const tableToSQLName: Record<string, string> = {
      user: 'User', post: 'Post', qbitProduct: 'QbitProduct', resource: 'Resource',
      productResourceMapping: 'ProductResourceMapping', productRelation: 'ProductRelation',
      productSpecification: 'ProductSpecification', productFeature: 'ProductFeature',
      productMedia: 'ProductMedia', firmware: 'Firmware', firmwareRelease: 'FirmwareRelease',
      firmwareCompatibility: 'FirmwareCompatibility', hardwareSignature: 'HardwareSignature',
      devicePassport: 'DevicePassport', deviceWarranty: 'DeviceWarranty',
      detectedDevice: 'DetectedDevice', unknownDevice: 'UnknownDevice',
      scanSession: 'ScanSession', driverInformation: 'DriverInformation',
      driverHistory: 'DriverHistory', notificationTemplate: 'NotificationTemplate',
      notification: 'Notification', notificationLog: 'NotificationLog',
      reminder: 'Reminder', whatsAppQueue: 'WhatsAppQueue',
      offlineSyncQueue: 'OfflineSyncQueue', trackingToken: 'TrackingToken',
      workOrder: 'WorkOrder', jobTimeline: 'JobTimeline', engineerNote: 'EngineerNote',
      engineerLocation: 'EngineerLocation', fSMCustomer: 'FSMCustomer',
      fSMCustomerAsset: 'FSMCustomerAsset', customerAccount: 'CustomerAccount',
      customerFeedback: 'CustomerFeedback', customerInquiry: 'CustomerInquiry',
      customerNewsletter: 'CustomerNewsletter', installationRating: 'InstallationRating',
      publicProductView: 'PublicProductView', purchaseRecord: 'PurchaseRecord',
      auditLog: 'AuditLog'
    };

    const fullExport: Record<string, any[]> = {};
    for (const model of populatedModels) {
      const sqlName = tableToSQLName[model] || model.charAt(0).toUpperCase() + model.slice(1);
      try {
        const data = await db.$queryRawUnsafe(`SELECT * FROM "${sqlName}"`) as any[];
        fullExport[model] = data;
        console.log(`  ✅ ${model} → ${sqlName}: ${data.length} records exported`);
      } catch (e: any) {
        console.log(`  ⚠️ ${model} → ${sqlName}: raw SQL failed (${e.message?.substring(0, 100)})`);
        // Try Prisma findMany (may fail for schema-drifted tables)
        try {
          const data = await db[model].findMany();
          fullExport[model] = data;
          console.log(`  ✅ ${model}: ${data.length} records via Prisma`);
        } catch (e2: any) {
          console.log(`  ❌ ${model}: both methods failed`);
        }
      }
    }
    writeFileSync(join(BACKUP_DIR, `full-data-export-${TIMESTAMP}.json`), JSON.stringify(fullExport, null, 2));
    console.log(`✅ Full data export backed up (${Object.keys(fullExport).length} tables, total records: ${Object.values(fullExport).reduce((s: number, v: any[]) => s + v.length, 0)})`);

    // 10. Write backup manifest
    const manifest = {
      timestamp: TIMESTAMP,
      date: new Date().toISOString(),
      database: 'neondb @ ep-late-fire-aogbw9hj-pooler.c-2.ap-southeast-1.aws.neon.tech',
      provider: 'postgresql',
      totalModels: modelNames.length,
      populatedTables: populatedModels.length,
      totalRecords: Object.values(fullExport).reduce((s: number, v: any[]) => s + v.length, 0),
      files: [
        `schema-prisma-${TIMESTAMP}.prisma`,
        `all-table-counts-${TIMESTAMP}.json`,
        `qbit-product-full-${TIMESTAMP}.json`,
        `resource-full-${TIMESTAMP}.json`,
        `product-resource-mapping-${TIMESTAMP}.json`,
        `knowledge-article-schema-${TIMESTAMP}.json`,
        `neon-full-schema-${TIMESTAMP}.json`,
        `neon-table-list-${TIMESTAMP}.json`,
        `full-data-export-${TIMESTAMP}.json`,
      ],
      safetyRules: [
        'NEVER run prisma migrate reset',
        'NEVER run prisma db push --accept-data-loss',
        'NEVER run production-cleanup.ts',
        'NEVER drop tables',
        'NEVER truncate tables',
        'NEVER delete production data',
      ]
    };
    writeFileSync(join(BACKUP_DIR, `BACKUP-MANIFEST-${TIMESTAMP}.json`), JSON.stringify(manifest, null, 2));
    console.log(`\n✅✅✅ Phase 0 COMPLETE — Backup manifest written`);
    console.log(`Backup location: ${BACKUP_DIR}`);
    console.log(`Manifest: BACKUP-MANIFEST-${TIMESTAMP}.json`);

  } catch (error) {
    console.error('❌ BACKUP FAILED:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

backup();
