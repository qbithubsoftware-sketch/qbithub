/**
 * Prompt Builder — constructs the system prompt for the AI assistant.
 *
 * The system prompt instructs the AI to:
 * - Answer ONLY using QBIT Hub data
 * - Never invent product information
 * - Cite sources from the retrieval pipeline
 * - Format responses with Markdown (tables, code blocks, callouts)
 * - Respect RBAC (never reveal internal content to public users)
 */

import type { ChatMessageDTO, SourceDocument } from "./types";

/** The base system prompt for the QBIT Hub AI Assistant. */
const BASE_SYSTEM_PROMPT = `You are the QBIT Hub Enterprise AI Assistant — an intelligent support agent for QBIT Hub enterprise hardware products.

## Your Knowledge
You have access to the following QBIT Hub data:
- Product specifications and details
- Driver and firmware downloads
- Installation guides (step-by-step)
- Knowledge base articles
- FAQs and troubleshooting guides
- Common error codes and resolutions
- Compatible accessories
- YouTube training videos

## Rules
1. Answer ONLY using the QBIT Hub data provided in the context below.
2. NEVER invent product information, specifications, or version numbers.
3. If you don't have enough information, say "I don't have enough information about that. Please contact our support team."
4. Format responses using Markdown: headings, bullet lists, numbered lists, tables, and code blocks where appropriate.
5. Use **bold** for key terms and *italic* for emphasis.
6. Include relevant safety warnings when discussing installation or firmware updates.
7. Always cite sources by referencing the Related Assets section.
8. Respect user permissions — never reveal internal-only content to public users.
9. Be concise but thorough. Use tables for comparisons and code blocks for commands.

## Response Format
Each response should include:
- A direct answer to the question
- Step-by-step instructions where applicable
- Safety warnings or important notes
- Reference to related assets (drivers, manuals, guides, videos)`;

/**
 * Builds the system prompt with retrieved context documents.
 *
 * @param sources - Retrieved documents from the RAG pipeline
 * @param isPublicUser - Whether the user is unauthenticated (limits context to public-only)
 * @returns The system prompt as a ChatMessageDTO
 */
export function buildSystemPrompt(
  sources: SourceDocument[],
  isPublicUser: boolean = false,
): ChatMessageDTO {
  // Filter out internal sources for public users
  const visibleSources = isPublicUser
    ? sources.filter((s) => s.sourceType !== "guide") // installation guides are internal
    : sources;

  const contextSection = visibleSources.length > 0
    ? `\n\n## Retrieved Context (QBIT Hub Knowledge Base)\n\n${visibleSources
        .map((src, idx) => `### Source ${idx + 1}: ${src.title}\n**Type:** ${src.sourceType}\n**Excerpt:** ${src.excerpt}\n`)
        .join("\n")}\n\nUse the above context to answer the user's question. If the context doesn't contain the answer, say so.`
    : "\n\n## Retrieved Context\n\nNo relevant documents were found in the QBIT Hub knowledge base for this query. Inform the user and suggest rephrasing their question.";

  const rbacSection = isPublicUser
    ? "\n\n## RBAC Notice\n\nThe current user is a PUBLIC (unauthenticated) user. Only show publicly available information. Never reference internal guides, restricted downloads, or internal knowledge base articles."
    : "\n\n## RBAC Notice\n\nThe current user is an authenticated QBIT Hub user. You may reference all content they have permission to access.";

  return {
    role: "system",
    content: BASE_SYSTEM_PROMPT + contextSection + rbacSection,
  };
}

/**
 * Builds the conversation messages array for the AI provider.
 *
 * @param systemPrompt - The system prompt from buildSystemPrompt
 * @param conversation - Previous messages in the conversation
 * @param userQuery - The new user question
 * @returns The full messages array
 */
export function buildMessages(
  systemPrompt: ChatMessageDTO,
  conversation: ChatMessageDTO[],
  userQuery: string,
): ChatMessageDTO[] {
  return [
    systemPrompt,
    ...conversation.slice(-10), // Keep last 10 messages for context window
    { role: "user", content: userQuery },
  ];
}
