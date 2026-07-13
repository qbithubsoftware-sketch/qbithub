"use client";

/**
 * DriverStatusCard — shows installed vs latest driver comparison.
 *
 * Reuses SurfaceCard, Icon, StatusBadge.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type PassportDTO,
  DRIVER_STATUS_VARIANTS,
  DRIVER_STATUS_LABELS,
} from "@/lib/passport/types";

interface DriverStatusCardProps {
  passport: PassportDTO;
}

export function DriverStatusCard({ passport }: DriverStatusCardProps) {
  const info = passport.driverInfo;
  if (!info) {
    return (
      <SurfaceCard className="p-5">
        <div className="flex items-center gap-3 text-qbit-on-surface-variant">
          <Icon name="info" className="text-[20px]" />
          <p className="text-sm">Driver information not available.</p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="settings_input_component" className="text-[20px] text-qbit-primary" filled />
          <h3 className="text-sm font-semibold text-qbit-on-surface">Driver Intelligence</h3>
        </div>
        <StatusBadge variant={DRIVER_STATUS_VARIANTS[info.driverStatus]} dot>
          {DRIVER_STATUS_LABELS[info.driverStatus]}
        </StatusBadge>
      </div>

      {/* Installed vs Latest comparison */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Installed */}
        <div className="rounded-lg border border-qbit-outline-variant/50 bg-white p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
            Installed
          </p>
          <p className="text-sm font-semibold text-qbit-on-surface">
            {info.installedDriverVersion ?? "Not installed"}
          </p>
          {info.installedDriverName && (
            <p className="text-xs text-qbit-on-surface-variant">{info.installedDriverName}</p>
          )}
          {info.installedDriverDate && (
            <p className="mt-1 text-[10px] text-qbit-on-surface-variant">
              {new Date(info.installedDriverDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Latest */}
        <div className="rounded-lg border border-qbit-primary/30 bg-qbit-primary/5 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-qbit-primary">
            Latest Available
          </p>
          <p className="text-sm font-semibold text-qbit-on-surface">
            {info.latestDriverVersion ?? "No driver available"}
          </p>
          {info.latestDriverReleaseDate && (
            <p className="mt-1 text-[10px] text-qbit-on-surface-variant">
              {new Date(info.latestDriverReleaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {/* Provider + OS compatibility */}
      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-qbit-outline-variant/50 pt-3 text-xs sm:grid-cols-2">
        {info.installedDriverProvider && (
          <div>
            <span className="text-qbit-on-surface-variant">Provider: </span>
            <span className="font-medium text-qbit-on-surface">{info.installedDriverProvider}</span>
          </div>
        )}
        {info.supportedOses && info.supportedOses.length > 0 && (
          <div>
            <span className="text-qbit-on-surface-variant">Supported OS: </span>
            <span className="font-medium text-qbit-on-surface">{info.supportedOses.join(", ")}</span>
          </div>
        )}
        {info.latestDriverFileSize && (
          <div>
            <span className="text-qbit-on-surface-variant">Size: </span>
            <span className="font-medium text-qbit-on-surface">
              {(info.latestDriverFileSize / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
        )}
      </div>

      {/* Last checked */}
      <p className="mt-3 border-t border-qbit-outline-variant/50 pt-2 text-[10px] text-qbit-on-surface-variant">
        <Icon name="schedule" className="mr-1 inline text-[10px]" />
        Last checked: {new Date(info.lastCheckedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
      </p>
    </SurfaceCard>
  );
}
