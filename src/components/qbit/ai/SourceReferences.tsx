"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import type { SourceDocument } from "@/lib/ai/types";

const SOURCE_ICON: Record<string, string> = {
  product: "inventory_2",
  driver: "settings_input_component",
  manual: "menu_book",
  article: "article",
  guide: "build",
  faq: "help",
  troubleshooting: "error",
  video: "play_circle",
  error_code: "error",
};

const SOURCE_LABEL: Record<string, string> = {
  product: "Product",
  driver: "Driver",
  manual: "Manual",
  article: "Article",
  guide: "Guide",
  faq: "FAQ",
  troubleshooting: "Troubleshooting",
  video: "Video",
  error_code: "Error Code",
};

/**
 * SourceReferences — shows the source documents used by the AI to
 * generate its response.  Displayed below each assistant message.
 */
export function SourceReferences({ sources }: { sources: SourceDocument[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-qbit-outline-variant/30">
      <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2 flex items-center gap-1">
        <Icon name="link" className="text-[12px]" />
        Sources ({sources.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.slice(0, 6).map((src, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-qbit-on-surface-variant bg-qbit-surface-container-high px-2 py-0.5 rounded-full"
            title={src.excerpt}
          >
            <Icon name={SOURCE_ICON[src.sourceType] ?? "description"} className="text-[12px]" />
            {src.title.length > 40 ? src.title.slice(0, 40) + "…" : src.title}
          </span>
        ))}
        {sources.length > 6 && (
          <span className="text-[10px] text-qbit-outline self-center">
            +{sources.length - 6} more
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * RelatedAssets — shows related assets (drivers, manuals, guides, videos)
 * alongside an AI response.  Similar to SourceReferences but with more
 * detail and clickable links.
 */
export function RelatedAssets({ sources }: { sources: SourceDocument[] }) {
  if (sources.length === 0) return null;

  // Group by source type
  const grouped = sources.reduce((acc, src) => {
    if (!acc[src.sourceType]) acc[src.sourceType] = [];
    acc[src.sourceType].push(src);
    return acc;
  }, {} as Record<string, SourceDocument[]>);

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs font-semibold text-qbit-on-surface flex items-center gap-1.5">
        <Icon name="collections_bookmark" className="text-[16px] text-qbit-primary" />
        Related Assets
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sources.slice(0, 6).map((src, idx) => (
          <a
            key={idx}
            href={src.url ?? "#"}
            className="group flex items-center gap-2 rounded-lg border border-qbit-outline-variant bg-white p-2.5 hover:border-qbit-primary/30 hover:shadow-sm transition-all"
          >
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              src.sourceType === "driver" ? "bg-qbit-primary/10 text-qbit-primary" :
              src.sourceType === "manual" ? "bg-amber-100 text-amber-700" :
              src.sourceType === "guide" ? "bg-emerald-100 text-emerald-700" :
              src.sourceType === "troubleshooting" ? "bg-red-100 text-red-700" :
              "bg-qbit-surface-container-high text-qbit-on-surface-variant",
            )}>
              <Icon name={SOURCE_ICON[src.sourceType] ?? "description"} className="text-[16px]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-qbit-on-surface truncate group-hover:text-qbit-primary">{src.title}</p>
              <p className="text-[10px] text-qbit-on-surface-variant">{SOURCE_LABEL[src.sourceType] ?? "Reference"}</p>
            </div>
            <Icon name="open_in_new" className="text-[14px] text-qbit-on-surface-variant group-hover:text-qbit-primary" />
          </a>
        ))}
      </div>
    </div>
  );
}
