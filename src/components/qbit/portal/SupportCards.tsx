"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SectionHeader } from "@/components/qbit/dashboard/SectionHeader";
import type { SupportCardItem } from "@/lib/portal/types";

/**
 * SupportCards — grid of support contact cards (WhatsApp, Call, Email,
 * Request Demo, Contact Sales).
 */
export function SupportCards({ cards }: { cards: SupportCardItem[] }) {
  return (
    <section className="space-y-4">
      <SectionHeader title="Support" accentDot />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <a
            key={card.id}
            href={card.href}
            target={card.href.startsWith("http") ? "_blank" : undefined}
            rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className={cn(
              "group flex flex-col items-center text-center p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md",
              card.variant === "primary"
                ? "border-qbit-primary bg-qbit-primary/5"
                : "border-qbit-outline-variant bg-white hover:border-qbit-primary/30",
            )}
          >
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg mb-3 transition-colors",
              card.variant === "primary"
                ? "bg-qbit-primary text-white"
                : "bg-qbit-primary/10 text-qbit-primary group-hover:bg-qbit-primary group-hover:text-white",
            )}>
              <Icon name={card.icon} className="text-[22px]" filled={card.variant === "primary"} />
            </div>
            <p className="text-sm font-semibold text-qbit-on-surface">{card.title}</p>
            <p className="text-[11px] text-qbit-on-surface-variant mt-0.5">{card.meta}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
