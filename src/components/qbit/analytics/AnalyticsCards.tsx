"use client";

/**
 * AnalyticsCards — reusable KPI card grid.
 *
 * Reuses SurfaceCard, Icon.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";

interface AnalyticsCard {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

interface AnalyticsCardsProps {
  cards: AnalyticsCard[];
  columns?: 2 | 3 | 4 | 6;
}

export function AnalyticsCards({ cards, columns = 4 }: AnalyticsCardsProps) {
  const gridClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {cards.map((card) => (
        <SurfaceCard key={card.label} className="p-3 text-center">
          <Icon
            name={card.icon}
            className={`mx-auto text-[24px] ${card.color ?? "text-qbit-primary"}`}
            filled
          />
          <p className={`mt-1 text-2xl font-bold ${card.color ?? "text-qbit-on-surface"}`}>
            {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-qbit-on-surface-variant">
            {card.label}
          </p>
        </SurfaceCard>
      ))}
    </div>
  );
}
