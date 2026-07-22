/**
 * GET /api/admin/integrations — stub route (integration config model not yet in schema).
 * Returns an empty array until the model is added.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ items: [], total: 0 });
}

export async function POST() {
  return NextResponse.json({ error: "Integration config model not yet available" }, { status: 501 });
}
