"use client";

/**
 * DrQbitDiagnosticsPage — AI Diagnostics Engine dashboard.
 *
 * Two views:
 *   1. List view: device passport selection + diagnostic session history
 *   2. Detail view: full diagnostic results with HealthScoreCard, findings,
 *      recommendations, timeline, action center
 *
 * The engine NEVER guesses — only reports confirmed information.
 *
 * Reuses: AppShell, FSM_NAV/NOTIFICATION_NAV, KpiCard, SurfaceCard,
 * all diagnostics components.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  HealthScoreCard,
  IssueCard,
  RecommendationCard,
  DiagnosticTimeline,
  ActionCenter,
} from "@/components/qbit/diagnostics";
import { FSM_NAV, NOTIFICATION_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import {
  type DiagnosticSessionDTO,
  HEALTH_GRADE_VARIANTS,
  HEALTH_GRADE_LABELS,
  HEALTH_GRADE_ICONS,
} from "@/lib/diagnostics/types";
import type { PassportDTO } from "@/lib/passport/types";

export function DrQbitDiagnosticsPage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  const [passports, setPassports] = useState<PassportDTO[]>([]);
  const [sessions, setSessions] = useState<DiagnosticSessionDTO[]>([]);
  const [selectedSession, setSelectedSession] = useState<DiagnosticSessionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedPassportId, setSelectedPassportId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [passRes, sessRes] = await Promise.all([
        fetch("/api/dr-qbit/passports?limit=50", { cache: "no-store" }),
        fetch("/api/dr-qbit/diagnostics?limit=20", { cache: "no-store" }),
      ]);
      if (passRes.ok) {
        const data = await passRes.json();
        setPassports(data.items ?? []);
      }
      if (sessRes.ok) {
        const data = await sessRes.json();
        setSessions(data.items ?? []);
      }
    } catch {
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRunDiagnostics = async (passportId: string) => {
    setRunning(true);
    try {
      const res = await fetch("/api/dr-qbit/diagnostics/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passportId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to run diagnostics");
      }
      const result = await res.json();
      toast({
        title: "Diagnostics Complete",
        description: `Health Score: ${result.overallScore}/100 (${HEALTH_GRADE_LABELS[result.healthGrade as keyof typeof HEALTH_GRADE_LABELS] ?? result.healthGrade}). ${result.findingsCount} findings, ${result.recommendationsCount} recommendations.`,
      });
      // Fetch the full session detail
      await fetchSessionDetail(result.sessionId);
      void fetchData(); // refresh list
    } catch (e) {
      toast({
        title: "Diagnostics Failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const fetchSessionDetail = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/dr-qbit/diagnostics/${sessionId}`, { cache: "no-store" });
      if (res.ok) {
        setSelectedSession(await res.json());
      }
    } catch {
      /* ignore */
    }
  };

  const role = user?.role ?? "installation_engineer";
  const isAdmin = role === "administrator";
  const userName = user?.name ?? "User";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const stats = useMemo(() => ({
    total: sessions.length,
    excellent: sessions.filter((s) => s.healthGrade === "excellent").length,
    attention: sessions.filter((s) => s.healthGrade === "attention" || s.healthGrade === "good").length,
    critical: sessions.filter((s) => s.healthGrade === "critical").length,
  }), [sessions]);

  // -------- Detail view --------
  if (selectedSession) {
    return (
      <AppShell
        variant={isAdmin ? "admin" : "field"}
        brand={{ title: "QBIT Hub", tagline: "AI Diagnostics", icon: "smart_toy" }}
        navItems={isAdmin ? NOTIFICATION_NAV : FSM_NAV}
        activeScreen="dr-qbit-diagnostics"
        user={{ name: userName, role: isAdmin ? "Administrator" : "Engineer", initials }}
        cta={{ label: "Back", icon: "arrow_back", onClick: () => setSelectedSession(null) }}
        topBar={{ searchPlaceholder: "Search…", user: { name: userName, role: isAdmin ? "Administrator" : "Engineer", initials } }}
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon name="smart_toy" className="text-[20px] text-qbit-primary" filled />
              <h2 className="text-xl font-bold text-qbit-on-surface">Diagnostic Report</h2>
              <span className="font-mono text-xs text-qbit-on-surface-variant">
                {selectedSession.sessionToken.slice(0, 16)}
              </span>
            </div>
            <p className="text-sm text-qbit-on-surface-variant">
              {selectedSession.productName ?? selectedSession.deviceName ?? "Unknown device"} · {selectedSession.passportNumber}
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Left (lg:col-span-2) */}
            <div className="space-y-5 lg:col-span-2">
              {/* Health Score Card */}
              <HealthScoreCard
                overallScore={selectedSession.overallScore}
                healthGrade={selectedSession.healthGrade}
                driverScore={selectedSession.driverScore}
                firmwareScore={selectedSession.firmwareScore}
                connectionScore={selectedSession.connectionScore}
                deviceStatusScore={selectedSession.deviceStatusScore}
                compatibilityScore={selectedSession.compatibilityScore}
                knowledgeScore={selectedSession.knowledgeScore}
              />

              {/* Findings */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Icon name="fact_check" className="text-[20px] text-qbit-primary" filled />
                  <h3 className="text-sm font-semibold text-qbit-on-surface">
                    Findings ({selectedSession.findings?.length ?? 0})
                  </h3>
                  <TagBadge variant="neutral">
                    {selectedSession.confirmedCount} confirmed
                  </TagBadge>
                  {selectedSession.possibleCount > 0 && (
                    <TagBadge variant="error">
                      {selectedSession.possibleCount} possible
                    </TagBadge>
                  )}
                </div>
                {selectedSession.findings && selectedSession.findings.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSession.findings.map((f) => (
                      <IssueCard key={f.id} finding={f} />
                    ))}
                  </div>
                ) : (
                  <SurfaceCard className="p-6 text-center">
                    <Icon name="check_circle" className="mx-auto text-[32px] text-qbit-success" filled />
                    <p className="mt-2 text-sm font-medium text-qbit-on-surface">No Issues Found</p>
                    <p className="text-xs text-qbit-on-surface-variant">All diagnostic checks passed.</p>
                  </SurfaceCard>
                )}
              </div>

              {/* Timeline */}
              {selectedSession.findings && selectedSession.findings.length > 0 && (
                <SurfaceCard className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Icon name="timeline" className="text-[20px] text-qbit-primary" filled />
                    <h3 className="text-sm font-semibold text-qbit-on-surface">Diagnostic Timeline</h3>
                  </div>
                  <DiagnosticTimeline findings={selectedSession.findings} />
                </SurfaceCard>
              )}
            </div>

            {/* Right (lg:col-span-1) */}
            <div className="space-y-5">
              {/* Recommendations */}
              {selectedSession.recommendations && selectedSession.recommendations.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Icon name="recommend" className="text-[20px] text-qbit-primary" filled />
                    <h3 className="text-sm font-semibold text-qbit-on-surface">
                      Recommendations ({selectedSession.recommendations.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {selectedSession.recommendations.map((r) => (
                      <RecommendationCard key={r.id} recommendation={r} />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Center */}
              <ActionCenter hardwareId={selectedSession.deviceName} />
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
      brand={{ title: "QBIT Hub", tagline: "AI Diagnostics", icon: "smart_toy" }}
      navItems={isAdmin ? NOTIFICATION_NAV : FSM_NAV}
      activeScreen="dr-qbit-diagnostics"
      user={{ name: userName, role: isAdmin ? "Administrator" : "Engineer", initials }}
      topBar={{ searchPlaceholder: "Search diagnostics…", user: { name: userName, role: isAdmin ? "Administrator" : "Engineer", initials } }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            AI Diagnostics Engine
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Analyze detected devices and get smart troubleshooting recommendations. The engine never guesses — only confirmed findings are reported.
          </p>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total Scans" value={stats.total.toString()} icon="analytics" iconBg="bg-qbit-primary/10 text-qbit-primary" />
          <KpiCard label="Excellent" value={stats.excellent.toString()} icon="verified" iconBg="bg-qbit-success/10 text-qbit-success" />
          <KpiCard label="Attention" value={stats.attention.toString()} icon="warning" iconBg="bg-qbit-warning/10 text-qbit-warning" />
          <KpiCard label="Critical" value={stats.critical.toString()} icon="error" iconBg="bg-qbit-error/10 text-qbit-error" />
        </div>

        {/* Run diagnostics section */}
        <SurfaceCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="play_circle" className="text-[20px] text-qbit-primary" filled />
            <h3 className="text-sm font-semibold text-qbit-on-surface">Run New Diagnostic</h3>
          </div>
          <p className="mb-3 text-xs text-qbit-on-surface-variant">
            Select a device passport to analyze. The engine will check driver, firmware, connection, device status, and compatibility — then generate a health score with findings and recommendations.
          </p>

          {loading ? (
            <div className="py-4 text-center">
              <Icon name="progress_activity" className="mx-auto text-[24px] animate-spin text-qbit-primary" />
            </div>
          ) : passports.length === 0 ? (
            <div className="py-4 text-center text-sm text-qbit-on-surface-variant">
              No device passports available. Run a device scan first.
              <QbitButton
                variant="outline"
                size="sm"
                icon="qr_code_scanner"
                className="mt-2"
                onClick={() => navigate("dr-qbit-detection")}
              >
                Go to Device Detection
              </QbitButton>
            </div>
          ) : (
            <div className="space-y-2">
              {passports.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className={
                    "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors " +
                    (selectedPassportId === p.id
                      ? "border-qbit-primary bg-qbit-primary/5"
                      : "border-qbit-outline-variant/50 bg-white")
                  }
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPassportId(p.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                      <Icon name="badge" className="text-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-qbit-on-surface">
                        {p.deviceName ?? p.product?.name ?? "Unknown"}
                      </p>
                      <p className="truncate text-xs text-qbit-on-surface-variant">
                        {p.passportNumber} · {p.model ?? "—"}
                      </p>
                    </div>
                  </button>
                  <QbitButton
                    variant="primary"
                    size="sm"
                    icon={running && selectedPassportId === p.id ? "progress_activity" : "smart_toy"}
                    disabled={running}
                    onClick={() => void handleRunDiagnostics(p.id)}
                  >
                    {running && selectedPassportId === p.id ? "Running…" : "Run"}
                  </QbitButton>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        {/* Diagnostic history */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Icon name="history" className="text-[20px] text-qbit-primary" filled />
            <h3 className="text-sm font-semibold text-qbit-on-surface">Diagnostic History</h3>
          </div>
          {sessions.length === 0 ? (
            <SurfaceCard className="p-6 text-center">
              <Icon name="analytics" className="mx-auto text-[32px] text-qbit-on-surface-variant/40" />
              <p className="mt-2 text-sm text-qbit-on-surface-variant">No diagnostic sessions yet.</p>
              <p className="text-xs text-qbit-on-surface-variant">Run a diagnostic on a device passport to see results here.</p>
            </SurfaceCard>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => void fetchSessionDetail(s.id)}
                  className="group block rounded-xl border border-qbit-outline-variant/50 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " +
                        (s.healthGrade === "excellent" ? "bg-qbit-success/10 text-qbit-success"
                        : s.healthGrade === "good" ? "bg-qbit-primary/10 text-qbit-primary"
                        : s.healthGrade === "attention" ? "bg-qbit-warning/10 text-qbit-warning"
                        : "bg-qbit-error/10 text-qbit-error")
                      }>
                        <Icon name={HEALTH_GRADE_ICONS[s.healthGrade] ?? "help_outline"} className="text-[22px]" filled />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-qbit-on-surface">
                          {s.productName ?? "Unknown device"}
                        </p>
                        <p className="text-xs text-qbit-on-surface-variant">
                          {s.passportNumber ?? "—"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge variant={HEALTH_GRADE_VARIANTS[s.healthGrade]} dot>
                      {s.overallScore}/100
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-qbit-outline-variant/50 pt-2 text-[10px] text-qbit-on-surface-variant">
                    <span>{s.findingsCount} findings</span>
                    <span>·</span>
                    <span>{s.recommendationsCount} recommendations</span>
                    <span>·</span>
                    <span>{new Date(s.startedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
