"use client";

/**
 * DrQbitTestCenterPage — Test Center dashboard.
 *
 * Two views:
 *   1. List view: device passport selection + test history
 *   2. Detail view: health summary + test results + report generator
 *
 * SAFETY: The Test Center NEVER modifies customer data. It only validates
 * hardware functionality. No auto firmware updates. No auto driver installs.
 *
 * Reuses: AppShell, FSM_NAV/NOTIFICATION_NAV, KpiCard, SurfaceCard,
 * all test center components.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  HealthSummaryCard,
  DeviceTestCard,
  ReportGenerator,
} from "@/components/qbit/test-center";
import { FSM_NAV, NOTIFICATION_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import {
  type TestSessionDTO,
  OVERALL_STATUS_VARIANTS,
  OVERALL_STATUS_LABELS,
  CATEGORY_LABELS,
} from "@/lib/test-center/types";
import type { PassportDTO } from "@/lib/passport/types";
import { DEVICE_TYPE_ICONS, DEVICE_TYPE_LABELS } from "@/lib/drqbit/types";

export function DrQbitTestCenterPage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  const [passports, setPassports] = useState<PassportDTO[]>([]);
  const [sessions, setSessions] = useState<TestSessionDTO[]>([]);
  const [selected, setSelected] = useState<TestSessionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedPassportId, setSelectedPassportId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [passRes, sessRes] = await Promise.all([
        fetch("/api/dr-qbit/passports?limit=50", { cache: "no-store" }),
        fetch("/api/dr-qbit/tests?limit=20", { cache: "no-store" }),
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

  const handleRunTests = async (passportId: string) => {
    setRunning(true);
    try {
      const res = await fetch("/api/dr-qbit/tests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passportId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to run tests");
      }
      const result = await res.json();
      toast({
        title: "Tests Complete",
        description: `Score: ${result.overallScore}/100 (${OVERALL_STATUS_LABELS[result.overallStatus as keyof typeof OVERALL_STATUS_LABELS] ?? result.overallStatus}). ${result.passedCount} passed, ${result.failedCount} failed.`,
      });
      await fetchSessionDetail(result.sessionId);
      void fetchData();
    } catch (e) {
      toast({
        title: "Test Failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const fetchSessionDetail = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/dr-qbit/tests/${sessionId}`, { cache: "no-store" });
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
    total: sessions.length,
    passed: sessions.filter((s) => s.overallStatus === "passed").length,
    failed: sessions.filter((s) => s.overallStatus === "failed").length,
    partial: sessions.filter((s) => s.overallStatus === "partial").length,
  }), [sessions]);

  // Group test results by category
  const groupedResults = useMemo(() => {
    if (!selected?.testResults) return {};
    return selected.testResults.reduce((acc, r) => {
      if (!acc[r.testCategory]) acc[r.testCategory] = [];
      acc[r.testCategory].push(r);
      return acc;
    }, {} as Record<string, typeof selected.testResults>);
  }, [selected]);

  // -------- Detail view --------
  if (selected) {
    return (
      <AppShell
        variant={isAdmin ? "admin" : "field"}
        brand={{ title: "QBIT Hub", tagline: "Test Center", icon: "science" }}
        navItems={isAdmin ? NOTIFICATION_NAV : FSM_NAV}
        activeScreen="dr-qbit-test-center"
        user={{ name: userName, role: isAdmin ? "Administrator" : "Engineer", initials }}
        cta={{ label: "Back", icon: "arrow_back", onClick: () => setSelected(null) }}
        topBar={{ searchPlaceholder: "Search…", user: { name: userName, role: isAdmin ? "Administrator" : "Engineer", initials } }}
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon name="science" className="text-[20px] text-qbit-primary" filled />
              <h2 className="text-xl font-bold text-qbit-on-surface">Test Results</h2>
              <span className="font-mono text-xs text-qbit-on-surface-variant">
                {selected.sessionToken.slice(0, 16)}
              </span>
            </div>
            <p className="text-sm text-qbit-on-surface-variant">
              {selected.productName ?? selected.deviceName ?? "Unknown device"} · {selected.model ?? "—"}
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Left (lg:col-span-2) */}
            <div className="space-y-5 lg:col-span-2">
              <HealthSummaryCard
                overallScore={selected.overallScore}
                overallStatus={selected.overallStatus}
                totalTests={selected.totalTests}
                passedCount={selected.passedCount}
                failedCount={selected.failedCount}
                warningCount={selected.warningCount}
                skippedCount={selected.skippedCount}
                notSupportedCount={selected.notSupportedCount}
              />

              {/* Test results grouped by category */}
              {selected.testResults && selected.testResults.length > 0 && (
                <div className="space-y-4">
                  {Object.entries(groupedResults).map(([category, results]) => (
                    <div key={category}>
                      <div className="mb-2 flex items-center gap-2">
                        <Icon name="category" className="text-[16px] text-qbit-primary" />
                        <h3 className="text-sm font-semibold text-qbit-on-surface">
                          {CATEGORY_LABELS[category as never] ?? category}
                        </h3>
                        <TagBadge variant="neutral">{results.length} tests</TagBadge>
                      </div>
                      <div className="space-y-2">
                        {results.map((r) => (
                          <DeviceTestCard key={r.id} result={r} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right (lg:col-span-1) */}
            <div className="space-y-5">
              <ReportGenerator session={selected} />

              {/* Action buttons */}
              <SurfaceCard className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Icon name="bolt" className="text-[20px] text-qbit-primary" filled />
                  <h3 className="text-sm font-semibold text-qbit-on-surface">Actions</h3>
                </div>
                <div className="space-y-2">
                  <QbitButton variant="outline" size="sm" icon="smart_toy" fullWidth onClick={() => navigate("dr-qbit-diagnostics")}>
                    Open AI Diagnostics
                  </QbitButton>
                  <QbitButton variant="outline" size="sm" icon="settings_input_component" fullWidth onClick={() => navigate("driver-download-center")}>
                    Open Driver Center
                  </QbitButton>
                  <QbitButton variant="outline" size="sm" icon="system_update" fullWidth onClick={() => navigate("dr-qbit-firmware")}>
                    Open Firmware Center
                  </QbitButton>
                  <QbitButton variant="outline" size="sm" icon="support_agent" fullWidth onClick={() => navigate("ai-support-center")}>
                    Contact Support
                  </QbitButton>
                </div>
              </SurfaceCard>

              {/* Safety notice */}
              <SurfaceCard className="border-qbit-warning/30 bg-qbit-warning/5 p-4">
                <div className="flex items-start gap-2">
                  <Icon name="shield" className="text-[18px] text-qbit-warning" filled />
                  <div>
                    <p className="text-xs font-semibold text-qbit-on-surface">Test Center Safety</p>
                    <p className="mt-1 text-[10px] text-qbit-on-surface-variant">
                      The Test Center never modifies customer data. It only validates hardware functionality.
                      No automatic firmware updates or driver installations are performed.
                    </p>
                  </div>
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
      brand={{ title: "QBIT Hub", tagline: "Test Center", icon: "science" }}
      navItems={isAdmin ? NOTIFICATION_NAV : FSM_NAV}
      activeScreen="dr-qbit-test-center"
      user={{ name: userName, role: isAdmin ? "Administrator" : "Engineer", initials }}
      topBar={{ searchPlaceholder: "Search tests…", user: { name: userName, role: isAdmin ? "Administrator" : "Engineer", initials } }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            Test Center — Device Validation Suite
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Verify that every connected device is working correctly before completing the job. Tests never modify customer data.
          </p>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total Sessions" value={stats.total.toString()} icon="analytics" iconBg="bg-qbit-primary/10 text-qbit-primary" />
          <KpiCard label="All Passed" value={stats.passed.toString()} icon="check_circle" iconBg="bg-qbit-success/10 text-qbit-success" />
          <KpiCard label="Partial" value={stats.partial.toString()} icon="warning" iconBg="bg-qbit-warning/10 text-qbit-warning" />
          <KpiCard label="Failed" value={stats.failed.toString()} icon="error" iconBg="bg-qbit-error/10 text-qbit-error" />
        </div>

        {/* Run tests section */}
        <SurfaceCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="play_circle" className="text-[20px] text-qbit-primary" filled />
            <h3 className="text-sm font-semibold text-qbit-on-surface">Run New Test Suite</h3>
          </div>
          <p className="mb-3 text-xs text-qbit-on-surface-variant">
            Select a device passport to run the full validation suite. The Test Center will execute all applicable tests
            (printer, scanner, cash drawer, display, USB, network, communication) and generate a health score.
          </p>

          {loading ? (
            <div className="py-4 text-center">
              <Icon name="progress_activity" className="mx-auto text-[24px] animate-spin text-qbit-primary" />
            </div>
          ) : passports.length === 0 ? (
            <div className="py-4 text-center text-sm text-qbit-on-surface-variant">
              No device passports available. Run a device scan first.
              <QbitButton variant="outline" size="sm" icon="qr_code_scanner" className="mt-2" onClick={() => navigate("dr-qbit-detection")}>
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
                    (selectedPassportId === p.id ? "border-qbit-primary bg-qbit-primary/5" : "border-qbit-outline-variant/50 bg-white")
                  }
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPassportId(p.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                      <Icon name={DEVICE_TYPE_ICONS[(p.product?.deviceType ?? "unknown") as never] ?? "badge"} className="text-[18px]" />
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
                    icon={running && selectedPassportId === p.id ? "progress_activity" : "science"}
                    disabled={running}
                    onClick={() => void handleRunTests(p.id)}
                  >
                    {running && selectedPassportId === p.id ? "Running…" : "Run Tests"}
                  </QbitButton>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        {/* Test history */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Icon name="history" className="text-[20px] text-qbit-primary" filled />
            <h3 className="text-sm font-semibold text-qbit-on-surface">Test History</h3>
          </div>
          {sessions.length === 0 ? (
            <SurfaceCard className="p-6 text-center">
              <Icon name="science" className="mx-auto text-[32px] text-qbit-on-surface-variant/40" />
              <p className="mt-2 text-sm text-qbit-on-surface-variant">No test sessions yet.</p>
              <p className="text-xs text-qbit-on-surface-variant">Run a test suite on a device passport to see results here.</p>
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
                        (s.overallStatus === "passed" ? "bg-qbit-success/10 text-qbit-success"
                        : s.overallStatus === "partial" ? "bg-qbit-warning/10 text-qbit-warning"
                        : "bg-qbit-error/10 text-qbit-error")
                      }>
                        <Icon name={DEVICE_TYPE_ICONS[s.deviceType as never] ?? "science"} className="text-[22px]" filled />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-qbit-on-surface">
                          {s.productName ?? s.deviceName ?? "Unknown"}
                        </p>
                        <p className="text-xs text-qbit-on-surface-variant">{s.model ?? "—"}</p>
                      </div>
                    </div>
                    <StatusBadge variant={OVERALL_STATUS_VARIANTS[s.overallStatus]} dot>
                      {s.overallScore}/100
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-qbit-outline-variant/50 pt-2 text-[10px] text-qbit-on-surface-variant">
                    <span className="inline-flex items-center gap-0.5"><Icon name="check_circle" className="text-[10px] text-qbit-success" />{s.passedCount} passed</span>
                    {s.failedCount > 0 && <span className="inline-flex items-center gap-0.5"><Icon name="cancel" className="text-[10px] text-qbit-error" />{s.failedCount} failed</span>}
                    {s.warningCount > 0 && <span className="inline-flex items-center gap-0.5"><Icon name="warning" className="text-[10px] text-qbit-warning" />{s.warningCount} warnings</span>}
                    <span>· {new Date(s.startedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
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
