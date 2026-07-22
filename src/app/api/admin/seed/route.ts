/**
 * POST /api/admin/seed — stub route (seed model references removed).
 * The seed-prod.ts script handles seeding separately.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "Use the seed-prod.ts script directly for seeding. This API route is a stub.",
    hint: "Run: bun run scripts/seed-users.ts",
  });
}

export async function GET() {
  return NextResponse.json({
    message: "Seed API stub. Use scripts/seed-users.ts for seeding.",
  });
}
