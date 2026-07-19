/**
 * GET /api/public/products/[slug] — fetch a single product by its slug
 * with all related data: specs, features, OS, media, related products,
 * and increment view count.
 *
 * Public endpoint — no auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ slug: string }>;
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const product = await db.qbitProduct.findUnique({
      where: { slug },
      include: {
        specEntries: { orderBy: { sortIndex: "asc" } },
        featureEntries: { orderBy: { sortIndex: "asc" } },
        productOS: { orderBy: { sortIndex: "asc" } },
        mediaFiles: {
          where: { visibility: "public" },
          orderBy: { sortIndex: "asc" },
        },
        // V5: Fetch shared resources from Global Resource Library
        resourceMappings: {
          include: {
            resource: {
              select: {
                id: true, name: true, type: true, version: true,
                description: true, url: true, mimeType: true, fileSize: true,
                thumbnailUrl: true, status: true, downloadCount: true,
                releaseDate: true,
              },
            },
          },
          orderBy: { sortIndex: "asc" },
        },
        relatedProducts: {
          orderBy: { sortIndex: "asc" },
          take: 8,
          include: {
            related: {
              select: {
                id: true, name: true, slug: true, brand: true, model: true,
                deviceType: true, category: true, description: true, imageUrl: true,
                startingPrice: true, badgeLabel: true, isFeatured: true, isTrending: true,
              },
            },
          },
        },
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Increment view count (fire-and-forget, don't block the response)
    void db.qbitProduct
      .update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => { /* ignore increment errors */ });

    // Log the view for analytics
    const referer = req.headers.get("referer");
    void db.publicProductView
      .create({
        data: {
          productId: product.id,
          productName: product.name,
          referrer: referer,
        },
      })
      .catch(() => { /* ignore view log errors */ });

    return NextResponse.json({
      product: {
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
        specifications: product.specEntries.length > 0
          ? product.specEntries.map((s) => ({ property: s.property, value: s.value, group: s.group ?? undefined }))
          : safeJsonParse<{ property: string; value: string; group?: string }[]>(product.specifications, []),
        features: product.featureEntries.length > 0
          ? product.featureEntries.map((f) => ({ icon: f.icon, title: f.title, description: f.description }))
          : safeJsonParse<{ icon: string; title: string; description: string }[]>(product.features, []),
        operatingSystems: product.productOS.length > 0
          ? product.productOS.map((o) => ({ osName: o.osName, osIcon: o.osIcon ?? undefined, minVersion: o.minVersion ?? undefined }))
          : safeJsonParse<{ osName: string; osIcon: string; minVersion?: string }[]>(product.operatingSystems, []),
        videos: safeJsonParse<{ title: string; url: string; type?: string; provider?: string; externalId?: string }[]>(product.videos, []),
        mediaFiles: product.mediaFiles.map((m) => ({
          id: m.id, type: m.type, title: m.title, url: m.url, mimeType: m.mimeType ?? null,
          thumbnailUrl: m.thumbnailUrl ?? null, altText: m.altText ?? null,
          provider: m.provider ?? null, externalId: m.externalId ?? null,
        })),
        // V5: Shared resources from Global Resource Library
        sharedResources: product.resourceMappings.map((m) => ({
          mappingId: m.id,
          resourceId: m.resource.id,
          type: m.overrideType ?? m.resource.type,
          name: m.resource.name,
          version: m.resource.version,
          description: m.resource.description,
          url: m.resource.url,
          mimeType: m.resource.mimeType,
          fileSize: m.resource.fileSize,
          thumbnailUrl: m.resource.thumbnailUrl,
          status: m.resource.status,
          downloadCount: m.resource.downloadCount,
          releaseDate: m.resource.releaseDate?.toISOString() ?? null,
        })),
        // SECURITY: sku + serialPattern are internal-inventory fields — never expose to public.
        // (Removed from public response per V3 security hardening.)
        startingPrice: product.startingPrice,
        badgeLabel: product.badgeLabel,
        isFeatured: product.isFeatured,
        isTrending: product.isTrending,
        tags: product.tags ? product.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        compatibleDevices: product.compatibleDevices ? product.compatibleDevices.split(",").map((d) => d.trim()).filter(Boolean) : [],
        status: product.status,
        // Resource links
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
        // SEO
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        seoKeywords: product.seoKeywords ? product.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
        // Stats + flags
        viewCount: product.viewCount,
        downloadCount: product.downloadCount,
        aiDiagnosticsSupported: product.aiDiagnosticsSupported,
        drQbitSupported: product.drQbitSupported,
        latestDriverVersion: product.latestDriverVersion,
        latestFirmwareVersion: product.latestFirmwareVersion,
        lastUpdated: product.lastUpdated ?? product.updatedAt,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        // Related products (from ProductRelation join table)
        relatedProducts: product.relatedProducts.map((r) => r.related),
      },
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/public/products/[slug]:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
