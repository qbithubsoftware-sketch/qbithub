/**
 * Barrel export for all Enterprise AI Assistant components.
 */

export { AIChatWindow } from "./AIChatWindow";
export { MessageBubble, type ChatMessage } from "./MessageBubble";
export { SuggestedQuestions } from "./SuggestedQuestions";
export { SourceReferences, RelatedAssets } from "./SourceReferences";
export { SearchHistory, type SearchHistoryEntry } from "./SearchHistory";

export type {
  ChatRole,
  ChatMessageDTO,
  AIRequest,
  AIResponse,
  SourceDocument,
  RetrievalResult,
  AIProvider,
  SuggestionCategory,
  SuggestedQuestionEntry,
  ConversationEntry,
  AIFeedbackType,
  RelatedAssetEntry,
} from "@/lib/ai/types";
