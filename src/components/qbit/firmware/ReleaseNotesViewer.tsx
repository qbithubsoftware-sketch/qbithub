"use client";

/**
 * ReleaseNotesViewer — displays release notes with formatted text.
 *
 * Reuses SurfaceCard, Icon.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { type FirmwareInfoDTO } from "@/lib/firmware/types";

interface ReleaseNotesViewerProps {
  info: FirmwareInfoDTO;
}

export function ReleaseNotesViewer({ info }: ReleaseNotesViewerProps) {
  if (!info.latestReleaseNotes) {
    return (
      <SurfaceCard className="p-5">
        <div className="flex items-center gap-2 text-qbit-on-surface-variant">
          <Icon name="description" className="text-[20px]" />
          <p className="text-sm">No release notes available.</p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="description" className="text-[20px] text-qbit-primary" filled />
        <h3 className="text-sm font-semibold text-qbit-on-surface">Release Notes</h3>
        {info.latestVersion && (
          <span className="font-mono text-xs text-qbit-on-surface-variant">
            v{info.latestVersion}
          </span>
        )}
      </div>
      <div className="prose prose-sm max-w-none">
        <pre className="whitespace-pre-wrap rounded-md bg-qbit-surface-container-low p-3 text-xs text-qbit-on-surface font-sans">
          {info.latestReleaseNotes}
        </pre>
      </div>
    </SurfaceCard>
  );
}
