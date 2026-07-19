-- V5 Migration: Create Global Resource Library + Product Resource Mapping tables
--
-- Creates two new tables:
--   1. "Resource" — global shared resource library (resources exist ONCE)
--   2. "ProductResourceMapping" — many-to-many join between products and resources
--
-- Run with: source /tmp/prod-db.env && npx prisma db execute --file scripts/migrate-v5-resource-library.sql --schema prisma/schema.prisma

CREATE TABLE IF NOT EXISTS "Resource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "version" TEXT,
  "description" TEXT,
  "supportedCategories" TEXT,
  "url" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "thumbnailUrl" TEXT,
  "releaseDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'active',
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'public',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Resource_type_idx" ON "Resource"("type");
CREATE INDEX IF NOT EXISTS "Resource_status_idx" ON "Resource"("status");
CREATE INDEX IF NOT EXISTS "Resource_visibility_idx" ON "Resource"("visibility");
CREATE INDEX IF NOT EXISTS "Resource_name_idx" ON "Resource"("name");

CREATE TABLE IF NOT EXISTS "ProductResourceMapping" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "overrideType" TEXT,
  "sortIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductResourceMapping_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductResourceMapping_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "QbitProduct"("id") ON DELETE CASCADE,
  CONSTRAINT "ProductResourceMapping_resourceId_fkey"
    FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductResourceMapping_productId_resourceId_key"
  ON "ProductResourceMapping"("productId", "resourceId");
CREATE INDEX IF NOT EXISTS "ProductResourceMapping_productId_idx" ON "ProductResourceMapping"("productId");
CREATE INDEX IF NOT EXISTS "ProductResourceMapping_resourceId_idx" ON "ProductResourceMapping"("resourceId");
