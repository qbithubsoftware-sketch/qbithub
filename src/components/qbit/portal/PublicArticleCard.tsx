"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import type { PublicArticleCard } from "@/lib/portal/types";

/**
 * PublicArticleCard — knowledge article card for the public portal.
 *
 * Shows gradient cover with icon, category, title, excerpt, reading time,
 * difficulty, and view count.  Clicking opens the article.
 */
export function PublicArticleCard({
  article,
  onClick,
}: {
  article: PublicArticleCard;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-qbit-outline-variant bg-white overflow-hidden text-left transition-all hover:-translate-y-1 hover:shadow-lg w-full"
    >
      {/* Cover */}
      <div className={cn("relative h-20 bg-gradient-to-br flex items-center justify-center overflow-hidden", article.gradient)}>
        <Icon
          name={article.icon}
          className="text-[36px] text-white/90 transition-transform duration-500 group-hover:scale-110"
          filled
        />
      </div>
      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider text-qbit-primary mb-1">
          {article.category}
        </span>
        <h4 className="text-sm font-semibold text-qbit-on-surface line-clamp-2 mb-1 group-hover:text-qbit-primary transition-colors">
          {article.title}
        </h4>
        <p className="text-xs text-qbit-on-surface-variant line-clamp-2 mb-3 flex-1">
          {article.excerpt}
        </p>
        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-qbit-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="schedule" className="text-[12px]" />
            {article.readingTime}m
          </span>
          <span className="flex items-center gap-1">
            <Icon name="signal_cellular_alt" className="text-[12px]" />
            {article.difficulty}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="visibility" className="text-[12px]" />
            {article.viewCountLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * PublicArticleGrid — responsive grid of PublicArticleCards.
 */
export function PublicArticleGrid({
  articles,
  onArticleClick,
}: {
  articles: PublicArticleCard[];
  onArticleClick?: (article: PublicArticleCard) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article) => (
        <PublicArticleCard
          key={article.id}
          article={article}
          onClick={() => onArticleClick?.(article)}
        />
      ))}
    </div>
  );
}
