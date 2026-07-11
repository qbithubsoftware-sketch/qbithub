/**
 * Placeholder data for the Home Dashboard.
 *
 * These are typed static values used to render the dashboard UI before
 * the backend modules are implemented.  When real data becomes available,
 * replace these exports with API calls that return the same shapes.
 */

import type {
  SystemStatusItem,
  QuickAccessItem,
  FeaturedProduct,
  ContinueWorkingItem,
  SystemUpdateItem,
  PopularDownload,
  BookmarkItem,
  PinnedResource,
  Announcement,
  ActivityEntry,
} from "@/components/qbit/dashboard/types";

export const SYSTEM_STATUS: SystemStatusItem[] = [
  {
    label: "Total Products",
    value: "1,284",
    icon: "inventory_2",
    delta: "+4%",
    deltaVariant: "up",
    iconBg: "bg-qbit-primary/10 text-qbit-primary",
  },
  {
    label: "Drivers Active",
    value: "342",
    icon: "download_for_offline",
    delta: "+12%",
    deltaVariant: "up",
    iconBg: "bg-qbit-secondary/10 text-qbit-secondary",
  },
  {
    label: "Guides & Manuals",
    value: "891",
    icon: "menu_book",
    delta: "Stable",
    deltaVariant: "neutral",
    iconBg: "bg-qbit-tertiary/10 text-qbit-tertiary",
  },
  {
    label: "Training Videos",
    value: "156",
    icon: "videocam",
    delta: "-2%",
    deltaVariant: "down",
    iconBg: "bg-qbit-error/10 text-qbit-error",
  },
];

export const QUICK_ACCESS: QuickAccessItem[] = [
  { label: "Products", sub: "Browse Catalog", icon: "inventory_2", screen: "product-library" },
  { label: "Drivers", sub: "Latest Firmware", icon: "local_shipping", screen: "driver-download-center" },
  { label: "Install Guides", sub: "Setup Workflows", icon: "integration_instructions", screen: "installation-center" },
  { label: "Manuals", sub: "Documentation", icon: "menu_book", screen: "installation-center" },
  { label: "Troubleshooting", sub: "Error Codes", icon: "quiz", screen: "ai-support-center" },
  { label: "Knowledge Base", sub: "Article Wiki", icon: "hub", screen: "ai-support-center" },
];

export const FEATURED_PRODUCTS: FeaturedProduct[] = [
  {
    name: "QBIT Nexus X1",
    description: "Enterprise Hub Controller v2.0",
    badge: "New",
    badgeVariant: "primary",
    gradient: "from-qbit-primary to-qbit-secondary",
    icon: "router",
  },
  {
    name: "Aura Terminal G3",
    description: "Advanced POS Interface System",
    badge: "Updated",
    badgeVariant: "neutral",
    gradient: "from-purple-500 to-indigo-600",
    icon: "point_of_sale",
  },
  {
    name: "Optic Pro Scan",
    description: "Precision Inventory Scanner",
    badge: "Featured",
    badgeVariant: "primary",
    gradient: "from-amber-500 to-orange-600",
    icon: "barcode_scanner",
  },
];

export const CONTINUE_WORKING: ContinueWorkingItem[] = [
  {
    name: "X1_Firmware_v4.2.bin",
    type: "Driver",
    time: "2 hours ago",
    icon: "download",
    iconBg: "bg-qbit-secondary/10",
  },
  {
    name: "Setup_Manual_Terminal_G3",
    type: "Manual",
    time: "5 hours ago",
    icon: "menu_book",
    iconBg: "bg-qbit-tertiary/10",
  },
  {
    name: "Troubleshooting_Optic_Pro",
    type: "Video",
    time: "Yesterday",
    icon: "videocam",
    iconBg: "bg-qbit-primary/10",
  },
];

export const SYSTEM_UPDATES: SystemUpdateItem[] = [
  {
    title: "Critical Driver Update",
    description: "Nexus X1 security patch released.",
    meta: "TODAY 08:30 AM",
    variant: "critical",
  },
  {
    title: "New Manual Added",
    description: "Aura Terminal G3 troubleshooting guide.",
    meta: "Oct 21, 2023",
    variant: "info",
  },
  {
    title: "Server Maintenance",
    description: "Completed scheduled API optimization.",
    meta: "Oct 20, 2023",
    variant: "neutral",
  },
];

export const POPULAR_DOWNLOADS: PopularDownload[] = [
  {
    name: "Universal Thermal Printer Driver v2.4.1",
    category: "Driver • HUB-X Pro Series",
    size: "12.4 MB",
    downloads: "24.1k",
    icon: "print",
    iconBg: "bg-qbit-primary/10 text-qbit-primary",
  },
  {
    name: "Barcode Scanner SDK v1.9",
    category: "SDK • Q-Series",
    size: "128 MB",
    downloads: "18.7k",
    icon: "barcode_scanner",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "QBIT T-800 User Manual v4.0",
    category: "Manual • PDF",
    size: "5.8 MB",
    downloads: "12.3k",
    icon: "picture_as_pdf",
    iconBg: "bg-amber-100 text-amber-700",
  },
];

export const BOOKMARKS: BookmarkItem[] = [
  {
    title: "QBIT T-800 Product Details",
    type: "Product",
    icon: "inventory_2",
    time: "Pinned 2 days ago",
  },
  {
    title: "T-800 Installation Guide",
    type: "Guide",
    icon: "menu_book",
    time: "Pinned yesterday",
  },
  {
    title: "Thermal Printer Driver v2.4.1",
    type: "Driver",
    icon: "settings_input_component",
    time: "Pinned 3 hours ago",
  },
];

export const PINNED_RESOURCES: PinnedResource[] = [
  {
    title: "Windows POS Setup Guide",
    badge: "Popular",
    badgeVariant: "primary",
    icon: "desktop_windows",
    gradient: "from-qbit-primary/80 to-qbit-secondary",
  },
  {
    title: "Thermal Printer Driver",
    badge: "Driver",
    badgeVariant: "neutral",
    icon: "print",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "Barcode Scanner Manual",
    badge: "Manual",
    badgeVariant: "success",
    icon: "barcode_scanner",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    title: "Android POS Installation",
    badge: "Android",
    badgeVariant: "warning",
    icon: "phone_android",
    gradient: "from-purple-500 to-pink-600",
  },
];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    title: "Scheduled Maintenance",
    body: "System maintenance on Nov 24, 02:00 GMT. Expected downtime: 30 minutes.",
    icon: "campaign",
    variant: "info",
    time: "2 hours ago",
  },
  {
    title: "Firmware 4.0 Rollout",
    body: "Global rollout of Firmware 4.0 for all Retail Units is now live.",
    icon: "system_update",
    variant: "success",
    time: "Yesterday",
  },
  {
    title: "Security Protocol Update",
    body: "New security protocols for data encryption have been added to the KB.",
    icon: "shield",
    variant: "warning",
    time: "3 days ago",
  },
];

export const RECENT_ACTIVITY: ActivityEntry[] = [
  {
    id: "1",
    icon: "settings_input_component",
    title: "Driver Updated: QBIT T-800",
    meta: "v2.4.1 • Universal Thermal Printer Driver",
    time: "2h ago",
    iconBg: "bg-qbit-primary/10 text-qbit-primary",
  },
  {
    id: "2",
    icon: "menu_book",
    title: "Manual Revised: Android Kiosk",
    meta: "Updated setup instructions for v4.2",
    time: "5h ago",
    iconBg: "bg-qbit-tertiary/10 text-qbit-tertiary",
  },
  {
    id: "3",
    icon: "inventory_2",
    title: "Product Added: HUB-X Pro",
    meta: "New thermal printer added to catalog",
    time: "Yesterday",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "4",
    icon: "videocam",
    title: "Video Uploaded: Fiber Cabling",
    meta: "New training video • 12:45 duration",
    time: "2 days ago",
    iconBg: "bg-amber-100 text-amber-700",
  },
];
