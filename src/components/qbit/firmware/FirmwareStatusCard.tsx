"use client";

/**
 * FirmwareStatusCard — shows installed vs latest firmware comparison.
 *
 * Reuses SurfaceCard, Icon, StatusBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type FirmwareInfoDTO,
  FIRMWARE_STATUS_VARIANTS,
  FIRMWARE_STATUS_LABELS,
  FIRMWARE_STATUS_ICONS,
} from "@/lib/firmware/types";

interface FirmwareStatusCardProps {
  info: FirmwareInfoDTO;
}

export function FirmwareStatusCard({ info }: FirmwareStatusCardProps) {
  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="system_update" className="text-[20px] text-qbit-primary" filled />
          <h3 className="text-sm font-semibold text-qbit-on-surface">Firmware Intelligence</h3>
        </div>
        <StatusBadge
          variant={FIRMWARE_STATUS_VARIANTS[info.firmwareStatus]}
          icon={FIRMWARE_STATUS_ICONS[info.firmwareStatus]}
          dot
        >
          {FIRMWARE_STATUS_LABELS[info.firmwareStatus]}
        </StatusBadge>
      </div>

      {/* Installed vs Latest comparison */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Installed */}
        <div className="rounded-lg border border-qbit-outline-variant/50 bg-white p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
            Installed Firmware
          </p>
          {info.installedVersion ? (
            <>
              <p className="text-sm font-semibold text-qbit-on-surface">
                v{info.installedVersion}
              </p>
              {info.installedBuildNumber && (
                <p className="text-xs text-qbit-on-surface-variant">
                  Build: {info.installedBuildNumber}
                </p>
              )}
              {info.installedFirmwareDate && (
                <p className="mt-1 text-[10px] text-qbit-on-surface-variant">
                  {new Date(info.installedFirmwareDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              )}
              {info.installedFirmwareVendor && (
                <p className="text-[10px] text-qbit-on-surface-variant">
                  Vendor: {info.installedFirmwareVendor}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-qbit-on-surface-variant">
              <Icon name="help_outline" className="text-[16px]" />
              <span className="text-sm">Not Available</span>
            </div>
          )}
        </div>

        {/* Latest */}
        <div className="rounded-lg border border-qbit-primary/30 bg-qbit-primary/5 p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-primary">
              Latest Available
            </p>
            {info.latestIsCritical && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-qbit-error/10 px-1.5 py-0.5 text-[9px] font-bold text-qbit-error">
                <Icon name="priority_high" className="text-[10px]" filled />
                Critical
              </span>
            )}
          </div>
          {info.latestVersion ? (
            <>
              <p className="text-sm font-semibold text-qbit-on-surface">
                v{info.latestVersion}
              </p>
              {info.latestReleaseDate && (
                <p className="mt-1 text-[10px] text-qbit-on-surface-variant">
                  {new Date(info.latestReleaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              )}
              {info.latestFileSize && (
                <p className="text-[10px] text-qbit-on-surface-variant">
                  Size: {(info.latestFileSize / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-qbit-on-surface-variant">No firmware available</p>
          )}
        </div>
      </div>

      {/* Compatibility status */}
      {info.compatibilityChecked && (
        <div className={
          "mt-3 flex items-center gap-2 rounded-lg px-3 py-2 " +
          (info.isCompatible
            ? "bg-qbit-success/5 text-qbit-success"
            : "bg-qbit-error/5 text-qbit-error")
        }>
          <Icon
            name={info.isCompatible ? "check_circle" : "block"}
            className="text-[16px]"
            filled
          />
          <span className="text-xs font-medium">
            {info.isCompatible
              ? "Compatibility verified — update allowed"
              : `Update blocked: ${info.compatibilityReason ?? "incompatible device"}`}
          </span>
        </div>
      )}

      {/* Last checked */}
      <p className="mt-3 border-t border-qbit-outline-variant/50 pt-2 text-[10px] text-qbit-on-surface-variant">
        <Icon name="schedule" className="mr-1 inline text-[10px]" />
        Last checked: {new Date(info.lastCheckedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
      </p>
    </SurfaceCard>
  );
}
