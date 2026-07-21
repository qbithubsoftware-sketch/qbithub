/**
 * GET /api/admin/product-categories
 * Returns all distinct product categories from the QbitProduct table.
 * Used by the Global Resource Library's "Supported Categories" multi-select.
 *
 * Security: requireAdmin
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";

const CATEGORY_LABELS: Record<string, string> = {
  "window-pos": "Window POS",
  "android-pos": "Android POS",
  "handy-pos": "Handy POS",
  "thermal-printer": "Thermal Printer",
  "portable-printer": "Portable Printer",
  "barcode-printer": "Barcode Printer",
  "barcode-scanner": "Barcode Scanner",
  "cash-drawer": "Cash Drawer",
  "customer-side-display": "Customer Side Display",
  "self-ordering-kiosk": "Self Ordering Kiosk",
  "digital-standee": "Digital Standee",
};

export async function GET() {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  // Fetch distinct categories from products
  const products = await db.qbitProduct.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
  });

  const categories = products
    .map((p) => p.category)
    .filter((c): c is string => c !== null && c.length > 0)
    .map((slug) => ({
      slug,
      label: CATEGORY_LABELS[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return NextResponse.json({ categories });
}
