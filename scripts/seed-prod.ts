/**
 * Production DB seed — runs the 8-product seed against production Postgres
 * (only inserts products that don't already exist by slug). Also activates
 * any existing inactive products.
 *
 * Run with: source /tmp/prod-db.env && npx tsx scripts/seed-prod.ts
 */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

interface SpecSeed { property: string; value: string; group?: string; }
interface FeatureSeed { icon: string; title: string; description: string; }
interface OSSeed { osName: string; osIcon: string; minVersion?: string; }
interface MediaSeed {
  type: "image" | "brochure" | "datasheet" | "warranty" | "sdk" | "utility" | "video" | "manual" | "firmware" | "driver";
  title: string; url: string; mimeType?: string; altText?: string; provider?: string; externalId?: string;
}
interface ProductSeed {
  name: string; brand: string; manufacturer: string; model: string; slug: string;
  deviceType: string; category: string; description: string; longDescription: string;
  isFeatured?: boolean; isTrending?: boolean; badgeLabel?: string;
  imageUrl?: string; galleryImages?: { url: string; alt: string }[];
  startingPrice?: string; sku?: string;
  driverDownloadUrl?: string; manualUrl?: string; brochureUrl?: string;
  datasheetUrl?: string; warrantyUrl?: string; sdkUrl?: string; utilityUrl?: string;
  installationGuideUrl?: string; knowledgeBaseUrl?: string;
  specifications?: SpecSeed[]; features?: FeatureSeed[]; operatingSystems?: OSSeed[];
  videos?: MediaSeed[]; mediaFiles?: MediaSeed[];
  tags?: string[]; compatibleDevices?: string[];
  aiDiagnosticsSupported?: boolean; drQbitSupported?: boolean;
  latestDriverVersion?: string; latestFirmwareVersion?: string;
  seoTitle?: string; seoDescription?: string; seoKeywords?: string[];
  status?: string;
}

const PRODUCTS: ProductSeed[] = [
  {
    name: "QBIT T-800 Thermal Printer", brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "T-800", slug: "t800", deviceType: "thermal_printer", category: "thermal-printer",
    description: "High-speed 80mm thermal receipt printer with auto-cutter.",
    longDescription: "The QBIT T-800 is an enterprise-grade 80mm direct-thermal receipt printer engineered for high-volume retail and hospitality environments. With a print speed of 250 mm/sec, a guaranteed 100km printhead life, and an industrial-grade auto-cutter rated for 1.5 million cuts, the T-800 delivers reliable performance under continuous load.",
    isFeatured: true, isTrending: true, badgeLabel: "Most Downloaded",
    imageUrl: "https://images.unsplash.com/photo-1612831455540-b62ede1dcb9c?w=800&q=80",
    galleryImages: [
      { url: "https://images.unsplash.com/photo-1612831455540-b62ede1dcb9c?w=1200&q=80", alt: "T-800 front view" },
      { url: "https://images.unsplash.com/photo-1612831455540-b62ede1dcb9c?w=1200&q=80", alt: "T-800 side view" },
    ],
    startingPrice: "₹18,500", sku: "QBT-T800-80",
    driverDownloadUrl: "https://example.com/drivers/t800-driver-v2.4.1.exe",
    manualUrl: "https://example.com/manuals/t800-user-manual-v4.0.pdf",
    brochureUrl: "https://example.com/brochures/t800-brochure.pdf",
    datasheetUrl: "https://example.com/datasheets/t800-datasheet.pdf",
    warrantyUrl: "https://example.com/warranty/t800-warranty-terms.pdf",
    sdkUrl: "https://example.com/sdk/t800-sdk-v1.2.zip",
    utilityUrl: "https://example.com/utilities/t800-config-tool.exe",
    installationGuideUrl: "https://example.com/guides/t800-installation-guide.html",
    knowledgeBaseUrl: "https://help.qbit.com/products/t800",
    specifications: [
      { property: "Print Method", value: "Direct Thermal", group: "Printing" },
      { property: "Print Width", value: "80mm (72mm printable)", group: "Printing" },
      { property: "Print Speed", value: "250 mm/sec", group: "Printing" },
      { property: "Resolution", value: "203 dpi (8 dots/mm)", group: "Printing" },
      { property: "Interface", value: "USB 2.0 + RS-232 + Ethernet 10/100 + Bluetooth 4.0", group: "Connectivity" },
      { property: "Cutter Life", value: "1.5 million cuts (auto-cutter)", group: "Mechanical" },
      { property: "Printhead Life", value: "100 km", group: "Mechanical" },
    ],
    features: [
      { icon: "bolt", title: "High-Speed Printing", description: "250 mm/sec print speed keeps checkout lines moving fast." },
      { icon: "cut", title: "Industrial Auto-Cutter", description: "Heavy-duty auto-cutter rated for 1.5 million cuts — minimal maintenance." },
      { icon: "hub", title: "Multi-Interface", description: "USB, Serial, Ethernet and Bluetooth built-in — no adapter needed." },
    ],
    operatingSystems: [
      { osName: "Windows 11", osIcon: "desktop_windows", minVersion: "10" },
      { osName: "Linux", osIcon: "terminal", minVersion: "Kernel 4.x" },
      { osName: "Android", osIcon: "phone_android", minVersion: "8.0" },
    ],
    videos: [{ type: "video", title: "T-800 Installation Walkthrough", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", provider: "youtube", externalId: "dQw4w9WgXcQ" }],
    mediaFiles: [
      { type: "image", title: "T-800 Front", url: "https://images.unsplash.com/photo-1612831455540-b62ede1dcb9c?w=1200&q=80", altText: "T-800 front view" },
      { type: "brochure", title: "T-800 Brochure", url: "https://example.com/brochures/t800-brochure.pdf", mimeType: "application/pdf" },
      { type: "datasheet", title: "T-800 Datasheet", url: "https://example.com/datasheets/t800-datasheet.pdf", mimeType: "application/pdf" },
    ],
    tags: ["thermal", "receipt", "80mm", "auto-cutter", "POS"],
    compatibleDevices: ["Windows POS", "Android POS", "Linux POS", "Cash Drawer"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v2.4.1", latestFirmwareVersion: "v1.8.0",
    seoTitle: "QBIT T-800 Thermal Printer — 250mm/s, Auto-Cutter",
    seoDescription: "Enterprise 80mm thermal receipt printer with 250mm/sec print speed, industrial auto-cutter, multi-interface, and 100km printhead life.",
    seoKeywords: ["thermal printer", "receipt printer", "80mm printer"],
  },
  {
    name: "HUB-X Pro All-in-One POS", brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "HUB-X Pro", slug: "hub-x-pro", deviceType: "windows_pos", category: "windows-pos",
    description: "15.6\" FHD touch Windows POS terminal with Intel i5.",
    longDescription: "The HUB-X Pro is a flagship all-in-one Windows POS terminal featuring a 15.6\" Full-HD multi-touch display, 11th-gen Intel Core i5 processor, and an extensive I/O array. Designed for retail, hospitality, and QSR environments.",
    isFeatured: true, isTrending: true, badgeLabel: "Top Resource",
    imageUrl: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&q=80",
    galleryImages: [{ url: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&q=80", alt: "HUB-X Pro front" }],
    startingPrice: "₹68,000", sku: "QBT-HUBXPRO",
    driverDownloadUrl: "https://example.com/drivers/hubxpro-driver-v3.1.exe",
    manualUrl: "https://example.com/manuals/hubxpro-user-manual.pdf",
    brochureUrl: "https://example.com/brochures/hubxpro-brochure.pdf",
    datasheetUrl: "https://example.com/datasheets/hubxpro-datasheet.pdf",
    warrantyUrl: "https://example.com/warranty/hubxpro-warranty.pdf",
    installationGuideUrl: "https://example.com/guides/hubxpro-installation.html",
    specifications: [
      { property: "Processor", value: "Intel Core i5-1135G7 (8M Cache, up to 4.20 GHz)", group: "Compute" },
      { property: "Memory", value: "16GB DDR4 3200MHz (expandable to 32GB)", group: "Compute" },
      { property: "Storage", value: "512GB NVMe M.2 SSD", group: "Compute" },
      { property: "Display", value: '15.6" IPS FHD 1920x1080, 10-point multi-touch', group: "Display" },
    ],
    features: [
      { icon: "shield", title: "Industrial Build", description: "IP54-rated aluminum chassis for harsh retail environments." },
      { icon: "hub", title: "Multi-Port Support", description: "Extensive legacy and modern connectivity for peripherals." },
      { icon: "eco", title: "Energy Efficient", description: "Consumes 40% less power than standard desktop POS systems." },
    ],
    operatingSystems: [
      { osName: "Windows 11 Pro", osIcon: "desktop_windows" },
      { osName: "Windows 10 IoT", osIcon: "desktop_windows" },
      { osName: "Linux Ubuntu", osIcon: "terminal" },
    ],
    videos: [{ type: "video", title: "HUB-X Pro Overview", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", provider: "youtube", externalId: "dQw4w9WgXcQ" }],
    mediaFiles: [
      { type: "image", title: "HUB-X Pro Front", url: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&q=80", altText: "HUB-X Pro front view" },
      { type: "brochure", title: "HUB-X Pro Brochure", url: "https://example.com/brochures/hubxpro-brochure.pdf", mimeType: "application/pdf" },
    ],
    tags: ["windows pos", "touch terminal", "i5", "all-in-one"],
    compatibleDevices: ["Thermal Printer T-800", "Cash Drawer CD-410", "Barcode Scanner BS-550"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v3.1.0", latestFirmwareVersion: "v2.0.1",
    status: "active",
  },
  {
    name: "ScanMaster Elite Wireless Scanner", brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "SM-E1", slug: "scanmaster-elite", deviceType: "barcode_scanner", category: "barcode-scanner",
    description: "2D wireless barcode scanner with Bluetooth and base station.",
    longDescription: "The ScanMaster Elite is a premium 2D imager barcode scanner with Bluetooth 5.0 wireless connectivity, a 1,500 mAh battery rated for 30,000 scans per charge, and an industrial IP54 housing rated for 1.5m drops.",
    isTrending: true, badgeLabel: "Newly Released",
    imageUrl: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80",
    galleryImages: [{ url: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80", alt: "ScanMaster Elite scanner" }],
    startingPrice: "₹12,900", sku: "QBT-SME1",
    driverDownloadUrl: "https://example.com/drivers/sme1-driver.exe",
    manualUrl: "https://example.com/manuals/sme1-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/sme1-datasheet.pdf",
    warrantyUrl: "https://example.com/warranty/sme1-warranty.pdf",
    specifications: [
      { property: "Scan Technology", value: "2D CMOS Imager", group: "Optics" },
      { property: "Scan Rate", value: "60 scans/sec", group: "Performance" },
      { property: "Connectivity", value: "Bluetooth 5.0 (up to 100m) + USB cable", group: "Connectivity" },
      { property: "Battery", value: "1500 mAh, 30,000 scans/charge", group: "Power" },
    ],
    features: [
      { icon: "wifi", title: "Wireless Freedom", description: "Bluetooth 5.0 with 100m range and base station." },
      { icon: "bolt", title: "Fast Reading", description: "60 scans/sec reads even damaged or faded barcodes." },
      { icon: "shield", title: "Industrial Durability", description: "1.5m drop rating and IP54 sealing for warehouse use." },
    ],
    operatingSystems: [
      { osName: "Windows 11", osIcon: "desktop_windows" },
      { osName: "Android", osIcon: "phone_android" },
      { osName: "iOS", osIcon: "phone_iphone" },
    ],
    videos: [],
    mediaFiles: [{ type: "image", title: "ScanMaster Elite", url: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80", altText: "ScanMaster Elite scanner" }],
    tags: ["barcode scanner", "2d scanner", "wireless", "bluetooth"],
    compatibleDevices: ["HUB-X Pro", "Android POS", "Windows POS"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v1.0.4",
  },
  {
    name: "CD-410 Cash Drawer", brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "CD-410", slug: "cd-410", deviceType: "cash_drawer", category: "cash-drawer",
    description: "Heavy-duty cash drawer with 5 notes / 8 coins layout.",
    longDescription: "The CD-410 is a rugged steel-cash drawer with a 5-note/8-coin layout, 3-position key lock, and a micro-switch for RJ11 host reporting.",
    startingPrice: "₹6,500", sku: "QBT-CD410",
    manualUrl: "https://example.com/manuals/cd410-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/cd410-datasheet.pdf",
    warrantyUrl: "https://example.com/warranty/cd410-warranty.pdf",
    specifications: [
      { property: "Layout", value: "5 notes / 8 coins", group: "Capacity" },
      { property: "Lock", value: "3-position key lock (manual / electric / lock)", group: "Security" },
      { property: "Host Interface", value: "RJ11 (12V pulse)", group: "Connectivity" },
    ],
    features: [
      { icon: "lock", title: "Three-Position Key Lock", description: "Manual / electric / locked modes for flexible operation." },
      { icon: "verified_user", title: "Steel Construction", description: "1.2mm cold-rolled steel for tamper resistance." },
    ],
    operatingSystems: [
      { osName: "Windows", osIcon: "desktop_windows" },
      { osName: "Android", osIcon: "phone_android" },
      { osName: "Linux", osIcon: "terminal" },
    ],
    tags: ["cash drawer", "rj11", "pos peripheral"],
    compatibleDevices: ["HUB-X Pro", "T-800 Thermal Printer"],
    aiDiagnosticsSupported: false, drQbitSupported: true,
    latestDriverVersion: "v1.0.0",
  },
  {
    name: "QBIT KDS-1500 Kitchen Display System", brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "KDS-1500", slug: "kds-1500", deviceType: "customer_display", category: "customer-display",
    description: "15-inch dual-sided kitchen display system for QSR.",
    longDescription: "The QBIT KDS-1500 is a 15-inch FHD kitchen display system with IP65 front sealing, designed for QSR and restaurant kitchens.",
    startingPrice: "₹34,500", sku: "QBT-KDS1500",
    manualUrl: "https://example.com/manuals/kds1500-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/kds1500-datasheet.pdf",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    galleryImages: [{ url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80", alt: "KDS-1500 display" }],
    specifications: [
      { property: "Display", value: '15" FHD 1920x1080, IP65 front', group: "Display" },
      { property: "Processor", value: "ARM Cortex-A55 quad-core", group: "Compute" },
      { property: "Memory", value: "4GB DDR4", group: "Compute" },
    ],
    features: [
      { icon: "restaurant", title: "QSR-Optimized UI", description: "Allergen highlighting, prep-time tracking, order routing." },
      { icon: "water_drop", title: "IP65 Front Sealing", description: "Withstands grease, water, and heat of commercial kitchens." },
    ],
    operatingSystems: [{ osName: "Embedded Linux", osIcon: "terminal" }],
    tags: ["kitchen display", "kds", "qsr", "ip65"],
    compatibleDevices: ["HUB-X Pro", "T-800 Thermal Printer"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v1.0.0", latestFirmwareVersion: "v2.1.0",
  },
  {
    name: "LP-220 Label Printer", brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "LP-220", slug: "lp-220", deviceType: "label_printer", category: "label-printer",
    description: "4-inch direct-thermal label printer for shipping & inventory.",
    longDescription: "The LP-220 is a 4-inch (108mm) direct-thermal label printer optimized for shipping labels, barcode labels, and inventory tags.",
    startingPrice: "₹14,200", sku: "QBT-LP220",
    driverDownloadUrl: "https://example.com/drivers/lp220-driver.exe",
    manualUrl: "https://example.com/manuals/lp220-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/lp220-datasheet.pdf",
    warrantyUrl: "https://example.com/warranty/lp220-warranty.pdf",
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
    galleryImages: [{ url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80", alt: "LP-220 label printer" }],
    specifications: [
      { property: "Print Method", value: "Direct Thermal", group: "Printing" },
      { property: "Print Width", value: "108mm (4 inch)", group: "Printing" },
      { property: "Print Speed", value: "150 mm/sec", group: "Printing" },
    ],
    features: [
      { icon: "label", title: "Multi-Emulation", description: "ZPL, TSPL, and EPL support for drop-in replacement." },
      { icon: "bolt", title: "Fast Throughput", description: "150 mm/sec handles peak shipping volumes." },
    ],
    operatingSystems: [
      { osName: "Windows 11", osIcon: "desktop_windows" },
      { osName: "Linux", osIcon: "terminal" },
      { osName: "macOS", osIcon: "laptop_mac" },
    ],
    tags: ["label printer", "shipping", "zpl", "4-inch"],
    compatibleDevices: ["HUB-X Pro", "Windows POS"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v1.2.0",
  },
  {
    name: "QBIT Kiosk Pro 27", brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "Kiosk-Pro-27", slug: "kiosk-pro-27", deviceType: "kiosk", category: "kiosk",
    description: "27-inch self-service kiosk with touch and card payment.",
    longDescription: "The QBIT Kiosk Pro 27 is a 27-inch FHD self-service kiosk with Projected Capacitive touch, integrated thermal printer, EMV card payment, and NFC.",
    startingPrice: "₹1,45,000", sku: "QBT-KP27",
    driverDownloadUrl: "https://example.com/drivers/kp27-driver.exe",
    manualUrl: "https://example.com/manuals/kp27-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/kp27-datasheet.pdf",
    imageUrl: "https://images.unsplash.com/photo-1567531460820-9a4d0e0d3a7c?w=800&q=80",
    galleryImages: [{ url: "https://images.unsplash.com/photo-1567531460820-9a4d0e0d3a7c?w=1200&q=80", alt: "Kiosk Pro 27" }],
    specifications: [
      { property: "Display", value: '27" FHD 1920x1080, PCAP 10-point touch', group: "Display" },
      { property: "Processor", value: "Intel Celeron J4125 quad-core", group: "Compute" },
      { property: "Integrated", value: "Thermal printer, EMV card reader, NFC", group: "Peripherals" },
    ],
    features: [
      { icon: "storefront", title: "Self-Service Ready", description: "Touch, payment, and receipt printing in one unit." },
      { icon: "shield", title: "Vandal Resistant", description: "Steel housing with tempered glass for public deployment." },
    ],
    operatingSystems: [
      { osName: "Windows 10 IoT", osIcon: "desktop_windows" },
      { osName: "Linux Ubuntu", osIcon: "terminal" },
    ],
    tags: ["kiosk", "self-service", "27-inch", "touch"],
    compatibleDevices: ["T-800 Thermal Printer"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v1.0.0",
  },
  {
    name: "QBIT Android POS Lite", brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "APL-10", slug: "android-pos-lite", deviceType: "android_pos", category: "android-pos",
    description: "10-inch Android POS tablet with built-in printer.",
    longDescription: "The QBIT Android POS Lite is a 10.1-inch handheld Android POS terminal with a built-in 58mm thermal printer, NFC, EMV card reader, and 4G connectivity.",
    startingPrice: "₹22,500", sku: "QBT-APL10",
    driverDownloadUrl: "https://example.com/drivers/apl10-driver.apk",
    manualUrl: "https://example.com/manuals/apl10-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/apl10-datasheet.pdf",
    imageUrl: "https://images.unsplash.com/photo-1605236453808-2c3f9d8e3d3f?w=800&q=80",
    galleryImages: [{ url: "https://images.unsplash.com/photo-1605236453808-2c3f9d8e3d3f?w=1200&q=80", alt: "Android POS Lite" }],
    specifications: [
      { property: "Display", value: '10.1" HD 1280x800, 5-point touch', group: "Display" },
      { property: "Processor", value: "MediaTek MT8788 octa-core", group: "Compute" },
      { property: "OS", value: "Android 13 (GMS certified)", group: "Software" },
    ],
    features: [
      { icon: "phone_android", title: "Android 13 GMS", description: "Full Google Mobile Services support for any POS app." },
      { icon: "print", title: "Built-in Printer", description: "Integrated 58mm thermal printer — no external device needed." },
    ],
    operatingSystems: [{ osName: "Android 13", osIcon: "phone_android" }],
    tags: ["android pos", "mobile pos", "handheld", "tablet"],
    compatibleDevices: ["Cloud POS"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v1.4.2",
  },
];

async function main() {
  console.log(`Seeding ${PRODUCTS.length} products to production DB…`);

  // First activate any existing inactive products
  const reactivated = await db.qbitProduct.updateMany({
    where: { isActive: false },
    data: { isActive: true, status: "active" },
  });
  console.log(`  ✓ Reactivated ${reactivated.count} existing products`);

  // Backfill category on existing products based on deviceType
  const deviceTypeToCategory: Record<string, string> = {
    thermal_printer: "thermal-printer",
    barcode_scanner: "barcode-scanner",
    windows_pos: "windows-pos",
    android_pos: "android-pos",
    cash_drawer: "cash-drawer",
    customer_display: "customer-display",
    label_printer: "label-printer",
    kitchen_printer: "kitchen-printer",
    kiosk: "kiosk",
    weighing_scale: "weighing-scale",
  };
  for (const [dt, cat] of Object.entries(deviceTypeToCategory)) {
    await db.qbitProduct.updateMany({
      where: { deviceType: dt, category: null },
      data: { category: cat },
    });
  }
  console.log(`  ✓ Backfilled category on existing products`);

  for (const p of PRODUCTS) {
    // Find by slug OR model — production DB has legacy rows with different slug conventions
    let existing = await db.qbitProduct.findUnique({ where: { slug: p.slug } });
    if (!existing) existing = await db.qbitProduct.findFirst({ where: { model: p.model } });
    if (existing) {
      // Update with rich data, also normalize the slug if it was different
      await db.qbitProduct.update({
        where: { id: existing.id },
        data: {
          name: p.name, brand: p.brand, manufacturer: p.manufacturer,
          model: p.model, slug: p.slug,  // normalize slug to our convention
          description: p.description, longDescription: p.longDescription,
          category: p.category, imageUrl: p.imageUrl,
          galleryImages: p.galleryImages ? JSON.stringify(p.galleryImages) : null,
          startingPrice: p.startingPrice, sku: p.sku, badgeLabel: p.badgeLabel,
          isFeatured: p.isFeatured ?? false, isTrending: p.isTrending ?? false,
          driverDownloadUrl: p.driverDownloadUrl, manualUrl: p.manualUrl,
          brochureUrl: p.brochureUrl, datasheetUrl: p.datasheetUrl,
          warrantyUrl: p.warrantyUrl, sdkUrl: p.sdkUrl, utilityUrl: p.utilityUrl,
          installationGuideUrl: p.installationGuideUrl, knowledgeBaseUrl: p.knowledgeBaseUrl,
          qrCodeUrl: `https://hub.qbit.com/products/${p.slug}`,
          tags: p.tags?.join(","),
          compatibleDevices: p.compatibleDevices?.join(","),
          aiDiagnosticsSupported: p.aiDiagnosticsSupported ?? true,
          drQbitSupported: p.drQbitSupported ?? true,
          latestDriverVersion: p.latestDriverVersion,
          latestFirmwareVersion: p.latestFirmwareVersion,
          status: "active", isActive: true, lastUpdated: new Date(),
        },
      });
      console.log(`  ✓ Updated existing: ${p.slug} (was ${existing.slug})`);
    } else {
      // Create new
      const created = await db.qbitProduct.create({
        data: {
          name: p.name, brand: p.brand, manufacturer: p.manufacturer,
          model: p.model, slug: p.slug, deviceType: p.deviceType, category: p.category,
          description: p.description, longDescription: p.longDescription,
          imageUrl: p.imageUrl,
          galleryImages: p.galleryImages ? JSON.stringify(p.galleryImages) : null,
          startingPrice: p.startingPrice, sku: p.sku, badgeLabel: p.badgeLabel,
          isFeatured: p.isFeatured ?? false, isTrending: p.isTrending ?? false,
          driverDownloadUrl: p.driverDownloadUrl, manualUrl: p.manualUrl,
          brochureUrl: p.brochureUrl, datasheetUrl: p.datasheetUrl,
          warrantyUrl: p.warrantyUrl, sdkUrl: p.sdkUrl, utilityUrl: p.utilityUrl,
          installationGuideUrl: p.installationGuideUrl, knowledgeBaseUrl: p.knowledgeBaseUrl,
          qrCodeUrl: `https://hub.qbit.com/products/${p.slug}`,
          tags: p.tags?.join(","),
          compatibleDevices: p.compatibleDevices?.join(","),
          aiDiagnosticsSupported: p.aiDiagnosticsSupported ?? true,
          drQbitSupported: p.drQbitSupported ?? true,
          latestDriverVersion: p.latestDriverVersion,
          latestFirmwareVersion: p.latestFirmwareVersion,
          status: "active", isActive: true, lastUpdated: new Date(),
        },
      });
      console.log(`  ✓ Created new: ${p.slug} (id=${created.id})`);
    }

    // Always (re)sync structured child rows
    const product = await db.qbitProduct.findUnique({ where: { slug: p.slug } });
    if (!product) continue;

    if (p.specifications?.length) {
      await db.productSpecification.deleteMany({ where: { productId: product.id } });
      await db.productSpecification.createMany({
        data: p.specifications.map((s, i) => ({
          productId: product.id, property: s.property, value: s.value,
          group: s.group ?? null, sortIndex: i,
        })),
      });
    }
    if (p.features?.length) {
      await db.productFeature.deleteMany({ where: { productId: product.id } });
      await db.productFeature.createMany({
        data: p.features.map((f, i) => ({
          productId: product.id, icon: f.icon, title: f.title,
          description: f.description, sortIndex: i,
        })),
      });
    }
    if (p.operatingSystems?.length) {
      await db.productOS.deleteMany({ where: { productId: product.id } });
      await db.productOS.createMany({
        data: p.operatingSystems.map((o, i) => ({
          productId: product.id, osName: o.osName, osIcon: o.osIcon ?? null,
          minVersion: o.minVersion ?? null, sortIndex: i,
        })),
      });
    }
    if (p.mediaFiles?.length) {
      await db.productMedia.deleteMany({ where: { productId: product.id } });
      await db.productMedia.createMany({
        data: p.mediaFiles.map((m, i) => ({
          productId: product.id, type: m.type, title: m.title, url: m.url,
          mimeType: m.mimeType ?? null, altText: m.altText ?? null,
          provider: m.provider ?? null, externalId: m.externalId ?? null, sortIndex: i,
        })),
      });
    }
  }

  // Wire up related products for t800 + hub-x-pro
  const t800 = await db.qbitProduct.findUnique({ where: { slug: "t800" } });
  const hubx = await db.qbitProduct.findUnique({ where: { slug: "hub-x-pro" } });
  const sme1 = await db.qbitProduct.findUnique({ where: { slug: "scanmaster-elite" } });
  const cd410 = await db.qbitProduct.findUnique({ where: { slug: "cd-410" } });
  if (t800 && hubx) {
    await db.productRelation.deleteMany({ where: { productId: t800.id } }).catch(() => {});
    await db.productRelation.createMany({
      data: [
        { productId: t800.id, relatedId: hubx.id, sortIndex: 0 },
        ...(cd410 ? [{ productId: t800.id, relatedId: cd410.id, sortIndex: 1 }] : []),
      ],
    }).catch(() => {});
  }
  if (hubx) {
    await db.productRelation.deleteMany({ where: { productId: hubx.id } }).catch(() => {});
    const rels = [];
    if (sme1) rels.push({ productId: hubx.id, relatedId: sme1.id, sortIndex: 0 });
    if (t800) rels.push({ productId: hubx.id, relatedId: t800.id, sortIndex: 1 });
    if (cd410) rels.push({ productId: hubx.id, relatedId: cd410.id, sortIndex: 2 });
    if (rels.length) await db.productRelation.createMany({ data: rels }).catch(() => {});
  }

  // Final count
  const total = await db.qbitProduct.count();
  const active = await db.qbitProduct.count({ where: { isActive: true } });
  console.log(`\n=== Done. Total: ${total} products, ${active} active ===`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
