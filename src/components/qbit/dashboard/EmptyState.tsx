"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";

/**
 * EmptyState — premium placeholder shown when a section has no data.
 *
 * Features:
 * - Professional icon in soft-toned container
 * - Clear title + helpful description
 * - Optional primary action (filled button)
 * - Optional secondary action (outline button)
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center py-12", className)}>
      {/* Professional icon container */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-qbit-surface-container text-qbit-on-surface-variant/40 mb-4">
        <Icon name={icon} className="text-[32px]" />
      </div>
      {/* Title + description */}
      <p className="text-sm font-semibold text-qbit-on-surface">{title}</p>
      <p className="mt-1.5 text-xs text-qbit-on-surface-variant max-w-xs leading-relaxed">
        {description}
      </p>
      {/* Actions */}
      {(actionLabel || secondaryLabel) && (
        <div className="flex items-center gap-2 mt-6">
          {actionLabel && onAction && (
            <QbitButton
              size="sm"
              variant="primary"
              icon="arrow_forward"
              onClick={onAction}
            >
              {actionLabel}
            </QbitButton>
          )}
          {secondaryLabel && onSecondary && (
            <QbitButton
              size="sm"
              variant="outline"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </QbitButton>
          )}
        </div>
      )}
    </div>
  );
}
