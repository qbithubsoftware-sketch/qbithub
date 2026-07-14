/**
 * /products — public product catalog with optional category filter.
 *
 * URL: /products                  → list all
 * URL: /products?category=windows-pos  → filter by category
 * URL: /products?search=T-800     → search
 */

import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCatalogClient } from "@/components/qbit/catalog/ProductCatalogClient";

export const dynamic = "force-dynamic";

// Canonical list of categories shown in the Browse Categories strip.
// Slugs match the `QbitProduct.category` field values exactly.
const CATEGORIES: ReadonlyArray<{ name: string; slug: string; icon: string }> = [
  { name: "Windows POS", slug: "windows-pos", icon: "desktop_windows" },
  { name: "Android POS", slug: "android-pos", icon: "phone_android" },
  { name: "Thermal Printer", slug: "thermal-printer", icon: "print" },
  { name: "Barcode Scanner", slug: "barcode-scanner", icon: "barcode_scanner" },
  { name: "Cash Drawer", slug: "cash-drawer", icon: "point_of_sale" },
  { name: "Label Printer", slug: "label-printer", icon: "label" },
  { name: "Kiosk", slug: "kiosk", icon: "storefront" },
  { name: "Customer Display", slug: "customer-display", icon: "monitor" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;

  const where: Record<string, unknown> = { isActive: true, status: "active" };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { model: { contains: search } },
      { brand: { contains: search } },
      { sku: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  const products = await db.qbitProduct.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { isTrending: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, name: true, brand: true, model: true, slug: true,
      deviceType: true, category: true, description: true, imageUrl: true,
      startingPrice: true, badgeLabel: true, isFeatured: true, isTrending: true,
      latestDriverVersion: true, viewCount: true, downloadCount: true,
    },
  });

  return (
    <div className="min-h-screen bg-qbit-surface">
      {/* Top bar — back to Hub */}
      <header className="sticky top-0 z-10 border-b border-qbit-outline-variant/50 bg-qbit-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-qbit-on-surface-variant hover:text-qbit-primary"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back to Hub
          </Link>
          <span className="text-qbit-outline-variant">/</span>
          <span className="text-sm font-semibold text-qbit-on-surface">Products</span>
          {category && (
            <>
              <span className="text-qbit-outline-variant">/</span>
              <span className="text-sm font-semibold capitalize text-qbit-primary">
                {category.replace(/-/g, " ")}
              </span>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-qbit-on-surface md:text-4xl">
            {category ? `${category.replace(/-/g, " ")}`.replace(/\b\w/g, (c) => c.toUpperCase()) : "All Products"}
          </h1>
          <p className="mt-2 text-base text-qbit-on-surface-variant">
            Browse the QBIT enterprise hardware catalog — {products.length} {products.length === 1 ? "product" : "products"} found.
          </p>
        </div>

        {/* Browse Categories strip */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-qbit-on-surface">Browse Categories</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
            {CATEGORIES.map((cat) => {
              const isActive = cat.slug === category;
              return (
                <Link
                  key={cat.slug}
                  href={isActive ? "/products" : `/products?category=${cat.slug}`}
                  className={`group flex flex-col items-center rounded-2xl border p-4 text-center transition-all ${
                    isActive
                      ? "border-qbit-primary bg-qbit-primary/5 ring-2 ring-qbit-primary/20"
                      : "border-qbit-outline-variant/50 hover:border-qbit-primary/30 hover:bg-qbit-surface-container-low"
                  }`}
                >
                  <span className="material-symbols-outlined mb-2 text-[28px] text-qbit-primary">
                    {cat.icon}
                  </span>
                  <span className={`text-xs font-semibold ${isActive ? "text-qbit-primary" : "text-qbit-on-surface"}`}>
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Product grid */}
        <ProductCatalogClient products={products} activeCategory={category ?? null} />
      </main>
    </div>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  if (category) {
    const title = `${category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — QBIT Hub`;
    return {
      title,
      description: `Browse all QBIT ${category.replace(/-/g, " ")} products with specifications, drivers, and manuals.`,
    };
  }
  return {
    title: "All Products — QBIT Hub",
    description: "Browse the complete QBIT enterprise hardware catalog: POS terminals, thermal printers, barcode scanners, cash drawers, label printers, kiosks and more.",
  };
}
