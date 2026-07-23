/**
 * Dr. QBIT — Extensible Device Architecture Seed Script
 *
 * Seeds the complete database-driven architecture definitions:
 *   1. Connection Type Definitions (6 types)
 *   2. Capability Definitions (24 capabilities)
 *   3. Device Categories (13 categories)
 *   4. Communication Adapter Definitions (13 adapters)
 *   5. Cross-reference mappings (Category ↔ Capability, Category ↔ ConnectionType, Category ↔ Adapter, Adapter ↔ ConnectionType)
 *
 * After seeding, Dr. QBIT reads ALL definitions from the database at runtime.
 * No hardcoded device types, capabilities, or connection types.
 * New hardware = new DB entries only. Core engine NEVER modified.
 *
 * RUN: npx tsx scripts/seed-device-architecture.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ====================== 1. Connection Type Definitions ======================

const CONNECTION_TYPES = [
  {
    slug: "usb",
    name: "USB",
    description: "Universal Serial Bus — direct wired connection for printers, scanners, and POS devices",
    icon: "usb",
    protocol: "USB",
    supportsDiscovery: true,
    requiresDesktopAgent: false,
    supportsConfiguration: true,
    supportsDiagnostics: true,
    sortIndex: 0,
    isActive: true,
  },
  {
    slug: "bluetooth",
    name: "Bluetooth",
    description: "Bluetooth Low Energy (BLE) and Classic Bluetooth for portable printers and wireless peripherals",
    icon: "bluetooth",
    protocol: "BLE",
    supportsDiscovery: true,
    requiresDesktopAgent: false,
    supportsConfiguration: true,
    supportsDiagnostics: true,
    sortIndex: 1,
    isActive: true,
  },
  {
    slug: "lan",
    name: "Ethernet (LAN)",
    description: "Local Area Network via TCP/IP — for network printers, POS terminals, and shared devices",
    icon: "lan",
    protocol: "TCP/IP",
    supportsDiscovery: true,
    requiresDesktopAgent: true,
    supportsConfiguration: true,
    supportsDiagnostics: true,
    sortIndex: 2,
    isActive: true,
  },
  {
    slug: "wifi",
    name: "Wi-Fi",
    description: "802.11 wireless networking — for wireless printer setup and POS connectivity",
    icon: "wifi",
    protocol: "802.11",
    supportsDiscovery: true,
    requiresDesktopAgent: true,
    supportsConfiguration: true,
    supportsDiagnostics: true,
    sortIndex: 3,
    isActive: true,
  },
  {
    slug: "serial",
    name: "Serial (COM)",
    description: "RS-232 serial port — legacy connection for impact printers, POS terminals, and industrial devices",
    icon: "cable",
    protocol: "RS-232",
    supportsDiscovery: true,
    requiresDesktopAgent: true,
    supportsConfiguration: true,
    supportsDiagnostics: true,
    sortIndex: 4,
    isActive: true,
  },
  {
    slug: "virtual-port",
    name: "Virtual Printer Port",
    description: "Software-emulated printer port — for driver-based virtual printers and cloud print services",
    icon: "cloud",
    protocol: "Virtual",
    supportsDiscovery: false,
    requiresDesktopAgent: true,
    supportsConfiguration: true,
    supportsDiagnostics: false,
    sortIndex: 5,
    isActive: true,
  },
];

// ====================== 2. Capability Definitions ======================

const CAPABILITY_DEFINITIONS = [
  // --- Connection Capabilities ---
  { slug: "usb", name: "USB Connection", description: "Supports USB connection for data transfer and configuration", icon: "usb", capabilityGroup: "connection", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 0 },
  { slug: "lan", name: "Ethernet (LAN)", description: "Supports Ethernet/LAN connection via TCP/IP", icon: "lan", capabilityGroup: "connection", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 1 },
  { slug: "wifi", name: "Wi-Fi", description: "Supports Wi-Fi wireless connection for network printing", icon: "wifi", capabilityGroup: "connection", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 2 },
  { slug: "bluetooth", name: "Bluetooth", description: "Supports Bluetooth BLE/Classic for wireless connectivity", icon: "bluetooth", capabilityGroup: "connection", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 3 },
  { slug: "com-serial", name: "Serial (COM)", description: "Supports RS-232 serial port communication", icon: "cable", capabilityGroup: "connection", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 4 },
  
  // --- Printing Capabilities ---
  { slug: "receipt-printing", name: "Receipt Printing", description: "Can print thermal receipts (58mm/80mm paper width)", icon: "receipt_long", capabilityGroup: "printing", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 10 },
  { slug: "barcode-printing", name: "Barcode Printing", description: "Can print 1D/2D barcodes (Code128, QR, EAN, etc.)", icon: "barcode", capabilityGroup: "printing", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 11 },
  { slug: "label-printing", name: "Label Printing", description: "Can print adhesive labels of various sizes", icon: "label", capabilityGroup: "printing", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 12 },
  { slug: "kitchen-printing", name: "Kitchen Printing", description: "Can print kitchen orders (impact dot matrix resistant to heat)", icon: "restaurant", capabilityGroup: "printing", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 13 },
  
  // --- Hardware Capabilities ---
  { slug: "auto-cutter", name: "Auto Cutter", description: "Has automatic paper cutting mechanism", icon: "content_cut", capabilityGroup: "hardware", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 20 },
  { slug: "cash-drawer", name: "Cash Drawer Kick", description: "Can trigger cash drawer opening via printer command", icon: "point_of_sale", capabilityGroup: "hardware", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 21 },
  { slug: "scanner-mode", name: "Scanner Mode", description: "Can scan barcodes and QR codes", icon: "barcode_scanner", capabilityGroup: "hardware", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 22 },
  { slug: "display-output", name: "Customer Display Output", description: "Can display transaction info to customer on secondary screen", icon: "monitor", capabilityGroup: "hardware", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 23 },
  { slug: "rfid-read-write", name: "RFID Read/Write", description: "Can read and write RFID tags and transponders", icon: "nfc", capabilityGroup: "hardware", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 24 },
  
  // --- Software/Protocol Capabilities ---
  { slug: "esc-pos-protocol", name: "ESC/POS Protocol", description: "Supports ESC/POS command protocol for printer communication", icon: "code", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 30 },
  { slug: "snmp-support", name: "SNMP Support", description: "Supports SNMP protocol for network device monitoring and status queries", icon: "dns", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: false, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 31 },
  { slug: "firmware-upgrade", name: "Firmware Upgrade", description: "Supports firmware upgrade/update via USB, LAN, or Bluetooth", icon: "system_update", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 32 },
  { slug: "configuration-tool", name: "Configuration Tool", description: "Has dedicated configuration tool for device setup and parameter management", icon: "settings", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 33 },
  { slug: "health-monitoring", name: "Health Monitoring", description: "Supports continuous health monitoring with real-time status reporting", icon: "health_and_safety", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: false, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 34 },
  { slug: "test-print", name: "Test Print", description: "Can execute test print for verification and diagnostics", icon: "print", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 35 },
  
  // --- POS Capabilities ---
  { slug: "pos-mode", name: "POS Mode", description: "Can operate as a Point-of-Sale terminal for retail transactions", icon: "point_of_sale", capabilityGroup: "pos", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 40 },
  { slug: "android-pos", name: "Android POS", description: "Runs Android-based POS software for retail and hospitality", icon: "phone_android", capabilityGroup: "pos", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 41 },
  { slug: "windows-pos", name: "Windows POS", description: "Runs Windows-based POS software for retail and hospitality", icon: "desktop_windows", capabilityGroup: "pos", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 42 },
  
  // --- Specialized Capabilities ---
  { slug: "weighing-scale", name: "Weighing Scale Interface", description: "Can connect to and read data from weighing scales", icon: "scale", capabilityGroup: "specialized", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 50 },
  { slug: "kiosk-mode", name: "Kiosk Mode", description: "Can operate as self-service kiosk terminal", icon: "storefront", capabilityGroup: "specialized", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 51 },
];

// ====================== 3. Device Categories ======================

const DEVICE_CATEGORIES = [
  {
    slug: "thermal-printer",
    name: "Thermal Receipt Printer",
    description: "Direct thermal and thermal transfer receipt printers for retail, hospitality, and banking. Supports 58mm/80mm paper width with auto-cutter capability.",
    icon: "print",
    productFamily: "Printers",
    supportedInterfaces: ["usb", "lan", "wifi", "bluetooth", "serial"],
    defaultProtocol: "ESC/POS",
    supportedOS: ["windows", "android", "linux"],
    sortIndex: 0,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "lan", "wifi", "bluetooth", "com-serial", "receipt-printing", "auto-cutter", "cash-drawer", "esc-pos-protocol", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
    defaultConnectionTypes: ["usb", "lan", "wifi", "bluetooth", "serial"],
    adapters: ["thermal-printer-adapter"],
    primaryAdapter: "thermal-printer-adapter",
  },
  {
    slug: "barcode-printer",
    name: "Barcode Printer",
    description: "Thermal transfer and direct thermal barcode label printers for shipping, inventory, and asset tracking. Supports ZPL, EPL, and ESC/POS protocols.",
    icon: "qr_code_2",
    productFamily: "Printers",
    supportedInterfaces: ["usb", "lan", "wifi", "bluetooth", "serial"],
    defaultProtocol: "ZPL",
    supportedOS: ["windows", "android", "linux"],
    sortIndex: 1,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "lan", "wifi", "bluetooth", "com-serial", "barcode-printing", "label-printing", "esc-pos-protocol", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
    defaultConnectionTypes: ["usb", "lan", "wifi", "bluetooth", "serial"],
    adapters: ["barcode-printer-adapter"],
    primaryAdapter: "barcode-printer-adapter",
  },
  {
    slug: "portable-bluetooth-printer",
    name: "Portable Bluetooth Printer",
    description: "Battery-powered portable receipt printers with Bluetooth connectivity for mobile receipt printing in field service, delivery, and on-the-go retail.",
    icon: "print",
    productFamily: "Printers",
    supportedInterfaces: ["bluetooth", "usb", "wifi"],
    defaultProtocol: "ESC/POS",
    supportedOS: ["android", "windows"],
    sortIndex: 2,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["bluetooth", "usb", "wifi", "receipt-printing", "auto-cutter", "esc-pos-protocol", "firmware-upgrade", "health-monitoring", "test-print"],
    defaultConnectionTypes: ["bluetooth", "usb", "wifi"],
    adapters: ["portable-printer-adapter"],
    primaryAdapter: "portable-printer-adapter",
  },
  {
    slug: "label-printer",
    name: "Label Printer",
    description: "Dedicated label printers for product labels, shipping labels, barcode labels, and name tags. Supports multiple label sizes and materials.",
    icon: "label",
    productFamily: "Printers",
    supportedInterfaces: ["usb", "lan", "wifi", "bluetooth"],
    defaultProtocol: "ESC/POS",
    supportedOS: ["windows", "android", "linux"],
    sortIndex: 3,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "lan", "wifi", "bluetooth", "label-printing", "barcode-printing", "esc-pos-protocol", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
    defaultConnectionTypes: ["usb", "lan", "wifi", "bluetooth"],
    adapters: ["label-printer-adapter"],
    primaryAdapter: "label-printer-adapter",
  },
  {
    slug: "android-pos",
    name: "Android POS",
    description: "Android-based Point-of-Sale terminals with integrated printer, touchscreen, and payment processing. Used in retail, hospitality, and F&B.",
    icon: "phone_android",
    productFamily: "POS Systems",
    supportedInterfaces: ["wifi", "lan", "bluetooth", "usb"],
    defaultProtocol: "Android SDK",
    supportedOS: ["android"],
    sortIndex: 4,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["wifi", "lan", "bluetooth", "usb", "receipt-printing", "cash-drawer", "scanner-mode", "pos-mode", "android-pos", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
    defaultConnectionTypes: ["wifi", "lan", "bluetooth", "usb"],
    adapters: ["android-pos-adapter"],
    primaryAdapter: "android-pos-adapter",
  },
  {
    slug: "windows-pos",
    name: "Windows POS",
    description: "Windows-based Point-of-Sale terminals with integrated printer, touchscreen, and OPOS/JPOS driver support. Used in supermarkets, pharmacies, and large retail.",
    icon: "desktop_windows",
    productFamily: "POS Systems",
    supportedInterfaces: ["usb", "lan", "wifi", "serial", "bluetooth"],
    defaultProtocol: "OPOS/JPOS",
    supportedOS: ["windows"],
    sortIndex: 5,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "lan", "wifi", "com-serial", "bluetooth", "receipt-printing", "cash-drawer", "scanner-mode", "display-output", "pos-mode", "windows-pos", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print", "snmp-support"],
    defaultConnectionTypes: ["usb", "lan", "wifi", "serial", "bluetooth"],
    adapters: ["windows-pos-adapter"],
    primaryAdapter: "windows-pos-adapter",
  },
  {
    slug: "barcode-scanner",
    name: "Barcode Scanner",
    description: "Handheld and fixed-mount barcode scanners for 1D/2D barcode reading. Supports USB HID, serial, and Bluetooth connectivity.",
    icon: "barcode_scanner",
    productFamily: "Scanners",
    supportedInterfaces: ["usb", "bluetooth", "wifi", "serial"],
    defaultProtocol: "HID",
    supportedOS: ["windows", "android", "linux"],
    sortIndex: 6,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "bluetooth", "wifi", "com-serial", "scanner-mode", "firmware-upgrade", "configuration-tool", "health-monitoring"],
    defaultConnectionTypes: ["usb", "bluetooth", "wifi", "serial"],
    adapters: ["barcode-scanner-adapter"],
    primaryAdapter: "barcode-scanner-adapter",
  },
  {
    slug: "customer-display",
    name: "Customer Display",
    description: "Secondary customer-facing displays (pole displays, LCD screens) for showing transaction amounts and promotional content at checkout.",
    icon: "monitor",
    productFamily: "Peripherals",
    supportedInterfaces: ["usb", "serial", "lan"],
    defaultProtocol: "ESC/POS Display",
    supportedOS: ["windows", "android"],
    sortIndex: 7,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "com-serial", "lan", "display-output", "esc-pos-protocol", "firmware-upgrade", "configuration-tool", "health-monitoring"],
    defaultConnectionTypes: ["usb", "serial", "lan"],
    adapters: ["customer-display-adapter"],
    primaryAdapter: "customer-display-adapter",
  },
  {
    slug: "cash-drawer",
    name: "Cash Drawer",
    description: "Electronic cash drawers triggered by printer or POS commands. Supports solenoid kick via receipt printer or direct USB/serial connection.",
    icon: "point_of_sale",
    productFamily: "Peripherals",
    supportedInterfaces: ["usb", "serial"],
    defaultProtocol: "Solenoid Kick",
    supportedOS: ["windows", "android"],
    sortIndex: 8,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "com-serial", "cash-drawer", "firmware-upgrade", "configuration-tool", "health-monitoring"],
    defaultConnectionTypes: ["usb", "serial"],
    adapters: ["cash-drawer-adapter"],
    primaryAdapter: "cash-drawer-adapter",
  },
  {
    slug: "rfid-device",
    name: "RFID Device",
    description: "RFID readers and writers for asset tracking, access control, inventory management, and contactless payment. Supports LF, HF, and UHF frequencies.",
    icon: "nfc",
    productFamily: "Scanners",
    supportedInterfaces: ["usb", "bluetooth", "wifi", "lan", "serial"],
    defaultProtocol: "RFID Protocol",
    supportedOS: ["windows", "android", "linux"],
    sortIndex: 9,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "bluetooth", "wifi", "lan", "com-serial", "rfid-read-write", "firmware-upgrade", "configuration-tool", "health-monitoring"],
    defaultConnectionTypes: ["usb", "bluetooth", "wifi", "lan", "serial"],
    adapters: ["rfid-device-adapter"],
    primaryAdapter: "rfid-device-adapter",
  },
  {
    slug: "kitchen-printer",
    name: "Kitchen Printer",
    description: "Impact dot matrix printers for kitchen order printing. Heat-resistant, noise-resistant, two-color printing for food service environments.",
    icon: "restaurant",
    productFamily: "Printers",
    supportedInterfaces: ["usb", "lan", "wifi", "serial"],
    defaultProtocol: "ESC/POS",
    supportedOS: ["windows", "android"],
    sortIndex: 10,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "lan", "wifi", "com-serial", "kitchen-printing", "receipt-printing", "auto-cutter", "cash-drawer", "esc-pos-protocol", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
    defaultConnectionTypes: ["usb", "lan", "wifi", "serial"],
    adapters: ["thermal-printer-adapter"], // Kitchen printers use thermal printer adapter (ESC/POS)
    primaryAdapter: "thermal-printer-adapter",
  },
  {
    slug: "kiosk",
    name: "Kiosk",
    description: "Self-service kiosk terminals for ticket printing, bill payment, self-ordering, and information display. Integrates printer, touchscreen, scanner.",
    icon: "storefront",
    productFamily: "POS Systems",
    supportedInterfaces: ["usb", "lan", "wifi", "serial"],
    defaultProtocol: "Kiosk SDK",
    supportedOS: ["windows", "android"],
    sortIndex: 11,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "lan", "wifi", "com-serial", "receipt-printing", "scanner-mode", "display-output", "cash-drawer", "kiosk-mode", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
    defaultConnectionTypes: ["usb", "lan", "wifi", "serial"],
    adapters: ["kiosk-adapter"],
    primaryAdapter: "kiosk-adapter",
  },
  {
    slug: "weighing-scale",
    name: "Weighing Scale",
    description: "Digital weighing scales with serial/USB connectivity for retail, grocery, and logistics. Supports label printing integration.",
    icon: "scale",
    productFamily: "Peripherals",
    supportedInterfaces: ["usb", "serial", "bluetooth"],
    defaultProtocol: "Scale Protocol",
    supportedOS: ["windows", "android"],
    sortIndex: 12,
    isActive: true,
    isPublic: true,
    status: "active",
    defaultCapabilities: ["usb", "com-serial", "bluetooth", "weighing-scale", "firmware-upgrade", "configuration-tool", "health-monitoring"],
    defaultConnectionTypes: ["usb", "serial", "bluetooth"],
    adapters: ["weighing-scale-adapter"],
    primaryAdapter: "weighing-scale-adapter",
  },
];

// ====================== 4. Communication Adapter Definitions ======================

const COMMUNICATION_ADAPTERS = [
  {
    slug: "thermal-printer-adapter",
    name: "Thermal Printer Adapter",
    description: "Adapter for thermal receipt printers — handles ESC/POS protocol, USB/LAN/WiFi/BT/Serial configuration, and printer diagnostics",
    adapterClass: "ThermalPrinterDiagnosticAdapter",
    protocol: "ESC/POS",
    requiresDesktopAgent: false,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 0,
    isActive: true,
    categories: ["thermal-printer", "kitchen-printer"],
    primaryCategory: "thermal-printer",
    connectionTypes: ["usb", "lan", "wifi", "bluetooth", "serial"],
  },
  {
    slug: "barcode-printer-adapter",
    name: "Barcode Printer Adapter",
    description: "Adapter for barcode label printers — handles ZPL/EPL/ESC/POS protocols, label configuration, and barcode print diagnostics",
    adapterClass: "BarcodePrinterDiagnosticAdapter",
    protocol: "ZPL",
    requiresDesktopAgent: false,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 1,
    isActive: true,
    categories: ["barcode-printer"],
    primaryCategory: "barcode-printer",
    connectionTypes: ["usb", "lan", "wifi", "bluetooth", "serial"],
  },
  {
    slug: "portable-printer-adapter",
    name: "Portable Printer Adapter",
    description: "Adapter for portable Bluetooth printers — handles BLE+ESC/POS, battery status, and mobile print diagnostics",
    adapterClass: "PortablePrinterDiagnosticAdapter",
    protocol: "BLE+ESC/POS",
    requiresDesktopAgent: false,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 2,
    isActive: true,
    categories: ["portable-bluetooth-printer"],
    primaryCategory: "portable-bluetooth-printer",
    connectionTypes: ["bluetooth", "usb", "wifi"],
  },
  {
    slug: "label-printer-adapter",
    name: "Label Printer Adapter",
    description: "Adapter for label printers — handles ESC/POS label commands, label size configuration, and label print diagnostics",
    adapterClass: "LabelPrinterDiagnosticAdapter",
    protocol: "ESC/POS Label",
    requiresDesktopAgent: false,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 3,
    isActive: true,
    categories: ["label-printer"],
    primaryCategory: "label-printer",
    connectionTypes: ["usb", "lan", "wifi", "bluetooth"],
  },
  {
    slug: "android-pos-adapter",
    name: "Android POS Adapter",
    description: "Adapter for Android POS terminals — handles Android SDK, integrated printer, scanner, and payment module diagnostics",
    adapterClass: "AndroidPosDiagnosticAdapter",
    protocol: "Android SDK",
    requiresDesktopAgent: false,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 4,
    isActive: true,
    categories: ["android-pos"],
    primaryCategory: "android-pos",
    connectionTypes: ["wifi", "lan", "bluetooth", "usb"],
  },
  {
    slug: "windows-pos-adapter",
    name: "Windows POS Adapter",
    description: "Adapter for Windows POS terminals — handles OPOS/JPOS driver interface, integrated hardware diagnostics, and Windows service management",
    adapterClass: "WindowsPosDiagnosticAdapter",
    protocol: "OPOS/JPOS",
    requiresDesktopAgent: true,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 5,
    isActive: true,
    categories: ["windows-pos"],
    primaryCategory: "windows-pos",
    connectionTypes: ["usb", "lan", "wifi", "serial", "bluetooth"],
  },
  {
    slug: "barcode-scanner-adapter",
    name: "Barcode Scanner Adapter",
    description: "Adapter for barcode scanners — handles HID/serial protocols, scan engine diagnostics, and decode capability verification",
    adapterClass: "BarcodeScannerDiagnosticAdapter",
    protocol: "HID",
    requiresDesktopAgent: false,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 6,
    isActive: true,
    categories: ["barcode-scanner"],
    primaryCategory: "barcode-scanner",
    connectionTypes: ["usb", "bluetooth", "wifi", "serial"],
  },
  {
    slug: "customer-display-adapter",
    name: "Customer Display Adapter",
    description: "Adapter for customer-facing pole/LCD displays — handles ESC/POS display commands, brightness control, and display content management",
    adapterClass: "CustomerDisplayDiagnosticAdapter",
    protocol: "ESC/POS Display",
    requiresDesktopAgent: false,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 7,
    isActive: true,
    categories: ["customer-display"],
    primaryCategory: "customer-display",
    connectionTypes: ["usb", "serial", "lan"],
  },
  {
    slug: "cash-drawer-adapter",
    name: "Cash Drawer Adapter",
    description: "Adapter for electronic cash drawers — handles solenoid kick commands, drawer status detection, and connectivity diagnostics",
    adapterClass: "CashDrawerDiagnosticAdapter",
    protocol: "Solenoid Kick",
    requiresDesktopAgent: false,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: false,
    sortIndex: 8,
    isActive: true,
    categories: ["cash-drawer"],
    primaryCategory: "cash-drawer",
    connectionTypes: ["usb", "serial"],
  },
  {
    slug: "rfid-device-adapter",
    name: "RFID Device Adapter",
    description: "Adapter for RFID readers/writers — handles RFID protocol, tag read/write operations, frequency diagnostics, and antenna calibration",
    adapterClass: "RfidDeviceDiagnosticAdapter",
    protocol: "RFID Protocol",
    requiresDesktopAgent: true,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 9,
    isActive: true,
    categories: ["rfid-device"],
    primaryCategory: "rfid-device",
    connectionTypes: ["usb", "bluetooth", "wifi", "lan", "serial"],
  },
  {
    slug: "kiosk-adapter",
    name: "Kiosk Adapter",
    description: "Adapter for self-service kiosk terminals — handles kiosk SDK, integrated printer/scanner/display, and kiosk-specific diagnostics",
    adapterClass: "KioskDiagnosticAdapter",
    protocol: "Kiosk SDK",
    requiresDesktopAgent: true,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 10,
    isActive: true,
    categories: ["kiosk"],
    primaryCategory: "kiosk",
    connectionTypes: ["usb", "lan", "wifi", "serial"],
  },
  {
    slug: "weighing-scale-adapter",
    name: "Weighing Scale Adapter",
    description: "Adapter for digital weighing scales — handles scale protocol, weight data reading, calibration, and scale connectivity diagnostics",
    adapterClass: "WeighingScaleDiagnosticAdapter",
    protocol: "Scale Protocol",
    requiresDesktopAgent: true,
    supportsLiveDiagnostics: true,
    supportsConfiguration: true,
    supportsFirmwareOps: true,
    sortIndex: 11,
    isActive: true,
    categories: ["weighing-scale"],
    primaryCategory: "weighing-scale",
    connectionTypes: ["usb", "serial", "bluetooth"],
  },
];

// ====================== Seed Function ======================

async function seedDeviceArchitecture() {
  console.log("🚀 Dr. QBIT — Seeding Extensible Device Architecture Definitions...");
  console.log("=" .repeat(70));

  let totalCreated = 0;

  // ===== Step 1: Seed Connection Type Definitions =====
  console.log("\n📡 Step 1: Seeding Connection Type Definitions...");
  for (const ct of CONNECTION_TYPES) {
    const existing = await prisma.connectionTypeDefinition.findFirst({ where: { slug: ct.slug } });
    if (existing) {
      console.log(`   ✓ [SKIP] "${ct.name}" already exists (slug: ${ct.slug})`);
      continue;
    }
    await prisma.connectionTypeDefinition.create({ data: ct });
    console.log(`   ✓ [CREATE] "${ct.name}" (slug: ${ct.slug})`);
    totalCreated++;
  }

  // ===== Step 2: Seed Capability Definitions =====
  console.log("\n⚙️  Step 2: Seeding Capability Definitions...");
  for (const cap of CAPABILITY_DEFINITIONS) {
    const existing = await prisma.capabilityDefinition.findFirst({ where: { slug: cap.slug } });
    if (existing) {
      console.log(`   ✓ [SKIP] "${cap.name}" already exists (slug: ${cap.slug})`);
      continue;
    }
    await prisma.capabilityDefinition.create({ data: cap });
    console.log(`   ✓ [CREATE] "${cap.name}" (slug: ${cap.slug}, group: ${cap.capabilityGroup})`);
    totalCreated++;
  }

  // ===== Step 3: Seed Device Categories + Cross-references =====
  console.log("\n📂 Step 3: Seeding Device Categories + Cross-references...");
  for (const cat of DEVICE_CATEGORIES) {
    const existing = await prisma.deviceCategory.findFirst({ where: { slug: cat.slug } });
    if (existing) {
      console.log(`   ✓ [SKIP] "${cat.name}" already exists (slug: ${cat.slug})`);
      continue;
    }

    const category = await prisma.deviceCategory.create({
      data: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        productFamily: cat.productFamily,
        supportedInterfaces: JSON.stringify(cat.supportedInterfaces),
        defaultProtocol: cat.defaultProtocol,
        supportedOS: JSON.stringify(cat.supportedOS),
        sortIndex: cat.sortIndex,
        isActive: cat.isActive,
        isPublic: cat.isPublic,
        status: cat.status,
      },
    });
    console.log(`   ✓ [CREATE] "${cat.name}" (slug: ${cat.slug}, family: ${cat.productFamily})`);
    totalCreated++;

    // Link default capabilities
    for (const capSlug of cat.defaultCapabilities) {
      const cap = await prisma.capabilityDefinition.findFirst({ where: { slug: capSlug } });
      if (cap) {
        await prisma.categoryCapability.upsert({
          where: { categoryId_capabilityId: { categoryId: category.id, capabilityId: cap.id } },
          update: { isDefault: true },
          create: {
            categoryId: category.id,
            capabilityId: cap.id,
            isDefault: true,
            sortIndex: cap.sortIndex,
          },
        });
      }
    }
    console.log(`     → Linked ${cat.defaultCapabilities.length} capabilities`);

    // Link default connection types
    for (const ctSlug of cat.defaultConnectionTypes) {
      const ct = await prisma.connectionTypeDefinition.findFirst({ where: { slug: ctSlug } });
      if (ct) {
        await prisma.categoryConnectionType.upsert({
          where: { categoryId_connectionTypeId: { categoryId: category.id, connectionTypeId: ct.id } },
          update: { isDefault: true },
          create: {
            categoryId: category.id,
            connectionTypeId: ct.id,
            isDefault: true,
            sortIndex: ct.sortIndex,
          },
        });
      }
    }
    console.log(`     → Linked ${cat.defaultConnectionTypes.length} connection types`);
  }

  // ===== Step 4: Seed Communication Adapter Definitions + Cross-references =====
  console.log("\n🔌 Step 4: Seeding Communication Adapter Definitions + Cross-references...");
  for (const adapter of COMMUNICATION_ADAPTERS) {
    const existing = await prisma.communicationAdapterDefinition.findFirst({ where: { slug: adapter.slug } });
    if (existing) {
      console.log(`   ✓ [SKIP] "${adapter.name}" already exists (slug: ${adapter.slug})`);
      continue;
    }

    const adapterRecord = await prisma.communicationAdapterDefinition.create({
      data: {
        slug: adapter.slug,
        name: adapter.name,
        description: adapter.description,
        adapterClass: adapter.adapterClass,
        protocol: adapter.protocol,
        requiresDesktopAgent: adapter.requiresDesktopAgent,
        supportsLiveDiagnostics: adapter.supportsLiveDiagnostics,
        supportsConfiguration: adapter.supportsConfiguration,
        supportsFirmwareOps: adapter.supportsFirmwareOps,
        sortIndex: adapter.sortIndex,
        isActive: adapter.isActive,
      },
    });
    console.log(`   ✓ [CREATE] "${adapter.name}" (class: ${adapter.adapterClass}, protocol: ${adapter.protocol})`);
    totalCreated++;

    // Link to categories
    for (const catSlug of adapter.categories) {
      const cat = await prisma.deviceCategory.findFirst({ where: { slug: catSlug } });
      if (cat) {
        await prisma.categoryAdapterMapping.upsert({
          where: { categoryId_adapterId: { categoryId: cat.id, adapterId: adapterRecord.id } },
          update: { isPrimary: catSlug === adapter.primaryCategory },
          create: {
            categoryId: cat.id,
            adapterId: adapterRecord.id,
            isPrimary: catSlug === adapter.primaryCategory,
            sortIndex: adapter.sortIndex,
          },
        });
      }
    }
    console.log(`     → Linked to ${adapter.categories.length} categories (primary: ${adapter.primaryCategory})`);

    // Link to connection types
    for (const ctSlug of adapter.connectionTypes) {
      const ct = await prisma.connectionTypeDefinition.findFirst({ where: { slug: ctSlug } });
      if (ct) {
        const supportsDiscovery = ct.supportsDiscovery;
        await prisma.adapterConnectionType.upsert({
          where: { adapterId_connectionTypeId: { adapterId: adapterRecord.id, connectionTypeId: ct.id } },
          update: {
            supportsDiscovery,
            supportsConfiguration: ct.supportsConfiguration,
            supportsDiagnostics: ct.supportsDiagnostics,
          },
          create: {
            adapterId: adapterRecord.id,
            connectionTypeId: ct.id,
            supportsDiscovery,
            supportsConfiguration: ct.supportsConfiguration,
            supportsDiagnostics: ct.supportsDiagnostics,
            sortIndex: ct.sortIndex,
          },
        });
      }
    }
    console.log(`     → Linked to ${adapter.connectionTypes.length} connection types`);
  }

  // ===== Step 5: Verification =====
  console.log("\n📊 Step 5: Verification — Counting seeded definitions...");
  const categoryCount = await prisma.deviceCategory.count({ where: { isActive: true } });
  const capabilityCount = await prisma.capabilityDefinition.count({ where: { isActive: true } });
  const connectionCount = await prisma.connectionTypeDefinition.count({ where: { isActive: true } });
  const adapterCount = await prisma.communicationAdapterDefinition.count({ where: { isActive: true } });
  const categoryCapCount = await prisma.categoryCapability.count();
  const categoryCtCount = await prisma.categoryConnectionType.count();
  const categoryAdapterCount = await prisma.categoryAdapterMapping.count();
  const adapterCtCount = await prisma.adapterConnectionType.count();

  console.log(`   Device Categories:    ${categoryCount}`);
  console.log(`   Capability Defs:      ${capabilityCount}`);
  console.log(`   Connection Type Defs: ${connectionCount}`);
  console.log(`   Adapter Defs:         ${adapterCount}`);
  console.log(`   Category ↔ Capability links:    ${categoryCapCount}`);
  console.log(`   Category ↔ Connection links:    ${categoryCtCount}`);
  console.log(`   Category ↔ Adapter links:       ${categoryAdapterCount}`);
  console.log(`   Adapter ↔ Connection links:     ${adapterCtCount}`);
  console.log(`   Total new records created:      ${totalCreated}`);

  console.log("\n" + "=" .repeat(70));
  console.log("✅ Dr. QBIT Extensible Device Architecture seeding complete!");
  console.log("   🎯 All definitions are DATABASE-DRIVEN — no hardcoded device types.");
  console.log("   🎯 New hardware = new DB entries only. Core engine NEVER modified.");
  console.log("   🎯 Capability-Driven, NOT Device-Type-Specific.");
  console.log("   🎯 Admin adds new device via 7-step onboarding — no code changes.");
  console.log("=" .repeat(70));
}

seedDeviceArchitecture()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
