"use client";

/**
 * ScanHistory — list of past scan sessions with stats.
 *
 * Reuses SurfaceCard + Icon + StatusBadge + TagBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";

interface ScanSessionDTO {
  id: string;
  sessionToken: string;
  engineerName: string | null;
  customerName: string | null;
  workOrderId: string | null;
  agentVersion: string | null;
  osInfo: string | null;
  hostname: string | null;
  scanDurationMs: number | null;
  deviceCount: number;
  matchedCount: number;
  unknownCount: number;
  usbCount: number;
  comCount: number;
  lanCount: number;
  wifiCount: number;
  bluetoothCount: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

interface ScanHistoryProps {
  sessions: ScanSessionDTO[];
  onSelect?: (session: ScanSessionDTO) => void;
}

export function ScanHistory({ sessions, onSelect }: ScanHistoryProps) {
  if (sessions.length === 0) {
    return (
      <SurfaceCard className="p-6 text-center">
        <Icon name="history" className="mx-auto text-[32px] text-qbit-on-surface-variant/40" />
        <p className="mt-2 text-sm text-qbit-on-surface-variant">No scan history yet.</p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <SurfaceCard key={s.id} hover className="p-3 cursor-pointer" >
          <button
            type="button"
            onClick={() => onSelect?.(s)}
            className="block w-full text-left"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                  <Icon name="qr_code_scanner" className="text-[20px]" filled />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-qbit-on-surface">
                      Scan #{s.sessionToken.slice(0, 8)}
                    </span>
                    <StatusBadge variant={s.status === "completed" ? "success" : s.status === "failed" ? "error" : "warning"} dot>
                      {s.status}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-qbit-on-surface-variant">
                    {s.engineerName ?? "Unknown engineer"}
                    {s.customerName ? ` · ${s.customerName}` : ""}
                    {s.hostname ? ` · ${s.hostname}` : ""}
                  </p>
                  <p className="text-[10px] text-qbit-on-surface-variant">
                    {new Date(s.startedAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {s.scanDurationMs ? ` · ${Math.round(s.scanDurationMs / 1000)}s` : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-qbit-primary">{s.deviceCount}</p>
                <p className="text-[10px] text-qbit-on-surface-variant">devices</p>
              </div>
            </div>
            {/* Connection type counts */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {s.usbCount > 0 && <TagBadge variant="primary">USB: {s.usbCount}</TagBadge>}
              {s.comCount > 0 && <TagBadge variant="neutral">COM: {s.comCount}</TagBadge>}
              {s.lanCount > 0 && <TagBadge variant="secondary">LAN: {s.lanCount}</TagBadge>}
              {s.wifiCount > 0 && <TagBadge variant="neutral">WiFi: {s.wifiCount}</TagBadge>}
              {s.bluetoothCount > 0 && <TagBadge variant="neutral">BT: {s.bluetoothCount}</TagBadge>}
              {s.matchedCount > 0 && <StatusBadge variant="success" dot>Matched: {s.matchedCount}</StatusBadge>}
              {s.unknownCount > 0 && <StatusBadge variant="warning" dot>Unknown: {s.unknownCount}</StatusBadge>}
            </div>
          </button>
        </SurfaceCard>
      ))}
    </div>
  );
}
