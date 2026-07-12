"use client";

import { Icon } from "@/components/qbit/primitives/Icon";
import { PublicHeader } from "@/components/qbit/portal/PublicHeader";
import { PublicFooter } from "@/components/qbit/portal/PublicFooter";
import { PublicCatalog } from "@/components/qbit/portal/PublicCatalog";
import { ScreenSwitcher } from "@/components/qbit/shells/ScreenSwitcher";
import { useNavigation } from "@/lib/navigation/store";
import { PUBLIC_PRODUCTS, PUBLIC_CATEGORIES } from "@/lib/portal/placeholder-data";
import type { PublicProductCard } from "@/lib/portal/types";

/**
 * PublicSearchPage — public-facing product search page.
 *
 * Reuses PublicCatalog (which includes search + category filter chips +
 * PublicProductGrid).  Wrapped in PublicHeader + PublicFooter for the
 * full marketing layout.
 *
 * No authentication required — searches only public products.
 */
export function PublicSearchPage() {
  const navigate = useNavigation((s) => s.navigate);

  function handleProductClick(product: PublicProductCard) {
    // Navigate to the product overview page
    navigate("product-overview");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-qbit-on-surface">
      {/* Floating Screen Switcher for demo */}
      <div className="fixed top-4 right-4 z-[100]">
        <ScreenSwitcher />
      </div>

      {/* Header */}
      <PublicHeader />

      {/* Main content */}
      <main className="flex-1 pt-[72px]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12 space-y-8">
          {/* Hero */}
          <section className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-qbit-on-surface md:text-4xl">
              Explore QBIT Products
            </h1>
            <p className="text-sm text-qbit-on-surface-variant md:text-base max-w-2xl mx-auto">
              Browse our complete catalog of enterprise POS terminals, thermal printers,
              barcode scanners, and accessories. No login required.
            </p>
          </section>

          {/* Catalog with search + filters */}
          <PublicCatalog
            products={PUBLIC_PRODUCTS}
            categories={PUBLIC_CATEGORIES}
            onProductClick={handleProductClick}
          />
        </div>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
