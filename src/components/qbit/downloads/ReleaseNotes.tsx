"use client";

import { Icon } from "@/components/qbit/primitives/Icon";

/**
 * ReleaseNotes — displays the changelog for a single version.
 *
 * Shows three sections: Changes (new features / improvements), Bug Fixes,
 * and Security Updates.  Each section only renders if it has entries.
 */
export function ReleaseNotes({
  currentVersion,
  changes,
  bugFixes,
  securityUpdates,
}: {
  currentVersion: string;
  changes: string[];
  bugFixes?: string[];
  securityUpdates?: string[];
}) {
  const hasContent =
    changes.length > 0 || (bugFixes && bugFixes.length > 0) || (securityUpdates && securityUpdates.length > 0);

  if (!hasContent) {
    return (
      <p className="text-sm text-qbit-on-surface-variant italic">
        No release notes available for {currentVersion}.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Changes */}
      {changes.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2">
            <Icon name="new_releases" className="text-[14px] text-qbit-primary" />
            Changes in {currentVersion}
          </p>
          <ul className="space-y-1">
            {changes.map((change, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-sm text-qbit-on-surface-variant"
              >
                <Icon name="arrow_right" className="text-[14px] text-qbit-primary mt-0.5 shrink-0" />
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bug Fixes */}
      {bugFixes && bugFixes.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2">
            <Icon name="bug_report" className="text-[14px] text-amber-500" />
            Bug Fixes
          </p>
          <ul className="space-y-1">
            {bugFixes.map((fix, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-sm text-qbit-on-surface-variant"
              >
                <Icon name="check" className="text-[14px] text-emerald-500 mt-0.5 shrink-0" />
                <span>{fix}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Security Updates */}
      {securityUpdates && securityUpdates.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-2">
            <Icon name="security" className="text-[14px] text-qbit-error" />
            Security Updates
          </p>
          <ul className="space-y-1">
            {securityUpdates.map((sec, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-sm text-qbit-on-surface-variant"
              >
                <Icon name="shield" className="text-[14px] text-qbit-error mt-0.5 shrink-0" />
                <span>{sec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
