"use client";

/**
 * DeviceCard — displays a detected device with identification details + quick actions.
 *
 * Reuses SurfaceCard, Icon, StatusBadge, TagBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type DeviceConnection,
  type DeviceStatus,
  type DeviceType,
  type DetectedDeviceDTO,
  CONNECTION_ICONS,
  CONNECTION_LABELS,
  DEVICE_TYPE_ICONS,
  DEVICE_TYPE_LABELS,
  DEVICE_STATUS_VARIANTS,
  getDeviceQuickActions,
} from "@/lib/drqbit/types";
import { useNavigation } from "@/lib/navigation/store";

interface DeviceCardProps {
  device: DetectedDeviceDTO;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const navigate = useNavigation((s) => s.navigate);
  const deviceType = device.matchedProductType ?? "unknown";
  const deviceIcon = DEVICE_TYPE_ICONS[deviceType as DeviceType] ?? "help_outline";
  const connectionIcon = CONNECTION_ICONS[device.connectionType as DeviceConnection] ?? "usb";
  const statusVariant = DEVICE_STATUS_VARIANTS[device.status as DeviceStatus] ?? "neutral";

  const quickActions = getDeviceQuickActions({
    driverDownloadUrl: null,
    manualUrl: null,
    installationGuideUrl: null,
    knowledgeBaseUrl: null,
  });

  return (
    <SurfaceCard hover className="p-4">
      {/* Header: icon + name + status */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
          <Icon name={deviceIcon} className="text-[24px]" filled />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-semibold text-qbit-on-surface">
                {device.matchedProductName ?? device.deviceName ?? "Unknown Device"}
              </h4>
              <p className="truncate text-xs text-qbit-on-surface-variant">
                {device.matchedProductModel ?? device.model ?? "Model not detected"}
              </p>
            </div>
            <StatusBadge variant={statusVariant} dot>
              {device.status}
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Connection + ID badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <TagBadge variant="primary">
          <Icon name={connectionIcon} className="mr-1 inline text-[10px]" />
          {CONNECTION_LABELS[device.connectionType as DeviceConnection] ?? device.connectionType}
        </TagBadge>
        {device.port && (
          <TagBadge variant="neutral">{device.port}</TagBadge>
        )}
        {device.matchedProductType && (
          <TagBadge variant="secondary">
            {DEVICE_TYPE_LABELS[device.matchedProductType as DeviceType] ?? device.matchedProductType}
          </TagBadge>
        )}
        {device.matchConfidence !== null && device.matchConfidence < 0.9 && (
          <TagBadge variant="neutral">
            {Math.round((device.matchConfidence ?? 0) * 100)}% match
          </TagBadge>
        )}
      </div>

      {/* Identification details */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-qbit-outline-variant/50 pt-3 text-xs">
        {device.manufacturer && (
          <Detail label="Manufacturer" value={device.manufacturer} />
        )}
        {device.brand && (
          <Detail label="Brand" value={device.brand} />
        )}
        {device.vendorId && (
          <Detail label="VID" value={device.vendorId} mono />
        )}
        {device.productIdCode && (
          <Detail label="PID" value={device.productIdCode} mono />
        )}
        {device.serialNumber && (
          <Detail label="Serial" value={device.serialNumber} mono />
        )}
        {device.hardwareId && (
          <Detail label="Hardware ID" value={device.hardwareId} mono />
        )}
        {device.ipAddress && (
          <Detail label="IP" value={device.ipAddress} mono />
        )}
        {device.macAddress && (
          <Detail label="MAC" value={device.macAddress} mono />
        )}
        {device.signalQuality !== null && (
          <Detail label="Signal" value={`${device.signalQuality}%`} />
        )}
        {device.usbVersion && (
          <Detail label="USB" value={device.usbVersion} />
        )}
      </div>

      {/* Quick actions */}
      {device.matchedProductId && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-qbit-outline-variant/50 pt-3">
          {quickActions.slice(0, 5).map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                if (action.url) {
                  window.open(action.url, "_blank");
                } else if (action.screen) {
                  navigate(action.screen as never);
                }
              }}
              className="inline-flex items-center gap-1 rounded-md border border-qbit-outline-variant bg-white px-2 py-1 text-[10px] font-medium text-qbit-primary transition-colors hover:bg-qbit-primary hover:text-qbit-on-primary"
            >
              <Icon name={action.icon} className="text-[12px]" />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-qbit-on-surface-variant">{label}</p>
      <p className={"text-xs text-qbit-on-surface " + (mono ? "font-mono" : "font-medium")}>{value}</p>
    </div>
  );
}
