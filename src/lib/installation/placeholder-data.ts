/**
 * Placeholder data for the Installation Center.
 *
 * Static typed values used to render the UI before the backend is wired
 * up.  When real data becomes available, replace these exports with API
 * calls that return the same shapes.
 */

import type {
  InstallationGuide,
  InstallationStep,
  RequiredTool,
  SafetyInstruction,
  ConfigurationGuideEntry,
  WiringDiagram,
  ChecklistItem,
  InstallationFAQEntry,
  TroubleshootingEntry,
  QuickAccessCard,
  ProductCategoryCard,
  GuideCardItem,
  RecentGuideEntry,
  RelatedVideo,
} from "./types";

// ---------------------------------------------------------------------
// Landing page data
// ---------------------------------------------------------------------

export const QUICK_ACCESS_CARDS: QuickAccessCard[] = [
  {
    title: "Installation Guides",
    description: "Step-by-step PDF manuals and interactive web guides for all hardware.",
    icon: "menu_book",
  },
  {
    title: "Installation Videos",
    description: "High-definition walkthroughs of unboxing and hardware mounting.",
    icon: "video_library",
    screen: "video-training-center",
  },
  {
    title: "Quick Setup",
    description: "Rapid deployment checklists for field engineers and technicians.",
    icon: "bolt",
  },
  {
    title: "Wiring Diagrams",
    description: "Low-voltage electrical schematics and pinout specifications.",
    icon: "account_tree",
  },
  {
    title: "Configuration Guides",
    description: "OS provisioning, network setup, and peripheral mapping details.",
    icon: "settings_applications",
  },
  {
    title: "Troubleshooting",
    description: "Common failure modes, diagnostic codes, and resolution steps.",
    icon: "error_outline",
  },
];

export const PRODUCT_CATEGORIES: ProductCategoryCard[] = [
  {
    label: "TERMINALS",
    title: "Windows POS",
    icon: "desktop_windows",
    gradient: "from-qbit-primary via-qbit-primary-container to-qbit-secondary",
  },
  {
    label: "MOBILE",
    title: "Android POS",
    icon: "phone_android",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    label: "PERIPHERALS",
    title: "Thermal Printer",
    icon: "print",
    gradient: "from-slate-700 via-slate-600 to-slate-800",
  },
  {
    label: "SCANNING",
    title: "Barcode Scanner",
    icon: "barcode_scanner",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    label: "SELF-SERVICE",
    title: "Kiosk",
    icon: "store",
    gradient: "from-fuchsia-600 via-purple-600 to-indigo-600",
  },
];

export const LATEST_GUIDES: GuideCardItem[] = [
  {
    id: "guide-t800",
    title: "QBIT T-800 Installation",
    product: "QBIT T-800",
    category: "Windows POS",
    estimatedTime: 25,
    difficulty: "Beginner",
    version: "v4.2.1",
    icon: "desktop_windows",
    gradient: "from-qbit-primary to-qbit-secondary",
    latest: true,
    viewCountLabel: "12.4k",
  },
  {
    id: "guide-hubx",
    title: "HUB-X Pro Thermal Printer Setup",
    product: "HUB-X Pro",
    category: "Thermal Printer",
    estimatedTime: 15,
    difficulty: "Beginner",
    version: "v2.4.0",
    icon: "print",
    gradient: "from-slate-700 to-slate-900",
    latest: true,
    viewCountLabel: "8.7k",
  },
  {
    id: "guide-scanner",
    title: "Barcode Scanner Q-Series Pairing",
    product: "Scanner Q-200",
    category: "Barcode Scanner",
    estimatedTime: 10,
    difficulty: "Beginner",
    version: "v1.9",
    icon: "barcode_scanner",
    gradient: "from-amber-500 to-orange-600",
    latest: false,
    viewCountLabel: "6.2k",
  },
];

export const POPULAR_GUIDES: GuideCardItem[] = [
  {
    id: "guide-pos2000",
    title: "POS-2000 Terminal Firmware Update",
    product: "POS-2000",
    category: "Windows POS",
    estimatedTime: 20,
    difficulty: "Intermediate",
    version: "v4.1.2",
    icon: "terminal",
    gradient: "from-purple-600 to-indigo-700",
    featured: true,
    viewCountLabel: "18.3k",
  },
  {
    id: "guide-kiosk",
    title: "Kiosk Core Server Connectivity",
    product: "Kiosk K-100",
    category: "Kiosk",
    estimatedTime: 45,
    difficulty: "Expert",
    version: "v3.0.1",
    icon: "store",
    gradient: "from-fuchsia-600 to-purple-700",
    featured: true,
    viewCountLabel: "9.1k",
  },
  {
    id: "guide-android",
    title: "Android POS Initial Device Pairing",
    product: "AP-50",
    category: "Android POS",
    estimatedTime: 12,
    difficulty: "Beginner",
    version: "v2.0",
    icon: "phone_android",
    gradient: "from-emerald-500 to-teal-600",
    featured: false,
    viewCountLabel: "14.5k",
  },
];

export const RECENT_GUIDES: RecentGuideEntry[] = [
  {
    id: "r1",
    title: "Windows Terminal Elite X2 Configuration",
    section: "Section 4: BIOS and Peripheral Sync",
    status: "active",
    statusLabel: "Active",
    progress: 75,
    progressVariant: "primary",
    icon: "desktop_windows",
    ctaLabel: "Resume",
    ctaVariant: "primary",
  },
  {
    id: "r2",
    title: "TP-800 Thermal Printer Wiring Schematic",
    section: "Section 2: Parallel Port Pinout Configuration",
    status: "review",
    statusLabel: "In Review",
    progress: 30,
    progressVariant: "warning",
    icon: "print",
    ctaLabel: "Resume",
    ctaVariant: "primary",
  },
  {
    id: "r3",
    title: "Kiosk Core Server Connectivity Setup",
    section: "Completed Section: Static IP Assignment",
    status: "complete",
    statusLabel: "Complete",
    progress: 100,
    progressVariant: "success",
    icon: "dns",
    ctaLabel: "Review",
    ctaVariant: "outline",
    dimmed: true,
  },
];

// ---------------------------------------------------------------------
// T-800 Installation Guide (full guide data)
// ---------------------------------------------------------------------

export const T800_TOOLS: RequiredTool[] = [
  { id: "tool-power", name: "Power Adapter (In Box)", icon: "power", description: "12V/5A external power supply", included: true },
  { id: "tool-lan", name: "Cat6 LAN Cable", icon: "lan", description: "Minimum 1m, shielded", included: false },
  { id: "tool-screwdriver", name: "Philips #2 Screwdriver", icon: "build", description: "For base plate mounting", included: false },
  { id: "tool-usb", name: "USB Cable (Type-A to Type-B)", icon: "usb", description: "For peripheral connection", included: true },
  { id: "tool-receipt", name: "Thermal Receipt Paper Roll", icon: "receipt_long", description: "80mm width, for printer test", included: true },
  { id: "tool-multimeter", name: "Digital Multimeter", icon: "electric_meter", description: "For voltage verification", included: false },
];

export const T800_SAFETY: SafetyInstruction[] = [
  { id: "s1", text: "Ensure the power switch is in the OFF position before connecting any cables.", severity: "warning" },
  { id: "s2", text: "Verify the power adapter voltage matches your region (110V/220V).", severity: "danger" },
  { id: "s3", text: "Do not overtighten screws — finger-tight plus 1/4 turn is sufficient.", severity: "info" },
  { id: "s4", text: "Keep liquids away from the terminal during installation.", severity: "warning" },
];

export const T800_CONFIG_GUIDES: ConfigurationGuideEntry[] = [
  { id: "c1", title: "Network Configuration", description: "Set up static IP, DNS, and gateway for enterprise network.", configType: "network" },
  { id: "c2", title: "Windows OS Provisioning", description: "Configure Windows 11 IoT Enterprise with kiosk mode.", configType: "os" },
  { id: "c3", title: "Peripheral Mapping", description: "Map COM ports for printer, scanner, and cash drawer.", configType: "peripheral" },
  { id: "c4", title: "Security Hardening", description: "Enable BitLocker, disable unused services, configure firewall.", configType: "security" },
];

export const T800_WIRING_DIAGRAMS: WiringDiagram[] = [
  {
    id: "w1",
    title: "Power Connection Diagram",
    description: "12V/5A power adapter wiring to the T-800 terminal.",
    imageUrl: "/qbit-hero-illustration.png",
    thumbnailUrl: "/qbit-hero-illustration.png",
    resolution: "4096×2160",
  },
  {
    id: "w2",
    title: "Peripheral Pinout",
    description: "USB, COM, and RJ11 pin assignments for all ports.",
    imageUrl: "/qbit-hero-illustration.png",
    thumbnailUrl: "/qbit-hero-illustration.png",
    resolution: "4096×2160",
  },
  {
    id: "w3",
    title: "Network Topology",
    description: "Recommended enterprise network topology for multi-terminal deployments.",
    imageUrl: "/qbit-hero-illustration.png",
    thumbnailUrl: "/qbit-hero-illustration.png",
    resolution: "3840×2160",
  },
];

export const T800_CHECKLIST: ChecklistItem[] = [
  { id: "cl1", group: "Power", label: "Power Connected", description: "Verify LED indicator is solid green" },
  { id: "cl2", group: "Software", label: "Driver Installed", description: "Universal Thermal Printer Driver v2.4.1" },
  { id: "cl3", group: "Software", label: "Firmware Updated", description: "POS Terminal Firmware v4.1.2 or later" },
  { id: "cl4", group: "Hardware Tests", label: "Printer Tested", description: "Print test page successful" },
  { id: "cl5", group: "Hardware Tests", label: "Scanner Tested", description: "Barcode scan verified" },
  { id: "cl6", group: "Hardware Tests", label: "Cash Drawer Tested", description: "Drawer opens on command" },
  { id: "cl7", group: "Hardware Tests", label: "Customer Display Tested", description: "Second display shows correct output" },
  { id: "cl8", group: "Hardware Tests", label: "Network Connected", description: "Ping to gateway successful" },
  { id: "cl9", group: "Final Verification", label: "Final Verification", description: "All systems operational" },
];

export const T800_FAQS: InstallationFAQEntry[] = [
  {
    id: "f1",
    question: "What is the expected lifespan of the T-800 touch screen?",
    answer: "The T-800 touch screen is rated for 50 million touches per point, which typically translates to 7-10 years of enterprise use.",
  },
  {
    id: "f2",
    question: "Can I upgrade the memory or storage?",
    answer: "Storage is field-upgradeable via the M.2 NVMe slot. Memory (RAM) is soldered for stability and cannot be upgraded.",
  },
  {
    id: "f3",
    question: "Is global on-site support available?",
    answer: "Yes, Enterprise Care is available in 45+ countries. Contact your QBIT account manager for SLA details.",
  },
  {
    id: "f4",
    question: "What operating systems are supported?",
    answer: "Windows 11 IoT Enterprise (recommended), Ubuntu 22.04 LTS, and Android 13 (via dual-boot partition).",
  },
];

export const T800_TROUBLESHOOTING: TroubleshootingEntry[] = [
  {
    id: "t1",
    problem: "Printer not printing",
    causes: ["USB cable not connected", "Driver not installed", "Paper roll empty", "Print head overheated"],
    solutions: ["Verify USB connection", "Install Universal Thermal Printer Driver v2.4.1", "Replace paper roll", "Allow 5 minutes cooldown"],
    relatedAsset: "Universal Thermal Printer Driver",
    relatedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "t2",
    problem: "Touch screen unresponsive",
    causes: ["Screen calibration drift", "Driver conflict", "Firmware version mismatch"],
    solutions: ["Run touch calibration utility", "Reinstall touch driver", "Update to firmware v4.1.2+"],
    relatedAsset: "T-800 Touch Calibration Utility",
  },
  {
    id: "t3",
    problem: "Network connection drops",
    causes: ["Faulty LAN cable", "IP conflict", "Switch port disabled"],
    solutions: ["Replace with Cat6 shielded cable", "Assign static IP outside DHCP range", "Contact IT to enable switch port"],
    relatedAsset: "Network Configuration Guide",
  },
];

export const T800_RELATED_VIDEOS: RelatedVideo[] = [
  { id: "v1", title: "QBIT T-800 Hardware Setup Guide", youtubeId: "dQw4w9WgXcQ", duration: "2:45", thumbnail: "/qbit-hero-illustration.png" },
  { id: "v2", title: "Software Configuration Walkthrough", youtubeId: "dQw4w9WgXcQ", duration: "5:12", thumbnail: "/qbit-hero-illustration.png" },
  { id: "v3", title: "Maintenance Basics", youtubeId: "dQw4w9WgXcQ", duration: "1:30", thumbnail: "/qbit-hero-illustration.png" },
];

export const T800_STEPS: InstallationStep[] = [
  {
    id: "step-1",
    stepNumber: 1,
    title: "Unbox & Inventory",
    description: "Ensure all components are present including the terminal, stand, power brick, and accessory box. Verify the serial number matches the packing slip.",
    estimatedTime: 5,
    tip: "Take a photo of the serial number label before installation — you'll need it for warranty registration.",
    requiredTool: { id: "tool-box-cutter", name: "Box Cutter", icon: "content_cut", included: false },
    status: "completed",
  },
  {
    id: "step-2",
    stepNumber: 2,
    title: "Power Connection",
    description: "Route the DC power cable through the stand neck and connect to the underside of the QBIT head unit. Connect the AC end to a grounded wall outlet.",
    estimatedTime: 5,
    warning: "Do not power on the terminal until all peripheral cables are connected.",
    tip: "Use a surge protector rated for at least 1000 joules for enterprise deployments.",
    requiredTool: { id: "tool-power", name: "Power Adapter (In Box)", icon: "power", included: true },
    relatedDownloadId: "thermal-v2-4-0",
    status: "active",
  },
  {
    id: "step-3",
    stepNumber: 3,
    title: "Peripheral Wiring",
    description: "Connect the thermal printer, cash drawer, and barcode scanner to their designated ports on the rear I/O panel. Refer to the wiring diagram for port assignments.",
    estimatedTime: 8,
    warning: "Ensure the cash drawer RJ11 cable is fully seated — a loose connection can cause electrical arcing.",
    requiredTool: { id: "tool-usb", name: "USB Cable", icon: "usb", included: true },
    relatedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "step-4",
    stepNumber: 4,
    title: "Driver Configuration",
    description: "Install the specific Windows POS drivers for the touchscreen and thermal printer. Download the latest Universal Driver Package from the Driver Download Center.",
    estimatedTime: 5,
    tip: "Install drivers in order: Chipset → Touch → Printer → Scanner. Reboot between each install.",
    requiredTool: { id: "tool-usb", name: "USB Cable", icon: "usb", included: true },
    relatedDownloadId: "thermal-v2-4-0",
    relatedManualId: "manual-user",
  },
  {
    id: "step-5",
    stepNumber: 5,
    title: "Test Print & Final Verification",
    description: "Run a test print from the QBIT diagnostic utility. Verify all peripherals (scanner, cash drawer, display) respond correctly. Complete the installation checklist.",
    estimatedTime: 2,
    tip: "Print the test page and attach it to the installation report for customer sign-off.",
    requiredTool: { id: "tool-receipt", name: "Thermal Receipt Paper Roll", icon: "receipt_long", included: true },
  },
];

export const T800_GUIDE: InstallationGuide = {
  id: "guide-t800",
  title: "Step-by-Step Installation Guide",
  slug: "qbit-t-800-installation",
  product: "QBIT T-800",
  category: "Windows POS",
  estimatedTime: 25,
  difficulty: "Beginner",
  version: "v4.2.1",
  description: "Complete hardware setup and software provisioning for the QBIT T-800 Windows Point of Sale workstation.",
  featured: true,
  latest: true,
  viewCount: 12400,
  viewCountLabel: "12.4k",
  completionCount: 8900,
  steps: T800_STEPS,
  tools: T800_TOOLS,
  safetyInstructions: T800_SAFETY,
  configurationGuides: T800_CONFIG_GUIDES,
  wiringDiagrams: T800_WIRING_DIAGRAMS,
  checklist: T800_CHECKLIST,
  faqs: T800_FAQS,
  troubleshooting: T800_TROUBLESHOOTING,
  relatedDownloadIds: ["thermal-v2-4-0", "pos-firmware-v4-1-2"],
  relatedVideoUrls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
};
