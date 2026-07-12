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
export { HeroGallery } from "./HeroGallery";
export { ProductOverview } from "./ProductOverview";
export { SpecificationTable } from "./SpecificationTable";
export { DownloadAssets } from "./DownloadAssets";
export { YouTubeGallery } from "./YouTubeGallery";
export { PublicFAQAccordion } from "./PublicFAQAccordion";
export { PublicTroubleshooting } from "./PublicTroubleshooting";
export { SupportCards } from "./SupportCards";
export { ShareModal } from "./ShareModal";
export { QRCodeCard, QRCodeButton } from "./QRCodeCard";
export { RelatedProducts } from "./RelatedProducts";
export { PublicProductLayout } from "./PublicProductLayout";

export type {
  PublicProductCard as PublicProductCardType,
  PublicProductDetail,
  PublicDownloadItem,
  PublicArticleCard as PublicArticleCardType,
  PublicAnnouncement,
  PublicCategoryFilter,
  ContactFormData,
  NewsletterSignupData,
  PublicFAQEntry,
  PublicTroubleshootingEntry,
  PublicAccessory,
  SupportCardItem,
  PublicYouTubeVideo,
} from "@/lib/portal/types";
