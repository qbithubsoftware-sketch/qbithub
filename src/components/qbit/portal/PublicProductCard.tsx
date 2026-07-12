"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { TagBadge } from "@/components/qbit/primitives/StatusBadge";
import type { PublicProductCard } from "@/lib/portal/types";

const BADGE_VARIANT = {
  primary: "primary",
  neutral: "neutral",
  success: "success",
} as const;

/**
 * PublicProductCard — reusable product card for the public catalog.
 *
 * Shows gradient cover with icon, badges, product name, subtitle,
 * category, starting price, and view count.  Clicking navigates to
 * the product details page.
 */
export function PublicProductCard({
  product,
  onClick,
}: {
  product: PublicProductCard;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-qbit-outline-variant bg-white overflow-hidden text-left transition-all hover:-translate-y-1 hover:shadow-lg w-full"
    >
      {/* Cover */}
      <div className={cn("relative h-36 bg-gradient-to-br flex items-center justify-center overflow-hidden", product.gradient)}>
        <Icon
          name={product.icon}
          className="text-[48px] text-white/90 transition-transform duration-500 group-hover:scale-110"
          filled
        />
        {product.badge && (
          <span className="absolute top-2 right-2 bg-white/95 text-qbit-on-surface text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
            {product.badge}
          </span>
        )}
      </div>
      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider text-qbit-primary mb-1">
          {product.category}
        </span>
        <h4 className="text-sm font-semibold text-qbit-on-surface mb-1 group-hover:text-qbit-primary transition-colors">
          {product.name}
        </h4>
        <p className="text-xs text-qbit-on-surface-variant line-clamp-1 mb-3 flex-1">
          {product.subtitle}
        </p>
        {/* Meta */}
        <div className="flex items-center justify-between text-[11px] text-qbit-on-surface-variant">
          {product.startingPrice && (
            <span className="text-sm font-bold text-qbit-on-surface">
              {product.startingPrice}
            </span>
          )}
          {product.viewCountLabel && (
            <span className="flex items-center gap-1">
              <Icon name="visibility" className="text-[12px]" />
              {product.viewCountLabel}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * PublicProductGrid — responsive grid of PublicProductCards with
 * optional category filter.
 */
export function PublicProductGrid({
  products,
  onProductClick,
}: {
  products: PublicProductCard[];
  onProductClick?: (product: PublicProductCard) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <PublicProductCard
          key={product.id}
          product={product}
          onClick={() => onProductClick?.(product)}
        />
      ))}
    </div>
  );
}
