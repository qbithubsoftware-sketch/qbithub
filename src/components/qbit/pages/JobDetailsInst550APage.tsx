"use client";

import { useEffect, useState } from "react";
import { Icon } from "../primitives/Icon";
import { GlassCard } from "../primitives/GlassCard";
import { QbitButton } from "../primitives/QbitButton";
import { TimelineStep } from "../primitives/TimelineStep";
import { ScreenSwitcher } from "../shells/ScreenSwitcher";
import { useNavigation } from "@/lib/navigation/store";
import type { ScreenId } from "@/lib/navigation/store";

type TestStatus = "pass" | "fail" | "retry" | "retrying";

interface TestItem {
  id: string;
  label: string;
  icon: string;
  status: TestStatus;
}

const INITIAL_TESTS: TestItem[] = [
  { id: "printer", label: "Thermal Printer", icon: "print", status: "pass" },
  { id: "scanner", label: "Laser Scanner", icon: "barcode_scanner", status: "fail" },
  { id: "lan", label: "Local LAN Connect", icon: "lan", status: "retrying" },
];

const NAV_ITEMS: { id: string; label: string; screen: ScreenId | null }[] = [
  { id: "dashboard", label: "Dashboard", screen: "field-engineer-workspace" },
  { id: "my-jobs", label: "My Jobs", screen: null },
  { id: "inventory", label: "Inventory", screen: "field-engineer-workspace" },
];

const TEST_OPTIONS: { id: TestStatus; label: string }[] = [
  { id: "pass", label: "Pass" },
  { id: "fail", label: "Fail" },
  { id: "retry", label: "Retry" },
];

/**
 * Job Details: INST-550-A — focused-work layout (topbar + bottom action bar, no sidebar).
 * Pixel-faithful to the Stitch `job_details_inst_550_a_qbit_hub` design.
 */
export function JobDetailsInst550APage() {
  const navigate = useNavigation((s) => s.navigate);
  const [tests, setTests] = useState<TestItem[]>(INITIAL_TESTS);

  // Collapse the sidebar-width CSS var so the topbar spans the full viewport width.
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", "0px");
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, []);

  const handleTestChange = (itemId: string, next: TestStatus) => {
    setTests((prev) =>
      prev.map((t) =>
        t.id === itemId
          ? { ...t, status: next === "retry" ? "retrying" : next }
          : t,
      ),
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-qbit-background text-qbit-on-surface">
      {/* Floating Screen Switcher — for design demo */}
      <div className="fixed top-4 right-4 z-[100]">
        <ScreenSwitcher />
      </div>
      {/* ===== Top Bar (custom inline — no AppShell) ===== */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-qbit-outline-variant bg-qbit-surface-container-lowest/90 px-4 backdrop-blur-md md:px-6"
        style={{ left: "var(--sidebar-width, 0px)" }}
      >
        {/* Left: brand + job id */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-qbit-primary">QBIT Hub</span>
          <div className="h-6 w-px bg-qbit-outline-variant" />
          <span className="hidden text-sm font-semibold text-qbit-on-surface-variant sm:inline">
            Job ID: INST-550-A
          </span>
        </div>

        {/* Center: nav items */}
        <nav className="hidden items-center gap-4 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === "my-jobs";
            const handleClick = () => {
              if (item.screen) navigate(item.screen);
            };
            return (
              <button
                key={item.id}
                type="button"
                onClick={handleClick}
                className={
                  isActive
                    ? "border-b-2 border-qbit-primary px-2 py-1 text-sm font-bold text-qbit-primary"
                    : "rounded px-2 py-1 text-sm font-medium text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high"
                }
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: notifications, settings, avatar */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high active:scale-95"
          >
            <Icon name="notifications" className="text-[22px]" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high active:scale-95"
          >
            <Icon name="settings" className="text-[22px]" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-qbit-outline-variant bg-qbit-secondary-container/20 text-xs font-bold text-qbit-secondary">
            AR
          </div>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="mx-auto w-full max-w-container-max flex-1 px-4 pb-24 pt-16 md:px-6 md:pt-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ----- Left Column (col-span-3) ----- */}
          <div className="space-y-6 lg:col-span-3">
            {/* Customer Details */}
            <GlassCard hover className="p-4">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-qbit-outline">
                Customer Details
              </h2>
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary-container/10 text-qbit-primary">
                  <Icon name="business" className="text-[22px]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-qbit-on-surface">
                    CloudScale Systems
                  </p>
                  <p className="text-sm text-qbit-on-surface-variant">
                    Acct: #CS-8820-XP
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-qbit-outline">
                    Contact Person
                  </span>
                  <span className="text-sm font-medium text-qbit-on-surface">
                    Sarah Jenkins
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-qbit-outline">
                    Installation Site
                  </span>
                  <span className="text-sm text-qbit-on-surface">
                    442 Industrial Way, Suite 300
                    <br />
                    San Francisco, CA 94103
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Location */}
            <GlassCard hover className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-qbit-outline-variant p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-qbit-outline">
                  Location
                </h2>
                <Icon name="directions" className="text-[20px] text-qbit-primary" />
              </div>
              <div className="relative h-48 w-full overflow-hidden bg-qbit-surface-container">
                {/* Map preview: grayscale gradient + map icon to suggest a map */}
                <div
                  className="absolute inset-0 opacity-80"
                  style={{
                    background:
                      "linear-gradient(135deg, #d3daef 0%, #e1e8fd 35%, #dce2f7 65%, #c3c5d9 100%)",
                  }}
                />
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(0deg, rgba(115,118,136,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(115,118,136,0.4) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-qbit-outline">
                  <Icon name="map" className="text-[48px]" filled />
                  <span className="mt-2 text-xs font-semibold uppercase tracking-wider">
                    San Francisco
                  </span>
                </div>
                {/* Location pin */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Icon
                    name="location_on"
                    className="text-[28px] text-qbit-primary"
                    filled
                  />
                </div>
              </div>
              <div className="p-4">
                <QbitButton
                  variant="surface"
                  fullWidth
                  icon="open_in_new"
                  className="bg-qbit-secondary-fixed text-qbit-on-secondary-fixed hover:bg-qbit-secondary-fixed-dim"
                >
                  Open in Maps
                </QbitButton>
              </div>
            </GlassCard>
          </div>

          {/* ----- Middle Column (col-span-5) ----- */}
          <div className="space-y-6 lg:col-span-5">
            {/* Installation Progress */}
            <GlassCard hover className="p-4 md:p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-base font-semibold text-qbit-on-surface">
                  Installation Progress
                </h2>
                <span className="inline-flex items-center rounded-full bg-qbit-secondary-container/20 px-3 py-1 text-xs font-semibold text-qbit-on-secondary-fixed">
                  In Progress
                </span>
              </div>

              <div className="pl-2">
                <TimelineStep
                  status="completed"
                  icon="check"
                  title="Unboxing & Inspection"
                  meta="08:45 AM"
                  description="Components verified against manifest. No physical damage noted."
                />
                <TimelineStep
                  status="active"
                  title="Hardware Setup"
                  meta="Live"
                  description="Mounting main console and routing integrated cables."
                />
                <TimelineStep
                  status="pending"
                  title="Final Testing"
                  meta="Scheduled"
                  description="System-wide diagnostic run and network handshake."
                  isLast
                />
              </div>
            </GlassCard>

            {/* Product Checklist */}
            <GlassCard hover className="p-4 md:p-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-qbit-outline">
                Product Checklist
              </h2>
              <div className="space-y-2">
                {/* QBIT Core Hub V2 — checked */}
                <div className="flex items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-qbit-outline-variant hover:bg-qbit-surface-container-low">
                  <div className="flex items-center gap-3">
                    <Icon name="inventory_2" className="text-[22px] text-qbit-outline" />
                    <div>
                      <p className="text-sm font-bold text-qbit-on-surface">
                        QBIT Core Hub V2
                      </p>
                      <p className="font-mono text-xs text-qbit-outline">
                        SN: QB-9941-XJ-00
                      </p>
                    </div>
                  </div>
                  <Icon
                    name="check_circle"
                    className="text-[24px] text-emerald-600"
                    filled
                  />
                </div>

                {/* Satellite Interface Pad — Scan button */}
                <div className="flex items-center justify-between rounded-lg border border-qbit-primary/20 bg-qbit-primary-container/5 p-2">
                  <div className="flex items-center gap-3">
                    <Icon name="terminal" className="text-[22px] text-qbit-primary" />
                    <div>
                      <p className="text-sm font-bold text-qbit-on-surface">
                        Satellite Interface Pad
                      </p>
                      <p className="font-mono text-xs text-qbit-outline">
                        SN: SIP-3342-AA-91
                      </p>
                    </div>
                  </div>
                  <QbitButton size="sm" icon="qr_code_scanner" className="uppercase">
                    Scan
                  </QbitButton>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* ----- Right Column (col-span-4) ----- */}
          <div className="space-y-6 lg:col-span-4">
            {/* Documentation */}
            <GlassCard hover className="p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-qbit-outline">
                  Documentation
                </h2>
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium text-qbit-primary transition-opacity hover:opacity-80"
                >
                  <Icon name="add_a_photo" className="text-[18px]" />
                  Capture
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* BEFORE image card */}
                <div className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-qbit-surface-container">
                  {/* Gradient "image" placeholder */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #c3c5d9 0%, #d3daef 45%, #e1e8fd 100%)",
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "linear-gradient(0deg, rgba(20,27,43,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(20,27,43,0.15) 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon
                      name="photo_camera"
                      className="text-[32px] text-qbit-on-surface-variant/60"
                    />
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex items-center gap-1 text-xs font-semibold text-white">
                      <Icon name="visibility" className="text-[14px]" />
                      View Before
                    </span>
                  </div>
                  {/* BEFORE badge */}
                  <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    BEFORE
                  </div>
                </div>

                {/* Upload During placeholder */}
                <div className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-qbit-outline-variant transition-colors hover:bg-qbit-surface-container">
                  <Icon
                    name="add_photo_alternate"
                    className="mb-1 text-[32px] text-qbit-outline"
                  />
                  <span className="text-xs font-semibold text-qbit-outline">
                    Upload During
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Testing Checklist */}
            <GlassCard hover className="p-4 md:p-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-qbit-outline">
                Testing Checklist
              </h2>
              <div className="space-y-4">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        name={test.icon}
                        className="text-[22px] text-qbit-on-surface-variant"
                      />
                      <span className="text-sm text-qbit-on-surface">
                        {test.label}
                      </span>
                    </div>

                    {/* Pass / Fail / Retry segmented control */}
                    <div className="flex h-10 rounded-lg bg-qbit-surface-container p-0.5">
                      {TEST_OPTIONS.map((opt) => {
                        const isActive =
                          (opt.id === "retry" && test.status === "retrying") ||
                          (opt.id !== "retry" && test.status === opt.id);
                        const activeClass =
                          opt.id === "pass"
                            ? "bg-emerald-600 text-white shadow-sm font-bold"
                            : opt.id === "fail"
                              ? "bg-qbit-error text-white shadow-sm font-bold"
                              : "bg-qbit-secondary text-white shadow-sm font-bold";
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleTestChange(test.id, opt.id)}
                            className={
                              isActive
                                ? `flex items-center gap-1 rounded-md px-3 py-1 text-xs ${activeClass}`
                                : "rounded-md px-3 py-1 text-xs font-medium text-qbit-outline transition-colors hover:text-qbit-on-surface-variant"
                            }
                          >
                            {isActive && opt.id === "retry" && (
                              <Icon
                                name="progress_activity"
                                className="animate-spin text-[14px]"
                              />
                            )}
                            {opt.id === "retry" && isActive ? "Retrying" : opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      {/* ===== Bottom Action Bar (fixed) ===== */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-between gap-4 border-t border-qbit-outline-variant bg-qbit-surface-container-lowest/85 px-4 backdrop-blur-xl md:px-6 safe-area-bottom">
        {/* Left cluster — scrollable on small screens */}
        <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar">
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-qbit-outline">
              <Icon name="schedule" className="text-[14px]" />
              Estimated End Time
            </span>
            <span className="text-sm font-bold text-qbit-on-surface">
              11:30 AM (2h 45m left)
            </span>
          </div>
          <div className="hidden h-8 w-px bg-qbit-outline-variant sm:block" />
          <div className="flex gap-2">
            <QbitButton
              variant="outline"
              size="md"
              icon="warning"
              className="shrink-0"
            >
              Report Issue
            </QbitButton>
            <QbitButton
              variant="outline"
              size="md"
              icon="description"
              className="shrink-0"
              onClick={() => navigate("installation-center")}
            >
              View Manual
            </QbitButton>
          </div>
        </div>

        {/* Right cluster — primary CTA */}
        <div className="flex shrink-0 items-center">
          <QbitButton
            variant="primary"
            size="lg"
            iconRight="arrow_forward"
            className="shadow-lg"
            onClick={() => navigate("job-completion-handover")}
          >
            Next Step: Connectivity
          </QbitButton>
        </div>
      </footer>
    </div>
  );
}
