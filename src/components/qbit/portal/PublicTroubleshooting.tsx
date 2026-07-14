"use client";

import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import type { PublicTroubleshootingEntry } from "@/lib/portal/types";

/**
 * PublicTroubleshooting — troubleshooting section for the public product page.
 *
 * REUSES the pattern from the installation module's TroubleshootingSection
 * component, adapted for public-facing content (no internal links).
 */
export function PublicTroubleshooting({ entries }: { entries: PublicTroubleshootingEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionHeader title="Troubleshooting" accentDot />
      <div className="space-y-3">
        {entries.map((entry) => (
          <SurfaceCard key={entry.id} className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-qbit-error-container text-qbit-on-error-container">
                <Icon name="error" className="text-[18px]" filled />
              </div>
              <p className="text-sm font-semibold text-qbit-on-surface pt-1">{entry.problem}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2 flex items-center gap-1">
                  <Icon name="help" className="text-[12px]" />
                  Possible Causes
                </p>
                <ul className="space-y-1">
                  {entry.causes.map((cause, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-qbit-on-surface-variant">
                      <Icon name="circle" className="text-[6px] mt-1.5 shrink-0 text-qbit-outline" />
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
          </SurfaceCard>
        ))}
      </div>
    </section>
  );
}
