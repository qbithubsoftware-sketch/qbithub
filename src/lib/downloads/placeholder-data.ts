/**
 * Placeholder data for the Driver Download Center.
 *
 * ALL ARRAYS ARE EMPTY — no demo data in production.
 * When real data is available, replace these exports with API calls
 * that return the same shapes.
 */

import type {
  DownloadItem,
  FeaturedDownloadCard,
  DownloadHistoryEntry,
  OSOption,
  CategoryOption,
  ManualItem,
} from "./types";

export const OPERATING_SYSTEMS: OSOption[] = [];
export const CATEGORIES: CategoryOption[] = [];
export const PRODUCT_FILTER_CHIPS = [] as const;

export const FEATURED_CARDS: FeaturedDownloadCard[] = [];
export const DOWNLOADS: DownloadItem[] = [];
export const DOWNLOAD_HISTORY: DownloadHistoryEntry[] = [];
export const MOST_DOWNLOADED: DownloadItem[] = [];
export const MANUALS: ManualItem[] = [];
