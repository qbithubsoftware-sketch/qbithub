"use client";

import { Icon } from "@/components/qbit/primitives/Icon";
import { useNavigation } from "@/lib/navigation/store";
import { SectionHeader } from "./SectionHeader";
import type { QuickAccessItem } from "./types";

/**
 * Quick Access — grid of centered icon cards.  Matches the Stitch design:
 * each card is a vertical stack (icon, label, sub-label) that rotates the
 * icon on hover.
 */
export function QuickAccess({ items }: { items: QuickAccessItem[] }) {
  const navigate = useNavigation((s) => s.navigate);

  return (
    <section>
      <SectionHeader title="Quick Access" accentDot />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => item.screen && navigate(item.screen)}
            className="flex flex-col items-center text-center p-6 bg-qbit-surface-container-lowest border border-qbit-outline-variant rounded-2xl hover:border-qbit-primary hover:bg-qbit-primary/5 transition-all group"
          >
            <Icon
              name={item.icon}
              className="text-qbit-primary mb-2 text-[36px] transition-transform group-hover:rotate-12"
            />
            <span className="text-sm font-medium text-qbit-on-surface mb-1">
              {item.label}
            </span>
            <span className="text-[10px] text-qbit-outline">{item.sub}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
