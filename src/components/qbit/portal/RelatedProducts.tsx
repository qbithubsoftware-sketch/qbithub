"use client";

import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { PublicProductGrid } from "./PublicProductCard";
import type { PublicProductCard } from "@/lib/portal/types";

/**
 * RelatedProducts — related products section for the product page.
 *
 * REUSES the existing PublicProductCard/PublicProductGrid components.
 */
export function RelatedProducts({
  products,
  onProductClick,
}: {
  products: PublicProductCard[];
  onProductClick?: (product: PublicProductCard) => void;
}) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionHeader title="Related Products" accentDot />
      <PublicProductGrid products={products} onProductClick={onProductClick} />
    </section>
  );
}
