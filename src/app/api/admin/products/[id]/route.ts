/**
 * GET    /api/admin/products/[id] — fetch single product (with specs, features, OS, media, related)
 * PUT    /api/admin/products/[id] — update product (all fields, including structured child rows)
 * DELETE /api/admin/products/[id] — delete product (?hard=true for permanent, default soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/notifications/auth";
import { sanitizeText } from "@/lib/security/validation";
import { generateUniqueSlug } from "@/lib/products/slug";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const { id } = await params;
    const product = await db.qbitProduct.findUnique({
      where: { id },
      include: {
        _count: { select: { hardwareSignatures: true, detectedDevices: true, devicePassports: true } },
        specEntries: { orderBy: { sortIndex: "asc" } },
        featureEntries: { orderBy: { sortIndex: "asc" } },
        productOS: { orderBy: { sortIndex: "asc" } },
        mediaFiles: { orderBy: [{ isPrimary: "desc" }, { sortIndex: "asc" }] },
        relatedProducts: {
          orderBy: { sortIndex: "asc" },
          include: {
            related: {
              select: {
                id: true, name: true, slug: true, brand: true, model: true,
                deviceType: true, category: true, imageUrl: true,
              },
            },
          },
        },
      },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const existing = await db.qbitProduct.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // If model changed, regenerate slug (unless body.slug is provided)
    let newSlug = existing.slug;
    if (body.model && body.model !== existing.model) {
      newSlug = await generateUniqueSlug(body.model, id, body.slug);
    } else if (body.slug && body.slug !== existing.slug) {
      newSlug = await generateUniqueSlug(body.slug, id, body.slug);
    }

    const updateData: Record<string, unknown> = { lastUpdated: new Date() };
    if (body.name !== undefined) updateData.name = sanitizeText(body.name, 200);
    if (body.brand !== undefined) updateData.brand = sanitizeText(body.brand, 50);
    if (body.manufacturer !== undefined) updateData.manufacturer = body.manufacturer ? sanitizeText(body.manufacturer, 200) : null;
    if (body.model !== undefined) updateData.model = sanitizeText(body.model, 100);
    if (newSlug !== existing.slug) updateData.slug = newSlug;
    if (body.deviceType !== undefined) updateData.deviceType = sanitizeText(body.deviceType, 50);
    if (body.category !== undefined) updateData.category = body.category || null;
    if (body.description !== undefined) updateData.description = body.description ? sanitizeText(body.description, 1000) : null;
    if (body.longDescription !== undefined) updateData.longDescription = body.longDescription ?? null;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl ?? null;
    if (body.galleryImages !== undefined) {
      // Handle both string (JSON.stringify from frontend) and array formats
      if (typeof body.galleryImages === "string" && body.galleryImages.length > 0) {
        updateData.galleryImages = body.galleryImages;
      } else if (Array.isArray(body.galleryImages) && body.galleryImages.length > 0) {
        updateData.galleryImages = JSON.stringify(body.galleryImages);
      } else {
        updateData.galleryImages = null;
      }
    }
    if (body.sku !== undefined) updateData.sku = body.sku ?? null;
    if (body.serialPattern !== undefined) updateData.serialPattern = body.serialPattern ?? null;
    if (body.startingPrice !== undefined) updateData.startingPrice = body.startingPrice ?? null;
    if (body.badgeLabel !== undefined) updateData.badgeLabel = body.badgeLabel ?? null;
    if (body.isFeatured !== undefined) updateData.isFeatured = !!body.isFeatured;
    if (body.isTrending !== undefined) updateData.isTrending = !!body.isTrending;
    if (body.subCategory !== undefined) updateData.subCategory = body.subCategory ?? null;
    if (body.productSeries !== undefined) updateData.productSeries = body.productSeries ?? null;
    if (body.productType !== undefined) updateData.productType = body.productType ?? null;
    if (body.highlights !== undefined) updateData.highlights = body.highlights ?? null;
    if (body.installationInstructions !== undefined) updateData.installationInstructions = body.installationInstructions ?? null;
    if (body.requiredSoftware !== undefined) updateData.requiredSoftware = body.requiredSoftware ?? null;
    if (body.requiredDrivers !== undefined) updateData.requiredDrivers = body.requiredDrivers ?? null;
    if (body.requiredAccessories !== undefined) updateData.requiredAccessories = body.requiredAccessories ?? null;
    if (body.installationTime !== undefined) updateData.installationTime = body.installationTime ?? null;
    if (body.difficultyLevel !== undefined) updateData.difficultyLevel = body.difficultyLevel ?? null;
    if (body.canonicalUrl !== undefined) updateData.canonicalUrl = body.canonicalUrl ?? null;
    if (body.openGraphImage !== undefined) updateData.openGraphImage = body.openGraphImage ?? null;
    if (body.twitterCard !== undefined) updateData.twitterCard = body.twitterCard ?? null;
    if (body.productSchema !== undefined) updateData.productSchema = body.productSchema ?? null;
    if (body.frequentlyBoughtTogether !== undefined) updateData.frequentlyBoughtTogether = body.frequentlyBoughtTogether ?? null;
    if (body.alternativeProducts !== undefined) updateData.alternativeProducts = body.alternativeProducts ?? null;
    if (body.upgradedModel !== undefined) updateData.upgradedModel = body.upgradedModel ?? null;
    if (body.previousModel !== undefined) updateData.previousModel = body.previousModel ?? null;
    if (body.warrantyDuration !== undefined) updateData.warrantyDuration = body.warrantyDuration ?? null;
    if (body.amcAvailable !== undefined) updateData.amcAvailable = !!body.amcAvailable;
    if (body.isDraft !== undefined) updateData.isDraft = !!body.isDraft;
    if (body.isPublished !== undefined) updateData.isPublished = !!body.isPublished;
    if (body.isBestSeller !== undefined) updateData.isBestSeller = !!body.isBestSeller;
    if (body.isNewArrival !== undefined) updateData.isNewArrival = !!body.isNewArrival;
    if (body.driverDownloadUrl !== undefined) updateData.driverDownloadUrl = body.driverDownloadUrl ?? null;
    if (body.manualUrl !== undefined) updateData.manualUrl = body.manualUrl ?? null;
    if (body.installationGuideUrl !== undefined) updateData.installationGuideUrl = body.installationGuideUrl ?? null;
    if (body.knowledgeBaseUrl !== undefined) updateData.knowledgeBaseUrl = body.knowledgeBaseUrl ?? null;
    if (body.brochureUrl !== undefined) updateData.brochureUrl = body.brochureUrl ?? null;
    if (body.datasheetUrl !== undefined) updateData.datasheetUrl = body.datasheetUrl ?? null;
    if (body.warrantyUrl !== undefined) updateData.warrantyUrl = body.warrantyUrl ?? null;
    if (body.sdkUrl !== undefined) updateData.sdkUrl = body.sdkUrl ?? null;
    if (body.utilityUrl !== undefined) updateData.utilityUrl = body.utilityUrl ?? null;
    if (body.qrCodeUrl !== undefined) {
      updateData.qrCodeUrl = body.qrCodeUrl ?? null;
    } else if (newSlug !== existing.slug) {
      updateData.qrCodeUrl = `https://hub.qbit.com/products/${newSlug}`;
    }
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle ?? null;
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription ?? null;
    if (body.seoKeywords !== undefined) updateData.seoKeywords = body.seoKeywords ?? null;
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags.join(",") : (body.tags ?? null);
    }
    if (body.compatibleDevices !== undefined) {
      updateData.compatibleDevices = Array.isArray(body.compatibleDevices) ? body.compatibleDevices.join(",") : (body.compatibleDevices ?? null);
    }
    if (body.status !== undefined) updateData.status = body.status ?? "active";
    if (body.aiDiagnosticsSupported !== undefined) updateData.aiDiagnosticsSupported = !!body.aiDiagnosticsSupported;
    if (body.drQbitSupported !== undefined) updateData.drQbitSupported = !!body.drQbitSupported;
    if (body.latestDriverVersion !== undefined) updateData.latestDriverVersion = body.latestDriverVersion ?? null;
    if (body.latestFirmwareVersion !== undefined) updateData.latestFirmwareVersion = body.latestFirmwareVersion ?? null;
    if (body.isActive !== undefined) updateData.isActive = !!body.isActive;

    // Update structured child rows
    if (Array.isArray(body.specifications)) {
      await db.productSpecification.deleteMany({ where: { productId: id } });
      if (body.specifications.length > 0) {
        await db.productSpecification.createMany({
          data: body.specifications.map((s: { property: string; value: string; group?: string }, i: number) => ({
            productId: id, property: sanitizeText(s.property, 200), value: sanitizeText(s.value, 500),
            group: s.group ?? null, sortIndex: i,
          })),
        });
      }
    }
    if (Array.isArray(body.features)) {
      await db.productFeature.deleteMany({ where: { productId: id } });
      if (body.features.length > 0) {
        await db.productFeature.createMany({
          data: body.features.map((f: { icon: string; title: string; description: string }, i: number) => ({
            productId: id, icon: sanitizeText(f.icon, 100), title: sanitizeText(f.title, 200),
            description: sanitizeText(f.description, 1000), sortIndex: i,
          })),
        });
      }
    }
    if (Array.isArray(body.operatingSystems)) {
      await db.productOS.deleteMany({ where: { productId: id } });
      if (body.operatingSystems.length > 0) {
        await db.productOS.createMany({
          data: body.operatingSystems.map((o: { osName: string; osIcon?: string; minVersion?: string }, i: number) => ({
            productId: id, osName: sanitizeText(o.osName, 100), osIcon: o.osIcon ?? null,
            minVersion: o.minVersion ?? null, sortIndex: i,
          })),
        });
      }
    }
    if (Array.isArray(body.mediaFiles)) {
      await db.productMedia.deleteMany({ where: { productId: id } });
      if (body.mediaFiles.length > 0) {
        await db.productMedia.createMany({
          data: body.mediaFiles.map((m: { type: string; title: string; url: string; mimeType?: string; altText?: string; provider?: string; externalId?: string; isPrimary?: boolean }, i: number) => ({
            productId: id, type: sanitizeText(m.type, 50), title: sanitizeText(m.title, 200), url: m.url,
            mimeType: m.mimeType ?? null, altText: m.altText ?? null, provider: m.provider ?? null,
            externalId: m.externalId ?? null, sortIndex: i, isPrimary: !!m.isPrimary,
          })),
        });
      }
    }
    if (Array.isArray(body.relatedProductIds)) {
      await db.productRelation.deleteMany({ where: { productId: id } });
      if (body.relatedProductIds.length > 0) {
        await db.productRelation.createMany({
          data: body.relatedProductIds.map((rid: string, i: number) => ({
            productId: id, relatedId: rid, sortIndex: i,
          })),
        });
      }
    }

    const updated = await db.qbitProduct.update({ where: { id }, data: updateData });
    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("[API ERROR] PUT /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const { id } = await params;
    const url = new URL(req.url);
    const hardDelete = url.searchParams.get("hard") === "true";

    const existing = await db.qbitProduct.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    if (hardDelete) {
      await db.$transaction([
        db.unknownDevice.updateMany({ where: { mappedProductId: id }, data: { mappedProductId: null, mappedAt: null, mappedBy: null, mappedByName: null } }),
        db.devicePassport.updateMany({ where: { productId: id }, data: { productId: null } }),
        db.firmwareCompatibility.updateMany({ where: { productId: id }, data: { productId: null } }),
        db.publicProductView.updateMany({ where: { productId: id }, data: { productId: null } }),
        db.qbitProduct.delete({ where: { id } }),
      ]);
      return NextResponse.json({ id, deleted: true, permanent: true, message: "Product permanently deleted" });
    }

    await db.qbitProduct.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ id, deleted: true, permanent: false, message: "Product deactivated (soft delete)" });
  } catch (error) {
    console.error("[API ERROR] DELETE /api/admin/products/[id]:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
