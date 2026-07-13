"use client";

/**
 * DrQbitDevicePassportPage — Device Passport + Driver Intelligence dashboard.
 *
 * Two views:
 *   1. List view: searchable list of all device passports
 *   2. Detail view: full passport with DevicePassportCard, DriverStatusCard,
 *      DriverComparisonTable, WarrantyCard, DownloadCenter, ProductGallery,
 *      DeviceTimeline, customer info, quick actions
 *
 * Reuses: AppShell, FSM_NAV/NOTIFICATION_NAV, KpiCard, SurfaceCard,
 * all passport components.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  DevicePassportCard,
  DriverStatusCard,
  DriverComparisonTable,
  WarrantyCard,
  DownloadCenter,
  ProductGallery,
  DeviceTimeline,
} from "@/components/qbit/passport";
import { FSM_NAV, NOTIFICATION_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import {
  type PassportDTO,
  PASSPORT_STATUS_VARIANTS,
  PASSPORT_STATUS_LABELS,
  PASSPORT_STATUS_ICONS,
} from "@/lib/passport/types";
import {
  DEVICE_TYPE_ICONS,
  DEVICE_TYPE_LABELS,
} from "@/lib/drqbit/types";

export function DrQbitDevicePassportPage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const params = useNavigation((s) => s.params);
  const { toast } = useToast();

  const [passports, setPassports] = useState<PassportDTO[]>([]);
  const [selected, setSelected] = useState<PassportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPassports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/dr-qbit/passports?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPassports(data.items ?? []);
    } catch {
      toast({ title: "Failed to load passports", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    void fetchPassports();
  }, [fetchPassports]);

  // If navigated with a passportId param, fetch that specific passport
  useEffect(() => {
    if (params.passportId) {
      void fetchPassportById(params.passportId);
    }
  }, [params.passportId]);

  const fetchPassportById = async (id: string) => {
    try {
      const res = await fetch(`/api/dr-qbit/passports/${id}`, { cache: "no-store" });
      if (res.ok) {
        setSelected(await res.json());
      }
    } catch {
      /* ignore */
    }
  };

  const role = user?.role ?? "viewer";
  const isAdmin = role === "administrator";
  const userName = user?.name ?? "User";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const stats = useMemo(() => ({
    total: passports.length,
    ready: passports.filter((p) => p.deviceStatus === "ready").length,
    driverMissing: passports.filter((p) => p.deviceStatus === "driver_missing").length,
    driverOutdated: passports.filter((p) => p.deviceStatus === "driver_outdated").length,
  }), [passports]);

  const handleSelect = (passport: PassportDTO) => {
    setSelected(passport);
  };

  const handleBack = () => {
    setSelected(null);
    navigate("dr-qbit-passport");
  };

  // -------- Detail view --------
  if (selected) {
    return (
      <AppShell
        variant={isAdmin ? "admin" : "field"}
        brand={{ title: "QBIT Hub", tagline: "Device Passport", icon: "badge" }}
        navItems={isAdmin ? NOTIFICATION_NAV : FSM_NAV}
        activeScreen="dr-qbit-passport"
        user={{ name: userName, role: isAdmin ? "Administrator" : "Engineer", initials }}
        cta={{ label: "Back", icon: "arrow_back", onClick: handleBack }}
        topBar={{ searchPlaceholder: "Search…", user: { name: userName, role: isAdmin ? "Administrator" : "Engineer", initials } }}
      >
        <div className="space-y-5">
          {/* Passport header card */}
          <DevicePassportCard passport={selected} />

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Left column (lg:col-span-2): driver intelligence + comparison + downloads */}
            <div className="space-y-5 lg:col-span-2">
              <DriverStatusCard passport={selected} />
              <DriverComparisonTable passport={selected} />
              <DownloadCenter passport={selected} />

              {/* Installation resources */}
              <SurfaceCard className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Icon name="menu_book" className="text-[20px] text-qbit-primary" filled />
                  <h3 className="text-sm font-semibold text-qbit-on-surface">Installation Resources</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { label: "Installation Guide", icon: "fact_check", screen: "installation-center" },
                    { label: "Quick Start Guide", icon: "rocket_launch", screen: "installation-center" },
                    { label: "Video Tutorials", icon: "play_circle", screen: "video-training-center" },
                    { label: "Knowledge Base", icon: "library_books", screen: "ai-support-center" },
                    { label: "FAQs", icon: "help", screen: "ai-support-center" },
                    { label: "Driver Center", icon: "settings_input_component", screen: "driver-download-center" },
                  ].map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => navigate(r.screen as never)}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-qbit-outline-variant/50 bg-white p-3 text-center transition-all hover:bg-qbit-surface-container-low"
                    >
                      <Icon name={r.icon} className="text-[20px] text-qbit-primary" />
                      <span className="text-[10px] font-medium text-qbit-on-surface">{r.label}</span>
                    </button>
                  ))}
                </div>
              </SurfaceCard>

              {/* Timeline */}
              <SurfaceCard className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Icon name="timeline" className="text-[20px] text-qbit-primary" filled />
                  <h3 className="text-sm font-semibold text-qbit-on-surface">Device Passport Timeline</h3>
                </div>
                <DeviceTimeline passport={selected} />
              </SurfaceCard>
            </div>

            {/* Right column (lg:col-span-1): warranty + gallery + customer info + quick actions */}
            <div className="space-y-5">
              <WarrantyCard passport={selected} />
              <ProductGallery passport={selected} />

              {/* Customer information */}
              {selected.customerAssetId && (
                <SurfaceCard className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon name="person" className="text-[20px] text-qbit-primary" filled />
                    <h3 className="text-sm font-semibold text-qbit-on-surface">Customer Information</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-xs text-qbit-on-surface-variant">Customer asset linked to this device.</p>
                    <QbitButton
                      variant="outline"
                      size="sm"
                      icon="history"
                      fullWidth
                      onClick={() => navigate("fsm-customer-asset-history")}
                    >
                      View Customer Asset History
                    </QbitButton>
                  </div>
                </SurfaceCard>
              )}

              {/* Quick actions */}
              <SurfaceCard className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Icon name="bolt" className="text-[20px] text-qbit-primary" filled />
                  <h3 className="text-sm font-semibold text-qbit-on-surface">Quick Actions</h3>
                </div>
                <div className="space-y-2">
                  <QbitButton variant="primary" size="sm" icon="smart_toy" fullWidth onClick={() => navigate("ai-support-center")}>
                    Run AI Diagnostics
                  </QbitButton>
                  <QbitButton variant="outline" size="sm" icon="print" fullWidth onClick={() => toast({ title: "Test Print", description: "In production, this sends a test print command via Desktop Agent." })}>
                    Run Test Print
                  </QbitButton>
                  <QbitButton variant="outline" size="sm" icon="settings_input_component" fullWidth onClick={() => navigate("driver-download-center")}>
                    Open Driver Center
                  </QbitButton>
                  <QbitButton variant="outline" size="sm" icon="menu_book" fullWidth onClick={() => navigate("driver-download-center")}>
                    Open Manual
                  </QbitButton>
                  <QbitButton variant="outline" size="sm" icon="play_circle" fullWidth onClick={() => navigate("video-training-center")}>
                    Watch Installation Video
                  </QbitButton>
                  <QbitButton variant="outline" size="sm" icon="picture_as_pdf" fullWidth onClick={() => toast({ title: "Device Report", description: "In production, this generates a PDF device report." })}>
                    Generate Device Report
                  </QbitButton>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // -------- List view --------
  return (
    <AppShell
      variant={isAdmin ? "admin" : "field"}
      brand={{ title: "QBIT Hub", tagline: "Device Passports", icon: "badge" }}
      navItems={isAdmin ? NOTIFICATION_NAV : FSM_NAV}
      activeScreen="dr-qbit-passport"
      user={{ name: userName, role: isAdmin ? "Administrator" : "Engineer", initials }}
      topBar={{ searchPlaceholder: "Search passports…", user: { name: userName, role: isAdmin ? "Administrator" : "Engineer", initials } }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            Device Passports
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Digital passports for detected devices — the single source of truth for hardware identity, driver intelligence, and warranty.
          </p>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total Passports" value={stats.total.toString()} icon="badge" iconBg="bg-qbit-primary/10 text-qbit-primary" />
          <KpiCard label="Ready" value={stats.ready.toString()} icon="check_circle" iconBg="bg-qbit-success/10 text-qbit-success" />
          <KpiCard label="Driver Missing" value={stats.driverMissing.toString()} icon="error" iconBg="bg-qbit-error/10 text-qbit-error" />
          <KpiCard label="Driver Outdated" value={stats.driverOutdated.toString()} icon="warning" iconBg="bg-qbit-warning/10 text-qbit-warning" />
        </div>

        {/* Search bar */}
        <SurfaceCard className="p-3">
          <div className="flex items-center gap-2">
            <Icon name="search" className="ml-2 text-[20px] text-qbit-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPassports()}
              placeholder="Search by serial number, model, hardware ID, VID, PID, or passport number…"
              className="flex-1 border-0 bg-transparent px-2 py-2 text-sm focus:outline-none"
            />
            <QbitButton variant="primary" size="sm" icon="search" onClick={fetchPassports}>
              Search
            </QbitButton>
          </div>
        </SurfaceCard>

        {/* Passport list */}
        {loading ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-12 text-center">
            <Icon name="progress_activity" className="mx-auto text-[28px] animate-spin text-qbit-primary" />
            <p className="mt-2 text-sm text-qbit-on-surface-variant">Loading passports…</p>
          </div>
        ) : passports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
            <Icon name="badge" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
            <p className="mt-3 text-sm text-qbit-on-surface-variant">
              {search ? "No passports match your search." : "No device passports yet."}
            </p>
            <p className="text-xs text-qbit-on-surface-variant">
              {!search && "Run a device scan in Dr. QBIT Detection to auto-generate passports."}
            </p>
            {!search && (
              <QbitButton
                variant="outline"
                size="sm"
                icon="qr_code_scanner"
                className="mt-4"
                onClick={() => navigate("dr-qbit-detection")}
              >
                Go to Device Detection
              </QbitButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {passports.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className="group block rounded-xl border border-qbit-outline-variant/50 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                      <Icon
                        name={DEVICE_TYPE_ICONS[p.product?.deviceType as never] ?? "help_outline"}
                        className="text-[22px]"
                        filled
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-semibold text-qbit-primary">
                        {p.passportNumber}
                      </span>
                      <p className="truncate text-sm font-semibold text-qbit-on-surface">
                        {p.deviceName ?? p.product?.name ?? "Unknown Device"}
                      </p>
                      <p className="text-xs text-qbit-on-surface-variant">
                        {p.brand ?? "—"} · {p.model ?? "—"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    variant={PASSPORT_STATUS_VARIANTS[p.deviceStatus]}
                    icon={PASSPORT_STATUS_ICONS[p.deviceStatus]}
                    dot
                  >
                    {PASSPORT_STATUS_LABELS[p.deviceStatus]}
                  </StatusBadge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-qbit-outline-variant/50 pt-2 text-[10px] text-qbit-on-surface-variant">
                  {p.serialNumber && (
                    <span className="inline-flex items-center gap-0.5">
                      <Icon name="tag" className="text-[10px]" />
                      S/N: <span className="font-mono">{p.serialNumber}</span>
                    </span>
                  )}
                  {p.vendorId && (
                    <span className="inline-flex items-center gap-0.5">
                      VID: <span className="font-mono">{p.vendorId}</span>
                    </span>
                  )}
                  {p.productIdCode && (
                    <span className="inline-flex items-center gap-0.5">
                      PID: <span className="font-mono">{p.productIdCode}</span>
                    </span>
                  )}
                </div>

                {p.driverInfo && (
                  <div className="mt-2 flex items-center gap-2">
                    <TagBadge variant={
                      p.driverInfo.driverStatus === "installed" ? "primary"
                      : p.driverInfo.driverStatus === "update_available" ? "neutral"
                      : "error"
                    }>
                      Driver: {p.driverInfo.driverStatus}
                    </TagBadge>
                    {p.driverInfo.installedDriverVersion && (
                      <span className="text-[10px] text-qbit-on-surface-variant">
                        v{p.driverInfo.installedDriverVersion}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
