"use client";

/**
 * OfflineBanner — sticky banner shown when the app is offline.
 *
 * Reuses Icon + useOnlineStatus hook.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { useOnlineStatus } from "@/lib/pwa/hooks";

interface OfflineBannerProps {
  /** If provided, shows "N items queued for sync" in the banner. */
  pendingCount?: number;
}

export function OfflineBanner({ pendingCount }: OfflineBannerProps) {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-qbit-error px-4 py-2.5 text-white shadow-md"
    >
      <div className="flex items-center gap-2">
        <Icon name="cloud_off" className="text-[20px]" filled />
        <div>
          <p className="text-sm font-semibold">You are offline</p>
          <p className="text-xs text-white/80">
            {pendingCount && pendingCount > 0
              ? `${pendingCount} item${pendingCount === 1 ? "" : "s"} queued — will sync when back online`
              : "Changes will be saved locally and synced when you reconnect"}
          </p>
        </div>
      </div>
      <Icon name="wifi_off" className="text-[18px] text-white/60" />
    </div>
  );
}
