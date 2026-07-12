/**
 * Typed interfaces for the Enterprise Admin Control Center.
 */

/** Admin stats card data. */
export interface AdminStatItem {
  label: string;
  value: string;
  icon: string;
  delta?: string;
  deltaVariant?: "up" | "down" | "neutral";
  iconBg?: string;
  category: "inventory" | "usage" | "health" | "users";
}

/** Audit log entry. */
export interface AuditLogEntry {
  id: string;
  userName: string;
  action: string;
  actionLabel: string;
  entity: string;
  entityName?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  icon: string;
  dotColor: "primary" | "secondary" | "error" | "neutral";
}

/** Activity feed entry (dashboard timeline). */
export interface ActivityFeedEntry {
  id: string;
  userName: string;
  action: string;
  entity?: string;
  icon: string;
  dotColor: "primary" | "secondary" | "error" | "neutral";
  attachment?: { icon: string; label: string };
  invitees?: string[];
  dim?: boolean;
  time: string;
}

/** Announcement entry. */
export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  type: "info" | "maintenance" | "driver_update" | "firmware_release" | "system_message";
  severity: "info" | "warning" | "critical";
  visibility: "public" | "internal" | "hidden";
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

/** User table row (enterprise). */
export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role: string;
  roleBadge: "success" | "warning" | "error" | "info" | "primary" | "neutral";
  status: "Active" | "Inactive" | "Suspended";
  lastLogin: string;
  createdAt: string;
  initials: string;
  avatarBg: string;
}

/** Permission key. */
export type PermissionKey =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "upload"
  | "download"
  | "publish"
  | "approve"
  | "manageUsers"
  | "manageSettings";

/** Permission matrix row. */
export interface PermissionRow {
  role: string;
  roleKey: string;
  subtitle: string;
  permissions: Record<PermissionKey, boolean>;
  locked?: boolean;
  viewOnly?: boolean;
}

/** Product management row. */
export interface AdminProductRow {
  id: string;
  name: string;
  subtitle: string;
  model: string;
  category: string;
  categoryVariant: "secondary-fixed" | "tertiary-fixed" | "neutral";
  status: "active" | "archived";
  lastUpdated: string;
  imageGradient: string;
  imageIcon: string;
}

/** Asset manager row (unified — drivers, firmware, SDK, manuals, etc.). */
export interface AdminAssetRow {
  id: string;
  name: string;
  version: string;
  type: "driver" | "firmware" | "sdk" | "utility" | "manual" | "datasheet" | "warranty" | "video";
  typeLabel: string;
  size: string;
  visibility: "public" | "internal" | "hidden";
  status: "published" | "draft" | "archived";
  updatedAt: string;
  downloadCount: string;
  icon: string;
  gradient: string;
}

/** Analytics card data. */
export interface AnalyticsCardItem {
  id: string;
  title: string;
  icon: string;
  iconBg: string;
  items: { label: string; value: string; subtitle?: string }[];
}

/** System health metric. */
export interface SystemHealthItem {
  label: string;
  value: string;
  status: "optimal" | "warning" | "critical";
  icon: string;
  progress?: number;
}

/** Recent upload row. */
export interface RecentUploadRow {
  name: string;
  category: string;
  status: "published" | "draft";
  updated: string;
  icon: string;
  gradient: string;
}

/** Admin notification. */
export interface AdminNotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  category: "system" | "security" | "storage" | "user";
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  createdAt: string;
}

/** System setting key/value pair. */
export interface SystemSettingEntry {
  key: string;
  value: string;
  label: string;
  category: "company" | "branding" | "application" | "security" | "backup";
  type: "text" | "email" | "phone" | "url" | "select" | "toggle" | "image";
  options?: { value: string; label: string }[];
  description?: string;
}

/** Bulk action type. */
export type BulkAction = "delete" | "publish" | "archive" | "categoryChange" | "export";
