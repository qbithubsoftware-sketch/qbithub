"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { CommonErrorEntry, ErrorSeverity } from "@/lib/knowledge/types";

const SEVERITY_CONFIG: Record<ErrorSeverity, { bg: string; text: string; icon: string }> = {
  info: { bg: "bg-qbit-primary/10", text: "text-qbit-primary", icon: "info" },
  warning: { bg: "bg-amber-100", text: "text-amber-700", icon: "warning" },
  error: { bg: "bg-red-100", text: "text-red-800", icon: "error" },
};

/**
 * ErrorCodeCard — reusable card for a common error code.
 *
 * Displays the error code, meaning, possible cause, resolution, and
 * related product.  Color-coded by severity.
 */
export function ErrorCodeCard({ error }: { error: CommonErrorEntry }) {
  const cfg = SEVERITY_CONFIG[error.severity];
  return (
    <SurfaceCard hover className="p-4 group">
      <div className="flex items-start gap-3">
        {/* Error code badge */}
        <div className={cn("flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-lg", cfg.bg)}>
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", cfg.text)}>Error</span>
          <span className={cn("text-xs font-bold", cfg.text)}>{error.code}</span>
        </div>
        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-qbit-on-surface">{error.meaning}</h4>
          </div>
          {error.productName && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant bg-qbit-surface-container-high px-1.5 py-0.5 rounded mb-2">
              {error.productName}
            </span>
          )}
          <div className="space-y-1.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant flex items-center gap-1">
                <Icon name="help" className="text-[10px]" />
                Cause
              </p>
              <p className="text-xs text-qbit-on-surface-variant">{error.possibleCause}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant flex items-center gap-1">
                <Icon name="check_circle" className="text-[10px] text-emerald-500" />
                Resolution
              </p>
              <p className="text-xs text-qbit-on-surface-variant">{error.resolution}</p>
            </div>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
