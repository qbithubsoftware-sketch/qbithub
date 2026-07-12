"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { GlassCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/lib/navigation/store";
import { INSTALCORE_NAV } from "@/lib/navigation/nav-config";

import {
  InstallationHeader,
  InstallationTimeline,
  ProgressTrackerNav,
  Checklist,
  RequiredTools,
  WiringDiagramViewer,
  RelatedDownloads,
  RelatedVideos,
  TroubleshootingSection,
  InstallationFAQ,
} from "@/components/qbit/installation";
import type { InstallationStep } from "@/lib/installation/types";
import {
  T800_GUIDE,
  T800_TOOLS,
  T800_CHECKLIST,
  T800_WIRING_DIAGRAMS,
  T800_RELATED_VIDEOS,
} from "@/lib/installation/placeholder-data";
import { DOWNLOADS } from "@/lib/downloads/placeholder-data";
import type { DownloadItem } from "@/lib/downloads/types";

const USER = {
  name: "E. Richardson",
  role: "Lead Field Engineer",
  initials: "ER",
} as const;

export function T800InstallationGuidePage() {
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  const guide = T800_GUIDE!;

  // ---- Step state (which steps are completed) ----
  const [steps, setSteps] = useState<InstallationStep[]>(guide?.steps ?? []);
  const [currentStepIdx, setCurrentStepIdx] = useState(1); // Step 2 is active initially

  // ---- Wiring diagram viewer state ----
  const [showDiagram, setShowDiagram] = useState(false);

  // ---- Related downloads (filtered from DOWNLOADS by relatedDownloadIds) ----
  const relatedDownloads: DownloadItem[] = DOWNLOADS.filter((d) =>
    guide.relatedDownloadIds.includes(d.id),
  );

  // ---- Progress calculation ----
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progress = Math.round((completedCount / steps.length) * 100);

  // ---- Auto-show "Progress Saved" toast on mount ----
  useEffect(() => {
    const timer = setTimeout(() => {
      toast({
        title: "Progress Saved",
        description: "Installation state uploaded to cloud.",
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [toast]);

  // ---- Handlers ----
  const handleCompleteStep = useCallback(
    (step: InstallationStep) => {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === step.id ? { ...s, status: "completed" as const } : s,
        ),
      );
      toast({
        title: "Step Completed",
        description: `${step.title} verified and saved to cloud.`,
      });
    },
    [toast],
  );

  const handlePrev = useCallback(() => {
    setCurrentStepIdx((idx) => Math.max(0, idx - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStepIdx((idx) => Math.min(steps.length - 1, idx + 1));
  }, [steps.length]);

  const handleViewVideo = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleDownload = useCallback(
    (downloadId: string) => {
      const dl = DOWNLOADS.find((d) => d.id === downloadId);
      if (dl) {
        toast({
          title: "Download started",
          description: `${dl.name} ${dl.version} (${dl.fileSize})`,
        });
      }
    },
    [toast],
  );

  const handleExportLog = useCallback(() => {
    toast({
      title: "Certification Log Exported",
      description: "PDF report has been generated successfully.",
    });
  }, [toast]);

  // Update step statuses based on currentStepIdx
  const stepsWithStatus: InstallationStep[] = steps.map((s, idx) => {
    if (s.status === "completed") return { ...s, status: "completed" as const };
    if (idx === currentStepIdx) return { ...s, status: "active" as const };
    return { ...s, status: "pending" as const };
  });

  if (!guide) {
    return (
      <AppShell
        variant="instalcore"
        brand={{ title: "InstalCore", tagline: "Enterprise Portal", icon: "hub" }}
        navItems={INSTALCORE_NAV}
        activeScreen="t800-installation-guide"
        user={USER}
        topBar={{ searchPlaceholder: "Search documentation...", user: USER }}
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-qbit-surface-container text-qbit-on-surface-variant/40 mb-4">
            <Icon name="build" className="text-[32px]" />
          </div>
          <p className="text-sm font-semibold text-qbit-on-surface">No Installation Guide Available</p>
          <p className="mt-1.5 text-xs text-qbit-on-surface-variant max-w-xs leading-relaxed">
            No installation guide has been created yet. Check back later or contact your administrator.
          </p>
          <QbitButton size="sm" variant="outline" icon="arrow_back" className="mt-5" onClick={() => navigate("installation-center")}>
            Back to Installation Center
          </QbitButton>
        </div>
      </AppShell>
    );
  }

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
        {/* ===== Header ===== */}
        <InstallationHeader
          guide={guide}
          breadcrumb={[
            { label: "Products" },
            { label: "POS Systems" },
            { label: "QBIT T-800 Installation", current: true },
          ]}
        />

        {/* ===== Progress Tracker with Nav ===== */}
        <ProgressTrackerNav
          currentStep={currentStepIdx + 1}
          totalSteps={steps.length}
          progress={progress}
          onPrev={handlePrev}
          onNext={handleNext}
          onComplete={() => {
            const step = steps[currentStepIdx];
            if (step) handleCompleteStep(step);
          }}
          isFirstStep={currentStepIdx === 0}
          isLastStep={currentStepIdx === steps.length - 1}
        />

        {/* ===== Main grid: timeline (8) + right column (4) ===== */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ---------- Left: Timeline ---------- */}
          <div className="lg:col-span-8">
            <InstallationTimeline
              steps={stepsWithStatus}
              onCompleteStep={handleCompleteStep}
              onViewDiagram={() => setShowDiagram(true)}
              onViewVideo={handleViewVideo}
              onDownload={handleDownload}
            />
          </div>

          {/* ---------- Right: Widgets ---------- */}
          <div className="space-y-6 lg:col-span-4">
            {/* Required Tools */}
            <RequiredTools tools={T800_TOOLS} />

            {/* Checklist */}
            <Checklist
              items={T800_CHECKLIST}
              title="Interactive Checklist"
              onExport={handleExportLog}
            />

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

        {/* ===== Wiring Diagrams ===== */}
        <WiringDiagramViewer diagrams={T800_WIRING_DIAGRAMS} />

        {/* ===== Related Downloads (reuses DownloadCard) ===== */}
        <RelatedDownloads
          downloads={relatedDownloads}
          onDownload={(dl) => handleDownload(dl.id)}
        />

        {/* ===== Related Videos (YouTube) ===== */}
        <RelatedVideos videos={T800_RELATED_VIDEOS} />

        {/* ===== Troubleshooting ===== */}
        <TroubleshootingSection entries={guide.troubleshooting} />

        {/* ===== FAQ ===== */}
        <InstallationFAQ faqs={guide.faqs} />
      </div>
    </AppShell>
  );
}
