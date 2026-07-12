/**
 * Public Products API — `/api/public/products`.
 *
 * GET: list all products with public visibility.
 * No authentication required — this is a public endpoint.
 *
 * In production, this would query the Product model filtered by
 * visibility="public".  For now it returns placeholder data.
 */

import { NextResponse } from "next/server";

export async function GET() {
  // In production: const products = await db.product.findMany({ where: { visibility: "public" } });
  // For now, return a static count.
  return NextResponse.json({
    products: [],
    total: 0,
    public: true,
  });
}
