/**
 * Placeholder data for the Knowledge Base & Troubleshooting module.
 *
 * Static typed values used to render the UI before the backend is wired
 * up.  When real data becomes available, replace these exports with API
 * calls that return the same shapes.
 */

import type {
  KnowledgeCategoryItem,
  KnowledgeArticle,
  KnowledgeCardItem,
  FAQEntry,
  TroubleshootingIssueEntry,
  CommonErrorEntry,
  RelatedVideoEntry,
  BookmarkEntry,
  ArticleBlock,
} from "./types";

// ---------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------

export const KNOWLEDGE_CATEGORIES: KnowledgeCategoryItem[] = [
  { id: "cat-products", name: "Products", slug: "products", icon: "inventory_2", description: "Product specifications, datasheets, and overviews", color: "from-qbit-primary to-qbit-secondary", articleCount: 42 },
  { id: "cat-drivers", name: "Drivers", slug: "drivers", icon: "settings_input_component", description: "Driver installation, compatibility, and troubleshooting", color: "from-emerald-500 to-teal-600", articleCount: 28 },
  { id: "cat-installation", name: "Installation", slug: "installation", icon: "build", description: "Step-by-step setup and provisioning guides", color: "from-amber-500 to-orange-600", articleCount: 35 },
  { id: "cat-firmware", name: "Firmware", slug: "firmware", icon: "memory", description: "Firmware updates, changelogs, and rollback procedures", color: "from-purple-600 to-indigo-700", articleCount: 19 },
  { id: "cat-networking", name: "Networking", slug: "networking", icon: "lan", description: "Network configuration, VLANs, and connectivity", color: "from-cyan-500 to-blue-600", articleCount: 24 },
  { id: "cat-scanner", name: "Barcode Scanner", slug: "barcode-scanner", icon: "barcode_scanner", description: "Scanner pairing, calibration, and SDK integration", color: "from-rose-500 to-pink-600", articleCount: 16 },
  { id: "cat-printer", name: "Thermal Printer", slug: "thermal-printer", icon: "print", description: "Print head maintenance, paper loading, and drivers", color: "from-slate-700 to-slate-900", articleCount: 21 },
  { id: "cat-windows-pos", name: "Windows POS", slug: "windows-pos", icon: "desktop_windows", description: "Windows terminal configuration and troubleshooting", color: "from-blue-600 to-indigo-700", articleCount: 18 },
  { id: "cat-android-pos", name: "Android POS", slug: "android-pos", icon: "phone_android", description: "Android terminal setup and app development", color: "from-green-500 to-emerald-600", articleCount: 14 },
  { id: "cat-cash-drawer", name: "Cash Drawer", slug: "cash-drawer", icon: "account_balance_wallet", description: "RJ11 wiring, voltage, and trigger configuration", color: "from-amber-600 to-yellow-700", articleCount: 9 },
  { id: "cat-customer-display", name: "Customer Display", slug: "customer-display", icon: "tv", description: "Second-screen setup and display configuration", color: "from-fuchsia-600 to-purple-700", articleCount: 7 },
  { id: "cat-kiosk", name: "Kiosk", slug: "kiosk", icon: "store", description: "Self-service kiosk deployment and maintenance", color: "from-violet-600 to-purple-800", articleCount: 12 },
];

// ---------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------

const articleContent: ArticleBlock[] = [
  { type: "paragraph", text: "This guide covers the complete installation process for the QBIT T-800 Windows POS terminal, including hardware setup, driver configuration, and peripheral wiring. Follow each step in order to ensure a successful deployment." },
  { type: "callout", variant: "warning", title: "Before You Begin", text: "Ensure you have the correct power adapter (12V/5A) and a grounded electrical outlet. Using an incorrect adapter can damage the terminal." },
  { type: "heading", text: "Hardware Setup", level: 2 },
  { type: "paragraph", text: "Begin by placing the T-800 on a flat, stable surface. Connect the power adapter to the rear DC input port, then plug the AC end into a grounded wall outlet." },
  { type: "list", ordered: true, items: ["Unbox and verify all components", "Mount the stand (if applicable)", "Connect the power adapter", "Press the power button on the right side"] },
  { type: "callout", variant: "tip", title: "Pro Tip", text: "Use a surge protector rated for at least 1000 joules for enterprise deployments." },
  { type: "heading", text: "Driver Installation", level: 2 },
  { type: "paragraph", text: "Download the Universal Thermal Printer Driver from the Driver Download Center. The driver package is approximately 12.4 MB and supports Windows 10 and Windows 11." },
  { type: "code", language: "bash", code: "# Install the driver silently\nmsiexec /i UniversalDriver_v2.4.1.msi /quiet /norestart" },
  { type: "callout", variant: "danger", title: "Critical", text: "Do not connect the USB cable until the driver installation is complete. Doing so may cause Windows to install an incorrect generic driver." },
  { type: "heading", text: "Peripheral Configuration", level: 2 },
  { type: "paragraph", text: "After the driver is installed, connect peripherals in the following order:" },
  { type: "table", headers: ["Port", "Device", "Cable"], rows: [["USB 1", "Thermal Printer", "USB Type-A to Type-B"], ["USB 2", "Barcode Scanner", "USB Type-A"], ["RJ11", "Cash Drawer", "Phone cable (6P4C)"], ["HDMI", "Customer Display", "HDMI cable"]] },
  { type: "paragraph", text: "Once all peripherals are connected, run the QBIT Diagnostic Utility to verify all devices are detected and responding correctly." },
];

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: "art-t800-setup",
    title: "Complete Guide: Setting Up the QBIT T-800 Windows POS Terminal",
    slug: "qbit-t-800-setup-guide",
    excerpt: "Learn how to unbox, mount, wire, and configure the QBIT T-800 Windows POS terminal from start to finish.",
    content: articleContent,
    category: KNOWLEDGE_CATEGORIES[7], // Windows POS
    author: "Alex Rivera",
    authorAvatar: "AR",
    readingTime: 12,
    difficulty: "Beginner",
    featured: true,
    popular: true,
    latest: true,
    viewCount: 12400,
    viewCountLabel: "12.4k",
    helpfulCount: 890,
    notHelpfulCount: 23,
    relatedProductIds: ["prod-t800"],
    relatedDownloadIds: ["thermal-v2-4-0"],
    relatedGuideIds: ["guide-t800"],
    relatedVideoUrls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    publishedAt: "Oct 15, 2023",
    updatedAt: "Nov 20, 2023",
  },
  {
    id: "art-printer-troubleshoot",
    title: "Thermal Printer Not Printing: Diagnostic Guide",
    slug: "thermal-printer-not-printing",
    excerpt: "Step-by-step diagnostic for when your thermal printer stops responding. Covers USB, driver, and hardware issues.",
    content: [
      { type: "paragraph", text: "If your thermal printer is not printing, follow this systematic diagnostic to identify and resolve the issue." },
      { type: "heading", text: "Step 1: Check Physical Connections", level: 2 },
      { type: "list", ordered: true, items: ["Verify the USB cable is firmly connected at both ends", "Check the power LED is solid green", "Ensure paper is loaded correctly"] },
      { type: "callout", variant: "tip", text: "Try a different USB port — front-panel ports sometimes have insufficient power for industrial printers." },
      { type: "heading", text: "Step 2: Check the Driver", level: 2 },
      { type: "code", language: "bash", code: "# Check if the printer appears in the device list\nqbit-cli device --list --type printer" },
    ],
    category: KNOWLEDGE_CATEGORIES[6], // Thermal Printer
    author: "Sarah Chen",
    authorAvatar: "SC",
    readingTime: 8,
    difficulty: "Intermediate",
    featured: false,
    popular: true,
    latest: false,
    viewCount: 8700,
    viewCountLabel: "8.7k",
    helpfulCount: 620,
    notHelpfulCount: 15,
    relatedProductIds: ["prod-hubx"],
    relatedDownloadIds: ["thermal-v2-4-0"],
    relatedVideoUrls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    publishedAt: "Sep 28, 2023",
    updatedAt: "Nov 15, 2023",
  },
  {
    id: "art-firmware-update",
    title: "How to Safely Update POS Terminal Firmware",
    slug: "pos-firmware-update-guide",
    excerpt: "Best practices for updating POS-2000 and POS-3000 firmware, including rollback procedures and backup steps.",
    content: [
      { type: "paragraph", text: "Firmware updates are critical for security and performance. This guide walks you through the safe update process." },
      { type: "callout", variant: "danger", title: "Warning", text: "Never power off the terminal during a firmware update. Doing so can brick the device." },
    ],
    category: KNOWLEDGE_CATEGORIES[3], // Firmware
    author: "E. Richardson",
    authorAvatar: "ER",
    readingTime: 6,
    difficulty: "Intermediate",
    featured: false,
    popular: false,
    latest: true,
    viewCount: 5200,
    viewCountLabel: "5.2k",
    helpfulCount: 380,
    notHelpfulCount: 8,
    relatedDownloadIds: ["pos-firmware-v4-1-2"],
    publishedAt: "Nov 01, 2023",
    updatedAt: "Nov 18, 2023",
  },
];

// ---------------------------------------------------------------------
// Card items (for the knowledge grid)
// ---------------------------------------------------------------------

export const KNOWLEDGE_CARDS: KnowledgeCardItem[] = KNOWLEDGE_ARTICLES.map((a) => ({
  id: a.id,
  title: a.title,
  excerpt: a.excerpt,
  category: a.category.name,
  categorySlug: a.category.slug,
  icon: a.category.icon,
  gradient: a.category.color,
  readingTime: a.readingTime,
  difficulty: a.difficulty,
  author: a.author,
  viewCountLabel: a.viewCountLabel,
  updatedAt: a.updatedAt,
  featured: a.featured,
  popular: a.popular,
  latest: a.latest,
}));

export const POPULAR_ARTICLES: KnowledgeCardItem[] = KNOWLEDGE_CARDS.filter((a) => a.popular);
export const LATEST_ARTICLES: KnowledgeCardItem[] = KNOWLEDGE_CARDS.filter((a) => a.latest);
export const RECENTLY_UPDATED: KnowledgeCardItem[] = [...KNOWLEDGE_CARDS].sort((a, b) =>
  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
);

// ---------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------

export const FAQS: FAQEntry[] = [
  { id: "faq-1", question: "What is the expected lifespan of the T-800 touch screen?", answer: "The T-800 touch screen is rated for 50 million touches per point, which typically translates to 7-10 years of enterprise use.", category: "Products" },
  { id: "faq-2", question: "Can I upgrade the memory or storage on the T-800?", answer: "Storage is field-upgradeable via the M.2 NVMe slot. Memory (RAM) is soldered for stability and cannot be upgraded.", category: "Products" },
  { id: "faq-3", question: "Is global on-site support available?", answer: "Yes, Enterprise Care is available in 45+ countries. Contact your QBIT account manager for SLA details.", category: "Products" },
  { id: "faq-4", question: "What operating systems are supported?", answer: "Windows 11 IoT Enterprise (recommended), Ubuntu 22.04 LTS, and Android 13 (via dual-boot partition).", category: "Installation" },
  { id: "faq-5", question: "How do I reset the thermal printer to factory defaults?", answer: "Power off the printer, hold the Feed button, power on while holding for 5 seconds. The printer will print a configuration receipt confirming the reset.", category: "Thermal Printer" },
  { id: "faq-6", question: "Why does my barcode scanner beep but not scan?", answer: "The scanner may be in a different mode. Scan the 'Factory Default' barcode from the manual, then re-pair via USB. If the issue persists, check the scanner's firmware version.", category: "Barcode Scanner" },
  { id: "faq-7", question: "What is the maximum cable length for a cash drawer?", answer: "The RJ11 cash drawer cable should not exceed 15 meters (50 feet). Longer cables can cause voltage drop and intermittent triggering.", category: "Cash Drawer" },
  { id: "faq-8", question: "How do I configure a static IP on the POS terminal?", answer: "Go to Settings → Network → Ethernet → IPv4, select 'Manual', enter the IP, subnet mask, gateway, and DNS. Reboot the terminal for changes to take effect.", category: "Networking" },
];

// ---------------------------------------------------------------------
// Troubleshooting issues
// ---------------------------------------------------------------------

export const TROUBLESHOOTING_ISSUES: TroubleshootingIssueEntry[] = [
  {
    id: "ts-1",
    title: "Thermal Printer Not Printing",
    slug: "thermal-printer-not-printing",
    productName: "HUB-X Pro",
    symptoms: [
      "Print job sent but no output",
      "Printer LED is blinking red",
      "Paper jams frequently",
      "Print quality is poor or faded",
    ],
    causes: [
      "USB cable not connected or faulty",
      "Driver not installed or corrupted",
      "Paper roll empty or incorrectly loaded",
      "Print head overheated or dirty",
    ],
    resolution: "Systematically check physical connections, verify driver status, reload paper, and clean the print head if needed.",
    steps: [
      { id: "ts1-s1", stepNumber: 1, title: "Check Physical Connection", description: "Verify the USB cable is firmly connected at both the printer and terminal ends. Try a different USB port if available.", warning: "Do not use USB extension cables longer than 2m for industrial printers." },
      { id: "ts1-s2", stepNumber: 2, title: "Verify Driver Status", description: "Open Device Manager → Printers. If the printer shows a yellow exclamation mark, right-click and select 'Update Driver'.", tip: "Download the latest driver from the Driver Download Center before starting." },
      { id: "ts1-s3", stepNumber: 3, title: "Reload Paper", description: "Open the printer cover, remove the paper roll, and reload it following the diagram inside the cover. Close the cover firmly until it clicks." },
      { id: "ts1-s4", stepNumber: 4, title: "Clean Print Head", description: "Power off the printer. Use a cotton swab with isopropyl alcohol to gently clean the print head element. Allow to dry before powering on." },
    ],
    difficulty: "Intermediate",
    viewCountLabel: "8.7k",
    relatedDownloadIds: ["thermal-v2-4-0"],
    relatedGuideIds: ["guide-t800"],
    relatedVideoUrls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
  },
  {
    id: "ts-2",
    title: "Barcode Scanner Not Scanning",
    slug: "barcode-scanner-not-scanning",
    productName: "Scanner Q-200",
    symptoms: [
      "Scanner beeps but no data appears",
      "Scanner laser not visible",
      "Intermittent scanning — works sometimes",
      "Scanner works in test mode but not in POS software",
    ],
    causes: [
      "Scanner in wrong mode (HID vs COM)",
      "Firmware version mismatch",
      "USB port not providing enough power",
      "POS software not configured to receive scanner input",
    ],
    resolution: "Reset the scanner to factory defaults, verify the communication mode, and ensure the POS software is configured correctly.",
    steps: [
      { id: "ts2-s1", stepNumber: 1, title: "Factory Reset Scanner", description: "Scan the 'Factory Default' barcode from the Q-Series Scanner Manual. The scanner will beep twice to confirm the reset." },
      { id: "ts2-s2", stepNumber: 2, title: "Verify Communication Mode", description: "By default, the scanner uses HID (keyboard) mode. If your POS software expects COM port input, scan the 'COM Mode' barcode." },
      { id: "ts2-s3", stepNumber: 3, title: "Test in Diagnostic Utility", description: "Open the QBIT Diagnostic Utility → Scanner Test. Scan a barcode. If it appears here but not in your POS software, the issue is with the POS configuration." },
    ],
    difficulty: "Beginner",
    viewCountLabel: "6.2k",
    relatedDownloadIds: ["scanner-sdk-android"],
  },
  {
    id: "ts-3",
    title: "POS Terminal Network Connection Drops",
    slug: "pos-network-connection-drops",
    productName: "POS-2000",
    symptoms: [
      "Terminal intermittently loses network connection",
      "Transactions fail with timeout error",
      "Ping to gateway is intermittent",
      "Other devices on the same network work fine",
    ],
    causes: [
      "Faulty LAN cable or loose connector",
      "IP address conflict with another device",
      "Switch port disabled or misconfigured",
      "Network driver outdated",
    ],
    resolution: "Replace the LAN cable, assign a static IP outside the DHCP range, and update the network driver.",
    steps: [
      { id: "ts3-s1", stepNumber: 1, title: "Replace LAN Cable", description: "Replace the existing cable with a new Cat6 shielded cable. Avoid cables longer than 100m." },
      { id: "ts3-s2", stepNumber: 2, title: "Assign Static IP", description: "Configure a static IP that is outside the DHCP server's allocation range to prevent conflicts." },
      { id: "ts3-s3", stepNumber: 3, title: "Update Network Driver", description: "Download and install the latest network driver from the Driver Download Center." },
    ],
    difficulty: "Intermediate",
    viewCountLabel: "4.1k",
  },
  {
    id: "ts-4",
    title: "Cash Drawer Not Opening",
    slug: "cash-drawer-not-opening",
    productName: "CD-24V Cash Drawer",
    symptoms: [
      "Cash drawer does not open when prompted",
      "Solenoid clicks but drawer stays closed",
      "Drawer opens randomly without command",
    ],
    causes: [
      "RJ11 cable not connected or faulty",
      "Cash drawer voltage mismatch (12V vs 24V)",
      "POS software not configured for the correct COM port",
      "Drawer latch mechanism jammed",
    ],
    resolution: "Verify the cable connection, check the drawer voltage rating matches the terminal output, and test with the diagnostic utility.",
    steps: [
      { id: "ts4-s1", stepNumber: 1, title: "Check RJ11 Cable", description: "Ensure the RJ11 cable is connected to the correct port on the terminal (labeled 'CD' or 'Cash Drawer')." },
      { id: "ts4-s2", stepNumber: 2, title: "Verify Voltage", description: "Check the label on the bottom of the cash drawer. It must match the terminal output (12V or 24V). Using a mismatched drawer can damage the terminal." },
      { id: "ts4-s3", stepNumber: 3, title: "Test in Diagnostic Utility", description: "Open QBIT Diagnostic Utility → Cash Drawer → click 'Test Open'. If the drawer opens here but not in your POS software, the issue is with the POS configuration." },
    ],
    difficulty: "Beginner",
    viewCountLabel: "3.8k",
  },
];

// ---------------------------------------------------------------------
// Common error codes
// ---------------------------------------------------------------------

export const COMMON_ERRORS: CommonErrorEntry[] = [
  { id: "err-1", code: "E001", meaning: "Printer Not Detected", possibleCause: "USB cable disconnected or driver not installed", resolution: "Reconnect USB cable and reinstall the Universal Thermal Printer Driver v2.4.1", productName: "HUB-X Pro", severity: "warning" },
  { id: "err-2", code: "E002", meaning: "Paper Out", possibleCause: "Paper roll empty or incorrectly loaded", resolution: "Open the printer cover and reload a new 80mm thermal paper roll", productName: "HUB-X Pro", severity: "info" },
  { id: "err-3", code: "E003", meaning: "Print Head Overheated", possibleCause: "Continuous high-volume printing without cooldown", resolution: "Allow the printer to cool for 5 minutes before resuming. Reduce print density if issue recurs.", productName: "HUB-X Pro", severity: "warning" },
  { id: "err-4", code: "ERR_SCAN_01", meaning: "Scanner Timeout", possibleCause: "Scanner beam blocked or barcode damaged", resolution: "Clean the scanner lens and ensure the barcode is readable. Try scanning at a different angle.", productName: "Scanner Q-200", severity: "info" },
  { id: "err-5", code: "ERR_NET_01", meaning: "Network Unreachable", possibleCause: "LAN cable unplugged or IP address invalid", resolution: "Check the LAN cable connection and verify the IP configuration in Settings → Network", productName: "POS-2000", severity: "error" },
  { id: "err-6", code: "ERR_FW_01", meaning: "Firmware Update Failed", possibleCause: "Power interruption during update or corrupted firmware file", resolution: "Re-download the firmware from the Driver Download Center and retry. Do not power off during the update.", productName: "POS-2000", severity: "error" },
  { id: "err-7", code: "ERR_CD_01", meaning: "Cash Drawer Trigger Failed", possibleCause: "RJ11 cable loose or voltage mismatch", resolution: "Verify the RJ11 cable is seated and the drawer voltage matches the terminal output", productName: "CD-24V", severity: "warning" },
  { id: "err-8", code: "ERR_TS_01", meaning: "Touch Screen Calibration Lost", possibleCause: "Driver conflict or firmware version mismatch", resolution: "Run the Touch Calibration Utility and update to firmware v4.1.2 or later", productName: "QBIT T-800", severity: "warning" },
];

// ---------------------------------------------------------------------
// Related videos (YouTube)
// ---------------------------------------------------------------------

export const RELATED_VIDEOS: RelatedVideoEntry[] = [
  { id: "vid-1", title: "QBIT T-800 Complete Setup Walkthrough", youtubeId: "dQw4w9WgXcQ", duration: "12:45", thumbnail: "/qbit-hero-illustration.png" },
  { id: "vid-2", title: "Thermal Printer Maintenance Guide", youtubeId: "dQw4w9WgXcQ", duration: "8:20", thumbnail: "/qbit-hero-illustration.png" },
  { id: "vid-3", title: "Barcode Scanner Calibration Tutorial", youtubeId: "dQw4w9WgXcQ", duration: "5:15", thumbnail: "/qbit-hero-illustration.png" },
];

// ---------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------

export const BOOKMARKS: BookmarkEntry[] = [
  { id: "bm-1", articleId: "art-t800-setup", title: "Complete Guide: Setting Up the QBIT T-800 Windows POS Terminal", category: "Windows POS", icon: "desktop_windows", bookmarkType: "article", savedAt: "2 hours ago" },
  { id: "bm-2", articleId: "ts-1", title: "Thermal Printer Not Printing: Diagnostic Guide", category: "Thermal Printer", icon: "print", bookmarkType: "troubleshooting", savedAt: "Yesterday" },
  { id: "bm-3", articleId: "faq-5", title: "How do I reset the thermal printer to factory defaults?", category: "Thermal Printer", icon: "help", bookmarkType: "faq", savedAt: "3 days ago" },
];
