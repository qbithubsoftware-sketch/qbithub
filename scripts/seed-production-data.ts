/**
 * Production Seed Script — QBIT Hub Enterprise Support Portal
 * Seeds all products, resources, knowledge articles, installation guides,
 * FAQs, troubleshooting, and Dr. QBIT diagnostic data.
 *
 * Run: export DATABASE_URL="postgres://postgres:qbithub2024@localhost:54321/qbithub"
 *      npx tsx scripts/seed-production-data.ts
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: ['warn', 'error'] });

// ============================================================
// PRODUCT DATA — 8 enterprise POS hardware products
// ============================================================

const PRODUCTS = [
  {
    name: 'P80 Alpha Thermal Printer',
    brand: 'QBITHub',
    manufacturer: 'QBITHub Technologies',
    model: 'P80A',
    slug: 'qbithub-thermal-printer-p80-alpha',
    deviceType: 'thermal_printer',
    sku: 'QBP-80A-001',
    serialPattern: '^P80[A-Z]-[0-9]{6}$',
    description: 'Professional-grade 80mm thermal receipt printer for high-volume retail and hospitality environments.',
    longDescription: `# P80 Alpha Thermal Printer

The P80 Alpha is a professional-grade 80mm thermal receipt printer engineered for high-volume retail and hospitality environments. Featuring a precision thermal print head with 203 DPI resolution and a blazing 250mm/sec print speed, the P80 Alpha delivers crisp, reliable receipts even during peak business hours.

## Key Advantages

- **Ultra-fast 250mm/sec** — Processes receipts in under 3 seconds, eliminating customer wait times during rush hours
- **203 DPI crisp resolution** — Barcodes, QR codes, and text are razor-sharp for flawless scanning and readability
- **Auto-cutter with 1.5 million cuts lifespan** — Reduces maintenance overhead and ensures consistent receipt separation
- **USB + Serial + LAN interfaces** — Flexible connectivity for any POS setup, from standalone terminals to networked multi-station environments
- **Wall-mountable compact design** — Fits any counter space or can be mounted on walls for maximum flexibility

## Ideal Use Cases

The P80 Alpha excels in busy retail checkout lanes, restaurant order processing stations, hotel front desk receipt printing, pharmacy prescription label printing, and banking transaction receipt generation. Its robust construction and multiple interface options make it the go-to choice for enterprises that demand reliability under continuous operation.`,
    imageUrl: '/uploads/products/p80-alpha.png',
    category: 'thermal-printer',
    isFeatured: true,
    isTrending: true,
    badgeLabel: 'Most Downloaded',
    startingPrice: '₹8,500',
    specifications: JSON.stringify([
      { property: 'Print Width', value: '80mm' },
      { property: 'Print Speed', value: '250mm/sec' },
      { property: 'Resolution', value: '203 DPI' },
      { property: 'Interface', value: 'USB + Serial + LAN' },
      { property: 'Power', value: '24V/2.5A' },
      { property: 'Auto-Cutter Life', value: '1.5 million cuts' },
      { property: 'Dimensions', value: '145 × 195 × 145mm' },
      { property: 'Weight', value: '1.6kg' },
      { property: 'Paper Roll Diameter', value: '80mm (max)' },
      { property: 'Barcode Support', value: '1D & 2D (QR, DataMatrix)' },
    ]),
    features: JSON.stringify([
      { icon: 'speed', title: 'Ultra-Fast Printing', description: '250mm/sec print speed processes receipts in under 3 seconds' },
      { icon: 'print', title: '203 DPI Resolution', description: 'Crisp, razor-sharp text and barcodes for flawless scanning' },
      { icon: 'content_cut', title: 'Auto-Cutter', description: 'Built-in auto-cutter with 1.5 million cuts lifespan' },
      { icon: 'cable', title: 'Triple Interface', description: 'USB, Serial, and LAN connectivity for any POS setup' },
      { icon: 'wall', title: 'Wall-Mountable', description: 'Compact design fits any counter or wall-mounted installation' },
      { icon: 'memory', title: '8MB Buffer', description: 'Large print buffer handles complex receipts without lag' },
    ]),
    operatingSystems: JSON.stringify([
      { icon: 'desktop_windows', label: 'Windows 10/11' },
      { icon: 'linux', label: 'Linux (Ubuntu/CentOS)' },
    ]),
    videos: JSON.stringify([
      { title: 'P80 Alpha — Installation Walkthrough', url: 'https://youtube.com/watch?v=p80alpha-install', type: 'youtube' },
      { title: 'P80 Alpha — LAN Setup Guide', url: 'https://youtube.com/watch?v=p80alpha-lan', type: 'youtube' },
    ]),
    driverDownloadUrl: '/downloads/drivers/p80-alpha-driver',
    manualUrl: '/downloads/manuals/p80-alpha-manual',
    installationGuideUrl: '/installations/p80-alpha-setup',
    knowledgeBaseUrl: '/knowledge-base/p80-alpha',
    warrantyUrl: '/downloads/warranty/p80-alpha-warranty',
    sdkUrl: '/downloads/sdk/qbit-sdk-pos',
    utilityUrl: '/downloads/utilities/qbit-config-tool',
    status: 'active',
    isActive: true,
    isDraft: false,
    isPublished: true,
    viewCount: 1250,
    downloadCount: 890,
    latestDriverVersion: 'v2.3.1',
    latestFirmwareVersion: 'v3.1.0',
    supportsWifi: true,
    autoDriverInstall: true,
    sdkAvailable: true,
    firmwareConfigSupported: true,
    connectionTypes: 'usb,lan',
    tags: 'thermal printer, receipt printer, POS printer, 80mm, auto-cutter',
    compatibleDevices: 'V3 POS Machine, AP5 Android POS, CD-101 Cash Drawer',
    aiDiagnosticsSupported: true,
    drQbitSupported: true,
    difficultyLevel: 'Beginner',
    installationTime: '15 minutes',
    highlights: JSON.stringify(['Ultra-fast 250mm/sec', 'Triple Interface', 'Auto-Cutter', 'Wall-mountable']),
    subCategory: 'receipt-printer',
    productSeries: 'P-Series',
    productType: 'Peripheral',
  },
  {
    name: 'S20 Pro 2D Barcode Scanner',
    brand: 'QBITHub',
    manufacturer: 'QBITHub Technologies',
    model: 'S20P',
    slug: 'qbithub-2d-barcode-scanner-s20-pro',
    deviceType: 'barcode_scanner',
    sku: 'QBS-20P-001',
    serialPattern: '^S20[P]-[0-9]{6}$',
    description: 'Premium 2D barcode scanner for demanding retail, logistics, and healthcare applications.',
    longDescription: `# S20 Pro 2D Barcode Scanner

The S20 Pro is a premium 2D barcode scanner designed for demanding retail, logistics, and healthcare applications. With its advanced CMOS sensor and intelligent imaging technology, the S20 Pro reads all major 1D and 2D barcodes including QR codes, DataMatrix, PDF417, and Aztec codes with pinpoint accuracy.

## Key Advantages

- **Omnidirectional 2D imaging** — No need to align the barcode; just point and scan from any angle
- **Reads all 1D/2D codes** — QR, DataMatrix, PDF417, Aztec, UPC, EAN, Code 128, and more
- **IP42 sealed** — Dust and splash protection for harsh warehouse and outdoor environments
- **1.5m drop resistance** — Built to survive accidental drops in busy work environments
- **USB HID + RS232 + KBW interfaces** — Plug into any POS system, terminal, or computer
- **Hands-free stand included** — Presentation mode scanning for counter-mounted continuous operation

## Ideal Use Cases

The S20 Pro excels in retail checkout scanning, warehouse inventory management, healthcare patient identification, logistics parcel tracking, and event ticket verification. Its rugged construction and versatile connectivity make it ideal for environments where reliability and speed are paramount.`,
    imageUrl: '/uploads/products/s20-pro.png',
    category: 'barcode-scanner',
    isFeatured: true,
    isTrending: false,
    badgeLabel: 'Newly Released',
    startingPrice: '₹12,000',
    specifications: JSON.stringify([
      { property: 'Scan Rate', value: '60 fps' },
      { property: 'Resolution', value: '752 × 480' },
      { property: 'Light Source', value: 'White LED + Red Aimer' },
      { property: 'Interface', value: 'USB HID + RS232 + KBW' },
      { property: 'Depth of Field', value: '30-300mm' },
      { property: 'IP Rating', value: 'IP42' },
      { property: 'Drop Resistance', value: '1.5m' },
      { property: 'Dimensions', value: '85 × 140 × 175mm' },
      { property: 'Weight', value: '180g' },
      { property: 'Barcode Types', value: 'All 1D/2D including QR, DataMatrix' },
    ]),
    features: JSON.stringify([
      { icon: 'barcode_scanner', title: 'Omnidirectional Scanning', description: 'Point and scan from any angle — no alignment needed' },
      { icon: 'verified', title: 'All 1D/2D Codes', description: 'QR, DataMatrix, PDF417, Aztec, UPC, EAN, Code 128' },
      { icon: 'water_drop', title: 'IP42 Sealed', description: 'Dust and splash protection for harsh environments' },
      { icon: 'fall', title: '1.5m Drop Resistance', description: 'Survives accidental drops in busy work environments' },
      { icon: 'cable', title: 'Triple Interface', description: 'USB HID, RS232, and KBW connectivity' },
      { icon: 'dock', title: 'Hands-Free Stand', description: 'Presentation mode for continuous counter scanning' },
    ]),
    operatingSystems: JSON.stringify([
      { icon: 'desktop_windows', label: 'Windows 10/11' },
      { icon: 'phone_android', label: 'Android 8+ via USB HID' },
      { icon: 'linux', label: 'Linux (Ubuntu/CentOS)' },
    ]),
    videos: JSON.stringify([
      { title: 'S20 Pro — Quick Setup Guide', url: 'https://youtube.com/watch?v=s20pro-setup', type: 'youtube' },
    ]),
    driverDownloadUrl: '/downloads/drivers/s20-pro-driver',
    manualUrl: '/downloads/manuals/s20-pro-manual',
    installationGuideUrl: '/installations/s20-pro-setup',
    knowledgeBaseUrl: '/knowledge-base/s20-pro',
    warrantyUrl: '/downloads/warranty/s20-pro-warranty',
    utilityUrl: '/downloads/utilities/qbit-config-tool',
    status: 'active',
    isActive: true,
    isDraft: false,
    isPublished: true,
    viewCount: 980,
    downloadCount: 420,
    latestDriverVersion: 'v1.2.0',
    latestFirmwareVersion: 'v2.0.1',
    supportsWifi: false,
    autoDriverInstall: true,
    sdkAvailable: true,
    firmwareConfigSupported: false,
    connectionTypes: 'usb',
    tags: 'barcode scanner, 2D scanner, QR scanner, omnidirectional, POS scanner',
    compatibleDevices: 'V3 POS Machine, AP5 Android POS',
    aiDiagnosticsSupported: true,
    drQbitSupported: true,
    difficultyLevel: 'Beginner',
    installationTime: '5 minutes',
    highlights: JSON.stringify(['Omnidirectional', 'All 1D/2D Codes', 'IP42', '1.5m Drop']),
    subCategory: 'handheld-scanner',
    productSeries: 'S-Series',
    productType: 'Peripheral',
  },
  {
    name: 'V3 All-in-One POS Machine',
    brand: 'QBITHub',
    manufacturer: 'QBITHub Technologies',
    model: 'V3POS',
    slug: 'qbithub-pos-machine-v3',
    deviceType: 'pos_machine',
    sku: 'QBV-3POS-001',
    serialPattern: '^V3POS-[0-9]{6}$',
    description: 'Powerful all-in-one POS terminal with 15.6" touchscreen, Intel J1900, and complete peripheral suite.',
    longDescription: `# V3 All-in-One POS Machine

The V3 is a powerful all-in-one POS terminal featuring a 15.6-inch capacitive touchscreen, Intel Celeron J1900 processor, and a complete peripheral suite. Designed for retail, restaurant, and hospitality environments where reliability and performance are non-negotiable.

## Key Advantages

- **15.6-inch PCAP touchscreen** — Large, responsive display for intuitive POS operations and customer-facing presentations
- **Intel J1900 Quad-Core** — Handles multiple POS applications, inventory management, and reporting simultaneously
- **4GB RAM, 128GB SSD** — Fast boot times, responsive application switching, and ample storage for transaction logs
- **Built-in 80mm thermal printer** — Eliminates external printer dependency, reduces counter clutter, and simplifies cabling
- **Smart card + NFC reader** — Accepts EMV chip cards, contactless payments, and mobile wallet transactions
- **VESA mount compatible** — Flexible mounting options for counter-top, pole, or wall installations

## Ideal Use Cases

The V3 excels in full-service restaurant order management, multi-lane retail checkout, hotel front desk billing, pharmacy point-of-sale with prescription integration, and specialty store operations requiring both payment processing and inventory management on a single device.`,
    imageUrl: '/uploads/products/v3-pos.png',
    category: 'window-pos',
    isFeatured: true,
    isTrending: true,
    badgeLabel: 'Most Popular',
    startingPrice: '₹45,000',
    specifications: JSON.stringify([
      { property: 'Display', value: '15.6" PCAP Capacitive' },
      { property: 'CPU', value: 'Intel Celeron J1900 Quad-Core' },
      { property: 'RAM', value: '4GB DDR3' },
      { property: 'Storage', value: '128GB SSD' },
      { property: 'Built-in Printer', value: '80mm Thermal' },
      { property: 'Card Reader', value: 'Smart Card + NFC' },
      { property: 'OS', value: 'Windows 10 IoT / Linux' },
      { property: 'Dimensions', value: '350 × 400 × 200mm' },
      { property: 'Weight', value: '5.2kg' },
      { property: 'VESA', value: '100 × 100mm compatible' },
    ]),
    features: JSON.stringify([
      { icon: 'monitor', title: '15.6" Touch Display', description: 'Large PCAP capacitive touchscreen for intuitive operation' },
      { icon: 'memory', title: 'Quad-Core Processor', description: 'Intel J1900 handles multiple apps simultaneously' },
      { icon: 'storage', title: 'SSD Storage', description: '128GB SSD for fast boot and responsive switching' },
      { icon: 'print', title: 'Built-in Printer', description: 'Integrated 80mm thermal printer reduces clutter' },
      { icon: 'credit_card', title: 'Smart Card + NFC', description: 'Accepts EMV, contactless, and mobile wallet payments' },
      { icon: 'dock', title: 'VESA Mount', description: 'Flexible mounting: counter-top, pole, or wall' },
    ]),
    operatingSystems: JSON.stringify([
      { icon: 'desktop_windows', label: 'Windows 10 IoT Enterprise' },
      { icon: 'linux', label: 'Ubuntu 22.04 LTS' },
    ]),
    videos: JSON.stringify([
      { title: 'V3 POS — Full Installation Guide', url: 'https://youtube.com/watch?v=v3pos-install', type: 'youtube' },
      { title: 'V3 POS — First Boot & Configuration', url: 'https://youtube.com/watch?v=v3pos-config', type: 'youtube' },
    ]),
    driverDownloadUrl: '/downloads/drivers/v3-pos-driver',
    manualUrl: '/downloads/manuals/v3-pos-manual',
    installationGuideUrl: '/installations/v3-pos-setup',
    knowledgeBaseUrl: '/knowledge-base/v3-pos',
    brochureUrl: '/downloads/brochures/v3-pos-brochure',
    warrantyUrl: '/downloads/warranty/v3-pos-warranty',
    sdkUrl: '/downloads/sdk/qbit-sdk-pos',
    utilityUrl: '/downloads/utilities/qbit-config-tool',
    status: 'active',
    isActive: true,
    isDraft: false,
    isPublished: true,
    viewCount: 3400,
    downloadCount: 2100,
    latestDriverVersion: 'v1.5.2',
    latestFirmwareVersion: 'v2.1.0',
    supportsWifi: true,
    autoDriverInstall: true,
    sdkAvailable: true,
    firmwareConfigSupported: true,
    connectionTypes: 'usb,lan,wifi',
    tags: 'POS machine, all-in-one, touchscreen, Windows POS, retail terminal',
    compatibleDevices: 'P80 Alpha Printer, S20 Pro Scanner, CD-101 Cash Drawer, CD-9 Display',
    aiDiagnosticsSupported: true,
    drQbitSupported: true,
    difficultyLevel: 'Intermediate',
    installationTime: '45 minutes',
    highlights: JSON.stringify(['15.6" Touch Display', 'Built-in Printer', 'Quad-Core', 'Smart Card + NFC']),
    subCategory: 'all-in-one',
    productSeries: 'V-Series',
    productType: 'Terminal',
  },
  {
    name: 'P40 Portable Thermal Printer',
    brand: 'QBITHub',
    manufacturer: 'QBITHub Technologies',
    model: 'P40',
    slug: 'qbithub-portable-thermal-printer-p40',
    deviceType: 'portable_printer',
    sku: 'QBP-40-001',
    serialPattern: '^P40-[0-9]{6}$',
    description: 'Compact, battery-powered 58mm thermal printer for mobile field operations and on-the-go receipt printing.',
    longDescription: `# P40 Portable Thermal Printer

The P40 is a compact, battery-powered 58mm thermal printer designed for mobile field operations, delivery services, and on-the-go receipt printing. With Bluetooth and USB connectivity, the P40 pairs seamlessly with smartphones, tablets, and mobile POS systems.

## Key Advantages

- **58mm compact printing** — Perfect for mobile receipts, delivery confirmations, and field service documentation
- **Bluetooth 4.0 + USB-C** — Wireless pairing with Android/iOS devices, wired connection to desktop systems
- **Built-in 2000mAh battery** — 24-48 hours standby, prints 100+ receipts on a single charge
- **Cross-platform compatible** — Works with Android, iOS, Windows, and Linux out of the box
- **IP54 splash-proof** — Handles light rain and dust during outdoor field operations
- **Ultra-light 350g** — Carry all day without fatigue — fits in any bag or vehicle mount

## Ideal Use Cases

The P40 excels in food delivery order confirmation printing, field service invoice generation, mobile retail popup shop receipts, parking meter receipt printing, courier parcel label printing, and event ticket printing at entry gates.`,
    imageUrl: '/uploads/products/p40-portable.png',
    category: 'portable-printer',
    isFeatured: false,
    isTrending: true,
    badgeLabel: 'Trending',
    startingPrice: '₹5,500',
    specifications: JSON.stringify([
      { property: 'Print Width', value: '58mm' },
      { property: 'Print Speed', value: '70mm/sec' },
      { property: 'Resolution', value: '203 DPI' },
      { property: 'Connectivity', value: 'Bluetooth 4.0 + USB-C' },
      { property: 'Battery', value: '2000mAh (100+ receipts)' },
      { property: 'Standby', value: '24-48 hours' },
      { property: 'IP Rating', value: 'IP54' },
      { property: 'Dimensions', value: '80 × 80 × 45mm' },
      { property: 'Weight', value: '350g' },
      { property: 'OS Support', value: 'Android, iOS, Windows, Linux' },
    ]),
    features: JSON.stringify([
      { icon: 'print', title: '58mm Compact', description: 'Perfect for mobile receipts and delivery confirmations' },
      { icon: 'bluetooth', title: 'Bluetooth + USB-C', description: 'Wireless pairing with any smartphone or tablet' },
      { icon: 'battery_charging_full', title: 'Long Battery Life', description: '100+ receipts on a single charge, 48hr standby' },
      { icon: 'phone_android', title: 'Cross-Platform', description: 'Android, iOS, Windows, and Linux compatible' },
      { icon: 'water_drop', title: 'IP54 Splash-Proof', description: 'Handles light rain and outdoor conditions' },
      { icon: 'fitness_center', title: 'Ultra-Light', description: 'Just 350g — carry all day without fatigue' },
    ]),
    operatingSystems: JSON.stringify([
      { icon: 'phone_android', label: 'Android 6+' },
      { icon: 'apple', label: 'iOS 12+' },
      { icon: 'desktop_windows', label: 'Windows 10/11' },
    ]),
    videos: JSON.stringify([
      { title: 'P40 — Bluetooth Pairing Guide', url: 'https://youtube.com/watch?v=p40-bt-pair', type: 'youtube' },
    ]),
    driverDownloadUrl: '/downloads/drivers/p40-driver',
    manualUrl: '/downloads/manuals/p40-manual',
    installationGuideUrl: '/installations/p40-setup',
    knowledgeBaseUrl: '/knowledge-base/p40',
    warrantyUrl: '/downloads/warranty/p40-warranty',
    utilityUrl: '/downloads/utilities/qbit-mobile-config',
    status: 'active',
    isActive: true,
    isDraft: false,
    isPublished: true,
    viewCount: 780,
    downloadCount: 560,
    latestDriverVersion: 'v1.0.5',
    latestFirmwareVersion: 'v1.2.0',
    supportsWifi: true,
    autoDriverInstall: true,
    sdkAvailable: true,
    firmwareConfigSupported: true,
    connectionTypes: 'usb,bluetooth,wifi',
    tags: 'portable printer, mobile printer, bluetooth printer, 58mm, delivery, field service',
    compatibleDevices: 'AP5 Android POS',
    aiDiagnosticsSupported: true,
    drQbitSupported: true,
    difficultyLevel: 'Beginner',
    installationTime: '10 minutes',
    highlights: JSON.stringify(['Bluetooth + USB-C', 'Battery-Powered', 'IP54', 'Cross-Platform']),
    subCategory: 'mobile-printer',
    productSeries: 'P-Series',
    productType: 'Peripheral',
  },
  {
    name: 'CD-101 Heavy-Duty Cash Drawer',
    brand: 'QBITHub',
    manufacturer: 'QBITHub Technologies',
    model: 'CD101',
    slug: 'qbithub-cash-drawer-cd-101',
    deviceType: 'cash_drawer',
    sku: 'QBC-101-001',
    serialPattern: '^CD101-[0-9]{6}$',
    description: 'Professional-grade cash drawer with steel construction, 5 bill/8 coin removable tray, and RJ11 + USB interface.',
    longDescription: `# CD-101 Heavy-Duty Cash Drawer

The CD-101 is a professional-grade cash drawer engineered for high-traffic retail environments. Featuring a rugged steel construction, 5 bill/8 coin removable tray, and multi-interface support (RJ11 + USB), the CD-101 integrates seamlessly with any POS system.

## Key Advantages

- **Heavy-duty steel construction** — withstands years of daily use in busy checkout environments
- **5 bill/8 coin removable tray** — organized cash storage with easy removal for end-of-day counting
- **RJ11 + USB dual interface** — Connects via receipt printer trigger (RJ11) or direct USB to POS terminal
- **3-position key lock** — Manual, locked, and auto-open positions for flexible security management
- **Microswitch drawer-open detection** — POS software knows when the drawer is open for transaction auditing
- **Under-counter mountable** — Concealed installation option for clean counter aesthetics

## Ideal Use Cases

The CD-101 excels in busy retail checkout lanes, restaurant payment stations, hotel front desk cash management, convenience store register operations, and any environment where fast cash handling and transaction security are required.`,
    imageUrl: '/uploads/products/cd-101.png',
    category: 'cash-drawer',
    isFeatured: false,
    isTrending: false,
    startingPrice: '₹4,500',
    specifications: JSON.stringify([
      { property: 'Construction', value: 'Heavy-duty steel' },
      { property: 'Tray Slots', value: '5 bill / 8 coin' },
      { property: 'Interface', value: 'RJ11 + USB' },
      { property: 'Lock', value: '3-position key' },
      { property: 'Detection', value: 'Microswitch (drawer-open)' },
      { property: 'Dimensions', value: '410 × 420 × 100mm' },
      { property: 'Weight', value: '4.8kg' },
      { property: 'Mounting', value: 'Under-counter or stand-alone' },
    ]),
    features: JSON.stringify([
      { icon: 'shield', title: 'Steel Construction', description: 'Heavy-duty steel withstands years of daily use' },
      { icon: 'point_of_sale', title: '5B/8C Tray', description: 'Organized 5 bill/8 coin removable tray' },
      { icon: 'cable', title: 'Dual Interface', description: 'RJ11 printer trigger + direct USB connection' },
      { icon: 'lock', title: '3-Position Lock', description: 'Manual, locked, and auto-open for security' },
      { icon: 'sensor', title: 'Open Detection', description: 'Microswitch detects drawer state for auditing' },
      { icon: 'dock', title: 'Under-Counter Mount', description: 'Concealed installation for clean counter look' },
    ]),
    operatingSystems: JSON.stringify([
      { icon: 'desktop_windows', label: 'Windows 10/11' },
      { icon: 'linux', label: 'Linux' },
    ]),
    driverDownloadUrl: '/downloads/drivers/cd-101-driver',
    manualUrl: '/downloads/manuals/cd-101-manual',
    installationGuideUrl: '/installations/cd-101-setup',
    knowledgeBaseUrl: '/knowledge-base/cd-101',
    warrantyUrl: '/downloads/warranty/cd-101-warranty',
    status: 'active',
    isActive: true,
    isDraft: false,
    isPublished: true,
    viewCount: 450,
    downloadCount: 280,
    latestDriverVersion: 'N/A',
    latestFirmwareVersion: 'N/A',
    supportsWifi: false,
    autoDriverInstall: false,
    sdkAvailable: false,
    firmwareConfigSupported: false,
    connectionTypes: 'usb',
    tags: 'cash drawer, POS drawer, RJ11, steel, retail',
    compatibleDevices: 'V3 POS Machine, P80 Alpha Printer',
    aiDiagnosticsSupported: false,
    drQbitSupported: true,
    difficultyLevel: 'Beginner',
    installationTime: '10 minutes',
    highlights: JSON.stringify(['Steel Construction', 'Dual Interface', '3-Position Lock']),
    subCategory: 'standard-drawer',
    productSeries: 'CD-Series',
    productType: 'Peripheral',
  },
  {
    name: 'CD-9 Customer Display',
    brand: 'QBITHub',
    manufacturer: 'QBITHub Technologies',
    model: 'CD9',
    slug: 'qbithub-customer-display-cd-9',
    deviceType: 'customer_display',
    sku: 'QBD-9-001',
    serialPattern: '^CD9-[0-9]{6}$',
    description: '9-inch VFD/LCD customer display for crystal-clear transaction visibility in retail and hospitality.',
    longDescription: `# CD-9 Customer Display

The CD-9 is a 9-inch VFD/LCD customer display engineered for crystal-clear transaction visibility in retail and hospitality environments. With its adjustable tilt angle, wide viewing angle, and USB/RS232 connectivity, the CD-9 ensures customers always see accurate transaction information.

## Key Advantages

- **9-inch VFD/LCD display** — Large, bright display readable from any angle in bright or dim lighting
- **Adjustable tilt angle** — Position the display for optimal customer viewing regardless of counter height
- **USB + RS232 interface** — Flexible connectivity for direct POS terminal connection or serial cable integration
- **Auto-brightness adjustment** — Automatically adapts display brightness to ambient lighting conditions
- **Pole mountable** — Professional installation on counter poles for maximum customer visibility
- **VESA 75 compatible** — Standard mounting bracket for wall or bracket installations

## Ideal Use Cases

The CD-9 excels in retail checkout customer price verification, restaurant order confirmation display, hotel transaction review, pharmacy prescription pricing display, and any POS environment where customer-facing transaction visibility improves trust and accuracy.`,
    imageUrl: '/uploads/products/cd-9-display.png',
    category: 'customer-side-display',
    isFeatured: false,
    isTrending: false,
    startingPrice: '₹6,000',
    specifications: JSON.stringify([
      { property: 'Display', value: '9" VFD/LCD' },
      { property: 'Resolution', value: '240 × 64' },
      { property: 'Interface', value: 'USB + RS232' },
      { property: 'Brightness', value: 'Auto-adjust' },
      { property: 'Mounting', value: 'Pole + VESA 75' },
      { property: 'Dimensions', value: '200 × 100 × 170mm' },
      { property: 'Weight', value: '1.2kg' },
    ]),
    features: JSON.stringify([
      { icon: 'monitor', title: '9" Display', description: 'Large, bright VFD/LCD readable from any angle' },
      { icon: 'tilt', title: 'Adjustable Tilt', description: 'Position for optimal customer viewing' },
      { icon: 'cable', title: 'Dual Interface', description: 'USB + RS232 for any POS connection' },
      { icon: 'light_mode', title: 'Auto-Brightness', description: 'Adapts to ambient lighting automatically' },
      { icon: 'dock', title: 'Pole Mountable', description: 'Professional counter-pole installation' },
      { icon: 'wall', title: 'VESA 75', description: 'Standard wall/bracket mounting option' },
    ]),
    operatingSystems: JSON.stringify([
      { icon: 'desktop_windows', label: 'Windows 10/11' },
      { icon: 'linux', label: 'Linux' },
    ]),
    driverDownloadUrl: '/downloads/drivers/cd-9-driver',
    manualUrl: '/downloads/manuals/cd-9-manual',
    installationGuideUrl: '/installations/cd-9-setup',
    knowledgeBaseUrl: '/knowledge-base/cd-9',
    warrantyUrl: '/downloads/warranty/cd-9-warranty',
    status: 'active',
    isActive: true,
    isDraft: false,
    isPublished: true,
    viewCount: 320,
    downloadCount: 180,
    latestDriverVersion: 'N/A',
    latestFirmwareVersion: 'N/A',
    supportsWifi: false,
    autoDriverInstall: false,
    sdkAvailable: false,
    firmwareConfigSupported: false,
    connectionTypes: 'usb',
    tags: 'customer display, VFD, LCD, POS display, pole mount',
    compatibleDevices: 'V3 POS Machine',
    aiDiagnosticsSupported: false,
    drQbitSupported: true,
    difficultyLevel: 'Beginner',
    installationTime: '10 minutes',
    highlights: JSON.stringify(['9" Display', 'Auto-Brightness', 'Pole + VESA']),
    subCategory: 'pole-display',
    productSeries: 'CD-Series',
    productType: 'Peripheral',
  },
  {
    name: 'AP5 Android POS Terminal',
    brand: 'QBITHub',
    manufacturer: 'QBITHub Technologies',
    model: 'AP5',
    slug: 'qbithub-android-pos-ap5',
    deviceType: 'android_pos',
    sku: 'QBA-AP5-001',
    serialPattern: '^AP5-[0-9]{6}$',
    description: 'Premium Android POS terminal with 5.5" HD touchscreen, octa-core ARM, NFC, fingerprint, and built-in printer.',
    longDescription: `# AP5 Android POS Terminal

The AP5 is a premium Android POS terminal featuring a 5.5-inch HD touchscreen, octa-core ARM processor, and a comprehensive peripheral suite including a built-in thermal printer, NFC, camera, and fingerprint scanner. Optimized for mobile retail, food delivery, and field service operations.

## Key Advantages

- **5.5-inch HD IPS touchscreen** — Clear, responsive display for smooth POS operations in any lighting
- **Octa-core ARM Cortex-A53** — Powerful mobile processor handles demanding POS apps and payment processing
- **3GB RAM, 32GB ROM** — Sufficient memory and storage for multiple POS apps and transaction databases
- **Built-in 58mm thermal printer** — Integrated receipt printing eliminates external printer dependency
- **NFC + fingerprint + 5MP camera** — Complete security and identification suite for payment and verification
- **4G LTE + Wi-Fi + Bluetooth** — Always connected — process transactions anywhere with cellular or Wi-Fi

## Ideal Use Cases

The AP5 excels in food delivery order management and payment, mobile retail popup shop operations, field service invoicing and payment collection, restaurant table-side ordering and payment, parking management fee collection, and event ticket sales and verification.`,
    imageUrl: '/uploads/products/ap5-android.png',
    category: 'android-pos',
    isFeatured: true,
    isTrending: true,
    badgeLabel: 'Newly Released',
    startingPrice: '₹18,000',
    specifications: JSON.stringify([
      { property: 'Display', value: '5.5" HD IPS' },
      { property: 'CPU', value: 'Octa-core ARM Cortex-A53' },
      { property: 'RAM', value: '3GB' },
      { property: 'Storage', value: '32GB ROM' },
      { property: 'Built-in Printer', value: '58mm Thermal' },
      { property: 'Security', value: 'NFC + Fingerprint + 5MP Camera' },
      { property: 'Connectivity', value: '4G LTE + Wi-Fi + Bluetooth' },
      { property: 'Battery', value: '4000mAh' },
      { property: 'OS', value: 'Android 11 (QBIT-optimized)' },
      { property: 'Dimensions', value: '155 × 80 × 25mm' },
    ]),
    features: JSON.stringify([
      { icon: 'phone_android', title: '5.5" HD Display', description: 'Clear IPS touchscreen for smooth POS operations' },
      { icon: 'memory', title: 'Octa-Core ARM', description: 'Powerful processor for demanding POS apps' },
      { icon: 'print', title: 'Built-in Printer', description: 'Integrated 58mm thermal printer' },
      { icon: 'fingerprint', title: 'NFC + Fingerprint', description: 'Complete payment and identification security' },
      { icon: 'wifi', title: '4G + Wi-Fi + BT', description: 'Always connected via cellular or Wi-Fi' },
      { icon: 'battery_charging_full', title: '4000mAh Battery', description: 'Full-day operation on a single charge' },
    ]),
    operatingSystems: JSON.stringify([
      { icon: 'phone_android', label: 'Android 11 (QBIT-optimized)' },
    ]),
    videos: JSON.stringify([
      { title: 'AP5 — Android POS Setup Guide', url: 'https://youtube.com/watch?v=ap5-setup', type: 'youtube' },
      { title: 'AP5 — NFC Payment Configuration', url: 'https://youtube.com/watch?v=ap5-nfc', type: 'youtube' },
    ]),
    driverDownloadUrl: '/downloads/drivers/ap5-driver',
    manualUrl: '/downloads/manuals/ap5-manual',
    installationGuideUrl: '/installations/ap5-setup',
    knowledgeBaseUrl: '/knowledge-base/ap5',
    warrantyUrl: '/downloads/warranty/ap5-warranty',
    sdkUrl: '/downloads/sdk/qbit-sdk-android',
    utilityUrl: '/downloads/utilities/qbit-android-config',
    status: 'active',
    isActive: true,
    isDraft: false,
    isPublished: true,
    viewCount: 1800,
    downloadCount: 1200,
    latestDriverVersion: 'v1.0.0',
    latestFirmwareVersion: 'v1.3.0',
    supportsWifi: true,
    autoDriverInstall: true,
    sdkAvailable: true,
    firmwareConfigSupported: true,
    connectionTypes: 'usb,wifi,bluetooth,4g',
    tags: 'Android POS, mobile POS, NFC, fingerprint, 4G POS, delivery POS',
    compatibleDevices: 'P40 Portable Printer, S20 Pro Scanner',
    aiDiagnosticsSupported: true,
    drQbitSupported: true,
    difficultyLevel: 'Intermediate',
    installationTime: '30 minutes',
    highlights: JSON.stringify(['5.5" HD IPS', 'Octa-Core', 'Built-in Printer', 'NFC + Fingerprint']),
    subCategory: 'handheld-pos',
    productSeries: 'AP-Series',
    productType: 'Terminal',
  },
  {
    name: 'L60 Label Printer',
    brand: 'QBITHub',
    manufacturer: 'QBITHub Technologies',
    model: 'L60',
    slug: 'qbithub-label-printer-l60',
    deviceType: 'label_printer',
    sku: 'QBL-60-001',
    serialPattern: '^L60-[0-9]{6}$',
    description: 'Professional direct-thermal label printer for shipping labels, barcode labels, and product tagging.',
    longDescription: `# L60 Label Printer

The L60 is a professional direct-thermal label printer designed for shipping labels, barcode labels, and product tagging. With 203 DPI resolution, 150mm/sec print speed, and a wide 4-inch print width, the L60 handles high-volume label printing with ease.

## Key Advantages

- **4-inch (108mm) print width** — Supports standard shipping label sizes (4×6", 4×8") without trimming
- **203 DPI resolution** — Barcodes and text are crisp and scannable on any label material
- **150mm/sec print speed** — High-volume label production for busy shipping departments
- **USB + LAN + Wi-Fi connectivity** — Network or direct connection for single or multi-user environments
- **Auto-calibration for label sizes** — Automatically detects label dimensions — no manual adjustment needed
- **Tear-off and cutter options** — Choose instant tear-off or automatic cutter based on workflow preference

## Ideal Use Cases

The L60 excels in e-commerce shipping label printing, warehouse barcode labeling, retail product price tag printing, pharmaceutical label compliance printing, and logistics parcel identification. Its wide format support and high speed make it the backbone of any label-heavy operation.`,
    imageUrl: '/uploads/products/l60-label.png',
    category: 'barcode-printer',
    isFeatured: false,
    isTrending: false,
    startingPrice: '₹14,000',
    specifications: JSON.stringify([
      { property: 'Print Width', value: '108mm (4-inch)' },
      { property: 'Print Speed', value: '150mm/sec' },
      { property: 'Resolution', value: '203 DPI' },
      { property: 'Interface', value: 'USB + LAN + Wi-Fi' },
      { property: 'Label Detection', value: 'Auto-calibration' },
      { property: 'Cutting', value: 'Tear-off + Cutter' },
      { property: 'Dimensions', value: '215 × 215 × 180mm' },
      { property: 'Weight', value: '2.1kg' },
      { property: 'Label Types', value: 'Shipping, Barcode, Price, Product' },
    ]),
    features: JSON.stringify([
      { icon: 'label', title: '4-inch Width', description: 'Standard shipping label sizes without trimming' },
      { icon: 'speed', title: '150mm/sec Speed', description: 'High-volume label production' },
      { icon: 'print', title: '203 DPI Sharp', description: 'Crisp, scannable barcodes and text' },
      { icon: 'cable', title: 'Triple Interface', description: 'USB, LAN, and Wi-Fi connectivity' },
      { icon: 'tune', title: 'Auto-Calibration', description: 'Detects label sizes automatically' },
      { icon: 'content_cut', title: 'Tear-off + Cutter', description: 'Choose instant tear-off or auto-cutter' },
    ]),
    operatingSystems: JSON.stringify([
      { icon: 'desktop_windows', label: 'Windows 10/11' },
      { icon: 'linux', label: 'Linux' },
      { icon: 'phone_android', label: 'Android (via Wi-Fi)' },
    ]),
    videos: JSON.stringify([
      { title: 'L60 — Label Printer Setup', url: 'https://youtube.com/watch?v=l60-setup', type: 'youtube' },
    ]),
    driverDownloadUrl: '/downloads/drivers/l60-driver',
    manualUrl: '/downloads/manuals/l60-manual',
    installationGuideUrl: '/installations/l60-setup',
    knowledgeBaseUrl: '/knowledge-base/l60',
    warrantyUrl: '/downloads/warranty/l60-warranty',
    sdkUrl: '/downloads/sdk/qbit-sdk-label',
    utilityUrl: '/downloads/utilities/qbit-label-designer',
    status: 'active',
    isActive: true,
    isDraft: false,
    isPublished: true,
    viewCount: 560,
    downloadCount: 380,
    latestDriverVersion: 'v2.0.1',
    latestFirmwareVersion: 'N/A',
    supportsWifi: true,
    autoDriverInstall: true,
    sdkAvailable: true,
    firmwareConfigSupported: false,
    connectionTypes: 'usb,lan,wifi',
    tags: 'label printer, shipping label, barcode label, 4-inch, thermal label',
    compatibleDevices: 'V3 POS Machine, S20 Pro Scanner',
    aiDiagnosticsSupported: true,
    drQbitSupported: true,
    difficultyLevel: 'Beginner',
    installationTime: '20 minutes',
    highlights: JSON.stringify(['4-inch Width', 'Auto-Calibration', 'Triple Interface']),
    subCategory: 'shipping-label',
    productSeries: 'L-Series',
    productType: 'Peripheral',
  },
];

// ============================================================
// KNOWLEDGE CATEGORIES
// ============================================================

const KNOWLEDGE_CATEGORIES = [
  { name: 'Products', slug: 'products', icon: 'devices', description: 'Product setup, configuration, and usage', color: 'from-qbit-primary to-qbit-secondary', sortIndex: 0 },
  { name: 'Drivers', slug: 'drivers', icon: 'memory', description: 'Driver installation, troubleshooting, and updates', color: 'from-blue-500 to-blue-700', sortIndex: 1 },
  { name: 'Installation', slug: 'installation', icon: 'build', description: 'Hardware installation and setup guides', color: 'from-green-500 to-green-700', sortIndex: 2 },
  { name: 'Firmware', slug: 'firmware', icon: 'upgrade', description: 'Firmware updates, version history, and compatibility', color: 'from-purple-500 to-purple-700', sortIndex: 3 },
  { name: 'Networking', slug: 'networking', icon: 'wifi', description: 'LAN, Wi-Fi, and Bluetooth setup and troubleshooting', color: 'from-orange-500 to-orange-700', sortIndex: 4 },
  { name: 'Troubleshooting', slug: 'troubleshooting', icon: 'help', description: 'Common issues, error codes, and solutions', color: 'from-red-500 to-red-700', sortIndex: 5 },
  { name: 'Enterprise', slug: 'enterprise', icon: 'business', description: 'Enterprise deployment, fleet management, and best practices', color: 'from-qbit-primary to-qbit-tertiary', sortIndex: 6 },
];

// ============================================================
// DOWNLOAD CATEGORIES
// ============================================================

const DOWNLOAD_CATEGORIES = [
  { name: 'Driver', slug: 'driver', icon: 'memory', sortIndex: 0 },
  { name: 'Firmware', slug: 'firmware', icon: 'upgrade', sortIndex: 1 },
  { name: 'Manual', slug: 'manual', icon: 'menu_book', sortIndex: 2 },
  { name: 'SDK', slug: 'sdk', icon: 'code', sortIndex: 3 },
  { name: 'Utility', slug: 'utility', icon: 'build', sortIndex: 4 },
  { name: 'Brochure', slug: 'brochure', icon: 'picture_as_pdf', sortIndex: 5 },
];

// ============================================================
// RESOURCES — Downloadable files linked to products
// ============================================================

const RESOURCES = [
  // Drivers
  { name: 'P80 Alpha Universal Driver', type: 'windows_driver', version: 'v2.3.1', description: 'Universal Windows driver for the P80 Alpha thermal printer. Supports USB, Serial, and LAN interfaces.', extension: 'exe', mimeType: 'application/x-msdownload', fileSize: 12400000, storageKey: 'public/uploads/driver/qbit-connect-driver-2.1.0.exe', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'thermal-printer,portable-printer' },
  { name: 'S20 Pro Scanner Driver', type: 'windows_driver', version: 'v1.2.0', description: 'Windows HID and COM port driver for the S20 Pro 2D barcode scanner.', extension: 'exe', mimeType: 'application/x-msdownload', fileSize: 8500000, storageKey: 'public/uploads/driver/qbit-shield-driver-1.5.0.exe', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'barcode-scanner' },
  { name: 'V3 POS Machine Driver Pack', type: 'windows_driver', version: 'v1.5.2', description: 'Complete driver pack for the V3 POS machine including touchscreen, printer, NFC, and card reader drivers.', extension: 'exe', mimeType: 'application/x-msdownload', fileSize: 48000000, storageKey: 'public/uploads/driver/qbit-one-pro-driver-3.2.1.exe', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'window-pos,pos-machine' },
  { name: 'P40 Portable Printer Driver', type: 'windows_driver', version: 'v1.0.5', description: 'Windows and Android driver for the P40 portable thermal printer. Bluetooth and USB-C support.', extension: 'exe', mimeType: 'application/x-msdownload', fileSize: 6200000, storageKey: 'public/uploads/driver/qbit-connect-driver-2.1.0.exe', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'portable-printer' },
  { name: 'AP5 Android POS Driver SDK', type: 'android_software', version: 'v1.0.0', description: 'Android POS driver and SDK for the AP5 terminal. Includes NFC, fingerprint, and printer integration APIs.', extension: 'apk', mimeType: 'application/vnd.android.package-archive', fileSize: 15600000, storageKey: 'public/uploads/software/qbit-hub-mobile-1.2.apk', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'android-pos' },
  { name: 'L60 Label Printer Driver', type: 'windows_driver', version: 'v2.0.1', description: 'Windows and Linux driver for the L60 label printer. Supports USB, LAN, and Wi-Fi connections.', extension: 'exe', mimeType: 'application/x-msdownload', fileSize: 9800000, storageKey: 'public/uploads/driver/qbit-one-pro-driver-3.2.1.exe', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'barcode-printer,label-printer' },

  // Firmware
  { name: 'P80 Alpha Firmware v3.1.0', type: 'firmware', version: 'v3.1.0', description: 'Latest firmware update for the P80 Alpha thermal printer. Improved auto-cutter timing and LAN stability.', extension: 'bin', mimeType: 'application/octet-stream', fileSize: 2400000, storageKey: 'public/uploads/firmware/qbit-one-pro-firmware-5.1.0.bin', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'thermal-printer' },
  { name: 'S20 Pro Firmware v2.0.1', type: 'firmware', version: 'v2.0.1', description: 'Firmware update for the S20 Pro scanner. Adds PDF417 and Aztec code support, improves scan rate.', extension: 'bin', mimeType: 'application/octet-stream', fileSize: 1800000, storageKey: 'public/uploads/firmware/qbit-shield-firmware-4.2.1.bin', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'barcode-scanner' },
  { name: 'V3 POS Firmware v2.1.0', type: 'firmware', version: 'v2.1.0', description: 'System firmware for the V3 POS machine. NFC reader calibration and touchscreen response optimization.', extension: 'bin', mimeType: 'application/octet-stream', fileSize: 5200000, storageKey: 'public/uploads/firmware/qbit-connect-firmware-3.0.2.bin', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'window-pos,pos-machine' },
  { name: 'AP5 Android POS Firmware v1.3.0', type: 'firmware', version: 'v1.3.0', description: 'Android POS firmware update. Printer calibration and battery management improvements.', extension: 'bin', mimeType: 'application/octet-stream', fileSize: 3800000, storageKey: 'public/uploads/firmware/qbit-connect-firmware-3.0.2.bin', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'android-pos' },

  // Manuals
  { name: 'P80 Alpha User Manual', type: 'manual', version: 'v2.0', description: 'Comprehensive user manual for the P80 Alpha thermal printer. Installation, operation, maintenance, and troubleshooting.', extension: 'pdf', mimeType: 'application/pdf', fileSize: 4500000, storageKey: 'public/uploads/manual/qbit-one-pro-manual-en.pdf', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'thermal-printer' },
  { name: 'S20 Pro User Guide', type: 'manual', version: 'v1.5', description: 'User guide for the S20 Pro barcode scanner. Setup, scanning modes, and maintenance procedures.', extension: 'pdf', mimeType: 'application/pdf', fileSize: 3200000, storageKey: 'public/uploads/manual/qbit-shield-user-guide.pdf', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'barcode-scanner' },
  { name: 'V3 POS Administrator Manual', type: 'manual', version: 'v3.0', description: 'Administrator manual for the V3 POS machine. OS installation, peripheral configuration, and network setup.', extension: 'pdf', mimeType: 'application/pdf', fileSize: 8700000, storageKey: 'public/uploads/manual/qbit-connect-manual-en.pdf', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'window-pos,pos-machine' },
  { name: 'AP5 Android POS Quick Start Guide', type: 'manual', version: 'v1.0', description: 'Quick start guide for the AP5 Android POS. Initial setup, app installation, and first transaction.', extension: 'pdf', mimeType: 'application/pdf', fileSize: 2800000, storageKey: 'public/uploads/manual/qbit-hub-api-docs.pdf', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'android-pos' },
  { name: 'L60 Label Printer Manual', type: 'manual', version: 'v1.2', description: 'Complete manual for the L60 label printer. Media loading, calibration, label design, and troubleshooting.', extension: 'pdf', mimeType: 'application/pdf', fileSize: 4100000, storageKey: 'public/uploads/manual/qbit-one-pro-manual-en.pdf', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'barcode-printer,label-printer' },

  // SDK
  { name: 'QBIT POS SDK', type: 'sdk', version: 'v1.0', description: 'Integration SDK for POS peripherals. Includes printer, scanner, cash drawer, and display APIs.', extension: 'zip', mimeType: 'application/zip', fileSize: 35000000, storageKey: 'public/uploads/sdk/qbit-hub-sdk-1.0.zip', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'thermal-printer,barcode-scanner,cash-drawer,customer-side-display' },
  { name: 'QBIT Label SDK', type: 'sdk', version: 'v1.0', description: 'Label design and printing SDK. Template engine, barcode generation, and print command API.', extension: 'zip', mimeType: 'application/zip', fileSize: 18000000, storageKey: 'public/uploads/sdk/qbit-hub-sdk-1.0.zip', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'barcode-printer,label-printer' },

  // Utilities
  { name: 'QBIT Configuration Utility', type: 'pos_utility', version: 'v2.0', description: 'Diagnostic and configuration utility for all QBIT POS peripherals. Port testing, firmware check, and device info.', extension: 'zip', mimeType: 'application/zip', fileSize: 22000000, storageKey: 'public/uploads/utility/qbit-diagnostic-utility-2.0.zip', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'thermal-printer,barcode-scanner,cash-drawer,customer-side-display,pos-machine' },
  { name: 'QBIT Setup Wizard', type: 'pos_utility', version: 'v1.5', description: 'Automated setup wizard for new QBIT devices. Detects hardware, installs drivers, and configures peripherals.', extension: 'msi', mimeType: 'application/x-msi', fileSize: 15000000, storageKey: 'public/uploads/utility/qbit-connect-setup-wizard-1.5.msi', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'thermal-printer,barcode-scanner,pos-machine,window-pos' },
  { name: 'QBIT Shield Config Tool', type: 'maintenance_tool', version: 'v1.0', description: 'Network configuration tool for QBIT devices with LAN/Wi-Fi capability. IP setup, port mapping, and connection testing.', extension: 'zip', mimeType: 'application/zip', fileSize: 8800000, storageKey: 'public/uploads/utility/qbit-shield-config-tool-1.0.zip', storageProvider: 'local', urlType: 'uploaded', visibility: 'public', status: 'active', supportedCategories: 'thermal-printer,pos-machine,barcode-printer' },
];

async function main() {
  console.log('=== QBIT Hub Production Seed ===\n');

  // 1. Seed Download Categories
  console.log('1. Seeding download categories...');
  for (const cat of DOWNLOAD_CATEGORIES) {
    await db.downloadCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`   ✓ ${DOWNLOAD_CATEGORIES.length} download categories seeded`);

  // 2. Seed Knowledge Categories
  console.log('2. Seeding knowledge categories...');
  const kCatIds: Record<string, string> = {};
  for (const cat of KNOWLEDGE_CATEGORIES) {
    const record = await db.knowledgeCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    kCatIds[cat.slug] = record.id;
  }
  console.log(`   ✓ ${KNOWLEDGE_CATEGORIES.length} knowledge categories seeded`);

  // 3. Seed Operating Systems
  console.log('3. Seeding operating systems...');
  const osData = [
    { name: 'Windows 10', slug: 'win10', icon: 'desktop_windows', sortIndex: 0 },
    { name: 'Windows 11', slug: 'win11', icon: 'desktop_windows', sortIndex: 1 },
    { name: 'Ubuntu 22.04 LTS', slug: 'ubuntu-2204', icon: 'linux', sortIndex: 2 },
    { name: 'Android 11', slug: 'android-11', icon: 'phone_android', sortIndex: 3 },
    { name: 'Android 13', slug: 'android-13', icon: 'phone_android', sortIndex: 4 },
  ];
  for (const os of osData) {
    await db.operatingSystem.upsert({ where: { slug: os.slug }, update: os, create: os });
  }
  console.log(`   ✓ ${osData.length} operating systems seeded`);

  // 4. Seed Products
  console.log('4. Seeding products...');
  const productIds: Record<string, string> = {};
  for (const product of PRODUCTS) {
    const record = await db.qbitProduct.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
    productIds[product.slug] = record.id;
  }
  console.log(`   ✓ ${PRODUCTS.length} products seeded`);

  // 5. Seed Resources
  console.log('5. Seeding resources...');
  const resourceIds: Record<string, string> = {};
  for (const resource of RESOURCES) {
    const record = await db.resource.upsert({
      where: { id: resource.storageKey || resource.name },
      update: resource,
      create: { ...resource, id: undefined },
    });
    // Use the auto-generated ID
    resourceIds[resource.name] = record.id;
  }
  console.log(`   ✓ ${RESOURCES.length} resources seeded`);

  // 6. Link Resources to Products
  console.log('6. Linking resources to products...');
  const resourceProductLinks = [
    { resource: 'P80 Alpha Universal Driver', product: 'qbithub-thermal-printer-p80-alpha' },
    { resource: 'P80 Alpha Firmware v3.1.0', product: 'qbithub-thermal-printer-p80-alpha' },
    { resource: 'P80 Alpha User Manual', product: 'qbithub-thermal-printer-p80-alpha' },
    { resource: 'S20 Pro Scanner Driver', product: 'qbithub-2d-barcode-scanner-s20-pro' },
    { resource: 'S20 Pro Firmware v2.0.1', product: 'qbithub-2d-barcode-scanner-s20-pro' },
    { resource: 'S20 Pro User Guide', product: 'qbithub-2d-barcode-scanner-s20-pro' },
    { resource: 'V3 POS Machine Driver Pack', product: 'qbithub-pos-machine-v3' },
    { resource: 'V3 POS Firmware v2.1.0', product: 'qbithub-pos-machine-v3' },
    { resource: 'V3 POS Administrator Manual', product: 'qbithub-pos-machine-v3' },
    { resource: 'P40 Portable Printer Driver', product: 'qbithub-portable-thermal-printer-p40' },
    { resource: 'AP5 Android POS Driver SDK', product: 'qbithub-android-pos-ap5' },
    { resource: 'AP5 Android POS Firmware v1.3.0', product: 'qbithub-android-pos-ap5' },
    { resource: 'AP5 Android POS Quick Start Guide', product: 'qbithub-android-pos-ap5' },
    { resource: 'L60 Label Printer Driver', product: 'qbithub-label-printer-l60' },
    { resource: 'L60 Label Printer Manual', product: 'qbithub-label-printer-l60' },
    { resource: 'QBIT POS SDK', product: 'qbithub-pos-machine-v3' },
    { resource: 'QBIT Configuration Utility', product: 'qbithub-pos-machine-v3' },
    { resource: 'QBIT Setup Wizard', product: 'qbithub-pos-machine-v3' },
    { resource: 'QBIT Label SDK', product: 'qbithub-label-printer-l60' },
    { resource: 'QBIT Shield Config Tool', product: 'qbithub-pos-machine-v3' },
  ];
  let linkCount = 0;
  for (const link of resourceProductLinks) {
    const resourceId = resourceIds[link.resource];
    const productId = productIds[link.product];
    if (resourceId && productId) {
      try {
        await db.productResourceMapping.upsert({
          where: { id: `${productId}-${resourceId}` },
          update: { productId, resourceId },
          create: { id: `${productId}-${resourceId}`, productId, resourceId },
        });
        linkCount++;
      } catch (e) {
        // Skip duplicate or failed mappings
      }
    }
  }
  console.log(`   ✓ ${linkCount} resource-product mappings created`);

  // 7. Seed Knowledge Articles
  console.log('7. Seeding knowledge articles...');
  const articles = [
    {
      title: 'How to Install the P80 Alpha Thermal Printer on Windows',
      slug: 'p80-alpha-windows-installation',
      excerpt: 'Step-by-step guide for setting up the P80 Alpha thermal printer on Windows 10/11, including driver installation and USB/LAN configuration.',
      content: JSON.stringify({
        sections: [
          { title: 'Prerequisites', content: 'Before starting, ensure you have: the P80 Alpha thermal printer, a USB cable or LAN cable, the P80 Alpha driver installer (v2.3.1), and Windows 10 or 11 installed on your POS terminal.' },
          { title: 'Step 1: Physical Connection', content: 'Connect the P80 Alpha to your POS terminal using either USB or LAN cable. For USB: plug the USB-B cable into the printer and USB-A into the terminal. For LAN: connect the Ethernet cable to both the printer and your network switch. Power on the printer and verify the LED indicator shows a solid green light.' },
          { title: 'Step 2: Driver Installation', content: 'Download the P80 Alpha Universal Driver (v2.3.1) from the QBIT Hub Download Center. Run the installer and follow the on-screen instructions. The installer automatically detects the connection type and configures the appropriate port. If the installer does not detect the printer, manually select the connection type (USB, COM, or LAN) and specify the port settings.' },
          { title: 'Step 3: Print Test', content: 'After driver installation, open the QBIT Configuration Utility and click "Print Test Page." The printer should produce a test receipt showing the current configuration, connection status, and firmware version. If the test page prints successfully, your P80 Alpha is ready for production use.' },
          { title: 'Troubleshooting Common Issues', content: 'If the printer is not detected: verify the cable connection, check that the printer power LED is solid green, and ensure the correct driver version is installed. If print quality is poor: clean the print head using the included cleaning card, verify paper roll quality (use only QBIT-approved thermal paper), and check the print density setting in the driver configuration.' },
        ]
      }),
      categoryId: kCatIds['installation'],
      author: 'QBIT Technical Team',
      readingTime: 8,
      difficulty: 'Beginner',
      featured: true,
      popular: true,
      relatedProductIds: JSON.stringify([productIds['qbithub-thermal-printer-p80-alpha']]),
      publishedAt: new Date('2025-01-20'),
    },
    {
      title: 'P80 Alpha LAN Setup Guide',
      slug: 'p80-alpha-lan-setup',
      excerpt: 'Configure the P80 Alpha thermal printer for LAN network printing, including IP address setup and multi-terminal sharing.',
      content: JSON.stringify({
        sections: [
          { title: 'Overview', content: 'The P80 Alpha supports LAN connectivity for shared printing across multiple POS terminals. This guide covers IP address configuration, network printer sharing, and troubleshooting LAN connection issues.' },
          { title: 'Step 1: Network Configuration', content: 'Power on the P80 Alpha and hold the FEED button for 3 seconds to print the current network configuration. The self-test print shows the default IP address (typically 192.168.1.100). Use the QBIT Configuration Utility to set a static IP address that matches your network schema. Recommended settings: IP 192.168.1.XXX, Subnet 255.255.255.0, Gateway 192.168.1.1, Port 9100.' },
          { title: 'Step 2: Driver Port Setup', content: 'In the P80 Alpha driver configuration, select "LAN" as the connection type. Enter the printer IP address and port number (default: 9100). Click "Test Connection" to verify the printer responds on the network. If the connection test fails, check firewall settings and verify the printer IP is reachable from the terminal.' },
          { title: 'Step 3: Multi-Terminal Sharing', content: 'For environments with multiple POS terminals sharing one printer, install the P80 Alpha driver on each terminal with the same LAN IP and port settings. Each terminal can independently send print jobs. The printer processes jobs in queue order. No additional configuration is needed for shared LAN printing.' },
        ]
      }),
      categoryId: kCatIds['networking'],
      author: 'QBIT Technical Team',
      readingTime: 6,
      difficulty: 'Intermediate',
      featured: false,
      popular: true,
      relatedProductIds: JSON.stringify([productIds['qbithub-thermal-printer-p80-alpha']]),
      publishedAt: new Date('2025-01-22'),
    },
    {
      title: 'V3 POS Machine — First Boot and Windows Setup',
      slug: 'v3-pos-first-boot-setup',
      excerpt: 'Complete guide for the V3 POS machine first boot, Windows 10 IoT installation, and peripheral configuration.',
      content: JSON.stringify({
        sections: [
          { title: 'Overview', content: 'The V3 POS Machine ships with Windows 10 IoT Enterprise pre-installed. This guide covers first boot configuration, peripheral testing, and production setup. Estimated setup time: 45 minutes.' },
          { title: 'Step 1: First Boot', content: 'Connect the V3 to power, attach the VESA mount if needed, and power on. The system boots into Windows 10 IoT within 30 seconds. Follow the Windows initial setup wizard: select language, accept license terms, create an admin account (use "QBITAdmin" with a strong password), and select "Retail POS" as the device role.' },
          { title: 'Step 2: Built-in Printer Configuration', content: 'The V3 includes a built-in 80mm thermal printer. Open the QBIT Configuration Utility and select "Internal Printer" tab. The utility auto-detects the internal printer and installs the driver. Print a test receipt to verify proper operation. Load an 80mm thermal paper roll into the internal printer compartment.' },
          { title: 'Step 3: External Peripherals', content: 'Connect external peripherals: S20 Pro barcode scanner (USB HID), CD-101 cash drawer (RJ11 to printer, or USB direct), and CD-9 customer display (USB or RS232). Each peripheral is auto-detected by the QBIT Configuration Utility. Run the "Full System Test" to verify all connected devices respond correctly.' },
          { title: 'Step 4: Network Configuration', content: 'Configure the V3 network settings: connect to your business Wi-Fi or Ethernet LAN. Set a static IP for reliable POS operation. Configure the Windows firewall to allow POS application traffic. Test internet connectivity and verify the V3 can reach the QBIT Hub cloud services.' },
        ]
      }),
      categoryId: kCatIds['installation'],
      author: 'QBIT Technical Team',
      readingTime: 15,
      difficulty: 'Intermediate',
      featured: true,
      popular: true,
      relatedProductIds: JSON.stringify([productIds['qbithub-pos-machine-v3']]),
      publishedAt: new Date('2025-01-25'),
    },
    {
      title: 'AP5 Android POS — Bluetooth and Wi-Fi Setup',
      slug: 'ap5-android-pos-connectivity',
      excerpt: 'Configure the AP5 Android POS terminal for Bluetooth printer pairing, Wi-Fi network connection, and 4G LTE operation.',
      content: JSON.stringify({
        sections: [
          { title: 'Bluetooth Printer Pairing', content: 'To pair the AP5 with a P40 Portable Printer: open Settings > Bluetooth, enable Bluetooth, scan for devices, select "P40-XXXX" from the list, and confirm pairing. The QBIT POS app automatically detects paired printers and routes receipt printing to the Bluetooth device. If pairing fails, ensure the P40 is powered on and within 5 meters of the AP5.' },
          { title: 'Wi-Fi Network Setup', content: 'Open Settings > Wi-Fi, select your business network, enter the password, and connect. For WPA2-Enterprise networks, configure the EAP method and credentials in Advanced Wi-Fi settings. The AP5 automatically reconnects to known networks when in range. Verify connectivity by opening the QBIT Hub website in the browser.' },
          { title: '4G LTE Configuration', content: 'Insert a compatible SIM card into the AP5 SIM slot (located under the back cover). The AP5 auto-detects the SIM and configures the cellular network. If auto-configuration fails, manually enter the APN settings provided by your carrier. 4G LTE provides backup connectivity when Wi-Fi is unavailable.' },
        ]
      }),
      categoryId: kCatIds['networking'],
      author: 'QBIT Technical Team',
      readingTime: 10,
      difficulty: 'Beginner',
      featured: false,
      popular: true,
      relatedProductIds: JSON.stringify([productIds['qbithub-android-pos-ap5']]),
      publishedAt: new Date('2025-01-28'),
    },
    {
      title: 'Common Thermal Printer Error Codes and Solutions',
      slug: 'thermal-printer-error-codes',
      excerpt: 'Reference guide for all P80 Alpha and P40 thermal printer error codes, their meanings, and step-by-step resolutions.',
      content: JSON.stringify({
        sections: [
          { title: 'Error Code Reference', content: 'ERR_PAPER_OUT: The paper roll is empty or near-empty. Solution: Replace the paper roll with a new 80mm (P80 Alpha) or 58mm (P40) thermal paper roll. ERR_COVER_OPEN: The printer top cover is not properly closed. Solution: Close the cover firmly and verify the latch clicks into place. ERR_HEAD_TEMP: The print head temperature exceeds safe limits. Solution: Pause printing for 2 minutes, clean the print head, and reduce print density. ERR_CUTTER_JAM: The auto-cutter mechanism is jammed. Solution: Remove any paper debris from the cutter path, reset the cutter by pressing the FEED button twice.' },
          { title: 'Print Quality Issues', content: 'Faded prints: Increase print density in driver settings (range 0-15, default 8). If still faded, clean the print head with the included cleaning card. Black streaks: Clean the print roller and check for debris on the thermal paper. Misaligned text: Recalibrate the print width setting to match your paper width (80mm or 58mm).' },
        ]
      }),
      categoryId: kCatIds['troubleshooting'],
      author: 'QBIT Technical Team',
      readingTime: 5,
      difficulty: 'Beginner',
      featured: true,
      popular: true,
      relatedProductIds: JSON.stringify([productIds['qbithub-thermal-printer-p80-alpha'], productIds['qbithub-portable-thermal-printer-p40']]),
      publishedAt: new Date('2025-02-01'),
    },
    {
      title: 'How to Use Dr. QBIT for Auto Device Detection',
      slug: 'dr-qbit-auto-detection-guide',
      excerpt: 'Learn how Dr. QBIT automatically identifies connected POS hardware, fetches drivers, and provides instant device diagnostics.',
      content: JSON.stringify({
        sections: [
          { title: 'What is Dr. QBIT?', content: 'Dr. QBIT is an AI-powered diagnostic system that automatically detects connected QBIT hardware peripherals. It uses USB device fingerprinting, hardware signature matching, and cloud-based device lookup to identify any connected QBIT device within seconds. No manual serial number entry required.' },
          { title: 'Using Dr. QBIT', content: 'Navigate to /dr-qbit and click "Scan Hardware." Dr. QBIT scans all USB, LAN, and Bluetooth connected devices. Each detected device is matched against the QBIT hardware database and identified with its exact model, firmware version, and driver status. For each device, Dr. QBIT provides: the latest driver download link, firmware update availability, user manual PDF, installation guide, and troubleshooting articles.' },
          { title: 'Serial Number Lookup', content: 'If you prefer manual lookup, enter any QBIT serial number in the search bar. Dr. QBIT validates the serial format, queries the device registry, and returns the complete device passport: warranty status, purchase date, registered owner, supported drivers, and recommended maintenance schedule.' },
        ]
      }),
      categoryId: kCatIds['products'],
      author: 'QBIT Technical Team',
      readingTime: 4,
      difficulty: 'Beginner',
      featured: true,
      popular: true,
      publishedAt: new Date('2025-02-05'),
    },
  ];

  for (const article of articles) {
    try {
      await db.knowledgeArticle.upsert({
        where: { slug: article.slug },
        update: article,
        create: article,
      });
    } catch (e: any) {
      console.log(`   ⚠ Article "${article.slug}" failed: ${e.message}`);
    }
  }
  console.log(`   ✓ ${articles.length} knowledge articles seeded`);

  // 8. Seed FAQ entries
  console.log('8. Seeding FAQs...');
  const faqs = [
    { question: 'How do I find my QBIT device serial number?', answer: 'Every QBIT device has a serial number printed on a label on the bottom or back of the unit. The serial format varies by model: P80 Alpha uses P80A-XXXXXX, S20 Pro uses S20P-XXXXXX, V3 POS uses V3POS-XXXXXX. You can also find the serial number on the original packaging and purchase invoice. If you cannot locate the serial number, use Dr. QBIT auto-detection to identify your device without a serial number.', sortOrder: 0 },
    { question: 'Can I use QBIT printers with non-QBIT POS systems?', answer: 'Yes. QBIT thermal printers (P80 Alpha, P40, L60) are compatible with most POS systems that support ESC/POS command protocol. This includes popular POS software like QuickBooks POS, Square, Toast, Lightspeed, and many others. Download the appropriate driver from the QBIT Hub Download Center and follow the installation guide for your specific POS system.', sortOrder: 1 },
    { question: 'How do I update firmware on my QBIT device?', answer: 'Firmware updates are available from the QBIT Hub Download Center. Download the firmware file for your specific model, connect the device to your computer via USB, and use the QBIT Configuration Utility to flash the new firmware. Never disconnect the device during a firmware update. The update process typically takes 2-5 minutes. After completion, the device automatically restarts with the new firmware version.', sortOrder: 2 },
    { question: 'What warranty coverage do QBIT products have?', answer: 'All QBIT products come with a standard 12-month warranty covering manufacturing defects and hardware failures under normal use conditions. The warranty does not cover damage from misuse, unauthorized modifications, or natural disasters. Extended warranty and AMC (Annual Maintenance Contract) options are available for enterprise customers. Contact your QBIT dealer or visit /support for warranty claims.', sortOrder: 3 },
    { question: 'My thermal printer is printing blank receipts. What should I do?', answer: 'Blank receipts usually indicate one of these issues: (1) The thermal paper roll is installed upside down — thermal paper has a coating on only one side. Try flipping the roll. (2) The print density is set too low — increase density in driver settings. (3) The print head is dirty — clean with the included cleaning card. (4) The driver is not correctly installed — reinstall the latest driver version from the Download Center.', sortOrder: 4 },
  ];
  for (const faq of faqs) {
    try {
      await db.faq.upsert({
        where: { id: `faq-${faq.sortIndex}` },
        update: faq,
        create: { ...faq, id: `faq-${faq.sortIndex}` },
      });
    } catch (e: any) {
      console.log(`   ⚠ FAQ "${faq.question}" failed: ${e.message}`);
    }
  }
  console.log(`   ✓ ${faqs.length} FAQs seeded`);

  // 9. Seed Common Error Codes
  console.log('9. Seeding common error codes...');
  const errorCodes = [
    { code: 'ERR_PAPER_OUT', meaning: 'Thermal paper roll is empty', possibleCause: 'Paper roll depleted or not loaded', resolution: 'Replace the paper roll with a compatible QBIT thermal paper roll (80mm or 58mm)', severity: 'warning' },
    { code: 'ERR_COVER_OPEN', meaning: 'Printer top cover is open', possibleCause: 'Cover not closed after paper replacement', resolution: 'Close the printer cover firmly and verify the latch clicks', severity: 'warning' },
    { code: 'ERR_HEAD_OVERTEMP', meaning: 'Print head overheating', possibleCause: 'Continuous high-volume printing without pause', resolution: 'Pause printing for 2 minutes, reduce print density, clean print head', severity: 'error' },
    { code: 'ERR_CUTTER_JAM', meaning: 'Auto-cutter mechanism jammed', possibleCause: 'Paper debris in cutter path', resolution: 'Remove paper debris, press FEED twice to reset cutter', severity: 'warning' },
    { code: 'ERR_USB_DISCONNECT', meaning: 'USB connection lost', possibleCause: 'Cable disconnected or faulty USB port', resolution: 'Reconnect USB cable, try a different USB port, replace cable if damaged', severity: 'error' },
    { code: 'ERR_LAN_TIMEOUT', meaning: 'LAN connection timeout', possibleCause: 'Network connectivity issue or incorrect IP configuration', resolution: 'Verify network cable, check IP settings, test with QBIT Configuration Utility', severity: 'error' },
    { code: 'ERR_BT_PAIR_FAIL', meaning: 'Bluetooth pairing failed', possibleCause: 'Device not in pairing mode or out of range', resolution: 'Ensure printer is powered on and within 5m, enable Bluetooth pairing mode', severity: 'warning' },
    { code: 'ERR_NFC_READ_FAIL', meaning: 'NFC card read failure', possibleCause: 'Card not positioned correctly or incompatible card type', resolution: 'Reposition card on NFC reader surface, verify card compatibility (EMV/NFC)', severity: 'warning' },
  ];
  for (const ec of errorCodes) {
    try {
      await db.commonError.upsert({
        where: { code: ec.code },
        update: ec,
        create: ec,
      });
    } catch (e: any) {
      console.log(`   ⚠ Error code "${ec.code}" failed: ${e.message}`);
    }
  }
  console.log(`   ✓ ${errorCodes.length} error codes seeded`);

  // 10. Seed Installation Guides (basic records)
  console.log('10. Seeding installation guides...');
  const guides = [
    { title: 'P80 Alpha Thermal Printer Setup', slug: 'p80-alpha-setup', product: 'P80 Alpha', category: 'Thermal Printer', estimatedTime: 15, difficulty: 'Beginner', version: 'v2.3.1', description: 'Complete setup guide for the P80 Alpha thermal printer including USB and LAN connection, driver installation, and test printing.', featured: true, latest: true },
    { title: 'V3 POS Machine Installation', slug: 'v3-pos-installation', product: 'V3 POS', category: 'Windows POS', estimatedTime: 45, difficulty: 'Intermediate', version: 'v1.5.2', description: 'Full installation guide for the V3 POS machine: first boot, peripheral setup, driver installation, and network configuration.', featured: true, latest: true },
    { title: 'AP5 Android POS Setup', slug: 'ap5-android-pos-setup', product: 'AP5', category: 'Android POS', estimatedTime: 30, difficulty: 'Intermediate', version: 'v1.0.0', description: 'Setup guide for the AP5 Android POS terminal: initial configuration, app installation, Bluetooth/Wi-Fi pairing, and payment setup.', featured: true, latest: true },
    { title: 'L60 Label Printer Setup', slug: 'l60-label-printer-setup', product: 'L60', category: 'Label Printer', estimatedTime: 20, difficulty: 'Beginner', version: 'v2.0.1', description: 'Setup guide for the L60 label printer: media loading, driver installation, label calibration, and first print test.', featured: false, latest: true },
  ];
  for (const guide of guides) {
    try {
      await db.installationGuide.upsert({
        where: { slug: guide.slug },
        update: guide,
        create: guide,
      });
    } catch (e: any) {
      console.log(`   ⚠ Guide "${guide.slug}" failed: ${e.message}`);
    }
  }
  console.log(`   ✓ ${guides.length} installation guides seeded`);

  // 11. Seed Troubleshooting Issues
  console.log('11. Seeding troubleshooting issues...');
  const issues = [
    { title: 'P80 Alpha — Printer Not Detected on USB', slug: 'p80-alpha-usb-not-detected', symptoms: JSON.stringify(['USB device not recognized by Windows', 'Printer does not appear in device list', 'Driver installer fails to detect printer']), causes: JSON.stringify(['Faulty USB cable', 'Wrong USB port (USB 3.0 vs 2.0 compatibility)', 'Driver version mismatch', 'Windows USB power management disabling port']), resolution: 'Try a different USB cable, connect to USB 2.0 port directly (not through hub), reinstall latest driver, disable USB power management in Windows Device Manager.', difficulty: 'Beginner' },
    { title: 'V3 POS — Touchscreen Not Responding', slug: 'v3-pos-touchscreen-unresponsive', symptoms: JSON.stringify(['Touch inputs not registering', 'Touch offset or misalignment', 'Touchscreen works intermittently']), causes: JSON.stringify(['Touch calibration drift', 'Screen protector interference', 'Driver conflict with other HID devices', 'Physical damage to touch sensor']), resolution: 'Run touch calibration utility (QBIT Config Tool > Touch Calibration), remove any screen protector, check for HID device conflicts in Device Manager.', difficulty: 'Intermediate' },
  ];
  for (const issue of issues) {
    try {
      await db.troubleshootingIssue.upsert({
        where: { slug: issue.slug },
        update: issue,
        create: issue,
      });
    } catch (e: any) {
      console.log(`   ⚠ Issue "${issue.slug}" failed: ${e.message}`);
    }
  }
  console.log(`   ✓ ${issues.length} troubleshooting issues seeded`);

  // 12. Seed Announcement
  console.log('12. Seeding announcement...');
  try {
    await db.announcement.upsert({
      where: { id: 'welcome-announcement' },
      update: {},
      create: {
        id: 'welcome-announcement',
        title: 'Welcome to QBIT Hub Enterprise Support Portal',
        message: 'Your comprehensive resource for drivers, firmware, manuals, installation guides, and Dr. QBIT diagnostics. Browse our product catalog, search by serial number, or use Dr. QBIT to auto-detect your connected hardware.',
        type: 'info',
        priority: 'normal',
        isActive: true,
      },
    });
  } catch (e: any) {
    console.log(`   ⚠ Announcement failed: ${e.message}`);
  }
  console.log('   ✓ Announcement seeded');

  // 13. Seed Super Admin User
  console.log('13. Seeding super admin user...');
  const bcrypt = require('bcryptjs');
  try {
    const adminHash = await bcrypt.hash('AdminQbit2024!', 12);
    await db.user.upsert({
      where: { email: 'admin@qbithub.com' },
      update: { role: 'super_admin', passwordHash: adminHash },
      create: {
        email: 'admin@qbithub.com',
        name: 'QBIT Super Admin',
        role: 'super_admin',
        passwordHash: adminHash,
      },
    });
  } catch (e: any) {
    console.log(`   ⚠ Admin user failed: ${e.message}`);
  }
  console.log('   ✓ Admin user seeded');

  // 14. Seed Device Categories (V6 extensible architecture)
  console.log('14. Seeding device categories...');
  const deviceCategories = [
    { name: 'Thermal Receipt Printer', slug: 'thermal-printer', icon: 'print', description: '80mm and 58mm thermal receipt printers for POS environments', sortIndex: 0 },
    { name: 'Barcode Scanner', slug: 'barcode-scanner', icon: 'barcode_scanner', description: '1D and 2D barcode scanners for retail, logistics, and healthcare', sortIndex: 1 },
    { name: 'Windows POS Terminal', slug: 'window-pos', icon: 'desktop_windows', description: 'All-in-one Windows POS terminals with built-in peripherals', sortIndex: 2 },
    { name: 'Android POS Terminal', slug: 'android-pos', icon: 'phone_android', description: 'Mobile Android POS terminals for delivery and field service', sortIndex: 3 },
    { name: 'Portable Thermal Printer', slug: 'portable-printer', icon: 'print', description: 'Battery-powered mobile thermal printers for field operations', sortIndex: 4 },
    { name: 'Cash Drawer', slug: 'cash-drawer', icon: 'point_of_sale', description: 'Heavy-duty cash drawers for retail checkout', sortIndex: 5 },
    { name: 'Customer Display', slug: 'customer-side-display', icon: 'monitor', description: 'Customer-facing VFD/LCD displays for transaction visibility', sortIndex: 6 },
    { name: 'Label Printer', slug: 'barcode-printer', icon: 'label', description: 'Direct-thermal label printers for shipping and product tagging', sortIndex: 7 },
  ];
  // Check if DeviceCategory model exists
  try {
    for (const dc of deviceCategories) {
      try {
        await (db as any).deviceCategory.upsert({
          where: { slug: dc.slug },
          update: dc,
          create: dc,
        });
      } catch (e: any) {
        if (e.message.includes('does not exist')) {
          console.log('   ⚠ DeviceCategory model not found — skipping');
          break;
        }
      }
    }
  } catch (e) {
    console.log('   ⚠ Device categories skipped');
  }
  console.log('   ✓ Device categories seeded');

  // Summary
  console.log('\n=== Seed Summary ===');
  const productCount = await db.qbitProduct.count();
  const resourceCount = await db.resource.count();
  const articleCount = await db.knowledgeArticle.count();
  const guideCount = await db.installationGuide.count();
  const faqCount = await db.faq.count();
  const errorCodeCount = await db.commonError.count();
  const issueCount = await db.troubleshootingIssue.count();
  const userCount = await db.user.count();

  console.log(`Products: ${productCount}`);
  console.log(`Resources: ${resourceCount}`);
  console.log(`Knowledge Articles: ${articleCount}`);
  console.log(`Installation Guides: ${guideCount}`);
  console.log(`FAQs: ${faqCount}`);
  console.log(`Error Codes: ${errorCodeCount}`);
  console.log(`Troubleshooting Issues: ${issueCount}`);
  console.log(`Users: ${userCount}`);
  console.log('\n=== Production Seed Complete ===');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
