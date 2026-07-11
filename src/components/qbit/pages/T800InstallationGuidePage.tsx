"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { GlassCard, SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { TimelineStep } from "@/components/qbit/primitives/TimelineStep";
import { ProgressTracker } from "@/components/qbit/primitives/ProgressTracker";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/lib/navigation/store";
import { INSTALCORE_NAV } from "@/lib/navigation/nav-config";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Step2ButtonState = "idle" | "processing" | "completed";

interface Tool {
  label: string;
  icon: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  defaultChecked?: boolean;
}

interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
}

/* ------------------------------------------------------------------ */
/* Static content                                                     */
/* ------------------------------------------------------------------ */

const TOOLS: readonly Tool[] = [
  { label: "Power Adapter (In Box)", icon: "power" },
  { label: "Cat6 LAN Cable", icon: "lan" },
  { label: "Philips #2 Screwdriver", icon: "build" },
];

const CHECKLIST_GROUPS: readonly ChecklistGroup[] = [
  {
    id: "safety",
    title: "Safety Verification",
    items: [
      { id: "s1", label: "Surface is flat and stable" },
      { id: "s2", label: "Power outlet is grounded (surge protected)" },
    ],
  },
  {
    id: "hardware",
    title: "Hardware Checks",
    items: [
      { id: "h1", label: "Base plate screws tightened", defaultChecked: true },
      { id: "h2", label: "Screen tilt mechanism verified" },
      { id: "h3", label: "I/O cover plate seated correctly" },
    ],
  },
];

const USER = {
  name: "E. Richardson",
  role: "Lead Field Engineer",
  initials: "ER",
} as const;

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export function T800InstallationGuidePage() {
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();
  const [step2State, setStep2State] = useState<Step2ButtonState>("idle");
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of CHECKLIST_GROUPS) {
      for (const item of group.items) {
        initial[item.id] = item.defaultChecked ?? false;
      }
    }
    return initial;
  });

  // Auto-show "Progress Saved" toast 1.5s after page mount.
  useEffect(() => {
    const timer = setTimeout(() => {
      toast({
        title: "Progress Saved",
        description: "Installation state uploaded to cloud.",
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleMarkComplete = () => {
    if (step2State !== "idle") return;
    setStep2State("processing");
    setTimeout(() => {
      setStep2State("completed");
      toast({
        title: "Step Completed",
        description: "Power Connection verified and saved to cloud.",
      });
    }, 1500);
  };

  const toggleItem = (itemId: string) => {
    setCheckedIds((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleExportLog = () => {
    toast({
      title: "Certification Log Exported",
      description: "PDF report has been generated successfully.",
    });
  };

  const step2Label =
    step2State === "idle"
      ? "Mark as Complete"
      : step2State === "processing"
        ? "Processing..."
        : "Step Completed";

  return (
    <AppShell
      variant="instalcore"
      brand={{ title: "InstalCore", tagline: "Enterprise Portal", icon: "hub" }}
      navItems={INSTALCORE_NAV}
      activeScreen="t800-installation-guide"
      user={USER}
      topBar={{
        searchPlaceholder: "Search documentation...",
        user: USER,
        rightText: "QBIT T-800 Series",
        rightTextIcon: "verified",
      }}
    >
      <div className="space-y-8 pb-12">
        {/* ========================================================= */}
        {/* Header                                                    */}
        {/* ========================================================= */}
        <section className="space-y-4">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-qbit-outline"
          >
            <span>Products</span>
            <Icon name="chevron_right" className="text-[14px]" />
            <span>POS Systems</span>
            <Icon name="chevron_right" className="text-[14px]" />
            <span className="font-bold text-qbit-primary">
              QBIT T-800 Installation
            </span>
          </nav>

          {/* Title row */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-qbit-on-surface md:text-3xl">
                Step-by-Step Installation Guide
              </h2>
              <p className="max-w-2xl text-sm text-qbit-on-surface-variant md:text-base">
                Complete hardware setup and software provisioning for the QBIT
                T-800 Windows Point of Sale workstation.
              </p>
            </div>
            <div className="shrink-0 text-left md:text-right">
              <span className="mb-1 block text-xs text-qbit-outline">
                Estimated total time
              </span>
              <span className="text-xl font-bold text-qbit-primary">
                25 Minutes
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* Overall Progress Card                                     */}
        {/* ========================================================= */}
        <SurfaceCard className="p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-qbit-primary/10 text-qbit-primary">
                <Icon name="task_alt" className="text-[22px]" />
              </div>
              <div>
                <p className="text-sm font-bold text-qbit-on-surface">
                  Overall Progress
                </p>
                <p className="text-xs text-qbit-on-surface-variant">
                  Step 2 of 5
                </p>
              </div>
            </div>
            <span className="text-xl font-semibold text-qbit-primary">40%</span>
          </div>
          <ProgressTracker
            value={40}
            variant="primary"
            pulse
            showPercentage={false}
          />
        </SurfaceCard>

        {/* ========================================================= */}
        {/* Main grid: timeline (8) + right column (4)                */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ---------- Left: Timeline ---------- */}
          <div className="lg:col-span-8">
            {/* Step 1 — Unbox & Inventory (completed) */}
            <TimelineStep
              icon="check"
              status="completed"
              title="Step 1: Unbox & Inventory"
              description="Ensure all components are present including the terminal, stand, power brick, and accessory box."
            >
              <div className="absolute right-0 top-0">
                <TagBadge variant="neutral">Completed</TagBadge>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-qbit-outline-variant/30 bg-qbit-surface-container-low p-3">
                <Icon
                  name="content_cut"
                  className="text-[20px] text-qbit-on-surface-variant"
                />
                <span className="text-sm font-medium text-qbit-on-surface">
                  Required Tools: Box Cutter
                </span>
              </div>
            </TimelineStep>

            {/* Step 2 — Power Connection (active) */}
            <TimelineStep
              index="2"
              status="active"
              title="Step 2: Power Connection"
              description="Route the DC power cable through the stand neck and connect to the underside of the QBIT head unit."
            >
              <div className="absolute right-0 top-0">
                <TagBadge variant="primary">In Progress</TagBadge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-qbit-primary bg-qbit-surface-container-lowest p-4 shadow-md">
                <div className="flex items-center gap-2 text-qbit-primary">
                  <Icon name="schedule" className="text-[20px]" />
                  <span className="text-xs font-medium">
                    Estimated Time: 5 mins
                  </span>
                </div>
                <QbitButton
                  variant="primary"
                  size="md"
                  onClick={handleMarkComplete}
                  disabled={step2State !== "idle"}
                  className={
                    step2State === "completed"
                      ? "bg-green-600 text-white hover:bg-green-600 disabled:opacity-100"
                      : ""
                  }
                >
                  {step2State === "processing" && (
                    <Icon
                      name="progress_activity"
                      className="text-[18px] animate-spin"
                    />
                  )}
                  {step2State === "completed" && (
                    <Icon
                      name="check_circle"
                      className="text-[18px]"
                      filled
                    />
                  )}
                  {step2Label}
                </QbitButton>
              </div>
            </TimelineStep>

            {/* Step 3 — Peripheral Wiring (pending) */}
            <TimelineStep
              index="3"
              status="pending"
              title="Step 3: Peripheral Wiring"
              description="Connect Printer, Cash Drawer, and MSR/Scanner to designated ports."
            >
              <button
                type="button"
                onClick={() => navigate("installation-center")}
                className="inline-flex items-center gap-2 text-sm font-medium text-qbit-primary transition-colors hover:underline"
              >
                <Icon name="schema" className="text-[18px]" />
                View Wiring Diagram
              </button>
            </TimelineStep>

            {/* Step 4 — Driver Configuration (pending, last) */}
            <TimelineStep
              index="4"
              status="pending"
              title="Step 4: Driver Configuration"
              description="Install specific Windows POS drivers for the touchscreen and thermal printer."
              isLast
            >
              <button
                type="button"
                onClick={() => navigate("driver-download-center")}
                className="inline-flex items-center gap-2 text-sm font-medium text-qbit-primary transition-colors hover:underline"
              >
                <Icon name="download_for_offline" className="text-[18px]" />
                Driver Download Center
              </button>
            </TimelineStep>
          </div>

          {/* ---------- Right: Widgets ---------- */}
          <div className="space-y-6 lg:col-span-4">
            {/* Tools Required */}
            <SurfaceCard className="p-6">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-qbit-on-surface">
                Tools Required
              </h4>
              <div className="space-y-3">
                {TOOLS.map((tool) => (
                  <div
                    key={tool.label}
                    className="flex items-center gap-4 rounded-lg bg-qbit-surface-container-low p-3 transition-transform hover:scale-[1.02]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-qbit-primary shadow-sm">
                      <Icon name={tool.icon} className="text-[20px]" />
                    </div>
                    <span className="text-sm font-medium text-qbit-on-surface">
                      {tool.label}
                    </span>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            {/* Interactive Checklist */}
            <SurfaceCard className="bg-qbit-surface-container-low p-6">
              <div className="mb-6 flex items-center gap-2">
                <Icon
                  name="assignment_turned_in"
                  className="text-[20px] text-qbit-primary"
                />
                <h4 className="text-xs font-bold uppercase tracking-widest text-qbit-on-surface">
                  Interactive Checklist
                </h4>
              </div>

              <div className="space-y-6">
                {CHECKLIST_GROUPS.map((group, gIdx) => (
                  <div key={group.id}>
                    <h5 className="mb-3 text-[10px] font-black uppercase tracking-wider text-qbit-outline">
                      {group.title}
                    </h5>
                    <div className="space-y-3">
                      {group.items.map((item) => {
                        const isChecked = checkedIds[item.id] ?? false;
                        return (
                          <label
                            key={item.id}
                            htmlFor={item.id}
                            className="group flex cursor-pointer items-start gap-3"
                          >
                            <Checkbox
                              id={item.id}
                              checked={isChecked}
                              onCheckedChange={() => toggleItem(item.id)}
                              className="mt-0.5 border-qbit-outline-variant data-[state=checked]:border-qbit-primary data-[state=checked]:bg-qbit-primary"
                            />
                            <span
                              className={[
                                "text-sm transition-colors group-hover:text-qbit-primary",
                                isChecked
                                  ? "text-qbit-on-surface line-through opacity-50"
                                  : "text-qbit-on-surface",
                              ].join(" ")}
                            >
                              {item.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {gIdx < CHECKLIST_GROUPS.length - 1 && (
                      <div className="mt-6 h-px bg-qbit-outline-variant/30" />
                    )}
                  </div>
                ))}
              </div>

              <QbitButton
                variant="outline"
                size="md"
                fullWidth
                icon="file_download"
                onClick={handleExportLog}
                className="mt-6"
              >
                Export Certification Log
              </QbitButton>
            </SurfaceCard>

            {/* Help Widget */}
            <GlassCard className="relative overflow-hidden border-qbit-primary/10 p-6">
              <div className="relative z-10">
                <h4 className="mb-2 text-sm font-bold text-qbit-on-surface">
                  Need Technical Support?
                </h4>
                <p className="mb-4 text-sm text-qbit-on-surface-variant">
                  Our engineers are available 24/7 for QBIT installations.
                </p>
                <QbitButton
                  variant="primary"
                  size="md"
                  icon="support_agent"
                  fullWidth
                  onClick={() => navigate("ai-support-center")}
                >
                  Live Support Chat
                </QbitButton>
              </div>
              <Icon
                name="support_agent"
                filled
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-4 -right-4 text-[120px] text-qbit-primary/5"
              />
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
