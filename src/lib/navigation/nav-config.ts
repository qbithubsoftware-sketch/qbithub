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
  { label: "Products", icon: "inventory_2", screen: "product-management" },
  { label: "Product Master", icon: "database", screen: "product-master", badge: "PIM" },
  { label: "AI Purchase Import", icon: "auto_awesome", screen: "ai-purchase-center", badge: "NEW" },
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
  { label: "Inventory", icon: "inventory_2", screen: "product-management" },
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
