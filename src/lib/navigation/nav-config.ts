import type { NavItem } from "@/components/qbit/shells/Sidebar";
import type { ScreenId } from "@/lib/navigation/store";

/** Engineer portal sidebar items — simplified for installation engineers. */
export const ENGINEER_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "engineer-portal" },
  { label: "Jobs / Installations", icon: "engineering", screen: "engineer-jobs" },
  { label: "Dr. QBIT", icon: "smart_toy", screen: "dr-qbit-detection" },
  { label: "Knowledge Base", icon: "menu_book", screen: "engineer-knowledge" },
  { label: "Downloads", icon: "download", screen: "engineer-downloads" },
  { label: "Troubleshooting", icon: "build", screen: "engineer-troubleshooting" },
  { label: "Support", icon: "contact_support", screen: "ai-support-center" },
];

export const ENGINEER_FOOTER: NavItem[] = [
  { label: "Settings", icon: "settings", screen: "system-settings" },
  { label: "Collapse", icon: "menu_open" },
];

/** Admin portal sidebar items. */
export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", screen: "home" },
  { label: "Product & Resource Manager", icon: "inventory_2", screen: "product-resource-manager", badge: "NEW" },
  { label: "Global Resource Library", icon: "library_books", screen: "resource-library", badge: "V5" },
  { label: "Product Master", icon: "database", screen: "product-master" },
  { label: "Device Lookup", icon: "search", screen: "ai-purchase-center", badge: "NEW" },
  { label: "Users", icon: "group", screen: "user-role-management" },
  { label: "Analytics", icon: "monitoring", screen: "admin-dashboard" },
  { label: "AI Diagnostic", icon: "psychology", screen: "ai-diagnostic-center", badge: "AI" },
  { label: "Engineering", icon: "engineering", screen: "engineering-dashboard", badge: "NEW" },
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
