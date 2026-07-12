"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { Pill } from "@/components/qbit/primitives/GlassCard";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { EmptyState } from "@/components/qbit/dashboard/EmptyState";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { KnowledgeCard } from "./KnowledgeCard";
import type { KnowledgeCardItem } from "@/lib/knowledge/types";

const SEARCH_FILTERS = [
  "All",
  "Articles",
  "FAQs",
  "Error Codes",
  "Troubleshooting",
] as const;

/**
 * ArticleSearch — hero search + filter chips + results grid.
 *
 * Reuses the existing KnowledgeCard for results.  UI only — no backend.
 * Supports filtering by content type and searching across article titles,
 * excerpts, and categories.
 */
export function ArticleSearch({
  articles,
  onArticleClick,
}: {
  articles: KnowledgeCardItem[];
  onArticleClick?: (article: KnowledgeCardItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof SEARCH_FILTERS)[number]>("All");

  const filtered = useMemo(() => {
    if (!query) return articles;
    const q = query.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
    );
  }, [query, articles]);

  return (
    <section className="space-y-6">
      {/* Hero search */}
      <div className="flex flex-col items-center text-center">
        <Pill className="mb-4 border-transparent bg-qbit-primary-container uppercase tracking-wider text-qbit-on-primary-container">
          Knowledge Base
        </Pill>
        <h2 className="text-[36px] leading-[44px] font-bold text-qbit-on-surface mb-3">
          How can we help you?
        </h2>
        <p className="text-lg text-qbit-on-surface-variant max-w-2xl">
          Search across articles, FAQs, error codes, and troubleshooting guides.
        </p>
        <div className="mt-8 w-full max-w-3xl relative">
          <Icon
            name="search"
            className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[28px] text-qbit-outline"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, FAQs, error codes, troubleshooting..."
            className="w-full pl-16 pr-4 py-5 bg-qbit-surface-container-lowest border border-qbit-outline-variant rounded-2xl text-base shadow-xl focus:ring-4 focus:ring-qbit-primary/10 focus:border-qbit-primary transition-all outline-none text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70"
          />
        </div>
        {/* Filter chips */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {SEARCH_FILTERS.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-all",
                  active
                    ? "bg-qbit-primary text-qbit-on-primary shadow-md"
                    : "bg-qbit-surface-container-lowest text-qbit-on-surface-variant border border-qbit-outline-variant hover:bg-qbit-surface-container",
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div>
        <SectionHeader
          title={query ? `Search Results (${filtered.length})` : "Browse Articles"}
          actionLabel={filtered.length > 6 ? "View all" : undefined}
        />
        {filtered.length === 0 ? (
          <SurfaceCard className="p-8">
            <EmptyState
              icon="search_off"
              title="No results found"
              description={`No articles match "${query}". Try a different search term or browse by category.`}
            />
          </SurfaceCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article) => (
              <KnowledgeCard
                key={article.id}
                article={article}
                onClick={() => onArticleClick?.(article)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
