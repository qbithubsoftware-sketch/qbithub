"use client";

/**
 * DrQbitDeviceDetectionPage — main Dr. QBIT Device Detection dashboard.
 *
 * Layout:
 *   - AppShell (variant=field for engineers, variant=admin for admins)
 *   - Header with scan button + KPI tiles
 *   - Filter chips (All / USB / COM / LAN / WiFi / Unknown)
 *   - Device grid (DeviceCard for each detected device)
 *   - Unknown devices section (UnknownDeviceCard + Map button)
 *   - Scan history (collapsible)
 *   - DeviceMapper modal (when mapping unknown device)
 *
 * Reuses: AppShell, FSM_NAV (engineers) / NOTIFICATION_NAV (admins),
 * KpiCard, SurfaceCard, ScanButton, DeviceCard, UnknownDeviceCard,
 * DeviceMapper, DetectedDeviceTable, ScanHistory.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import {
  ScanButton,
  DeviceCard,
  UnknownDeviceCard,
  DeviceMapper,
  DetectedDeviceTable,
  ScanHistory,
} from "@/components/qbit/dr-qbit";
import { FSM_NAV, NOTIFICATION_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { DetectedDeviceDTO } from "@/lib/drqbit/types";

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

interface ScanSessionDTO {
  id: string;
  sessionToken: string;
  engineerName: string | null;
  customerName: string | null;
  workOrderId: string | null;
  agentVersion: string | null;
  osInfo: string | null;
  hostname: string | null;
  scanDurationMs: number | null;
  deviceCount: number;
  matchedCount: number;
  unknownCount: number;
  usbCount: number;
  comCount: number;
  lanCount: number;
  wifiCount: number;
  bluetoothCount: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

type FilterTab = "all" | "usb" | "com" | "lan" | "wifi" | "unknown";

export function DrQbitDeviceDetectionPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [devices, setDevices] = useState<DetectedDeviceDTO[]>([]);
  const [unknownDevices, setUnknownDevices] = useState<UnknownDeviceDTO[]>([]);
  const [sessions, setSessions] = useState<ScanSessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [mappingDevice, setMappingDevice] = useState<UnknownDeviceDTO | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const [devRes, unkRes, sessRes] = await Promise.all([
        fetch("/api/dr-qbit/devices?limit=200", { cache: "no-store" }),
        fetch("/api/dr-qbit/unknown?limit=100", { cache: "no-store" }),
        fetch("/api/dr-qbit/history?limit=20", { cache: "no-store" }),
      ]);

      if (devRes.ok) {
        const data = await devRes.json();
        setDevices(data.items ?? []);
      }
      if (unkRes.ok) {
        const data = await unkRes.json();
        setUnknownDevices(data.items ?? []);
      }
      if (sessRes.ok) {
        const data = await sessRes.json();
        setSessions(data.items ?? []);
      }
    } catch {
      toast({ title: "Failed to load scan data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchDevices();
  }, [fetchDevices]);

  const role = user?.role ?? "viewer";
  const isAdmin = role === "administrator";
  const userName = user?.name ?? "User";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const stats = useMemo(() => {
    return {
      total: devices.length + unknownDevices.length,
      matched: devices.length,
      unknown: unknownDevices.filter((d) => !d.mappedProductId).length,
      usb: devices.filter((d) => d.connectionType === "usb").length,
      com: devices.filter((d) => d.connectionType === "com").length,
      lan: devices.filter((d) => d.connectionType === "lan").length,
      wifi: devices.filter((d) => d.connectionType === "wifi").length,
    };
  }, [devices, unknownDevices]);

  const filteredDevices = useMemo(() => {
    if (filter === "all") return devices;
    if (filter === "unknown") return [];
    return devices.filter((d) => d.connectionType === filter);
  }, [devices, filter]);

  const handleMapped = (deviceId: string, _productId: string) => {
    void fetchDevices();
  };

  return (
    <AppShell
      variant={isAdmin ? "admin" : "field"}
      brand={{ title: "QBIT Hub", tagline: "Dr. QBIT Detection", icon: "smart_toy" }}
      navItems={isAdmin ? NOTIFICATION_NAV : FSM_NAV}
      activeScreen="dr-qbit-detection"
      user={{ name: userName, role: isAdmin ? "Administrator" : "Engineer", initials }}
      cta={{ label: "Refresh", icon: "refresh", onClick: () => void fetchDevices() }}
      topBar={{
        searchPlaceholder: "Search devices…",
        user: { name: userName, role: isAdmin ? "Administrator" : "Engineer", initials },
      }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            Dr. QBIT — Device Detection Engine
          </h2>
          <p className="text-sm text-qbit-on-surface-variant">
            Automatically discover and identify POS hardware connected via USB, COM, LAN, and WiFi.
          </p>
        </div>

        {/* Scan hero */}
        <SurfaceCard className="p-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold text-qbit-on-surface">Hardware Discovery</h3>
              <p className="mt-1 text-sm text-qbit-on-surface-variant">
                Tap the scan button to detect all connected POS devices. The Desktop Companion Agent
                will scan USB, COM, LAN, and WiFi ports — results appear here automatically.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <QbitButton
                  variant="outline"
                  size="sm"
                  icon="download"
                  onClick={() => {
                    toast({
                      title: "Desktop Agent Download",
                      description: "In production, this downloads the QBIT Desktop Agent installer (.exe).",
                    });
                  }}
                >
                  Download Desktop Agent
                </QbitButton>
                <span className="text-xs text-qbit-on-surface-variant">
                  Agent v2.0 · Windows 10/11
                </span>
              </div>
            </div>
            <ScanButton onScanComplete={fetchDevices} />
          </div>
        </SurfaceCard>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Total Devices" value={stats.total.toString()} icon="devices" iconBg="bg-qbit-primary/10 text-qbit-primary" />
          <KpiCard label="Matched" value={stats.matched.toString()} icon="check_circle" iconBg="bg-qbit-success/10 text-qbit-success" />
          <KpiCard label="Unknown" value={stats.unknown.toString()} icon="help_outline" iconBg="bg-qbit-warning/10 text-qbit-warning" />
          <KpiCard label="USB" value={stats.usb.toString()} icon="usb" iconBg="bg-qbit-secondary/10 text-qbit-secondary" />
          <KpiCard label="LAN" value={stats.lan.toString()} icon="lan" iconBg="bg-qbit-tertiary/10 text-qbit-tertiary" />
          <KpiCard label="WiFi" value={stats.wifi.toString()} icon="wifi" iconBg="bg-qbit-primary/10 text-qbit-primary" />
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {([
            { id: "all", label: "All", count: devices.length },
            { id: "usb", label: "USB", count: stats.usb },
            { id: "com", label: "COM", count: stats.com },
            { id: "lan", label: "LAN", count: stats.lan },
            { id: "wifi", label: "WiFi", count: stats.wifi },
            { id: "unknown", label: "Unknown", count: unknownDevices.filter((d) => !d.mappedProductId).length },
          ] as Array<{ id: FilterTab; label: string; count: number }>).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                (filter === tab.id
                  ? "border-qbit-primary bg-qbit-primary text-qbit-on-primary"
                  : "border-qbit-outline-variant bg-white text-qbit-on-surface-variant")
              }
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={"ml-1 text-[10px] " + (filter === tab.id ? "text-white/80" : "text-qbit-on-surface-variant")}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-12 text-center">
            <Icon name="progress_activity" className="mx-auto text-[28px] animate-spin text-qbit-primary" />
            <p className="mt-2 text-sm text-qbit-on-surface-variant">Loading devices…</p>
          </div>
        ) : filter === "unknown" ? (
          /* Unknown devices section */
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="help_outline" className="text-[20px] text-qbit-warning" filled />
              <h3 className="text-sm font-semibold text-qbit-on-surface">Unknown Devices</h3>
              <span className="rounded-full bg-qbit-warning/10 px-2 py-0.5 text-xs font-medium text-qbit-warning">
                {unknownDevices.filter((d) => !d.mappedProductId).length} unmapped
              </span>
            </div>
            {unknownDevices.length === 0 ? (
              <SurfaceCard className="p-8 text-center">
                <Icon name="check_circle" className="mx-auto text-[40px] text-qbit-success" filled />
                <p className="mt-2 text-sm font-medium text-qbit-on-surface">No unknown devices</p>
                <p className="text-xs text-qbit-on-surface-variant">All detected devices have been identified.</p>
              </SurfaceCard>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {unknownDevices.map((d) => (
                  <UnknownDeviceCard
                    key={d.id}
                    device={d}
                    onMap={(device) => setMappingDevice(device)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Detected devices */
          <>
            {/* Desktop: table view */}
            <div className="hidden lg:block">
              <DetectedDeviceTable devices={filteredDevices} />
            </div>

            {/* Mobile/tablet: card grid */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
              {filteredDevices.length === 0 ? (
                <SurfaceCard className="col-span-full p-8 text-center">
                  <Icon name="devices_off" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
                  <p className="mt-2 text-sm text-qbit-on-surface-variant">No devices detected.</p>
                  <p className="text-xs text-qbit-on-surface-variant">Run a scan to discover connected hardware.</p>
                </SurfaceCard>
              ) : (
                filteredDevices.map((d) => <DeviceCard key={d.id} device={d} />)
              )}
            </div>
          </>
        )}

        {/* Scan history (collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-semibold text-qbit-on-surface hover:text-qbit-primary"
          >
            <Icon
              name={showHistory ? "expand_less" : "expand_more"}
              className="text-[18px]"
            />
            Scan History ({sessions.length})
          </button>
          {showHistory && (
            <div className="mt-3">
              <ScanHistory sessions={sessions} onSelect={() => {}} />
            </div>
          )}
        </div>

        {/* Admin: unmapped devices quick access */}
        {isAdmin && stats.unknown > 0 && filter !== "unknown" && (
          <SurfaceCard className="p-4 border-qbit-warning/30 bg-qbit-warning/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon name="warning" className="text-[20px] text-qbit-warning" filled />
                <div>
                  <p className="text-sm font-semibold text-qbit-on-surface">
                    {stats.unknown} unknown device{stats.unknown === 1 ? "" : "s"} need mapping
                  </p>
                  <p className="text-xs text-qbit-on-surface-variant">
                    Map them to existing products so future scans auto-identify them.
                  </p>
                </div>
              </div>
              <QbitButton
                variant="primary"
                size="sm"
                icon="link"
                onClick={() => setFilter("unknown")}
              >
                Map Now
              </QbitButton>
            </div>
          </SurfaceCard>
        )}
      </div>

      {/* Device Mapper Modal */}
      <DeviceMapper
        device={mappingDevice}
        onClose={() => setMappingDevice(null)}
        onMapped={handleMapped}
      />
    </AppShell>
  );
}
