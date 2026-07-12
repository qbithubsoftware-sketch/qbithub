"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import type { InstallationGuide, GuideDifficulty } from "@/lib/installation/types";

const DIFFICULTY_VARIANT: Record<GuideDifficulty, "success" | "warning" | "error"> = {
  Beginner: "success",
  Intermediate: "warning",
  Expert: "error",
} as const;

/**
 * InstallationHeader — the header for a step-by-step installation guide
 * page.  Shows breadcrumb, title, product, estimated time, difficulty,
 * version, view count, and featured/latest badges.
 */
export function InstallationHeader({
  guide,
  breadcrumb,
}: {
  guide: InstallationGuide;
  breadcrumb?: { label: string; current?: boolean }[];
}) {
  return (
    <header className="space-y-4">
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-qbit-on-surface-variant">
          {breadcrumb.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && <Icon name="chevron_right" className="text-[14px] text-qbit-outline" />}
              <span className={crumb.current ? "text-qbit-on-surface font-semibold" : ""}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      )}

      {/* Title + badges */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {guide.featured && <TagBadge variant="primary">Featured</TagBadge>}
          {guide.latest && <TagBadge variant="primary">Latest</TagBadge>}
          <StatusBadge variant={DIFFICULTY_VARIANT[guide.difficulty]}>{guide.difficulty}</StatusBadge>
        </div>
        <h1 className="text-2xl font-bold text-qbit-on-surface md:text-3xl">{guide.title}</h1>
        <p className="text-sm text-qbit-on-surface-variant md:text-base max-w-3xl">{guide.description}</p>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-qbit-on-surface-variant border-y border-qbit-outline-variant py-3">
        <span className="flex items-center gap-1.5">
          <Icon name="devices" className="text-[18px] text-qbit-primary" />
          {guide.product}
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="schedule" className="text-[18px] text-qbit-primary" />
          {guide.estimatedTime} min
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="tag" className="text-[18px] text-qbit-primary" />
          {guide.version}
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="visibility" className="text-[18px] text-qbit-primary" />
          {guide.viewCountLabel} views
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="task_alt" className="text-[18px] text-qbit-primary" />
          {guide.completionCount.toLocaleString()} completions
        </span>
      </div>
    </header>
  );
}
