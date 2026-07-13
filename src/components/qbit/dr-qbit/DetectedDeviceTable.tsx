"use client";

/**
 * DetectedDeviceTable — table view of detected devices for desktop.
 *
 * Reuses SurfaceCard + StatusBadge + TagBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type DeviceConnection,
  type DetectedDeviceDTO,
  CONNECTION_ICONS,
  CONNECTION_LABELS,
  DEVICE_STATUS_VARIANTS,
} from "@/lib/drqbit/types";

interface DetectedDeviceTableProps {
  devices: DetectedDeviceDTO[];
  onSelect?: (device: DetectedDeviceDTO) => void;
}

export function DetectedDeviceTable({ devices, onSelect }: DetectedDeviceTableProps) {
  if (devices.length === 0) {
    return (
      <SurfaceCard className="p-8 text-center">
        <Icon name="devices_off" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
        <p className="mt-2 text-sm text-qbit-on-surface-variant">No devices detected yet.</p>
        <p className="text-xs text-qbit-on-surface-variant">Run a scan to discover connected hardware.</p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-qbit-surface-container-low text-xs uppercase tracking-wider text-qbit-on-surface-variant">
            <tr>
              <th className="px-3 py-2 text-left">Device</th>
              <th className="px-3 py-2 text-left">Connection</th>
              <th className="px-3 py-2 text-left">VID / PID</th>
              <th className="px-3 py-2 text-left">Serial / MAC</th>
              <th className="px-3 py-2 text-left">Match</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr
                key={d.id}
                className="cursor-pointer border-t border-qbit-outline-variant/30 hover:bg-qbit-surface-container-low/50"
                onClick={() => onSelect?.(d)}
              >
                <td className="px-3 py-2">
                  <div>
                    <p className="font-semibold text-qbit-on-surface">
                      {d.matchedProductName ?? d.deviceName ?? "Unknown Device"}
                    </p>
                    <p className="text-xs text-qbit-on-surface-variant">
                      {d.matchedProductModel ?? d.model ?? "—"}
                    </p>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      name={CONNECTION_ICONS[d.connectionType as DeviceConnection] ?? "usb"}
                      className="text-[14px] text-qbit-primary"
                    />
                    <span className="text-xs">{CONNECTION_LABELS[d.connectionType as DeviceConnection] ?? d.connectionType}</span>
                  </div>
                  {d.port && <p className="text-[10px] text-qbit-on-surface-variant">{d.port}</p>}
                </td>
                <td className="px-3 py-2">
                  <div className="font-mono text-xs">
                    <p>{d.vendorId ?? "—"}</p>
                    <p className="text-qbit-on-surface-variant">{d.productIdCode ?? "—"}</p>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-mono text-xs">
                    <p>{d.serialNumber ?? "—"}</p>
                    <p className="text-qbit-on-surface-variant">{d.macAddress ?? "—"}</p>
                  </div>
                </td>
                <td className="px-3 py-2">
                  {d.matchedProductId ? (
                    <div>
                      <StatusBadge variant="success" dot>{d.matchMethod ?? "matched"}</StatusBadge>
                      {d.matchConfidence !== null && (
                        <p className="mt-0.5 text-[10px] text-qbit-on-surface-variant">
                          {Math.round(d.matchConfidence * 100)}%
                        </p>
                      )}
                    </div>
                  ) : (
                    <StatusBadge variant="warning" dot>unmatched</StatusBadge>
                  )}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge variant={DEVICE_STATUS_VARIANTS[d.status as never] ?? "neutral"} dot>
                    {d.status}
                  </StatusBadge>
                </td>
                <td className="px-3 py-2 text-xs text-qbit-on-surface-variant">
                  {new Date(d.lastSeenAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  {" "}
                  {new Date(d.lastSeenAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
