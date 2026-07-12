"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import type { RequiredTool } from "@/lib/installation/types";

/**
 * RequiredTools — grid of tool cards showing what the engineer needs
 * for the installation.  Each card shows the tool icon, name, description,
 * and an "In Box" or "Bring Your Own" badge.
 */
export function RequiredTools({ tools }: { tools: RequiredTool[] }) {
  return (
    <SurfaceCard className="p-5">
      <h4 className="text-sm font-semibold text-qbit-on-surface flex items-center gap-2 mb-4">
        <Icon name="handyman" className="text-[18px] text-qbit-primary" />
        Tools Required
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="flex items-start gap-3 rounded-xl border border-qbit-outline-variant p-3 hover:border-qbit-primary/30 transition-colors"
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                tool.included
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-qbit-surface-container-low text-qbit-on-surface-variant",
              )}
            >
              <Icon name={tool.icon} className="text-[20px]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-qbit-on-surface">{tool.name}</p>
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                    tool.included
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-qbit-surface-container-high text-qbit-on-surface-variant",
                  )}
                >
                  {tool.included ? "In Box" : "BYO"}
                </span>
              </div>
              {tool.description && (
                <p className="text-xs text-qbit-on-surface-variant mt-0.5">{tool.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
