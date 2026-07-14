"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";

/**
 * BookmarkButton — toggle button for bookmarking an article, FAQ, or
 * troubleshooting page.  Reusable across the knowledge module.
 */
export function BookmarkButton({
  isBookmarked,
  onToggle,
  size = "md",
  variant = "ghost",
  showLabel = false,
}: {
  isBookmarked: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
  variant?: "ghost" | "outline";
  showLabel?: boolean;
}) {
  const sizeClass = size === "sm" ? "h-8 px-2" : "h-9 px-3";
  const variantClass =
    variant === "outline"
      ? isBookmarked
        ? "border-qbit-primary/30 bg-qbit-primary/10 text-qbit-primary"
        : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container"
      : isBookmarked
        ? "text-qbit-primary hover:bg-qbit-primary/10"
        : "text-qbit-on-surface-variant hover:text-qbit-primary hover:bg-qbit-surface-container";

  return (
    <button
      onClick={onToggle}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors",
        sizeClass,
        variantClass,
      )}
    >
      <Icon
        name={isBookmarked ? "bookmark" : "bookmark_border"}
        className={cn(size === "sm" ? "text-[16px]" : "text-[18px]")}
        filled={isBookmarked}
      />
      {showLabel && (isBookmarked ? "Bookmarked" : "Bookmark")}
    </button>
  );
}
