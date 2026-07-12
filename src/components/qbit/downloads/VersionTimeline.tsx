"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import type { DownloadVersionEntry } from "@/lib/downloads/types";

/**
 * VersionTimeline — professional vertical timeline showing the current
 * version at the top and previous versions below.  Each entry shows
 * version number, release date, changes, bug fixes, and security updates.
 */
export function VersionTimeline({
  currentVersion,
  versions,
}: {
  currentVersion: string;
  versions: DownloadVersionEntry[];
}) {
  return (
    <div className="relative space-y-5 before:content-[''] before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-qbit-outline-variant">
      {versions.map((v, idx) => {
        const isCurrent = v.isCurrent ?? v.version === currentVersion;
        return (
          <div key={`${v.version}-${idx}`} className="relative pl-8">
            {/* Node */}
            <div
              className={cn(
                "absolute left-0 top-1 w-6 h-6 rounded-full border-4 flex items-center justify-center",
                isCurrent
                  ? "bg-qbit-primary border-qbit-surface-container-lowest"
                  : "bg-qbit-outline-variant border-qbit-surface-container-lowest",
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isCurrent ? "bg-white" : "bg-qbit-surface-variant",
                )}
              />
            </div>

            {/* Content */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-xs font-bold text-qbit-on-surface">{v.version}</p>
              {isCurrent && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-qbit-primary bg-qbit-primary/10 px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
              <span
                className={cn(
                  "text-[10px] font-bold uppercase ml-auto",
                  isCurrent ? "text-qbit-primary" : "text-qbit-outline",
                )}
              >
                {v.releaseDate}
              </span>
            </div>

            {/* Changes */}
            {v.changes.length > 0 && (
              <ul className="space-y-1 mb-2">
                {v.changes.map((change, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-sm text-qbit-on-surface-variant"
                  >
                    <Icon
                      name="check_circle"
                      className="text-[14px] text-emerald-500 mt-0.5 shrink-0"
                    />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Bug Fixes */}
            {v.bugFixes && v.bugFixes.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-1">
                  Bug Fixes
                </p>
                <ul className="space-y-0.5">
                  {v.bugFixes.map((fix, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-xs text-qbit-on-surface-variant"
                    >
                      <Icon name="bug_report" className="text-[12px] text-amber-500 mt-0.5 shrink-0" />
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Security Updates */}
            {v.securityUpdates && v.securityUpdates.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-1">
                  Security Updates
                </p>
                <ul className="space-y-0.5">
                  {v.securityUpdates.map((sec, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-xs text-qbit-on-surface-variant"
                    >
                      <Icon name="security" className="text-[12px] text-qbit-error mt-0.5 shrink-0" />
                      <span>{sec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
