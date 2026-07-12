"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import { CONTENT_VERSIONS } from "@/lib/cms/placeholder-data";

/**
 * VersionHistory — revision timeline showing all versions of an entity.
 * Supports viewing history, comparing versions, and restoring previous versions.
 */
export function VersionHistory({ entityName = "QBIT T-800" }: { entityName?: string }) {
  return (
    <section className="space-y-4">
      <SectionHeader title="Version History" accentDot actionLabel="Compare versions" />
      <SurfaceCard className="p-5">
        <p className="text-xs text-qbit-on-surface-variant mb-4">
          Revision history for <span className="font-semibold text-qbit-on-surface">{entityName}</span>
        </p>

        {/* Timeline */}
        <div className="relative space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-qbit-outline-variant/30">
          {CONTENT_VERSIONS.map((version, idx) => (
            <div key={version.id} className="relative pl-8">
              {/* Node */}
              <div className={cn(
                "absolute left-0 top-1 w-6 h-6 rounded-full border-4 flex items-center justify-center",
                idx === 0 ? "bg-qbit-primary border-white" : "bg-qbit-outline-variant border-white",
              )}>
                <span className={cn("text-[9px] font-bold", idx === 0 ? "text-white" : "text-qbit-surface-variant")}>v{version.version}</span>
              </div>

              {/* Content */}
              <div className={cn("rounded-lg p-3", idx === 0 ? "bg-qbit-primary/5 border border-qbit-primary/20" : "bg-qbit-surface-container-low")}>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-qbit-on-surface">Version {version.version}</span>
                  {idx === 0 && (
                    <span className="text-[9px] font-bold uppercase bg-qbit-primary text-white px-1.5 py-0.5 rounded-full">Current</span>
                  )}
                  <span className="text-[10px] text-qbit-outline ml-auto">{version.createdAt}</span>
                </div>
                <p className="text-xs text-qbit-on-surface-variant">{version.changeSummary}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-qbit-outline flex items-center gap-1">
                    <Icon name="person" className="text-[12px]" />
                    {version.changedBy}
                  </span>
                  {version.canRestore && idx > 0 && (
                    <QbitButton size="sm" variant="ghost" icon="restore" className="ml-auto h-6 text-[10px]">Restore</QbitButton>
                  )}
                  {idx > 0 && (
                    <button className="text-[10px] font-semibold text-qbit-primary hover:underline flex items-center gap-0.5">
                      <Icon name="compare" className="text-[12px]" /> Compare
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </section>
  );
}
