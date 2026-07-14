/**
 * Catch-all API route — returns JSON 404 for unknown API endpoints.
 * Prevents Next.js from rendering the HTML 404 page for API routes.
 */

import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return NextResponse.json(
    { error: "Not Found", message: `API endpoint /api/${path.join("/")} does not exist` },
    { status: 404 },
  );
}

export async function POST(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return NextResponse.json(
    { error: "Not Found", message: `API endpoint /api/${path.join("/")} does not exist` },
    { status: 404 },
  );
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return NextResponse.json(
    { error: "Not Found", message: `API endpoint /api/${path.join("/")} does not exist` },
    { status: 404 },
  );
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return NextResponse.json(
    { error: "Not Found", message: `API endpoint /api/${path.join("/")} does not exist` },
    { status: 404 },
  );
}
