/**
 * Seed real QBIT products into the database so the new /products and
 * /products/[slug] routes can be tested end-to-end.
 *
 * Run with: npx tsx scripts/seed-products.ts
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
  startingPrice?: string; sku?: string; serialPattern?: string;
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
    name: "QBIT T-800 Thermal Printer",
    brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "T-800", slug: "t800",
    deviceType: "thermal_printer", category: "thermal-printer",
    description: "High-speed 80mm thermal receipt printer with auto-cutter.",
    longDescription:
      "The QBIT T-800 is an enterprise-grade 80mm direct-thermal receipt printer engineered for high-volume retail and hospitality environments. With a print speed of 250 mm/sec, a guaranteed 100km printhead life, and an industrial-grade auto-cutter rated for 1.5 million cuts, the T-800 delivers reliable performance under continuous load. Multiple interface options (USB, Serial, Ethernet, Bluetooth) ensure drop-in compatibility with any POS software stack.",
    isFeatured: true, isTrending: true, badgeLabel: "Most Downloaded",
    imageUrl: "https://images.unsplash.com/photo-1612831455540-b62ede1dcb9c?w=800&q=80",
    galleryImages: [
      { url: "https://images.unsplash.com/photo-1612831455540-b62ede1dcb9c?w=1200&q=80", alt: "T-800 front view" },
      { url: "https://images.unsplash.com/photo-1612831455540-b62ede1dcb9c?w=1200&q=80", alt: "T-800 side view" },
      { url: "https://images.unsplash.com/photo-1612831455540-b62ede1dcb9c?w=1200&q=80", alt: "T-800 top view" },
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
      { property: "Paper Roll Diameter", value: "Up to 80mm", group: "Mechanical" },
      { property: "Power Supply", value: "DC 24V / 2.5A", group: "Power" },
      { property: "Dimensions", value: "145 × 195 × 145 mm", group: "Physical" },
      { property: "Weight", value: "1.6 kg", group: "Physical" },
      { property: "Operating Temperature", value: "5°C to 45°C, 10-90% RH", group: "Environment" },
    ],
    features: [
      { icon: "bolt", title: "High-Speed Printing", description: "250 mm/sec print speed keeps checkout lines moving fast." },
      { icon: "cut", title: "Industrial Auto-Cutter", description: "Heavy-duty auto-cutter rated for 1.5 million cuts — minimal maintenance." },
      { icon: "hub", title: "Multi-Interface", description: "USB, Serial, Ethernet and Bluetooth built-in — no adapter needed." },
      { icon: "shield", title: "Long-Life Printhead", description: "100km printhead life ensures years of trouble-free operation." },
    ],
    operatingSystems: [
      { osName: "Windows 11", osIcon: "desktop_windows", minVersion: "10" },
      { osName: "Windows 10", osIcon: "desktop_windows" },
      { osName: "Linux", osIcon: "terminal", minVersion: "Kernel 4.x" },
      { osName: "Android", osIcon: "phone_android", minVersion: "8.0" },
    ],
    videos: [
      { type: "video", title: "T-800 Installation Walkthrough", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", provider: "youtube", externalId: "dQw4w9WgXcQ", mimeType: "video/youtube" },
    ],
    mediaFiles: [
      { type: "image", title: "T-800 Front", url: "https://images.unsplash.com/photo-1612831455540-b62ede1dcb9c?w=1200&q=80", altText: "T-800 front view", mimeType: "image/jpeg" },
      { type: "brochure", title: "T-800 Brochure", url: "https://example.com/brochures/t800-brochure.pdf", mimeType: "application/pdf" },
      { type: "datasheet", title: "T-800 Datasheet", url: "https://example.com/datasheets/t800-datasheet.pdf", mimeType: "application/pdf" },
      { type: "warranty", title: "T-800 Warranty Terms", url: "https://example.com/warranty/t800-warranty-terms.pdf", mimeType: "application/pdf" },
      { type: "sdk", title: "T-800 SDK v1.2", url: "https://example.com/sdk/t800-sdk-v1.2.zip", mimeType: "application/zip" },
      { type: "utility", title: "T-800 Config Tool", url: "https://example.com/utilities/t800-config-tool.exe", mimeType: "application/octet-stream" },
      { type: "video", title: "T-800 Installation Walkthrough", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", provider: "youtube", externalId: "dQw4w9WgXcQ" },
    ],
    tags: ["thermal", "receipt", "80mm", "auto-cutter", "POS"],
    compatibleDevices: ["Windows POS", "Android POS", "Linux POS", "Cash Drawer"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v2.4.1", latestFirmwareVersion: "v1.8.0",
    seoTitle: "QBIT T-800 Thermal Printer — 250mm/s, Auto-Cutter",
    seoDescription: "Enterprise 80mm thermal receipt printer with 250mm/sec print speed, industrial auto-cutter, multi-interface, and 100km printhead life.",
    seoKeywords: ["thermal printer", "receipt printer", "80mm printer", "POS printer", "auto-cutter"],
    status: "active",
  },
  {
    name: "HUB-X Pro All-in-One POS",
    brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "HUB-X Pro", slug: "hub-x-pro",
    deviceType: "windows_pos", category: "windows-pos",
    description: "15.6\" FHD touch Windows POS terminal with Intel i5.",
    longDescription:
      "The HUB-X Pro is a flagship all-in-one Windows POS terminal featuring a 15.6\" Full-HD multi-touch display, 11th-gen Intel Core i5 processor, and an extensive I/O array. Designed for retail, hospitality, and QSR environments, it integrates printer, cash drawer, scanner, and customer display into a single cable-managed unit. The IP54-rated aluminum chassis withstands harsh environments while consuming 40% less power than conventional desktop POS systems.",
    isFeatured: true, isTrending: true, badgeLabel: "Top Resource",
    imageUrl: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&q=80",
    galleryImages: [
      { url: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&q=80", alt: "HUB-X Pro front" },
      { url: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&q=80", alt: "HUB-X Pro rear" },
    ],
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
      { property: "Connectivity", value: "Wi-Fi 6, Bluetooth 5.1, 1Gbps Ethernet", group: "Connectivity" },
      { property: "Ports", value: "6x USB 3.0, 2x COM (RS232), 1x HDMI, 1x RJ11 (cash drawer)", group: "Connectivity" },
      { property: "Power", value: "External 12V/5A, Energy Star 8.0", group: "Power" },
      { property: "Dimensions", value: "380 × 270 × 45 mm (display head)", group: "Physical" },
      { property: "Weight", value: "5.2 kg", group: "Physical" },
    ],
    features: [
      { icon: "shield", title: "Industrial Build", description: "IP54-rated aluminum chassis for harsh retail environments." },
      { icon: "hub", title: "Multi-Port Support", description: "Extensive legacy and modern connectivity for peripherals." },
      { icon: "eco", title: "Energy Efficient", description: "Consumes 40% less power than standard desktop POS systems." },
      { icon: "memory", title: "11th-Gen Performance", description: "Intel i5 with 16GB RAM handles complex POS workloads effortlessly." },
    ],
    operatingSystems: [
      { osName: "Windows 11 Pro", osIcon: "desktop_windows" },
      { osName: "Windows 10 IoT", osIcon: "desktop_windows" },
      { osName: "Linux Ubuntu", osIcon: "terminal" },
    ],
    videos: [
      { type: "video", title: "HUB-X Pro Overview", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", provider: "youtube", externalId: "dQw4w9WgXcQ" },
    ],
    mediaFiles: [
      { type: "image", title: "HUB-X Pro Front", url: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&q=80", altText: "HUB-X Pro front view", mimeType: "image/jpeg" },
      { type: "brochure", title: "HUB-X Pro Brochure", url: "https://example.com/brochures/hubxpro-brochure.pdf", mimeType: "application/pdf" },
      { type: "datasheet", title: "HUB-X Pro Datasheet", url: "https://example.com/datasheets/hubxpro-datasheet.pdf", mimeType: "application/pdf" },
    ],
    tags: ["windows pos", "touch terminal", "i5", "all-in-one"],
    compatibleDevices: ["Thermal Printer T-800", "Cash Drawer CD-410", "Barcode Scanner BS-550"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v3.1.0", latestFirmwareVersion: "v2.0.1",
    status: "active",
  },
  {
    name: "ScanMaster Elite Wireless Scanner",
    brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "SM-E1", slug: "scanmaster-elite",
    deviceType: "barcode_scanner", category: "barcode-scanner",
    description: "2D wireless barcode scanner with Bluetooth and base station.",
    longDescription:
      "The ScanMaster Elite is a premium 2D imager barcode scanner with Bluetooth 5.0 wireless connectivity, a 1,500 mAh battery rated for 30,000 scans per charge, and an industrial IP54 housing rated for 1.5m drops. It reads all major 1D and 2D symbologies including QR, DataMatrix, PDF417, and Aztec, even from damaged or poorly-printed labels. The included charging base supports both Bluetooth and USB cable modes for flexible deployment.",
    isFeatured: false, isTrending: true, badgeLabel: "Newly Released",
    imageUrl: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80",
    galleryImages: [
      { url: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80", alt: "ScanMaster Elite scanner" },
    ],
    startingPrice: "₹12,900", sku: "QBT-SME1",
    driverDownloadUrl: "https://example.com/drivers/sme1-driver.exe",
    manualUrl: "https://example.com/manuals/sme1-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/sme1-datasheet.pdf",
    warrantyUrl: "https://example.com/warranty/sme1-warranty.pdf",
    specifications: [
      { property: "Scan Technology", value: "2D CMOS Imager", group: "Optics" },
      { property: "Reads", value: "All 1D/2D symbologies (QR, DataMatrix, PDF417, Aztec, etc.)", group: "Optics" },
      { property: "Scan Rate", value: "60 scans/sec", group: "Performance" },
      { property: "Connectivity", value: "Bluetooth 5.0 (up to 100m) + USB cable", group: "Connectivity" },
      { property: "Battery", value: "1500 mAh, 30,000 scans/charge", group: "Power" },
      { property: "Drop Rating", value: "1.5m to concrete", group: "Mechanical" },
      { property: "IP Rating", value: "IP54", group: "Mechanical" },
      { property: "Weight", value: "210g (with battery)", group: "Physical" },
    ],
    features: [
      { icon: "wifi", title: "Wireless Freedom", description: "Bluetooth 5.0 with 100m range and base station." },
      { icon: "bolt", title: "Fast Reading", description: "60 scans/sec reads even damaged or faded barcodes." },
      { icon: "shield", title: "Industrial Durability", description: "1.5m drop rating and IP54 sealing for warehouse use." },
    ],
    operatingSystems: [
      { osName: "Windows 11", osIcon: "desktop_windows" },
      { osName: "Windows 10", osIcon: "desktop_windows" },
      { osName: "Android", osIcon: "phone_android" },
      { osName: "iOS", osIcon: "phone_iphone" },
    ],
    videos: [],
    mediaFiles: [
      { type: "image", title: "ScanMaster Elite", url: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80", altText: "ScanMaster Elite scanner", mimeType: "image/jpeg" },
      { type: "datasheet", title: "SME-1 Datasheet", url: "https://example.com/datasheets/sme1-datasheet.pdf", mimeType: "application/pdf" },
    ],
    tags: ["barcode scanner", "2d scanner", "wireless", "bluetooth"],
    compatibleDevices: ["HUB-X Pro", "Android POS", "Windows POS"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v1.0.4", status: "active",
  },
  {
    name: "CD-410 Cash Drawer",
    brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "CD-410", slug: "cd-410",
    deviceType: "cash_drawer", category: "cash-drawer",
    description: "Heavy-duty cash drawer with 5 notes / 8 coins layout.",
    longDescription:
      "The CD-410 is a rugged steel-cash drawer with a 5-note/8-coin layout, 3-position key lock, and a micro-switch for RJ11 host reporting. The drawer slides on steel roller bearings and is rated for 1 million open/close cycles. Compatible with any POS printer that drives an RJ11 cash-drawer port.",
    startingPrice: "₹6,500", sku: "QBT-CD410",
    manualUrl: "https://example.com/manuals/cd410-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/cd410-datasheet.pdf",
    warrantyUrl: "https://example.com/warranty/cd410-warranty.pdf",
    specifications: [
      { property: "Layout", value: "5 notes / 8 coins", group: "Capacity" },
      { property: "Lock", value: "3-position key lock (manual / electric / lock)", group: "Security" },
      { property: "Host Interface", value: "RJ11 (12V pulse)", group: "Connectivity" },
      { property: "Cycle Life", value: "1,000,000 open/close cycles", group: "Mechanical" },
      { property: "Material", value: "Cold-rolled steel, 1.2mm", group: "Physical" },
      { property: "Dimensions", value: "410 × 410 × 100 mm", group: "Physical" },
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
    videos: [],
    mediaFiles: [
      { type: "datasheet", title: "CD-410 Datasheet", url: "https://example.com/datasheets/cd410-datasheet.pdf", mimeType: "application/pdf" },
    ],
    tags: ["cash drawer", "rj11", "pos peripheral"],
    compatibleDevices: ["HUB-X Pro", "T-800 Thermal Printer"],
    aiDiagnosticsSupported: false, drQbitSupported: true,
    status: "active",
  },
  {
    name: "QBIT KDS-1500 Kitchen Display System",
    brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "KDS-1500", slug: "kds-1500",
    deviceType: "customer_display", category: "customer-display",
    description: "15-inch dual-sided kitchen display system for QSR.",
    longDescription:
      "The QBIT KDS-1500 is a 15-inch FHD kitchen display system with IP65 front sealing, designed for QSR and restaurant kitchens. Features include order routing, allergen highlighting, prep-time tracking, and bump-bar support. Powered by an ARM Cortex-A55 with 4GB RAM.",
    startingPrice: "₹34,500", sku: "QBT-KDS1500",
    manualUrl: "https://example.com/manuals/kds1500-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/kds1500-datasheet.pdf",
    specifications: [
      { property: "Display", value: '15" FHD 1920x1080, IP65 front', group: "Display" },
      { property: "Processor", value: "ARM Cortex-A55 quad-core", group: "Compute" },
      { property: "Memory", value: "4GB DDR4", group: "Compute" },
      { property: "Storage", value: "32GB eMMC", group: "Compute" },
      { property: "Connectivity", value: "Wi-Fi 5, Bluetooth 4.2, Ethernet", group: "Connectivity" },
      { property: "Mounting", value: "VESA 100 × 100", group: "Physical" },
    ],
    features: [
      { icon: "restaurant", title: "QSR-Optimized UI", description: "Allergen highlighting, prep-time tracking, order routing." },
      { icon: "water_drop", title: "IP65 Front Sealing", description: "Withstands grease, water, and heat of commercial kitchens." },
    ],
    operatingSystems: [
      { osName: "Embedded Linux", osIcon: "terminal" },
    ],
    videos: [],
    mediaFiles: [],
    tags: ["kitchen display", "kds", "qsr", "ip65"],
    compatibleDevices: ["HUB-X Pro", "T-800 Thermal Printer"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    status: "active",
  },
  {
    name: "LP-220 Label Printer",
    brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "LP-220", slug: "lp-220",
    deviceType: "label_printer", category: "label-printer",
    description: "4-inch direct-thermal label printer for shipping & inventory.",
    longDescription:
      "The LP-220 is a 4-inch (108mm) direct-thermal label printer optimized for shipping labels, barcode labels, and inventory tags. With 203 dpi resolution, 150 mm/sec print speed, and support for ZPL/TSPL/EPL emulation, it integrates seamlessly into existing warehouse workflows.",
    startingPrice: "₹14,200", sku: "QBT-LP220",
    driverDownloadUrl: "https://example.com/drivers/lp220-driver.exe",
    manualUrl: "https://example.com/manuals/lp220-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/lp220-datasheet.pdf",
    warrantyUrl: "https://example.com/warranty/lp220-warranty.pdf",
    specifications: [
      { property: "Print Method", value: "Direct Thermal", group: "Printing" },
      { property: "Print Width", value: "108mm (4 inch)", group: "Printing" },
      { property: "Print Speed", value: "150 mm/sec", group: "Printing" },
      { property: "Resolution", value: "203 dpi", group: "Printing" },
      { property: "Emulation", value: "ZPL / TSPL / EPL", group: "Software" },
      { property: "Interface", value: "USB 2.0 + RS-232 + Ethernet", group: "Connectivity" },
    ],
    features: [
      { icon: "label", title: "Multi-Emulation", description: "ZPL, TSPL, and EPL support for drop-in replacement." },
      { icon: "bolt", title: "Fast Throughput", description: "150 mm/sec handles peak shipping volumes." },
    ],
    operatingSystems: [
      { osName: "Windows 11", osIcon: "desktop_windows" },
      { osName: "Windows 10", osIcon: "desktop_windows" },
      { osName: "Linux", osIcon: "terminal" },
      { osName: "macOS", osIcon: "laptop_mac" },
    ],
    videos: [],
    mediaFiles: [],
    tags: ["label printer", "shipping", "zpl", "4-inch"],
    compatibleDevices: ["HUB-X Pro", "Windows POS"],
    aiDiagnosticsSupported: false, drQbitSupported: true,
    latestDriverVersion: "v1.2.0", status: "active",
  },
  {
    name: "QBIT Kiosk Pro 27",
    brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "Kiosk-Pro-27", slug: "kiosk-pro-27",
    deviceType: "kiosk", category: "kiosk",
    description: "27-inch self-service kiosk with touch and card payment.",
    longDescription:
      "The QBIT Kiosk Pro 27 is a 27-inch FHD self-service kiosk with Projected Capacitive touch, integrated thermal printer, EMV card payment, and NFC. Designed for quick-service restaurants, retail, and healthcare check-in. Vandal-resistant glass and steel housing.",
    startingPrice: "₹1,45,000", sku: "QBT-KP27",
    driverDownloadUrl: "https://example.com/drivers/kp27-driver.exe",
    manualUrl: "https://example.com/manuals/kp27-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/kp27-datasheet.pdf",
    specifications: [
      { property: "Display", value: '27" FHD 1920x1080, PCAP 10-point touch', group: "Display" },
      { property: "Processor", value: "Intel Celeron J4125 quad-core", group: "Compute" },
      { property: "Memory", value: "8GB DDR4", group: "Compute" },
      { property: "Storage", value: "128GB SSD", group: "Compute" },
      { property: "Integrated", value: "Thermal printer, EMV card reader, NFC", group: "Peripherals" },
      { property: "Housing", value: "Cold-rolled steel, vandal-resistant glass", group: "Physical" },
    ],
    features: [
      { icon: "storefront", title: "Self-Service Ready", description: "Touch, payment, and receipt printing in one unit." },
      { icon: "shield", title: "Vandal Resistant", description: "Steel housing with tempered glass for public deployment." },
    ],
    operatingSystems: [
      { osName: "Windows 10 IoT", osIcon: "desktop_windows" },
      { osName: "Linux Ubuntu", osIcon: "terminal" },
    ],
    videos: [],
    mediaFiles: [],
    tags: ["kiosk", "self-service", "27-inch", "touch"],
    compatibleDevices: ["T-800 Thermal Printer"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v1.0.0", status: "active",
  },
  {
    name: "QBIT Android POS Lite",
    brand: "QBIT", manufacturer: "QBIT Technologies",
    model: "APL-10", slug: "android-pos-lite",
    deviceType: "android_pos", category: "android-pos",
    description: "10-inch Android POS tablet with built-in printer.",
    longDescription:
      "The QBIT Android POS Lite is a 10.1-inch handheld Android POS terminal with a built-in 58mm thermal printer, NFC, EMV card reader, and 4G connectivity. Designed for food trucks, delivery, and field service. Android 13 GMS-certified.",
    startingPrice: "₹22,500", sku: "QBT-APL10",
    driverDownloadUrl: "https://example.com/drivers/apl10-driver.apk",
    manualUrl: "https://example.com/manuals/apl10-manual.pdf",
    datasheetUrl: "https://example.com/datasheets/apl10-datasheet.pdf",
    specifications: [
      { property: "Display", value: '10.1" HD 1280x800, 5-point touch', group: "Display" },
      { property: "Processor", value: "MediaTek MT8788 octa-core", group: "Compute" },
      { property: "Memory", value: "3GB RAM / 32GB eMMC", group: "Compute" },
      { property: "OS", value: "Android 13 (GMS certified)", group: "Software" },
      { property: "Printer", value: "Built-in 58mm thermal, 90mm/sec", group: "Peripherals" },
      { property: "Payment", value: "EMV chip + NFC + magnetic stripe", group: "Peripherals" },
      { property: "Connectivity", value: "4G LTE, Wi-Fi 5, Bluetooth 4.2", group: "Connectivity" },
      { property: "Battery", value: "5000 mAh, 8-hour active use", group: "Power" },
    ],
    features: [
      { icon: "phone_android", title: "Android 13 GMS", description: "Full Google Mobile Services support for any POS app." },
      { icon: "print", title: "Built-in Printer", description: "Integrated 58mm thermal printer — no external device needed." },
    ],
    operatingSystems: [
      { osName: "Android 13", osIcon: "phone_android" },
    ],
    videos: [],
    mediaFiles: [],
    tags: ["android pos", "mobile pos", "handheld", "tablet"],
    compatibleDevices: ["Cloud POS"],
    aiDiagnosticsSupported: true, drQbitSupported: true,
    latestDriverVersion: "v1.4.2", status: "active",
  },
];

async function main() {
  console.log(`Seeding ${PRODUCTS.length} products…`);

  for (const p of PRODUCTS) {
    // Clean up any prior seed for this slug to make the script idempotent
    const existing = await db.qbitProduct.findUnique({ where: { slug: p.slug } });
    if (existing) {
      await db.productRelation.deleteMany({ where: { OR: [{ productId: existing.id }, { relatedId: existing.id }] } });
      await db.productOS.deleteMany({ where: { productId: existing.id } });
      await db.productMedia.deleteMany({ where: { productId: existing.id } });
      await db.productSpecification.deleteMany({ where: { productId: existing.id } });
      await db.productFeature.deleteMany({ where: { productId: existing.id } });
      await db.qbitProduct.delete({ where: { id: existing.id } });
    }

    const created = await db.qbitProduct.create({
      data: {
        name: p.name,
        brand: p.brand,
        manufacturer: p.manufacturer,
        model: p.model,
        slug: p.slug,
        deviceType: p.deviceType,
        category: p.category,
        description: p.description,
        longDescription: p.longDescription,
        isFeatured: p.isFeatured ?? false,
        isTrending: p.isTrending ?? false,
        badgeLabel: p.badgeLabel,
        imageUrl: p.imageUrl,
        galleryImages: p.galleryImages ? JSON.stringify(p.galleryImages) : null,
        startingPrice: p.startingPrice,
        sku: p.sku,
        serialPattern: p.serialPattern,
        driverDownloadUrl: p.driverDownloadUrl,
        manualUrl: p.manualUrl,
        brochureUrl: p.brochureUrl,
        datasheetUrl: p.datasheetUrl,
        warrantyUrl: p.warrantyUrl,
        sdkUrl: p.sdkUrl,
        utilityUrl: p.utilityUrl,
        installationGuideUrl: p.installationGuideUrl,
        knowledgeBaseUrl: p.knowledgeBaseUrl,
        specifications: p.specifications ? JSON.stringify(p.specifications) : null,
        features: p.features ? JSON.stringify(p.features) : null,
        operatingSystems: p.operatingSystems ? JSON.stringify(p.operatingSystems) : null,
        videos: p.videos && p.videos.length > 0 ? JSON.stringify(p.videos) : null,
        tags: p.tags?.join(","),
        compatibleDevices: p.compatibleDevices?.join(","),
        aiDiagnosticsSupported: p.aiDiagnosticsSupported ?? true,
        drQbitSupported: p.drQbitSupported ?? true,
        latestDriverVersion: p.latestDriverVersion,
        latestFirmwareVersion: p.latestFirmwareVersion,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        seoKeywords: p.seoKeywords?.join(","),
        status: p.status ?? "active",
        qrCodeUrl: `https://hub.qbit.com/products/${p.slug}`,
        lastUpdated: new Date(),
        isActive: true,
      },
    });

    if (p.specifications) {
      await db.productSpecification.createMany({
        data: p.specifications.map((s, i) => ({
          productId: created.id,
          property: s.property,
          value: s.value,
          group: s.group ?? null,
          sortIndex: i,
        })),
      });
    }
    if (p.features) {
      await db.productFeature.createMany({
        data: p.features.map((f, i) => ({
          productId: created.id,
          icon: f.icon, title: f.title, description: f.description, sortIndex: i,
        })),
      });
    }
    if (p.operatingSystems) {
      await db.productOS.createMany({
        data: p.operatingSystems.map((o, i) => ({
          productId: created.id,
          osName: o.osName, osIcon: o.osIcon ?? null, minVersion: o.minVersion ?? null,
          sortIndex: i,
        })),
      });
    }
    if (p.mediaFiles && p.mediaFiles.length > 0) {
      await db.productMedia.createMany({
        data: p.mediaFiles.map((m, i) => ({
          productId: created.id,
          type: m.type, title: m.title, url: m.url, mimeType: m.mimeType ?? null,
          altText: m.altText ?? null, provider: m.provider ?? null, externalId: m.externalId ?? null,
          sortIndex: i,
        })),
      });
    }

    console.log(`  ✓ ${p.slug} (${p.name})`);
  }

  // Wire up some related products for the T-800
  const t800 = await db.qbitProduct.findUnique({ where: { slug: "t800" } });
  const hubx = await db.qbitProduct.findUnique({ where: { slug: "hub-x-pro" } });
  const sme1 = await db.qbitProduct.findUnique({ where: { slug: "scanmaster-elite" } });
  const cd410 = await db.qbitProduct.findUnique({ where: { slug: "cd-410" } });
  if (t800 && hubx) await db.productRelation.create({ data: { productId: t800.id, relatedId: hubx.id, sortIndex: 0 } }).catch(() => {});
  if (t800 && cd410) await db.productRelation.create({ data: { productId: t800.id, relatedId: cd410.id, sortIndex: 1 } }).catch(() => {});
  if (hubx && sme1) await db.productRelation.create({ data: { productId: hubx.id, relatedId: sme1.id, sortIndex: 0 } }).catch(() => {});
  if (hubx && t800) await db.productRelation.create({ data: { productId: hubx.id, relatedId: t800.id, sortIndex: 1 } }).catch(() => {});
  if (hubx && cd410) await db.productRelation.create({ data: { productId: hubx.id, relatedId: cd410.id, sortIndex: 2 } }).catch(() => {});

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
