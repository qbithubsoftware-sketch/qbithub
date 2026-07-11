"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { GlassCard } from "@/components/qbit/primitives/GlassCard";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigation } from "@/lib/navigation/store";
import { INSTALCORE_NAV } from "@/lib/navigation/nav-config";
import { useToast } from "@/hooks/use-toast";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  status: "success" | "warning";
  statusLabel: string;
}

type TestStatus = "pass" | "fail" | "testing";

interface HardwareRow {
  id: string;
  component: string;
  icon: string;
  status: TestStatus;
  /** When status === "fail", this label is appended to the FAIL text. */
  failNote?: string;
  /** Initial static status (used to reset after a retest cycle). */
  initialStatus: TestStatus;
  actionLabel: string;
  actionVariant: "retest" | "troubleshoot";
}

interface QuickLink {
  title: string;
  description: string;
  icon: string;
  screen:
    | "ai-support-center"
    | "installation-center"
    | "system-settings";
}

/* ------------------------------------------------------------------ */
/* Static data (verbatim copy from design)                            */
/* ------------------------------------------------------------------ */

const INITIAL_CHECKLIST: ChecklistItem[] = [
  {
    id: "install",
    label: "Installation Done",
    checked: true,
    status: "success",
    statusLabel: "COMPLETED",
  },
  {
    id: "tests",
    label: "System Tests Passed",
    checked: true,
    status: "success",
    statusLabel: "VERIFIED",
  },
  {
    id: "training",
    label: "Customer Trained & Onboarded",
    checked: false,
    status: "warning",
    statusLabel: "IN PROGRESS",
  },
];

const INITIAL_HARDWARE: HardwareRow[] = [
  {
    id: "printer",
    component: "Thermal Printer",
    icon: "print",
    status: "pass",
    initialStatus: "pass",
    actionLabel: "Retest",
    actionVariant: "retest",
  },
  {
    id: "scanner",
    component: "High-Speed Scanner",
    icon: "qr_code_scanner",
    status: "pass",
    initialStatus: "pass",
    actionLabel: "Retest",
    actionVariant: "retest",
  },
  {
    id: "touch",
    component: "Capacitive Touch Screen",
    icon: "touch_app",
    status: "fail",
    failNote: " (Recalibration Req.)",
    initialStatus: "fail",
    actionLabel: "Troubleshoot",
    actionVariant: "troubleshoot",
  },
];

const QUICK_LINKS: QuickLink[] = [
  {
    title: "Network Connectivity",
    description: "Issues with local DNS or IP lease.",
    icon: "wifi_off",
    screen: "ai-support-center",
  },
  {
    title: "Admin Credentials",
    description: "Resetting the local terminal master key.",
    icon: "key",
    screen: "system-settings",
  },
  {
    title: "Data Sync Delay",
    description: "Forcing a manual cloud handshake.",
    icon: "sync",
    screen: "ai-support-center",
  },
  {
    title: "Level 2 Support",
    description: "Direct escalation for hardware failure.",
    icon: "support_agent",
    screen: "ai-support-center",
  },
];

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon,
  iconTint,
  title,
}: {
  icon: string;
  iconTint: "primary" | "secondary" | "tertiary";
  title: string;
}) {
  const tintClass =
    iconTint === "primary"
      ? "bg-qbit-primary/10 text-qbit-primary"
      : iconTint === "secondary"
        ? "bg-qbit-secondary/10 text-qbit-secondary"
        : "bg-qbit-tertiary/10 text-qbit-tertiary";
  return (
    <div className="mb-6 flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${tintClass}`}
      >
        <Icon name={icon} className="text-[22px]" />
      </div>
      <h3 className="text-[20px] font-semibold leading-7 text-qbit-on-surface">
        {title}
      </h3>
    </div>
  );
}

function DiagnosticStatus({ status }: { status: TestStatus }) {
  if (status === "testing") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-qbit-on-surface-variant">
        <Icon
          name="progress_activity"
          className="animate-spin text-[16px] text-qbit-primary"
        />
        TESTING...
      </div>
    );
  }
  if (status === "pass") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
        <Icon name="check_circle" className="text-[16px]" filled />
        PASS
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-qbit-error">
      <Icon name="cancel" className="text-[16px]" filled />
      FAIL (Recalibration Req.)
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function CustomerHandoverReportPage() {
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [hardware, setHardware] = useState<HardwareRow[]>(INITIAL_HARDWARE);

  // Toast: 2-second mount delay.
  useEffect(() => {
    const t = window.setTimeout(() => {
      toast({
        title: "Action Required",
        description:
          "Customer signature pending to finalize handover for INST-442-B.",
      });
    }, 2000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const toggleChecklist = (id: string) => {
    setChecklist((items) =>
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const handleRetest = (rowId: string) => {
    const target = hardware.find((row) => row.id === rowId);
    if (!target) return;
    // Only retestable rows respond (Retest button = pass rows that we cycle).
    if (target.actionVariant !== "retest") return;

    setHardware((rows) =>
      rows.map((row) =>
        row.id === rowId ? { ...row, status: "testing" } : row,
      ),
    );

    window.setTimeout(() => {
      setHardware((rows) =>
        rows.map((row) =>
          row.id === rowId ? { ...row, status: "pass" } : row,
        ),
      );
    }, 1200);
  };

  return (
    <AppShell
      variant="instalcore"
      brand={{ title: "InstalCore", tagline: "Enterprise Portal", icon: "hub" }}
      navItems={INSTALCORE_NAV}
      activeScreen="customer-handover-report"
      user={{
        name: "Alex Rivera",
        role: "Lead Engineer",
        initials: "AR",
      }}
      topBar={{
        searchPlaceholder: "Search installation reports...",
        user: {
          name: "Alex Rivera",
          role: "Lead Engineer",
          initials: "AR",
        },
        rightText: "Project: IC-9842",
      }}
    >
      <div className="space-y-10 pb-12">
        {/* ============================================================ */}
        {/* Page Header                                                  */}
        {/* ============================================================ */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs text-qbit-outline"
            >
              <span className="font-medium uppercase tracking-wider">
                Reports
              </span>
              <Icon name="chevron_right" className="text-[14px]" />
              <span className="font-medium uppercase tracking-wider text-qbit-primary">
                Handover
              </span>
            </nav>
            <h2 className="text-[30px] font-semibold leading-[38px] tracking-[-0.01em] text-qbit-on-surface">
              Customer Handover &amp; Completion Report
            </h2>
            <p className="text-base text-qbit-on-surface-variant">
              Final validation and sign-off for Installation ID:{" "}
              <span className="font-bold text-qbit-on-surface">INST-442-B</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <QbitButton
              variant="outline"
              size="md"
              icon="print"
              onClick={() => window.print()}
            >
              Print Installation Report
            </QbitButton>
            <QbitButton
              variant="primary"
              size="md"
              icon="download"
              className="shadow-lg shadow-qbit-primary/20 hover:scale-[1.02]"
            >
              Download Handover PDF
            </QbitButton>
          </div>
        </header>

        {/* ============================================================ */}
        {/* Bento Grid (12-col, 7/5 split)                              */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ---------- Left column (col-span-7) ---------- */}
          <div className="space-y-6 lg:col-span-7">
            {/* Completion Checklist */}
            <GlassCard className="p-6">
              <SectionHeader icon="checklist" iconTint="primary" title="Completion Checklist" />
              <div className="space-y-4">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    htmlFor={`chk-${item.id}`}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-qbit-outline-variant p-4 transition-colors hover:bg-qbit-surface-container-lowest"
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id={`chk-${item.id}`}
                        checked={item.checked}
                        onCheckedChange={() => toggleChecklist(item.id)}
                        className="h-5 w-5 rounded border-qbit-outline-variant data-[state=checked]:bg-qbit-primary data-[state=checked]:border-qbit-primary data-[state=checked]:text-qbit-on-primary"
                      />
                      <span className="text-base text-qbit-on-surface">
                        {item.label}
                      </span>
                    </div>
                    <StatusBadge variant={item.status}>
                      {item.statusLabel}
                    </StatusBadge>
                  </label>
                ))}
              </div>
            </GlassCard>

            {/* Testing Procedure */}
            <GlassCard className="p-6">
              <SectionHeader icon="biotech" iconTint="secondary" title="Testing Procedure" />
              <div className="overflow-hidden rounded-lg border border-qbit-outline-variant">
                <table className="w-full text-left">
                  <thead className="border-b border-qbit-outline-variant bg-qbit-surface-container-low">
                    <tr>
                      <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.05em] text-qbit-outline">
                        Hardware Component
                      </th>
                      <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.05em] text-qbit-outline">
                        Diagnostic Status
                      </th>
                      <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.05em] text-qbit-outline">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-qbit-outline-variant">
                    {hardware.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-qbit-surface-container-lowest"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Icon
                              name={row.icon}
                              className="text-[20px] text-qbit-outline"
                            />
                            <span className="text-base text-qbit-on-surface">
                              {row.component}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <DiagnosticStatus status={row.status} />
                        </td>
                        <td className="px-6 py-4">
                          {row.actionVariant === "retest" ? (
                            <button
                              type="button"
                              onClick={() => handleRetest(row.id)}
                              disabled={row.status === "testing"}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-qbit-primary transition-opacity hover:underline disabled:opacity-60"
                            >
                              {row.status === "testing" ? (
                                <>
                                  <Icon
                                    name="progress_activity"
                                    className="animate-spin text-[16px]"
                                  />
                                  Testing...
                                </>
                              ) : (
                                "Retest"
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate("ai-support-center")}
                              className="text-sm font-semibold text-qbit-primary hover:underline"
                            >
                              Troubleshoot
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          {/* ---------- Right column (col-span-5) ---------- */}
          <div className="space-y-6 lg:col-span-5">
            {/* Summary card */}
            <div className="relative overflow-hidden rounded-xl bg-qbit-primary p-6 text-qbit-on-primary shadow-xl">
              <div className="relative z-10">
                <h4 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.18em] opacity-80">
                  Handover Status
                </h4>
                <p className="text-[24px] font-bold leading-8">
                  Awaiting Signatures
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Icon name="schedule" className="text-[16px]" />
                  <span className="text-sm">Today, Oct 24 • 14:32 PM</span>
                </div>
              </div>
              {/* Decorative blurs */}
              <div
                aria-hidden="true"
                className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-qbit-primary-container/20 blur-2xl"
              />
            </div>

            {/* Digital Signatures */}
            <GlassCard className="p-6">
              <SectionHeader icon="draw" iconTint="tertiary" title="Digital Signatures" />
              <div className="space-y-8">
                {/* Field Engineer — signed */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-qbit-on-surface-variant">
                    Field Engineer: Alex Rivera
                  </label>
                  <div className="group relative flex h-32 items-center justify-center rounded-lg border border-dashed border-qbit-outline-variant bg-white">
                    {/* Stylized handwritten signature */}
                    <span
                      className="select-none text-[34px] font-semibold italic text-qbit-primary opacity-80"
                      style={{
                        fontFamily:
                          "var(--font-inter), 'Brush Script MT', cursive",
                        transform: "rotate(-3deg)",
                      }}
                      aria-label="Signed by Alex Rivera"
                    >
                      Alex Rivera
                    </span>
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-md bg-qbit-surface-container p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Edit signature"
                    >
                      <Icon name="edit" className="text-[16px] text-qbit-on-surface-variant" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-qbit-outline">
                      <Icon
                        name="verified"
                        className="text-[16px] text-emerald-600"
                        filled
                      />
                      <span>E-Signed: 2023-10-24 14:15 UTC</span>
                    </div>
                    <span className="text-xs text-qbit-outline">
                      ID: FR-9921-X
                    </span>
                  </div>
                </div>

                {/* Customer — unsigned */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-qbit-on-surface-variant">
                    Customer: James Wilson (Operations Dir.)
                  </label>
                  <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-qbit-outline-variant bg-qbit-surface-container-lowest">
                    <Icon
                      name="gesture"
                      className="mb-2 text-[32px] text-qbit-outline"
                    />
                    <p className="text-sm text-qbit-outline">
                      Click here to sign on screen
                    </p>
                  </div>
                  <div className="mt-4">
                    <QbitButton
                      variant="surface"
                      size="md"
                      icon="send"
                      fullWidth
                      className="bg-qbit-secondary text-qbit-on-secondary hover:bg-qbit-secondary/90"
                    >
                      Email Report to Customer
                    </QbitButton>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Troubleshooting Quick Links                                  */}
        {/* ============================================================ */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <h3 className="text-[20px] font-semibold leading-7 text-qbit-on-surface">
              Troubleshooting Quick Links
            </h3>
            <div className="h-px flex-1 bg-qbit-outline-variant" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.title}
                type="button"
                onClick={() => navigate(link.screen)}
                className="group flex items-start gap-4 rounded-xl border border-qbit-outline-variant/60 bg-white/70 p-4 text-left backdrop-blur-md transition-all hover:-translate-y-1 hover:border-qbit-primary hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-surface-container-highest text-qbit-on-surface-variant transition-colors group-hover:bg-qbit-primary/10 group-hover:text-qbit-primary">
                  <Icon name={link.icon} className="text-[22px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-qbit-on-surface">
                    {link.title}
                  </p>
                  <p className="mt-1 text-xs text-qbit-outline">
                    {link.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* Footer                                                       */}
        {/* ============================================================ */}
        <footer className="mt-auto border-t border-qbit-outline-variant bg-qbit-surface-container-low p-6 md:p-8">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-sm font-semibold text-qbit-primary">
                InstalCore Hub
              </p>
              <p className="text-xs text-qbit-on-surface-variant">
                Customer Handover &amp; Completion Report — INST-442-B
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <a
                href="#"
                className="text-xs text-qbit-on-surface-variant transition-colors hover:text-qbit-primary"
              >
                Documentation Policy
              </a>
              <a
                href="#"
                className="text-xs text-qbit-on-surface-variant transition-colors hover:text-qbit-primary"
              >
                Support Portal
              </a>
              <a
                href="#"
                className="text-xs text-qbit-on-surface-variant transition-colors hover:text-qbit-primary"
              >
                Security Standards
              </a>
            </div>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
