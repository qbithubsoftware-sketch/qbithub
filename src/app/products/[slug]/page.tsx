/**
 * /products/[slug] — Product detail page.
 *
 * Server component. Fetches product by slug from the DB, increments view
 * count, and renders the full detail layout via the ProductDetailClient
 * component.
 *
 * If the slug doesn't match a product, returns 404.
 */

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductDetailClient } from "@/components/qbit/catalog/ProductDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await db.qbitProduct.findUnique({
    where: { slug },
    include: {
      specEntries: { orderBy: { sortIndex: "asc" } },
      featureEntries: { orderBy: { sortIndex: "asc" } },
      productOS: { orderBy: { sortIndex: "asc" } },
      mediaFiles: { orderBy: [{ isPrimary: "desc" }, { sortIndex: "asc" }] },
      relatedProducts: {
        orderBy: { sortIndex: "asc" },
        take: 4,
        include: {
          related: {
            select: {
              id: true, name: true, slug: true, brand: true, model: true,
              deviceType: true, category: true, description: true, imageUrl: true,
              startingPrice: true, badgeLabel: true,
            },
          },
        },
      },
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  // Increment view count (fire-and-forget)
  void db.qbitProduct
    .update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  // Shape for the client component
  const shaped = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    manufacturer: product.manufacturer,
    model: product.model,
    slug: product.slug,
    deviceType: product.deviceType,
    category: product.category,
    description: product.description,
    longDescription: product.longDescription,
    imageUrl: product.imageUrl,
    galleryImages: safeJsonParse<{ url: string; alt: string }[]>(product.galleryImages, []),
    specifications:
      product.specEntries.length > 0
        ? product.specEntries.map((s) => ({ property: s.property, value: s.value, group: s.group ?? null }))
        : safeJsonParse<{ property: string; value: string; group?: string }[]>(product.specifications, []),
    features:
      product.featureEntries.length > 0
        ? product.featureEntries.map((f) => ({ icon: f.icon, title: f.title, description: f.description }))
        : safeJsonParse<{ icon: string; title: string; description: string }[]>(product.features, []),
    operatingSystems:
      product.productOS.length > 0
        ? product.productOS.map((o) => ({ osName: o.osName, osIcon: o.osIcon ?? "info", minVersion: o.minVersion ?? null }))
        : safeJsonParse<{ osName: string; osIcon: string; minVersion?: string }[]>(product.operatingSystems, []),
    videos: safeJsonParse<{ title: string; url: string; provider?: string; externalId?: string }[]>(product.videos, []),
    mediaFiles: product.mediaFiles.map((m) => ({
      id: m.id, type: m.type, title: m.title, url: m.url, mimeType: m.mimeType ?? null,
      thumbnailUrl: m.thumbnailUrl ?? null, altText: m.altText ?? null,
      provider: m.provider ?? null, externalId: m.externalId ?? null,
    })),
    sku: product.sku,
    startingPrice: product.startingPrice,
    badgeLabel: product.badgeLabel,
    isFeatured: product.isFeatured,
    isTrending: product.isTrending,
    tags: product.tags ? product.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    compatibleDevices: product.compatibleDevices
      ? product.compatibleDevices.split(",").map((d) => d.trim()).filter(Boolean)
      : [],
    status: product.status,
    driverDownloadUrl: product.driverDownloadUrl,
    manualUrl: product.manualUrl,
    installationGuideUrl: product.installationGuideUrl,
    knowledgeBaseUrl: product.knowledgeBaseUrl,
    brochureUrl: product.brochureUrl,
    datasheetUrl: product.datasheetUrl,
    warrantyUrl: product.warrantyUrl,
    sdkUrl: product.sdkUrl,
    utilityUrl: product.utilityUrl,
    qrCodeUrl: product.qrCodeUrl,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    viewCount: product.viewCount,
    downloadCount: product.downloadCount,
    aiDiagnosticsSupported: product.aiDiagnosticsSupported,
    drQbitSupported: product.drQbitSupported,
    latestDriverVersion: product.latestDriverVersion,
    latestFirmwareVersion: product.latestFirmwareVersion,
    lastUpdated: (product.lastUpdated ?? product.updatedAt).toISOString(),
    relatedProducts: product.relatedProducts.map((r) => r.related),
  };

  return <ProductDetailClient product={shaped} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await db.qbitProduct.findUnique({
    where: { slug },
    select: {
      name: true, brand: true, description: true, longDescription: true,
      seoTitle: true, seoDescription: true, seoKeywords: true, imageUrl: true,
    },
  });

  if (!product) {
    return { title: "Product not found — QBIT Hub" };
  }

  const title = product.seoTitle ?? `${product.name} — QBIT Hub`;
  const description = product.seoDescription ?? product.description ?? product.longDescription?.slice(0, 160) ?? "";

  return {
    title,
    description,
    keywords: product.seoKeywords ? product.seoKeywords.split(",").map((k) => k.trim()) : [product.brand, product.name],
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}
