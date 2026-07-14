/**
 * Barrel export for all Enterprise Admin Control Center components.
 */

export { AdminStatsCard, AdminStatsGrid } from "./AdminStatsCard";
export { AuditLogTable } from "./AuditLogTable";
export { ActivityTimeline } from "./ActivityTimeline";
export { UserTable } from "./UserTable";
export { RoleMatrix } from "./RoleMatrix";
export { BulkActionToolbar } from "./BulkActionToolbar";
export { AnnouncementManager } from "./AnnouncementManager";
export { AnalyticsCards } from "./AnalyticsCards";
export { AssetManager } from "./AssetManager";
export { SettingsPanel, SettingsGrid } from "./SettingsPanel";

export type {
  AdminStatItem,
  AuditLogEntry,
  ActivityFeedEntry,
  AnnouncementItem,
  AdminUserRow,
  PermissionRow,
  PermissionKey,
  AdminProductRow,
  AdminAssetRow,
  AnalyticsCardItem,
  SystemHealthItem,
  RecentUploadRow,
  AdminNotificationItem,
  SystemSettingEntry,
  BulkAction,
} from "@/lib/admin/types";
