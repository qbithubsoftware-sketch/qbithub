/**
 * Placeholder data for the Enterprise Admin Control Center.
 */

import type {
  AdminStatItem,
  AuditLogEntry,
  ActivityFeedEntry,
  AnnouncementItem,
  AdminUserRow,
  PermissionRow,
  AdminProductRow,
  AdminAssetRow,
  AnalyticsCardItem,
  SystemHealthItem,
  RecentUploadRow,
  AdminNotificationItem,
  SystemSettingEntry,
  PermissionKey,
} from "./types";

// ---------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------

export const ADMIN_STATS: AdminStatItem[] = [
  { label: "Total Products", value: "124", icon: "inventory_2", delta: "+12%", deltaVariant: "up", iconBg: "bg-qbit-primary/10 text-qbit-primary", category: "inventory" },
  { label: "Total Assets", value: "1,847", icon: "folder_special", delta: "+8%", deltaVariant: "up", iconBg: "bg-qbit-secondary/10 text-qbit-secondary", category: "inventory" },
  { label: "Drivers", value: "342", icon: "settings_input_component", delta: "+5", deltaVariant: "up", iconBg: "bg-emerald-100 text-emerald-700", category: "inventory" },
  { label: "Manuals", value: "891", icon: "menu_book", delta: "Stable", deltaVariant: "neutral", iconBg: "bg-amber-100 text-amber-700", category: "inventory" },
  { label: "Firmware", value: "42", icon: "memory", delta: "+2", deltaVariant: "up", iconBg: "bg-purple-100 text-purple-700", category: "inventory" },
  { label: "SDK", value: "18", icon: "code", delta: "+1", deltaVariant: "up", iconBg: "bg-cyan-100 text-cyan-700", category: "inventory" },
  { label: "Videos", value: "156", icon: "videocam", delta: "+4", deltaVariant: "up", iconBg: "bg-red-100 text-red-700", category: "inventory" },
  { label: "Knowledge Articles", value: "248", icon: "library_books", delta: "+12", deltaVariant: "up", iconBg: "bg-indigo-100 text-indigo-700", category: "inventory" },
  { label: "Installation Guides", value: "35", icon: "build", delta: "+3", deltaVariant: "up", iconBg: "bg-teal-100 text-teal-700", category: "inventory" },
  { label: "Categories", value: "12", icon: "category", delta: "Stable", deltaVariant: "neutral", iconBg: "bg-slate-100 text-slate-700", category: "inventory" },
  { label: "Users", value: "856", icon: "group", delta: "+8.4%", deltaVariant: "up", iconBg: "bg-qbit-primary/10 text-qbit-primary", category: "users" },
  { label: "Roles", value: "7", icon: "admin_panel_settings", delta: "Stable", deltaVariant: "neutral", iconBg: "bg-qbit-tertiary/10 text-qbit-tertiary", category: "users" },
  { label: "Storage Used", value: "65%", icon: "storage", delta: "Critical", deltaVariant: "down", iconBg: "bg-red-100 text-red-700", category: "health" },
  { label: "Pending Reviews", value: "9", icon: "pending_actions", delta: "+3", deltaVariant: "up", iconBg: "bg-amber-100 text-amber-700", category: "usage" },
];

// ---------------------------------------------------------------------
// System health
// ---------------------------------------------------------------------

export const SYSTEM_HEALTH: SystemHealthItem[] = [
  { label: "API Response", value: "142ms", status: "optimal", icon: "speed", progress: 95 },
  { label: "Database", value: "Healthy", status: "optimal", icon: "database", progress: 98 },
  { label: "Cloud Storage", value: "65% used", status: "warning", icon: "cloud", progress: 65 },
  { label: "License Server", value: "Active", status: "optimal", icon: "vpn_key", progress: 100 },
  { label: "Email Service", value: "Operational", status: "optimal", icon: "mail", progress: 99 },
  { label: "Backup Status", value: "Last: 2h ago", status: "optimal", icon: "backup", progress: 100 },
];

// ---------------------------------------------------------------------
// Recent uploads
// ---------------------------------------------------------------------

export const RECENT_UPLOADS: RecentUploadRow[] = [
  { name: "Q-Core Engine V2", category: "Hardware", status: "published", updated: "2 mins ago", icon: "memory", gradient: "from-qbit-primary to-qbit-secondary" },
  { name: "Network Map 2024", category: "Manual", status: "draft", updated: "1 hour ago", icon: "map", gradient: "from-qbit-tertiary to-qbit-tertiary-container" },
  { name: "PCIe Kernel Driver", category: "Drivers", status: "published", updated: "Yesterday", icon: "settings_input_component", gradient: "from-qbit-primary-container to-qbit-secondary-container" },
];

// ---------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------

export const ACTIVITY_FEED: ActivityFeedEntry[] = [
  { id: "af1", userName: "Alex Johnson", action: "uploaded a new product manual", entity: "Setup_Guide_V3.pdf", icon: "upload", dotColor: "primary", attachment: { icon: "picture_as_pdf", label: "Setup_Guide_V3.pdf" }, time: "2 minutes ago" },
  { id: "af2", userName: "Sarah Chen", action: "updated Driver #42", entity: "Universal Thermal Printer Driver", icon: "edit", dotColor: "secondary", time: "15 minutes ago" },
  { id: "af3", userName: "System", action: "Security alert: Unrecognized login attempt from IP 192.168.1.45", icon: "security", dotColor: "error", time: "1 hour ago" },
  { id: "af4", userName: "Admin", action: "invited 3 new team members", icon: "group_add", dotColor: "neutral", invitees: ["MK", "PT", "RL"], time: "3 hours ago" },
  { id: "af5", userName: "Automator", action: "Backups completed successfully", icon: "backup", dotColor: "neutral", dim: true, time: "Yesterday 11:45 PM" },
];

// ---------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------

export const AUDIT_LOGS: AuditLogEntry[] = [
  { id: "al1", userName: "Alex Rivera", action: "login", actionLabel: "Logged in", entity: "session", description: "Successful login from Chrome on macOS", ipAddress: "192.168.1.10", createdAt: "2 mins ago", icon: "login", dotColor: "primary" },
  { id: "al2", userName: "Sarah Chen", action: "upload", actionLabel: "Uploaded", entity: "driver", entityName: "Universal Thermal Printer Driver v2.4.1", description: "New driver version published", ipAddress: "192.168.1.24", createdAt: "15 mins ago", icon: "upload", dotColor: "secondary" },
  { id: "al3", userName: "Alex Rivera", action: "edit", actionLabel: "Edited", entity: "product", entityName: "QBIT T-800", description: "Updated product specifications", ipAddress: "192.168.1.10", createdAt: "1 hour ago", icon: "edit", dotColor: "primary" },
  { id: "al4", userName: "System", action: "delete", actionLabel: "Deleted", entity: "article", entityName: "Legacy T-800 Setup Guide", description: "Auto-cleanup of outdated article", createdAt: "2 hours ago", icon: "delete", dotColor: "error" },
  { id: "al5", userName: "Jordan Smythe", action: "download", actionLabel: "Downloaded", entity: "manual", entityName: "HUB-X Pro User Manual", ipAddress: "10.0.0.45", createdAt: "3 hours ago", icon: "download", dotColor: "neutral" },
  { id: "al6", userName: "Alex Rivera", action: "role_change", actionLabel: "Changed role for", entity: "user", entityName: "Sarah Chen", description: "Role changed from Viewer to Support Engineer", ipAddress: "192.168.1.10", createdAt: "5 hours ago", icon: "admin_panel_settings", dotColor: "primary" },
  { id: "al7", userName: "Alex Rivera", action: "settings_change", actionLabel: "Updated", entity: "setting", entityName: "Default Language", description: "Changed from English to Spanish", ipAddress: "192.168.1.10", createdAt: "Yesterday", icon: "settings", dotColor: "neutral" },
  { id: "al8", userName: "Sarah Chen", action: "logout", actionLabel: "Logged out", entity: "session", ipAddress: "192.168.1.24", createdAt: "Yesterday", icon: "logout", dotColor: "neutral" },
];

// ---------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------

export const ANNOUNCEMENTS: AnnouncementItem[] = [
  { id: "an1", title: "Scheduled System Maintenance", body: "The QBIT Hub will undergo scheduled maintenance on Nov 24, 02:00 GMT. Expected downtime: 30 minutes.", type: "maintenance", severity: "warning", visibility: "public", active: true, startsAt: "Nov 24, 2023 02:00 GMT", createdAt: "2 hours ago" },
  { id: "an2", title: "Firmware 4.0 Global Rollout", body: "Global rollout of Firmware 4.0 for all Retail Units is now live. Update your devices at your earliest convenience.", type: "firmware_release", severity: "info", visibility: "public", active: true, createdAt: "Yesterday" },
  { id: "an3", title: "New Security Protocols", body: "New security protocols for data encryption have been added to the Knowledge Base. All engineers must review.", type: "system_message", severity: "info", visibility: "internal", active: true, createdAt: "3 days ago" },
  { id: "an4", title: "Driver Update: Nexus X1", body: "Critical security patch for Nexus X1 hub controller. CVE-2023-5421 patched.", type: "driver_update", severity: "critical", visibility: "public", active: true, createdAt: "1 week ago" },
];

// ---------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------

export const ADMIN_USERS: AdminUserRow[] = [
  { id: "u1", name: "Alex Rivera", email: "alex.rivera@qbithub.com", phone: "+1 (555) 123-4567", department: "Engineering", role: "Administrator", roleBadge: "primary", status: "Active", lastLogin: "2 hours ago", createdAt: "Jan 15, 2023", initials: "AR", avatarBg: "bg-qbit-primary text-qbit-on-primary" },
  { id: "u2", name: "Sarah Chen", email: "s.chen@qbithub.com", phone: "+1 (555) 234-5678", department: "Field Operations", role: "Support Engineer", roleBadge: "info", status: "Active", lastLogin: "Yesterday", createdAt: "Feb 03, 2023", initials: "SC", avatarBg: "bg-qbit-secondary-container text-qbit-on-secondary-container" },
  { id: "u3", name: "Jordan Smythe", email: "jsmythe@qbithub.com", phone: "+1 (555) 345-6789", department: "Logistics", role: "Viewer", roleBadge: "neutral", status: "Inactive", lastLogin: "3 days ago", createdAt: "Mar 22, 2023", initials: "JS", avatarBg: "bg-qbit-tertiary text-qbit-on-tertiary" },
  { id: "u4", name: "James Wilson", email: "j.wilson@qbithub.com", phone: "+1 (555) 456-7890", department: "Sales", role: "Sales Executive", roleBadge: "info", status: "Active", lastLogin: "5 hours ago", createdAt: "Apr 10, 2023", initials: "JW", avatarBg: "bg-emerald-500 text-white" },
  { id: "u5", name: "Maria Garcia", email: "m.garcia@qbithub.com", phone: "+1 (555) 567-8901", department: "Installation", role: "Installation Engineer", roleBadge: "info", status: "Active", lastLogin: "1 hour ago", createdAt: "May 05, 2023", initials: "MG", avatarBg: "bg-amber-500 text-white" },
  { id: "u6", name: "David Kim", email: "d.kim@qbithub.com", phone: "+1 (555) 678-9012", department: "Support", role: "Support Engineer", roleBadge: "info", status: "Suspended", lastLogin: "1 week ago", createdAt: "Jun 18, 2023", initials: "DK", avatarBg: "bg-purple-500 text-white" },
];

// ---------------------------------------------------------------------
// Permission matrix
// ---------------------------------------------------------------------

export const PERMISSION_KEYS: { key: PermissionKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "upload", label: "Upload" },
  { key: "download", label: "Download" },
  { key: "publish", label: "Publish" },
  { key: "approve", label: "Approve" },
  { key: "manageUsers", label: "Manage Users" },
  { key: "manageSettings", label: "Settings" },
];

export const PERMISSION_MATRIX: PermissionRow[] = [
  { role: "Administrator", roleKey: "administrator", subtitle: "Full system access", permissions: { view: true, create: true, edit: true, delete: true, upload: true, download: true, publish: true, approve: true, manageUsers: true, manageSettings: true }, locked: true },
  { role: "Support Engineer", roleKey: "support_engineer", subtitle: "Maintenance & Diagnostics", permissions: { view: true, create: true, edit: true, delete: false, upload: true, download: true, publish: false, approve: false, manageUsers: false, manageSettings: false } },
  { role: "Installation Engineer", roleKey: "installation_engineer", subtitle: "Field installation & setup", permissions: { view: true, create: true, edit: true, delete: false, upload: true, download: true, publish: false, approve: false, manageUsers: false, manageSettings: false } },
  { role: "Sales Executive", roleKey: "sales_executive", subtitle: "Product catalog access", permissions: { view: true, create: false, edit: false, delete: false, upload: false, download: true, publish: false, approve: false, manageUsers: false, manageSettings: false } },
  { role: "Dealer", roleKey: "dealer", subtitle: "Products, drivers, manuals", permissions: { view: true, create: false, edit: false, delete: false, upload: false, download: true, publish: false, approve: false, manageUsers: false, manageSettings: false } },
  { role: "Viewer", roleKey: "viewer", subtitle: "Read-only access", permissions: { view: true, create: false, edit: false, delete: false, upload: false, download: true, publish: false, approve: false, manageUsers: false, manageSettings: false }, viewOnly: true },
  { role: "Public Customer", roleKey: "public_customer", subtitle: "Public pages only", permissions: { view: true, create: false, edit: false, delete: false, upload: false, download: false, publish: false, approve: false, manageUsers: false, manageSettings: false }, viewOnly: true },
];

// ---------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------

export const ADMIN_PRODUCTS: AdminProductRow[] = [
  { id: "qbit-t800", name: "QBIT T-800", subtitle: "Flagship Enterprise POS", model: "T800-ENT-2024", category: "Windows POS", categoryVariant: "secondary-fixed", status: "active", lastUpdated: "Oct 24, 2023", imageGradient: "from-qbit-primary to-qbit-secondary", imageIcon: "point_of_sale" },
  { id: "scanpro-m10", name: "ScanPro M-10", subtitle: "Industrial Handheld", model: "SPM-10-MOB", category: "Android Device", categoryVariant: "tertiary-fixed", status: "active", lastUpdated: "Nov 02, 2023", imageGradient: "from-emerald-500 to-teal-600", imageIcon: "barcode_scanner" },
  { id: "printx-g5", name: "PrintX G-5", subtitle: "Legacy Thermal Printer", model: "PXG5-LEGACY", category: "Accessories", categoryVariant: "neutral", status: "archived", lastUpdated: "Aug 12, 2023", imageGradient: "from-slate-700 to-slate-900", imageIcon: "print" },
  { id: "hubx-pro", name: "HUB-X Pro", subtitle: "Thermal Printer Pro", model: "HUBX-PRO-2024", category: "Thermal Printer", categoryVariant: "secondary-fixed", status: "active", lastUpdated: "Nov 15, 2023", imageGradient: "from-purple-600 to-indigo-700", imageIcon: "print" },
  { id: "aura-g3", name: "Aura Terminal G3", subtitle: "Advanced POS Interface", model: "AURA-G3", category: "Windows POS", categoryVariant: "secondary-fixed", status: "active", lastUpdated: "Nov 10, 2023", imageGradient: "from-amber-500 to-orange-600", imageIcon: "desktop_windows" },
];

// ---------------------------------------------------------------------
// Assets (unified asset manager)
// ---------------------------------------------------------------------

export const ADMIN_ASSETS: AdminAssetRow[] = [
  { id: "a1", name: "Universal Thermal Printer Driver", version: "v2.4.1", type: "driver", typeLabel: "Driver", size: "12.4 MB", visibility: "public", status: "published", updatedAt: "Oct 12, 2023", downloadCount: "24.1k", icon: "settings_input_component", gradient: "from-qbit-primary to-qbit-secondary" },
  { id: "a2", name: "POS Terminal Firmware", version: "v4.1.2", type: "firmware", typeLabel: "Firmware", size: "45.8 MB", visibility: "public", status: "published", updatedAt: "Nov 05, 2023", downloadCount: "8.2k", icon: "memory", gradient: "from-purple-600 to-indigo-700" },
  { id: "a3", name: "Barcode Scanner SDK", version: "v1.9", type: "sdk", typeLabel: "SDK", size: "128 MB", visibility: "public", status: "published", updatedAt: "Dec 12, 2023", downloadCount: "18.7k", icon: "code", gradient: "from-emerald-500 to-teal-600" },
  { id: "a4", name: "HUB-X Config Utility", version: "v3.2.1", type: "utility", typeLabel: "Utility", size: "8.6 MB", visibility: "internal", status: "published", updatedAt: "Nov 20, 2023", downloadCount: "1.2k", icon: "build", gradient: "from-amber-500 to-orange-600" },
  { id: "a5", name: "T-800 User Manual", version: "v4.0", type: "manual", typeLabel: "Manual", size: "5.8 MB", visibility: "public", status: "published", updatedAt: "Oct 24, 2023", downloadCount: "12.3k", icon: "menu_book", gradient: "from-slate-700 to-slate-900" },
  { id: "a6", name: "T-800 Datasheet", version: "v2.1", type: "datasheet", typeLabel: "Datasheet", size: "2.4 MB", visibility: "public", status: "published", updatedAt: "Sep 15, 2023", downloadCount: "6.8k", icon: "description", gradient: "from-cyan-500 to-blue-600" },
  { id: "a7", name: "Warranty Terms", version: "v2024", type: "warranty", typeLabel: "Warranty", size: "0.8 MB", visibility: "public", status: "published", updatedAt: "Jan 01, 2024", downloadCount: "3.2k", icon: "verified_user", gradient: "from-rose-500 to-pink-600" },
  { id: "a8", name: "T-800 Setup Walkthrough", version: "—", type: "video", typeLabel: "YouTube Video", size: "12:45", visibility: "public", status: "published", updatedAt: "Oct 20, 2023", downloadCount: "15.4k views", icon: "videocam", gradient: "from-red-500 to-rose-600" },
];

// ---------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------

export const ANALYTICS_CARDS: AnalyticsCardItem[] = [
  {
    id: "ac1",
    title: "Most Viewed Products",
    icon: "trending_up",
    iconBg: "bg-qbit-primary/10 text-qbit-primary",
    items: [
      { label: "QBIT T-800", value: "12.4k views", subtitle: "Windows POS" },
      { label: "HUB-X Pro", value: "8.7k views", subtitle: "Thermal Printer" },
      { label: "Aura Terminal G3", value: "6.2k views", subtitle: "Windows POS" },
    ],
  },
  {
    id: "ac2",
    title: "Most Downloaded Assets",
    icon: "download",
    iconBg: "bg-emerald-100 text-emerald-700",
    items: [
      { label: "Universal Thermal Printer Driver", value: "24.1k", subtitle: "v2.4.1" },
      { label: "Barcode Scanner SDK", value: "18.7k", subtitle: "v1.9" },
      { label: "T-800 User Manual", value: "12.3k", subtitle: "v4.0" },
    ],
  },
  {
    id: "ac3",
    title: "Most Viewed Articles",
    icon: "article",
    iconBg: "bg-amber-100 text-amber-700",
    items: [
      { label: "T-800 Complete Setup Guide", value: "12.4k", subtitle: "Windows POS" },
      { label: "Thermal Printer Troubleshooting", value: "8.7k", subtitle: "Thermal Printer" },
      { label: "Firmware Update Guide", value: "5.2k", subtitle: "Firmware" },
    ],
  },
  {
    id: "ac4",
    title: "Most Watched Videos",
    icon: "videocam",
    iconBg: "bg-red-100 text-red-700",
    items: [
      { label: "T-800 Setup Walkthrough", value: "15.4k views", subtitle: "12:45" },
      { label: "Thermal Printer Maintenance", value: "9.8k views", subtitle: "8:20" },
      { label: "Scanner Calibration", value: "7.1k views", subtitle: "5:15" },
    ],
  },
];

// ---------------------------------------------------------------------
// Admin notifications
// ---------------------------------------------------------------------

export const ADMIN_NOTIFICATIONS: AdminNotificationItem[] = [
  { id: "n1", title: "Storage Almost Full", message: "Cloud storage is at 65% capacity. Consider archiving old assets.", type: "warning", category: "storage", actionUrl: "#", actionLabel: "Manage Storage", read: false, createdAt: "10 mins ago" },
  { id: "n2", title: "New User Registration", message: "David Kim registered as a Support Engineer.", type: "info", category: "user", actionUrl: "#", actionLabel: "View User", read: false, createdAt: "1 hour ago" },
  { id: "n3", title: "Security Alert", message: "Unrecognized login attempt from IP 192.168.1.45.", type: "error", category: "security", actionUrl: "#", actionLabel: "Review", read: false, createdAt: "2 hours ago" },
  { id: "n4", title: "Backup Completed", message: "Scheduled backup completed successfully (124.5 MB).", type: "success", category: "system", read: true, createdAt: "3 hours ago" },
];

// ---------------------------------------------------------------------
// System settings
// ---------------------------------------------------------------------

export const SYSTEM_SETTINGS: SystemSettingEntry[] = [
  { key: "company_name", value: "QBIT Hub Technology Group", label: "Company Name", category: "company", type: "text" },
  { key: "brand_logo_url", value: "/qbit-logo.png", label: "Brand Logo", category: "branding", type: "image", description: "PNG, SVG up to 2MB" },
  { key: "support_email", value: "support@qbithub.io", label: "Support Email", category: "company", type: "email" },
  { key: "support_phone", value: "+1 (555) 100-2000", label: "Support Phone", category: "company", type: "phone" },
  { key: "default_language", value: "en-US", label: "Default Language", category: "application", type: "select", options: [{ value: "en-US", label: "English (US)" }, { value: "es-ES", label: "Spanish" }, { value: "fr-FR", label: "French" }, { value: "de-DE", label: "German" }] },
  { key: "timezone", value: "America/Los_Angeles", label: "Timezone", category: "application", type: "select", options: [{ value: "America/Los_Angeles", label: "Pacific Time" }, { value: "UTC", label: "UTC" }, { value: "Europe/Paris", label: "Central European Time" }] },
  { key: "date_format", value: "MMM d, yyyy", label: "Date Format", category: "application", type: "select", options: [{ value: "MMM d, yyyy", label: "Oct 24, 2023" }, { value: "d/MM/yyyy", label: "24/10/2023" }, { value: "yyyy-MM-dd", label: "2023-10-24" }] },
  { key: "theme", value: "system", label: "Default Theme", category: "application", type: "select", options: [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }] },
];
