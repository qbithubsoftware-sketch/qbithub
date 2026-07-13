"use client";

/**
 * DevicePassportCard — the main passport header card with device identity.
 *
 * Reuses SurfaceCard, Icon, StatusBadge, TagBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type PassportDTO,
  PASSPORT_STATUS_VARIANTS,
  PASSPORT_STATUS_LABELS,
  PASSPORT_STATUS_ICONS,
} from "@/lib/passport/types";
import { CONNECTION_ICONS, CONNECTION_LABELS, DEVICE_TYPE_ICONS } from "@/lib/drqbit/types";

interface DevicePassportCardProps {
  passport: PassportDTO;
}

export function DevicePassportCard({ passport }: DevicePassportCardProps) {
  const deviceType = passport.product?.deviceType ?? "unknown";
  const deviceIcon = DEVICE_TYPE_ICONS[deviceType as never] ?? "help_outline";
  const connectionIcon = passport.connectionType
    ? CONNECTION_ICONS[passport.connectionType as never] ?? "usb"
    : "usb";

  return (
    <SurfaceCard className="p-5 md:p-6">
      {/* Header: passport number + status */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-qbit-outline-variant/50 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-qbit-primary text-qbit-on-primary">
            <Icon name={deviceIcon} className="text-[28px]" filled />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-qbit-primary">
                {passport.passportNumber}
              </span>
              <TagBadge variant="primary">Device Passport</TagBadge>
            </div>
            <h2 className="mt-0.5 text-lg font-bold text-qbit-on-surface">
              {passport.deviceName ?? passport.product?.name ?? "Unknown Device"}
            </h2>
            <p className="text-xs text-qbit-on-surface-variant">
              {passport.brand ?? "—"} · {passport.model ?? "—"}
            </p>
          </div>
        </div>
        <StatusBadge
          variant={PASSPORT_STATUS_VARIANTS[passport.deviceStatus]}
          icon={PASSPORT_STATUS_ICONS[passport.deviceStatus]}
          dot
        >
          {PASSPORT_STATUS_LABELS[passport.deviceStatus]}
        </StatusBadge>
      </div>

      {/* Identity grid */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-3">
        <Detail label="Manufacturer" value={passport.manufacturer ?? "—"} />
        <Detail label="Brand" value={passport.brand ?? "—"} />
        <Detail label="Model" value={passport.model ?? "—"} />
        <Detail label="Hardware ID" value={passport.hardwareId ?? "—"} mono />
        <Detail label="Vendor ID (VID)" value={passport.vendorId ?? "—"} mono />
        <Detail label="Product ID (PID)" value={passport.productIdCode ?? "—"} mono />
        <Detail label="Serial Number" value={passport.serialNumber ?? "—"} mono />
        <Detail label="USB Version" value={passport.usbVersion ?? "—"} />
        <Detail
          label="Connection"
          value={passport.connectionType
            ? `${CONNECTION_LABELS[passport.connectionType as never] ?? passport.connectionType}${passport.port ? ` · ${passport.port}` : ""}`
            : "—"}
          icon={connectionIcon}
        />
        {passport.osInfo && <Detail label="OS" value={passport.osInfo} />}
        {passport.architecture && <Detail label="Architecture" value={passport.architecture} />}
        {passport.macAddress && <Detail label="MAC Address" value={passport.macAddress} mono />}
        {passport.ipAddress && <Detail label="IP Address" value={passport.ipAddress} mono />}
      </div>
    </SurfaceCard>
  );
}

function Detail({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-qbit-on-surface-variant">{label}</p>
      <p className={"text-sm text-qbit-on-surface " + (mono ? "font-mono" : "font-medium")}>
        {icon && <Icon name={icon} className="mr-1 inline text-[12px] text-qbit-primary" />}
        {value}
      </p>
    </div>
  );
}
