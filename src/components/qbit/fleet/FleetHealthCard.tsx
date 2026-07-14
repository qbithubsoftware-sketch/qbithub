"use client";

/**
 * FleetHealthCard — overall fleet health stats card.
 *
 * Reuses SurfaceCard, Icon, KpiCard.
 */

import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Icon } from "@/components/qbit/primitives/Icon";
import { type FleetStatsDTO } from "@/lib/fleet/types";

interface FleetHealthCardProps {
  stats: FleetStatsDTO;
}

export function FleetHealthCard({ stats }: FleetHealthCardProps) {
  const items = [
    { label: "Total Devices", value: stats.totalDevices, icon: "devices", color: "text-qbit-primary" },
    { label: "Online", value: stats.online, icon: "cloud_done", color: "text-qbit-success" },
    { label: "Attention", value: stats.attentionRequired + stats.driverUpdateAvailable + stats.firmwareUpdateAvailable, icon: "warning", color: "text-qbit-warning" },
    { label: "Offline", value: stats.offline, icon: "cloud_off", color: "text-qbit-error" },
    { label: "Out of Warranty", value: stats.outOfWarranty, icon: "gpp_bad", color: "text-qbit-error" },
    { label: "Recently Scanned", value: stats.recentlyScanned, icon: "qr_code_scanner", color: "text-qbit-primary" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <SurfaceCard key={item.label} className="p-3 text-center">
          <Icon name={item.icon} className={`mx-auto text-[24px] ${item.color}`} filled />
          <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
          <p className="text-[10px] uppercase tracking-wider text-qbit-on-surface-variant">{item.label}</p>
        </SurfaceCard>
      ))}
    </div>
  );
}
