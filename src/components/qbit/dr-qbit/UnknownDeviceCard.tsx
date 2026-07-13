"use client";

/**
 * UnknownDeviceCard — displays an unknown (unmapped) device with mapping button.
 *
 * Reuses SurfaceCard, Icon, StatusBadge, TagBadge.
 */

import { useState } from "react";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";

interface UnknownDeviceDTO {
  id: string;
  hardwareId: string | null;
  vendorId: string | null;
  productIdCode: string | null;
  deviceName: string | null;
  manufacturer: string | null;
  model: string | null;
  connectionType: string | null;
  port: string | null;
  macAddress: string | null;
  ipAddress: string | null;
  mappedProductId: string | null;
  mappedProductName: string | null;
  mappedAt: string | null;
  mappedByName: string | null;
  firstSeenAt: string;
}

interface UnknownDeviceCardProps {
  device: UnknownDeviceDTO;
  onMap?: (device: UnknownDeviceDTO) => void;
}

export function UnknownDeviceCard({ device, onMap }: UnknownDeviceCardProps) {
  if (device.mappedProductId) {
    return (
      <SurfaceCard className="p-4 border-qbit-success/30 bg-qbit-success/5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-success/10 text-qbit-success">
            <Icon name="check_circle" className="text-[20px]" filled />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-qbit-on-surface">
                {device.mappedProductName}
              </span>
              <StatusBadge variant="success" dot>Mapped</StatusBadge>
            </div>
            <p className="text-xs text-qbit-on-surface-variant">
              Previously unknown device mapped by {device.mappedByName ?? "admin"} on{" "}
              {device.mappedAt ? new Date(device.mappedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            </p>
            <p className="mt-1 text-[10px] text-qbit-on-surface-variant">
              VID: {device.vendorId ?? "—"} · PID: {device.productIdCode ?? "—"}
            </p>
          </div>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-4 border-qbit-warning/30 bg-qbit-warning/5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-warning/10 text-qbit-warning">
          <Icon name="help_outline" className="text-[20px]" filled />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-qbit-on-surface">
              {device.deviceName ?? "Unknown Device"}
            </span>
            <StatusBadge variant="warning" dot>Unknown</StatusBadge>
          </div>
          <p className="text-xs text-qbit-on-surface-variant">
            {device.manufacturer ?? "Unknown manufacturer"} · {device.model ?? "Unknown model"}
          </p>

          {/* Hardware IDs */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {device.vendorId && (
              <TagBadge variant="neutral">VID: {device.vendorId}</TagBadge>
            )}
            {device.productIdCode && (
              <TagBadge variant="neutral">PID: {device.productIdCode}</TagBadge>
            )}
            {device.connectionType && (
              <TagBadge variant="primary">{device.connectionType.toUpperCase()}</TagBadge>
            )}
            {device.port && (
              <TagBadge variant="neutral">{device.port}</TagBadge>
            )}
          </div>

          {/* Map button */}
          <QbitButton
            variant="primary"
            size="sm"
            icon="link"
            className="mt-3"
            onClick={() => onMap?.(device)}
          >
            Map to Product
          </QbitButton>
        </div>
      </div>
    </SurfaceCard>
  );
}
