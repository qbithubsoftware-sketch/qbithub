/**
 * Phase 3 — Safe Seed Script (NON-DESTRUCTIVE, only ADD missing data)
 *
 * Uses UPSERT for slug-based tables and findFirst->create for others.
 * Never overwrites existing records.
 *
 * Run: DATABASE_URL="..." npx tsx scripts/phase3-safe-seed.ts
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: ['warn', 'error'] });

// ============================================================
// KNOWLEDGE CATEGORIES (7)
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
// DOWNLOAD CATEGORIES (6)
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
// OPERATING SYSTEMS (5)
// ============================================================

const OPERATING_SYSTEMS = [
  { name: 'Windows 10', slug: 'win10', icon: 'desktop_windows', sortIndex: 0 },
  { name: 'Windows 11', slug: 'win11', icon: 'desktop_windows', sortIndex: 1 },
  { name: 'Ubuntu 22.04 LTS', slug: 'ubuntu-2204', icon: 'linux', sortIndex: 2 },
  { name: 'Android 11', slug: 'android-11', icon: 'phone_android', sortIndex: 3 },
  { name: 'Android 13', slug: 'android-13', icon: 'phone_android', sortIndex: 4 },
];

// ============================================================
// FAQS (5)
// ============================================================

const FAQS = [
  { question: 'How do I find my QBIT device serial number?', answer: 'Every QBIT device has a serial number printed on a label on the bottom or back of the unit. The serial format varies by model: P80 Alpha uses P80A-XXXXXX, S20 Pro uses S20P-XXXXXX, V3 POS uses V3POS-XXXXXX. You can also find the serial number on the original packaging and purchase invoice. If you cannot locate the serial number, use Dr. QBIT auto-detection to identify your device without a serial number.', sortOrder: 0 },
  { question: 'Can I use QBIT printers with non-QBIT POS systems?', answer: 'Yes. QBIT thermal printers (P80 Alpha, P40, L60) are compatible with most POS systems that support ESC/POS command protocol. This includes popular POS software like QuickBooks POS, Square, Toast, Lightspeed, and many others. Download the appropriate driver from the QBIT Hub Download Center and follow the installation guide for your specific POS system.', sortOrder: 1 },
  { question: 'How do I update firmware on my QBIT device?', answer: 'Firmware updates are available from the QBIT Hub Download Center. Download the firmware file for your specific model, connect the device to your computer via USB, and use the QBIT Configuration Utility to flash the new firmware. Never disconnect the device during a firmware update. The update process typically takes 2-5 minutes. After completion, the device automatically restarts with the new firmware version.', sortOrder: 2 },
  { question: 'What warranty coverage do QBIT products have?', answer: 'All QBIT products come with a standard 12-month warranty covering manufacturing defects and hardware failures under normal use conditions. The warranty does not cover damage from misuse, unauthorized modifications, or natural disasters. Extended warranty and AMC (Annual Maintenance Contract) options are available for enterprise customers. Contact your QBIT dealer or visit /support for warranty claims.', sortOrder: 3 },
  { question: 'My thermal printer is printing blank receipts. What should I do?', answer: 'Blank receipts usually indicate one of these issues: (1) The thermal paper roll is installed upside down — thermal paper has a coating on only one side. Try flipping the roll. (2) The print density is set too low — increase density in driver settings. (3) The print head is dirty — clean with the included cleaning card. (4) The driver is not correctly installed — reinstall the latest driver version from the Download Center.', sortOrder: 4 },
];

// ============================================================
// COMMON ERRORS (8)
// ============================================================

const COMMON_ERRORS = [
  { code: 'ERR_PAPER_OUT', meaning: 'Thermal paper roll is empty', possibleCause: 'Paper roll depleted or not loaded', resolution: 'Replace the paper roll with a compatible QBIT thermal paper roll (80mm or 58mm)', severity: 'warning' },
  { code: 'ERR_COVER_OPEN', meaning: 'Printer top cover is open', possibleCause: 'Cover not closed after paper replacement', resolution: 'Close the printer cover firmly and verify the latch clicks', severity: 'warning' },
  { code: 'ERR_HEAD_OVERTEMP', meaning: 'Print head overheating', possibleCause: 'Continuous high-volume printing without pause', resolution: 'Pause printing for 2 minutes, reduce print density, clean print head', severity: 'error' },
  { code: 'ERR_CUTTER_JAM', meaning: 'Auto-cutter mechanism jammed', possibleCause: 'Paper debris in cutter path', resolution: 'Remove paper debris, press FEED twice to reset cutter', severity: 'warning' },
  { code: 'ERR_USB_DISCONNECT', meaning: 'USB connection lost', possibleCause: 'Cable disconnected or faulty USB port', resolution: 'Reconnect USB cable, try a different USB port, replace cable if damaged', severity: 'error' },
  { code: 'ERR_LAN_TIMEOUT', meaning: 'LAN connection timeout', possibleCause: 'Network connectivity issue or incorrect IP configuration', resolution: 'Verify network cable, check IP settings, test with QBIT Configuration Utility', severity: 'error' },
  { code: 'ERR_BT_PAIR_FAIL', meaning: 'Bluetooth pairing failed', possibleCause: 'Device not in pairing mode or out of range', resolution: 'Ensure printer is powered on and within 5m, enable Bluetooth pairing mode', severity: 'warning' },
  { code: 'ERR_NFC_READ_FAIL', meaning: 'NFC card read failure', possibleCause: 'Card not positioned correctly or incompatible card type', resolution: 'Reposition card on NFC reader surface, verify card compatibility (EMV/NFC)', severity: 'warning' },
];

// ============================================================
// TROUBLESHOOTING ISSUES (2) + Steps
// ============================================================

const TROUBLESHOOTING_ISSUES = [
  {
    title: 'P80 Alpha — Printer Not Detected on USB',
    slug: 'p80-alpha-usb-not-detected',
    symptoms: JSON.stringify(['USB device not recognized by Windows', 'Printer does not appear in device list', 'Driver installer fails to detect printer']),
    causes: JSON.stringify(['Faulty USB cable', 'Wrong USB port (USB 3.0 vs 2.0 compatibility)', 'Driver version mismatch', 'Windows USB power management disabling port']),
    resolution: 'Try a different USB cable, connect to USB 2.0 port directly (not through hub), reinstall latest driver, disable USB power management in Windows Device Manager.',
    difficulty: 'Beginner',
    steps: [
      { stepNumber: 1, title: 'Check Physical Connection', description: 'Verify the USB cable is securely connected to both the printer and the POS terminal. Check for visible damage on the cable.', warning: 'Do not use USB hubs — connect directly to the terminal.' },
      { stepNumber: 2, title: 'Try Different USB Port', description: 'Move the USB connection to a different port on the terminal. Prefer USB 2.0 ports over USB 3.0 for compatibility.', tip: 'USB 2.0 ports are usually black, USB 3.0 are blue.' },
      { stepNumber: 3, title: 'Reinstall Driver', description: 'Download the latest P80 Alpha driver from the QBIT Hub and reinstall. Remove the old driver first via Device Manager.', tip: 'Use the QBIT Configuration Utility for guided driver installation.' },
      { stepNumber: 4, title: 'Disable USB Power Management', description: 'Open Windows Device Manager > Universal Serial Bus controllers > USB Root Hub > Properties > Power Management tab. Uncheck "Allow the computer to turn off this device to save power".' },
    ],
  },
  {
    title: 'V3 POS — Touchscreen Not Responding',
    slug: 'v3-pos-touchscreen-unresponsive',
    symptoms: JSON.stringify(['Touch inputs not registering', 'Touch offset or misalignment', 'Touchscreen works intermittently']),
    causes: JSON.stringify(['Touch calibration drift', 'Screen protector interference', 'Driver conflict with other HID devices', 'Physical damage to touch sensor']),
    resolution: 'Run touch calibration utility (QBIT Config Tool > Touch Calibration), remove any screen protector, check for HID device conflicts in Device Manager.',
    difficulty: 'Intermediate',
    steps: [
      { stepNumber: 1, title: 'Run Touch Calibration', description: 'Open the QBIT Configuration Utility and navigate to Touch Calibration. Follow the on-screen calibration points (typically 4 or 9 point calibration).', tip: 'Use a stylus for precise calibration points.' },
      { stepNumber: 2, title: 'Remove Screen Protector', description: 'If a screen protector is installed, remove it temporarily and test touch response. Some thick protectors interfere with touch sensitivity.', warning: 'Do not use abrasive cleaners on the touchscreen surface.' },
      { stepNumber: 3, title: 'Check HID Device Conflicts', description: 'Open Device Manager and check for multiple HID-compliant devices under Human Interface Devices. Disable any conflicting devices (e.g., touchscreen emulator software).' },
    ],
  },
];

// ============================================================
// INSTALLATION GUIDES (4) + Steps
// ============================================================

const INSTALLATION_GUIDES = [
  {
    title: 'P80 Alpha Thermal Printer Setup', slug: 'p80-alpha-setup', product: 'P80 Alpha', category: 'Thermal Printer', estimatedTime: 15, difficulty: 'Beginner', version: 'v2.3.1',
    description: 'Complete setup guide for the P80 Alpha thermal printer including USB and LAN connection, driver installation, and test printing.',
    featured: true, latest: true,
    steps: [
      { stepNumber: 1, title: 'Unpack and Connect', description: 'Unpack the P80 Alpha, connect the power adapter, and plug in the USB or LAN cable to your POS terminal.', estimatedTime: 3 },
      { stepNumber: 2, title: 'Install Driver', description: 'Download the P80 Alpha Universal Driver from the QBIT Hub Download Center. Run the installer and follow the prompts.', estimatedTime: 5 },
      { stepNumber: 3, title: 'Configure Connection', description: 'In the driver configuration, select USB or LAN connection type. For LAN, set the IP address and port number.', estimatedTime: 3 },
      { stepNumber: 4, title: 'Test Print', description: 'Use the QBIT Configuration Utility to print a test page. Verify print quality, alignment, and auto-cutter operation.', estimatedTime: 2 },
      { stepNumber: 5, title: 'Load Paper Roll', description: 'Open the printer cover, insert an 80mm thermal paper roll, and close the cover. The auto-cutter will trim the leading edge.', estimatedTime: 2 },
    ],
  },
  {
    title: 'V3 POS Machine Installation', slug: 'v3-pos-installation', product: 'V3 POS', category: 'Windows POS', estimatedTime: 45, difficulty: 'Intermediate', version: 'v1.5.2',
    description: 'Full installation guide for the V3 POS machine: first boot, peripheral setup, driver installation, and network configuration.',
    featured: true, latest: true,
    steps: [
      { stepNumber: 1, title: 'First Boot Setup', description: 'Connect the V3 to power and turn on. Complete Windows initial setup: language, admin account, device role selection.', estimatedTime: 10 },
      { stepNumber: 2, title: 'Internal Printer Configuration', description: 'Use QBIT Configuration Utility to detect and configure the built-in 80mm thermal printer. Print a test receipt.', estimatedTime: 5 },
      { stepNumber: 3, title: 'Connect External Peripherals', description: 'Connect barcode scanner (USB HID), cash drawer (RJ11), and customer display (USB/RS232). Test each peripheral.', estimatedTime: 10 },
      { stepNumber: 4, title: 'Network Configuration', description: 'Configure Ethernet or Wi-Fi connection. Set static IP for reliable POS operation. Test internet connectivity.', estimatedTime: 10 },
      { stepNumber: 5, title: 'Install POS Application', description: 'Install your POS application software. Configure printer, scanner, and cash drawer settings within the POS app.', estimatedTime: 10 },
    ],
  },
  {
    title: 'AP5 Android POS Setup', slug: 'ap5-android-pos-setup', product: 'AP5', category: 'Android POS', estimatedTime: 30, difficulty: 'Intermediate', version: 'v1.0.0',
    description: 'Setup guide for the AP5 Android POS terminal: initial configuration, app installation, Bluetooth/Wi-Fi pairing, and payment setup.',
    featured: true, latest: true,
    steps: [
      { stepNumber: 1, title: 'Power On and Initial Setup', description: 'Charge the AP5 fully, then power on. Complete Android initial setup: language, Wi-Fi, Google account.', estimatedTime: 5 },
      { stepNumber: 2, title: 'Install QBIT POS App', description: 'Download the QBIT POS application from the Google Play Store or via the pre-installed QBIT Hub app.', estimatedTime: 5 },
      { stepNumber: 3, title: 'Pair Bluetooth Printer', description: 'Open Settings > Bluetooth, scan for the P40 Portable Printer, and pair. The QBIT POS app will auto-detect.', estimatedTime: 5 },
      { stepNumber: 4, title: 'Configure Wi-Fi Network', description: 'Connect to your business Wi-Fi network. Verify the AP5 can reach the QBIT Hub cloud services.', estimatedTime: 5 },
      { stepNumber: 5, title: 'Payment Setup', description: 'Configure NFC payment processing. Insert SIM card for 4G backup connectivity. Test a transaction.', estimatedTime: 10 },
    ],
  },
  {
    title: 'L60 Label Printer Setup', slug: 'l60-label-printer-setup', product: 'L60', category: 'Label Printer', estimatedTime: 20, difficulty: 'Beginner', version: 'v2.0.1',
    description: 'Setup guide for the L60 label printer: media loading, driver installation, label calibration, and first print test.',
    featured: false, latest: true,
    steps: [
      { stepNumber: 1, title: 'Load Label Media', description: 'Open the L60 media cover. Insert label roll (max 100mm width). Thread the labels through the sensor path and close the cover.', estimatedTime: 5, warning: 'Ensure the label sensor is aligned with the black mark on the label backing.' },
      { stepNumber: 2, title: 'Install Driver', description: 'Download the L60 Label Printer Driver from the QBIT Hub. Install and select connection type (USB, LAN, or Wi-Fi).', estimatedTime: 5 },
      { stepNumber: 3, title: 'Calibrate Labels', description: 'Use the QBIT Configuration Utility to run label calibration. The printer will feed a few labels to detect the gap/mark position.', estimatedTime: 3 },
      { stepNumber: 4, title: 'Test Print', description: 'Print a test label using the Configuration Utility. Verify barcode readability, text clarity, and label alignment.', estimatedTime: 5, tip: 'Use Label Shop software for designing custom labels.' },
    ],
  },
];

// ============================================================
// ANNOUNCEMENT (1)
// ============================================================

const ANNOUNCEMENT = {
  title: 'Welcome to QBIT Hub Enterprise Support Portal',
  body: 'Your comprehensive resource for drivers, firmware, manuals, installation guides, and Dr. QBIT diagnostics. Browse our product catalog, search by serial number, or use Dr. QBIT to auto-detect your connected hardware.',
  type: 'info',
  severity: 'info',
  visibility: 'public',
  active: true,
};

// ============================================================
// DEVICE CATEGORIES (13) — from seed-device-architecture.ts
// ============================================================

const DEVICE_CATEGORIES = [
  { slug: "thermal-printer", name: "Thermal Receipt Printer", description: "Direct thermal and thermal transfer receipt printers for retail, hospitality, and banking. Supports 58mm/80mm paper width with auto-cutter capability.", icon: "print", productFamily: "Printers", supportedInterfaces: JSON.stringify(["usb", "lan", "wifi", "bluetooth", "serial"]), defaultProtocol: "ESC/POS", supportedOS: JSON.stringify(["windows", "android", "linux"]), sortIndex: 0, isActive: true, isPublic: true, status: "active" },
  { slug: "barcode-printer", name: "Barcode Printer", description: "Thermal transfer and direct thermal barcode label printers for shipping, inventory, and asset tracking.", icon: "qr_code_2", productFamily: "Printers", supportedInterfaces: JSON.stringify(["usb", "lan", "wifi", "bluetooth", "serial"]), defaultProtocol: "ZPL", supportedOS: JSON.stringify(["windows", "android", "linux"]), sortIndex: 1, isActive: true, isPublic: true, status: "active" },
  { slug: "portable-bluetooth-printer", name: "Portable Bluetooth Printer", description: "Battery-powered portable receipt printers with Bluetooth connectivity for mobile receipt printing.", icon: "print", productFamily: "Printers", supportedInterfaces: JSON.stringify(["bluetooth", "usb", "wifi"]), defaultProtocol: "ESC/POS", supportedOS: JSON.stringify(["android", "windows"]), sortIndex: 2, isActive: true, isPublic: true, status: "active" },
  { slug: "label-printer", name: "Label Printer", description: "Dedicated label printers for product labels, shipping labels, barcode labels, and name tags.", icon: "label", productFamily: "Printers", supportedInterfaces: JSON.stringify(["usb", "lan", "wifi", "bluetooth"]), defaultProtocol: "ESC/POS", supportedOS: JSON.stringify(["windows", "android", "linux"]), sortIndex: 3, isActive: true, isPublic: true, status: "active" },
  { slug: "android-pos", name: "Android POS", description: "Android-based Point-of-Sale terminals with integrated printer, touchscreen, and payment processing.", icon: "phone_android", productFamily: "POS Systems", supportedInterfaces: JSON.stringify(["wifi", "lan", "bluetooth", "usb"]), defaultProtocol: "Android SDK", supportedOS: JSON.stringify(["android"]), sortIndex: 4, isActive: true, isPublic: true, status: "active" },
  { slug: "windows-pos", name: "Windows POS", description: "Windows-based Point-of-Sale terminals with integrated printer, touchscreen, and OPOS/JPOS driver support.", icon: "desktop_windows", productFamily: "POS Systems", supportedInterfaces: JSON.stringify(["usb", "lan", "wifi", "serial", "bluetooth"]), defaultProtocol: "OPOS/JPOS", supportedOS: JSON.stringify(["windows"]), sortIndex: 5, isActive: true, isPublic: true, status: "active" },
  { slug: "barcode-scanner", name: "Barcode Scanner", description: "Handheld and fixed-mount barcode scanners for 1D/2D barcode reading.", icon: "barcode_scanner", productFamily: "Scanners", supportedInterfaces: JSON.stringify(["usb", "bluetooth", "wifi", "serial"]), defaultProtocol: "HID", supportedOS: JSON.stringify(["windows", "android", "linux"]), sortIndex: 6, isActive: true, isPublic: true, status: "active" },
  { slug: "customer-display", name: "Customer Display", description: "Secondary customer-facing displays for showing transaction amounts and promotional content.", icon: "monitor", productFamily: "Peripherals", supportedInterfaces: JSON.stringify(["usb", "serial", "lan"]), defaultProtocol: "ESC/POS Display", supportedOS: JSON.stringify(["windows", "android"]), sortIndex: 7, isActive: true, isPublic: true, status: "active" },
  { slug: "cash-drawer", name: "Cash Drawer", description: "Electronic cash drawers triggered by printer or POS commands.", icon: "point_of_sale", productFamily: "Peripherals", supportedInterfaces: JSON.stringify(["usb", "serial"]), defaultProtocol: "Solenoid Kick", supportedOS: JSON.stringify(["windows", "android"]), sortIndex: 8, isActive: true, isPublic: true, status: "active" },
  { slug: "rfid-device", name: "RFID Device", description: "RFID readers and writers for asset tracking, access control, and contactless payment.", icon: "nfc", productFamily: "Scanners", supportedInterfaces: JSON.stringify(["usb", "bluetooth", "wifi", "lan", "serial"]), defaultProtocol: "RFID Protocol", supportedOS: JSON.stringify(["windows", "android", "linux"]), sortIndex: 9, isActive: true, isPublic: true, status: "active" },
  { slug: "kitchen-printer", name: "Kitchen Printer", description: "Impact dot matrix printers for kitchen order printing. Heat-resistant for food service environments.", icon: "restaurant", productFamily: "Printers", supportedInterfaces: JSON.stringify(["usb", "lan", "wifi", "serial"]), defaultProtocol: "ESC/POS", supportedOS: JSON.stringify(["windows", "android"]), sortIndex: 10, isActive: true, isPublic: true, status: "active" },
  { slug: "kiosk", name: "Kiosk", description: "Self-service kiosk terminals for ticket printing, bill payment, self-ordering, and information display.", icon: "storefront", productFamily: "POS Systems", supportedInterfaces: JSON.stringify(["usb", "lan", "wifi", "serial"]), defaultProtocol: "Kiosk SDK", supportedOS: JSON.stringify(["windows", "android"]), sortIndex: 11, isActive: true, isPublic: true, status: "active" },
  { slug: "weighing-scale", name: "Weighing Scale", description: "Digital weighing scales with serial/USB connectivity for retail, grocery, and logistics.", icon: "scale", productFamily: "Peripherals", supportedInterfaces: JSON.stringify(["usb", "serial", "bluetooth"]), defaultProtocol: "Scale Protocol", supportedOS: JSON.stringify(["windows", "android"]), sortIndex: 12, isActive: true, isPublic: true, status: "active" },
];

// ============================================================
// CAPABILITY DEFINITIONS (24) — from seed-device-architecture.ts
// ============================================================

const CAPABILITY_DEFINITIONS = [
  { slug: "usb", name: "USB Connection", description: "Supports USB connection for data transfer and configuration", icon: "usb", capabilityGroup: "connection", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 0, isActive: true },
  { slug: "lan", name: "Ethernet (LAN)", description: "Supports Ethernet/LAN connection via TCP/IP", icon: "lan", capabilityGroup: "connection", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 1, isActive: true },
  { slug: "wifi", name: "Wi-Fi", description: "Supports Wi-Fi wireless connection for network printing", icon: "wifi", capabilityGroup: "connection", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 2, isActive: true },
  { slug: "bluetooth", name: "Bluetooth", description: "Supports Bluetooth BLE/Classic for wireless connectivity", icon: "bluetooth", capabilityGroup: "connection", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 3, isActive: true },
  { slug: "com-serial", name: "Serial (COM)", description: "Supports RS-232 serial port communication", icon: "cable", capabilityGroup: "connection", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 4, isActive: true },
  { slug: "receipt-printing", name: "Receipt Printing", description: "Can print thermal receipts (58mm/80mm paper width)", icon: "receipt_long", capabilityGroup: "printing", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 10, isActive: true },
  { slug: "barcode-printing", name: "Barcode Printing", description: "Can print 1D/2D barcodes (Code128, QR, EAN, etc.)", icon: "barcode", capabilityGroup: "printing", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 11, isActive: true },
  { slug: "label-printing", name: "Label Printing", description: "Can print adhesive labels of various sizes", icon: "label", capabilityGroup: "printing", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 12, isActive: true },
  { slug: "kitchen-printing", name: "Kitchen Printing", description: "Can print kitchen orders (impact dot matrix resistant to heat)", icon: "restaurant", capabilityGroup: "printing", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 13, isActive: true },
  { slug: "auto-cutter", name: "Auto Cutter", description: "Has automatic paper cutting mechanism", icon: "content_cut", capabilityGroup: "hardware", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 20, isActive: true },
  { slug: "cash-drawer", name: "Cash Drawer Kick", description: "Can trigger cash drawer opening via printer command", icon: "point_of_sale", capabilityGroup: "hardware", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 21, isActive: true },
  { slug: "scanner-mode", name: "Scanner Mode", description: "Can scan barcodes and QR codes", icon: "barcode_scanner", capabilityGroup: "hardware", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 22, isActive: true },
  { slug: "display-output", name: "Customer Display Output", description: "Can display transaction info to customer on secondary screen", icon: "monitor", capabilityGroup: "hardware", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 23, isActive: true },
  { slug: "rfid-read-write", name: "RFID Read/Write", description: "Can read and write RFID tags and transponders", icon: "nfc", capabilityGroup: "hardware", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 24, isActive: true },
  { slug: "esc-pos-protocol", name: "ESC/POS Protocol", description: "Supports ESC/POS command protocol for printer communication", icon: "code", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 30, isActive: true },
  { slug: "snmp-support", name: "SNMP Support", description: "Supports SNMP protocol for network device monitoring and status queries", icon: "dns", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: false, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 31, isActive: true },
  { slug: "firmware-upgrade", name: "Firmware Upgrade", description: "Supports firmware upgrade/update via USB, LAN, or Bluetooth", icon: "system_update", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 32, isActive: true },
  { slug: "configuration-tool", name: "Configuration Tool", description: "Has dedicated configuration tool for device setup and parameter management", icon: "settings", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 33, isActive: true },
  { slug: "health-monitoring", name: "Health Monitoring", description: "Supports continuous health monitoring with real-time status reporting", icon: "health_and_safety", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: false, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 34, isActive: true },
  { slug: "test-print", name: "Test Print", description: "Can execute test print for verification and diagnostics", icon: "print", capabilityGroup: "software", isQbitRelevant: true, affectsDiscovery: false, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 35, isActive: true },
  { slug: "pos-mode", name: "POS Mode", description: "Can operate as a Point-of-Sale terminal for retail transactions", icon: "point_of_sale", capabilityGroup: "pos", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 40, isActive: true },
  { slug: "android-pos", name: "Android POS", description: "Runs Android-based POS software for retail and hospitality", icon: "phone_android", capabilityGroup: "pos", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 41, isActive: true },
  { slug: "windows-pos", name: "Windows POS", description: "Runs Windows-based POS software for retail and hospitality", icon: "desktop_windows", capabilityGroup: "pos", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 42, isActive: true },
  { slug: "weighing-scale", name: "Weighing Scale Interface", description: "Can connect to and read data from weighing scales", icon: "scale", capabilityGroup: "specialized", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 50, isActive: true },
  { slug: "kiosk-mode", name: "Kiosk Mode", description: "Can operate as self-service kiosk terminal", icon: "storefront", capabilityGroup: "specialized", isQbitRelevant: true, affectsDiscovery: true, affectsConfiguration: true, affectsDiagnostics: true, affectsLifecycle: true, sortIndex: 51, isActive: true },
];

// ============================================================
// CONNECTION TYPE DEFINITIONS (6) — from seed-device-architecture.ts
// ============================================================

const CONNECTION_TYPE_DEFINITIONS = [
  { slug: "usb", name: "USB", description: "Universal Serial Bus — direct wired connection for printers, scanners, and POS devices", icon: "usb", protocol: "USB", supportsDiscovery: true, requiresDesktopAgent: false, supportsConfiguration: true, supportsDiagnostics: true, sortIndex: 0, isActive: true },
  { slug: "bluetooth", name: "Bluetooth", description: "Bluetooth Low Energy (BLE) and Classic Bluetooth for portable printers and wireless peripherals", icon: "bluetooth", protocol: "BLE", supportsDiscovery: true, requiresDesktopAgent: false, supportsConfiguration: true, supportsDiagnostics: true, sortIndex: 1, isActive: true },
  { slug: "lan", name: "Ethernet (LAN)", description: "Local Area Network via TCP/IP — for network printers, POS terminals, and shared devices", icon: "lan", protocol: "TCP/IP", supportsDiscovery: true, requiresDesktopAgent: true, supportsConfiguration: true, supportsDiagnostics: true, sortIndex: 2, isActive: true },
  { slug: "wifi", name: "Wi-Fi", description: "802.11 wireless networking — for wireless printer setup and POS connectivity", icon: "wifi", protocol: "802.11", supportsDiscovery: true, requiresDesktopAgent: true, supportsConfiguration: true, supportsDiagnostics: true, sortIndex: 3, isActive: true },
  { slug: "serial", name: "Serial (COM)", description: "RS-232 serial port — legacy connection for impact printers, POS terminals, and industrial devices", icon: "cable", protocol: "RS-232", supportsDiscovery: true, requiresDesktopAgent: true, supportsConfiguration: true, supportsDiagnostics: true, sortIndex: 4, isActive: true },
  { slug: "virtual-port", name: "Virtual Printer Port", description: "Software-emulated printer port — for driver-based virtual printers and cloud print services", icon: "cloud", protocol: "Virtual", supportsDiscovery: false, requiresDesktopAgent: true, supportsConfiguration: true, supportsDiagnostics: false, sortIndex: 5, isActive: true },
];

// ============================================================
// COMMUNICATION ADAPTER DEFINITIONS (11) — from seed-device-architecture.ts
// ============================================================

const COMMUNICATION_ADAPTER_DEFINITIONS = [
  { slug: "thermal-printer-adapter", name: "Thermal Printer Adapter", description: "Adapter for thermal receipt printers — handles ESC/POS protocol, USB/LAN/WiFi/BT/Serial configuration, and printer diagnostics", adapterClass: "ThermalPrinterDiagnosticAdapter", protocol: "ESC/POS", requiresDesktopAgent: false, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 0, isActive: true },
  { slug: "barcode-printer-adapter", name: "Barcode Printer Adapter", description: "Adapter for barcode label printers — handles ZPL/EPL/ESC/POS protocols, label configuration, and barcode print diagnostics", adapterClass: "BarcodePrinterDiagnosticAdapter", protocol: "ZPL", requiresDesktopAgent: false, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 1, isActive: true },
  { slug: "portable-printer-adapter", name: "Portable Printer Adapter", description: "Adapter for portable Bluetooth printers — handles BLE+ESC/POS, battery status, and mobile print diagnostics", adapterClass: "PortablePrinterDiagnosticAdapter", protocol: "BLE+ESC/POS", requiresDesktopAgent: false, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 2, isActive: true },
  { slug: "label-printer-adapter", name: "Label Printer Adapter", description: "Adapter for label printers — handles ESC/POS label commands, label size configuration, and label print diagnostics", adapterClass: "LabelPrinterDiagnosticAdapter", protocol: "ESC/POS Label", requiresDesktopAgent: false, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 3, isActive: true },
  { slug: "android-pos-adapter", name: "Android POS Adapter", description: "Adapter for Android POS terminals — handles Android SDK, integrated printer, scanner, and payment module diagnostics", adapterClass: "AndroidPosDiagnosticAdapter", protocol: "Android SDK", requiresDesktopAgent: false, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 4, isActive: true },
  { slug: "windows-pos-adapter", name: "Windows POS Adapter", description: "Adapter for Windows POS terminals — handles OPOS/JPOS driver interface, integrated hardware diagnostics, and Windows service management", adapterClass: "WindowsPosDiagnosticAdapter", protocol: "OPOS/JPOS", requiresDesktopAgent: true, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 5, isActive: true },
  { slug: "barcode-scanner-adapter", name: "Barcode Scanner Adapter", description: "Adapter for barcode scanners — handles HID/serial protocols, scan engine diagnostics, and decode capability verification", adapterClass: "BarcodeScannerDiagnosticAdapter", protocol: "HID", requiresDesktopAgent: false, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 6, isActive: true },
  { slug: "customer-display-adapter", name: "Customer Display Adapter", description: "Adapter for customer-facing pole/LCD displays — handles ESC/POS display commands, brightness control, and display content management", adapterClass: "CustomerDisplayDiagnosticAdapter", protocol: "ESC/POS Display", requiresDesktopAgent: false, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 7, isActive: true },
  { slug: "cash-drawer-adapter", name: "Cash Drawer Adapter", description: "Adapter for electronic cash drawers — handles solenoid kick commands, drawer status detection, and connectivity diagnostics", adapterClass: "CashDrawerDiagnosticAdapter", protocol: "Solenoid Kick", requiresDesktopAgent: false, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: false, sortIndex: 8, isActive: true },
  { slug: "rfid-device-adapter", name: "RFID Device Adapter", description: "Adapter for RFID readers/writers — handles RFID protocol, tag read/write operations, frequency diagnostics, and antenna calibration", adapterClass: "RfidDeviceDiagnosticAdapter", protocol: "RFID Protocol", requiresDesktopAgent: true, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 9, isActive: true },
  { slug: "kiosk-adapter", name: "Kiosk Adapter", description: "Adapter for self-service kiosk terminals — handles kiosk SDK, integrated printer/scanner/display, and kiosk-specific diagnostics", adapterClass: "KioskDiagnosticAdapter", protocol: "Kiosk SDK", requiresDesktopAgent: true, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 10, isActive: true },
  { slug: "weighing-scale-adapter", name: "Weighing Scale Adapter", description: "Adapter for digital weighing scales — handles scale protocol, weight data reading, calibration, and scale connectivity diagnostics", adapterClass: "WeighingScaleDiagnosticAdapter", protocol: "Scale Protocol", requiresDesktopAgent: true, supportsLiveDiagnostics: true, supportsConfiguration: true, supportsFirmwareOps: true, sortIndex: 11, isActive: true },
];

// ============================================================
// CROSS-REFERENCE MAPPINGS
// ============================================================

const CATEGORY_CAPABILITY_MAP: Record<string, string[]> = {
  "thermal-printer": ["usb", "lan", "wifi", "bluetooth", "com-serial", "receipt-printing", "auto-cutter", "cash-drawer", "esc-pos-protocol", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
  "barcode-printer": ["usb", "lan", "wifi", "bluetooth", "com-serial", "barcode-printing", "label-printing", "esc-pos-protocol", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
  "portable-bluetooth-printer": ["bluetooth", "usb", "wifi", "receipt-printing", "auto-cutter", "esc-pos-protocol", "firmware-upgrade", "health-monitoring", "test-print"],
  "label-printer": ["usb", "lan", "wifi", "bluetooth", "label-printing", "barcode-printing", "esc-pos-protocol", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
  "android-pos": ["wifi", "lan", "bluetooth", "usb", "receipt-printing", "cash-drawer", "scanner-mode", "pos-mode", "android-pos", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
  "windows-pos": ["usb", "lan", "wifi", "com-serial", "bluetooth", "receipt-printing", "cash-drawer", "scanner-mode", "display-output", "pos-mode", "windows-pos", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print", "snmp-support"],
  "barcode-scanner": ["usb", "bluetooth", "wifi", "com-serial", "scanner-mode", "firmware-upgrade", "configuration-tool", "health-monitoring"],
  "customer-display": ["usb", "com-serial", "lan", "display-output", "esc-pos-protocol", "firmware-upgrade", "configuration-tool", "health-monitoring"],
  "cash-drawer": ["usb", "com-serial", "cash-drawer", "firmware-upgrade", "configuration-tool", "health-monitoring"],
  "rfid-device": ["usb", "bluetooth", "wifi", "lan", "com-serial", "rfid-read-write", "firmware-upgrade", "configuration-tool", "health-monitoring"],
  "kitchen-printer": ["usb", "lan", "wifi", "com-serial", "kitchen-printing", "receipt-printing", "auto-cutter", "cash-drawer", "esc-pos-protocol", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
  "kiosk": ["usb", "lan", "wifi", "com-serial", "receipt-printing", "scanner-mode", "display-output", "cash-drawer", "kiosk-mode", "firmware-upgrade", "configuration-tool", "health-monitoring", "test-print"],
  "weighing-scale": ["usb", "com-serial", "bluetooth", "weighing-scale", "firmware-upgrade", "configuration-tool", "health-monitoring"],
};

const CATEGORY_CONNECTION_TYPE_MAP: Record<string, string[]> = {
  "thermal-printer": ["usb", "lan", "wifi", "bluetooth", "serial"],
  "barcode-printer": ["usb", "lan", "wifi", "bluetooth", "serial"],
  "portable-bluetooth-printer": ["bluetooth", "usb", "wifi"],
  "label-printer": ["usb", "lan", "wifi", "bluetooth"],
  "android-pos": ["wifi", "lan", "bluetooth", "usb"],
  "windows-pos": ["usb", "lan", "wifi", "serial", "bluetooth"],
  "barcode-scanner": ["usb", "bluetooth", "wifi", "serial"],
  "customer-display": ["usb", "serial", "lan"],
  "cash-drawer": ["usb", "serial"],
  "rfid-device": ["usb", "bluetooth", "wifi", "lan", "serial"],
  "kitchen-printer": ["usb", "lan", "wifi", "serial"],
  "kiosk": ["usb", "lan", "wifi", "serial"],
  "weighing-scale": ["usb", "serial", "bluetooth"],
};

const CATEGORY_ADAPTER_MAP: Record<string, { adapters: string[], primary: string }> = {
  "thermal-printer": { adapters: ["thermal-printer-adapter"], primary: "thermal-printer-adapter" },
  "barcode-printer": { adapters: ["barcode-printer-adapter"], primary: "barcode-printer-adapter" },
  "portable-bluetooth-printer": { adapters: ["portable-printer-adapter"], primary: "portable-printer-adapter" },
  "label-printer": { adapters: ["label-printer-adapter"], primary: "label-printer-adapter" },
  "android-pos": { adapters: ["android-pos-adapter"], primary: "android-pos-adapter" },
  "windows-pos": { adapters: ["windows-pos-adapter"], primary: "windows-pos-adapter" },
  "barcode-scanner": { adapters: ["barcode-scanner-adapter"], primary: "barcode-scanner-adapter" },
  "customer-display": { adapters: ["customer-display-adapter"], primary: "customer-display-adapter" },
  "cash-drawer": { adapters: ["cash-drawer-adapter"], primary: "cash-drawer-adapter" },
  "rfid-device": { adapters: ["rfid-device-adapter"], primary: "rfid-device-adapter" },
  "kitchen-printer": { adapters: ["thermal-printer-adapter"], primary: "thermal-printer-adapter" },
  "kiosk": { adapters: ["kiosk-adapter"], primary: "kiosk-adapter" },
  "weighing-scale": { adapters: ["weighing-scale-adapter"], primary: "weighing-scale-adapter" },
};

const ADAPTER_CONNECTION_TYPE_MAP: Record<string, string[]> = {
  "thermal-printer-adapter": ["usb", "lan", "wifi", "bluetooth", "serial"],
  "barcode-printer-adapter": ["usb", "lan", "wifi", "bluetooth", "serial"],
  "portable-printer-adapter": ["bluetooth", "usb", "wifi"],
  "label-printer-adapter": ["usb", "lan", "wifi", "bluetooth"],
  "android-pos-adapter": ["wifi", "lan", "bluetooth", "usb"],
  "windows-pos-adapter": ["usb", "lan", "wifi", "serial", "bluetooth"],
  "barcode-scanner-adapter": ["usb", "bluetooth", "wifi", "serial"],
  "customer-display-adapter": ["usb", "serial", "lan"],
  "cash-drawer-adapter": ["usb", "serial"],
  "rfid-device-adapter": ["usb", "bluetooth", "wifi", "lan", "serial"],
  "kiosk-adapter": ["usb", "lan", "wifi", "serial"],
  "weighing-scale-adapter": ["usb", "serial", "bluetooth"],
};

async function main() {
  console.log('=== Phase 3: Safe Seed (NON-DESTRUCTIVE) ===\n');
  let totalCreated = 0;

  // 1. Knowledge Categories — UPSERT by slug
  console.log('1. Knowledge Categories...');
  const kCatIds: Record<string, string> = {};
  for (const cat of KNOWLEDGE_CATEGORIES) {
    const record = await db.knowledgeCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    kCatIds[cat.slug] = record.id;
  }
  console.log(`   ✓ ${KNOWLEDGE_CATEGORIES.length} knowledge categories`);

  // 2. Download Categories — UPSERT by slug
  console.log('2. Download Categories...');
  for (const cat of DOWNLOAD_CATEGORIES) {
    await db.downloadCategory.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  console.log(`   ✓ ${DOWNLOAD_CATEGORIES.length} download categories`);

  // 3. Operating Systems — UPSERT by slug
  console.log('3. Operating Systems...');
  for (const os of OPERATING_SYSTEMS) {
    await db.operatingSystem.upsert({ where: { slug: os.slug }, update: {}, create: os });
  }
  console.log(`   ✓ ${OPERATING_SYSTEMS.length} operating systems`);

  // 4. Knowledge Articles — findFirst→create by slug
  console.log('4. Knowledge Articles...');
  const articlesData = [
    { title: 'How to Install the P80 Alpha Thermal Printer on Windows', slug: 'p80-alpha-windows-installation', excerpt: 'Step-by-step guide for setting up the P80 Alpha thermal printer on Windows 10/11.', content: JSON.stringify({ sections: [{ title: 'Prerequisites', content: 'Before starting, ensure you have: the P80 Alpha thermal printer, a USB cable or LAN cable, the P80 Alpha driver installer (v2.3.1), and Windows 10 or 11.' }, { title: 'Step 1: Physical Connection', content: 'Connect the P80 Alpha to your POS terminal using either USB or LAN cable.' }, { title: 'Step 2: Driver Installation', content: 'Download the P80 Alpha Universal Driver (v2.3.1) from the QBIT Hub Download Center.' }, { title: 'Step 3: Print Test', content: 'Open the QBIT Configuration Utility and click "Print Test Page."' }, { title: 'Troubleshooting', content: 'If printer not detected: verify cable, check LED, ensure correct driver.' }] }), categoryId: kCatIds['installation'], author: 'QBIT Technical Team', readingTime: 8, difficulty: 'Beginner', featured: true, popular: true, publishedAt: new Date('2025-01-20') },
    { title: 'P80 Alpha LAN Setup Guide', slug: 'p80-alpha-lan-setup', excerpt: 'Configure the P80 Alpha thermal printer for LAN network printing.', content: JSON.stringify({ sections: [{ title: 'Overview', content: 'The P80 Alpha supports LAN connectivity for shared printing.' }, { title: 'Network Configuration', content: 'Use QBIT Configuration Utility to set static IP.' }, { title: 'Driver Port Setup', content: 'Select LAN as connection type, enter IP and port.' }, { title: 'Multi-Terminal Sharing', content: 'Install driver on each terminal with same LAN settings.' }] }), categoryId: kCatIds['networking'], author: 'QBIT Technical Team', readingTime: 6, difficulty: 'Intermediate', featured: false, popular: true, publishedAt: new Date('2025-01-22') },
    { title: 'V3 POS Machine — First Boot and Windows Setup', slug: 'v3-pos-first-boot-setup', excerpt: 'Complete guide for the V3 POS machine first boot and peripheral configuration.', content: JSON.stringify({ sections: [{ title: 'Overview', content: 'The V3 ships with Windows 10 IoT Enterprise pre-installed.' }, { title: 'First Boot', content: 'Complete Windows initial setup wizard.' }, { title: 'Built-in Printer', content: 'Use QBIT Configuration Utility for internal printer.' }, { title: 'External Peripherals', content: 'Connect scanner, cash drawer, customer display.' }, { title: 'Network Configuration', content: 'Configure Ethernet or Wi-Fi, set static IP.' }] }), categoryId: kCatIds['installation'], author: 'QBIT Technical Team', readingTime: 15, difficulty: 'Intermediate', featured: true, popular: true, publishedAt: new Date('2025-01-25') },
    { title: 'AP5 Android POS — Bluetooth and Wi-Fi Setup', slug: 'ap5-android-pos-connectivity', excerpt: 'Configure the AP5 Android POS terminal for Bluetooth and Wi-Fi.', content: JSON.stringify({ sections: [{ title: 'Bluetooth Printer Pairing', content: 'Open Settings > Bluetooth, scan and pair P40.' }, { title: 'Wi-Fi Network Setup', content: 'Connect to business Wi-Fi network.' }, { title: '4G LTE Configuration', content: 'Insert SIM card for backup connectivity.' }] }), categoryId: kCatIds['networking'], author: 'QBIT Technical Team', readingTime: 10, difficulty: 'Beginner', featured: false, popular: true, publishedAt: new Date('2025-01-28') },
    { title: 'Common Thermal Printer Error Codes and Solutions', slug: 'thermal-printer-error-codes', excerpt: 'Reference guide for thermal printer error codes and resolutions.', content: JSON.stringify({ sections: [{ title: 'Error Code Reference', content: 'ERR_PAPER_OUT, ERR_COVER_OPEN, ERR_HEAD_TEMP, ERR_CUTTER_JAM.' }, { title: 'Print Quality Issues', content: 'Faded prints, black streaks, misaligned text solutions.' }] }), categoryId: kCatIds['troubleshooting'], author: 'QBIT Technical Team', readingTime: 5, difficulty: 'Beginner', featured: true, popular: true, publishedAt: new Date('2025-02-01') },
    { title: 'How to Use Dr. QBIT for Auto Device Detection', slug: 'dr-qbit-auto-detection-guide', excerpt: 'Learn how Dr. QBIT automatically identifies connected POS hardware.', content: JSON.stringify({ sections: [{ title: 'What is Dr. QBIT?', content: 'AI-powered diagnostic system that detects connected QBIT hardware.' }, { title: 'Using Dr. QBIT', content: 'Navigate to /dr-qbit and click Scan Hardware.' }, { title: 'Serial Number Lookup', content: 'Manual lookup by serial number.' }] }), categoryId: kCatIds['products'], author: 'QBIT Technical Team', readingTime: 4, difficulty: 'Beginner', featured: true, popular: true, publishedAt: new Date('2025-02-05') },
  ];
  for (const article of articlesData) {
    const existing = await db.knowledgeArticle.findFirst({ where: { slug: article.slug } });
    if (existing) { console.log(`   SKIP: "${article.slug}"`); continue; }
    try { await db.knowledgeArticle.create({ data: article }); console.log(`   CREATE: "${article.slug}"`); totalCreated++; } catch (e: any) { console.log(`   WARN: "${article.slug}" - ${e.message}`); }
  }

  // 5. FAQs — findFirst→create
  console.log('5. FAQs...');
  for (const faq of FAQS) {
    const existing = await db.FAQ.findFirst({ where: { question: faq.question } });
    if (existing) continue;
    try { await db.FAQ.create({ data: faq }); totalCreated++; } catch (e: any) { console.log(`   WARN: FAQ - ${e.message}`); }
  }
  console.log(`   ✓ FAQs done`);

  // 6. Common Errors — UPSERT by code
  console.log('6. Common Errors...');
  for (const ec of COMMON_ERRORS) {
    await db.commonError.upsert({ where: { code: ec.code }, update: {}, create: ec });
  }
  console.log(`   ✓ ${COMMON_ERRORS.length} common errors`);

  // 7. Troubleshooting Issues + Steps
  console.log('7. Troubleshooting Issues + Steps...');
  for (const issue of TROUBLESHOOTING_ISSUES) {
    const record = await db.troubleshootingIssue.upsert({
      where: { slug: issue.slug },
      update: {},
      create: { title: issue.title, slug: issue.slug, symptoms: issue.symptoms, causes: issue.causes, resolution: issue.resolution, difficulty: issue.difficulty },
    });
    for (const step of issue.steps) {
      const existingStep = await db.troubleshootingStep.findFirst({ where: { issueId: record.id, stepNumber: step.stepNumber } });
      if (existingStep) continue;
      await db.troubleshootingStep.create({ data: { issueId: record.id, stepNumber: step.stepNumber, title: step.title, description: step.description, warning: step.warning || null, tip: step.tip || null } });
      totalCreated++;
    }
  }
  console.log(`   ✓ 2 troubleshooting issues + steps`);

  // 8. Installation Guides + Steps — findFirst→create by slug
  console.log('8. Installation Guides + Steps...');
  for (const guide of INSTALLATION_GUIDES) {
    let guideId: string;
    const existing = await db.installationGuide.findFirst({ where: { slug: guide.slug } });
    if (existing) {
      guideId = existing.id;
    } else {
      const record = await db.installationGuide.create({ data: { title: guide.title, slug: guide.slug, product: guide.product, category: guide.category, estimatedTime: guide.estimatedTime, difficulty: guide.difficulty, version: guide.version, description: guide.description, featured: guide.featured, latest: guide.latest } });
      guideId = record.id;
      totalCreated++;
    }
    for (const step of guide.steps) {
      const existingStep = await db.installationStep.findFirst({ where: { guideId: guideId, stepNumber: step.stepNumber } });
      if (existingStep) continue;
      await db.installationStep.create({ data: { guideId, stepNumber: step.stepNumber, title: step.title, description: step.description, estimatedTime: step.estimatedTime || 5, warning: step.warning || null, tip: step.tip || null } });
      totalCreated++;
    }
  }
  console.log(`   ✓ 4 installation guides + steps`);

  // 9. Announcement — findFirst→create
  console.log('9. Announcement...');
  const existingAnn = await db.announcement.findFirst({ where: { title: ANNOUNCEMENT.title } });
  if (!existingAnn) {
    await db.announcement.create({ data: ANNOUNCEMENT });
    totalCreated++;
    console.log('   ✓ CREATE: Announcement');
  } else { console.log('   ✓ SKIP: Announcement exists'); }

  // 10. Device Categories — UPSERT by slug
  console.log('10. Device Categories...');
  const catIds: Record<string, string> = {};
  for (const cat of DEVICE_CATEGORIES) {
    const record = await db.deviceCategory.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
    catIds[cat.slug] = record.id;
  }
  console.log(`   ✓ ${DEVICE_CATEGORIES.length} device categories`);

  // 11. Capability Definitions — UPSERT by slug
  console.log('11. Capability Definitions...');
  const capIds: Record<string, string> = {};
  for (const cap of CAPABILITY_DEFINITIONS) {
    const record = await db.capabilityDefinition.upsert({ where: { slug: cap.slug }, update: {}, create: cap });
    capIds[cap.slug] = record.id;
  }
  console.log(`   ✓ ${CAPABILITY_DEFINITIONS.length} capability definitions`);

  // 12. Connection Type Definitions — UPSERT by slug
  console.log('12. Connection Type Definitions...');
  const ctIds: Record<string, string> = {};
  for (const ct of CONNECTION_TYPE_DEFINITIONS) {
    const record = await db.connectionTypeDefinition.upsert({ where: { slug: ct.slug }, update: {}, create: ct });
    ctIds[ct.slug] = record.id;
  }
  console.log(`   ✓ ${CONNECTION_TYPE_DEFINITIONS.length} connection type definitions`);

  // 13. Communication Adapter Definitions — UPSERT by slug
  console.log('13. Communication Adapter Definitions...');
  const adapterIds: Record<string, string> = {};
  for (const adapter of COMMUNICATION_ADAPTER_DEFINITIONS) {
    const record = await db.communicationAdapterDefinition.upsert({ where: { slug: adapter.slug }, update: {}, create: adapter });
    adapterIds[adapter.slug] = record.id;
  }
  console.log(`   ✓ ${COMMUNICATION_ADAPTER_DEFINITIONS.length} communication adapter definitions`);

  // 14. Category ↔ Capability
  console.log('14. Category ↔ Capability mappings...');
  for (const [catSlug, capSlugs] of Object.entries(CATEGORY_CAPABILITY_MAP)) {
    const categoryId = catIds[catSlug]; if (!categoryId) continue;
    for (const capSlug of capSlugs) {
      const capabilityId = capIds[capSlug]; if (!capabilityId) continue;
      const existing = await db.categoryCapability.findFirst({ where: { categoryId, capabilityId } });
      if (existing) continue;
      await db.categoryCapability.create({ data: { categoryId, capabilityId, isDefault: true, sortIndex: CAPABILITY_DEFINITIONS.find(c => c.slug === capSlug)?.sortIndex || 0 } });
      totalCreated++;
    }
  }

  // 15. Category ↔ ConnectionType
  console.log('15. Category ↔ ConnectionType mappings...');
  for (const [catSlug, ctSlugs] of Object.entries(CATEGORY_CONNECTION_TYPE_MAP)) {
    const categoryId = catIds[catSlug]; if (!categoryId) continue;
    for (const ctSlug of ctSlugs) {
      const connectionTypeId = ctIds[ctSlug]; if (!connectionTypeId) continue;
      const existing = await db.categoryConnectionType.findFirst({ where: { categoryId, connectionTypeId } });
      if (existing) continue;
      await db.categoryConnectionType.create({ data: { categoryId, connectionTypeId, isDefault: true, sortIndex: CONNECTION_TYPE_DEFINITIONS.find(c => c.slug === ctSlug)?.sortIndex || 0 } });
      totalCreated++;
    }
  }

  // 16. Category ↔ Adapter
  console.log('16. Category ↔ Adapter mappings...');
  for (const [catSlug, mapping] of Object.entries(CATEGORY_ADAPTER_MAP)) {
    const categoryId = catIds[catSlug]; if (!categoryId) continue;
    for (const adapterSlug of mapping.adapters) {
      const adapterId = adapterIds[adapterSlug]; if (!adapterId) continue;
      const existing = await db.categoryAdapterMapping.findFirst({ where: { categoryId, adapterId } });
      if (existing) continue;
      await db.categoryAdapterMapping.create({ data: { categoryId, adapterId, isPrimary: adapterSlug === mapping.primary, sortIndex: COMMUNICATION_ADAPTER_DEFINITIONS.find(a => a.slug === adapterSlug)?.sortIndex || 0 } });
      totalCreated++;
    }
  }

  // 17. Adapter ↔ ConnectionType
  console.log('17. Adapter ↔ ConnectionType mappings...');
  for (const [adapterSlug, ctSlugs] of Object.entries(ADAPTER_CONNECTION_TYPE_MAP)) {
    const adapterId = adapterIds[adapterSlug]; if (!adapterId) continue;
    for (const ctSlug of ctSlugs) {
      const connectionTypeId = ctIds[ctSlug]; if (!connectionTypeId) continue;
      const existing = await db.adapterConnectionType.findFirst({ where: { adapterId, connectionTypeId } });
      if (existing) continue;
      const ctDef = CONNECTION_TYPE_DEFINITIONS.find(c => c.slug === ctSlug);
      await db.adapterConnectionType.create({ data: { adapterId, connectionTypeId, supportsDiscovery: ctDef?.supportsDiscovery || false, supportsConfiguration: ctDef?.supportsConfiguration || true, supportsDiagnostics: ctDef?.supportsDiagnostics || true, sortIndex: ctDef?.sortIndex || 0 } });
      totalCreated++;
    }
  }

  // VERIFICATION
  console.log('\n=== Phase 3 Verification ===');
  const counts = {
    KnowledgeCategory: await db.knowledgeCategory.count(),
    KnowledgeArticle: await db.knowledgeArticle.count(),
    FAQ: await db.FAQ.count(),
    CommonError: await db.commonError.count(),
    TroubleshootingIssue: await db.troubleshootingIssue.count(),
    TroubleshootingStep: await db.troubleshootingStep.count(),
    InstallationGuide: await db.installationGuide.count(),
    InstallationStep: await db.installationStep.count(),
    DownloadCategory: await db.downloadCategory.count(),
    OperatingSystem: await db.operatingSystem.count(),
    Announcement: await db.announcement.count(),
    DeviceCategory: await db.deviceCategory.count(),
    CapabilityDefinition: await db.capabilityDefinition.count(),
    ConnectionTypeDefinition: await db.connectionTypeDefinition.count(),
    CommunicationAdapterDefinition: await db.communicationAdapterDefinition.count(),
    CategoryCapability: await db.categoryCapability.count(),
    CategoryConnectionType: await db.categoryConnectionType.count(),
    CategoryAdapterMapping: await db.categoryAdapterMapping.count(),
    AdapterConnectionType: await db.adapterConnectionType.count(),
  };
  for (const [table, count] of Object.entries(counts)) { console.log(`   ${table}: ${count}`); }
  console.log(`\n   Total new records created: ${totalCreated}`);
  console.log('\n=== Phase 3 Complete ===');
}

main()
  .catch((e) => { console.error('Phase 3 failed:', e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
