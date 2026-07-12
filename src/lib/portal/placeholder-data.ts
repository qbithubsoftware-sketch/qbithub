/**
 * Placeholder data for the Customer Public Portal.
 *
 * ALL ARRAYS ARE EMPTY — no demo data in production.
 */

import type {
  PublicProductCard,
  PublicProductDetail,
  PublicDownloadItem,
  PublicArticleCard,
  PublicAnnouncement,
  PublicCategoryFilter,
  PublicFAQEntry,
  PublicTroubleshootingEntry,
  PublicAccessory,
  SupportCardItem,
  PublicYouTubeVideo,
} from "./types";

export const PUBLIC_CATEGORIES: PublicCategoryFilter[] = [];
export const PUBLIC_PRODUCTS: PublicProductCard[] = [];
export const T800_PUBLIC_DETAIL: PublicProductDetail | null = null;
export const PUBLIC_DOWNLOADS: PublicDownloadItem[] = [];
export const PUBLIC_ARTICLES: PublicArticleCard[] = [];
export const PUBLIC_ANNOUNCEMENTS: PublicAnnouncement[] = [];
export const T800_FAQS: PublicFAQEntry[] = [];
export const T800_TROUBLESHOOTING: PublicTroubleshootingEntry[] = [];
export const T800_ACCESSORIES: PublicAccessory[] = [];
export const T800_SUPPORT_CARDS: SupportCardItem[] = [];
export const T800_VIDEOS: PublicYouTubeVideo[] = [];

export function getRelatedProducts(_currentId: string): PublicProductCard[] {
  return [];
}
