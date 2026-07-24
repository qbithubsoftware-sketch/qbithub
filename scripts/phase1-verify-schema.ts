/**
 * Phase 1: Schema Verification — Compare Prisma schema vs Neon database.
 * Identifies: missing tables, missing columns, missing indexes, missing constraints.
 * NON-DESTRUCTIVE. Only reads and compares.
 * Generates migration preview (SQL) without executing it.
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const db = new PrismaClient();

async function verify() {
  console.log('=== Phase 1: Schema Verification ===');

  try {
    // 1. Get ALL Neon table names
    const neonTables = await db.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    ) as { tablename: string }[];
    const neonTableNames = neonTables.map(t => t.tablename);
    console.log(`Neon tables: ${neonTableNames.length}`);

    // 2. Get ALL Neon column definitions
    const neonColumns = await db.$queryRawUnsafe(
      "SELECT table_name, column_name, data_type, is_nullable, column_default, character_maximum_length FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position"
    ) as any[];
    console.log(`Neon columns: ${neonColumns.length}`);

    // 3. Get ALL Neon indexes
    const neonIndexes = await db.$queryRawUnsafe(
      "SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname"
    ) as any[];
    console.log(`Neon indexes: ${neonIndexes.length}`);

    // 4. Get ALL Neon constraints (PKs, FKs, unique)
    const neonConstraints = await db.$queryRawUnsafe(
      `SELECT conname, contype, 
       pg_get_constraintdef(c.oid) AS definition
       FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
       WHERE n.nspname = 'public' ORDER BY conname`
    ) as any[];
    console.log(`Neon constraints: ${neonConstraints.length}`);

    // 5. Identify MISSING tables (from Prisma schema)
    // These 19 tables were confirmed missing in forensic scan
    const missingTables = [
      'DeviceCategory', 'CapabilityDefinition', 'ConnectionTypeDefinition',
      'ProductCapability', 'ProductConnectionType', 'CommunicationAdapterDefinition',
      'CategoryAdapterMapping', 'AdapterConnectionType',
      'CategoryCapability', 'CategoryConnectionType',
      'DeviceConfiguration', 'ConfigurationEvent',
      'LiveDiagnosticSession', 'InstallationRecord',
      'ServiceHistoryEntry', 'EngineerActivityLog',
      'DeviceTimelineEvent', 'SmartNotification', 'DeviceLifecycleCounter'
    ];

    const actuallyMissing = missingTables.filter(t => !neonTableNames.includes(t));
    console.log(`\nMissing tables confirmed: ${actuallyMissing.length}`);
    for (const t of actuallyMissing) {
      console.log(`  ❌ Table "${t}" does NOT exist in Neon`);
    }

    // 6. Identify MISSING columns in existing tables
    // Resource table: needs V5 columns
    const resourceCols = neonColumns.filter(c => c.table_name === 'Resource');
    const resourceColNames = resourceCols.map(c => c.column_name);
    const missingResourceCols = ['storageKey', 'publicUrl', 'storageProvider', 'extension'].filter(c => !resourceColNames.includes(c));
    console.log(`\nResource table missing columns: ${missingResourceCols.length}`);
    for (const c of missingResourceCols) {
      console.log(`  ❌ Resource."${c}" does NOT exist`);
    }

    // QbitProduct: check for categoryId
    const qpCols = neonColumns.filter(c => c.table_name === 'QbitProduct');
    const qpColNames = qpCols.map(c => c.column_name);
    const missingQpCols = ['categoryId'].filter(c => !qpColNames.includes(c));
    console.log(`\nQbitProduct missing columns: ${missingQpCols.length}`);
    for (const c of missingQpCols) {
      console.log(`  ❌ QbitProduct."${c}" does NOT exist`);
    }

    // HardwareSignature: check for V4 columns
    const hsCols = neonColumns.filter(c => c.table_name === 'HardwareSignature');
    const hsColNames = hsCols.map(c => c.column_name);
    const missingHsCols = ['usbDeviceInstanceId', 'usbContainerId', 'chipUid', 'factoryDeviceUuid',
      'ethernetMac', 'bluetoothMac', 'firmwareSignature'].filter(c => !hsColNames.includes(c));
    console.log(`\nHardwareSignature missing columns: ${missingHsCols.length}`);
    for (const c of missingHsCols) {
      console.log(`  ❌ HardwareSignature."${c}" does NOT exist`);
    }

    // DevicePassport: check for V4-V6 columns
    const dpCols = neonColumns.filter(c => c.table_name === 'DevicePassport');
    const dpColNames = dpCols.map(c => c.column_name);
    const missingDpCols = ['productCode', 'firmwareVersion', 'hardwareRevision', 'usbDeviceInstanceId',
      'usbContainerId', 'chipUid', 'factoryDeviceUuid', 'ethernetMacAddress', 'wifiMacAddress',
      'bluetoothMacAddress', 'deviceUuid', 'hardwareFingerprint', 'duplicateSerialFlag',
      'fingerprintQuality', 'primaryIdentifier', 'customerId', 'dealerId', 'invoiceNumber',
      'purchaseDate', 'warrantyStartDate', 'warrantyEndDate', 'registrationDate', 'activationDate',
      'qrCode', 'productImage', 'productCategory'].filter(c => !dpColNames.includes(c));
    console.log(`\nDevicePassport missing columns: ${missingDpCols.length}`);
    for (const c of missingDpCols) {
      console.log(`  ❌ DevicePassport."${c}" does NOT exist`);
    }

    // 7. Generate NON-DESTRUCTIVE migration SQL preview
    let migrationSQL = '-- Phase 1: Schema Migration Preview (NON-DESTRUCTIVE)\n';
    migrationSQL += '-- Generated: ' + new Date().toISOString() + '\n';
    migrationSQL += '-- ONLY adds missing tables, columns, indexes.\n';
    migrationSQL += '-- NEVER drops, NEVER truncates, NEVER deletes.\n\n';

    // Missing tables
    migrationSQL += '-- === MISSING TABLES ===\n\n';

    migrationSQL += `-- DeviceCategory\nCREATE TABLE IF NOT EXISTS "DeviceCategory" (\n  "id" TEXT NOT NULL,\n  "slug" TEXT NOT NULL,\n  "name" TEXT NOT NULL,\n  "icon" TEXT,\n  "description" TEXT,\n  "imageUrl" TEXT,\n  "sortIndex" INTEGER NOT NULL DEFAULT 0,\n  "isActive" BOOLEAN NOT NULL DEFAULT true,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT "DeviceCategory_pkey" PRIMARY KEY ("id"),\n  CONSTRAINT "DeviceCategory_slug_key" UNIQUE ("slug")\n);\n\n`;

    migrationSQL += `-- CapabilityDefinition\nCREATE TABLE IF NOT EXISTS "CapabilityDefinition" (\n  "id" TEXT NOT NULL,\n  "slug" TEXT NOT NULL,\n  "name" TEXT NOT NULL,\n  "icon" TEXT,\n  "description" TEXT,\n  "group" TEXT NOT NULL,\n  "sortIndex" INTEGER NOT NULL DEFAULT 0,\n  "isActive" BOOLEAN NOT NULL DEFAULT true,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT "CapabilityDefinition_pkey" PRIMARY KEY ("id"),\n  CONSTRAINT "CapabilityDefinition_slug_key" UNIQUE ("slug")\n);\n\n`;

    migrationSQL += `-- ConnectionTypeDefinition\nCREATE TABLE IF NOT EXISTS "ConnectionTypeDefinition" (\n  "id" TEXT NOT NULL,\n  "slug" TEXT NOT NULL,\n  "name" TEXT NOT NULL,\n  "icon" TEXT,\n  "description" TEXT,\n  "sortIndex" INTEGER NOT NULL DEFAULT 0,\n  "isActive" BOOLEAN NOT NULL DEFAULT true,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT "ConnectionTypeDefinition_pkey" PRIMARY KEY ("id"),\n  CONSTRAINT "ConnectionTypeDefinition_slug_key" UNIQUE ("slug")\n);\n\n`;

    migrationSQL += `-- CommunicationAdapterDefinition\nCREATE TABLE IF NOT EXISTS "CommunicationAdapterDefinition" (\n  "id" TEXT NOT NULL,\n  "slug" TEXT NOT NULL,\n  "name" TEXT NOT NULL,\n  "icon" TEXT,\n  "description" TEXT,\n  "deviceCategory" TEXT NOT NULL,\n  "sortIndex" INTEGER NOT NULL DEFAULT 0,\n  "isActive" BOOLEAN NOT NULL DEFAULT true,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT "CommunicationAdapterDefinition_pkey" PRIMARY KEY ("id"),\n  CONSTRAINT "CommunicationAdapterDefinition_slug_key" UNIQUE ("slug")\n);\n\n`;

    migrationSQL += `-- ProductCapability\nCREATE TABLE IF NOT EXISTS "ProductCapability" (\n  "id" TEXT NOT NULL,\n  "productId" TEXT NOT NULL,\n  "capabilityId" TEXT NOT NULL,\n  "supported" BOOLEAN NOT NULL DEFAULT true,\n  "notes" TEXT,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT "ProductCapability_pkey" PRIMARY KEY ("id"),\n  CONSTRAINT "ProductCapability_productId_capabilityId_key" UNIQUE ("productId","capabilityId")\n);\nCREATE INDEX IF NOT EXISTS "ProductCapability_productId_idx" ON "ProductCapability"("productId");\nCREATE INDEX IF NOT EXISTS "ProductCapability_capabilityId_idx" ON "ProductCapability"("capabilityId");\n\n`;

    migrationSQL += `-- ProductConnectionType\nCREATE TABLE IF NOT EXISTS "ProductConnectionType" (\n  "id" TEXT NOT NULL,\n  "productId" TEXT NOT NULL,\n  "connectionTypeId" TEXT NOT NULL,\n  "supported" BOOLEAN NOT NULL DEFAULT true,\n  "notes" TEXT,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT "ProductConnectionType_pkey" PRIMARY KEY ("id"),\n  CONSTRAINT "ProductConnectionType_productId_connectionTypeId_key" UNIQUE ("productId","connectionTypeId")\n);\nCREATE INDEX IF NOT EXISTS "ProductConnectionType_productId_idx" ON "ProductConnectionType"("productId");\nCREATE INDEX IF NOT EXISTS "ProductConnectionType_connectionTypeId_idx" ON "ProductConnectionType"("connectionTypeId");\n\n`;

    migrationSQL += `-- CategoryCapability\nCREATE TABLE IF NOT EXISTS "CategoryCapability" (\n  "id" TEXT NOT NULL,\n  "categoryId" TEXT NOT NULL,\n  "capabilityId" TEXT NOT NULL,\n  "isDefault" BOOLEAN NOT NULL DEFAULT false,\n  "sortIndex" INTEGER NOT NULL DEFAULT 0,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT "CategoryCapability_pkey" PRIMARY KEY ("id"),\n  CONSTRAINT "CategoryCapability_categoryId_capabilityId_key" UNIQUE ("categoryId","capabilityId")\n);\nCREATE INDEX IF NOT EXISTS "CategoryCapability_categoryId_idx" ON "CategoryCapability"("categoryId");\nCREATE INDEX IF NOT EXISTS "CategoryCapability_capabilityId_idx" ON "CategoryCapability"("capabilityId");\n\n`;

    migrationSQL += `-- CategoryConnectionType\nCREATE TABLE IF NOT EXISTS "CategoryConnectionType" (\n  "id" TEXT NOT NULL,\n  "categoryId" TEXT NOT NULL,\n  "connectionTypeId" TEXT NOT NULL,\n  "isDefault" BOOLEAN NOT NULL DEFAULT false,\n  "sortIndex" INTEGER NOT NULL DEFAULT 0,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT "CategoryConnectionType_pkey" PRIMARY KEY ("id"),\n  CONSTRAINT "CategoryConnectionType_categoryId_connectionTypeId_key" UNIQUE ("categoryId","connectionTypeId")\n);\nCREATE INDEX IF NOT EXISTS "CategoryConnectionType_categoryId_idx" ON "CategoryConnectionType"("categoryId");\nCREATE INDEX IF NOT EXISTS "CategoryConnectionType_connectionTypeId_idx" ON "CategoryConnectionType"("connectionTypeId");\n\n`;

    migrationSQL += `-- CategoryAdapterMapping\nCREATE TABLE IF NOT EXISTS "CategoryAdapterMapping" (\n  "id" TEXT NOT NULL,\n  "categoryId" TEXT NOT NULL,\n  "adapterId" TEXT NOT NULL,\n  "isDefault" BOOLEAN NOT NULL DEFAULT false,\n  "sortIndex" INTEGER NOT NULL DEFAULT 0,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT "CategoryAdapterMapping_pkey" PRIMARY KEY ("id"),\n  CONSTRAINT "CategoryAdapterMapping_categoryId_adapterId_key" UNIQUE ("categoryId","adapterId")\n);\nCREATE INDEX IF NOT EXISTS "CategoryAdapterMapping_categoryId_idx" ON "CategoryAdapterMapping"("categoryId");\nCREATE INDEX IF NOT EXISTS "CategoryAdapterMapping_adapterId_idx" ON "CategoryAdapterMapping"("adapterId");\n\n`;

    migrationSQL += `-- AdapterConnectionType\nCREATE TABLE IF NOT EXISTS "AdapterConnectionType" (\n  "id" TEXT NOT NULL,\n  "adapterId" TEXT NOT NULL,\n  "connectionTypeId" TEXT NOT NULL,\n  "supported" BOOLEAN NOT NULL DEFAULT true,\n  "sortIndex" INTEGER NOT NULL DEFAULT 0,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT "AdapterConnectionType_pkey" PRIMARY KEY ("id"),\n  CONSTRAINT "AdapterConnectionType_adapterId_connectionTypeId_key" UNIQUE ("adapterId","connectionTypeId")\n);\nCREATE INDEX IF NOT EXISTS "AdapterConnectionType_adapterId_idx" ON "AdapterConnectionType"("adapterId");\nCREATE INDEX IF NOT EXISTS "AdapterConnectionType_connectionTypeId_idx" ON "AdapterConnectionType"("connectionTypeId");\n\n`;

    // Operational/empty tables (no seed data, accumulate from user actions)
    migrationSQL += `-- DeviceConfiguration\nCREATE TABLE IF NOT EXISTS "DeviceConfiguration" (\n  "id" TEXT NOT NULL,\n  "passportId" TEXT NOT NULL,\n  "configurationType" TEXT NOT NULL,\n  "configurationData" JSONB,\n  "appliedAt" TIMESTAMP(3),\n  "appliedBy" TEXT,\n  "status" TEXT NOT NULL DEFAULT 'pending',\n  "notes" TEXT,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT "DeviceConfiguration_pkey" PRIMARY KEY ("id")\n);\nCREATE INDEX IF NOT EXISTS "DeviceConfiguration_passportId_idx" ON "DeviceConfiguration"("passportId");\n\n`;

    migrationSQL += `-- ConfigurationEvent\nCREATE TABLE IF NOT EXISTS "ConfigurationEvent" (\n  "id" TEXT NOT NULL,\n  "configurationId" TEXT NOT NULL,\n  "eventType" TEXT NOT NULL,\n  "eventData" JSONB,\n  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "userId" TEXT,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT "ConfigurationEvent_pkey" PRIMARY KEY ("id")\n);\nCREATE INDEX IF NOT EXISTS "ConfigurationEvent_configurationId_idx" ON "ConfigurationEvent"("configurationId");\n\n`;

    migrationSQL += `-- LiveDiagnosticSession\nCREATE TABLE IF NOT EXISTS "LiveDiagnosticSession" (\n  "id" TEXT NOT NULL,\n  "passportId" TEXT NOT NULL,\n  "deviceId" TEXT,\n  "status" TEXT NOT NULL DEFAULT 'active',\n  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "endedAt" TIMESTAMP(3),\n  "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "findingsCount" INTEGER NOT NULL DEFAULT 0,\n  "recommendationsCount" INTEGER NOT NULL DEFAULT 0,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT "LiveDiagnosticSession_pkey" PRIMARY KEY ("id")\n);\nCREATE INDEX IF NOT EXISTS "LiveDiagnosticSession_passportId_idx" ON "LiveDiagnosticSession"("passportId");\nCREATE INDEX IF NOT EXISTS "LiveDiagnosticSession_status_idx" ON "LiveDiagnosticSession"("status");\n\n`;

    migrationSQL += `-- InstallationRecord\nCREATE TABLE IF NOT EXISTS "InstallationRecord" (\n  "id" TEXT NOT NULL,\n  "workOrderId" TEXT,\n  "passportId" TEXT NOT NULL,\n  "engineerId" TEXT NOT NULL,\n  "status" TEXT NOT NULL DEFAULT 'scheduled',\n  "scheduledDate" TIMESTAMP(3),\n  "completedDate" TIMESTAMP(3),\n  "notes" TEXT,\n  "photos" JSONB,\n  "customerSignature" TEXT,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT "InstallationRecord_pkey" PRIMARY KEY ("id")\n);\nCREATE INDEX IF NOT EXISTS "InstallationRecord_passportId_idx" ON "InstallationRecord"("passportId");\nCREATE INDEX IF NOT EXISTS "InstallationRecord_engineerId_idx" ON "InstallationRecord"("engineerId");\n\n`;

    migrationSQL += `-- ServiceHistoryEntry\nCREATE TABLE IF NOT EXISTS "ServiceHistoryEntry" (\n  "id" TEXT NOT NULL,\n  "passportId" TEXT NOT NULL,\n  "serviceType" TEXT NOT NULL,\n  "description" TEXT,\n  "engineerId" TEXT,\n  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "outcome" TEXT,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT "ServiceHistoryEntry_pkey" PRIMARY KEY ("id")\n);\nCREATE INDEX IF NOT EXISTS "ServiceHistoryEntry_passportId_idx" ON "ServiceHistoryEntry"("passportId");\n\n`;

    migrationSQL += `-- EngineerActivityLog\nCREATE TABLE IF NOT EXISTS "EngineerActivityLog" (\n  "id" TEXT NOT NULL,\n  "engineerId" TEXT NOT NULL,\n  "activityType" TEXT NOT NULL,\n  "description" TEXT,\n  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "location" JSONB,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT "EngineerActivityLog_pkey" PRIMARY KEY ("id")\n);\nCREATE INDEX IF NOT EXISTS "EngineerActivityLog_engineerId_idx" ON "EngineerActivityLog"("engineerId");\n\n`;

    migrationSQL += `-- DeviceTimelineEvent\nCREATE TABLE IF NOT EXISTS "DeviceTimelineEvent" (\n  "id" TEXT NOT NULL,\n  "passportId" TEXT NOT NULL,\n  "eventType" TEXT NOT NULL,\n  "eventDescription" TEXT,\n  "eventData" JSONB,\n  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "source" TEXT,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  CONSTRAINT "DeviceTimelineEvent_pkey" PRIMARY KEY ("id")\n);\nCREATE INDEX IF NOT EXISTS "DeviceTimelineEvent_passportId_idx" ON "DeviceTimelineEvent"("passportId");\n\n`;

    migrationSQL += `-- SmartNotification\nCREATE TABLE IF NOT EXISTS "SmartNotification" (\n  "id" TEXT NOT NULL,\n  "passportId" TEXT NOT NULL,\n  "notificationType" TEXT NOT NULL,\n  "severity" TEXT NOT NULL DEFAULT 'info',\n  "title" TEXT NOT NULL,\n  "message" TEXT NOT NULL,\n  "isRead" BOOLEAN NOT NULL DEFAULT false,\n  "actionRequired" BOOLEAN NOT NULL DEFAULT false,\n  "actionUrl" TEXT,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT "SmartNotification_pkey" PRIMARY KEY ("id")\n);\nCREATE INDEX IF NOT EXISTS "SmartNotification_passportId_idx" ON "SmartNotification"("passportId");\nCREATE INDEX IF NOT EXISTS "SmartNotification_severity_idx" ON "SmartNotification"("severity");\n\n`;

    migrationSQL += `-- DeviceLifecycleCounter\nCREATE TABLE IF NOT EXISTS "DeviceLifecycleCounter" (\n  "id" TEXT NOT NULL,\n  "passportId" TEXT NOT NULL,\n  "counterType" TEXT NOT NULL,\n  "currentValue" INTEGER NOT NULL DEFAULT 0,\n  "maxValue" INTEGER,\n  "unit" TEXT,\n  "lastResetAt" TIMESTAMP(3),\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT "DeviceLifecycleCounter_pkey" PRIMARY KEY ("id")\n);\nCREATE INDEX IF NOT EXISTS "DeviceLifecycleCounter_passportId_idx" ON "DeviceLifecycleCounter"("passportId");\n\n`;

    // Missing columns
    migrationSQL += '\n-- === MISSING COLUMNS ===\n\n';

    // Resource V5 columns
    for (const col of missingResourceCols) {
      const defs: Record<string, string> = {
        storageKey: 'TEXT',
        publicUrl: 'TEXT',
        storageProvider: 'TEXT NOT NULL DEFAULT \'local\'',
        extension: 'TEXT',
      };
      migrationSQL += `ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "${col}" ${defs[col]};\n`;
    }
    migrationSQL += '\n';

    // QbitProduct categoryId
    migrationSQL += `ALTER TABLE "QbitProduct" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;\n\n`;

    // HardwareSignature V4 columns
    for (const col of missingHsCols) {
      migrationSQL += `ALTER TABLE "HardwareSignature" ADD COLUMN IF NOT EXISTS "${col}" TEXT;\n`;
    }
    migrationSQL += '\n';

    // DevicePassport V4-V6 columns
    for (const col of missingDpCols) {
      const defs: Record<string, string> = {
        productCode: 'TEXT',
        firmwareVersion: 'TEXT',
        hardwareRevision: 'TEXT',
        usbDeviceInstanceId: 'TEXT',
        usbContainerId: 'TEXT',
        chipUid: 'TEXT',
        factoryDeviceUuid: 'TEXT',
        ethernetMacAddress: 'TEXT',
        wifiMacAddress: 'TEXT',
        bluetoothMacAddress: 'TEXT',
        deviceUuid: 'TEXT',
        hardwareFingerprint: 'TEXT',
        duplicateSerialFlag: 'BOOLEAN NOT NULL DEFAULT false',
        fingerprintQuality: 'TEXT NOT NULL DEFAULT \'low\'',
        primaryIdentifier: 'TEXT',
        customerId: 'TEXT',
        dealerId: 'TEXT',
        invoiceNumber: 'TEXT',
        purchaseDate: 'TIMESTAMP(3)',
        warrantyStartDate: 'TIMESTAMP(3)',
        warrantyEndDate: 'TIMESTAMP(3)',
        registrationDate: 'TIMESTAMP(3)',
        activationDate: 'TIMESTAMP(3)',
        qrCode: 'TEXT',
        productImage: 'TEXT',
        productCategory: 'TEXT',
      };
      migrationSQL += `ALTER TABLE "DevicePassport" ADD COLUMN IF NOT EXISTS "${col}" ${defs[col] || 'TEXT'};\n`;
    }
    migrationSQL += '\n';

    // Foreign key constraints for missing tables
    migrationSQL += '\n-- === FOREIGN KEYS FOR NEW TABLES ===\n\n';
    migrationSQL += `ALTER TABLE "ProductCapability" ADD CONSTRAINT "ProductCapability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "ProductCapability" ADD CONSTRAINT "ProductCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "CapabilityDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "ProductConnectionType" ADD CONSTRAINT "ProductConnectionType_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "ProductConnectionType" ADD CONSTRAINT "ProductConnectionType_connectionTypeId_fkey" FOREIGN KEY ("connectionTypeId") REFERENCES "ConnectionTypeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "CategoryCapability" ADD CONSTRAINT "CategoryCapability_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "CategoryCapability" ADD CONSTRAINT "CategoryCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "CapabilityDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "CategoryConnectionType" ADD CONSTRAINT "CategoryConnectionType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "CategoryConnectionType" ADD CONSTRAINT "CategoryConnectionType_connectionTypeId_fkey" FOREIGN KEY ("connectionTypeId") REFERENCES "ConnectionTypeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "CategoryAdapterMapping" ADD CONSTRAINT "CategoryAdapterMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "CategoryAdapterMapping" ADD CONSTRAINT "CategoryAdapterMapping_adapterId_fkey" FOREIGN KEY ("adapterId") REFERENCES "CommunicationAdapterDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "AdapterConnectionType" ADD CONSTRAINT "AdapterConnectionType_adapterId_fkey" FOREIGN KEY ("adapterId") REFERENCES "CommunicationAdapterDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "AdapterConnectionType" ADD CONSTRAINT "AdapterConnectionType_connectionTypeId_fkey" FOREIGN KEY ("connectionTypeId") REFERENCES "ConnectionTypeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "QbitProduct" ADD CONSTRAINT "QbitProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DeviceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "DeviceConfiguration" ADD CONSTRAINT "DeviceConfiguration_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "ConfigurationEvent" ADD CONSTRAINT "ConfigurationEvent_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "DeviceConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "LiveDiagnosticSession" ADD CONSTRAINT "LiveDiagnosticSession_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "InstallationRecord" ADD CONSTRAINT "InstallationRecord_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "InstallationRecord_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "InstallationRecord_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "ServiceHistoryEntry" ADD CONSTRAINT "ServiceHistoryEntry_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "EngineerActivityLog" ADD CONSTRAINT "EngineerActivityLog_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "DeviceTimelineEvent" ADD CONSTRAINT "DeviceTimelineEvent_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "SmartNotification" ADD CONSTRAINT "SmartNotification_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n`;
    migrationSQL += `ALTER TABLE "DeviceLifecycleCounter" ADD CONSTRAINT "DeviceLifecycleCounter_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "DevicePassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n\n`;

    // Save migration preview
    writeFileSync('/home/z/my-project/download/backups/migration-preview-phase1.sql', migrationSQL);
    console.log(`\n✅ Migration preview generated (${migrationSQL.length} bytes)`);
    console.log(`Saved to: /home/z/my-project/download/backups/migration-preview-phase1.sql`);

    // Summary
    const summary = {
      missingTables: actuallyMissing,
      missingColumns: {
        Resource: missingResourceCols,
        QbitProduct: missingQpCols,
        HardwareSignature: missingHsCols,
        DevicePassport: missingDpCols,
      },
      neonTableCount: neonTableNames.length,
      neonColumnCount: neonColumns.length,
      neonIndexCount: neonIndexes.length,
      neonConstraintCount: neonConstraints.length,
    };
    writeFileSync('/home/z/my-project/download/backups/schema-verification-phase1.json', JSON.stringify(summary, null, 2));
    console.log(`✅ Schema verification summary saved`);

  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

verify();
