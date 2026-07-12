"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Checkbox } from "@/components/ui/checkbox";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import type { ChecklistItem } from "@/lib/installation/types";

/**
 * Checklist — reusable installation checklist with grouped items.
 * Each item has a checkbox; the progress bar updates as items are checked.
 */
export function Checklist({
  items,
  title = "Installation Checklist",
  onExport,
}: {
  items: ChecklistItem[];
  title?: string;
  onExport?: () => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(
    new Set(items.filter((i) => i.defaultChecked).map((i) => i.id)),
  );

  const groups = Array.from(new Set(items.map((i) => i.group)));
  const completedCount = checked.size;
  const totalCount = items.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-qbit-on-surface flex items-center gap-2">
            <Icon name="fact_check" className="text-[18px] text-qbit-primary" />
            {title}
          </h4>
          <p className="text-xs text-qbit-on-surface-variant mt-0.5">
            {completedCount} of {totalCount} items verified ({progress}%)
          </p>
        </div>
        {onExport && (
          <QbitButton size="sm" variant="outline" icon="file_download" onClick={onExport}>
            Export
          </QbitButton>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-qbit-surface-container-high">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            progress === 100 ? "bg-emerald-500" : "bg-qbit-primary",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2">
              {group}
            </p>
            <div className="space-y-2">
              {items.filter((i) => i.group === group).map((item) => {
                const isChecked = checked.has(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggle(item.id)}
                      className="w-5 h-5 mt-0.5 border-qbit-outline-variant data-[state=checked]:bg-qbit-primary data-[state=checked]:border-qbit-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium text-qbit-on-surface group-hover:text-qbit-primary transition-colors",
                          isChecked && "line-through text-qbit-on-surface-variant",
                        )}
                      >
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="text-xs text-qbit-on-surface-variant mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {progress === 100 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <Icon name="verified" className="text-[20px] text-emerald-600" filled />
          <p className="text-sm font-semibold text-emerald-700">
            All checklist items verified. Installation is complete.
          </p>
        </div>
      )}
    </SurfaceCard>
  );
}
