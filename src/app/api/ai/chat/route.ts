/**
 * AI Chat API — `/api/ai/chat`.
 *
 * POST: send a message to the AI assistant and receive a response.
 *
 * Flow (RAG pipeline):
 * 1. Retrieve relevant documents from the QBIT Hub knowledge base
 * 2. Build the system prompt with retrieved context
 * 3. Call the AI provider (ZAI by default, mock fallback)
 * 4. Store the conversation + message in the database
 * 5. Return the response + source references
 *
 * Security:
 * - Public users only receive public content in the retrieval pipeline
 * - Internal sources are filtered out for unauthenticated users
 * - Rate limiting can be added at the infrastructure level
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { getAIProvider } from "@/lib/ai/provider";
import { retrieveDocuments } from "@/lib/ai/retrieval";
import { buildSystemPrompt, buildMessages } from "@/lib/ai/prompt-builder";
import type { ChatMessageDTO } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const isPublicUser = !session?.user;

  const body = await req.json();
  const { message, conversationId, history = [] } = body as {
    message: string;
    conversationId?: string;
    history?: ChatMessageDTO[];
  };

  if (!message || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // ---- Step 1: Retrieve relevant documents (RAG) ----
  const retrievalResult = await retrieveDocuments(message);

  // ---- Step 2: Build system prompt with context ----
  const systemPrompt = buildSystemPrompt(retrievalResult.sources, isPublicUser);
  const messages = buildMessages(systemPrompt, history, message);

  // ---- Step 3: Call the AI provider ----
  const provider = getAIProvider();
  let aiResponse;
  try {
    aiResponse = await provider.chat({ messages, temperature: 0.7, maxTokens: 2048 });
  } catch (err) {
    console.error("AI provider error:", err);
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  // ---- Step 4: Store conversation + messages ----
  let convId = conversationId;
  try {
    if (!convId) {
      // Create a new conversation
      const conv = await db.aIConversation.create({
        data: {
          userId: session?.user?.id ?? null,
          title: message.slice(0, 80),
        },
      });
      convId = conv.id;
    }

    // Store the user message
    const userMsg = await db.aIMessage.create({
      data: {
        conversationId: convId,
        role: "user",
        content: message,
      },
    });

    // Store the assistant response
    const assistantMsg = await db.aIMessage.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: aiResponse.content,
        model: aiResponse.model ?? null,
        provider: aiResponse.provider ?? null,
        tokensUsed: aiResponse.tokensUsed ?? 0,
        responseTimeMs: aiResponse.responseTimeMs ?? null,
      },
    });

    // Store source references
    if (retrievalResult.sources.length > 0) {
      await db.sourceReference.createMany({
        data: retrievalResult.sources.map((src) => ({
          messageId: assistantMsg.id,
          sourceType: src.sourceType,
          sourceId: src.sourceId ?? null,
          title: src.title,
          url: src.url ?? null,
          excerpt: src.excerpt,
          relevance: src.relevance,
        })),
      });
    }

    // Store search history
    await db.searchHistory.create({
      data: {
        userId: session?.user?.id ?? null,
        query: message,
        resultCount: retrievalResult.totalFound,
      },
    });
  } catch (dbErr) {
    // Database errors are non-fatal — the AI response is still valid
    console.error("Database storage error (non-fatal):", dbErr);
  }

  // ---- Step 5: Return response ----
  return NextResponse.json({
    conversationId: convId,
    response: aiResponse.content,
    model: aiResponse.model,
    provider: aiResponse.provider,
    tokensUsed: aiResponse.tokensUsed,
    responseTimeMs: aiResponse.responseTimeMs,
    sources: retrievalResult.sources.map((s) => ({
      sourceType: s.sourceType,
      sourceId: s.sourceId,
      title: s.title,
      url: s.url,
      excerpt: s.excerpt,
      relevance: s.relevance,
    })),
  });
}
