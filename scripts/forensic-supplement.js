#!/usr/bin/env node
/**
 * FORENSIC-NEON-SUPPLEMENT.JS — Dumps 4 tables with schema drift using raw SQL.
 * QbitProduct, Resource, HardwareSignature, DevicePassport have columns
 * in Prisma schema that don't exist in Neon DB yet → findMany fails.
 * Solution: $queryRawUnsafe SELECT * with only existing columns.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: [] });

function j(data) { return JSON.stringify(data, (k,v) => v instanceof Date ? v.toISOString() : typeof v === 'bigint' ? String(v) : v, 2); }

async function dumpWithRawSQL(tableName, limit) {
  // Get columns that exist in DB
  const cols = await p.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_name='${tableName}' AND table_schema='public' ORDER BY ordinal_position`
  );
  const colNames = cols.map(c => c.column_name);
  const colList = colNames.map(c => `"${c}"`).join(', ');
  
  // Query with raw SQL
  const rows = await p.$queryRawUnsafe(
    `SELECT ${colList} FROM "${tableName}" ORDER BY "createdAt" ASC LIMIT ${limit}`
  );
  
  console.log(`\nRAW_CRIT_TABLE=${tableName}`);
  console.log(`RAW_CRIT_COLUMNS=${j(colNames)}`);
  console.log(`RAW_CRIT_COUNT=${rows.length}`);
  for (const r of rows) {
    console.log(`RAW_CRIT_REC=${j(r)}`);
  }
  console.log(`RAW_CRIT_END=${tableName}`);
}

async function main() {
  try {
    const ts = new Date().toISOString();
    console.log(`FORENSIC_SUPPLEMENT_START=${ts}`);
    
    // QbitProduct — 51 records, dump ALL
    await dumpWithRawSQL('QbitProduct', 51);
    
    // Resource — 26 records, dump ALL
    await dumpWithRawSQL('Resource', 26);
    
    // HardwareSignature — 6 records, dump ALL
    await dumpWithRawSQL('HardwareSignature', 6);
    
    // DevicePassport — 6 records, dump ALL
    await dumpWithRawSQL('DevicePassport', 6);
    
    // Also: Check which Prisma schema columns are MISSING from Neon DB for these tables
    console.log('\n=== SCHEMA DRIFT ANALYSIS ===');
    
    // Get ALL Neon table columns for forensic comparison
    const driftTables = ['QbitProduct', 'Resource', 'HardwareSignature', 'DevicePassport'];
    for (const tbl of driftTables) {
      const cols = await p.$queryRawUnsafe(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='${tbl}' AND table_schema='public' ORDER BY ordinal_position`
      );
      console.log(`DRIFT_TABLE=${tbl}`);
      console.log(`DRIFT_DB_COLUMNS=${j(cols.map(c => c.column_name))}`);
      console.log(`DRIFT_DB_DETAILS=${j(cols)}`);
    }
    
    console.log(`FORENSIC_SUPPLEMENT_COMPLETE=${new Date().toISOString()}`);
  } catch (error) {
    console.error('FATAL:', error.message);
  } finally {
    await p.$disconnect();
  }
}
main();
