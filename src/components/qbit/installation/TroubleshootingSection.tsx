"use client";

import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import type { TroubleshootingEntry } from "@/lib/installation/types";

/**
 * TroubleshootingSection — displays common problems, possible causes,
 * and solutions for an installation guide.  Each entry is a card with
 * expandable causes/solutions.
 */
export function TroubleshootingSection({
  entries,
}: {
  entries: TroubleshootingEntry[];
}) {
  if (entries.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Troubleshooting" accentDot />
      <div className="space-y-3">
        {entries.map((entry) => (
          <SurfaceCard key={entry.id} className="p-5">
            {/* Problem */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-qbit-error-container text-qbit-on-error-container">
                <Icon name="error" className="text-[18px]" filled />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-qbit-on-surface">{entry.problem}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
              {/* Causes */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2 flex items-center gap-1">
                  <Icon name="help" className="text-[12px]" />
                  Possible Causes
                </p>
                <ul className="space-y-1">
                  {entry.causes.map((cause, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-qbit-on-surface-variant">
                      <Icon name="circle" className="text-[8px] mt-1.5 shrink-0 text-qbit-outline" />
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solutions */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2 flex items-center gap-1">
                  <Icon name="check_circle" className="text-[12px] text-emerald-500" />
                  Solutions
                </p>
                <ul className="space-y-1">
                  {entry.solutions.map((solution, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-qbit-on-surface-variant">
                      <Icon name="check" className="text-[12px] mt-0.5 shrink-0 text-emerald-500" />
                      <span>{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Related assets */}
            {(entry.relatedAsset || entry.relatedVideoUrl) && (
              <div className="flex flex-wrap gap-2 pl-12 mt-3">
                {entry.relatedAsset && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-qbit-primary bg-qbit-primary/10 px-2 py-0.5 rounded-full">
                    <Icon name="link" className="text-[12px]" />
                    {entry.relatedAsset}
                  </span>
                )}
                {entry.relatedVideoUrl && (
                  <a
                    href={entry.relatedVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-qbit-on-surface-variant bg-qbit-surface-container-high px-2 py-0.5 rounded-full hover:text-qbit-primary transition-colors"
                  >
                    <Icon name="play_circle" className="text-[12px]" />
                    Watch Video
                  </a>
                )}
              </div>
            )}
          </SurfaceCard>
        ))}
      </div>
    </section>
  );
}
