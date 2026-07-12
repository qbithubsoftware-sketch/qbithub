"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import type { AnalyticsCardItem } from "@/lib/admin/types";

/**
 * AnalyticsCards — grid of analytics cards showing most viewed/downloaded/
 * watched items.  Each card has a title, icon, and a ranked list of items
 * with labels and values.
 */
export function AnalyticsCards({ cards }: { cards: AnalyticsCardItem[] }) {
  return (
    <section className="space-y-4">
      <SectionHeader title="Analytics" accentDot />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <SurfaceCard key={card.id} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", card.iconBg)}>
                <Icon name={card.icon} className="text-[18px]" />
              </div>
              <h4 className="text-sm font-semibold text-qbit-on-surface">{card.title}</h4>
            </div>
            <ol className="space-y-2">
              {card.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-qbit-surface-container-high text-[10px] font-bold text-qbit-on-surface-variant">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-qbit-on-surface truncate">{item.label}</p>
                    {item.subtitle && (
                      <p className="text-[10px] text-qbit-outline truncate">{item.subtitle}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-qbit-primary whitespace-nowrap">{item.value}</span>
                </li>
              ))}
            </ol>
          </SurfaceCard>
        ))}
      </div>
    </section>
  );
}
