"use client";

/**
 * AIDiagnosticCenterPage — Enterprise AI Diagnostic Center
 *
 * Monitors, diagnoses, and safely repairs the existing QBIT platform.
 * Only uses modules that already exist. No mock data.
 *
 * Scan Types: Quick, Full, Hardware, Driver/Firmware, Resource,
 *            Upload/Download, Database
 *
 * Features:
 *   - Real-time health dashboard
 *   - Module-level status cards
 *   - Issue list with root cause & suggested fix
 *   - Safe auto-repair (admin approval required)
 *   - Scan progress indicator
 *   - Repair history log
 */

import { useState, useCallback } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";

// ====================== Types ======================

type Severity = "low" | "medium" | "high" | "critical";
type ScanType = "quick" | "full" | "hardware" | "driver" | "resource" | "upload-download" | "database";

interface DiagnosticIssue {
  id: string;
  module: string;
  issue: string;
  severity: Severity;
  rootCause: string;
  affectedItem: string;
  suggestedFix: string;
  autoFixable: boolean;
  autoFixAction?: string;
  metadata?: Record<string, unknown>;
}

interface ModuleStatus {
  name: string;
  healthy: boolean;
  issues: number;
  criticalIssues: number;
  checks: number;
  lastChecked: string;
}

interface ScanResult {
  scanType: ScanType;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  overallHealthy: boolean;
  totalIssues: number;
  criticalIssues: number;
  warnings: number;
  modules: ModuleStatus[];
  issues: DiagnosticIssue[];
  stats: Record<string, unknown>;
}

interface RepairLog {
  id: string;
  action: string;
  description: string;
  success: boolean;
  timestamp: string;
}

// ====================== Constants ======================

const SCAN_TYPES: Array<{
  type: ScanType;
  label: string;
  icon: string;
  description: string;
  color: string;
}> = [
  { type: "quick", label: "Quick Scan", icon: "flash_on", description: "Fast check of Products, Resources & Storage", color: "bg-blue-50 text-blue-600" },
  { type: "full", label: "Full System Scan", icon: "health_and_safety", description: "Complete scan of all modules", color: "bg-green-50 text-green-600" },
  { type: "hardware", label: "Hardware Scan", icon: "devices", description: "Device registry & driver availability", color: "bg-purple-50 text-purple-600" },
  { type: "driver", label: "Driver & Firmware", icon: "memory", description: "Driver versions, firmware, SDK checks", color: "bg-amber-50 text-amber-600" },
  { type: "resource", label: "Resource Library", icon: "library_books", description: "Resources, media & file integrity", color: "bg-cyan-50 text-cyan-600" },
  { type: "upload-download", label: "Upload / Download", icon: "swap_vert", description: "Upload pipeline & download service", color: "bg-orange-50 text-orange-600" },
  { type: "database", label: "Database Scan", icon: "database", description: "DB connectivity, orphan records, integrity", color: "bg-red-50 text-red-600" },
];

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; icon: string; bg: string }> = {
  critical: { label: "Critical", color: "text-red-700", icon: "error", bg: "bg-red-50 border-red-200" },
  high: { label: "High", color: "text-orange-700", icon: "warning", bg: "bg-orange-50 border-orange-200" },
  medium: { label: "Medium", color: "text-amber-700", icon: "info", bg: "bg-amber-50 border-amber-200" },
  low: { label: "Low", color: "text-blue-700", icon: "info", bg: "bg-blue-50 border-blue-200" },
};

const MODULE_ICONS: Record<string, string> = {
  "Product Management": "inventory_2",
  "Global Resources": "library_books",
  "Storage": "cloud_upload",
  "Database": "database",
  "Upload / Download": "swap_vert",
  "API & Auth": "api",
  "Hardware Diagnostic": "devices",
  "Drivers & Firmware": "memory",
  "Product Images": "image",
};

// ====================== Component ======================

export function AIDiagnosticCenterPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [repairing, setRepairing] = useState<string | null>(null);
  const [repairLogs, setRepairLogs] = useState<RepairLog[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "issues" | "repair" | "hardware">("dashboard");

  // Run a diagnostic scan
  const runScan = useCallback(async (type: ScanType) => {
    setScanning(true);
    setScanProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const res = await fetch(`/api/admin/diagnostics?scan=${type}`);
      if (!res.ok) throw new Error("Scan failed");
      const data: ScanResult = await res.json();
      setScanResult(data);
      setScanProgress(100);
    } catch (err) {
      console.error("Diagnostic scan error:", err);
    } finally {
      clearInterval(progressInterval);
      setScanning(false);
    }
  }, []);

  // Execute auto-repair
  const executeRepair = useCallback(async (action: string, issueId: string) => {
    setRepairing(issueId);
    try {
      const res = await fetch("/api/admin/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setRepairLogs(prev => [
          {
            id: `repair_${Date.now()}`,
            action,
            description: data.repaired?.map((r: { description: string }) => r.description).join("; ") || action,
            success: true,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
        // Re-run scan to refresh
        if (scanResult) await runScan(scanResult.scanType);
      }
    } catch (err) {
      setRepairLogs(prev => [
        {
          id: `repair_${Date.now()}`,
          action,
          description: `Repair failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          success: false,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setRepairing(null);
    }
  }, [scanResult, runScan]);

  // Health score
  const healthScore = scanResult
    ? scanResult.overallHealthy
      ? 100
      : Math.max(0, 100 - (scanResult.criticalIssues * 25) - (scanResult.warnings * 5))
    : null;

  const healthColor = healthScore === null ? "text-qbit-on-surface-variant"
    : healthScore >= 80 ? "text-green-600"
    : healthScore >= 50 ? "text-amber-600"
    : "text-red-600";

  const healthBg = healthScore === null ? "bg-qbit-surface-container-low"
    : healthScore >= 80 ? "bg-green-50"
    : healthScore >= 50 ? "bg-amber-50"
    : "bg-red-50";

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Control Center", icon: "bolt" }}
      navItems={ADMIN_NAV}
      activeScreen="ai-diagnostic-center"
      user={{ name: "Admin User", role: "Super Administrator", initials: "AU" }}
      topBar={{
        searchPlaceholder: "Search diagnostics...",
        user: { name: "Admin User", role: "Super Administrator", initials: "AU" },
      }}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-qbit-primary to-qbit-secondary">
                <Icon name="psychology" className="text-[24px] text-white" filled />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
                  AI Diagnostic Center
                </h1>
                <p className="text-sm text-qbit-on-surface-variant">
                  Monitor, diagnose, and safely repair your QBIT platform
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {scanResult && (
              <span className="text-xs text-qbit-on-surface-variant">
                Last scan: {new Date(scanResult.completedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Scan Type Cards */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-qbit-on-surface-variant">
            Run Diagnostic Scan
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {SCAN_TYPES.map(st => (
              <button
                key={st.type}
                onClick={() => runScan(st.type)}
                disabled={scanning}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-qbit-outline-variant/50 bg-white p-4 text-center transition-all hover:border-qbit-primary/40 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${st.color}`}>
                  <Icon name={st.icon} className="text-[22px]" />
                </div>
                <span className="text-xs font-semibold text-qbit-on-surface group-hover:text-qbit-primary">
                  {st.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Scan Progress */}
        {scanning && (
          <SurfaceCard className="overflow-hidden p-0">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined animate-spin text-[24px] text-qbit-primary">progress_activity</span>
                <div>
                  <p className="text-sm font-semibold text-qbit-on-surface">Scanning in progress…</p>
                  <p className="text-xs text-qbit-on-surface-variant">Analyzing modules and checking system health</p>
                </div>
              </div>
            </div>
            <div className="h-2 bg-qbit-surface-container-low">
              <div
                className="h-full bg-gradient-to-r from-qbit-primary to-qbit-secondary transition-all duration-500"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </SurfaceCard>
        )}

        {/* No scan yet */}
        {!scanResult && !scanning && (
          <SurfaceCard className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-qbit-primary/10 mb-4">
              <Icon name="health_and_safety" className="text-[40px] text-qbit-primary" filled />
            </div>
            <h3 className="text-lg font-bold text-qbit-on-surface">No Diagnostic Scan Run Yet</h3>
            <p className="mt-2 max-w-md text-center text-sm text-qbit-on-surface-variant">
              Select a scan type above to analyze your QBIT platform. Start with a Quick Scan
              for an overview, or run a Full System Scan for comprehensive diagnostics.
            </p>
          </SurfaceCard>
        )}

        {/* Results */}
        {scanResult && !scanning && (
          <>
            {/* Health Score + KPI Cards */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <SurfaceCard className={`flex flex-col items-center justify-center p-6 ${healthBg}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant mb-2">
                  Overall Health
                </p>
                <span className={`text-5xl font-bold ${healthColor}`}>
                  {healthScore !== null ? `${Math.round(healthScore)}%` : "—"}
                </span>
                <p className="mt-2 text-xs text-qbit-on-surface-variant">
                  {scanResult.overallHealthy ? "All systems operational" : `${scanResult.criticalIssues} critical issue(s) found`}
                </p>
              </SurfaceCard>
              <KpiCard
                label="Total Issues"
                value={String(scanResult.totalIssues)}
                icon="report_problem"
                iconBg={scanResult.totalIssues > 0 ? "bg-red-50" : "bg-green-50"}
              />
              <KpiCard
                label="Critical"
                value={String(scanResult.criticalIssues)}
                icon="error"
                iconBg="bg-red-50"
              />
              <KpiCard
                label="Warnings"
                value={String(scanResult.warnings)}
                icon="warning"
                iconBg="bg-amber-50"
              />
              <KpiCard
                label="Scan Time"
                value={`${(scanResult.durationMs / 1000).toFixed(1)}s`}
                icon="schedule"
                iconBg="bg-blue-50"
              />
            </section>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-qbit-outline-variant">
              {[
                { key: "dashboard" as const, label: "Module Status", icon: "dashboard" },
                { key: "issues" as const, label: "Issues & Root Cause", icon: "troubleshoot" },
                { key: "repair" as const, label: "Auto Repair", icon: "build_circle" },
                { key: "hardware" as const, label: "Hardware & Drivers", icon: "devices" },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    activeTab === tab.key
                      ? "border-qbit-primary text-qbit-primary"
                      : "border-transparent text-qbit-on-surface-variant hover:text-qbit-on-surface"
                  }`}
                >
                  <Icon name={tab.icon} className="text-[18px]" />
                  {tab.label}
                  {tab.key === "issues" && scanResult.totalIssues > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      {scanResult.totalIssues}
                    </span>
                  )}
                  {tab.key === "repair" && scanResult.issues.filter(i => i.autoFixable).length > 0 && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      {scanResult.issues.filter(i => i.autoFixable).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: Module Status Dashboard */}
            {activeTab === "dashboard" && (
              <section>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {scanResult.modules.map(mod => (
                    <SurfaceCard key={mod.name} className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          mod.healthy ? "bg-green-50" : "bg-red-50"
                        }`}>
                          <Icon
                            name={MODULE_ICONS[mod.name] || "inventory_2"}
                            className={`text-[22px] ${mod.healthy ? "text-green-600" : "text-red-600"}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-qbit-on-surface truncate">{mod.name}</h3>
                            <StatusBadge variant={mod.healthy ? "success" : "error"} dot>
                              {mod.healthy ? "Healthy" : "Issues"}
                            </StatusBadge>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg bg-qbit-surface-container-low px-2 py-1">
                              <p className="text-[10px] text-qbit-on-surface-variant">Checks</p>
                              <p className="text-sm font-bold text-qbit-on-surface">{mod.checks}</p>
                            </div>
                            <div className="rounded-lg bg-qbit-surface-container-low px-2 py-1">
                              <p className="text-[10px] text-qbit-on-surface-variant">Issues</p>
                              <p className={`text-sm font-bold ${mod.issues > 0 ? "text-amber-600" : "text-green-600"}`}>
                                {mod.issues}
                              </p>
                            </div>
                            <div className="rounded-lg bg-qbit-surface-container-low px-2 py-1">
                              <p className="text-[10px] text-qbit-on-surface-variant">Critical</p>
                              <p className={`text-sm font-bold ${mod.criticalIssues > 0 ? "text-red-600" : "text-green-600"}`}>
                                {mod.criticalIssues}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SurfaceCard>
                  ))}
                </div>

                {/* Platform Stats */}
                <SurfaceCard className="mt-4 p-5">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-qbit-on-surface-variant">
                    Platform Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                    {[
                      { label: "Products", value: String(scanResult.stats.productCount ?? "—"), icon: "inventory_2" },
                      { label: "Resources", value: String(scanResult.stats.resourceCount ?? "—"), icon: "library_books" },
                      { label: "Users", value: String(scanResult.stats.userCount ?? "—"), icon: "group" },
                      { label: "Mappings", value: String(scanResult.stats.mappingCount ?? "—"), icon: "link" },
                      { label: "Storage", value: String(scanResult.stats.storageProvider ?? "—"), icon: "cloud" },
                      { label: "Auth", value: String(scanResult.stats.storageAuthMethod ?? "—"), icon: "lock" },
                    ].map(stat => (
                      <div key={stat.label} className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant/50 px-3 py-2">
                        <Icon name={stat.icon} className="text-[18px] text-qbit-primary" />
                        <div>
                          <p className="text-[10px] text-qbit-on-surface-variant">{stat.label}</p>
                          <p className="text-xs font-bold text-qbit-on-surface">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              </section>
            )}

            {/* Tab: Issues & Root Cause */}
            {activeTab === "issues" && (
              <section className="space-y-3">
                {scanResult.issues.length === 0 ? (
                  <SurfaceCard className="flex flex-col items-center py-12">
                    <Icon name="check_circle" className="text-[48px] text-green-500" filled />
                    <p className="mt-3 text-sm font-semibold text-green-700">No issues found!</p>
                    <p className="text-xs text-qbit-on-surface-variant">All checked modules are healthy.</p>
                  </SurfaceCard>
                ) : (
                  scanResult.issues.map(issue => {
                    const sev = SEVERITY_CONFIG[issue.severity];
                    return (
                      <SurfaceCard key={issue.id} className={`overflow-hidden border ${sev.bg}`}>
                        <div className="p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <StatusBadge
                                  variant={issue.severity === "critical" ? "error" : issue.severity === "high" ? "warning" : "info"}
                                  dot
                                >
                                  {sev.label}
                                </StatusBadge>
                                <span className="rounded-md bg-qbit-primary/10 px-2 py-0.5 text-[10px] font-semibold text-qbit-primary">
                                  {issue.module}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-qbit-on-surface">{issue.issue}</h4>
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-qbit-on-surface-variant">
                                  <span className="font-semibold">Root Cause:</span> {issue.rootCause}
                                </p>
                                <p className="text-xs text-qbit-on-surface-variant">
                                  <span className="font-semibold">Affected:</span> {issue.affectedItem}
                                </p>
                                <p className="text-xs text-qbit-on-surface-variant">
                                  <span className="font-semibold">Fix:</span> {issue.suggestedFix}
                                </p>
                              </div>
                            </div>
                            {issue.autoFixable && (
                              <QbitButton
                                variant="primary"
                                icon="build_circle"
                                size="sm"
                                onClick={() => executeRepair(issue.autoFixAction!, issue.id)}
                                disabled={repairing !== null}
                              >
                                {repairing === issue.id ? "Repairing…" : "Auto Fix"}
                              </QbitButton>
                            )}
                          </div>
                        </div>
                      </SurfaceCard>
                    );
                  })
                )}
              </section>
            )}

            {/* Tab: Auto Repair */}
            {activeTab === "repair" && (
              <section className="space-y-4">
                {/* Auto-fixable issues */}
                <SurfaceCard className="p-5">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-qbit-on-surface-variant">
                    Auto-Fixable Issues
                  </h3>
                  {scanResult.issues.filter(i => i.autoFixable).length === 0 ? (
                    <div className="flex flex-col items-center py-8">
                      <Icon name="check_circle" className="text-[36px] text-green-500" filled />
                      <p className="mt-2 text-sm text-qbit-on-surface-variant">
                        No auto-fixable issues available. All detected issues require manual resolution.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scanResult.issues.filter(i => i.autoFixable).map(issue => (
                        <div
                          key={issue.id}
                          className="flex flex-col gap-2 rounded-xl border border-green-200 bg-green-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-qbit-on-surface">{issue.issue}</p>
                            <p className="text-xs text-qbit-on-surface-variant">{issue.rootCause}</p>
                          </div>
                          <QbitButton
                            variant="primary"
                            icon="build_circle"
                            size="sm"
                            onClick={() => executeRepair(issue.autoFixAction!, issue.id)}
                            disabled={repairing !== null}
                          >
                            {repairing === issue.id ? "Repairing…" : "Fix Now"}
                          </QbitButton>
                        </div>
                      ))}
                    </div>
                  )}
                </SurfaceCard>

                {/* Repair History */}
                <SurfaceCard className="p-5">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-qbit-on-surface-variant">
                    Repair History
                  </h3>
                  {repairLogs.length === 0 ? (
                    <p className="text-sm text-qbit-on-surface-variant">No repairs executed yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {repairLogs.map(log => (
                        <div
                          key={log.id}
                          className={`flex items-center gap-3 rounded-lg border p-3 ${
                            log.success
                              ? "border-green-200 bg-green-50/50"
                              : "border-red-200 bg-red-50/50"
                          }`}
                        >
                          <Icon
                            name={log.success ? "check_circle" : "error"}
                            className={`text-[20px] ${log.success ? "text-green-600" : "text-red-600"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-qbit-on-surface">{log.action}</p>
                            <p className="text-[11px] text-qbit-on-surface-variant">{log.description}</p>
                          </div>
                          <span className="text-[10px] text-qbit-on-surface-variant shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </SurfaceCard>
              </section>
            )}

            {/* Tab: Hardware & Drivers */}
            {activeTab === "hardware" && (
              <section className="space-y-4">
                <SurfaceCard className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                      <Icon name="devices" className="text-[22px] text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-qbit-on-surface">Hardware Diagnostic</h3>
                      <p className="text-xs text-qbit-on-surface-variant">
                        Device registry, driver availability, and firmware verification
                      </p>
                    </div>
                  </div>

                  {/* Hardware-related issues */}
                  {scanResult.issues.filter(i =>
                    i.module === "Hardware Diagnostic" || i.module === "Drivers & Firmware"
                  ).length === 0 ? (
                    <div className="flex flex-col items-center py-8">
                      <Icon name="verified" className="text-[40px] text-green-500" filled />
                      <p className="mt-2 text-sm font-semibold text-green-700">All hardware modules healthy</p>
                      <p className="text-xs text-qbit-on-surface-variant">
                        No device registration, driver, or firmware issues detected.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scanResult.issues
                        .filter(i => i.module === "Hardware Diagnostic" || i.module === "Drivers & Firmware")
                        .map(issue => {
                          const sev = SEVERITY_CONFIG[issue.severity];
                          return (
                            <div key={issue.id} className={`rounded-xl border p-3 ${sev.bg}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <StatusBadge
                                  variant={issue.severity === "high" || issue.severity === "critical" ? "error" : "warning"}
                                  dot
                                >
                                  {sev.label}
                                </StatusBadge>
                                <span className="text-xs font-medium text-qbit-on-surface-variant">{issue.module}</span>
                              </div>
                              <p className="text-sm font-semibold text-qbit-on-surface">{issue.issue}</p>
                              <p className="mt-1 text-xs text-qbit-on-surface-variant">{issue.rootCause}</p>
                              <p className="text-xs text-qbit-on-surface-variant">
                                <span className="font-semibold">Fix:</span> {issue.suggestedFix}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </SurfaceCard>

                {/* Driver/Firmware/SDK Status */}
                <SurfaceCard className="p-5">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-qbit-on-surface-variant">
                    Driver & Firmware Verification
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {scanResult.modules
                      .filter(m => m.name === "Hardware Diagnostic" || m.name === "Drivers & Firmware")
                      .map(mod => (
                        <div key={mod.name} className="rounded-xl border border-qbit-outline-variant/50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon
                              name={MODULE_ICONS[mod.name] || "memory"}
                              className={`text-[20px] ${mod.healthy ? "text-green-600" : "text-red-600"}`}
                            />
                            <span className="text-sm font-bold text-qbit-on-surface">{mod.name}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-qbit-on-surface-variant">Status</span>
                              <span className={mod.healthy ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                {mod.healthy ? "Healthy" : "Issues Found"}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-qbit-on-surface-variant">Issues</span>
                              <span className="font-semibold text-qbit-on-surface">{mod.issues}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-qbit-on-surface-variant">Critical</span>
                              <span className={`font-semibold ${mod.criticalIssues > 0 ? "text-red-600" : "text-green-600"}`}>
                                {mod.criticalIssues}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </SurfaceCard>

                {/* Hardware scan prompt */}
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-purple-300 bg-purple-50/30 p-4">
                  <Icon name="info" className="text-[20px] text-purple-600" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-purple-800">USB Device Detection</p>
                    <p className="text-[11px] text-purple-600">
                      Real USB device detection requires the Dr. QBIT desktop agent running on the connected machine.
                      This diagnostic checks the device registry database for data integrity issues.
                    </p>
                  </div>
                  <QbitButton
                    variant="outline"
                    icon="devices"
                    size="sm"
                    onClick={() => runScan("hardware")}
                    disabled={scanning}
                  >
                    Scan Hardware
                  </QbitButton>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
