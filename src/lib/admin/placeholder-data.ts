/**
 * Placeholder data for the Admin Control Center.
 *
 * ALL ARRAYS ARE EMPTY — no demo data in production.
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

export const ADMIN_STATS: AdminStatItem[] = [];
export const SYSTEM_HEALTH: SystemHealthItem[] = [];
export const RECENT_UPLOADS: RecentUploadRow[] = [];
export const ACTIVITY_FEED: ActivityFeedEntry[] = [];
export const AUDIT_LOGS: AuditLogEntry[] = [];
export const ANNOUNCEMENTS: AnnouncementItem[] = [];
export const ADMIN_USERS: AdminUserRow[] = [];
export const PERMISSION_KEYS: { key: PermissionKey; label: string }[] = [];
export const PERMISSION_MATRIX: PermissionRow[] = [];
export const ADMIN_PRODUCTS: AdminProductRow[] = [];
export const ADMIN_ASSETS: AdminAssetRow[] = [];
export const ANALYTICS_CARDS: AnalyticsCardItem[] = [];
export const ADMIN_NOTIFICATIONS: AdminNotificationItem[] = [];
export const SYSTEM_SETTINGS: SystemSettingEntry[] = [];
