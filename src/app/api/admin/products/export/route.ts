/**
 * GET /api/admin/products/export — export products as CSV
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const products = await db.qbitProduct.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { hardwareSignatures: true } } },
    });

    const headers = ["ID", "Name", "Brand", "Manufacturer", "Model", "Device Type", "Description", "Active", "Signatures", "Created At"];
    const rows = products.map((p) => [
      p.id, p.name, p.brand, p.manufacturer ?? "", p.model, p.deviceType,
      p.description ?? "", p.isActive ? "Yes" : "No",
      p._count.hardwareSignatures.toString(), p.createdAt.toISOString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="products-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/products/export:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
