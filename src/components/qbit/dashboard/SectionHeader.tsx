"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";

/**
 * Reusable section header with title + optional accent dot + optional
 * action link or custom right-side content (e.g. carousel nav buttons).
 */
export function SectionHeader({
  title,
  accentDot = false,
  actionLabel,
  onAction,
  rightContent,
  className,
}: {
  title: string;
  /** Show a small primary-colored dot after the title (Stitch pattern). */
  accentDot?: boolean;
  /** If provided, renders a text-link action button on the right. */
  actionLabel?: string;
  onAction?: () => void;
  /** Alternative to actionLabel — render arbitrary content on the right. */
  rightContent?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h3 className="text-[20px] font-semibold text-qbit-on-surface flex items-center gap-2">
        {title}
        {accentDot && <span className="w-1.5 h-1.5 rounded-full bg-qbit-primary" />}
      </h3>
      {rightContent ?? (
        actionLabel && (
          <button
            onClick={onAction}
            className="text-xs font-semibold text-qbit-primary hover:underline"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}

/** Carousel navigation arrows (used by FeaturedProducts). */
export function CarouselNav({
  onPrev,
  onNext,
}: {
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onPrev}
        aria-label="Previous"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-qbit-surface-container text-qbit-on-surface-variant hover:bg-qbit-primary hover:text-white transition-colors"
      >
        <Icon name="chevron_left" className="text-[18px]" />
      </button>
      <button
        onClick={onNext}
        aria-label="Next"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-qbit-surface-container text-qbit-on-surface-variant hover:bg-qbit-primary hover:text-white transition-colors"
      >
        <Icon name="chevron_right" className="text-[18px]" />
      </button>
    </div>
  );
}
