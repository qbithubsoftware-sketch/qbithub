"use client";

import Link from "next/link";

/**
 * PublicHomepageClient — renders the Featured Products grid on the public
 * homepage. Each card is fully clickable via <Link href="/products/[slug]">.
 *
 * Reuses the existing Stitch design language: gradient cover, badge pills,
 * surface-card body, hover lift.
 */

export interface HomepageProduct {
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

export function PublicHomepageClient({ products }: { products: HomepageProduct[] }) {
  if (!products || products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
        <span className="material-symbols-outlined mx-auto text-[40px] text-qbit-on-surface-variant/40">inventory_2</span>
        <p className="mt-3 text-sm font-medium text-qbit-on-surface">No featured products yet.</p>
        <Link
          href="/products"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-qbit-primary hover:underline"
        >
          Browse all products
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => {
        const iconName = DEVICE_TYPE_ICON[product.deviceType] ?? "inventory_2";
        return (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-qbit-outline-variant bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-qbit-primary/40"
          >
            {/* Cover */}
            <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-qbit-surface-container-high via-qbit-surface-container to-qbit-surface-container-low">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="material-symbols-outlined text-[72px] text-qbit-primary/70 transition-transform duration-500 group-hover:scale-110">
                  {iconName}
                </span>
              )}
              {product.badgeLabel && (
                <span className="absolute left-3 top-3 rounded-full bg-qbit-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-qbit-on-primary">
                  {product.badgeLabel}
                </span>
              )}
              {product.startingPrice && (
                <span className="absolute right-3 top-3 rounded-full border border-qbit-outline-variant/30 bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-qbit-on-surface backdrop-blur">
                  {product.startingPrice}
                </span>
              )}
            </div>
            {/* Body */}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-qbit-primary">
                {product.brand}
                <span className="text-qbit-on-surface-variant">/</span>
                <span className="text-qbit-on-surface-variant">{product.model}</span>
              </div>
              <h3 className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary line-clamp-2">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs text-qbit-on-surface-variant line-clamp-2">{product.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between border-t border-qbit-outline-variant/50 pt-2 text-[11px] text-qbit-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  {product.viewCount}
                </span>
                {product.latestDriverVersion && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">memory</span>
                    {product.latestDriverVersion}
                  </span>
                )}
                <span className="flex items-center gap-1 font-semibold text-qbit-primary">
                  View
                  <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
