/**
 * Typed placeholder interfaces for the Home Dashboard.
 *
 * These are UI-only data shapes — no backend, no mock APIs. When the
 * Product Library / Drivers / etc. modules are implemented, their
 * real data types can satisfy these interfaces and feed the same
 * dashboard components.
 */

import type { ScreenId } from "@/lib/navigation/store";

/** A single KPI / system-status widget. */
export interface SystemStatusItem {
  label: string;
  value: string;
  icon: string;
  delta?: string;
  deltaVariant?: "up" | "down" | "neutral";
  iconBg?: string;
}

/** Quick-access tile that navigates to a screen. */
export interface QuickAccessItem {
  label: string;
  sub: string;
  icon: string;
  screen?: ScreenId;
}

/** Featured / new-release product card. */
export interface FeaturedProduct {
  name: string;
  description: string;
  badge?: string;
  badgeVariant?: "primary" | "neutral" | "success";
  gradient?: string;
  icon?: string;
}

/** Continue-working / recent-file row. */
export interface ContinueWorkingItem {
  name: string;
  type: string;
  time: string;
  icon: string;
  iconBg?: string;
}

/** Timeline / system-update entry. */
export interface SystemUpdateItem {
  title: string;
  description: string;
  meta: string;
  variant?: "critical" | "info" | "neutral";
}

/** Popular download card. */
export interface PopularDownload {
  name: string;
  category: string;
  size: string;
  downloads: string;
  icon: string;
  iconBg?: string;
}

/** Bookmark row. */
export interface BookmarkItem {
  title: string;
  type: string;
  icon: string;
  time?: string;
}

/** Pinned resource card. */
export interface PinnedResource {
  title: string;
  badge: string;
  badgeVariant?: "primary" | "neutral" | "success" | "warning";
  icon: string;
  gradient?: string;
}

/** Announcement card. */
export interface Announcement {
  title: string;
  body: string;
  icon: string;
  variant?: "info" | "warning" | "success" | "error";
  time?: string;
}

/** Generic activity-feed entry (reusable across dashboards). */
export interface ActivityEntry {
  id: string;
  icon: string;
  iconBg?: string;
  title: string;
  meta: string;
  time: string;
}
