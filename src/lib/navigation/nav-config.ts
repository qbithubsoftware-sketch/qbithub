import type { NavItem } from "@/components/qbit/shells/Sidebar";
import type { ScreenId } from "@/lib/navigation/store";

/** Engineer portal sidebar items. */
export const ENGINEER_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "engineer-dashboard" },
  { label: "Products", icon: "inventory_2", screen: "product-library" },
  { label: "Drivers", icon: "settings_input_component", screen: "driver-download-center" },
  { label: "Installation Guides", icon: "menu_book", screen: "installation-center" },
  { label: "Videos", icon: "play_circle", screen: "video-training-center" },
  { label: "Downloads", icon: "download", screen: "driver-download-center" },
  { label: "Knowledge Base", icon: "library_books", screen: "ai-support-center" },
  { label: "Troubleshooting", icon: "build", screen: "ai-support-center" },
  { label: "Bookmarks", icon: "bookmark", screen: "engineer-dashboard" },
  { label: "Recent Files", icon: "history", screen: "engineer-dashboard" },
  { label: "Support", icon: "contact_support", screen: "ai-support-center" },
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
      {
        label: "Drivers",
        icon: "memory",
        children: [
          { label: "Windows Driver", icon: "desktop_windows", screen: "upload-driver" },
          { label: "Android Driver", icon: "phone_android", screen: "upload-driver" },
          { label: "Linux Driver", icon: "terminal", screen: "upload-driver" },
          { label: "Mac Driver", icon: "laptop_mac", screen: "upload-driver" },
          { label: "OPOS Driver", icon: "point_of_sale", screen: "upload-driver" },
          { label: "JavaPOS Driver", icon: "coffee", screen: "upload-driver" },
          { label: "Thermal Printer Driver", icon: "print", screen: "upload-driver" },
          { label: "Barcode Scanner Driver", icon: "barcode_scanner", screen: "upload-driver" },
          { label: "Touch Driver", icon: "touch_app", screen: "upload-driver" },
          { label: "USB Driver", icon: "usb", screen: "upload-driver" },
          { label: "LAN Driver", icon: "lan", screen: "upload-driver" },
          { label: "WiFi Driver", icon: "wifi", screen: "upload-driver" },
          { label: "Bluetooth Driver", icon: "bluetooth", screen: "upload-driver" },
        ],
      },
      {
        label: "Manuals",
        icon: "menu_book",
        children: [
          { label: "User Manual", icon: "description", screen: "upload-manual" },
          { label: "Installation Guide", icon: "menu_book", screen: "upload-guide" },
          { label: "Quick Start Guide", icon: "flash_on", screen: "upload-manual" },
          { label: "Datasheet", icon: "article", screen: "upload-datasheet" },
          { label: "Brochure", icon: "picture_as_pdf", screen: "upload-brochure" },
          { label: "Warranty PDF", icon: "verified_user", screen: "upload-warranty" },
        ],
      },
      {
        label: "Firmware",
        icon: "upgrade",
        children: [
          { label: "Firmware Upload", icon: "upgrade", screen: "upload-firmware" },
          { label: "BIOS Upload", icon: "bios", screen: "upload-firmware" },
          { label: "Release Notes", icon: "release_notes", screen: "upload-firmware" },
        ],
      },
      {
        label: "SDK & Utilities",
        icon: "code",
        children: [
          { label: "SDK Upload", icon: "code", screen: "upload-sdk" },
          { label: "Utility Upload", icon: "build", screen: "upload-driver" },
          { label: "API Package", icon: "api", screen: "upload-sdk" },
        ],
      },
      {
        label: "Videos",
        icon: "videocam",
        children: [
          { label: "Product Demo", icon: "play_circle", screen: "upload-video" },
          { label: "Installation Video", icon: "build", screen: "upload-video" },
          { label: "Training Video", icon: "school", screen: "upload-video" },
          { label: "YouTube Links", icon: "smart_display", screen: "upload-video" },
        ],
      },
      {
        label: "Documents",
        icon: "folder",
        children: [
          { label: "Certificates", icon: "workspace_premium", screen: "upload-certificate" },
          { label: "Compliance", icon: "gavel", screen: "upload-certificate" },
          { label: "Safety Documents", icon: "health_and_safety", screen: "upload-certificate" },
          { label: "Other Files", icon: "attach_file", screen: "upload-certificate" },
        ],
      },
    ],
  },
  { label: "Drivers", icon: "local_shipping", screen: "driver-download-center" },
  { label: "Manuals", icon: "menu_book", screen: "installation-center" },
  { label: "Videos", icon: "videocam", screen: "video-training-center" },
  { label: "Users", icon: "group", screen: "user-role-management" },
  { label: "Analytics", icon: "monitoring", screen: "admin-dashboard" },
  { label: "Settings", icon: "settings", screen: "system-settings" },
];

/** InstalCore variant (used by installation_center + t_800_installation_guide + customer_handover_report + video_training). */
export const INSTALCORE_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "engineer-dashboard" },
  { label: "Products", icon: "inventory_2", screen: "product-library" },
  { label: "Drivers", icon: "settings_input_component", screen: "driver-download-center" },
  { label: "Installation Guides", icon: "menu_book", screen: "installation-center" },
  { label: "Videos", icon: "video_library", screen: "video-training-center" },
  { label: "Downloads", icon: "download", screen: "driver-download-center" },
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
