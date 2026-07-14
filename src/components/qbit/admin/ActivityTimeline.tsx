"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { ActivityFeedEntry } from "@/lib/admin/types";

const DOT_COLOR: Record<string, string> = {
  primary: "bg-qbit-primary",
  secondary: "bg-qbit-secondary-container",
  error: "bg-qbit-error",
  neutral: "bg-qbit-outline-variant",
};

const INVITEE_BG = [
  "bg-qbit-primary-fixed text-qbit-on-primary-fixed",
  "bg-qbit-secondary-fixed text-qbit-on-secondary-fixed",
  "bg-qbit-tertiary-fixed text-qbit-on-tertiary-fixed",
];

/**
 * ActivityTimeline — reusable vertical timeline of activity feed entries.
 * Extracted from the AdminDashboardPage so it can be dropped into any
 * admin dashboard.
 */
export function ActivityTimeline({
  entries,
  title = "Activity Logs",
  onViewAll,
}: {
  entries: ActivityFeedEntry[];
  title?: string;
  onViewAll?: () => void;
}) {
  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-qbit-on-surface flex items-center gap-2">
          <Icon name="activity" className="text-[18px] text-qbit-primary" />
          {title}
        </h4>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-semibold text-qbit-primary hover:underline">
            View All
          </button>
        )}
      </div>
      <ol className="relative space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-qbit-outline-variant/30">
        {entries.map((entry) => (
          <li key={entry.id} className={cn("relative pl-8", entry.dim && "opacity-60")}>
            <span className={cn("absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center z-10", DOT_COLOR[entry.dotColor])}>
              <Icon name={entry.icon} className="text-[14px] text-white" />
            </span>
            <div>
              <p className="text-sm text-qbit-on-surface">
                <span className="font-semibold">{entry.userName}</span>{" "}
                <span className="text-qbit-on-surface-variant">{entry.action}</span>
              </p>
              {entry.entity && (
                <p className="text-xs text-qbit-on-surface-variant">{entry.entity}</p>
              )}
              {entry.attachment && (
                <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-qbit-on-surface-variant bg-qbit-surface-container-high px-2 py-0.5 rounded">
                  <Icon name={entry.attachment.icon} className="text-[12px]" />
                  {entry.attachment.label}
                </span>
              )}
              {entry.invitees && (
                <div className="flex -space-x-1.5 mt-1.5">
                  {entry.invitees.map((init, i) => (
                    <span key={i} className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold border-2 border-white", INVITEE_BG[i % INVITEE_BG.length])}>
                      {init}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-qbit-outline mt-1">{entry.time}</p>
            </div>
          </li>
        ))}
      </ol>
    </SurfaceCard>
  );
}
