/**
 * Provider-agnostic types for the Enterprise AI Assistant.
 *
 * These interfaces define the contract between the application and any
 * AI provider.  Adapters for OpenAI, Gemini, Claude, or self-hosted
 * LLMs can be built against these types without changing the rest of
 * the application.
 */

/** Chat role — matches the OpenAI-style message format. */
export type ChatRole = "system" | "user" | "assistant";

/** A single chat message. */
export interface ChatMessageDTO {
  role: ChatRole;
  content: string;
}

/** A request to the AI provider. */
export interface AIRequest {
  messages: ChatMessageDTO[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/** A response from the AI provider. */
export interface AIResponse {
  content: string;
  model?: string;
  provider?: string;
  tokensUsed?: number;
  responseTimeMs?: number;
}

/** A retrieved source document (from the RAG pipeline). */
export interface SourceDocument {
  sourceType:
    | "product"
    | "driver"
    | "manual"
    | "article"
    | "guide"
    | "faq"
    | "troubleshooting"
    | "video"
    | "error_code";
  sourceId?: string;
  title: string;
  url?: string;
  excerpt: string;
  relevance: number; // 0-1
}

/** An AI provider adapter — implements this interface. */
export interface AIProvider {
  name: string;
  chat(request: AIRequest): Promise<AIResponse>;
}

/** A search/retrieval result from the document store. */
export interface RetrievalResult {
  sources: SourceDocument[];
  totalFound: number;
}

/** Suggested question category. */
export type SuggestionCategory =
  | "installation"
  | "drivers"
  | "troubleshooting"
  | "firmware"
  | "general";

/** A suggested question entry. */
export interface SuggestedQuestionEntry {
  id: string;
  question: string;
  category: SuggestionCategory;
  icon?: string;
}

/** A conversation entry (for the sidebar). */
export interface ConversationEntry {
  id: string;
  title: string;
  pinned: boolean;
  messageCount: number;
  updatedAt: string;
}

/** Feedback type for an AI message. */
export type AIFeedbackType = "helpful" | "not_helpful";

/** Related asset shown alongside an AI response. */
export interface RelatedAssetEntry {
  sourceType: SourceDocument["sourceType"];
  title: string;
  url?: string;
  icon: string;
  meta?: string;
}
