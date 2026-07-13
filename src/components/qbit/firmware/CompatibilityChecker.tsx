"use client";

/**
 * CompatibilityChecker — shows compatibility check result with block/warning indicators.
 *
 * Reuses SurfaceCard, Icon, StatusBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { type CompatibilityResult } from "@/lib/firmware/types";

interface CompatibilityCheckerProps {
  result: CompatibilityResult | null;
}

export function CompatibilityChecker({ result }: CompatibilityCheckerProps) {
  if (!result) {
    return (
      <SurfaceCard className="p-5">
        <div className="flex items-center gap-2 text-qbit-on-surface-variant">
          <Icon name="shield" className="text-[20px]" />
          <p className="text-sm">Compatibility not yet checked.</p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className={"p-5 " + (result.blocked ? "border-qbit-error/30 bg-qbit-error/5" : "border-qbit-success/30 bg-qbit-success/5")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            name={result.blocked ? "block" : "verified_user"}
            className={"text-[20px] " + (result.blocked ? "text-qbit-error" : "text-qbit-success")}
            filled
          />
          <h3 className="text-sm font-semibold text-qbit-on-surface">Compatibility Check</h3>
        </div>
        <StatusBadge variant={result.blocked ? "error" : "success"} dot>
          {result.blocked ? "Blocked" : "Compatible"}
        </StatusBadge>
      </div>

      {/* Block reasons */}
      {result.reasons.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-qbit-error">
            Block Reasons
          </p>
          <ul className="space-y-1">
            {result.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-qbit-on-surface">
                <Icon name="close" className="mt-0.5 text-[12px] shrink-0 text-qbit-error" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className={result.reasons.length > 0 ? "mt-3 border-t border-qbit-outline-variant/50 pt-3" : ""}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-qbit-warning">
            Warnings
          </p>
          <ul className="space-y-1">
            {result.warnings.map((warning, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-qbit-on-surface">
                <Icon name="warning" className="mt-0.5 text-[12px] shrink-0 text-qbit-warning" filled />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safe indicator */}
      {result.isCompatible && result.warnings.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-qbit-success">
          <Icon name="check_circle" className="text-[14px]" filled />
          <span>All compatibility checks passed. Update is safe to proceed.</span>
        </div>
      )}
    </SurfaceCard>
  );
}
