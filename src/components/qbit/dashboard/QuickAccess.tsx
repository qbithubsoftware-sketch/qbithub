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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => item.screen && navigate(item.screen)}
            className="flex flex-col items-center text-center p-5 bg-qbit-surface-container-lowest border border-qbit-outline-variant/50 rounded-xl hover:border-qbit-primary/40 hover:bg-qbit-primary/5 hover:shadow-sm transition-all duration-200 group"
          >
            <Icon
              name={item.icon}
              className="text-qbit-primary mb-2 text-[32px] transition-transform duration-200 group-hover:scale-110"
            />
            <span className="text-sm font-medium text-qbit-on-surface mb-0.5">
              {item.label}
            </span>
            <span className="text-[10px] text-qbit-on-surface-variant/70">{item.sub}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
