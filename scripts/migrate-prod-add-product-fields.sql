-- Manual migration to add slug + all new fields to QbitProduct on production
-- PostgreSQL without losing existing data.
-- Run with: psql "$DATABASE_URL" -f scripts/migrate-prod-add-product-fields.sql

BEGIN;

-- ============================================================
-- 1. QbitProduct: add all new columns (nullable first, fill later)
-- ============================================================
ALTER TABLE "QbitProduct"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "sku" TEXT,
  ADD COLUMN IF NOT EXISTS "serialPattern" TEXT,
  ADD COLUMN IF NOT EXISTS "longDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "galleryImages" TEXT,
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isTrending" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "badgeLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "startingPrice" TEXT,
  ADD COLUMN IF NOT EXISTS "specifications" TEXT,
  ADD COLUMN IF NOT EXISTS "features" TEXT,
  ADD COLUMN IF NOT EXISTS "operatingSystems" TEXT,
  ADD COLUMN IF NOT EXISTS "videos" TEXT,
  ADD COLUMN IF NOT EXISTS "brochureUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "datasheetUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "warrantyUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "sdkUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "utilityUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "qrCodeUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT,
  ADD COLUMN IF NOT EXISTS "tags" TEXT,
  ADD COLUMN IF NOT EXISTS "compatibleDevices" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "downloadCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "aiDiagnosticsSupported" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "drQbitSupported" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "latestDriverVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "latestFirmwareVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "lastUpdated" TIMESTAMP;

-- ============================================================
-- 2. Backfill slug from model for existing rows
--    Slug = lower(model) with non-alphanum replaced by hyphens.
--    Handles duplicates by appending -2, -3, etc.
-- ============================================================
UPDATE "QbitProduct"
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE("model", '[^a-zA-Z0-9]+', '-', 'g'),
      '^-+|-+$', '', 'g'
    ),
    '-{2,}', '-', 'g'
  )
)
WHERE "slug" IS NULL;

-- Deduplicate slugs by appending -2, -3, etc.
UPDATE "QbitProduct" p
SET "slug" = p."slug" || '-' || (
  SELECT COUNT(*)::TEXT
  FROM "QbitProduct" p2
  WHERE p2."slug" = p."slug"
    AND p2."id" < p."id"
)
WHERE EXISTS (
  SELECT 1 FROM "QbitProduct" p3
  WHERE p3."slug" = p."slug" AND p3."id" < p."id"
);

-- Backfill qrCodeUrl from slug
UPDATE "QbitProduct"
SET "qrCodeUrl" = 'https://hub.qbit.com/products/' || "slug"
WHERE "qrCodeUrl" IS NULL AND "slug" IS NOT NULL;

-- ============================================================
-- 3. Make slug NOT NULL + UNIQUE (now that all rows have a value)
-- ============================================================
UPDATE "QbitProduct" SET "slug" = 'product-' || "id" WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "QbitProduct" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "QbitProduct_slug_key" ON "QbitProduct"("slug");

-- Add other indexes for fast filtering
CREATE INDEX IF NOT EXISTS "QbitProduct_category_idx" ON "QbitProduct"("category");
CREATE INDEX IF NOT EXISTS "QbitProduct_deviceType_idx" ON "QbitProduct"("deviceType");
CREATE INDEX IF NOT EXISTS "QbitProduct_isFeatured_idx" ON "QbitProduct"("isFeatured");
CREATE INDEX IF NOT EXISTS "QbitProduct_isTrending_idx" ON "QbitProduct"("isTrending");
CREATE INDEX IF NOT EXISTS "QbitProduct_status_idx" ON "QbitProduct"("status");
CREATE INDEX IF NOT EXISTS "QbitProduct_isActive_idx" ON "QbitProduct"("isActive");

-- ============================================================
-- 4. Create new tables: ProductRelation, ProductOS, ProductMedia,
--    ProductSpecification, ProductFeature
-- ============================================================

CREATE TABLE IF NOT EXISTS "ProductRelation" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "relatedId" TEXT NOT NULL,
  "sortIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductRelation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductRelation_productId_relatedId_key" ON "ProductRelation"("productId", "relatedId");
CREATE INDEX IF NOT EXISTS "ProductRelation_productId_idx" ON "ProductRelation"("productId");
CREATE INDEX IF NOT EXISTS "ProductRelation_relatedId_idx" ON "ProductRelation"("relatedId");
ALTER TABLE "ProductRelation"
  ADD CONSTRAINT "ProductRelation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT "ProductRelation_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE IF NOT EXISTS "ProductOS" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "osName" TEXT NOT NULL,
  "osIcon" TEXT,
  "minVersion" TEXT,
  "sortIndex" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductOS_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProductOS_productId_idx" ON "ProductOS"("productId");
ALTER TABLE "ProductOS"
  ADD CONSTRAINT "ProductOS_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ProductMedia" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "provider" TEXT,
  "externalId" TEXT,
  "altText" TEXT,
  "sortIndex" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProductMedia_productId_type_idx" ON "ProductMedia"("productId", "type");
CREATE INDEX IF NOT EXISTS "ProductMedia_productId_sortIndex_idx" ON "ProductMedia"("productId", "sortIndex");
ALTER TABLE "ProductMedia"
  ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ProductSpecification" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "property" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "group" TEXT,
  "sortIndex" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductSpecification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProductSpecification_productId_idx" ON "ProductSpecification"("productId");
ALTER TABLE "ProductSpecification"
  ADD CONSTRAINT "ProductSpecification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ProductFeature" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sortIndex" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductFeature_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProductFeature_productId_idx" ON "ProductFeature"("productId");
ALTER TABLE "ProductFeature"
  ADD CONSTRAINT "ProductFeature_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 5. Update PublicProductView: make productId nullable + add FK
-- ============================================================
ALTER TABLE "PublicProductView" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "PublicProductView"
  ADD CONSTRAINT "PublicProductView_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;

-- Verify
SELECT 'QbitProduct columns' AS info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'QbitProduct' ORDER BY ordinal_position;
SELECT 'New tables' AS info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('ProductRelation', 'ProductOS', 'ProductMedia', 'ProductSpecification', 'ProductFeature');
SELECT 'Backfilled slugs' AS info;
SELECT id, name, model, slug FROM "QbitProduct" LIMIT 20;
