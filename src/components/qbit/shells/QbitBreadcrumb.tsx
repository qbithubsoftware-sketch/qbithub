"use client";

/**
 * QBIT Breadcrumb — Stitch-styled navigation breadcrumb.
 *
 * Renders a Material Symbols `chevron_right` separator between items and
 * supports clickable links (via the in-app navigation store) or static
 * labels for the current page.
 */

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";

export interface BreadcrumbItem {
  label: string;
  icon?: string;
  screen?: ScreenId;
  /** When true, renders as plain text (current page). */
  current?: boolean;
}

export function QbitBreadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  const navigate = useNavigation((s) => s.navigate);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs font-medium text-qbit-on-surface-variant",
        className,
      )}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const isCurrent = item.current ?? isLast;
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-1">
            {idx > 0 && (
              <Icon
                name="chevron_right"
                className="text-[14px] text-qbit-outline"
              />
            )}
            {item.icon && (
              <Icon
                name={item.icon}
                className={cn(
                  "text-[14px]",
                  isCurrent ? "text-qbit-on-surface" : "text-qbit-on-surface-variant",
                )}
              />
            )}
            {isCurrent || !item.screen ? (
              <span
                className={cn(
                  isCurrent
                    ? "text-qbit-on-surface font-semibold"
                    : "text-qbit-on-surface-variant",
                )}
              >
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => item.screen && navigate(item.screen)}
                className="text-qbit-on-surface-variant hover:text-qbit-primary transition-colors"
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
