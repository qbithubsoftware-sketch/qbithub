"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useCallback } from "react";

/**
 * Client-side catalog renderer.
 *
 * Renders the full product grid. The entire card is wrapped in <Link> so
 * clicking anywhere navigates to /products/[slug]. The search box is a
 * controlled input that updates the URL ?search= query param via router.push.
 */

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  slug: string;
  deviceType: string;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
  startingPrice: string | null;
  badgeLabel: string | null;
  isFeatured: boolean;
  isTrending: boolean;
  latestDriverVersion: string | null;
  viewCount: number;
  downloadCount: number;
}

const DEVICE_TYPE_ICON: Record<string, string> = {
  thermal_printer: "print",
  barcode_scanner: "barcode_scanner",
  windows_pos: "desktop_windows",
  android_pos: "phone_android",
  cash_drawer: "point_of_sale",
  customer_display: "monitor",
  label_printer: "label",
  kitchen_printer: "restaurant",
  kiosk: "storefront",
  weighing_scale: "scale",
};

export function ProductCatalogClient({
  products,
  activeCategory,
}: {
  products: CatalogProduct[];
  activeCategory: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(initialSearch);

  const onSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("search", value.trim());
      else params.delete("search");
      const qs = params.toString();
      router.push(qs ? `/products?${qs}` : activeCategory ? `/products?category=${activeCategory}` : "/products");
    },
    [router, searchParams, activeCategory],
  );

  const filtered = useMemo(() => {
    if (!searchInput.trim()) return products;
    const q = searchInput.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [products, searchInput]);

  return (
    <>
      {/* Search box */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-qbit-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name, model, brand…"
            className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-lowest py-3 pl-11 pr-4 text-sm text-qbit-on-surface shadow-sm focus:border-qbit-primary focus:outline-none focus:ring-2 focus:ring-qbit-primary/30"
          />
        </div>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-qbit-outline-variant px-6 py-16 text-center">
          <span className="material-symbols-outlined mx-auto text-[48px] text-qbit-on-surface-variant/40">
            inventory_2
          </span>
          <p className="mt-3 text-sm font-medium text-qbit-on-surface">No products found.</p>
          <p className="mt-1 text-xs text-qbit-on-surface-variant">
            Try clearing the search or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const iconName = DEVICE_TYPE_ICON[product.deviceType] ?? "inventory_2";
  const href = `/products/${product.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-xl hover:border-qbit-primary/40"
    >
      {/* Cover */}
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-qbit-surface-container-high via-qbit-surface-container to-qbit-surface-container-low">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="material-symbols-outlined text-[80px] text-qbit-primary/70 transition-transform duration-500 group-hover:scale-110">
            {iconName}
          </span>
        )}
        {product.badgeLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-qbit-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-qbit-on-primary">
            {product.badgeLabel}
          </span>
        )}
        {product.startingPrice && (
          <span className="absolute right-3 top-3 rounded-full border border-qbit-outline-variant/30 bg-qbit-surface-container-lowest/90 px-2.5 py-1 text-xs font-semibold text-qbit-on-surface backdrop-blur">
            {product.startingPrice}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-qbit-primary">
              {product.brand}
            </span>
            <span className="text-xs text-qbit-on-surface-variant">/</span>
            <span className="text-xs text-qbit-on-surface-variant">{product.model}</span>
          </div>
          <h3 className="text-base font-bold text-qbit-on-surface group-hover:text-qbit-primary">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs text-qbit-on-surface-variant">
              {product.description}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-auto flex items-center justify-between border-t border-qbit-outline-variant/50 pt-3 text-xs text-qbit-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            {product.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">download</span>
            {product.downloadCount}
          </span>
          {product.latestDriverVersion && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">memory</span>
              {product.latestDriverVersion}
            </span>
          )}
          <span className="flex items-center gap-1 font-semibold text-qbit-primary">
            View Details
            <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
