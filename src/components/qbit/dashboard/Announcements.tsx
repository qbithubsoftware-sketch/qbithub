"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SectionHeader } from "./SectionHeader";
import type { Announcement } from "./types";

/**
 * Announcements — grid of announcement cards.  Each card has a colored
 * icon, title, body text, and optional timestamp.
 */
export function Announcements({
  items,
  onDismiss,
  onViewAll,
}: {
  items: Announcement[];
  onDismiss?: (index: number) => void;
  onViewAll?: () => void;
}) {
  return (
    <section>
      <SectionHeader title="Announcements" actionLabel="View all updates" onAction={onViewAll} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <AnnouncementCard key={idx} item={item} onDismiss={onDismiss ? () => onDismiss(idx) : undefined} />
        ))}
      </div>
    </section>
  );
}

function AnnouncementCard({
  item,
  onDismiss,
}: {
  item: Announcement;
  onDismiss?: () => void;
}) {
  const variantClass = {
    info: "bg-qbit-primary/10 text-qbit-primary",
    warning: "bg-amber-100 text-amber-700",
    success: "bg-emerald-100 text-emerald-700",
    error: "bg-qbit-error-container text-qbit-on-error-container",
  }[item.variant ?? "info"];

  return (
    <SurfaceCard className="p-5 relative card-hover-lift">
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss announcement"
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors"
        >
          <Icon name="close" className="text-[16px]" />
        </button>
      )}
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl mb-3", variantClass)}>
        <Icon name={item.icon} className="text-[20px]" filled />
      </div>
      <p className="text-sm font-semibold text-qbit-on-surface">{item.title}</p>
      <p className="mt-1 text-xs text-qbit-on-surface-variant leading-relaxed">
        {item.body}
      </p>
      {item.time && (
        <p className="mt-3 text-[10px] text-qbit-outline uppercase tracking-wider">
          {item.time}
        </p>
      )}
    </SurfaceCard>
  );
}
