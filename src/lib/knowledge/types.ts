/**
 * Typed interfaces for the Knowledge Base & Troubleshooting module.
 *
 * These mirror the Prisma models but are UI-friendly.  The API layer
 * will map Prisma rows → these types before sending them to the client.
 */

/** Difficulty level. */
export type ArticleDifficulty = "Beginner" | "Intermediate" | "Expert";

/** Severity for common error codes. */
export type ErrorSeverity = "info" | "warning" | "error";

/** Knowledge category (Products, Drivers, Installation, Firmware, Networking, etc.). */
export interface KnowledgeCategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  color: string; // tailwind gradient
  articleCount: number;
}

/** A section within a knowledge article. */
export interface ArticleSectionEntry {
  id: string;
  title: string;
  content: ArticleBlock[];
  sortOrder: number;
}

/** Rich-text content block (paragraph, callout, code, table, image, etc.). */
export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string; level?: 2 | 3 }
  | { type: "callout"; variant: "info" | "tip" | "warning" | "danger"; title?: string; text: string }
  | { type: "code"; language: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "image"; url: string; caption?: string }
  | { type: "list"; ordered?: boolean; items: string[] };

/** Knowledge article master record. */
export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: ArticleBlock[];
  sections?: ArticleSectionEntry[];
  category: KnowledgeCategoryItem;
  author: string;
  authorAvatar?: string;
  readingTime: number;
  difficulty: ArticleDifficulty;
  featured: boolean;
  popular: boolean;
  latest: boolean;
  viewCount: number;
  viewCountLabel: string;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedProductIds?: string[];
  relatedDownloadIds?: string[];
  relatedGuideIds?: string[];
  relatedVideoUrls?: string[];
  relatedFaqIds?: string[];
  publishedAt: string;
  updatedAt: string;
}

/** Card item for the knowledge grid (lighter shape than the full article). */
export interface KnowledgeCardItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  icon: string;
  gradient: string;
  readingTime: number;
  difficulty: ArticleDifficulty;
  author: string;
  viewCountLabel: string;
  updatedAt: string;
  featured?: boolean;
  popular?: boolean;
  latest?: boolean;
}

/** FAQ entry. */
export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

/** Troubleshooting issue. */
export interface TroubleshootingIssueEntry {
  id: string;
  title: string;
  slug: string;
  productId?: string;
  productName?: string;
  symptoms: string[];
  causes: string[];
  resolution: string;
  steps: TroubleshootingStepEntry[];
  difficulty: ArticleDifficulty;
  viewCountLabel: string;
  relatedDownloadIds?: string[];
  relatedManualIds?: string[];
  relatedGuideIds?: string[];
  relatedVideoUrls?: string[];
}

/** A single step in a troubleshooting resolution. */
export interface TroubleshootingStepEntry {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  warning?: string;
  tip?: string;
}

/** Common error code. */
export interface CommonErrorEntry {
  id: string;
  code: string;
  meaning: string;
  possibleCause: string;
  resolution: string;
  productName?: string;
  severity: ErrorSeverity;
}

/** Related video (YouTube — reuses the existing RelatedVideos component). */
export interface RelatedVideoEntry {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
  thumbnail: string;
}

/** Bookmark entry. */
export interface BookmarkEntry {
  id: string;
  articleId: string;
  title: string;
  category: string;
  icon: string;
  bookmarkType: "article" | "faq" | "troubleshooting";
  savedAt: string;
}

/** Article feedback. */
export type FeedbackType = "helpful" | "not_helpful" | "suggestion" | "report";
