"use client";

/**
 * DeviceInventoryTable — sortable fleet device table.
 *
 * Reuses SurfaceCard, Icon, StatusBadge, TagBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type FleetDeviceDTO,
  FLEET_STATUS_VARIANTS,
  FLEET_STATUS_LABELS,
  FLEET_STATUS_ICONS,
} from "@/lib/fleet/types";
import { DEVICE_TYPE_ICONS } from "@/lib/drqbit/types";

interface DeviceInventoryTableProps {
  devices: FleetDeviceDTO[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeviceClick?: (device: FleetDeviceDTO) => void;
}

export function DeviceInventoryTable({
  devices,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeviceClick,
}: DeviceInventoryTableProps) {
  if (devices.length === 0) {
    return (
      <SurfaceCard className="p-8 text-center">
        <Icon name="devices_off" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
        <p className="mt-2 text-sm text-qbit-on-surface-variant">No devices match your filters.</p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-qbit-surface-container-low text-xs uppercase tracking-wider text-qbit-on-surface-variant">
            <tr>
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === devices.length && devices.length > 0}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary focus:ring-qbit-primary"
                />
              </th>
              <th className="px-3 py-2 text-left">Device</th>
              <th className="px-3 py-2 text-left">Customer / Branch</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Serial</th>
              <th className="px-3 py-2 text-left">Driver</th>
              <th className="px-3 py-2 text-left">Firmware</th>
              <th className="px-3 py-2 text-left">Warranty</th>
              <th className="px-3 py-2 text-left">Fleet Status</th>
              <th className="px-3 py-2 text-left">Last Scan</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr
                key={d.id}
                className={
                  "cursor-pointer border-t border-qbit-outline-variant/30 hover:bg-qbit-surface-container-low/50 " +
                  (selectedIds.has(d.id) ? "bg-qbit-primary/5" : "")
                }
                onClick={() => onDeviceClick?.(d)}
              >
                <td className="px-3 py-2" onClick={(e) => { e.stopPropagation(); onToggleSelect(d.id); }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(d.id)}
                    onChange={() => onToggleSelect(d.id)}
                    className="h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary focus:ring-qbit-primary"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Icon name={DEVICE_TYPE_ICONS[d.deviceType as never] ?? "badge"} className="text-[16px] text-qbit-primary" />
                    <div>
                      <p className="font-semibold text-qbit-on-surface">{d.deviceName ?? "Unknown"}</p>
                      <p className="text-xs text-qbit-on-surface-variant">{d.passportNumber}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <p className="text-xs font-medium">{d.customerName ?? "—"}</p>
                  <p className="text-[10px] text-qbit-on-surface-variant">
                    {d.branchName ?? "—"}{d.branchCity ? `, ${d.branchCity}` : ""}
                  </p>
                </td>
                <td className="px-3 py-2">
                  <TagBadge variant="neutral">{d.deviceType ?? "—"}</TagBadge>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{d.serialNumber ?? "—"}</td>
                <td className="px-3 py-2">
                  {d.driverStatus ? (
                    <TagBadge variant={
                      d.driverStatus === "installed" ? "primary"
                      : d.driverStatus === "update_available" ? "neutral"
                      : "error"
                    }>{d.driverStatus}</TagBadge>
                  ) : "—"}
                </td>
                <td className="px-3 py-2">
                  {d.firmwareStatus ? (
                    <TagBadge variant={
                      d.firmwareStatus === "healthy" ? "primary"
                      : d.firmwareStatus === "update_available" ? "neutral"
                      : "error"
                    }>{d.firmwareStatus}</TagBadge>
                  ) : "—"}
                </td>
                <td className="px-3 py-2">
                  {d.warrantyStatus ? (
                    <TagBadge variant={
                      d.warrantyStatus === "active" ? "primary" : "error"
                    }>
                      {d.warrantyStatus}
                      {d.warrantyDaysRemaining !== null && d.warrantyDaysRemaining > 0 && ` (${d.warrantyDaysRemaining}d)`}
                    </TagBadge>
                  ) : "—"}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge
                    variant={FLEET_STATUS_VARIANTS[d.fleetStatus]}
                    icon={FLEET_STATUS_ICONS[d.fleetStatus]}
                    dot
                  >
                    {FLEET_STATUS_LABELS[d.fleetStatus]}
                  </StatusBadge>
                </td>
                <td className="px-3 py-2 text-xs text-qbit-on-surface-variant">
                  {d.lastScannedAt ? new Date(d.lastScannedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
