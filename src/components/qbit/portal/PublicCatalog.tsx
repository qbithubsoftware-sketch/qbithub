"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { PublicProductGrid } from "./PublicProductCard";
import { EmptyState } from "@/components/qbit/dashboard/EmptyState";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { PublicProductCard, PublicCategoryFilter } from "@/lib/portal/types";

/**
 * PublicCatalog — the public-facing product catalog with category filter
 * chips and search.  Reuses PublicProductGrid for the results.
 */
export function PublicCatalog({
  products,
  categories,
  onProductClick,
}: {
  products: PublicProductCard[];
  categories: PublicCategoryFilter[];
  onProductClick?: (product: PublicProductCard) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (query) {
        const q = query.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.subtitle.toLowerCase().includes(q)) return false;
      }
      if (activeCategory !== "all" && p.categorySlug !== activeCategory) return false;
      return true;
    });
  }, [products, query, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-2xl mx-auto">
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-qbit-outline" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by name or model..."
          className="w-full rounded-full border border-qbit-outline-variant bg-white py-3 pl-12 pr-4 text-sm text-qbit-on-surface shadow-sm focus:ring-2 focus:ring-qbit-primary/20 focus:border-qbit-primary"
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
            activeCategory === "all"
              ? "bg-qbit-primary text-qbit-on-primary shadow-md"
              : "bg-white text-qbit-on-surface-variant border border-qbit-outline-variant hover:bg-qbit-surface-container",
          )}
        >
          All Products ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.slug)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
              activeCategory === cat.slug
                ? "bg-qbit-primary text-qbit-on-primary shadow-md"
                : "bg-white text-qbit-on-surface-variant border border-qbit-outline-variant hover:bg-qbit-surface-container",
            )}
          >
            <Icon name={cat.icon} className="text-[16px]" />
            {cat.name} ({cat.productCount})
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <SurfaceCard className="p-8">
          <EmptyState
            icon="search_off"
            title="No products found"
            description="Try a different search term or browse all categories."
          />
        </SurfaceCard>
      ) : (
        <PublicProductGrid products={filtered} onProductClick={onProductClick} />
      )}
    </div>
  );
}
