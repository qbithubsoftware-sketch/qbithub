#!/usr/bin/env node
/**
 * Quick check: What columns exist in QbitProduct, Resource, HardwareSignature, DevicePassport
 * vs what Prisma expects. Uses $queryRaw for information_schema.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: [] });

async function run() {
  const tables = ['QbitProduct', 'Resource', 'HardwareSignature', 'DevicePassport'];
  for (const tbl of tables) {
    const cols = await p.$queryRawUnsafe(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${tbl}' AND table_schema='public' ORDER BY ordinal_position`
    );
    console.log(`\n=== ${tbl} columns in Neon DB ===`);
    console.log(JSON.stringify(cols, null, 2));
  }
  await p.$disconnect();
}
run();
