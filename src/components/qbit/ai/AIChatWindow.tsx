"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { MessageBubble, type ChatMessage } from "./MessageBubble";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { SourceReferences, RelatedAssets } from "./SourceReferences";
import { SearchHistory, type SearchHistoryEntry } from "./SearchHistory";
import { SUGGESTED_QUESTIONS } from "@/lib/ai/placeholder-data";
import type { SourceDocument } from "@/lib/ai/types";
import { useToast } from "@/hooks/use-toast";

const INITIAL_MESSAGE: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: "Hi! I'm your QBIT Hub AI Assistant. I can help you with installation guides, drivers, troubleshooting, firmware updates, and more. How can I help you today?",
  timestamp: "just now",
};

/**
 * AIChatWindow — the complete AI chat interface.
 *
 * Composes MessageBubble, SuggestedQuestions, SourceReferences,
 * RelatedAssets, and SearchHistory into a single chat experience.
 *
 * Calls `/api/ai/chat` to get AI responses (with RAG pipeline).
 */
export function AIChatWindow({ className }: { className?: string }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: "just now",
    };

    const loadingMsg: ChatMessage = {
      id: `assistant-loading-${Date.now()}`,
      role: "assistant",
      content: "",
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsTyping(true);

    // Add to search history
    setHistory((prev) => [
      { id: `h-${Date.now()}`, query: text, time: "just now" },
      ...prev,
    ]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
          history: messages
            .filter((m) => !m.loading && m.role !== "system")
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();

      if (conversationId !== data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        sources: data.sources,
        timestamp: "just now",
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== loadingMsg.id),
        assistantMsg,
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== loadingMsg.id),
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I'm sorry, I couldn't process your request right now. Please try again or contact support@qbithub.io.",
          timestamp: "just now",
        },
      ]);
      toast({
        title: "AI service error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, conversationId, messages, toast]);

  function handleCopy(content: string) {
    navigator.clipboard?.writeText(content);
    toast({ title: "Copied to clipboard" });
  }

  function handleFeedback(messageId: string, rating: "helpful" | "not_helpful") {
    toast({
      title: rating === "helpful" ? "Thanks for your feedback!" : "We'll work on improving this.",
    });
  }

  function handlePin(id: string) {
    setHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, pinned: !h.pinned } : h)),
    );
  }

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-6", className)}>
      {/* Main chat — 3 cols */}
      <div className="lg:col-span-3 space-y-4">
        {/* Chat container */}
        <SurfaceCard className="overflow-hidden flex flex-col" >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-qbit-outline-variant bg-qbit-surface-container-high px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-qbit-primary">
                <Icon name="smart_toy" className="text-[20px] text-white" filled />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-qbit-on-surface">QBIT AI Assistant</h3>
                <p className="flex items-center gap-1.5 text-[11px] text-qbit-on-surface-variant">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Online • Powered by QBIT Hub Knowledge Base
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([INITIAL_MESSAGE]);
                setConversationId(null);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-qbit-on-surface-variant hover:text-qbit-primary px-2 py-1 rounded-lg hover:bg-qbit-surface-container transition-colors"
            >
              <Icon name="restart_alt" className="text-[16px]" />
              New Chat
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 max-h-[500px]">
            {messages.map((msg) => (
              <div key={msg.id}>
                <MessageBubble
                  message={msg}
                  onCopy={handleCopy}
                  onFeedback={handleFeedback}
                />
                {/* Source references for assistant messages */}
                {!msg.loading && msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <>
                    <SourceReferences sources={msg.sources as SourceDocument[]} />
                    <RelatedAssets sources={msg.sources as SourceDocument[]} />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-qbit-outline-variant p-4 space-y-3">
            {/* Suggested questions */}
            {messages.length <= 1 && (
              <SuggestedQuestions
                questions={SUGGESTED_QUESTIONS}
                onSelect={(q) => sendMessage(q)}
              />
            )}
            {/* Input bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask about installation, drivers, troubleshooting..."
                  disabled={isTyping}
                  className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-2.5 pl-4 pr-4 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary disabled:opacity-50"
                />
              </div>
              <QbitButton
                variant="primary"
                size="md"
                icon={isTyping ? "progress_activity" : "send"}
                onClick={() => sendMessage(input)}
                disabled={isTyping || !input.trim()}
              >
                {isTyping ? "..." : "Send"}
              </QbitButton>
            </div>
            <p className="text-[10px] text-qbit-outline text-center">
              AI responses are generated from QBIT Hub data only. Never invents product information.
            </p>
          </div>
        </SurfaceCard>
      </div>

      {/* Sidebar — search history */}
      <div className="lg:col-span-1">
        <SearchHistory
          entries={history}
          onSelect={(q) => sendMessage(q)}
          onPin={handlePin}
        />
      </div>
    </div>
  );
}
