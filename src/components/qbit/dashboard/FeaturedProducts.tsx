"use client";

import { useRef } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SectionHeader, CarouselNav } from "./SectionHeader";
import type { FeaturedProduct } from "./types";

/**
 * Featured Products — horizontal-scroll carousel of new-release product
 * cards.  Matches the Stitch design: card with gradient/image header,
 * badge, title, description, "View Specs" button.
 */
export function FeaturedProducts({ items }: { items: FeaturedProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: "prev" | "next") {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = 280 + 16; // card min-width + gap
    container.scrollBy({
      left: dir === "next" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  }

  return (
    <section>
      <SectionHeader
        title="New Releases"
        rightContent={<CarouselNav onPrev={() => scrollBy("prev")} onNext={() => scrollBy("next")} />}
      />
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto custom-scrollbar pb-4"
      >
        {items.map((product) => (
          <FeaturedProductCard key={product.name} product={product} />
        ))}
      </div>
    </section>
  );
}

function FeaturedProductCard({ product }: { product: FeaturedProduct }) {
  const gradient =
    product.gradient ?? "from-qbit-surface-container to-qbit-surface-container-high";
  const badgeClass =
    product.badgeVariant === "neutral"
      ? "bg-qbit-on-surface-variant text-white"
      : "bg-qbit-primary text-white";

  return (
    <div className="min-w-[280px] bg-qbit-surface-container-lowest border border-qbit-outline-variant rounded-2xl overflow-hidden group hover:shadow-lg transition-all">
      <div className={`h-40 relative bg-gradient-to-br ${gradient} overflow-hidden flex items-center justify-center`}>
        <Icon
          name={product.icon ?? "devices"}
          className="text-[56px] text-white/90 transition-transform duration-500 group-hover:scale-110"
          filled
        />
        {product.badge && (
          <span
            className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${badgeClass}`}
          >
            {product.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h4 className="text-sm font-medium text-qbit-on-surface">{product.name}</h4>
        <p className="text-sm text-qbit-on-surface-variant line-clamp-1 mb-4">
          {product.description}
        </p>
        <button className="w-full py-2 bg-qbit-surface-container hover:bg-qbit-primary hover:text-white text-qbit-primary text-xs font-bold rounded-lg transition-all">
          View Specs
        </button>
      </div>
    </div>
  );
}
