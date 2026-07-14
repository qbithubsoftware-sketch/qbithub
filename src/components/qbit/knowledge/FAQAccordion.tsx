"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { EmptyState } from "@/components/qbit/dashboard/EmptyState";
import type { FAQEntry } from "@/lib/knowledge/types";

/**
 * FAQAccordion — accordion list of frequently asked questions.
 *
 * Reuses the same expand/collapse pattern as the InstallationFAQ
 * component, but accepts a broader FAQEntry shape and supports
 * an optional category label per FAQ.
 */
export function FAQAccordion({
  faqs,
  title = "Frequently Asked Questions",
  searchable = false,
  onBookmark,
  bookmarkedIds = new Set(),
}: {
  faqs: FAQEntry[];
  title?: string;
  searchable?: boolean;
  onBookmark?: (faq: FAQEntry) => void;
  bookmarkedIds?: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  const filtered = query
    ? faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(query.toLowerCase()) ||
          f.answer.toLowerCase().includes(query.toLowerCase()),
      )
    : faqs;

  return (
    <section>
      <SectionHeader title={title} accentDot />
      {searchable && (
        <div className="relative mb-4">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-2.5 pl-10 pr-3 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
          />
        </div>
      )}
      {filtered.length === 0 ? (
        <SurfaceCard className="p-8">
          <EmptyState
            icon="search_off"
            title="No FAQs found"
            description="Try a different search term or browse all FAQs."
          />
        </SurfaceCard>
      ) : (
        <SurfaceCard className="divide-y divide-qbit-outline-variant/40">
          {filtered.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              open={openId === faq.id}
              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
              onBookmark={onBookmark}
              isBookmarked={bookmarkedIds.has(faq.id)}
            />
          ))}
        </SurfaceCard>
      )}
    </section>
  );
}

function FAQItem({
  faq,
  open,
  onToggle,
  onBookmark,
  isBookmarked,
}: {
  faq: FAQEntry;
  open: boolean;
  onToggle: () => void;
  onBookmark?: (faq: FAQEntry) => void;
  isBookmarked: boolean;
}) {
  return (
    <div>
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex flex-1 items-center justify-between gap-3 p-4 text-left hover:bg-qbit-surface-container-low transition-colors"
        >
          <span className="text-sm font-semibold text-qbit-on-surface">{faq.question}</span>
          <Icon
            name="expand_more"
            className={cn(
              "text-[20px] text-qbit-on-surface-variant transition-transform shrink-0",
              open && "rotate-180",
            )}
          />
        </button>
        {onBookmark && (
          <button
            onClick={() => onBookmark(faq)}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark FAQ"}
            className={cn(
              "flex h-9 w-9 mr-2 items-center justify-center rounded-lg transition-colors",
              isBookmarked
                ? "text-qbit-primary"
                : "text-qbit-on-surface-variant hover:text-qbit-primary hover:bg-qbit-surface-container",
            )}
          >
            <Icon name={isBookmarked ? "bookmark" : "bookmark_border"} className="text-[18px]" filled={isBookmarked} />
          </button>
        )}
      </div>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-qbit-on-surface-variant leading-relaxed pl-1">
            {faq.answer}
          </p>
          {faq.category && (
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant bg-qbit-surface-container-high px-2 py-0.5 rounded-full">
              {faq.category}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
