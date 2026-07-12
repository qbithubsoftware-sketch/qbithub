"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { useNavigation } from "@/lib/navigation/store";

import { HeroGallery } from "./HeroGallery";
import { ProductOverview } from "./ProductOverview";
import { SpecificationTable } from "./SpecificationTable";
import { DownloadAssets } from "./DownloadAssets";
import { YouTubeGallery } from "./YouTubeGallery";
import { PublicFAQAccordion } from "./PublicFAQAccordion";
import { PublicTroubleshooting } from "./PublicTroubleshooting";
import { SupportCards } from "./SupportCards";
import { ShareModal } from "./ShareModal";
import { QRCodeCard } from "./QRCodeCard";
import { RelatedProducts } from "./RelatedProducts";
import { ContactForm } from "./ContactForm";
import { ProductSEO } from "./ProductSEO";

import type {
  PublicProductDetail,
  PublicDownloadItem,
  PublicFAQEntry,
  PublicTroubleshootingEntry,
  PublicAccessory,
  SupportCardItem,
  PublicYouTubeVideo,
  PublicProductCard,
} from "@/lib/portal/types";

/**
 * PublicProductLayout — composes all product page sections in order:
 * 1. Hero Gallery + product info header
 * 2. Overview (description + key features)
 * 3. Specifications table
 * 4. Downloads (public assets only)
 * 5. YouTube videos (embedded, never uploaded)
 * 6. FAQs (accordion)
 * 7. Troubleshooting
 * 8. Compatible Accessories
 * 9. Related Products
 * 10. Support cards + Contact form
 *
 * Also includes a Share button (ShareModal) and QR code card.
 */
export function PublicProductLayout({
  product,
  downloads,
  faqs,
  troubleshooting,
  accessories,
  supportCards,
  videos,
  relatedProducts,
  publicUrl,
}: {
  product: PublicProductDetail;
  downloads: PublicDownloadItem[];
  faqs: PublicFAQEntry[];
  troubleshooting: PublicTroubleshootingEntry[];
  accessories: PublicAccessory[];
  supportCards: SupportCardItem[];
  videos: PublicYouTubeVideo[];
  relatedProducts: PublicProductCard[];
  /** The public URL for this product (used for sharing + QR code). */
  publicUrl: string;
}) {
  const navigate = useNavigation((s) => s.navigate);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white text-qbit-on-surface">
      {/* SEO: JSON-LD structured data + dynamic meta tags */}
      <ProductSEO
        product={{
          name: product.name,
          description: product.description,
          model: product.model,
          category: product.category,
          availability: product.availability,
          url: publicUrl,
          image: product.galleryImages[0]?.url,
          brand: "QBIT Hub",
        }}
      />

      {/* Spacer for fixed header */}
      <div className="h-[72px] shrink-0" />

      <main className="flex-1">
        {/* ===== Hero Section ===== */}
        <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Gallery */}
            <HeroGallery images={product.galleryImages} productName={product.name} />

            {/* Product info */}
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {product.badges.map((badge, idx) => (
                  <TagBadge key={idx} variant={badge.variant === "success" ? "primary" : "primary"}>
                    {badge.label}
                  </TagBadge>
                ))}
              </div>

              {/* Title */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-qbit-primary mb-1">
                  {product.category}
                </p>
                <h1 className="text-3xl font-bold text-qbit-on-surface md:text-4xl">
                  {product.name}
                </h1>
                <p className="text-sm text-qbit-on-surface-variant mt-1">Model: {product.model}</p>
              </div>

              {/* Description */}
              <p className="text-sm text-qbit-on-surface-variant leading-relaxed">
                {product.description}
              </p>

              {/* Availability */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                  product.availability === "In Stock" ? "bg-emerald-100 text-emerald-700" :
                  product.availability === "Pre-Order" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700",
                )}>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    product.availability === "In Stock" ? "bg-emerald-500" :
                    product.availability === "Pre-Order" ? "bg-amber-500" : "bg-red-500",
                  )} />
                  {product.availability}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <QbitButton variant="primary" size="lg" icon="download" onClick={() => navigate("driver-download-center")}>
                  Download Driver
                </QbitButton>
                <QbitButton variant="outline" size="lg" icon="description" onClick={() => navigate("installation-center")}>
                  User Manual
                </QbitButton>
                <QbitButton variant="outline" size="lg" icon="play_circle" onClick={() => navigate("video-training-center")}>
                  Watch Video
                </QbitButton>
                <QbitButton variant="ghost" size="lg" icon="share" onClick={() => setShareOpen(true)}>
                  Share
                </QbitButton>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-qbit-outline-variant">
                <div className="flex items-center gap-1.5 text-xs text-qbit-on-surface-variant">
                  <Icon name="verified" className="text-[16px] text-qbit-primary" filled />
                  3-Year Warranty
                </div>
                <div className="flex items-center gap-1.5 text-xs text-qbit-on-surface-variant">
                  <Icon name="local_shipping" className="text-[16px] text-qbit-primary" />
                  Free Shipping
                </div>
                <div className="flex items-center gap-1.5 text-xs text-qbit-on-surface-variant">
                  <Icon name="support_agent" className="text-[16px] text-qbit-primary" />
                  24/7 Support
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== All sections in order ===== */}
        <div className="mx-auto max-w-7xl px-4 md:px-8 space-y-12 pb-16">
          {/* 1. Overview */}
          <ProductOverview
            description={product.description}
            longDescription={product.longDescription}
            features={product.features}
          />

          {/* 2. Specifications */}
          <SpecificationTable specifications={product.specifications} />

          {/* 3. Downloads */}
          <DownloadAssets downloads={downloads} />

          {/* 4. YouTube Videos */}
          <YouTubeGallery videos={videos} />

          {/* 5. Installation Guide link */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-qbit-on-surface">Installation Guide</h2>
            <div className="rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-low p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary/10 text-qbit-primary shrink-0">
                <Icon name="menu_book" className="text-[24px]" filled />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-qbit-on-surface">Step-by-Step Installation Guide</h4>
                <p className="text-xs text-qbit-on-surface-variant mt-0.5">
                  Complete hardware setup and software provisioning for the {product.name}. Estimated time: 25 minutes.
                </p>
              </div>
              <QbitButton variant="primary" size="md" icon="arrow_forward" onClick={() => navigate("t800-installation-guide")}>
                View Guide
              </QbitButton>
            </div>
          </section>

          {/* 6. FAQs */}
          <PublicFAQAccordion faqs={faqs} />

          {/* 7. Troubleshooting */}
          <PublicTroubleshooting entries={troubleshooting} />

          {/* 8. Compatible Accessories */}
          {accessories.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-qbit-on-surface">Compatible Accessories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {accessories.map((acc) => (
                  <div
                    key={acc.id}
                    className="group flex flex-col items-center text-center p-4 rounded-xl border border-qbit-outline-variant bg-white hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white mb-2", acc.gradient)}>
                      <Icon name={acc.icon} className="text-[24px]" filled />
                    </div>
                    <p className="text-xs font-semibold text-qbit-on-surface">{acc.name}</p>
                    <p className="text-[10px] text-qbit-on-surface-variant mt-0.5">{acc.subtitle}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 9. Related Products */}
          <RelatedProducts
            products={relatedProducts}
            onProductClick={() => {/* In production, navigate to product page */}}
          />

          {/* 10. Support */}
          <SupportCards cards={supportCards} />

          {/* 11. Contact Form */}
          <section id="contact" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-bold text-qbit-on-surface">Get in Touch</h2>
            <p className="text-sm text-qbit-on-surface-variant">
              Have a question about the {product.name}? Our team responds within 1 business hour.
            </p>
            <div className="max-w-2xl">
              <ContactForm productId={product.id} productName={product.name} />
            </div>
          </section>

          {/* 12. QR Code */}
          <section className="flex flex-col items-center text-center py-8 border-t border-qbit-outline-variant">
            <h3 className="text-sm font-semibold text-qbit-on-surface mb-2">
              Scan to view on your phone
            </h3>
            <QRCodeCard url={publicUrl} size={180} productName={product.name} />
            <p className="text-[10px] text-qbit-on-surface-variant mt-3 max-w-xs">
              Point your phone camera at this QR code to open the {product.name} product page on your mobile device.
            </p>
          </section>
        </div>
      </main>

      {/* Share modal */}
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={publicUrl}
        title={product.name}
        description={product.description}
      />
    </div>
  );
}
