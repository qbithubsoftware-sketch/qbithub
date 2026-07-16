-- Migration: Add `visibility` column to ProductMedia table
-- for Role-Based Access Control (RBAC) on downloadable resources.
--
-- Run with: source /tmp/prod-db.env && npx prisma db execute --file scripts/migrate-add-visibility.sql --schema prisma/schema.prisma

ALTER TABLE "ProductMedia"
  ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'public';

CREATE INDEX IF NOT EXISTS "ProductMedia_visibility_idx"
  ON "ProductMedia"("visibility");
