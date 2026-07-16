/**
 * Seed QBIT Product Hub — comprehensive product catalog.
 *
 * Creates all QBIT products with:
 *   - Fresh, professional, SEO-friendly descriptions (NOT copied from brochures)
 *   - 8-15 key features per product
 *   - Full technical specifications table
 *   - Applications, industries, what's in the box, compatibility, warranty
 *   - SEO meta tags, slugs, keywords
 *
 * No pricing fields — this is a PIM system, not an eCommerce catalog.
 *
 * Run with: npx tsx scripts/seed-product-hub.ts
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

interface Spec { property: string; value: string; group?: string; }
interface Feature { icon: string; title: string; description: string; }

interface ProductSeed {
  name: string; model: string; slug: string; brand: string;
  deviceType: string; category: string;
  description: string;
  longDescription: string;
  highlights: string[];
  specifications: Spec[];
  features: Feature[];
  applications: string[];
  industries: string[];
  whatsInBox: string[];
  compatibility: string[];
  warranty: string;
  idealFor: string[];
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  badgeLabel?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  status: string;
  aiDiagnosticsSupported: boolean;
  drQbitSupported: boolean;
}

const PRODUCTS: ProductSeed[] = [
  // ===== WINDOWS POS =====
  {
    name: "QBIT W307 Windows POS Terminal",
    model: "W307", slug: "w307", brand: "QBIT",
    deviceType: "windows_pos", category: "windows-pos",
    description: "Compact 15.6-inch Windows POS terminal with Intel Celeron processor, designed for retail and hospitality.",
    longDescription: "The QBIT W307 is a space-efficient all-in-one Windows POS terminal built for small to medium retail outlets, QSR chains, and hospitality businesses. Powered by an Intel Celeron J4125 processor with 8GB DDR4 RAM and a 256GB SSD, it delivers responsive performance for POS software, inventory management, and payment processing. The 15.6-inch FHD IPS touchscreen offers wide viewing angles and crisp visuals, while the fanless aluminum chassis ensures silent operation in customer-facing environments. With 6x USB, 2x COM, 1x HDMI, 1x LAN, and 1x RJ11 cash drawer port, the W307 connects to virtually any POS peripheral out of the box.",
    highlights: ["15.6\" FHD IPS Touch Display", "Intel Celeron J4125 Quad-Core", "8GB DDR4 RAM", "256GB SSD Storage", "Fanless Aluminum Chassis", "6x USB + 2x COM + 1x HDMI", "VESA Mount Compatible", "Windows 11 Pro Pre-installed"],
    specifications: [
      { property: "Processor", value: "Intel Celeron J4125 Quad-Core (2.0-2.7GHz)", group: "Compute" },
      { property: "Memory", value: "8GB DDR4 2400MHz (expandable to 16GB)", group: "Compute" },
      { property: "Storage", value: "256GB M.2 SATA SSD", group: "Compute" },
      { property: "Operating System", value: "Windows 11 Pro 64-bit", group: "Software" },
      { property: "Display", value: '15.6" FHD 1920×1080 IPS, 10-point PCAP touch', group: "Display" },
      { property: "Brightness", value: "350 nits", group: "Display" },
      { property: "USB", value: "6x USB 3.0 + 2x USB 2.0 internal", group: "Connectivity" },
      { property: "Serial", value: "2x RS-232 COM", group: "Connectivity" },
      { property: "Video Output", value: "1x HDMI 1.4", group: "Connectivity" },
      { property: "Network", value: "1x Gigabit LAN + Wi-Fi 5 + Bluetooth 4.2", group: "Connectivity" },
      { property: "Cash Drawer", value: "1x RJ11 12V trigger", group: "Connectivity" },
      { property: "Power Supply", value: "12V/5A DC adapter, Energy Star 8.0", group: "Power" },
      { property: "Dimensions", value: "380 × 260 × 45 mm (display head)", group: "Physical" },
      { property: "Weight", value: "3.8 kg", group: "Physical" },
      { property: "Operating Temperature", value: "0°C to 40°C", group: "Environment" },
      { property: "Warranty", value: "3 Years Standard", group: "Warranty" },
    ],
    features: [
      { icon: "memory", title: "Quad-Core Performance", description: "Intel Celeron J4125 handles multi-app POS workloads with ease." },
      { icon: "tv", title: "FHD IPS Touch Display", description: '15.6" 1920×1080 IPS panel with 10-point PCAP touchscreen.' },
      { icon: "hub", title: "Rich I/O Connectivity", description: "6x USB, 2x COM, HDMI, LAN, RJ11 — connect any peripheral." },
      { icon: "shield", title: "Fanless Aluminum Build", description: "Silent, dust-resistant chassis ideal for customer-facing counters." },
      { icon: "eco", title: "Energy Star 8.0", description: "Low power consumption reduces operating costs." },
      { icon: "dashboard", title: "VESA Mount Ready", description: "Standard 100×100 VESA mount for flexible installation." },
    ],
    applications: ["Retail Checkout", "Quick Service Restaurant", "Café & Bakery", "Pharmacy", "Specialty Store"],
    industries: ["Retail", "Hospitality", "Food & Beverage", "Healthcare", "Entertainment"],
    whatsInBox: ["QBIT W307 Terminal", "Power Adapter (12V/5A)", "Power Cable", "Quick Start Guide", "VESA Mount Bracket", "Driver USB"],
    compatibility: ["T-800 Thermal Printer", "CD-410 Cash Drawer", "ScanMaster Elite Scanner", "All USB POS Peripherals"],
    warranty: "3 Years Standard Warranty (Carry-in)",
    idealFor: ["Small Retail Shops", "QSR Counters", "Cafés", "Boutique Stores", "Pop-up Shops"],
    tags: ["windows pos", "touch terminal", "celeron", "15.6 inch", "fanless", "retail"],
    seoTitle: "QBIT W307 Windows POS Terminal — 15.6\" FHD Touch, Intel Celeron",
    seoDescription: "Compact 15.6-inch Windows 11 POS terminal with Intel Celeron J4125, 8GB RAM, 256GB SSD, fanless aluminum chassis. Ideal for retail and QSR. 3-year warranty.",
    seoKeywords: ["windows pos", "pos terminal", "qbit w307", "touch pos", "retail terminal"],
    isFeatured: true, isBestSeller: true,
    status: "active", aiDiagnosticsSupported: true, drQbitSupported: true,
  },
  {
    name: "QBIT W310 Windows POS Terminal",
    model: "W310", slug: "w310", brand: "QBIT",
    deviceType: "windows_pos", category: "windows-pos",
    description: "Premium 15.6-inch Windows POS with Intel Core i3, 16GB RAM, and dual-screen support for high-volume retail.",
    longDescription: "The QBIT W310 is a high-performance Windows POS terminal engineered for demanding retail environments, multi-lane supermarkets, and large hospitality operations. At its heart is an Intel Core i3-12100 processor paired with 16GB DDR4 RAM and a 512GB NVMe SSD — delivering desktop-class performance for complex POS suites, ERP integrations, and real-time inventory sync. The 15.6-inch FHD IPS touchscreen supports 10-point multi-touch with anti-glare coating for bright environments. An optional 11.6-inch customer-facing display can be connected via HDMI. The chassis features tool-free access to RAM and SSD for easy field upgrades.",
    highlights: ["15.6\" FHD Anti-Glare Touch", "Intel Core i3-12100", "16GB DDR4 RAM", "512GB NVMe SSD", "Dual-Screen Capable", "Tool-free Upgrades", "Wi-Fi 6 + Bluetooth 5.1", "Windows 11 Pro"],
    specifications: [
      { property: "Processor", value: "Intel Core i3-12100 (4C/8T, 3.3-4.3GHz)", group: "Compute" },
      { property: "Memory", value: "16GB DDR4 3200MHz (expandable to 32GB)", group: "Compute" },
      { property: "Storage", value: "512GB NVMe M.2 SSD", group: "Compute" },
      { property: "Operating System", value: "Windows 11 Pro 64-bit", group: "Software" },
      { property: "Display", value: '15.6" FHD 1920×1080 IPS, 10-point PCAP, anti-glare', group: "Display" },
      { property: "Brightness", value: "400 nits", group: "Display" },
      { property: "USB", value: "6x USB 3.2 + 2x USB 2.0 internal", group: "Connectivity" },
      { property: "Serial", value: "2x RS-232 COM", group: "Connectivity" },
      { property: "Video Output", value: "1x HDMI 2.0 + 1x VGA", group: "Connectivity" },
      { property: "Network", value: "1x Gigabit LAN + Wi-Fi 6 + Bluetooth 5.1", group: "Connectivity" },
      { property: "Cash Drawer", value: "1x RJ11 12V trigger", group: "Connectivity" },
      { property: "Power Supply", value: "19V/4.74A DC adapter", group: "Power" },
      { property: "Dimensions", value: "385 × 265 × 50 mm (display head)", group: "Physical" },
      { property: "Weight", value: "4.2 kg", group: "Physical" },
      { property: "Warranty", value: "3 Years Standard", group: "Warranty" },
    ],
    features: [
      { icon: "memory", title: "Intel Core i3 Power", description: "12th gen 4-core/8-thread processor for intensive POS workloads." },
      { icon: "tv", title: "Anti-Glare FHD Touch", description: '15.6" 400-nit IPS with anti-glare coating for bright stores.' },
      { icon: "hub", title: "Dual Display Output", description: "HDMI 2.0 + VGA for customer-facing secondary display." },
      { icon: "build", title: "Tool-Free Upgrades", description: "Slide-open chassis for RAM/SSD swaps without tools." },
      { icon: "wifi", title: "Wi-Fi 6 Connectivity", description: "802.11ax for stable high-throughput wireless networking." },
      { icon: "speed", title: "NVMe SSD Storage", description: "512GB NVMe SSD delivers sub-second boot and app launch." },
    ],
    applications: ["Supermarket Checkout", "Multi-Lane Retail", "Fine Dining POS", "Hotel Front Desk", "Cinema Box Office"],
    industries: ["Retail", "Hospitality", "Entertainment", "Healthcare", "Transportation"],
    whatsInBox: ["QBIT W310 Terminal", "Power Adapter (19V/4.74A)", "Power Cable", "Quick Start Guide", "Driver USB"],
    compatibility: ["T-800 Thermal Printer", "CD-410 Cash Drawer", "ScanMaster Elite Scanner", "KDS-1500 Kitchen Display"],
    warranty: "3 Years Standard Warranty (On-site)",
    idealFor: ["Supermarkets", "Hotels", "Cinemas", "High-Volume Retail", "Restaurant Chains"],
    tags: ["windows pos", "core i3", "dual screen", "15.6 inch", "wi-fi 6"],
    seoTitle: "QBIT W310 Windows POS — Intel Core i3, 16GB, Dual-Screen, Wi-Fi 6",
    seoDescription: "Premium 15.6-inch Windows 11 POS with Intel Core i3-12100, 16GB RAM, 512GB NVMe SSD, dual-display support, Wi-Fi 6. Built for high-volume retail. 3-year warranty.",
    seoKeywords: ["windows pos", "core i3 pos", "dual screen pos", "qbit w310"],
    isFeatured: true, isTrending: true,
    status: "active", aiDiagnosticsSupported: true, drQbitSupported: true,
  },
  {
    name: "QBIT W55 Compact Windows POS",
    model: "W55", slug: "w55", brand: "QBIT",
    deviceType: "windows_pos", category: "windows-pos",
    description: "Ultra-compact 11.6-inch Windows POS terminal for space-constrained counters and kiosks.",
    longDescription: "The QBIT W55 is an ultra-compact all-in-one POS terminal with an 11.6-inch HD touchscreen, designed for environments where counter space is at a premium — food trucks, kiosks, pop-up stores, and small café counters. Despite its small footprint, it packs an Intel Celeron N5105 processor, 8GB LPDDR4 RAM, and a 128GB SSD. The fanless design ensures silent operation, while the IP54-rated front panel resists splashes and dust. Built-in Wi-Fi 5 and Bluetooth 4.2 provide wireless connectivity, and 4x USB + 1x COM + 1x RJ11 cover essential peripheral connections.",
    highlights: ["11.6\" HD Touch Display", "Intel Celeron N5105", "8GB LPDDR4 RAM", "128GB SSD", "Ultra-Compact Footprint", "IP54 Splash-Resistant", "Fanless Operation", "Windows 11 Pro"],
    specifications: [
      { property: "Processor", value: "Intel Celeron N5105 Quad-Core (2.0-2.9GHz)", group: "Compute" },
      { property: "Memory", value: "8GB LPDDR4 (soldered)", group: "Compute" },
      { property: "Storage", value: "128GB M.2 SATA SSD", group: "Compute" },
      { property: "Display", value: '11.6" HD 1366×768 IPS, 5-point PCAP touch', group: "Display" },
      { property: "USB", value: "4x USB 3.0", group: "Connectivity" },
      { property: "Serial", value: "1x RS-232 COM", group: "Connectivity" },
      { property: "Network", value: "1x Gigabit LAN + Wi-Fi 5 + Bluetooth 4.2", group: "Connectivity" },
      { property: "Cash Drawer", value: "1x RJ11 12V", group: "Connectivity" },
      { property: "IP Rating", value: "IP54 (front panel)", group: "Physical" },
      { property: "Dimensions", value: "290 × 200 × 35 mm", group: "Physical" },
      { property: "Weight", value: "1.8 kg", group: "Physical" },
      { property: "Warranty", value: "2 Years Standard", group: "Warranty" },
    ],
    features: [
      { icon: "phone_android", title: "Ultra-Compact Size", description: '11.6" form factor fits the smallest counters.' },
      { icon: "water_drop", title: "IP54 Splash Resistant", description: "Front panel survives spills and splashes." },
      { icon: "shield", title: "Fanless & Silent", description: "No moving parts — zero noise operation." },
      { icon: "eco", title: "Low Power Draw", description: "Runs on just 15W — ideal for battery-backed kiosks." },
    ],
    applications: ["Food Truck", "Pop-up Store", "Small Café Counter", "Ticket Kiosk", "Boutique Checkout"],
    industries: ["Food & Beverage", "Retail", "Transportation", "Events"],
    whatsInBox: ["QBIT W55 Terminal", "Power Adapter", "Quick Start Guide"],
    compatibility: ["LP-220 Label Printer", "Portable Scanners", "USB Cash Drawers"],
    warranty: "2 Years Standard Warranty (Carry-in)",
    idealFor: ["Food Trucks", "Kiosks", "Pop-up Stores", "Small Cafés"],
    tags: ["compact pos", "11.6 inch", "food truck pos", "kiosk pos"],
    seoTitle: "QBIT W55 Compact Windows POS — 11.6\" Touch, IP54, Fanless",
    seoDescription: "Ultra-compact 11.6-inch Windows POS terminal with Intel Celeron N5105, 8GB RAM, 128GB SSD, IP54 splash-resistant front panel. Perfect for food trucks and kiosks.",
    seoKeywords: ["compact pos", "small pos terminal", "food truck pos", "qbit w55"],
    isNewArrival: true,
    status: "active", aiDiagnosticsSupported: true, drQbitSupported: true,
  },
  // ===== ANDROID POS =====
  {
    name: "QBIT AP415 Android POS Terminal",
    model: "AP415", slug: "ap415", brand: "QBIT",
    deviceType: "android_pos", category: "android-pos",
    description: "15.6-inch Android 13 POS terminal with built-in 80mm thermal printer and 58mm paper support.",
    longDescription: "The QBIT AP415 is a feature-rich Android POS terminal that combines a large 15.6-inch FHD touchscreen, a built-in 80mm thermal receipt printer (250mm/sec), and a full suite of payment interfaces — EMV chip, NFC, and magnetic stripe — into a single elegant chassis. Powered by an octa-core Rockchip RK3588S processor with 4GB RAM and 64GB eMMC storage, it runs Android 13 with GMS certification, supporting Google Play Store POS apps out of the box. The 10,000 mAh built-in battery provides up to 6 hours of cordless operation, making it suitable for tableside ordering and temporary pop-up locations.",
    highlights: ["15.6\" FHD Android Touch", "Built-in 80mm Printer (250mm/s)", "Octa-core RK3588S", "EMV + NFC + Magstripe", "10,000 mAh Battery", "Android 13 GMS Certified", "4G LTE + Wi-Fi 6", "Front 2MP + Rear 8MP Camera"],
    specifications: [
      { property: "Processor", value: "Rockchip RK3588S Octa-Core (4×A76 + 4×A55)", group: "Compute" },
      { property: "Memory", value: "4GB LPDDR4", group: "Compute" },
      { property: "Storage", value: "64GB eMMC", group: "Compute" },
      { property: "Operating System", value: "Android 13 (GMS Certified)", group: "Software" },
      { property: "Display", value: '15.6" FHD 1920×1080 IPS, 10-point PCAP touch', group: "Display" },
      { property: "Printer", value: "Built-in 80mm thermal, 250mm/sec, auto-cutter", group: "Printing" },
      { property: "Payment", value: "EMV chip reader + NFC + Magnetic stripe", group: "Payment" },
      { property: "Cameras", value: "Front 2MP + Rear 8MP auto-focus", group: "Camera" },
      { property: "Network", value: "4G LTE + Wi-Fi 6 + Bluetooth 5.0", group: "Connectivity" },
      { property: "Battery", value: "10,000 mAh, up to 6 hours active use", group: "Power" },
      { property: "Dimensions", value: "400 × 300 × 80 mm", group: "Physical" },
      { property: "Weight", value: "3.5 kg", group: "Physical" },
      { property: "Warranty", value: "1 Year Standard", group: "Warranty" },
    ],
    features: [
      { icon: "print", title: "Built-in Thermal Printer", description: "80mm receipt printer at 250mm/sec with auto-cutter — no external device needed." },
      { icon: "credit_card", title: "All Payment Methods", description: "EMV chip, NFC contactless, and magnetic stripe in one module." },
      { icon: "battery_full", title: "6-Hour Battery", description: "10,000 mAh battery enables cordless tableside ordering." },
      { icon: "phone_android", title: "Android 13 GMS", description: "Full Google Play Store access — install any POS app." },
      { icon: "camera", title: "Dual Cameras", description: "2MP front for video calls + 8MP rear for scanning and photos." },
      { icon: "wifi", title: "4G LTE + Wi-Fi 6", description: "Always connected — switch between cellular and Wi-Fi seamlessly." },
    ],
    applications: ["Tableside Ordering", "Restaurant POS", "Retail Checkout", "Delivery Hub", "Event Ticketing"],
    industries: ["Food & Beverage", "Retail", "Hospitality", "Transportation", "Events"],
    whatsInBox: ["QBIT AP415 Terminal", "Power Adapter", "Thermal Paper Roll (sample)", "Quick Start Guide"],
    compatibility: ["CD-410 Cash Drawer (via RJ11)", "External Barcode Scanners (USB/BT)", "Kitchen Display Systems"],
    warranty: "1 Year Standard Warranty (Carry-in)",
    idealFor: ["Restaurants", "Food Trucks", "Pop-up Retail", "Event Booths", "Delivery Hubs"],
    tags: ["android pos", "built-in printer", "15.6 inch", "nfc", "4g pos"],
    seoTitle: "QBIT AP415 Android POS — 15.6\" Touch, Built-in Printer, NFC, 4G",
    seoDescription: "All-in-one Android 13 POS terminal with 15.6\" FHD touch, built-in 80mm thermal printer, EMV/NFC payment, 10,000 mAh battery, 4G LTE + Wi-Fi 6. GMS certified.",
    seoKeywords: ["android pos", "pos with printer", "qbit ap415", "nfc pos", "mobile pos"],
    isFeatured: true, isBestSeller: true, isTrending: true,
    status: "active", aiDiagnosticsSupported: true, drQbitSupported: true,
  },
  {
    name: "QBIT APP210 Portable Android POS",
    model: "APP210", slug: "app210", brand: "QBIT",
    deviceType: "android_pos", category: "android-pos",
    description: "Handheld Android 13 POS with 6-inch display, built-in 58mm printer, and EMV/NFC payment.",
    longDescription: "The QBIT APP210 is a pocket-sized Android POS device designed for mobile payment acceptance, delivery drivers, and street vendors. It features a 6-inch HD touchscreen, a built-in 58mm thermal printer (90mm/sec), EMV chip + NFC + magstripe payment module, and a 5,200 mAh battery rated for a full 8-hour shift. The device is IP65-rated for water and dust resistance and survives 1.5m drops onto concrete. With Android 13 GMS, 3GB RAM, and 32GB storage, it runs popular POS apps from the Play Store. 4G LTE ensures constant connectivity in the field.",
    highlights: ["6\" HD Touchscreen", "Built-in 58mm Printer", "EMV + NFC + Magstripe", "IP65 Rugged", "5,200 mAh Battery (8hr)", "Android 13 GMS", "4G LTE + Wi-Fi", "1.5m Drop Rated"],
    specifications: [
      { property: "Processor", value: "MediaTek MT8788 Octa-Core (1.6GHz)", group: "Compute" },
      { property: "Memory", value: "3GB LPDDR3", group: "Compute" },
      { property: "Storage", value: "32GB eMMC", group: "Compute" },
      { property: "Operating System", value: "Android 13 (GMS Certified)", group: "Software" },
      { property: "Display", value: '6" HD 720×1280 IPS, 5-point PCAP touch', group: "Display" },
      { property: "Printer", value: "Built-in 58mm thermal, 90mm/sec", group: "Printing" },
      { property: "Payment", value: "EMV chip + NFC + Magnetic stripe", group: "Payment" },
      { property: "Network", value: "4G LTE + Wi-Fi 5 + Bluetooth 4.2", group: "Connectivity" },
      { property: "Battery", value: "5,200 mAh, up to 8 hours", group: "Power" },
      { property: "IP Rating", value: "IP65", group: "Physical" },
      { property: "Drop Rating", value: "1.5m to concrete", group: "Physical" },
      { property: "Dimensions", value: "165 × 80 × 55 mm", group: "Physical" },
      { property: "Weight", value: "320 g", group: "Physical" },
      { property: "Warranty", value: "1 Year Standard", group: "Warranty" },
    ],
    features: [
      { icon: "print", title: "Built-in 58mm Printer", description: "Print receipts on the go — no external printer needed." },
      { icon: "credit_card", title: "Full Payment Suite", description: "EMV chip, NFC tap-to-pay, and magstripe in a handheld." },
      { icon: "water_drop", title: "IP65 Rugged", description: "Water-jet and dust-proof for outdoor use." },
      { icon: "battery_full", title: "8-Hour Battery", description: "Full shift on a single charge — 5,200 mAh." },
      { icon: "shield", title: "1.5m Drop Survivable", description: "Reinforced housing survives daily drops." },
      { icon: "phone_android", title: "Android 13 GMS", description: "Install any POS app from Google Play Store." },
    ],
    applications: ["Mobile Payment", "Delivery & Courier", "Street Vendor", "Queue Busting", "Field Service"],
    industries: ["Food & Beverage", "Transportation", "Retail", "Field Service", "Logistics"],
    whatsInBox: ["QBIT APP210 Device", "USB-C Charger", "Thermal Paper Roll (sample)", "Lanyard", "Quick Start Guide"],
    compatibility: ["Cloud POS Software", "QBIT Cloud Print Server", "External Bluetooth Scanners"],
    warranty: "1 Year Standard Warranty (Carry-in)",
    idealFor: ["Delivery Drivers", "Street Vendors", "Queue Busting", "Field Sales", "Outdoor Events"],
    tags: ["portable pos", "handheld pos", "mobile pos", "android pos", "rugged pos"],
    seoTitle: "QBIT APP210 Portable Android POS — 6\" Touch, Printer, IP65, 4G",
    seoDescription: "Rugged handheld Android 13 POS with 6-inch touch, built-in 58mm printer, EMV/NFC payment, IP65 rating, 8-hour battery, 4G LTE. Drop-tested to 1.5m. GMS certified.",
    seoKeywords: ["portable pos", "handheld pos", "mobile pos", "qbit app210", "rugged pos"],
    isNewArrival: true,
    status: "active", aiDiagnosticsSupported: true, drQbitSupported: true,
  },
  // ===== THERMAL PRINTER =====
  {
    name: "QBIT T-800 Thermal Receipt Printer",
    model: "T-800", slug: "t800", brand: "QBIT",
    deviceType: "thermal_printer", category: "thermal-printer",
    description: "High-speed 80mm thermal receipt printer with 250mm/sec print speed and auto-cutter.",
    longDescription: "The QBIT T-800 is an enterprise-grade 80mm direct-thermal receipt printer engineered for high-volume retail and hospitality environments. With a print speed of 250 mm/sec, a guaranteed 100km printhead life, and an industrial-grade auto-cutter rated for 1.5 million cuts, the T-800 delivers reliable performance under continuous load. Multiple interface options (USB 2.0, RS-232, Ethernet 10/100, Bluetooth 4.0) ensure drop-in compatibility with any POS software stack. The printer supports ESC/POS command set and includes drivers for Windows, Linux, and Android. A paper-near-end sensor and paper-out sensor prevent blank-receipt errors.",
    highlights: ["80mm Direct Thermal", "250mm/sec Print Speed", "203 dpi Resolution", "1.5M Cuts Auto-Cutter", "100km Printhead Life", "USB + Serial + LAN + BT", "ESC/POS Compatible", "Wall Mountable"],
    specifications: [
      { property: "Print Method", value: "Direct Thermal", group: "Printing" },
      { property: "Print Width", value: "80mm (72mm printable)", group: "Printing" },
      { property: "Print Speed", value: "250 mm/sec", group: "Printing" },
      { property: "Resolution", value: "203 dpi (8 dots/mm)", group: "Printing" },
      { property: "Interface", value: "USB 2.0 + RS-232 + Ethernet 10/100 + Bluetooth 4.0", group: "Connectivity" },
      { property: "Cutter Life", value: "1.5 million cuts (auto-cutter)", group: "Mechanical" },
      { property: "Printhead Life", value: "100 km", group: "Mechanical" },
      { property: "Paper Roll Diameter", value: "Up to 80mm", group: "Mechanical" },
      { property: "Power Supply", value: "DC 24V / 2.5A", group: "Power" },
      { property: "Dimensions", value: "145 × 195 × 145 mm", group: "Physical" },
      { property: "Weight", value: "1.6 kg", group: "Physical" },
      { property: "Operating Temperature", value: "5°C to 45°C, 10-90% RH", group: "Environment" },
      { property: "Warranty", value: "2 Years Standard", group: "Warranty" },
    ],
    features: [
      { icon: "bolt", title: "250mm/sec High Speed", description: "Fastest-in-class print speed keeps checkout lines moving." },
      { icon: "cut", title: "Industrial Auto-Cutter", description: "1.5 million cut-rated auto-cutter — minimal maintenance." },
      { icon: "hub", title: "Multi-Interface Built-in", description: "USB, Serial, Ethernet, and Bluetooth — no adapter needed." },
      { icon: "shield", title: "100km Printhead Life", description: "Long-lasting printhead ensures years of operation." },
      { icon: "sensor_door", title: "Paper Sensors", description: "Near-end and paper-out sensors prevent blank receipts." },
      { icon: "code", title: "ESC/POS Compatible", description: "Universal command set — works with any POS software." },
    ],
    applications: ["Retail Receipt Printing", "Restaurant KOT", "Cinema Tickets", "Parking Tickets", "Pharmacy Labels"],
    industries: ["Retail", "Hospitality", "Entertainment", "Transportation", "Healthcare"],
    whatsInBox: ["QBIT T-800 Printer", "Power Adapter (24V/2.5A)", "Power Cable", "USB Cable", "Quick Start Guide", "Driver CD"],
    compatibility: ["QBIT W307/W310 Windows POS", "QBIT AP415 Android POS", "All ESC/POS Software", "Windows/Linux/Android"],
    warranty: "2 Years Standard Warranty (Carry-in)",
    idealFor: ["Supermarkets", "Restaurants", "Cinemas", "Pharmacies", "Parking Operators"],
    tags: ["thermal printer", "receipt printer", "80mm", "auto-cutter", "esc/pos"],
    seoTitle: "QBIT T-800 Thermal Printer — 250mm/s, 80mm, Auto-Cutter, Multi-Interface",
    seoDescription: "Enterprise 80mm thermal receipt printer with 250mm/sec print speed, industrial auto-cutter (1.5M cuts), 100km printhead life, USB+Serial+LAN+Bluetooth. ESC/POS compatible.",
    seoKeywords: ["thermal printer", "receipt printer", "80mm printer", "pos printer", "auto-cutter"],
    isFeatured: true, isBestSeller: true, badgeLabel: "Most Downloaded",
    status: "active", aiDiagnosticsSupported: true, drQbitSupported: true,
  },
  {
    name: "QBIT P58 Portable Thermal Printer",
    model: "P58", slug: "p58", brand: "QBIT",
    deviceType: "thermal_printer", category: "portable-printer",
    description: "Compact 58mm portable thermal printer with Bluetooth and 1500mAh battery for mobile receipt printing.",
    longDescription: "The QBIT P58 is a lightweight portable thermal printer designed for mobile receipt printing — delivery drivers, field service engineers, and street vendors. It prints 58mm wide receipts at 70mm/sec with 203 dpi resolution. The built-in 1500mAh Li-ion battery delivers up to 3 days of standby or 8 hours of active printing on a single charge. Bluetooth 4.0 + USB connectivity allows pairing with smartphones, tablets, and handheld POS terminals. At just 210g, it clips to a belt or fits in a pocket.",
    highlights: ["58mm Portable Thermal", "70mm/sec Print Speed", "1500mAh Battery (8hr)", "Bluetooth 4.0 + USB", "210g Ultra-Light", "iOS & Android Compatible", "ESC/POS Support", "Belt Clip Included"],
    specifications: [
      { property: "Print Method", value: "Direct Thermal", group: "Printing" },
      { property: "Print Width", value: "58mm (48mm printable)", group: "Printing" },
      { property: "Print Speed", value: "70 mm/sec", group: "Printing" },
      { property: "Resolution", value: "203 dpi", group: "Printing" },
      { property: "Interface", value: "Bluetooth 4.0 + USB 2.0", group: "Connectivity" },
      { property: "Battery", value: "1500mAh Li-ion, 8 hours active / 3 days standby", group: "Power" },
      { property: "Charging", value: "USB-C 5V/2A", group: "Power" },
      { property: "Dimensions", value: "115 × 75 × 45 mm", group: "Physical" },
      { property: "Weight", value: "210 g (with battery)", group: "Physical" },
      { property: "Warranty", value: "1 Year Standard", group: "Warranty" },
    ],
    features: [
      { icon: "print", title: "Pocket-Sized Printing", description: "58mm receipts anywhere — clips to belt, weighs just 210g." },
      { icon: "battery_full", title: "8-Hour Battery Life", description: "Full shift of active printing on one charge." },
      { icon: "bluetooth", title: "Bluetooth + USB", description: "Pair with any iOS/Android device or connect via USB." },
      { icon: "phone_android", title: "Mobile App Support", description: "Free iOS/Android SDK for easy app integration." },
    ],
    applications: ["Delivery Receipts", "Field Service Invoices", "Street Vendor Receipts", "Queue Busting", "On-spot Payment Receipts"],
    industries: ["Food Delivery", "Logistics", "Field Service", "Retail", "Transportation"],
    whatsInBox: ["QBIT P58 Printer", "USB-C Cable", "Belt Clip", "Thermal Paper Roll (sample)", "Quick Start Guide"],
    compatibility: ["iOS Devices", "Android Devices", "QBIT APP210 Handheld POS", "Bluetooth-enabled Tablets"],
    warranty: "1 Year Standard Warranty (Carry-in)",
    idealFor: ["Delivery Drivers", "Field Engineers", "Street Vendors", "Pop-up Shops"],
    tags: ["portable printer", "58mm printer", "bluetooth printer", "mobile printer"],
    seoTitle: "QBIT P58 Portable Thermal Printer — 58mm, Bluetooth, 8hr Battery",
    seoDescription: "Lightweight 58mm portable thermal printer with Bluetooth 4.0, 1500mAh battery (8hr), 70mm/sec, 203 dpi. Just 210g. Compatible with iOS and Android. Belt clip included.",
    seoKeywords: ["portable printer", "58mm thermal printer", "bluetooth printer", "mobile receipt printer"],
    isNewArrival: true,
    status: "active", aiDiagnosticsSupported: false, drQbitSupported: true,
  },
  // ===== BARCODE SCANNER =====
  {
    name: "QBIT BS-550 2D Barcode Scanner",
    model: "BS-550", slug: "bs-550", brand: "QBIT",
    deviceType: "barcode_scanner", category: "barcode-scanner",
    description: "Omnidirectional 2D barcode scanner with stand, reading all major 1D/2D barcodes at 60 scans/sec.",
    longDescription: "The QBIT BS-550 is a premium 2D imager barcode scanner designed for fast-paced retail checkout, warehouse picking, and healthcare patient identification. Its omnidirectional scan engine reads all major 1D and 2D symbologies — including QR, DataMatrix, PDF417, Aztec, and damaged or poorly-printed codes — at 60 scans per second. The included charging cradle supports both hands-free presentation mode and handheld mode, with a 100m Bluetooth range. The IP54-rated housing survives 1.5m drops to concrete, and the 1,500 mAh battery delivers 30,000 scans per charge.",
    highlights: ["2D CMOS Imager", "60 scans/sec", "All 1D/2D Symbologies", "Bluetooth 5.0 (100m)", "30,000 Scans/Charge", "IP54 + 1.5m Drop", "Hands-free + Handheld", "USB Cable Mode"],
    specifications: [
      { property: "Scan Technology", value: "2D CMOS Imager", group: "Optics" },
      { property: "Scan Rate", value: "60 scans/sec", group: "Performance" },
      { property: "Reads", value: "All 1D/2D (QR, DataMatrix, PDF417, Aztec, etc.)", group: "Optics" },
      { property: "Connectivity", value: "Bluetooth 5.0 (100m range) + USB cable", group: "Connectivity" },
      { property: "Battery", value: "1,500 mAh, 30,000 scans/charge", group: "Power" },
      { property: "Drop Rating", value: "1.5m to concrete", group: "Mechanical" },
      { property: "IP Rating", value: "IP54", group: "Mechanical" },
      { property: "Weight", value: "210 g (with battery)", group: "Physical" },
      { property: "Warranty", value: "2 Years Standard", group: "Warranty" },
    ],
    features: [
      { icon: "wifi", title: "Wireless Freedom", description: "Bluetooth 5.0 with 100m range and charging cradle." },
      { icon: "bolt", title: "60 scans/sec", description: "Reads even damaged or faded barcodes instantly." },
      { icon: "shield", title: "Industrial Durability", description: "1.5m drop rating and IP54 sealing for warehouse use." },
      { icon: "battery_full", title: "30K Scans/Charge", description: "Full shift on one charge — no mid-day swapping." },
    ],
    applications: ["Retail Checkout", "Warehouse Picking", "Healthcare Patient ID", "Event Ticket Scanning", "Inventory Management"],
    industries: ["Retail", "Logistics", "Healthcare", "Events", "Manufacturing"],
    whatsInBox: ["QBIT BS-550 Scanner", "Charging Cradle", "USB Cable", "Quick Start Guide"],
    compatibility: ["QBIT W307/W310 POS", "QBIT AP415 Android POS", "Windows PCs", "Android Tablets"],
    warranty: "2 Years Standard Warranty (Carry-in)",
    idealFor: ["Retail Counters", "Warehouses", "Hospitals", "Event Venues"],
    tags: ["barcode scanner", "2d scanner", "wireless scanner", "bluetooth scanner"],
    seoTitle: "QBIT BS-550 2D Barcode Scanner — 60 scans/s, Bluetooth 5.0, IP54",
    seoDescription: "Premium 2D barcode scanner with omnidirectional CMOS imager, 60 scans/sec, Bluetooth 5.0 (100m), 30,000 scans/charge, IP54, 1.5m drop rated. Reads all 1D/2D symbologies.",
    seoKeywords: ["barcode scanner", "2d scanner", "wireless scanner", "qbit bs-550"],
    isFeatured: true,
    status: "active", aiDiagnosticsSupported: true, drQbitSupported: true,
  },
  // ===== CASH DRAWER =====
  {
    name: "QBIT CD-410 Cash Drawer",
    model: "CD-410", slug: "cd-410", brand: "QBIT",
    deviceType: "cash_drawer", category: "cash-drawer",
    description: "Heavy-duty steel cash drawer with 5-note/8-coin layout and 3-position key lock.",
    longDescription: "The QBIT CD-410 is a rugged steel cash drawer built for daily retail and hospitality use. The 5-note/8-coin layout accommodates Indian and international currencies, with removable coin cups for easy end-of-shift reconciliation. The 3-position key lock supports manual, electric (RJ11 trigger), and fully-locked modes. A micro-switch reports drawer-open status to the POS system. The drawer rides on steel roller bearings rated for 1 million open/close cycles. The front panel features a hidden emergency release for power-failure scenarios.",
    highlights: ["5 Notes / 8 Coins Layout", "3-Position Key Lock", "RJ11 12V Trigger", "1M Open/Close Cycles", "Steel Roller Bearings", "Micro-Switch Reporting", "Hidden Emergency Release", "Removable Coin Cups"],
    specifications: [
      { property: "Layout", value: "5 notes / 8 coins", group: "Capacity" },
      { property: "Lock", value: "3-position key lock (manual/electric/lock)", group: "Security" },
      { property: "Host Interface", value: "RJ11 (12V pulse)", group: "Connectivity" },
      { property: "Cycle Life", value: "1,000,000 open/close cycles", group: "Mechanical" },
      { property: "Material", value: "Cold-rolled steel, 1.2mm", group: "Physical" },
      { property: "Dimensions", value: "410 × 410 × 100 mm", group: "Physical" },
      { property: "Weight", value: "5.2 kg", group: "Physical" },
      { property: "Warranty", value: "2 Years Standard", group: "Warranty" },
    ],
    features: [
      { icon: "lock", title: "3-Position Key Lock", description: "Manual / electric / locked modes for flexible operation." },
      { icon: "verified_user", title: "Steel Construction", description: "1.2mm cold-rolled steel for tamper resistance." },
      { icon: "repeat", title: "1M Cycle Life", description: "Steel roller bearings — built for 10+ years of daily use." },
      { icon: "settings_remote", title: "Micro-Switch Reporting", description: "POS system knows when the drawer is opened." },
    ],
    applications: ["Retail Cash Management", "Restaurant Payment", "Pharmacy Counter", "Petrol Pump", "Ticket Counter"],
    industries: ["Retail", "Hospitality", "Healthcare", "Transportation"],
    whatsInBox: ["QBIT CD-410 Cash Drawer", "2x Keys", "Removable Coin Cups", "Quick Start Guide"],
    compatibility: ["QBIT T-800 Printer (RJ11)", "QBIT W307/W310 POS (RJ11)", "All POS Printers with RJ11 Drawer Kick"],
    warranty: "2 Years Standard Warranty (Carry-in)",
    idealFor: ["Retail Stores", "Restaurants", "Pharmacies", "Petrol Pumps"],
    tags: ["cash drawer", "rj11", "pos peripheral", "steel drawer"],
    seoTitle: "QBIT CD-410 Cash Drawer — 5/8 Layout, 3-Position Lock, RJ11",
    seoDescription: "Heavy-duty steel cash drawer with 5-note/8-coin layout, 3-position key lock, RJ12 12V trigger, 1M cycle life. Cold-rolled steel construction. Micro-switch POS reporting.",
    seoKeywords: ["cash drawer", "pos cash drawer", "rj11 cash drawer", "qbit cd-410"],
    status: "active", aiDiagnosticsSupported: false, drQbitSupported: true,
  },
  // ===== LABEL PRINTER =====
  {
    name: "QBIT LP-220 Label Printer",
    model: "LP-220", slug: "lp-220", brand: "QBIT",
    deviceType: "label_printer", category: "barcode-printer",
    description: "4-inch direct-thermal label printer for shipping labels, barcodes, and inventory tags at 150mm/sec.",
    longDescription: "The QBIT LP-220 is a 4-inch (108mm) direct-thermal label printer optimized for shipping labels, barcode labels, and inventory tags. With 203 dpi resolution, 150 mm/sec print speed, and support for ZPL/TSPL/EPL emulation, it integrates seamlessly into existing warehouse workflows. The printer supports label rolls up to 152mm outer diameter and includes a tear-bar for manual label separation. USB 2.0, RS-232, and Ethernet interfaces are built in. The compact metal+ABS housing fits on any desk or shelf.",
    highlights: ["4-inch (108mm) Label Width", "150mm/sec Print Speed", "203 dpi Resolution", "ZPL/TSPL/EPL Emulation", "USB + Serial + LAN", "Up to 152mm Roll Diameter", "Tear-Bar Separator", "Compact Metal+ABS Housing"],
    specifications: [
      { property: "Print Method", value: "Direct Thermal", group: "Printing" },
      { property: "Print Width", value: "108mm (4 inch)", group: "Printing" },
      { property: "Print Speed", value: "150 mm/sec", group: "Printing" },
      { property: "Resolution", value: "203 dpi", group: "Printing" },
      { property: "Emulation", value: "ZPL / TSPL / EPL", group: "Software" },
      { property: "Interface", value: "USB 2.0 + RS-232 + Ethernet", group: "Connectivity" },
      { property: "Max Roll Diameter", value: "152mm", group: "Mechanical" },
      { property: "Dimensions", value: "215 × 175 × 145 mm", group: "Physical" },
      { property: "Weight", value: "1.4 kg", group: "Physical" },
      { property: "Warranty", value: "1 Year Standard", group: "Warranty" },
    ],
    features: [
      { icon: "label", title: "Multi-Emulation", description: "ZPL, TSPL, and EPL support for drop-in replacement." },
      { icon: "bolt", title: "150mm/sec Speed", description: "Handles peak shipping volumes without bottlenecking." },
      { icon: "hub", title: "Triple Interface", description: "USB, Serial, and Ethernet built in — connect anywhere." },
      { icon: "inventory_2", title: "Large Roll Support", description: "Accepts up to 152mm OD rolls — fewer refills." },
    ],
    applications: ["Shipping Labels", "Barcode Labels", "Inventory Tags", "Product Labels", "Warehouse Bins"],
    industries: ["E-commerce", "Logistics", "Manufacturing", "Retail", "Healthcare"],
    whatsInBox: ["QBIT LP-220 Printer", "Power Adapter", "USB Cable", "Sample Label Roll", "Quick Start Guide"],
    compatibility: ["Shiprocket", "Delhivery", "Amazon Seller Central", "Flipkart Seller Hub", "All ZPL-compatible Software"],
    warranty: "1 Year Standard Warranty (Carry-in)",
    idealFor: ["E-commerce Warehouses", "Shipping Centers", "Manufacturing Plants", "Retail Backrooms"],
    tags: ["label printer", "shipping labels", "zpl", "4-inch printer", "barcode printer"],
    seoTitle: "QBIT LP-220 Label Printer — 4-inch, 150mm/s, ZPL/TSPL/EPL",
    seoDescription: "4-inch direct-thermal label printer with 150mm/sec speed, 203 dpi, ZPL/TSPL/EPL emulation, USB+Serial+LAN. Ideal for shipping labels and barcodes. ZPL compatible.",
    seoKeywords: ["label printer", "shipping label printer", "zpl printer", "qbit lp-220"],
    status: "active", aiDiagnosticsSupported: false, drQbitSupported: true,
  },
  // ===== CUSTOMER DISPLAY =====
  {
    name: "QBIT CD-15 Customer Display",
    model: "CD-15", slug: "cd-15", brand: "QBIT",
    deviceType: "customer_display", category: "customer-display",
    description: "15-inch FHD customer-facing display with IPS panel and VESA mount for POS counters.",
    longDescription: "The QBIT CD-15 is a 15-inch FHD customer-facing display designed to show order details, promotional content, and payment amounts at the checkout counter. The IPS panel delivers wide 178° viewing angles with 250 nits brightness, ensuring readability from any standing position. Powered via USB from the POS terminal (no separate power adapter needed), the display connects via HDMI or VGA. The slim bezel design and adjustable VESA stand complement any modern POS setup. A built-in speaker can play promotional audio or notification chimes.",
    highlights: ["15\" FHD IPS Panel", "178° Viewing Angles", "USB-Powered (No Adapter)", "HDMI + VGA Input", "Built-in Speaker", "VESA 75×75 Mount", "Slim Bezel Design", "250 Nits Brightness"],
    specifications: [
      { property: "Display", value: '15" FHD 1920×1080 IPS', group: "Display" },
      { property: "Brightness", value: "250 nits", group: "Display" },
      { property: "Viewing Angle", value: "178°/178°", group: "Display" },
      { property: "Input", value: "HDMI 1.4 + VGA", group: "Connectivity" },
      { property: "Power", value: "USB 5V (from POS terminal) or 12V DC", group: "Power" },
      { property: "Speaker", value: "Built-in 2W mono speaker", group: "Audio" },
      { property: "Mount", value: "VESA 75×75", group: "Physical" },
      { property: "Dimensions", value: "350 × 220 × 30 mm", group: "Physical" },
      { property: "Weight", value: "1.2 kg", group: "Physical" },
      { property: "Warranty", value: "1 Year Standard", group: "Warranty" },
    ],
    features: [
      { icon: "tv", title: "FHD IPS Display", description: '15" 1920×1080 IPS panel — clear from any angle.' },
      { icon: "usb", title: "USB-Powered", description: "Draws power from the POS terminal — no extra adapter." },
      { icon: "volume_up", title: "Built-in Speaker", description: "Play promotional audio or notification chimes." },
      { icon: "dashboard", title: "VESA Mount", description: "Standard 75×75 mount — flexible counter installation." },
    ],
    applications: ["Checkout Counter Display", "Promotional Content", "Order Confirmation", "Payment Amount Display", "Queue Management"],
    industries: ["Retail", "Hospitality", "QSR", "Healthcare", "Banking"],
    whatsInBox: ["QBIT CD-15 Display", "VESA Stand", "USB Power Cable", "HDMI Cable", "Quick Start Guide"],
    compatibility: ["QBIT W310 POS (HDMI)", "QBIT W307 POS (HDMI)", "Any POS with HDMI/VGA output"],
    warranty: "1 Year Standard Warranty (Carry-in)",
    idealFor: ["Retail Checkout", "Restaurant Counter", "Pharmacy", "Bank Teller"],
    tags: ["customer display", "pos display", "15 inch display", "fhd display"],
    seoTitle: "QBIT CD-15 Customer Display — 15\" FHD IPS, USB-Powered, VESA",
    seoDescription: "15-inch FHD IPS customer-facing display for POS counters. 178° viewing angles, USB-powered, HDMI+VGA, built-in speaker, VESA 75×75 mount. Slim bezel design.",
    seoKeywords: ["customer display", "pos display", "15 inch display", "qbit cd-15"],
    status: "active", aiDiagnosticsSupported: false, drQbitSupported: false,
  },
  // ===== SELF-ORDERING KIOSK =====
  {
    name: "QBIT K27 Self-Ordering Kiosk",
    model: "K27", slug: "k27", brand: "QBIT",
    deviceType: "kiosk", category: "self-ordering-kiosk",
    description: "27-inch FHD self-ordering kiosk with PCAP touch, EMV payment, and thermal printer.",
    longDescription: "The QBIT K27 is a 27-inch FHD self-ordering kiosk designed for QSR self-service ordering, cinema ticketing, and healthcare check-in. The Projected Capacitive (PCAP) 10-point touchscreen responds to gloved hands and wet fingers. An integrated 80mm thermal printer outputs receipts and order tickets, while the EMV/NFC payment module accepts chip cards and contactless payments. The vandal-resistant tempered glass front and steel housing withstand public use. An Intel Celeron J4125 processor with 8GB RAM and 128GB SSD runs Windows 11 IoT or Android. The kiosk supports VESA mounting or freestanding pedestal installation.",
    highlights: ["27\" FHD PCAP Touch", "EMV + NFC Payment", "80mm Thermal Printer", "Vandal-Resistant Glass", "Intel Celeron J4125", "8GB RAM + 128GB SSD", "Windows 11 IoT / Android", "Pedestal or Wall Mount"],
    specifications: [
      { property: "Display", value: '27" FHD 1920×1080, PCAP 10-point touch', group: "Display" },
      { property: "Processor", value: "Intel Celeron J4125 Quad-Core", group: "Compute" },
      { property: "Memory", value: "8GB DDR4", group: "Compute" },
      { property: "Storage", value: "128GB M.2 SSD", group: "Compute" },
      { property: "OS", value: "Windows 11 IoT or Android 13", group: "Software" },
      { property: "Printer", value: "Integrated 80mm thermal, 200mm/sec", group: "Peripherals" },
      { property: "Payment", value: "EMV chip + NFC contactless", group: "Peripherals" },
      { property: "Housing", value: "Cold-rolled steel + tempered glass", group: "Physical" },
      { property: "Dimensions", value: "650 × 350 × 1800 mm (pedestal)", group: "Physical" },
      { property: "Weight", value: "32 kg", group: "Physical" },
      { property: "Warranty", value: "2 Years Standard (On-site)", group: "Warranty" },
    ],
    features: [
      { icon: "storefront", title: "Self-Service Ready", description: "Touch, payment, and receipt printing in one unit." },
      { icon: "shield", title: "Vandal Resistant", description: "Steel housing with tempered glass for public deployment." },
      { icon: "credit_card", title: "EMV + NFC Payment", description: "Accept chip cards and contactless tap-to-pay." },
      { icon: "print", title: "Integrated Printer", description: "80mm thermal printer for receipts and order tickets." },
    ],
    applications: ["QSR Self-Ordering", "Cinema Ticketing", "Hospital Check-in", "Hotel Check-out", "Retail Self-Checkout"],
    industries: ["Food & Beverage", "Entertainment", "Healthcare", "Hospitality", "Retail"],
    whatsInBox: ["QBIT K27 Kiosk", "Power Cable", "Installation Hardware", "Quick Start Guide"],
    compatibility: ["QBIT Cloud Kiosk Software", "Toast Kiosk", "Oracle Simphony", "Custom Kiosk Apps"],
    warranty: "2 Years Standard Warranty (On-site)",
    idealFor: ["QSR Restaurants", "Cinemas", "Hospitals", "Hotels", "Retail Stores"],
    tags: ["kiosk", "self-ordering", "27 inch", "payment kiosk", "touch kiosk"],
    seoTitle: "QBIT K27 Self-Ordering Kiosk — 27\" Touch, EMV/NFC, Thermal Printer",
    seoDescription: "27-inch FHD self-ordering kiosk with PCAP touch, EMV/NFC payment, integrated 80mm thermal printer, vandal-resistant steel housing. Intel Celeron, 8GB RAM, Windows/Android.",
    seoKeywords: ["self-ordering kiosk", "pos kiosk", "27 inch kiosk", "qbit k27"],
    isNewArrival: true, isTrending: true,
    status: "active", aiDiagnosticsSupported: true, drQbitSupported: true,
  },
  // ===== HANDY POS =====
  {
    name: "QBIT H55 Handy POS",
    model: "H55", slug: "h55", brand: "QBIT",
    deviceType: "android_pos", category: "handy-pos",
    description: "Compact handheld Android POS with 5.5-inch display, NFC, and barcode scanner.",
    longDescription: "The QBIT H55 is a smartphone-sized Android POS device that fits in a pocket yet delivers full payment acceptance. The 5.5-inch HD touchscreen runs Android 13 with GMS certification. A built-in 1D/2D barcode scanner reads any symbology, while the EMV/NFC/magstripe payment module handles all card types. The 4,000 mAh battery lasts a full 8-hour shift. At 180g, it's lighter than most smartphones, making it ideal for queue busting, tableside ordering, and mobile retail.",
    highlights: ["5.5\" HD Android Touch", "Built-in 1D/2D Scanner", "EMV + NFC + Magstripe", "4,000 mAh (8hr)", "180g Ultra-Light", "Android 13 GMS", "4G LTE + Wi-Fi 5", "Pocket-Sized"],
    specifications: [
      { property: "Display", value: '5.5" HD 720×1280 IPS, 5-point touch', group: "Display" },
      { property: "Processor", value: "MediaTek MT8788 Octa-Core", group: "Compute" },
      { property: "Memory", value: "3GB LPDDR3", group: "Compute" },
      { property: "Storage", value: "32GB eMMC", group: "Compute" },
      { property: "OS", value: "Android 13 (GMS)", group: "Software" },
      { property: "Scanner", value: "Built-in 1D/2D barcode scanner", group: "Peripherals" },
      { property: "Payment", value: "EMV chip + NFC + Magstripe", group: "Payment" },
      { property: "Network", value: "4G LTE + Wi-Fi 5 + Bluetooth 4.2", group: "Connectivity" },
      { property: "Battery", value: "4,000 mAh, 8 hours", group: "Power" },
      { property: "Dimensions", value: "150 × 75 × 14 mm", group: "Physical" },
      { property: "Weight", value: "180 g", group: "Physical" },
      { property: "Warranty", value: "1 Year Standard", group: "Warranty" },
    ],
    features: [
      { icon: "phone_android", title: "Pocket-Sized POS", description: "Smaller than a smartphone — full POS capability anywhere." },
      { icon: "barcode_scanner", title: "Built-in Scanner", description: "1D/2D barcode scanner — no external device needed." },
      { icon: "credit_card", title: "All Payment Methods", description: "EMV chip, NFC, and magstripe in 180g." },
      { icon: "battery_full", title: "8-Hour Battery", description: "4,000 mAh — full shift on one charge." },
    ],
    applications: ["Queue Busting", "Tableside Ordering", "Field Sales", "Home Delivery", "Pop-up Retail"],
    industries: ["Retail", "Food & Beverage", "Logistics", "Field Service"],
    whatsInBox: ["QBIT H55 Device", "USB-C Charger", "Lanyard", "Quick Start Guide"],
    compatibility: ["Cloud POS Apps", "QBIT Cloud Print", "External Bluetooth Printers"],
    warranty: "1 Year Standard Warranty (Carry-in)",
    idealFor: ["Retail Queue Busting", "Restaurant Tableside", "Field Sales", "Home Delivery"],
    tags: ["handy pos", "mobile pos", "pocket pos", "android pos"],
    seoTitle: "QBIT H55 Handy POS — 5.5\" Touch, Scanner, NFC, 180g",
    seoDescription: "Ultra-light 180g handheld Android 13 POS with 5.5\" touch, built-in barcode scanner, EMV/NFC payment, 4,000 mAh battery. GMS certified. Pocket-sized.",
    seoKeywords: ["handy pos", "mobile pos", "pocket pos", "qbit h55"],
    isNewArrival: true,
    status: "active", aiDiagnosticsSupported: true, drQbitSupported: true,
  },
];

async function main() {
  console.log(`Seeding ${PRODUCTS.length} QBIT products…\n`);

  for (const p of PRODUCTS) {
    // Delete existing by slug
    const existing = await db.qbitProduct.findUnique({ where: { slug: p.slug } });
    if (existing) {
      await db.productRelation.deleteMany({ where: { OR: [{ productId: existing.id }, { relatedId: existing.id }] } }).catch(() => {});
      await db.productOS.deleteMany({ where: { productId: existing.id } }).catch(() => {});
      await db.productMedia.deleteMany({ where: { productId: existing.id } }).catch(() => {});
      await db.productSpecification.deleteMany({ where: { productId: existing.id } }).catch(() => {});
      await db.productFeature.deleteMany({ where: { productId: existing.id } }).catch(() => {});
      await db.qbitProduct.delete({ where: { id: existing.id } });
    }

    const product = await db.qbitProduct.create({
      data: {
        name: p.name,
        brand: p.brand,
        model: p.model,
        slug: p.slug,
        deviceType: p.deviceType,
        category: p.category,
        description: p.description,
        longDescription: p.longDescription,
        highlights: JSON.stringify(p.highlights),
        specifications: JSON.stringify(p.specifications),
        features: JSON.stringify(p.features),
        isFeatured: p.isFeatured ?? false,
        isTrending: p.isTrending ?? false,
        isBestSeller: p.isBestSeller ?? false,
        isNewArrival: p.isNewArrival ?? false,
        badgeLabel: p.badgeLabel,
        status: p.status,
        aiDiagnosticsSupported: p.aiDiagnosticsSupported,
        drQbitSupported: p.drQbitSupported,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        seoKeywords: p.seoKeywords.join(","),
        tags: p.tags.join(","),
        qrCodeUrl: `https://hub.qbit.com/products/${p.slug}`,
        warrantyDuration: p.warranty,
        lastUpdated: new Date(),
        isActive: true,
      },
    });

    // Create specifications
    if (p.specifications.length > 0) {
      await db.productSpecification.createMany({
        data: p.specifications.map((s, i) => ({
          productId: product.id,
          property: s.property,
          value: s.value,
          group: s.group ?? null,
          sortIndex: i,
        })),
      });
    }

    // Create features
    if (p.features.length > 0) {
      await db.productFeature.createMany({
        data: p.features.map((f, i) => ({
          productId: product.id,
          icon: f.icon,
          title: f.title,
          description: f.description,
          sortIndex: i,
        })),
      });
    }

    console.log(`  ✓ ${p.slug} — ${p.name} (${p.specifications.length} specs, ${p.features.length} features)`);
  }

  // Wire up related products
  const all = await db.qbitProduct.findMany({ select: { id: true, slug: true } });
  const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));

  // T-800 related to: W307, W310, CD-410, BS-550
  const t800 = bySlug["t800"];
  const w307 = bySlug["w307"];
  const w310 = bySlug["w310"];
  const cd410 = bySlug["cd-410"];
  const bs550 = bySlug["bs-550"];

  if (t800 && w307) await db.productRelation.create({ data: { productId: t800.id, relatedId: w307.id, sortIndex: 0 } }).catch(() => {});
  if (t800 && cd410) await db.productRelation.create({ data: { productId: t800.id, relatedId: cd410.id, sortIndex: 1 } }).catch(() => {});
  if (t800 && bs550) await db.productRelation.create({ data: { productId: t800.id, relatedId: bs550.id, sortIndex: 2 } }).catch(() => {});
  if (w307 && t800) await db.productRelation.create({ data: { productId: w307.id, relatedId: t800.id, sortIndex: 0 } }).catch(() => {});
  if (w307 && cd410) await db.productRelation.create({ data: { productId: w307.id, relatedId: cd410.id, sortIndex: 1 } }).catch(() => {});
  if (w307 && bs550) await db.productRelation.create({ data: { productId: w307.id, relatedId: bs550.id, sortIndex: 2 } }).catch(() => {});
  if (w310 && t800) await db.productRelation.create({ data: { productId: w310.id, relatedId: t800.id, sortIndex: 0 } }).catch(() => {});
  if (w310 && cd410) await db.productRelation.create({ data: { productId: w310.id, relatedId: cd410.id, sortIndex: 1 } }).catch(() => {});

  const total = await db.qbitProduct.count();
  console.log(`\n=== Done. Total products: ${total} ===`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
