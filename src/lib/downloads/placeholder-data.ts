/**
 * Placeholder data for the Driver Download Center.
 *
 * Static typed values used to render the UI before the backend download
 * service is wired up.  When real data becomes available, replace these
 * exports with API calls that return the same shapes.
 */

import type {
  DownloadItem,
  FeaturedDownloadCard,
  DownloadHistoryEntry,
  OSOption,
  CategoryOption,
  ManualItem,
} from "./types";

// ---------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------

export const OPERATING_SYSTEMS: OSOption[] = [
  { id: "os-win11", name: "Windows 11", slug: "win11", icon: "desktop_windows" },
  { id: "os-win10", name: "Windows 10", slug: "win10", icon: "desktop_windows" },
  { id: "os-win8", name: "Windows 8", slug: "win8", icon: "desktop_windows" },
  { id: "os-linux", name: "Linux", slug: "linux", icon: "terminal" },
  { id: "os-android", name: "Android", slug: "android", icon: "phone_android" },
  { id: "os-macos", name: "macOS", slug: "macos", icon: "laptop_mac" },
];

export const CATEGORIES: CategoryOption[] = [
  { id: "cat-driver", name: "Driver", slug: "driver", icon: "settings_input_component" },
  { id: "cat-firmware", name: "Firmware", slug: "firmware", icon: "memory" },
  { id: "cat-sdk", name: "SDK", slug: "sdk", icon: "code" },
  { id: "cat-utility", name: "Utility", slug: "utility", icon: "build" },
  { id: "cat-manual", name: "Manual", slug: "manual", icon: "menu_book" },
];

export const PRODUCT_FILTER_CHIPS = [
  "All Products",
  "Windows POS",
  "Android POS",
  "Thermal Printer",
  "Barcode Scanner",
  "Kiosks",
] as const;

// ---------------------------------------------------------------------
// Featured bento cards
// ---------------------------------------------------------------------

export const FEATURED_CARDS: FeaturedDownloadCard[] = [
  {
    id: "latest-driver",
    label: "NEW RELEASE",
    title: "Latest Driver",
    description: "Universal Thermal Printer v2.4.1",
    icon: "bolt",
    surface: "bg-qbit-primary text-qbit-on-primary",
    muted: "text-qbit-on-primary/85",
    ctaLabel: "Quick Download",
    downloadId: "thermal-v2-4-0",
  },
  {
    id: "recommended-firmware",
    label: "STABLE BUILD",
    title: "Recommended Firmware",
    description: "HUB-X Series Security Patch",
    icon: "verified",
    iconFilled: true,
    surface: "bg-emerald-600 text-white",
    muted: "text-white/85",
    ctaLabel: "Download",
    downloadId: "pos-firmware-v4-1-2",
  },
  {
    id: "most-downloaded",
    label: "POPULAR",
    title: "Most Downloaded",
    description: "Barcode Scanner SDK v1.9",
    icon: "trending_up",
    surface: "bg-amber-500 text-white",
    muted: "text-white/85",
    ctaLabel: "Download",
    downloadId: "scanner-sdk-android",
  },
];

// ---------------------------------------------------------------------
// Download items (drivers, firmware, SDK, utility)
// ---------------------------------------------------------------------

export const DOWNLOADS: DownloadItem[] = [
  {
    id: "thermal-v2-4-0",
    productId: "prod-hub-x-pro",
    name: "Universal Thermal Printer Driver",
    version: "v2.4.0",
    category: CATEGORIES[0],
    operatingSystems: [OPERATING_SYSTEMS[0], OPERATING_SYSTEMS[1]],
    releaseDate: "Oct 12, 2023",
    fileSize: "12.4 MB",
    fileSizeBytes: 13_001_472,
    storagePath: "drivers/thermal-printer/v2.4.0/hub-x-driver.exe",
    checksum: "sha256:a1b2c3d4e5f6...",
    visibility: "public",
    featured: true,
    latest: true,
    downloadCount: 24100,
    downloadCountLabel: "24.1k",
    description:
      "Universal driver package for all QBIT thermal printer models including the HUB-X Pro series. Supports USB, serial, and network connections.",
    installInstructions:
      "1. Download the driver package.\n2. Run the installer as Administrator.\n3. Connect the printer via USB when prompted.\n4. Windows will detect the device and complete installation.",
    knownIssues:
      "On Windows 10 build 1909, the printer may not be detected after sleep. Workaround: unplug and replug the USB cable.",
    supportedProducts: ["HUB-X Pro", "HUB-X Lite", "TP-800"],
    deviceIcon: "print",
    deviceColor: "text-qbit-primary",
    badge: { label: "Verified Official", variant: "info" },
    previousVersions: [
      {
        version: "v2.3.8",
        releaseDate: "Aug 02, 2023",
        changes: ["Added support for HUB-X Lite", "Improved USB 3.0 stability"],
        bugFixes: ["Fixed paper jam detection on TP-800"],
        isCurrent: false,
      },
      {
        version: "v2.3.5",
        releaseDate: "May 18, 2023",
        changes: ["Initial network printing support"],
        bugFixes: [],
        isCurrent: false,
      },
    ],
  },
  {
    id: "pos-firmware-v4-1-2",
    productId: "prod-pos-2000",
    name: "Advanced POS Terminal Firmware",
    version: "v4.1.2",
    category: CATEGORIES[1],
    operatingSystems: [{ id: "os-embedded", name: "Embedded OS", slug: "embedded", icon: "memory" }],
    releaseDate: "Nov 05, 2023",
    fileSize: "45.8 MB",
    fileSizeBytes: 48_027_981,
    storagePath: "firmware/pos-terminal/v4.1.2/pos-firmware.bin",
    checksum: "sha256:b2c3d4e5f6a1...",
    visibility: "public",
    featured: false,
    latest: true,
    downloadCount: 8200,
    downloadCountLabel: "8.2k",
    description:
      "Critical firmware update for POS-2000 and POS-3000 terminal series. Addresses security vulnerability CVE-2023-5421 and improves battery management.",
    installInstructions:
      "1. Copy the firmware file to a USB drive.\n2. Power off the POS terminal.\n3. Insert the USB drive and power on while holding the Update button.\n4. Wait for the firmware to flash (do not power off).",
    knownIssues: "None reported.",
    supportedProducts: ["POS-2000", "POS-3000"],
    deviceIcon: "terminal",
    deviceColor: "text-qbit-secondary",
    badge: { label: "Critical Update", variant: "error" },
    previousVersions: [
      {
        version: "v4.1.0",
        releaseDate: "Sep 14, 2023",
        changes: ["Battery management improvements"],
        bugFixes: ["Fixed touch calibration drift"],
        isCurrent: false,
      },
      {
        version: "v4.0.2",
        releaseDate: "Jul 01, 2023",
        changes: ["Added dual-display support"],
        bugFixes: [],
        isCurrent: false,
      },
    ],
  },
  {
    id: "scanner-sdk-android",
    productId: "prod-scanner-q",
    name: "Barcode Scanner SDK for Android",
    version: "v1.9",
    category: CATEGORIES[2],
    operatingSystems: [OPERATING_SYSTEMS[4]],
    releaseDate: "Dec 12, 2023",
    fileSize: "128 MB",
    fileSizeBytes: 134_217_728,
    storagePath: "sdk/scanner-android/v1.9/scanner-sdk.zip",
    checksum: "sha256:c3d4e5f6a1b2...",
    visibility: "public",
    featured: false,
    latest: true,
    downloadCount: 18700,
    downloadCountLabel: "18.7k",
    description:
      "Full development kit including libraries, headers, and sample code for integrating Q-series barcode scanners into Android applications.",
    installInstructions:
      "1. Extract the SDK zip to your project directory.\n2. Add the library to your build.gradle dependencies.\n3. Initialize the scanner in your Application class.\n4. See the sample app for usage examples.",
    knownIssues: "Android 14 requires additional runtime permissions. See documentation.",
    supportedProducts: ["Scanner Q-100", "Scanner Q-200", "Scanner Q-300"],
    deviceIcon: "integration_instructions",
    deviceColor: "text-qbit-tertiary",
    badge: { label: "Developer Kit", variant: "neutral" },
    previousVersions: [
      {
        version: "v1.8",
        releaseDate: "Oct 01, 2023",
        changes: ["Added Kotlin extensions", "Improved scanning performance"],
        bugFixes: ["Fixed memory leak on continuous scan mode"],
        isCurrent: false,
      },
    ],
  },
  {
    id: "hub-x-config-utility",
    productId: "prod-hub-x-pro",
    name: "HUB-X Configuration Utility",
    version: "v3.2.1",
    category: CATEGORIES[3],
    operatingSystems: [OPERATING_SYSTEMS[0], OPERATING_SYSTEMS[1], OPERATING_SYSTEMS[5]],
    releaseDate: "Nov 20, 2023",
    fileSize: "8.6 MB",
    fileSizeBytes: 9_017_754,
    storagePath: "utility/hub-x-config/v3.2.1/config-util.exe",
    checksum: "sha256:d4e5f6a1b2c3...",
    visibility: "internal",
    featured: false,
    latest: true,
    downloadCount: 1200,
    downloadCountLabel: "1.2k",
    description:
      "Desktop configuration utility for HUB-X Pro thermal printers. Set up network settings, calibrate print heads, and manage firmware updates.",
    installInstructions:
      "1. Download and run the installer.\n2. Launch the utility.\n3. Connect the printer via USB or network.\n4. Use the Configuration tab to adjust settings.",
    knownIssues: "macOS version requires Rosetta 2 on Apple Silicon.",
    supportedProducts: ["HUB-X Pro", "HUB-X Lite"],
    deviceIcon: "settings_applications",
    deviceColor: "text-qbit-primary",
    badge: { label: "Internal Tool", variant: "warning" },
  },
];

// ---------------------------------------------------------------------
// Download history
// ---------------------------------------------------------------------

export const DOWNLOAD_HISTORY: DownloadHistoryEntry[] = [
  {
    id: "h1",
    downloadId: "thermal-v2-4-0",
    downloadName: "Thermal Driver v2.4.0",
    version: "v2.4.0",
    downloadedAt: "2 hours ago",
    icon: "download",
    tone: "primary",
  },
  {
    id: "h2",
    downloadId: "scanner-sdk-android",
    downloadName: "Scanner SDK v1.9",
    version: "v1.9",
    downloadedAt: "Yesterday",
    icon: "visibility",
    tone: "neutral",
  },
  {
    id: "h3",
    downloadId: "pos-firmware-v4-1-2",
    downloadName: "POS Security Patch",
    version: "v4.1.2",
    downloadedAt: "Oct 24, 2023",
    icon: "download",
    tone: "primary",
  },
];

// ---------------------------------------------------------------------
// Most downloaded
// ---------------------------------------------------------------------

export const MOST_DOWNLOADED: DownloadItem[] = [
  DOWNLOADS[2], // Scanner SDK (18.7k)
  DOWNLOADS[0], // Thermal Driver (24.1k)
  DOWNLOADS[1], // POS Firmware (8.2k)
];

// ---------------------------------------------------------------------
// Manuals
// ---------------------------------------------------------------------

export const MANUALS: ManualItem[] = [
  {
    id: "manual-quick-start",
    title: "Quick Start Guide",
    type: "quick-start",
    typeLabel: "Quick Start",
    description: "Get your QBIT device up and running in 5 minutes with this condensed setup guide.",
    fileSize: "1.2 MB",
    pages: 4,
    icon: "rocket_launch",
    downloadId: "manual-quick-start-dl",
    pdfUrl: "#",
  },
  {
    id: "manual-install",
    title: "Installation Guide",
    type: "installation-guide",
    typeLabel: "Installation",
    description: "Complete step-by-step installation instructions for all QBIT hardware products.",
    fileSize: "3.8 MB",
    pages: 24,
    icon: "build",
    downloadId: "manual-install-dl",
    pdfUrl: "#",
  },
  {
    id: "manual-user",
    title: "User Manual",
    type: "user-manual",
    typeLabel: "User Manual",
    description: "Comprehensive reference covering every feature, setting, and troubleshooting scenario.",
    fileSize: "5.8 MB",
    pages: 86,
    icon: "menu_book",
    downloadId: "manual-user-dl",
    pdfUrl: "#",
  },
  {
    id: "manual-warranty",
    title: "Warranty Card",
    type: "warranty-card",
    typeLabel: "Warranty",
    description: "Warranty terms, coverage details, and claim submission instructions.",
    fileSize: "0.8 MB",
    pages: 2,
    icon: "verified_user",
    downloadId: "manual-warranty-dl",
    pdfUrl: "#",
  },
  {
    id: "manual-datasheet",
    title: "Datasheet",
    type: "datasheet",
    typeLabel: "Datasheet",
    description: "Technical specifications, electrical characteristics, and environmental ratings.",
    fileSize: "2.4 MB",
    pages: 8,
    icon: "description",
    downloadId: "manual-datasheet-dl",
    pdfUrl: "#",
  },
];
