"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { useNavigation } from "@/lib/navigation/store";
import type { GuideCardItem } from "@/lib/installation/types";

/**
 * GuideCard — card for the latest/popular guides grid on the installation
 * center landing page.  Shows gradient cover with icon, title, product,
 * estimated time, difficulty, version, and view count.
 */
export function GuideCard({ guide }: { guide: GuideCardItem }) {
  const navigate = useNavigation((s) => s.navigate);

  return (
    <button
      onClick={() => navigate("t800-installation-guide")}
      className="group flex flex-col rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest overflow-hidden text-left transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Cover */}
      <div className={cn("relative h-32 bg-gradient-to-br flex items-center justify-center overflow-hidden", guide.gradient)}>
        <Icon name={guide.icon} className="text-[48px] text-white/90 transition-transform duration-500 group-hover:scale-110" filled />
        <div className="absolute top-2 right-2 flex gap-1">
          {guide.featured && (
            <span className="bg-white/95 text-qbit-on-surface text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
              Featured
            </span>
          )}
          {guide.latest && (
            <span className="bg-emerald-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
      </div>
      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h4 className="text-sm font-semibold text-qbit-on-surface line-clamp-2 mb-1">{guide.title}</h4>
        <p className="text-xs text-qbit-on-surface-variant mb-3">{guide.product}</p>
        <div className="flex flex-wrap items-center gap-2 mt-auto text-[11px] text-qbit-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="schedule" className="text-[12px]" />
            {guide.estimatedTime}m
          </span>
          <span className="flex items-center gap-1">
            <Icon name="signal_cellular_alt" className="text-[12px]" />
            {guide.difficulty}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="tag" className="text-[12px]" />
            {guide.version}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="visibility" className="text-[12px]" />
            {guide.viewCountLabel}
          </span>
        </div>
      </div>
    </button>
  );
}
