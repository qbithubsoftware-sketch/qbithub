"use client";

import { useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";

/**
 * AI Assistant — floating widget bottom-right.  Collapsed state shows a
 * circular chat button; expanded state shows a chat panel with greeting,
 * suggestion chips, and an input.
 */
export function AIAssistant({
  userName = "Alex",
  suggestions = [
    "How do I update the Nexus X1?",
    "Find drivers for Terminal G3",
    "Contact technical support",
  ],
}: {
  userName?: string;
  suggestions?: string[];
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-80">
        <div className="rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-qbit-outline-variant flex items-center gap-2 bg-qbit-primary/5">
            <div className="w-8 h-8 rounded-full bg-qbit-primary flex items-center justify-center">
              <Icon name="smart_toy" className="text-[18px] text-white" filled />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-qbit-on-surface">
                QBIT AI Assistant
              </p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-qbit-outline">Online</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close AI assistant"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
          {/* Messages */}
          <div className="p-3 space-y-3 h-48 overflow-y-auto custom-scrollbar bg-qbit-surface-container-lowest">
            <div className="bg-qbit-surface-container p-2 rounded-lg rounded-tl-none">
              <p className="text-sm text-qbit-on-surface">
                Hello {userName}! How can I help you with the QBIT Hub today?
              </p>
            </div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="w-full text-left text-[11px] font-bold text-qbit-primary hover:underline"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {/* Input */}
          <div className="p-3 border-t border-qbit-outline-variant">
            <div className="flex gap-2 items-center bg-qbit-surface-container rounded-lg px-2 py-1.5">
              <input
                type="text"
                placeholder="Ask AI anything..."
                className="bg-transparent border-none focus:ring-0 text-sm w-full focus:outline-none text-qbit-on-surface placeholder:text-qbit-outline"
              />
              <button
                aria-label="Send message"
                className="text-qbit-primary cursor-pointer hover:text-qbit-primary-container transition-colors"
              >
                <Icon name="send" className="text-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI Assistant"
        title="Open AI Assistant"
        className="w-14 h-14 bg-qbit-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 hover:bg-qbit-secondary transition-all"
      >
        <Icon name="chat" className="text-[28px]" filled />
      </button>
    </div>
  );
}
