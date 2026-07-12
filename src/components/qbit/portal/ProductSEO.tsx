"use client";

import { useEffect } from "react";

/**
 * ProductSEO — injects JSON-LD structured data and dynamically updates
 * meta tags for SEO (Open Graph, Twitter Card, canonical URL).
 *
 * This component runs client-side (the app uses a single `/` route with
 * client-side navigation), so it manipulates the document head directly
 * via useEffect.  In a production multi-route setup, this would be
 * replaced by Next.js `generateMetadata` + a server-rendered JSON-LD
 * script tag.
 */

interface ProductSEOData {
  name: string;
  description: string;
  model: string;
  category: string;
  availability: string;
  url: string;
  image?: string;
  brand?: string;
}

/**
 * Injects JSON-LD structured data for a product page:
 * - Product schema (name, description, brand, availability)
 * - BreadcrumbList schema (Home > Products > Category > Product)
 */
export function ProductSEO({ product, baseUrl = "https://hub.qbit.com" }: { product: ProductSEOData; baseUrl?: string }) {
  useEffect(() => {
    // ---- Update document title ----
    const prevTitle = document.title;
    document.title = `${product.name} — ${product.model} | QBIT Hub`;

    // ---- Update meta tags ----
    const metaUpdates = [
      { name: "description", content: product.description },
      { property: "og:title", content: `${product.name} — ${product.model}` },
      { property: "og:description", content: product.description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: product.url },
      { property: "og:site_name", content: "QBIT Hub" },
      { property: "og:image", content: product.image ?? `${baseUrl}/qbit-logo.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${product.name} — ${product.model}` },
      { name: "twitter:description", content: product.description },
      { name: "twitter:image", content: product.image ?? `${baseUrl}/qbit-logo.png` },
    ];

    const createdMetas: HTMLMetaElement[] = [];
    metaUpdates.forEach(({ name, content, property }) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (property) el.setAttribute("property", property);
        else if (name) el.setAttribute("name", name);
        document.head.appendChild(el);
        createdMetas.push(el);
      }
      el.setAttribute("content", content);
    });

    // ---- Canonical URL ----
    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    let createdCanonical = false;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
      createdCanonical = true;
    }
    canonical.href = product.url;

    // ---- JSON-LD: Product schema ----
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      model: product.model,
      category: product.category,
      brand: { "@type": "Brand", name: product.brand ?? "QBIT Hub" },
      offers: {
        "@type": "Offer",
        availability: `https://schema.org/${product.availability === "In Stock" ? "InStock" : product.availability === "Pre-Order" ? "PreOrder" : "Discontinued"}`,
        url: product.url,
      },
      url: product.url,
      image: product.image ?? `${baseUrl}/qbit-logo.png`,
    };

    // ---- JSON-LD: BreadcrumbList schema ----
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "Products", item: `${baseUrl}/products` },
        { "@type": "ListItem", position: 3, name: product.category, item: `${baseUrl}/products/${product.category.toLowerCase().replace(/\s+/g, "-")}` },
        { "@type": "ListItem", position: 4, name: product.name, item: product.url },
      ],
    };

    const productScript = document.createElement("script");
    productScript.type = "application/ld+json";
    productScript.text = JSON.stringify(productSchema);
    productScript.setAttribute("data-seo", "product");
    document.head.appendChild(productScript);

    const breadcrumbScript = document.createElement("script");
    breadcrumbScript.type = "application/ld+json";
    breadcrumbScript.text = JSON.stringify(breadcrumbSchema);
    breadcrumbScript.setAttribute("data-seo", "breadcrumb");
    document.head.appendChild(breadcrumbScript);

    // ---- Cleanup ----
    return () => {
      document.title = prevTitle;
      createdMetas.forEach((el) => el.remove());
      if (createdCanonical) canonical.remove();
      productScript.remove();
      breadcrumbScript.remove();
    };
  }, [product, baseUrl]);

  return null;
}
