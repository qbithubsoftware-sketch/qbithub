"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";

/**
 * EmptyState — reusable placeholder shown when a dashboard section has
 * no data.  Centered icon, title, description, and optional CTA button.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center py-8", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-surface-container-high text-qbit-on-surface-variant mb-3">
        <Icon name={icon} className="text-[28px]" />
      </div>
      <p className="text-sm font-semibold text-qbit-on-surface">{title}</p>
      <p className="mt-1 text-xs text-qbit-on-surface-variant max-w-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <QbitButton
          size="sm"
          variant="outline"
          icon="arrow_forward"
          onClick={onAction}
          className="mt-4"
        >
          {actionLabel}
        </QbitButton>
      )}
    </div>
  );
}
