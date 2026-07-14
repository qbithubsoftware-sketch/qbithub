"use client";

/**
 * DriverComparisonTable — detailed table comparing installed vs latest driver.
 *
 * Reuses SurfaceCard.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { type PassportDTO } from "@/lib/passport/types";

interface DriverComparisonTableProps {
  passport: PassportDTO;
}

export function DriverComparisonTable({ passport }: DriverComparisonTableProps) {
  const info = passport.driverInfo;
  if (!info) return null;

  const rows = [
    { label: "Driver Name", installed: info.installedDriverName ?? "—", latest: info.installedDriverName ?? "—" },
    { label: "Version", installed: info.installedDriverVersion ?? "Not installed", latest: info.latestDriverVersion ?? "No driver available" },
    { label: "Provider", installed: info.installedDriverProvider ?? "—", latest: "QBIT Technologies" },
    {
      label: "Release Date",
      installed: info.installedDriverDate ? new Date(info.installedDriverDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
      latest: info.latestDriverReleaseDate ? new Date(info.latestDriverReleaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    },
    { label: "File Size", installed: "—", latest: info.latestDriverFileSize ? `${(info.latestDriverFileSize / 1024 / 1024).toFixed(1)} MB` : "—" },
    { label: "Supported OS", installed: "—", latest: info.supportedOses?.join(", ") ?? "—" },
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
