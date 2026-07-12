"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { KnowledgeCardItem, ArticleDifficulty } from "@/lib/knowledge/types";

const DIFFICULTY_VARIANT: Record<ArticleDifficulty, "success" | "warning" | "error"> = {
  Beginner: "success",
  Intermediate: "warning",
  Expert: "error",
};

/**
 * KnowledgeCard — card for the knowledge article grid.
 *
 * Shows category gradient cover with icon, title, excerpt, meta
 * (reading time, difficulty, author, view count, updated date), and
 * featured/popular/latest badges.
 */
export function KnowledgeCard({
  article,
  onClick,
}: {
  article: KnowledgeCardItem;
  onClick?: () => void;
}) {
  return (
    <SurfaceCard
      hover
      className="flex flex-col overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Cover */}
      <div className={cn("relative h-24 bg-gradient-to-br flex items-center justify-center overflow-hidden", article.gradient)}>
        <Icon
          name={article.icon}
          className="text-[36px] text-white/90 transition-transform duration-500 group-hover:scale-110"
          filled
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {article.featured && (
            <span className="bg-white/95 text-qbit-on-surface text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
              Featured
            </span>
          )}
          {article.latest && (
            <span className="bg-emerald-500 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
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
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-qbit-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="schedule" className="text-[12px]" />
            {article.readingTime}m
          </span>
          <StatusBadge variant={DIFFICULTY_VARIANT[article.difficulty]}>
            {article.difficulty}
          </StatusBadge>
          <span className="flex items-center gap-1">
            <Icon name="visibility" className="text-[12px]" />
            {article.viewCountLabel}
          </span>
        </div>
      </div>
    </SurfaceCard>
  );
}
