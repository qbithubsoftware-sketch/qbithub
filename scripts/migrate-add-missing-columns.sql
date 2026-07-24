-- Migration: Add ALL missing columns to production PostgreSQL database.
--
-- This script closes the gap between the incremental manual migrations
-- and the current Prisma schema. It adds:
--   1. 7 missing V5 Enterprise columns to Resource table
--   2. ~34 missing V3/V6 columns to QbitProduct table
--   3. Fixes url NOT NULL → nullable on Resource (Prisma declares it String?)
--
-- ROOT CAUSE: Production DB was built via manual SQL scripts that didn't
-- cover all schema fields. Pages/API routes that query missing columns
-- crash with Runtime Rendering Error (Prisma column-not-found).
--
-- SAFE: All new columns are nullable or have default values.
-- No data loss. Existing rows get default/null values.
--
-- Run with: npx prisma db execute --file scripts/migrate-add-missing-columns.sql --schema prisma/schema.prisma
--   (requires DATABASE_URL pointing to production PostgreSQL)

BEGIN;

-- ============================================================
-- 1. Resource: Add 7 missing V5 Enterprise columns
-- ============================================================
ALTER TABLE "Resource"
  ADD COLUMN IF NOT EXISTS "storageKey" TEXT,
  ADD COLUMN IF NOT EXISTS "publicUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "storageProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "urlType" TEXT NOT NULL DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS "extension" TEXT,
  ADD COLUMN IF NOT EXISTS "originalFileName" TEXT,
  ADD COLUMN IF NOT EXISTS "checksum" TEXT;

-- Fix: url was NOT NULL in original migration but Prisma declares String?
ALTER TABLE "Resource" ALTER COLUMN "url" DROP NOT NULL;

-- Backfill urlType from existing data:
-- External URLs (http/https) → urlType = 'external'
-- Internal storage keys → urlType = 'uploaded'
UPDATE "Resource"
SET "urlType" = 'external',
    "publicUrl" = "url"
WHERE "urlType" = 'uploaded'
  AND "url" IS NOT NULL
  AND ("url" LIKE 'http://%' OR "url" LIKE 'https://%');

-- Null url with no storageKey → still 'uploaded' (placeholder)
UPDATE "Resource"
SET "urlType" = 'external'
WHERE "urlType" = 'uploaded'
  AND "storageKey" IS NULL
  AND "publicUrl" IS NOT NULL;

-- ============================================================
-- 2. QbitProduct: Add missing V3 PIM columns
-- ============================================================
ALTER TABLE "QbitProduct"
  ADD COLUMN IF NOT EXISTS "subCategory" TEXT,
  ADD COLUMN IF NOT EXISTS "productSeries" TEXT,
  ADD COLUMN IF NOT EXISTS "productType" TEXT,
  ADD COLUMN IF NOT EXISTS "highlights" TEXT,
  ADD COLUMN IF NOT EXISTS "installationInstructions" TEXT,
  ADD COLUMN IF NOT EXISTS "requiredSoftware" TEXT,
  ADD COLUMN IF NOT EXISTS "requiredDrivers" TEXT,
  ADD COLUMN IF NOT EXISTS "requiredAccessories" TEXT,
  ADD COLUMN IF NOT EXISTS "installationTime" TEXT,
  ADD COLUMN IF NOT EXISTS "difficultyLevel" TEXT;

-- ============================================================
-- 3. QbitProduct: Add missing V3 SEO columns
-- ============================================================
ALTER TABLE "QbitProduct"
  ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "openGraphImage" TEXT,
  ADD COLUMN IF NOT EXISTS "twitterCard" TEXT,
  ADD COLUMN IF NOT EXISTS "productSchema" TEXT;

-- ============================================================
-- 4. QbitProduct: Add missing V3 Related Products columns
-- ============================================================
ALTER TABLE "QbitProduct"
  ADD COLUMN IF NOT EXISTS "frequentlyBoughtTogether" TEXT,
  ADD COLUMN IF NOT EXISTS "alternativeProducts" TEXT,
  ADD COLUMN IF NOT EXISTS "upgradedModel" TEXT,
  ADD COLUMN IF NOT EXISTS "previousModel" TEXT;

-- ============================================================
-- 5. QbitProduct: Add missing V3 Warranty + Status columns
-- ============================================================
ALTER TABLE "QbitProduct"
  ADD COLUMN IF NOT EXISTS "warrantyDuration" TEXT,
  ADD COLUMN IF NOT EXISTS "amcAvailable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isDraft" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isNewArrival" BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 6. QbitProduct: Add missing V3 Analytics + Activity columns
-- ============================================================
ALTER TABLE "QbitProduct"
  ADD COLUMN IF NOT EXISTS "driverDownloadCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "manualDownloadCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "installationGuideDownloadCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "qrScanCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "barcodePrintCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "shareCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- ============================================================
-- 7. QbitProduct: Add isActive (used in homepage WHERE clause!)
-- ============================================================
ALTER TABLE "QbitProduct"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- 8. QbitProduct: Add categoryId (V6 Extensible Architecture)
-- ============================================================
ALTER TABLE "QbitProduct"
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- ============================================================
-- 9. Create missing V6 tables: DeviceCategory, ProductCapability,
--    ProductConnectionType, CapabilityProfile, ConnectionType
-- ============================================================

CREATE TABLE IF NOT EXISTS "DeviceCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "icon" TEXT,
  "description" TEXT,
  "parentId" TEXT,
  "sortIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeviceCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DeviceCategory_slug_key" ON "DeviceCategory"("slug");
CREATE INDEX IF NOT EXISTS "DeviceCategory_parentId_idx" ON "DeviceCategory"("parentId");

CREATE TABLE IF NOT EXISTS "CapabilityProfile" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CapabilityProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CapabilityProfile_slug_key" ON "CapabilityProfile"("slug");

CREATE TABLE IF NOT EXISTS "ConnectionType" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "icon" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConnectionType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ConnectionType_slug_key" ON "ConnectionType"("slug");

CREATE TABLE IF NOT EXISTS "ProductCapability" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "capabilityId" TEXT NOT NULL,
  "sortIndex" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductCapability_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductCapability_productId_capabilityId_key" ON "ProductCapability"("productId", "capabilityId");
CREATE INDEX IF NOT EXISTS "ProductCapability_productId_idx" ON "ProductCapability"("productId");

CREATE TABLE IF NOT EXISTS "ProductConnectionType" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "connectionTypeId" TEXT NOT NULL,
  "sortIndex" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductConnectionType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductConnectionType_productId_connectionTypeId_key" ON "ProductConnectionType"("productId", "connectionTypeId");
CREATE INDEX IF NOT EXISTS "ProductConnectionType_productId_idx" ON "ProductConnectionType"("productId");

COMMIT;

-- Verification
SELECT 'Resource columns' AS info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'Resource' ORDER BY ordinal_position;
SELECT 'QbitProduct columns' AS info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'QbitProduct' ORDER BY ordinal_position;
SELECT 'New V6 tables' AS info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('DeviceCategory', 'CapabilityProfile', 'ConnectionType', 'ProductCapability', 'ProductConnectionType');
