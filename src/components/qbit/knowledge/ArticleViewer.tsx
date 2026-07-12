"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import type { KnowledgeArticle, ArticleBlock, ArticleDifficulty } from "@/lib/knowledge/types";

const DIFFICULTY_VARIANT: Record<ArticleDifficulty, "success" | "warning" | "error"> = {
  Beginner: "success",
  Intermediate: "warning",
  Expert: "error",
} as const;

const CALLOUT_CONFIG = {
  info: { icon: "info", bg: "bg-qbit-primary/5", border: "border-qbit-primary/30", text: "text-qbit-on-surface", title: "text-qbit-primary" },
  tip: { icon: "lightbulb", bg: "bg-qbit-primary/5", border: "border-qbit-primary/30", text: "text-qbit-on-surface", title: "text-qbit-primary" },
  warning: { icon: "warning", bg: "bg-amber-50", border: "border-amber-300/50", text: "text-amber-800", title: "text-amber-800" },
  danger: { icon: "dangerous", bg: "bg-red-50", border: "border-red-300/50", text: "text-red-800", title: "text-red-800" },
} as const;

/**
 * ArticleViewer — professional documentation layout for a knowledge article.
 *
 * Renders the article header (title, reading time, updated date, difficulty,
 * author, view count) and the rich-text content body (paragraphs, headings,
 * callouts, code blocks, tables, images, lists).
 */
export function ArticleViewer({ article }: { article: KnowledgeArticle }) {
  return (
    <article className="space-y-6">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <TagBadge variant="primary">{article.category.name}</TagBadge>
          {article.featured && <TagBadge variant="primary">Featured</TagBadge>}
          {article.latest && <TagBadge variant="primary">New</TagBadge>}
          <StatusBadge variant={DIFFICULTY_VARIANT[article.difficulty]}>
            {article.difficulty}
          </StatusBadge>
        </div>
        <h1 className="text-2xl font-bold text-qbit-on-surface md:text-3xl">
          {article.title}
        </h1>
        <p className="text-sm text-qbit-on-surface-variant md:text-base">
          {article.excerpt}
        </p>
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-qbit-on-surface-variant border-y border-qbit-outline-variant py-3">
          <span className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-qbit-primary text-[10px] font-bold text-qbit-on-primary">
              {article.authorAvatar ?? article.author.split(" ").map((p) => p[0]).join("")}
            </span>
            {article.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="schedule" className="text-[16px] text-qbit-primary" />
            {article.readingTime} min read
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="update" className="text-[16px] text-qbit-primary" />
            Updated {article.updatedAt}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="visibility" className="text-[16px] text-qbit-primary" />
            {article.viewCountLabel} views
          </span>
        </div>
      </header>

      {/* Content body */}
      <div className="space-y-4">
        {article.content.map((block, idx) => (
          <ArticleBlockRenderer key={idx} block={block} />
        ))}
      </div>

      {/* Feedback */}
      <ArticleFeedbackBar
        helpfulCount={article.helpfulCount}
        notHelpfulCount={article.notHelpfulCount}
      />
    </article>
  );
}

/** Renders a single rich-text content block. */
function ArticleBlockRenderer({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-sm text-qbit-on-surface-variant leading-relaxed">
          {block.text}
        </p>
      );

    case "heading": {
      const level = block.level ?? 2;
      const className =
        level === 2
          ? "text-xl font-semibold text-qbit-on-surface mt-4"
          : "text-base font-semibold text-qbit-on-surface mt-3";
      return <h2 className={className}>{block.text}</h2>;
    }

    case "callout": {
      const cfg = CALLOUT_CONFIG[block.variant];
      return (
        <div className={cn("flex items-start gap-3 rounded-lg border p-4", cfg.bg, cfg.border)}>
          <Icon name={cfg.icon} className={cn("text-[20px] mt-0.5 shrink-0", cfg.title)} filled />
          <div className="flex-1">
            {block.title && (
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", cfg.title)}>
                {block.title}
              </p>
            )}
            <p className={cn("text-sm leading-relaxed", cfg.text)}>{block.text}</p>
          </div>
        </div>
      );
    }

    case "code":
      return (
        <div className="rounded-lg overflow-hidden border border-qbit-outline-variant bg-qbit-inverse-surface">
          <div className="flex items-center justify-between px-3 py-1.5 bg-qbit-surface-container-high">
            <span className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant">
              {block.language}
            </span>
            <button
              className="flex items-center gap-1 text-[10px] font-semibold text-qbit-on-surface-variant hover:text-qbit-primary"
              onClick={() => navigator.clipboard?.writeText(block.code)}
            >
              <Icon name="content_copy" className="text-[12px]" />
              Copy
            </button>
          </div>
          <pre className="p-4 overflow-x-auto custom-scrollbar">
            <code className="text-sm text-qbit-inverse-on-surface font-mono">{block.code}</code>
          </pre>
        </div>
      );

    case "table":
      return (
        <div className="rounded-lg overflow-hidden border border-qbit-outline-variant">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-qbit-surface-container-low border-b border-qbit-outline-variant">
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-qbit-outline-variant/40">
              {block.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-qbit-surface-container-low transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-qbit-on-surface-variant">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "image":
      return (
        <figure className="rounded-lg overflow-hidden border border-qbit-outline-variant">
          <div className="aspect-video bg-qbit-surface-container-low flex items-center justify-center">
            <Icon name="image" className="text-[40px] text-qbit-outline" />
          </div>
          {block.caption && (
            <figcaption className="px-3 py-2 text-xs text-qbit-on-surface-variant text-center border-t border-qbit-outline-variant">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "list":
      return block.ordered ? (
        <ol className="space-y-1 list-decimal list-inside text-sm text-qbit-on-surface-variant">
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      ) : (
        <ul className="space-y-1 text-sm text-qbit-on-surface-variant">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Icon name="arrow_right" className="text-[14px] text-qbit-primary mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    default:
      return null;
  }
}

/** Feedback bar — helpful / not helpful counts + feedback buttons. */
function ArticleFeedbackBar({
  helpfulCount,
  notHelpfulCount,
}: {
  helpfulCount: number;
  notHelpfulCount: number;
}) {
  return (
    <SurfaceCard className="p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-qbit-on-surface">Was this article helpful?</p>
          <p className="text-xs text-qbit-on-surface-variant mt-0.5">
            <span className="text-emerald-600 font-semibold">{helpfulCount}</span> found this helpful ·{" "}
            <span className="text-red-600 font-semibold">{notHelpfulCount}</span> did not
          </p>
        </div>
        <div className="flex gap-2">
          <QbitButton size="sm" variant="outline" icon="thumb_up">
            Helpful
          </QbitButton>
          <QbitButton size="sm" variant="outline" icon="thumb_down">
            Not Helpful
          </QbitButton>
          <QbitButton size="sm" variant="ghost" icon="edit_note">
            Suggest
          </QbitButton>
          <QbitButton size="sm" variant="ghost" icon="report">
            Report
          </QbitButton>
        </div>
      </div>
    </SurfaceCard>
  );
}
