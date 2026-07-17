-- Migration: Add V4 Smart Device Setup capability fields to QbitProduct.
--
-- These flags control which Smart Device Setup features appear on /dr-qbit:
--   supports_wifi             — Wi-Fi Setup button + Wizard
--   auto_driver_install       — Install Driver Automatically button
--   sdk_available             — Automatic Wi-Fi config (else Guided Mode)
--   firmware_config_supported — Firmware-level config commands
--   connection_types          — CSV: "usb", "usb,wifi", "usb,lan,wifi", etc.
--
-- All default to false/null so existing products behave exactly as before.
-- The admin can enable per-product via Product Master UI.
--
-- Run with: source /tmp/prod-db.env && npx prisma db execute --file scripts/migrate-add-smart-setup-fields.sql --schema prisma/schema.prisma

ALTER TABLE "QbitProduct"
  ADD COLUMN IF NOT EXISTS "supportsWifi" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "autoDriverInstall" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sdkAvailable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "firmwareConfigSupported" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "connectionTypes" TEXT;
