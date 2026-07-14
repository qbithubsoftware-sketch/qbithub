"use client";

/**
 * FleetManagerPage — Enterprise Fleet Manager dashboard.
 *
 * Features:
 *   - Fleet health KPI tiles (total, online, attention, offline, warranty, scanned)
 *   - Global search (serial, model, hardware ID, customer, branch)
 *   - Filters (device type, status, warranty, connection type)
 *   - Device inventory table with checkboxes for bulk selection
 *   - Bulk action toolbar (export CSV, generate report, assign engineer, schedule, service)
 *   - Analytics section (most installed, most common issues, most serviced products)
 *   - Report generation
 *
 * Reuses: AppShell, ADMIN_NAV, KpiCard, SurfaceCard, all fleet components.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  FleetHealthCard,
  DeviceInventoryTable,
  BulkActionToolbar,
} from "@/components/qbit/fleet";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import {
  type FleetDeviceDTO,
  type FleetStatsDTO,
  type FleetDeviceStatus,
  FLEET_STATUS_LABELS,
} from "@/lib/fleet/types";

export function FleetManagerPage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  const [devices, setDevices] = useState<FleetDeviceDTO[]>([]);
  const [stats, setStats] = useState<FleetStatsDTO | null>(null);
  const [analytics, setAnalytics] = useState<{
    mostInstalledDevices: Array<{ deviceType: string; count: number }>;
    mostCommonIssues: Array<{ issue: string; count: number }>;
    mostServicedProducts: Array<{ productName: string; count: number }>;
    warrantyExpiringSoon: number;
    totalCustomers: number;
    totalBranches: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FleetDeviceStatus | "">("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (deviceTypeFilter) params.set("deviceType", deviceTypeFilter);

      const [devRes, statsRes, analyticsRes] = await Promise.all([
        fetch(`/api/fleet/devices?${params}`, { cache: "no-store" }),
        fetch(`/api/fleet/stats?${params}`, { cache: "no-store" }),
        fetch("/api/fleet/analytics", { cache: "no-store" }),
      ]);

      if (devRes.ok) {
        const data = await devRes.json();
        setDevices(data.items ?? []);
      }
      if (statsRes.ok) setStats(await statsRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    } catch {
      toast({ title: "Failed to load fleet data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, deviceTypeFilter, toast]);

  useEffect(() => {
    void fetchDevices();
  }, [fetchDevices]);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === devices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(devices.map((d) => d.id)));
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (deviceTypeFilter) params.set("deviceType", deviceTypeFilter);
    window.open(`/api/fleet/export?format=csv&${params}`, "_blank");
  };

  const handleGenerateReport = async () => {
    try {
      const res = await fetch("/api/fleet/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "fleet_health",
          filters: { search, status: statusFilter, deviceType: deviceTypeFilter },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      toast({
        title: "Report Generated",
        description: `Report ${data.report.reportNumber} created. ${data.report.totalDevices} devices, ${data.report.healthyDevices} healthy.`,
      });
    } catch {
      toast({ title: "Report generation failed", variant: "destructive" });
    }
  };

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Fleet Manager", icon: "devices" }}
      navItems={ADMIN_NAV}
      activeScreen="fleet-manager"
      user={{ name: userName, role: "Administrator", initials }}
      cta={{ label: "Refresh", icon: "refresh", onClick: () => void fetchDevices() }}
      topBar={{ searchPlaceholder: "Search fleet…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            Enterprise Fleet Manager
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Multi-device operations center — manage hundreds of POS devices across customers and branches.
          </p>
        </div>

        {/* Fleet health KPIs */}
        {stats && <FleetHealthCard stats={stats} />}

        {/* Search + filters */}
        <SurfaceCard className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="search" className="ml-2 text-[20px] text-qbit-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchDevices()}
              placeholder="Search by serial, model, hardware ID, customer, branch…"
              className="flex-1 border-0 bg-transparent px-2 py-2 text-sm focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FleetDeviceStatus | "")}
              className="rounded-md border border-qbit-outline-variant bg-white px-2 py-1 text-xs"
            >
              <option value="">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="attention_required">Attention Required</option>
              <option value="driver_update">Driver Update</option>
              <option value="firmware_update">Firmware Update</option>
              <option value="out_of_warranty">Out of Warranty</option>
              <option value="recently_scanned">Recently Scanned</option>
              <option value="unknown">Unknown</option>
            </select>
            <select
              value={deviceTypeFilter}
              onChange={(e) => setDeviceTypeFilter(e.target.value)}
              className="rounded-md border border-qbit-outline-variant bg-white px-2 py-1 text-xs"
            >
              <option value="">All Types</option>
              <option value="thermal_printer">Thermal Printer</option>
              <option value="barcode_scanner">Barcode Scanner</option>
              <option value="windows_pos">Windows POS</option>
              <option value="cash_drawer">Cash Drawer</option>
              <option value="customer_display">Customer Display</option>
              <option value="label_printer">Label Printer</option>
              <option value="kitchen_printer">Kitchen Printer</option>
              <option value="kiosk">Kiosk</option>
              <option value="weighing_scale">Weighing Scale</option>
            </select>
            <QbitButton variant="primary" size="sm" icon="search" onClick={fetchDevices}>
              Search
            </QbitButton>
          </div>
        </SurfaceCard>

        {/* Bulk action toolbar */}
        <BulkActionToolbar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onExport={handleExport}
          onGenerateReport={handleGenerateReport}
        />

        {/* Device inventory table */}
        {loading ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-12 text-center">
            <Icon name="progress_activity" className="mx-auto text-[28px] animate-spin text-qbit-primary" />
            <p className="mt-2 text-sm text-qbit-on-surface-variant">Loading fleet inventory…</p>
          </div>
        ) : (
          <DeviceInventoryTable
            devices={devices}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeviceClick={(d) => navigate("dr-qbit-passport", { passportId: d.id })}
          />
        )}

        {/* Analytics section */}
        {analytics && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Most installed devices */}
            <SurfaceCard className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="bar_chart" className="text-[20px] text-qbit-primary" filled />
                <h3 className="text-sm font-semibold text-qbit-on-surface">Most Installed Devices</h3>
              </div>
              <div className="space-y-2">
                {analytics.mostInstalledDevices.slice(0, 5).map((item) => (
                  <div key={item.deviceType} className="flex items-center justify-between">
                    <span className="text-sm text-qbit-on-surface capitalize">{item.deviceType.replace(/_/g, " ")}</span>
                    <TagBadge variant="primary">{item.count}</TagBadge>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            {/* Most serviced products */}
            <SurfaceCard className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="inventory_2" className="text-[20px] text-qbit-primary" filled />
                <h3 className="text-sm font-semibold text-qbit-on-surface">Most Serviced Products</h3>
              </div>
              <div className="space-y-2">
                {analytics.mostServicedProducts.slice(0, 5).map((item) => (
                  <div key={item.productName} className="flex items-center justify-between">
                    <span className="truncate text-sm text-qbit-on-surface">{item.productName}</span>
                    <TagBadge variant="neutral">{item.count}</TagBadge>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            {/* Most common issues */}
            {analytics.mostCommonIssues.length > 0 && (
              <SurfaceCard className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Icon name="bug_report" className="text-[20px] text-qbit-primary" filled />
                  <h3 className="text-sm font-semibold text-qbit-on-surface">Most Common Issues</h3>
                </div>
                <div className="space-y-2">
                  {analytics.mostCommonIssues.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="truncate text-sm text-qbit-on-surface">{item.issue}</span>
                      <TagBadge variant="error">{item.count}</TagBadge>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            )}

            {/* Fleet overview */}
            <SurfaceCard className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="analytics" className="text-[20px] text-qbit-primary" filled />
                <h3 className="text-sm font-semibold text-qbit-on-surface">Fleet Overview</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold text-qbit-primary">{analytics.totalCustomers}</p>
                  <p className="text-xs text-qbit-on-surface-variant">Total Customers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-qbit-primary">{analytics.totalBranches}</p>
                  <p className="text-xs text-qbit-on-surface-variant">Total Branches</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-qbit-warning">{analytics.warrantyExpiringSoon}</p>
                  <p className="text-xs text-qbit-on-surface-variant">Warranty Expiring (90d)</p>
                </div>
              </div>
            </SurfaceCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
