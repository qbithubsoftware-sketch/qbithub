#!/usr/bin/env node
/**
 * FORENSIC-NEON.JS v4 — Uses correct Prisma delegate names (camelCase).
 * READ ONLY forensic scan. Streams output incrementally.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: [] });

function j(data) { return JSON.stringify(data, (k,v) => v instanceof Date ? v.toISOString() : typeof v === 'bigint' ? String(v) : v, 2); }

// Prisma delegate names (camelCase) mapped to Neon table names (PascalCase)
const DELEGATE_TO_TABLE = {
  qbitProduct: 'QbitProduct',
  knowledgeArticle: 'KnowledgeArticle',
  knowledgeCategory: 'KnowledgeCategory',
  resource: 'Resource',
  diagnosticSession: 'DiagnosticSession',
  diagnosticFinding: 'DiagnosticFinding',
  diagnosticRecommendation: 'DiagnosticRecommendation',
  installationGuide: 'InstallationGuide',
  productInstallationGuide: 'ProductInstallationGuide',
  productResourceMapping: 'ProductResourceMapping',
  productFeature: 'ProductFeature',
  productSpecification: 'ProductSpecification',
  productMedia: 'ProductMedia',
  productRelation: 'ProductRelation',
  fAQ: 'FAQ',
  commonError: 'CommonError',
  troubleshootingIssue: 'TroubleshootingIssue',
  troubleshootingStep: 'TroubleshootingStep',
  articleSection: 'ArticleSection',
  download: 'Download',
  downloadCategory: 'DownloadCategory',
  driver: 'Driver',
  firmware: 'Firmware',
  manual: 'Manual',
  sDK: 'SDK',
  utility: 'Utility',
  hardwareSignature: 'HardwareSignature',
  devicePassport: 'DevicePassport',
  firmwareRelease: 'FirmwareRelease',
  firmwareCompatibility: 'FirmwareCompatibility',
  notificationTemplate: 'NotificationTemplate',
};

// Critical tables to dump ALL records
const CRITICAL_DELEGATES = Object.keys(DELEGATE_TO_TABLE);

async function main() {
  try {
    const ts = new Date().toISOString();
    console.log(`FORENSIC_SCAN_START=${ts}`);

    // ── 1. Neon tables from information_schema ────────────────────────────
    let neonTables;
    try {
      const rows = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`;
      neonTables = rows.map(r => r.table_name);
      console.log(`NEON_TABLES_TOTAL=${neonTables.length}`);
      console.log(`NEON_TABLES_LIST=${j(neonTables)}`);
    } catch(e) { console.log(`NEON_TABLES_ERROR=${e.message}`); neonTables = []; }

    // ── 2. Discover Prisma model delegate names ──────────────────────────
    const modelNames = [];
    for (const key of Object.keys(prisma)) {
      if (typeof prisma[key]?.count === 'function' && !key.startsWith('_') && !key.startsWith('$')) {
        modelNames.push(key);
      }
    }
    modelNames.sort();
    console.log(`PRISMA_MODELS_TOTAL=${modelNames.length}`);
    console.log(`PRISMA_MODELS_LIST=${j(modelNames)}`);

    // ── 3. Cross-reference: Prisma delegates ↔ Neon tables ───────────────
    // Build a Neon-to-Delegate map based on known names
    const neonToDelegate = {};
    for (const m of modelNames) {
      // Prisma convention: first char lowercase, rest preserved from model name
      // Model name → PascalCase: capitalize first char
      const pascalName = m.charAt(0).toUpperCase() + m.slice(1);
      neonToDelegate[pascalName] = m;
    }
    // But some have special casing (FAQ→fAQ, SDK→sDK, FSMCustomer→fSMCustomer etc.)
    // These are already handled since Prisma preserves the model name case after lowercasing

    const existsInNeon = [];
    const missingInNeon = [];
    const extraNeonTables = [];

    for (const m of modelNames) {
      // Try to find matching Neon table
      // The model name in Prisma is the delegate key; the DB table name is the model name (PascalCase-ish)
      // Prisma generates delegate by lowercasing the first character of the model name
      // So QbitProduct → qbitProduct, FSMCustomer → fSMCustomer, FAQ → fAQ, etc.
      // The actual DB table name is the Prisma model name (as declared in schema, e.g. QbitProduct)
      // unless @@map overrides it.
      const dbName = m.charAt(0).toUpperCase() + m.slice(1);
      // Some special cases need manual fix
      const tableMatch = neonTables.includes(dbName) ? dbName : null;
      
      // Also check with the exact Neon table name match (case-sensitive)
      // Try all possible Neon tables to find a match
      let matched = null;
      for (const nt of neonTables) {
        const expectedDelegate = nt.charAt(0).toLowerCase() + nt.slice(1);
        if (expectedDelegate === m) { matched = nt; break; }
      }
      
      if (matched) {
        existsInNeon.push({ delegate: m, neonTable: matched });
      } else {
        missingInNeon.push({ delegate: m, expectedTable: dbName });
      }
    }

    for (const nt of neonTables) {
      const expectedDelegate = nt.charAt(0).toLowerCase() + nt.slice(1);
      if (!modelNames.includes(expectedDelegate)) {
        extraNeonTables.push(nt);
      }
    }

    console.log(`CROSSREF_EXISTS=${j(existsInNeon)}`);
    console.log(`CROSSREF_MISSING=${j(missingInNeon)}`);
    console.log(`CROSSREF_EXTRA_NEON=${j(extraNeonTables)}`);

    // ── 4. Count ALL models that exist in Neon ───────────────────────────
    const allCounts = {};
    const countErrors = {};
    for (const { delegate } of existsInNeon) {
      try {
        allCounts[delegate] = await prisma[delegate].count();
      } catch(e) { countErrors[delegate] = e.message?.substring(0,150); }
    }
    for (const { delegate } of missingInNeon) {
      // Try anyway — will likely error, table doesn't exist in DB
      try {
        allCounts[delegate] = await prisma[delegate].count();
      } catch(e) { countErrors[delegate] = e.message?.substring(0,150); }
    }
    console.log(`ALL_MODEL_COUNTS=${j(allCounts)}`);
    if (Object.keys(countErrors).length) console.log(`COUNT_ERRORS=${j(countErrors)}`);

    // ── 5. CRITICAL TABLES: dump ALL records ─────────────────────────────
    const critErrors = {};
    for (const delegate of CRITICAL_DELEGATES) {
      const tableName = DELEGATE_TO_TABLE[delegate];
      try {
        const cnt = allCounts[delegate];
        if (cnt === undefined) { critErrors[delegate] = `NO_COUNT (${tableName})`; continue; }
        if (cnt === 0) {
          console.log(`\nCRIT_TABLE=${tableName}`);
          console.log(`CRIT_COUNT=0`);
          console.log(`CRIT_DUMPED=0`);
          console.log(`CRIT_END=${tableName}`);
          continue;
        }
        // Dump ALL records if <= 50, otherwise take 10
        const take = cnt <= 50 ? cnt : 10;
        const recs = await prisma[delegate].findMany({ take });
        console.log(`\nCRIT_TABLE=${tableName}`);
        console.log(`CRIT_COUNT=${cnt}`);
        console.log(`CRIT_DUMPED=${recs.length}`);
        for (const r of recs) {
          console.log(`CRIT_REC=${j(r)}`);
        }
        console.log(`CRIT_END=${tableName}`);
      } catch(e) { critErrors[delegate] = `ERROR (${tableName}): ${e.message?.substring(0,200)}`; }
    }
    if (Object.keys(critErrors).length) console.log(`CRIT_ERRORS=${j(critErrors)}`);

    // ── 6. Non-zero vs zero counts summary ──────────────────────────────
    const nonZero = Object.fromEntries(Object.entries(allCounts).filter(([k,v]) => v > 0));
    const zero = Object.fromEntries(Object.entries(allCounts).filter(([k,v]) => v === 0));
    console.log(`NONZERO_COUNTS=${j(nonZero)}`);
    console.log(`ZERO_COUNTS=${j(zero)}`);

    console.log(`FORENSIC_SCAN_COMPLETE=${new Date().toISOString()}`);
  } catch (error) {
    console.error('FATAL:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
