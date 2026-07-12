/**
 * Placeholder data for the Installation Center.
 *
 * ALL ARRAYS ARE EMPTY — no demo data in production.
 */

import type {
  InstallationGuide,
  QuickAccessCard,
  ProductCategoryCard,
  GuideCardItem,
  RecentGuideEntry,
} from "./types";

export const QUICK_ACCESS_CARDS: QuickAccessCard[] = [];
export const PRODUCT_CATEGORIES: ProductCategoryCard[] = [];
export const LATEST_GUIDES: GuideCardItem[] = [];
export const POPULAR_GUIDES: GuideCardItem[] = [];
export const RECENT_GUIDES: RecentGuideEntry[] = [];

// T-800 Installation Guide data — empty until real guide is created
export const T800_TOOLS = [];
export const T800_SAFETY = [];
export const T800_CONFIG_GUIDES = [];
export const T800_WIRING_DIAGRAMS = [];
export const T800_CHECKLIST = [];
export const T800_FAQS = [];
export const T800_TROUBLESHOOTING = [];
export const T800_RELATED_VIDEOS = [];
export const T800_STEPS = [];

export const T800_GUIDE: InstallationGuide | null = null;
