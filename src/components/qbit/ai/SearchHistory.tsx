"use client";

import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { EmptyState } from "@/components/qbit/dashboard/EmptyState";

export interface SearchHistoryEntry {
  id: string;
  query: string;
  time: string;
  pinned?: boolean;
}

/**
 * SearchHistory — sidebar showing recent questions, pinned questions,
 * and frequently asked questions.
 */
export function SearchHistory({
  entries,
  onSelect,
  onPin,
  onViewAll,
}: {
  entries: SearchHistoryEntry[];
  onSelect?: (query: string) => void;
  onPin?: (id: string) => void;
  onViewAll?: () => void;
}) {
  const pinned = entries.filter((e) => e.pinned);
  const recent = entries.filter((e) => !e.pinned);

  return (
    <SurfaceCard className="p-4">
      <h4 className="text-sm font-semibold text-qbit-on-surface flex items-center gap-2 mb-3">
        <Icon name="history" className="text-[18px] text-qbit-primary" />
        Search History
      </h4>

      {entries.length === 0 ? (
        <EmptyState
          icon="chat"
          title="No questions yet"
          description="Your conversation history will appear here."
        />
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-1.5 flex items-center gap-1">
                <Icon name="push_pin" className="text-[12px]" />
                Pinned
              </p>
              <div className="space-y-1">
                {pinned.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} onSelect={onSelect} onPin={onPin} />
                ))}
              </div>
            </div>
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-qbit-on-surface-variant mb-1.5">
                Recent
              </p>
              <div className="space-y-1">
                {recent.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} onSelect={onSelect} onPin={onPin} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {onViewAll && entries.length > 0 && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 py-2 text-qbit-primary text-xs font-medium border border-qbit-primary/20 rounded-lg hover:bg-qbit-primary/5 transition-all"
        >
          View All History
        </button>
      )}
    </SurfaceCard>
  );
}

function HistoryRow({
  entry,
  onSelect,
  onPin,
}: {
  entry: SearchHistoryEntry;
  onSelect?: (query: string) => void;
  onPin?: (id: string) => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-lg p-1.5 hover:bg-qbit-surface-container-low transition-colors">
      <button
        onClick={() => onSelect?.(entry.query)}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-xs font-medium text-qbit-on-surface truncate group-hover:text-qbit-primary">{entry.query}</p>
        <p className="text-[10px] text-qbit-outline">{entry.time}</p>
      </button>
      {onPin && (
        <button
          onClick={() => onPin(entry.id)}
          aria-label={entry.pinned ? "Unpin" : "Pin"}
          className="flex h-6 w-6 items-center justify-center rounded text-qbit-on-surface-variant hover:text-qbit-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Icon name={entry.pinned ? "push_pin" : "push_pin"} className="text-[14px]" filled={entry.pinned} />
        </button>
      )}
    </div>
  );
}
