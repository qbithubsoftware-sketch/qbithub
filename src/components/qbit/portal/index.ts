/**
 * Barrel export for all Customer Public Portal components.
 */

export { PublicProductCard, PublicProductGrid } from "./PublicProductCard";
export { PublicCatalog } from "./PublicCatalog";
export { PublicDownloadCard, PublicDownloadGrid } from "./PublicDownloadCard";
export { ContactForm } from "./ContactForm";
export { NewsletterSignup } from "./NewsletterSignup";
export { PublicArticleCard, PublicArticleGrid } from "./PublicArticleCard";
export { PublicHeader } from "./PublicHeader";
export { PublicFooter } from "./PublicFooter";

export type {
  PublicProductCard as PublicProductCardType,
  PublicProductDetail,
  PublicDownloadItem,
  PublicArticleCard as PublicArticleCardType,
  PublicAnnouncement,
  PublicCategoryFilter,
  ContactFormData,
  NewsletterSignupData,
} from "@/lib/portal/types";
