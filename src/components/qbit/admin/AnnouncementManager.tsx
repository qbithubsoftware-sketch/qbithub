"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import type { AnnouncementItem } from "@/lib/admin/types";

const TYPE_ICON: Record<string, string> = {
  info: "info",
  maintenance: "construction",
  driver_update: "system_update",
  firmware_release: "memory",
  system_message: "campaign",
};

const SEVERITY_VARIANT = {
  info: "info",
  warning: "warning",
  critical: "error",
} as const;

/**
 * AnnouncementManager — CRUD interface for announcements.
 * Shows a list of announcements with type, severity, visibility, active
 * status, and actions (edit, toggle active, delete).  Includes a "New
 * Announcement" button.
 */
export function AnnouncementManager({
  announcements,
  onEdit,
  onToggle,
  onDelete,
  onCreate,
}: {
  announcements: AnnouncementItem[];
  onEdit?: (a: AnnouncementItem) => void;
  onToggle?: (a: AnnouncementItem) => void;
  onDelete?: (a: AnnouncementItem) => void;
  onCreate?: () => void;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Announcement Manager"
        accentDot
        rightContent={
          <QbitButton size="sm" variant="primary" icon="add" onClick={onCreate}>
            New Announcement
          </QbitButton>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {announcements.map((a) => (
          <SurfaceCard key={a.id} className={cn("p-4", !a.active && "opacity-60")}>
            <div className="flex items-start gap-3 mb-2">
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                a.severity === "critical" ? "bg-qbit-error-container text-qbit-on-error-container" :
                a.severity === "warning" ? "bg-amber-100 text-amber-700" :
                "bg-qbit-primary/10 text-qbit-primary",
              )}>
                <Icon name={TYPE_ICON[a.type] ?? "info"} className="text-[18px]" filled />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-semibold text-qbit-on-surface truncate">{a.title}</h4>
                  <StatusBadge variant={SEVERITY_VARIANT[a.severity]}>{a.severity}</StatusBadge>
                </div>
                <p className="text-xs text-qbit-on-surface-variant line-clamp-2">{a.body}</p>
              </div>
            </div>
            {/* Meta + actions */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-qbit-outline-variant/40">
              <div className="flex items-center gap-2 text-[10px] text-qbit-on-surface-variant">
                <span className="flex items-center gap-1">
                  <Icon name="visibility" className="text-[12px]" />
                  {a.visibility}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="schedule" className="text-[12px]" />
                  {a.createdAt}
                </span>
                {a.active && (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit?.(a)}
                  aria-label="Edit announcement"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container hover:text-qbit-primary transition-colors"
                >
                  <Icon name="edit" className="text-[16px]" />
                </button>
                <button
                  onClick={() => onToggle?.(a)}
                  aria-label={a.active ? "Deactivate" : "Activate"}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors"
                >
                  <Icon name={a.active ? "toggle_on" : "toggle_off"} className="text-[18px]" filled={a.active} />
                </button>
                <button
                  onClick={() => onDelete?.(a)}
                  aria-label="Delete announcement"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Icon name="delete" className="text-[16px]" />
                </button>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </section>
  );
}
