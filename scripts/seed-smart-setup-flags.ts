/**
 * Enable V4 Smart Device Setup capabilities on specific demo products.
 *
 * - P80UE Thermal Printer: Wi-Fi supported + auto driver install + SDK + firmware config
 * - W512 Window POS: Wi-Fi supported + auto driver install (no SDK → Guided mode)
 * - 2DSW Barcode Scanner: USB only (no Wi-Fi)
 * - CD85 Cash Drawer: USB only
 *
 * Run with: source /tmp/prod-db.env && npx tsx scripts/seed-smart-setup-flags.ts
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  console.log("=== Enabling V4 Smart Device Setup capabilities ===\n");

  // P80UE — full Wi-Fi + auto driver + SDK + firmware config
  const p80ue = await db.qbitProduct.update({
    where: { slug: "p80ue" },
    data: {
      supportsWifi: true,
      autoDriverInstall: true,
      sdkAvailable: true,
      firmwareConfigSupported: true,
      connectionTypes: "usb,wifi",
    },
  });
  console.log(`  ✓ P80UE: Wi-Fi ✓, Auto Driver ✓, SDK ✓, Firmware Config ✓, Connections: usb,wifi`);

  // W512 — Wi-Fi supported but NO SDK → forces Guided Wi-Fi Setup mode
  const w512 = await db.qbitProduct.update({
    where: { slug: "w512" },
    data: {
      supportsWifi: true,
      autoDriverInstall: true,
      sdkAvailable: false,       // ← triggers Guided Mode in Wi-Fi wizard
      firmwareConfigSupported: false,
      connectionTypes: "usb,wifi,lan",
    },
  });
  console.log(`  ✓ W512:  Wi-Fi ✓, Auto Driver ✓, SDK ✗ (Guided), Firmware Config ✗, Connections: usb,wifi,lan`);

  // 2DSW — USB only (no Wi-Fi)
  const d2sw = await db.qbitProduct.update({
    where: { slug: "2dsw" },
    data: {
      supportsWifi: false,
      autoDriverInstall: false,
      sdkAvailable: false,
      firmwareConfigSupported: false,
      connectionTypes: "usb",
    },
  });
  console.log(`  ✓ 2DSW:  Wi-Fi ✗, Auto Driver ✗, SDK ✗, Connections: usb`);

  // CD85 — USB only
  const cd85 = await db.qbitProduct.update({
    where: { slug: "cd85" },
    data: {
      supportsWifi: false,
      autoDriverInstall: false,
      sdkAvailable: false,
      firmwareConfigSupported: false,
      connectionTypes: "usb",
    },
  });
  console.log(`  ✓ CD85:  Wi-Fi ✗, Auto Driver ✗, SDK ✗, Connections: usb`);

  console.log("\n=== Done ===");
  console.log("");
  console.log("Test serials:");
  console.log("  SNQBT000001 → P80UE    (Wi-Fi Auto mode — SDK + firmware config available)");
  console.log("  SNQBT000003 → W512     (Wi-Fi Guided mode — no SDK)");
  console.log("  SNQBT000002 → 2DSW     (USB only — Wi-Fi section hidden)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
