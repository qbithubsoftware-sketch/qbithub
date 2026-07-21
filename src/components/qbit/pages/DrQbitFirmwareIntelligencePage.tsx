"use client";

/**
 * DrQbitFirmwareIntelligencePage — Firmware Intelligence dashboard.
 *
 * Two views:
 *   1. List view: searchable list of all firmware information records
 *   2. Detail view: full firmware view with status card, comparison table,
 *      release notes, compatibility checker, history timeline, engineer actions
 *
 * SAFETY: No firmware update is ever started automatically. This page only
 * detects, compares, and recommends. Download button is shown only after
 * compatibility check passes.
 *
 * Reuses: AppShell, FSM_NAV/NOTIFICATION_NAV, KpiCard, SurfaceCard,
 * all firmware components.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  FirmwareStatusCard,
  FirmwareComparison,
  FirmwareHistoryTimeline,
  ReleaseNotesViewer,
  CompatibilityChecker,
} from "@/components/qbit/firmware";
import { FSM_NAV, NOTIFICATION_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import {
  type FirmwareInfoDTO,
  type FirmwareHistoryDTO,
  type CompatibilityResult,
  FIRMWARE_STATUS_VARIANTS,
  FIRMWARE_STATUS_LABELS,
  FIRMWARE_STATUS_ICONS,
} from "@/lib/firmware/types";

export function DrQbitFirmwareIntelligencePage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const params = useNavigation((s) => s.params);
  const { toast } = useToast();

  const [infos, setInfos] = useState<FirmwareInfoDTO[]>([]);
  const [selected, setSelected] = useState<FirmwareInfoDTO | null>(null);
  const [history, setHistory] = useState<FirmwareHistoryDTO[]>([]);
  const [compatResult, setCompatResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInfos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dr-qbit/firmware?limit=100", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setInfos(data.items ?? []);
    } catch {
      toast({ title: "Failed to load firmware data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchInfos();
  }, [fetchInfos]);

  // If navigated with a passportId param, fetch that specific firmware info
  useEffect(() => {
    if (params.passportId) {
      void fetchFirmwareInfo(params.passportId);
      void fetchHistory(params.passportId);
    }
  }, [params.passportId]);

  const fetchFirmwareInfo = async (passportId: string) => {
    try {
      const res = await fetch(`/api/dr-qbit/firmware/${passportId}`, { cache: "no-store" });
      if (res.ok) {
        setSelected(await res.json());
      }
    } catch {
      /* ignore */
    }
  };

  const fetchHistory = async (passportId: string) => {
    try {
      const res = await fetch(`/api/dr-qbit/firmware/${passportId}/history`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.items ?? []);
      }
    } catch {
      /* ignore */
    }
  };

  const handleCheckCompatibility = async () => {
    if (!selected?.latestReleaseId) {
      toast({ title: "No firmware release to check", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`/api/dr-qbit/firmware/${selected.passportId}/check-compatibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmwareReleaseId: selected.latestReleaseId }),
      });
      if (!res.ok) throw new Error("Check failed");
      const result = (await res.json()) as CompatibilityResult;
      setCompatResult(result);
      toast({
        title: result.blocked ? "Update Blocked" : "Compatibility Verified",
        description: result.blocked
          ? result.reasons[0]
          : "Firmware is safe to download and install.",
        variant: result.blocked ? "destructive" : "default",
      });
    } catch (e) {
      toast({
        title: "Compatibility check failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!compatResult?.isCompatible) {
      toast({
        title: "Download Blocked",
        description: "Run compatibility check first. Update is not allowed without verification.",
        variant: "destructive",
      });
      return;
    }
    if (selected?.latestDownloadUrl) {
      toast({
        title: "Download Started",
        description: `Firmware v${selected.latestVersion} is downloading. Never power off the device during update.`,
      });
    }
  };

  const handleCopyVersion = () => {
    if (!selected) return;
    const text = `Firmware: v${selected.installedVersion ?? "N/A"} (installed) → v${selected.latestVersion ?? "N/A"} (latest)`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Version details copied to clipboard." });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Firmware Report",
      description: "In production, this generates a PDF with firmware details, comparison, and history.",
    });
  };

  const role = user?.role ?? "viewer";
  const isAdmin = role === "administrator";
  const userName = user?.name ?? "User";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const stats = useMemo(() => ({
    total: infos.length,
    healthy: infos.filter((i) => i.firmwareStatus === "healthy").length,
    updateAvailable: infos.filter((i) => i.firmwareStatus === "update_available").length,
    unknown: infos.filter((i) => i.firmwareStatus === "unknown").length,
  }), [infos]);

  // -------- Detail view --------
  if (selected) {
    return (
      <AppShell
        variant={isAdmin ? "admin" : "field"}
        brand={{ title: "QBIT Hub", tagline: "Firmware Intelligence", icon: "system_update" }}
        navItems={isAdmin ? NOTIFICATION_NAV : FSM_NAV}
        activeScreen="dr-qbit-firmware"
        user={{ name: userName, role: isAdmin ? "Administrator" : "Engineer", initials }}
        cta={{ label: "Back", icon: "arrow_back", onClick: () => { setSelected(null); navigate("dr-qbit-firmware"); } }}
        topBar={{ searchPlaceholder: "Search…", user: { name: userName, role: isAdmin ? "Administrator" : "Engineer", initials } }}
      >
        <div className="space-y-5">
          {/* Firmware status card */}
          <FirmwareStatusCard info={selected} />

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Left (lg:col-span-2) */}
            <div className="space-y-5 lg:col-span-2">
              <FirmwareComparison info={selected} />
              <ReleaseNotesViewer info={selected} />

              {/* Firmware history */}
              <SurfaceCard className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Icon name="history" className="text-[20px] text-qbit-primary" filled />
                  <h3 className="text-sm font-semibold text-qbit-on-surface">Firmware History</h3>
                </div>
                <FirmwareHistoryTimeline history={history} />
              </SurfaceCard>
            </div>

            {/* Right (lg:col-span-1) */}
            <div className="space-y-5">
              {/* Compatibility checker */}
              <CompatibilityChecker result={compatResult} />

              {/* Engineer actions */}
              <SurfaceCard className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Icon name="build" className="text-[20px] text-qbit-primary" filled />
                  <h3 className="text-sm font-semibold text-qbit-on-surface">Engineer Actions</h3>
                </div>
                <div className="space-y-2">
                  <QbitButton
                    variant="primary"
                    size="sm"
                    icon="shield"
                    fullWidth
                    onClick={handleCheckCompatibility}
                    disabled={!selected.latestReleaseId}
                  >
                    Check Compatibility
                  </QbitButton>
                  <QbitButton
                    variant="outline"
                    size="sm"
                    icon="download"
                    fullWidth
                    onClick={handleDownload}
                    disabled={!compatResult?.isCompatible}
                  >
                    Download Firmware
                  </QbitButton>
                  <QbitButton
                    variant="outline"
                    size="sm"
                    icon="description"
                    fullWidth
                    onClick={() => navigate("driver-download-center")}
                  >
                    Read Update Guide
                  </QbitButton>
                  <QbitButton
                    variant="outline"
                    size="sm"
                    icon="play_circle"
                    fullWidth
                    onClick={() => navigate("video-training-center")}
                  >
                    Watch Update Video
                  </QbitButton>
                  <QbitButton
                    variant="outline"
                    size="sm"
                    icon="content_copy"
                    fullWidth
                    onClick={handleCopyVersion}
                  >
                    Copy Version Details
                  </QbitButton>
                  <QbitButton
                    variant="outline"
                    size="sm"
                    icon="picture_as_pdf"
                    fullWidth
                    onClick={handleGenerateReport}
                  >
                    Generate Firmware Report
                  </QbitButton>
                </div>
              </SurfaceCard>

              {/* Safety notice */}
              <SurfaceCard className="border-qbit-warning/30 bg-qbit-warning/5 p-4">
                <div className="flex items-start gap-2">
                  <Icon name="warning" className="text-[18px] text-qbit-warning" filled />
                  <div>
                    <p className="text-xs font-semibold text-qbit-on-surface">Safety Notice</p>
                    <p className="mt-1 text-[10px] text-qbit-on-surface-variant">
                      Firmware updates are never started automatically. Always verify compatibility
                      before downloading. Never power off the device during a firmware update.
                    </p>
                  </div>
                </div>
              </SurfaceCard>

              {/* Knowledge base links */}
              <SurfaceCard className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Icon name="library_books" className="text-[20px] text-qbit-primary" filled />
                  <h3 className="text-sm font-semibold text-qbit-on-surface">Knowledge Base</h3>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: "Firmware Guides", icon: "menu_book", screen: "installation-center" },
                    { label: "Release Notes", icon: "description", screen: "driver-download-center" },
                    { label: "Troubleshooting", icon: "build", screen: "support-tickets" },
                    { label: "Video Tutorials", icon: "play_circle", screen: "video-training-center" },
                  ].map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => navigate(r.screen as never)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-qbit-primary hover:bg-qbit-surface-container-low"
                    >
                      <Icon name={r.icon} className="text-[14px]" />
                      {r.label}
                      <Icon name="chevron_right" className="ml-auto text-[14px]" />
                    </button>
                  ))}
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
      brand={{ title: "QBIT Hub", tagline: "Firmware Intelligence", icon: "system_update" }}
      navItems={isAdmin ? NOTIFICATION_NAV : FSM_NAV}
      activeScreen="dr-qbit-firmware"
      user={{ name: userName, role: isAdmin ? "Administrator" : "Engineer", initials }}
      topBar={{ searchPlaceholder: "Search firmware…", user: { name: userName, role: isAdmin ? "Administrator" : "Engineer", initials } }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            Firmware Intelligence
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Detect installed firmware, compare with the QBIT Firmware Library, and recommend updates. Updates are never automatic.
          </p>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total Devices" value={stats.total.toString()} icon="devices" iconBg="bg-qbit-primary/10 text-qbit-primary" />
          <KpiCard label="Healthy" value={stats.healthy.toString()} icon="verified" iconBg="bg-qbit-success/10 text-qbit-success" />
          <KpiCard label="Update Available" value={stats.updateAvailable.toString()} icon="system_update" iconBg="bg-qbit-warning/10 text-qbit-warning" />
          <KpiCard label="Unknown" value={stats.unknown.toString()} icon="help_outline" iconBg="bg-qbit-surface-container-high text-qbit-on-surface-variant" />
        </div>

        {/* Firmware list */}
        {loading ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-12 text-center">
            <Icon name="progress_activity" className="mx-auto text-[28px] animate-spin text-qbit-primary" />
            <p className="mt-2 text-sm text-qbit-on-surface-variant">Loading firmware data…</p>
          </div>
        ) : infos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
            <Icon name="system_update" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
            <p className="mt-3 text-sm text-qbit-on-surface-variant">No firmware data yet.</p>
            <p className="text-xs text-qbit-on-surface-variant">
              Device passports with firmware information will appear here.
            </p>
            <QbitButton
              variant="outline"
              size="sm"
              icon="badge"
              className="mt-4"
              onClick={() => navigate("dr-qbit-passport")}
            >
              View Device Passports
            </QbitButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {infos.map((info) => (
              <button
                key={info.id}
                type="button"
                onClick={() => {
                  setSelected(info);
                  void fetchHistory(info.passportId);
                }}
                className="group block rounded-xl border border-qbit-outline-variant/50 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                      <Icon name="system_update" className="text-[22px]" filled />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold text-qbit-primary">
                        {info.passportId.slice(-8).toUpperCase()}
                      </p>
                      <p className="truncate text-sm font-semibold text-qbit-on-surface">
                        Firmware v{info.installedVersion ?? "N/A"}
                      </p>
                      <p className="text-xs text-qbit-on-surface-variant">
                        Latest: v{info.latestVersion ?? "N/A"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    variant={FIRMWARE_STATUS_VARIANTS[info.firmwareStatus]}
                    icon={FIRMWARE_STATUS_ICONS[info.firmwareStatus]}
                    dot
                  >
                    {FIRMWARE_STATUS_LABELS[info.firmwareStatus]}
                  </StatusBadge>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-qbit-outline-variant/50 pt-2">
                  {info.installedVersion && (
                    <TagBadge variant="neutral">
                      Installed: v{info.installedVersion}
                    </TagBadge>
                  )}
                  {info.latestVersion && (
                    <TagBadge variant="primary">
                      Latest: v{info.latestVersion}
                    </TagBadge>
                  )}
                  {info.latestIsCritical && (
                    <TagBadge variant="error">
                      <Icon name="priority_high" className="mr-0.5 inline text-[10px]" filled />
                      Critical
                    </TagBadge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
