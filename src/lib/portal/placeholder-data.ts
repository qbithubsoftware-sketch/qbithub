/**
 * Placeholder data for the Customer Public Portal.
 *
 * All data here is filtered to PUBLIC visibility only — internal and
 * restricted items are never shown to public customers.
 */

import type {
  PublicProductCard,
  PublicProductDetail,
  PublicDownloadItem,
  PublicArticleCard,
  PublicAnnouncement,
  PublicCategoryFilter,
  PublicFAQEntry,
  PublicTroubleshootingEntry,
  PublicAccessory,
  SupportCardItem,
  PublicYouTubeVideo,
} from "./types";

// ---------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------

export const PUBLIC_CATEGORIES: PublicCategoryFilter[] = [
  { id: "cat-windows-pos", name: "Windows POS", slug: "windows-pos", icon: "desktop_windows", productCount: 12 },
  { id: "cat-android-pos", name: "Android POS", slug: "android-pos", icon: "phone_android", productCount: 8 },
  { id: "cat-thermal-printer", name: "Thermal Printers", slug: "thermal-printer", icon: "print", productCount: 15 },
  { id: "cat-barcode-scanner", name: "Barcode Scanners", slug: "barcode-scanner", icon: "barcode_scanner", productCount: 6 },
  { id: "cat-accessories", name: "Accessories", slug: "accessories", icon: "cable", productCount: 24 },
  { id: "cat-kiosk", name: "Kiosks", slug: "kiosk", icon: "store", productCount: 4 },
];

// ---------------------------------------------------------------------
// Products (catalog cards)
// ---------------------------------------------------------------------

export const PUBLIC_PRODUCTS: PublicProductCard[] = [
  { id: "qbit-t800", name: "QBIT T-800", subtitle: "Flagship Enterprise POS", category: "Windows POS", categorySlug: "windows-pos", icon: "point_of_sale", gradient: "from-qbit-primary to-qbit-secondary", badge: "Featured", badgeVariant: "primary", startingPrice: "$1,248", viewCountLabel: "12.4k" },
  { id: "aura-g3", name: "Aura Terminal G3", subtitle: "Advanced POS Interface System", category: "Windows POS", categorySlug: "windows-pos", icon: "desktop_windows", gradient: "from-amber-500 to-orange-600", badge: "New", badgeVariant: "success", startingPrice: "$989", viewCountLabel: "6.2k" },
  { id: "hubx-pro", name: "HUB-X Pro", subtitle: "Thermal Printer Pro Series", category: "Thermal Printers", categorySlug: "thermal-printer", icon: "print", gradient: "from-purple-600 to-indigo-700", badge: "Popular", badgeVariant: "primary", startingPrice: "$349", viewCountLabel: "8.7k" },
  { id: "scanpro-m10", name: "ScanPro M-10", subtitle: "Industrial Handheld Scanner", category: "Barcode Scanners", categorySlug: "barcode-scanner", icon: "barcode_scanner", gradient: "from-emerald-500 to-teal-600", startingPrice: "$219", viewCountLabel: "5.1k" },
  { id: "nexus-x1", name: "QBIT Nexus X1", subtitle: "Enterprise Hub Controller", category: "Accessories", categorySlug: "accessories", icon: "router", gradient: "from-cyan-500 to-blue-600", badge: "New", badgeVariant: "success", startingPrice: "$499", viewCountLabel: "3.8k" },
  { id: "android-pos-50", name: "QBIT Go M-50", subtitle: "Mobile Android POS", category: "Android POS", categorySlug: "android-pos", icon: "phone_android", gradient: "from-green-500 to-emerald-600", startingPrice: "$649", viewCountLabel: "4.5k" },
  { id: "kiosk-k100", name: "Kiosk K-100", subtitle: "Self-Service Kiosk", category: "Kiosks", categorySlug: "kiosk", icon: "store", gradient: "from-fuchsia-600 to-purple-700", startingPrice: "$2,199", viewCountLabel: "2.3k" },
  { id: "duo-x200", name: "QBIT Duo X-200", subtitle: "Dual-Screen Terminal", category: "Windows POS", categorySlug: "windows-pos", icon: "desktop_windows", gradient: "from-slate-700 to-slate-900", startingPrice: "$1,599", viewCountLabel: "3.1k" },
];

// ---------------------------------------------------------------------
// Product details (T-800 full detail)
// ---------------------------------------------------------------------

export const T800_PUBLIC_DETAIL: PublicProductDetail = {
  id: "qbit-t800",
  name: "QBIT T-800",
  model: "T800-ENT-2024",
  category: "Windows POS",
  description: "Engineered for high-volume retail and logistics. The T-800 combines military-grade durability with seamless enterprise integration.",
  longDescription: "The QBIT T-800 is our flagship enterprise point-of-sale terminal, designed to handle the most demanding retail and logistics environments. With its Intel Core i5 processor, 16GB of RAM, and 512GB NVMe storage, it delivers sub-millisecond transaction processing. The IP54-rated aluminum chassis withstands dust, splashes, and the rigors of 24/7 operation.",
  icon: "point_of_sale",
  gradient: "from-qbit-primary to-qbit-secondary",
  badges: [
    { label: "In Stock", variant: "success" },
    { label: "Latest Firmware v4.2.1", variant: "primary" },
    { label: "Featured", variant: "primary" },
  ],
  specifications: [
    { property: "Processor", value: "Intel® Core™ i5-1135G7 (8M Cache, up to 4.20 GHz)" },
    { property: "Memory", value: "16GB DDR4 3200MHz (Expandable to 32GB)" },
    { property: "Storage", value: "512GB NVMe M.2 SSD" },
    { property: "Display", value: '15.6" IPS Panel, Full HD (1920x1080), 10-point Multi-touch' },
    { property: "Connectivity", value: "Dual-band Wi-Fi 6, Bluetooth 5.1, 1Gbps Ethernet" },
    { property: "Ports", value: "6x USB 3.0, 2x COM (RS232), 1x HDMI, 1x Cash Drawer Port (RJ11)" },
    { property: "Power Supply", value: "External 12V/5A Adapter, Energy Star 8.0 Certified" },
    { property: "Dimensions", value: "360mm × 240mm × 18mm" },
    { property: "Weight", value: "3.2 kg" },
    { property: "Operating System", value: "Windows 11 IoT Enterprise (pre-installed)" },
  ],
  features: [
    { icon: "shield", title: "Industrial Build", description: "IP54-rated aluminum chassis for harsh retail environments." },
    { icon: "hub", title: "Multi-Port Support", description: "Extensive legacy and modern connectivity for peripherals." },
    { icon: "eco", title: "Energy Efficient", description: "40% less power consumption than previous generation." },
    { icon: "security", title: "Hardware Security", description: "TPM 2.0 chip and secure boot for enterprise-grade protection." },
  ],
  galleryImages: [
    { url: "/qbit-hero-illustration.png", alt: "QBIT T-800 front view" },
    { url: "/qbit-hero-illustration.png", alt: "QBIT T-800 rear ports" },
    { url: "/qbit-hero-illustration.png", alt: "QBIT T-800 side angle" },
    { url: "/qbit-hero-illustration.png", alt: "QBIT T-800 with peripherals" },
  ],
  relatedProductIds: ["aura-g3", "duo-x200", "android-pos-50", "hubx-pro"],
  publicDownloadIds: ["thermal-v2-4-0"],
  publicArticleIds: ["art-t800-setup"],
  relatedVideoUrls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
  startingPrice: "$1,248",
  availability: "In Stock",
};

// ---------------------------------------------------------------------
// Public downloads (ONLY visibility="public")
// ---------------------------------------------------------------------

export const PUBLIC_DOWNLOADS: PublicDownloadItem[] = [
  { id: "thermal-v2-4-0", name: "Universal Thermal Printer Driver", version: "v2.4.1", category: "Driver", fileSize: "12.4 MB", releaseDate: "Oct 12, 2023", icon: "settings_input_component", gradient: "from-qbit-primary to-qbit-secondary", downloadCountLabel: "24.1k", productId: "hubx-pro" },
  { id: "scanner-sdk", name: "Barcode Scanner SDK", version: "v1.9", category: "SDK", fileSize: "128 MB", releaseDate: "Dec 12, 2023", icon: "code", gradient: "from-emerald-500 to-teal-600", downloadCountLabel: "18.7k", productId: "scanpro-m10" },
  { id: "t800-manual", name: "QBIT T-800 User Manual", version: "v4.0", category: "Manual", fileSize: "5.8 MB", releaseDate: "Oct 24, 2023", icon: "menu_book", gradient: "from-slate-700 to-slate-900", downloadCountLabel: "12.3k", productId: "qbit-t800" },
  { id: "t800-datasheet", name: "QBIT T-800 Datasheet", version: "v2.1", category: "Datasheet", fileSize: "2.4 MB", releaseDate: "Sep 15, 2023", icon: "description", gradient: "from-cyan-500 to-blue-600", downloadCountLabel: "6.8k", productId: "qbit-t800" },
  { id: "warranty-terms", name: "Warranty Terms & Conditions", version: "v2024", category: "Warranty", fileSize: "0.8 MB", releaseDate: "Jan 01, 2024", icon: "verified_user", gradient: "from-rose-500 to-pink-600", downloadCountLabel: "3.2k" },
];

// ---------------------------------------------------------------------
// Public articles (knowledge base)
// ---------------------------------------------------------------------

export const PUBLIC_ARTICLES: PublicArticleCard[] = [
  { id: "art-t800-setup", title: "Complete Guide: Setting Up the QBIT T-800 Windows POS Terminal", excerpt: "Learn how to unbox, mount, wire, and configure the QBIT T-800 Windows POS terminal from start to finish.", category: "Windows POS", icon: "desktop_windows", gradient: "from-qbit-primary to-qbit-secondary", readingTime: 12, difficulty: "Beginner", viewCountLabel: "12.4k", updatedAt: "Nov 20, 2023" },
  { id: "art-printer-troubleshoot", title: "Thermal Printer Not Printing: Diagnostic Guide", excerpt: "Step-by-step diagnostic for when your thermal printer stops responding.", category: "Thermal Printers", icon: "print", gradient: "from-slate-700 to-slate-900", readingTime: 8, difficulty: "Intermediate", viewCountLabel: "8.7k", updatedAt: "Nov 15, 2023" },
  { id: "art-firmware-update", title: "How to Safely Update POS Terminal Firmware", excerpt: "Best practices for updating POS-2000 and POS-3000 firmware, including rollback procedures.", category: "Firmware", icon: "memory", gradient: "from-purple-600 to-indigo-700", readingTime: 6, difficulty: "Intermediate", viewCountLabel: "5.2k", updatedAt: "Nov 18, 2023" },
];

// ---------------------------------------------------------------------
// Public announcements (only visibility="public")
// ---------------------------------------------------------------------

export const PUBLIC_ANNOUNCEMENTS: PublicAnnouncement[] = [
  { id: "an1", title: "Scheduled System Maintenance", body: "The QBIT Hub will undergo scheduled maintenance on Nov 24, 02:00 GMT. Expected downtime: 30 minutes.", type: "maintenance", severity: "warning", createdAt: "2 hours ago" },
  { id: "an2", title: "Firmware 4.0 Global Rollout", body: "Global rollout of Firmware 4.0 for all Retail Units is now live.", type: "firmware_release", severity: "info", createdAt: "Yesterday" },
  { id: "an4", title: "Driver Update: Nexus X1", body: "Critical security patch for Nexus X1 hub controller. CVE-2023-5421 patched.", type: "driver_update", severity: "critical", createdAt: "1 week ago" },
];

// ---------------------------------------------------------------------
// Product page: FAQs
// ---------------------------------------------------------------------

export const T800_FAQS: PublicFAQEntry[] = [
  { id: "faq-1", question: "What is the expected lifespan of the T-800 touch screen?", answer: "The T-800 touch screen is rated for 50 million touches per point, which typically translates to 7-10 years of enterprise use under normal retail conditions." },
  { id: "faq-2", question: "Can I upgrade the memory or storage?", answer: "Storage is field-upgradeable via the M.2 NVMe slot (up to 2TB). Memory (RAM) is soldered for stability and cannot be upgraded after purchase." },
  { id: "faq-3", question: "Is global on-site support available?", answer: "Yes, Enterprise Care is available in 45+ countries with next-business-day on-site service. Contact our sales team for SLA details and pricing." },
  { id: "faq-4", question: "What operating systems are supported?", answer: "Windows 11 IoT Enterprise (pre-installed), Ubuntu 22.04 LTS, and Android 13 (via dual-boot partition). Windows 10 IoT is supported until EOL in 2025." },
  { id: "faq-5", question: "Does the T-800 support dual displays?", answer: "Yes, the HDMI port supports a second customer-facing display up to 4K resolution at 60Hz. Use the QBIT Duo X-200 for integrated dual-screen setups." },
  { id: "faq-6", question: "What is the warranty period?", answer: "The T-800 comes with a 3-year limited warranty covering parts and labor. Extended 5-year warranty is available at checkout." },
];

// ---------------------------------------------------------------------
// Product page: Troubleshooting
// ---------------------------------------------------------------------

export const T800_TROUBLESHOOTING: PublicTroubleshootingEntry[] = [
  {
    id: "ts-1",
    problem: "Thermal printer not printing",
    causes: ["USB cable disconnected", "Driver not installed", "Paper roll empty", "Print head overheated"],
    solutions: ["Verify USB connection at both ends", "Download and install the Universal Thermal Printer Driver", "Replace the paper roll with 80mm thermal paper", "Allow 5 minutes cooldown for the print head"],
  },
  {
    id: "ts-2",
    problem: "Touch screen unresponsive",
    causes: ["Screen calibration drift", "Driver conflict", "Firmware version mismatch"],
    solutions: ["Run the QBIT Touch Calibration Utility", "Reinstall the touch driver from the Downloads section", "Update to firmware v4.1.2 or later"],
  },
  {
    id: "ts-3",
    problem: "Network connection drops intermittently",
    causes: ["Faulty LAN cable", "IP address conflict", "Switch port disabled"],
    solutions: ["Replace with a Cat6 shielded cable (max 100m)", "Assign a static IP outside the DHCP range", "Contact your IT administrator to enable the switch port"],
  },
];

// ---------------------------------------------------------------------
// Product page: Compatible accessories
// ---------------------------------------------------------------------

export const T800_ACCESSORIES: PublicAccessory[] = [
  { id: "acc-1", name: "Cash Drawer CD-24V", subtitle: "24V electronic cash drawer", icon: "account_balance_wallet", gradient: "from-amber-500 to-orange-600" },
  { id: "acc-2", name: "Barcode Scanner Q-200", subtitle: "2D imager, hands-free", icon: "barcode_scanner", gradient: "from-emerald-500 to-teal-600" },
  { id: "acc-3", name: "Customer Display CD-15", subtitle: "15-inch customer-facing display", icon: "tv", gradient: "from-fuchsia-600 to-purple-700" },
  { id: "acc-4", name: "Thermal Printer HUB-X Pro", subtitle: "80mm thermal receipt printer", icon: "print", gradient: "from-slate-700 to-slate-900" },
  { id: "acc-5", name: "UPS Backup 1500VA", subtitle: "Uninterruptible power supply", icon: "battery_charging_full", gradient: "from-cyan-500 to-blue-600" },
  { id: "acc-6", name: "Wall Mount Bracket", subtitle: "VESA-compatible mounting kit", icon: "mountain", gradient: "from-rose-500 to-pink-600" },
];

// ---------------------------------------------------------------------
// Product page: YouTube videos
// ---------------------------------------------------------------------

export const T800_VIDEOS: PublicYouTubeVideo[] = [
  { id: "vid-1", title: "QBIT T-800 Complete Setup Walkthrough", youtubeId: "dQw4w9WgXcQ", duration: "12:45", featured: true },
  { id: "vid-2", title: "Hardware Installation Guide", youtubeId: "dQw4w9WgXcQ", duration: "2:45" },
  { id: "vid-3", title: "Software Configuration", youtubeId: "dQw4w9WgXcQ", duration: "5:12" },
  { id: "vid-4", title: "Maintenance Basics", youtubeId: "dQw4w9WgXcQ", duration: "1:30" },
];

// ---------------------------------------------------------------------
// Product page: Support cards
// ---------------------------------------------------------------------

export const T800_SUPPORT_CARDS: SupportCardItem[] = [
  { id: "sup-1", title: "WhatsApp Support", meta: "24/7 Priority Chat", icon: "chat", href: "https://wa.me/15551002000", variant: "primary" },
  { id: "sup-2", title: "Call Technical Team", meta: "Mon-Fri, 9am - 6pm", icon: "call", href: "tel:+15551002000", variant: "outline" },
  { id: "sup-3", title: "Email Assistance", meta: "1-Hour Response Time", icon: "mail", href: "mailto:support@qbithub.io", variant: "outline" },
  { id: "sup-4", title: "Request a Demo", meta: "On-site or virtual demo", icon: "play_circle", href: "#contact", variant: "outline" },
  { id: "sup-5", title: "Contact Sales", meta: "Get a custom quote", icon: "storefront", href: "mailto:sales@qbithub.io", variant: "outline" },
];

// ---------------------------------------------------------------------
// Related products (filtered from PUBLIC_PRODUCTS, excluding current)
// ---------------------------------------------------------------------

export function getRelatedProducts(currentId: string): PublicProductCard[] {
  return PUBLIC_PRODUCTS.filter((p) => p.id !== currentId).slice(0, 4);
}
