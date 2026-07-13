"use client";

/**
 * FirmwareComparison — detailed table comparing installed vs latest firmware.
 *
 * Reuses SurfaceCard.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { type FirmwareInfoDTO } from "@/lib/firmware/types";

interface FirmwareComparisonProps {
  info: FirmwareInfoDTO;
}

export function FirmwareComparison({ info }: FirmwareComparisonProps) {
  const rows = [
    { label: "Version", installed: info.installedVersion ? `v${info.installedVersion}` : "Not Available", latest: info.latestVersion ? `v${info.latestVersion}` : "No firmware available" },
    { label: "Build Number", installed: info.installedBuildNumber ?? "—", latest: "—" },
    {
      label: "Release Date",
      installed: info.installedFirmwareDate
        ? new Date(info.installedFirmwareDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
      latest: info.latestReleaseDate
        ? new Date(info.latestReleaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
    },
    { label: "Vendor", installed: info.installedFirmwareVendor ?? "—", latest: "QBIT Technologies" },
    { label: "Compatibility", installed: info.installedCompatibility ?? "—", latest: info.latestIsStable ? "Stable" : "Beta" },
    { label: "File Size", installed: "—", latest: info.latestFileSize ? `${(info.latestFileSize / 1024 / 1024).toFixed(1)} MB` : "—" },
    { label: "Checksum", installed: "—", latest: info.latestChecksum ?? "—" },
  ];

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-qbit-surface-container-low text-xs uppercase tracking-wider text-qbit-on-surface-variant">
            <tr>
              <th className="px-3 py-2 text-left">Field</th>
              <th className="px-3 py-2 text-left">Installed</th>
              <th className="px-3 py-2 text-left">Latest Available</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-qbit-outline-variant/30">
                <td className="px-3 py-2 font-medium text-qbit-on-surface-variant">{row.label}</td>
                <td className="px-3 py-2 text-qbit-on-surface">{row.installed}</td>
                <td className="px-3 py-2 text-qbit-on-surface font-medium">{row.latest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
