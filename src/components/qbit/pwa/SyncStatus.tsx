"use client";

/**
 * SyncStatus — shows offline queue sync status with manual retry button.
 *
 * Reuses Icon + QbitButton + useOnlineStatus hook.
 */

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { useOnlineStatus } from "@/lib/pwa/hooks";
import { getQueueStats, replayQueue, triggerBackgroundSync } from "@/lib/pwa/offline-queue";

export function SyncStatus() {
  const online = useOnlineStatus();
  const [stats, setStats] = useState({ pending: 0, syncing: 0, synced: 0, failed: 0, total: 0 });
  const [syncing, setSyncing] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      const s = await getQueueStats();
      setStats(s);
    } catch {
      // IndexedDB not available (SSR or unsupported)
    }
  }, []);

  useEffect(() => {
    void refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (online && stats.pending > 0) {
      void handleSync();
    }
  }, [online, stats.pending]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSync = async () => {
    setSyncing(true);
    try {
      await replayQueue();
      await refreshStats();
    } finally {
      setSyncing(false);
    }
  };

  // Hide if no pending items and online
  if (online && stats.total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon
          name={syncing ? "progress_activity" : online ? "cloud_done" : "cloud_upload"}
          className={"text-[18px] " + (syncing ? "animate-spin text-qbit-primary" : "text-qbit-on-surface-variant")}
        />
        <div>
          <p className="text-xs font-semibold text-qbit-on-surface">
            {syncing ? "Syncing…" : online ? "All changes synced" : "Waiting for connection"}
          </p>
          {stats.pending > 0 && (
            <p className="text-[10px] text-qbit-on-surface-variant">
              {stats.pending} pending · {stats.failed} failed
            </p>
          )}
        </div>
      </div>
      {online && stats.pending > 0 && (
        <QbitButton
          variant="primary"
          size="sm"
          icon={syncing ? "progress_activity" : "sync"}
          disabled={syncing}
          onClick={handleSync}
        >
          {syncing ? "Syncing…" : "Sync Now"}
        </QbitButton>
      )}
    </div>
  );
}
