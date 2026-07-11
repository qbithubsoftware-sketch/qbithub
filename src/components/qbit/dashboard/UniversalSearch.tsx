"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";

/**
 * Universal Search Center — glass-card search bar that overlaps the hero
 * (negative top margin) per the Stitch design.  UI only — no backend.
 *
 * Supports the ⌘K / Ctrl+K keyboard shortcut to focus the input.
 */
export function UniversalSearch({
  placeholder = "Search products, drivers, manuals, installation guides, videos or ask AI...",
  inputId = "home-universal-search",
  onSearch,
  onAskAI,
}: {
  placeholder?: string;
  inputId?: string;
  onSearch?: (query: string) => void;
  onAskAI?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <section className="max-w-4xl mx-auto w-full -mt-12 z-20 relative">
      <div className="glass-card shadow-xl border border-qbit-outline-variant rounded-2xl p-1 flex items-center">
        <div className="flex items-center gap-4 flex-1 bg-qbit-surface-container-highest/30 px-8 py-4 rounded-xl focus-within:bg-white transition-all">
          <Icon
            name="search"
            className="text-[24px] text-qbit-primary scale-125"
          />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch?.((e.target as HTMLInputElement).value);
            }}
            className="bg-transparent border-none focus:ring-0 w-full text-base text-qbit-on-surface placeholder:text-qbit-outline/60 focus:outline-none"
          />
          <kbd className="hidden md:flex items-center gap-1 bg-qbit-surface-variant/50 text-qbit-on-surface-variant px-2 py-1 rounded text-[10px] font-bold border border-qbit-outline-variant">
            <Icon name="keyboard_command_key" className="text-[12px]" />
            K
          </kbd>
        </div>
      </div>
      <div className="flex justify-center mt-3">
        <QbitButton size="sm" icon="auto_awesome" onClick={onAskAI}>
          Ask AI
        </QbitButton>
      </div>
    </section>
  );
}
