"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import type { BulkAction } from "@/lib/admin/types";

const ACTION_CONFIG: Record<BulkAction, { label: string; icon: string; variant: "danger" | "primary" | "outline" | "surface" }> = {
  delete: { label: "Bulk Delete", icon: "delete", variant: "danger" },
  publish: { label: "Bulk Publish", icon: "publish", variant: "primary" },
  archive: { label: "Bulk Archive", icon: "archive", variant: "surface" },
  categoryChange: { label: "Change Category", icon: "category", variant: "outline" },
  export: { label: "Export CSV", icon: "file_download", variant: "outline" },
};

/**
 * BulkActionToolbar — sticky bar that appears when items are selected.
 * Supports bulk delete, publish, archive, category change, and export.
 */
export function BulkActionToolbar({
  selectedCount,
  onAction,
  onClear,
  actions = ["delete", "publish", "archive", "export"],
}: {
  selectedCount: number;
  onAction: (action: BulkAction) => void;
  onClear: () => void;
  actions?: BulkAction[];
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-20 z-30 mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-qbit-primary/30 bg-qbit-surface-container-lowest p-3 shadow-lg animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-qbit-primary text-qbit-on-primary text-xs font-bold">
          {selectedCount}
        </span>
        <span className="text-sm font-semibold text-qbit-on-surface">
          {selectedCount === 1 ? "1 item selected" : `${selectedCount} items selected`}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        {actions.map((action) => {
          const cfg = ACTION_CONFIG[action];
          return (
            <QbitButton
              key={action}
              size="sm"
              variant={cfg.variant}
              icon={cfg.icon}
              onClick={() => onAction(action)}
            >
              {cfg.label}
            </QbitButton>
          );
        })}
        <button
          onClick={onClear}
          aria-label="Clear selection"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}
