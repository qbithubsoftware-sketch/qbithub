/**
 * Typed interfaces for the Customer Public Portal.
 */

/** Public product card (catalog view). */
export interface PublicProductCard {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  categorySlug: string;
  icon: string;
  gradient: string;
  badge?: string;
  badgeVariant?: "primary" | "neutral" | "success";
  startingPrice?: string;
  viewCountLabel?: string;
}

/** Public product detail page data. */
export interface PublicProductDetail {
  id: string;
  name: string;
  model: string;
  category: string;
  description: string;
  longDescription: string;
  icon: string;
  gradient: string;
  badges: { label: string; variant: "primary" | "neutral" | "success" }[];
  specifications: { property: string; value: string }[];
  features: { icon: string; title: string; description: string }[];
  galleryImages: { url: string; alt: string }[];
  relatedProductIds: string[];
  publicDownloadIds: string[];
  publicArticleIds: string[];
  relatedVideoUrls: string[];
  startingPrice?: string;
  availability: "In Stock" | "Pre-Order" | "Discontinued";
}

/** Public download (only visibility="public" items). */
export interface PublicDownloadItem {
  id: string;
  name: string;
  version: string;
  category: string;
  fileSize: string;
  releaseDate: string;
  icon: string;
  gradient: string;
  downloadCountLabel: string;
  productId?: string;
}

/** Public knowledge article card. */
export interface PublicArticleCard {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  icon: string;
  gradient: string;
  readingTime: number;
  difficulty: string;
  viewCountLabel: string;
  updatedAt: string;
}

/** Contact form data. */
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  productId?: string;
  category: "general" | "sales" | "support" | "partnership";
}

/** Newsletter signup data. */
export interface NewsletterSignupData {
  email: string;
  name?: string;
}

/** Public announcement (only visibility="public"). */
export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  type: "info" | "maintenance" | "driver_update" | "firmware_release" | "system_message";
  severity: "info" | "warning" | "critical";
  createdAt: string;
}

/** Product category filter for the public catalog. */
export interface PublicCategoryFilter {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
}

/** FAQ entry for the public product page. */
export interface PublicFAQEntry {
  id: string;
  question: string;
  answer: string;
}

/** Troubleshooting entry for the public product page. */
export interface PublicTroubleshootingEntry {
  id: string;
  problem: string;
  causes: string[];
  solutions: string[];
}

/** Compatible accessory card. */
export interface PublicAccessory {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  gradient: string;
}

/** Support card (WhatsApp, Call, Email, Demo, Sales). */
export interface SupportCardItem {
  id: string;
  title: string;
  meta: string;
  icon: string;
  href: string;
  variant: "primary" | "outline";
}

/** YouTube video for the public product page. */
export interface PublicYouTubeVideo {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
  featured?: boolean;
}
