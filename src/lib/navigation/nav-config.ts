import type { NavItem } from "@/components/qbit/shells/Sidebar";
import type { ScreenId } from "@/lib/navigation/store";

/** Engineer portal sidebar items. */
export const ENGINEER_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "engineer-dashboard" },
  { label: "Products", icon: "inventory_2", screen: "product-library" },
  {
    label: "Drivers",
    icon: "settings_input_component",
    children: [
      { label: "Dashboard", icon: "dashboard", screen: "driver-download-center" },
      { label: "Driver Upload", icon: "upload_file", screen: "upload-driver" },
      { label: "Windows Drivers", icon: "desktop_windows", screen: "driver-download-center" },
      { label: "Android Drivers", icon: "phone_android", screen: "driver-download-center" },
      { label: "Linux Drivers", icon: "terminal", screen: "driver-download-center" },
      { label: "macOS Drivers", icon: "laptop_mac", screen: "driver-download-center" },
      { label: "Firmware", icon: "upgrade", screen: "upload-firmware" },
      { label: "SDK", icon: "code", screen: "upload-sdk" },
      { label: "Utility Files", icon: "build", screen: "driver-download-center" },
      { label: "OPOS Drivers", icon: "point_of_sale", screen: "driver-download-center" },
      { label: "JavaPOS Drivers", icon: "coffee", screen: "driver-download-center" },
      { label: "Printer Drivers", icon: "print", screen: "driver-download-center" },
      { label: "Barcode Scanner Drivers", icon: "barcode_scanner", screen: "driver-download-center" },
      { label: "POS Machine Drivers", icon: "point_of_sale", screen: "driver-download-center" },
      { label: "Customer Display Drivers", icon: "monitor", screen: "driver-download-center" },
      { label: "Cash Drawer Drivers", icon: "account_balance_wallet", screen: "driver-download-center" },
      { label: "Other Drivers", icon: "memory", screen: "driver-download-center" },
    ],
  },
  {
    label: "Manuals",
    icon: "menu_book",
    children: [
      { label: "Dashboard", icon: "dashboard", screen: "installation-center" },
      { label: "User Manuals", icon: "description", screen: "upload-manual" },
      { label: "Installation Guides", icon: "menu_book", screen: "upload-guide" },
      { label: "Quick Start Guides", icon: "flash_on", screen: "upload-manual" },
      { label: "Warranty Documents", icon: "verified_user", screen: "upload-warranty" },
      { label: "Datasheets", icon: "article", screen: "upload-datasheet" },
      { label: "Brochures", icon: "picture_as_pdf", screen: "upload-brochure" },
      { label: "Product Catalogues", icon: "library_books", screen: "installation-center" },
    ],
  },
  {
    label: "Videos",
    icon: "play_circle",
    children: [
      { label: "Dashboard", icon: "dashboard", screen: "video-training-center" },
      { label: "Product Demo Videos", icon: "play_circle", screen: "upload-video" },
      { label: "Installation Videos", icon: "build", screen: "upload-video" },
      { label: "Training Videos", icon: "school", screen: "upload-video" },
      { label: "Troubleshooting Videos", icon: "build_circle", screen: "upload-video" },
      { label: "Firmware Update Videos", icon: "upgrade", screen: "upload-video" },
      { label: "Marketing Videos", icon: "campaign", screen: "upload-video" },
    ],
  },
  {
    label: "Downloads",
    icon: "download",
    children: [
      { label: "Dashboard", icon: "dashboard", screen: "driver-download-center" },
      { label: "Latest Downloads", icon: "new_releases", screen: "driver-download-center" },
      { label: "Popular Downloads", icon: "trending_up", screen: "driver-download-center" },
      { label: "Recent Downloads", icon: "history", screen: "driver-download-center" },
      { label: "Shared Downloads", icon: "share", screen: "driver-download-center" },
    ],
  },
  {
    label: "Knowledge Base",
    icon: "library_books",
    children: [
      { label: "Dashboard", icon: "dashboard", screen: "ai-support-center" },
      { label: "FAQs", icon: "quiz", screen: "ai-support-center" },
      { label: "Product Articles", icon: "article", screen: "ai-support-center" },
      { label: "Driver Articles", icon: "memory", screen: "ai-support-center" },
      { label: "Installation Articles", icon: "build", screen: "ai-support-center" },
      { label: "Warranty Articles", icon: "verified_user", screen: "ai-support-center" },
      { label: "Service Articles", icon: "home_repair_service", screen: "ai-support-center" },
    ],
  },
  {
    label: "Troubleshooting",
    icon: "build",
    children: [
      { label: "Dashboard", icon: "dashboard", screen: "ai-support-center" },
      { label: "Printer Issues", icon: "print", screen: "ai-support-center" },
      { label: "Barcode Scanner Issues", icon: "barcode_scanner", screen: "ai-support-center" },
      { label: "POS Machine Issues", icon: "point_of_sale", screen: "ai-support-center" },
      { label: "Android POS Issues", icon: "phone_android", screen: "ai-support-center" },
      { label: "Windows POS Issues", icon: "desktop_windows", screen: "ai-support-center" },
      { label: "Driver Issues", icon: "memory", screen: "ai-support-center" },
      { label: "Installation Issues", icon: "build", screen: "ai-support-center" },
      { label: "Network Issues", icon: "wifi", screen: "ai-support-center" },
      { label: "Firmware Recovery", icon: "upgrade", screen: "ai-support-center" },
      { label: "Common Errors", icon: "error", screen: "ai-support-center" },
    ],
  },
  {
    label: "Bookmarks",
    icon: "bookmark",
    children: [
      { label: "Drivers", icon: "memory", screen: "engineer-dashboard" },
      { label: "Manuals", icon: "menu_book", screen: "engineer-dashboard" },
      { label: "Videos", icon: "play_circle", screen: "engineer-dashboard" },
      { label: "Products", icon: "inventory_2", screen: "engineer-dashboard" },
      { label: "Devices", icon: "devices", screen: "engineer-dashboard" },
    ],
  },
  {
    label: "Recent Files",
    icon: "history",
    children: [
      { label: "Recent Drivers", icon: "memory", screen: "engineer-dashboard" },
      { label: "Recent Manuals", icon: "menu_book", screen: "engineer-dashboard" },
      { label: "Recent Videos", icon: "play_circle", screen: "engineer-dashboard" },
      { label: "Recent Documents", icon: "description", screen: "engineer-dashboard" },
    ],
  },
  {
    label: "Support",
    icon: "contact_support",
    children: [
      { label: "Contact Support", icon: "contact_support", screen: "ai-support-center" },
      { label: "Raise Ticket", icon: "confirmation_number", screen: "ai-support-center" },
      { label: "Live Chat", icon: "chat", screen: "ai-support-center" },
      { label: "Remote Support", icon: "remote_desktop", screen: "ai-support-center" },
      { label: "Download AnyDesk", icon: "download", screen: "ai-support-center" },
      { label: "Download TeamViewer", icon: "download", screen: "ai-support-center" },
    ],
  },
];

export const ENGINEER_FOOTER: NavItem[] = [
  { label: "Settings", icon: "settings", screen: "system-settings" },
  { label: "Collapse", icon: "menu_open" },
];

/** Admin portal sidebar items. */
export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "home" },
  { label: "Product Master", icon: "database", screen: "product-master", badge: "PIM" },
  { label: "Device Lookup", icon: "search", screen: "ai-purchase-center", badge: "NEW" },
  {
    label: "Upload Master",
    icon: "folder_open",
    children: [
      { label: "Window POS", icon: "desktop_windows", screen: "upload-driver" },
      { label: "Android POS", icon: "phone_android", screen: "upload-driver" },
      { label: "Handy POS", icon: "phone_android", screen: "upload-driver" },
      { label: "Thermal Printer", icon: "print", screen: "upload-driver" },
      { label: "Portable Printer", icon: "print", screen: "upload-driver" },
      { label: "Barcode Printer", icon: "label", screen: "upload-driver" },
      { label: "Barcode Scanner", icon: "barcode_scanner", screen: "upload-driver" },
      { label: "Cash Drawer", icon: "account_balance_wallet", screen: "upload-driver" },
      { label: "Customer Display", icon: "monitor", screen: "upload-driver" },
      { label: "Self Ordering Kiosk", icon: "storefront", screen: "upload-driver" },
      { label: "Digital Standee", icon: "monitor", screen: "upload-driver" },
    ],
  },
  { label: "Users", icon: "group", screen: "user-role-management" },
  { label: "Analytics", icon: "monitoring", screen: "admin-dashboard" },
  { label: "Settings", icon: "settings", screen: "system-settings" },
];

/** InstalCore variant (used by installation_center + t_800_installation_guide + customer_handover_report + video_training). */
export const INSTALCORE_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "engineer-dashboard" },
  { label: "Products", icon: "inventory_2", screen: "product-library" },
  {
    label: "Drivers",
    icon: "settings_input_component",
    children: [
      { label: "Dashboard", icon: "dashboard", screen: "driver-download-center" },
      { label: "Windows Drivers", icon: "desktop_windows", screen: "driver-download-center" },
      { label: "Android Drivers", icon: "phone_android", screen: "driver-download-center" },
      { label: "Linux Drivers", icon: "terminal", screen: "driver-download-center" },
      { label: "Firmware", icon: "upgrade", screen: "upload-firmware" },
      { label: "SDK", icon: "code", screen: "upload-sdk" },
      { label: "Utility Files", icon: "build", screen: "driver-download-center" },
    ],
  },
  {
    label: "Installation Guides",
    icon: "menu_book",
    children: [
      { label: "Dashboard", icon: "dashboard", screen: "installation-center" },
      { label: "User Manuals", icon: "description", screen: "upload-manual" },
      { label: "Quick Start Guides", icon: "flash_on", screen: "upload-manual" },
      { label: "Datasheets", icon: "article", screen: "upload-datasheet" },
    ],
  },
  {
    label: "Videos",
    icon: "video_library",
    children: [
      { label: "Dashboard", icon: "dashboard", screen: "video-training-center" },
      { label: "Installation Videos", icon: "build", screen: "upload-video" },
      { label: "Training Videos", icon: "school", screen: "upload-video" },
    ],
  },
  {
    label: "Downloads",
    icon: "download",
    children: [
      { label: "Latest", icon: "new_releases", screen: "driver-download-center" },
      { label: "Popular", icon: "trending_up", screen: "driver-download-center" },
      { label: "Recent", icon: "history", screen: "driver-download-center" },
    ],
  },
  { label: "Settings", icon: "settings", screen: "system-settings" },
];

/** Field engineer sidebar items. */
export const FIELD_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "field-engineer-workspace" },
  { label: "My Jobs", icon: "engineering", screen: "job-details-inst-550-a" },
  { label: "Inventory", icon: "inventory_2", screen: "product-master" },
  { label: "Documents", icon: "description", screen: "customer-handover-report" },
  { label: "Support", icon: "support_agent", screen: "ai-support-center" },
];

/** AI support sidebar items. */
export const AI_SUPPORT_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "ai-support-center" },
  { label: "Knowledge Base", icon: "menu_book", screen: "ai-support-center" },
  { label: "Troubleshooting", icon: "build", screen: "ai-support-center" },
  { label: "Support Tickets", icon: "confirmation_number", screen: "ai-support-center" },
  { label: "Analytics", icon: "insights", screen: "admin-dashboard" },
];

/** Universal search command center sidebar items. */
export const COMMAND_CENTER_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "universal-search-command-center" },
  { label: "Knowledge Base", icon: "menu_book", screen: "ai-support-center" },
  { label: "Troubleshooting", icon: "build", screen: "ai-support-center" },
  { label: "Support Tickets", icon: "confirmation_number", screen: "ai-support-center" },
  { label: "Analytics", icon: "insights", screen: "admin-dashboard" },
];

/** Field Service Management sidebar items — installation & service team only. */
export const FSM_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "fsm-dashboard" },
  { label: "Work Orders", icon: "assignment", screen: "fsm-dashboard" },
  { label: "Asset History", icon: "history", screen: "fsm-customer-asset-history" },
  { label: "Notifications", icon: "notifications", screen: "notification-center" },
  { label: "Dr. QBIT", icon: "smart_toy", screen: "ai-support-center" },
  { label: "Knowledge Base", icon: "library_books", screen: "ai-support-center" },
  { label: "Support", icon: "contact_support", screen: "ai-support-center" },
];

/** Notification Automation Engine sidebar items — admin only. */
export const NOTIFICATION_NAV: NavItem[] = [
  { label: "Notification Center", icon: "notifications", screen: "notification-center" },
  { label: "Templates", icon: "description", screen: "notification-template-manager" },
  { label: "History", icon: "history", screen: "notification-history" },
  { label: "Reminders", icon: "schedule", screen: "notification-reminders" },
  { label: "Dashboard", icon: "dashboard", screen: "home" },
  { label: "Settings", icon: "settings", screen: "system-settings" },
];

export type { ScreenId };
