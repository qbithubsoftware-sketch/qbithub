/**
 * Barrel export for all Knowledge Base & Troubleshooting components.
 */

export { KnowledgeCard } from "./KnowledgeCard";
export { ArticleViewer } from "./ArticleViewer";
export { FAQAccordion } from "./FAQAccordion";
export { TroubleshootingCard } from "./TroubleshootingCard";
export { ErrorCodeCard } from "./ErrorCodeCard";
export { RelatedContent } from "./RelatedContent";
export { ArticleSearch } from "./ArticleSearch";
export { BookmarkButton } from "./BookmarkButton";
export { ArticleFeedback } from "./ArticleFeedback";

export type {
  KnowledgeCategoryItem,
  KnowledgeArticle,
  KnowledgeCardItem,
  ArticleSectionEntry,
  ArticleBlock,
  FAQEntry,
  TroubleshootingIssueEntry,
  TroubleshootingStepEntry,
  CommonErrorEntry,
  RelatedVideoEntry,
  BookmarkEntry,
  ArticleDifficulty,
  ErrorSeverity,
  FeedbackType,
} from "@/lib/knowledge/types";
