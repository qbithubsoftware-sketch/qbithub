"use client";

/**
 * CustomerTrackingPortalPage — full enterprise tracking experience.
 *
 * Accessed via ?track=<token> URL parameter OR via navigation params.token.
 *
 * Flow:
 *   1. Validate token via GET /api/public/track/[token]
 *   2. Display: progress tracker, status timeline, engineer card, product
 *      details, customer actions
 *   3. If status === 'completed': show completion banner + Download PDF Report
 *      button + FeedbackForm (or RatingCard if already submitted)
 *   4. Auto-refresh every 30 seconds while job is in progress
 *
 * Public — no auth required. Token validation happens server-side.
 */

import { useCallback, useEffect, useState } from "react";
import { PublicHeader } from "@/components/qbit/portal/PublicHeader";
import { PublicFooter } from "@/components/qbit/portal/PublicFooter";
import { ScreenSwitcher } from "@/components/qbit/shells/ScreenSwitcher";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  ProgressTrackerEnterprise,
  EngineerCard,
  CustomerActions,
  FeedbackForm,
  RatingCard,
} from "@/components/qbit/tracking";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import {
  type PublicTrackingView,
  WORK_TYPE_ICONS,
} from "@/lib/tracking/types";
import {
  WORK_ORDER_STATUS_BADGES,
  WORK_ORDER_STATUS_LABELS,
} from "@/lib/fsm/types";

interface FeedbackData {
  id: string;
  overallRating: number;
  comment?: string | null;
  recommendImprovement?: string | null;
  wouldRecommend?: boolean | null;
  customerName?: string | null;
  submittedAt: string;
}

const AUTO_REFRESH_INTERVAL_MS = 30_000;

export function CustomerTrackingPortalPage() {
  const navigate = useNavigation((s) => s.navigate);
  const params = useNavigation((s) => s.params);
  const { toast } = useToast();

  // Token can come from navigation params OR from URL ?track=<token>
  const [token, setToken] = useState<string>("");
  const [data, setData] = useState<PublicTrackingView | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<{
    report: {
      reportNumber: string;
      summary: string;
      testsPerformed: Array<{ name: string; result: string; notes: string }>;
      partsReplaced: string[] | null;
      recommendations: string | null;
      generatedAt: string;
    };
    workOrder: Record<string, unknown>;
  } | null>(null);

  // Extract token from URL on mount (handles deep-link via ?track=<token>)
  useEffect(() => {
    if (params.token) {
      setToken(params.token);
      return;
    }
    // Check URL ?track=<token>
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const trackParam = urlParams.get("track");
      if (trackParam) {
        setToken(trackParam);
      }
    }
  }, [params.token]);

  // Fetch tracking data
  const fetchTracking = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/track/${token}`, { cache: "no-store" });
      if (res.status === 404) {
        const err = await res.json().catch(() => ({}));
        setError(err.message ?? "Invalid or expired tracking link.");
        setData(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to load tracking data");
      const json = (await res.json()) as PublicTrackingView;
      setData(json);
    } catch {
      setError("Unable to load tracking data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch feedback status (to show RatingCard if already submitted)
  const fetchFeedback = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/public/track/${token}/feedback`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { feedback: FeedbackData | null };
      setFeedback(json.feedback);
      if (json.feedback) setShowFeedbackForm(false);
    } catch {
      // Non-fatal
    }
  }, [token]);

  useEffect(() => {
    void fetchTracking();
    void fetchFeedback();
  }, [fetchTracking, fetchFeedback]);

  // Auto-refresh while job is in progress (not completed/cancelled)
  useEffect(() => {
    if (!data) return;
    if (data.status === "completed" || data.status === "cancelled") return;

    const interval = setInterval(() => {
      void fetchTracking();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [data, fetchTracking]);

  const handleDownloadReport = async () => {
    if (!token) return;
    setShowReport(true);
    try {
      const res = await fetch(`/api/public/track/${token}/report`, { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "Report not available",
          description: err.error ?? "Please check back later.",
          variant: "destructive",
        });
        setShowReport(false);
        return;
      }
      const json = await res.json();
      setReportData(json);
    } catch {
      toast({
        title: "Failed to load report",
        variant: "destructive",
      });
      setShowReport(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleFeedbackSubmitted = () => {
    setShowFeedbackForm(false);
    void fetchFeedback();
    toast({
      title: "Thank you!",
      description: "Your feedback helps us improve.",
    });
  };

  // -------- Loading state --------
  if (loading && !data) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <PublicHeader />
        <main className="flex flex-1 items-center justify-center pt-[72px]">
          <div className="text-center">
            <Icon name="progress_activity" className="mx-auto text-[32px] animate-spin text-qbit-primary" />
            <p className="mt-3 text-sm text-qbit-on-surface-variant">Loading your tracking…</p>
          </div>
        </main>
        <div className="fixed top-4 right-4 z-[100]"><ScreenSwitcher /></div>
      </div>
    );
  }

  // -------- Error state --------
  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <PublicHeader />
        <main className="flex flex-1 items-center justify-center pt-[72px] px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-qbit-error/10 text-qbit-error">
              <Icon name="link_off" className="text-[36px]" filled />
            </div>
            <h1 className="text-xl font-bold text-qbit-on-surface">Tracking Link Invalid</h1>
            <p className="mt-2 text-sm text-qbit-on-surface-variant">
              {error ?? "This tracking link is no longer valid."}
            </p>
            <p className="mt-3 text-xs text-qbit-on-surface-variant">
              Please check your email or WhatsApp for the latest tracking link, or contact QBIT Support at <span className="font-semibold text-qbit-primary">1800-123-4567</span>.
            </p>
            <QbitButton
              variant="outline"
              className="mt-6"
              icon="arrow_back"
              onClick={() => navigate("product-overview")}
            >
              Back to QBIT Hub
            </QbitButton>
          </div>
        </main>
        <div className="fixed top-4 right-4 z-[100]"><ScreenSwitcher /></div>
        <PublicFooter />
      </div>
    );
  }

  const isCompleted = data.status === "completed";
  const isCancelled = data.status === "cancelled";

  // -------- Main render --------
  return (
    <div className="flex min-h-screen flex-col bg-qbit-surface">
      <PublicHeader />
      <div className="fixed top-4 right-4 z-[100]"><ScreenSwitcher /></div>

      <main className="flex-1 pt-[72px]">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
          {/* ---------- Header ---------- */}
          <div className="mb-6 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-qbit-on-surface-variant">
              <Icon name={WORK_TYPE_ICONS[data.workType] ?? "track_changes"} className="text-[16px] text-qbit-primary" />
              <span className="uppercase tracking-wider">{data.workTypeLabel}</span>
              <span>·</span>
              <span className="font-mono">{data.jobNumber}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-qbit-on-surface md:text-3xl">
              {data.customerName}
              {data.companyName && (
                <span className="ml-2 text-base font-normal text-qbit-on-surface-variant">
                  · {data.companyName}
                </span>
              )}
            </h1>
          </div>

          {/* ---------- Status hero ---------- */}
          <SurfaceCard
            className={
              "p-6 mb-6 " +
              (isCompleted
                ? "border-qbit-success/30 bg-qbit-success/5"
                : isCancelled
                  ? "border-qbit-error/30 bg-qbit-error/5"
                  : "")
            }
          >
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={
                    "flex h-14 w-14 items-center justify-center rounded-full " +
                    (isCompleted
                      ? "bg-qbit-success text-white"
                      : isCancelled
                        ? "bg-qbit-error text-white"
                        : "bg-qbit-primary text-qbit-on-primary")
                  }
                >
                  <Icon
                    name={isCompleted ? "task_alt" : isCancelled ? "cancel" : "engineering"}
                    className="text-[32px]"
                    filled
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Current Status
                  </p>
                  <h2 className="text-xl font-bold text-qbit-on-surface">
                    {WORK_ORDER_STATUS_LABELS[data.status] ?? data.status}
                  </h2>
                  <p className="text-xs text-qbit-on-surface-variant">
                    Scheduled: {new Date(data.scheduledDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    {data.scheduledTime ? ` at ${data.scheduledTime}` : ""}
                  </p>
                </div>
              </div>
              <StatusBadge
                variant={WORK_ORDER_STATUS_BADGES[data.status] ?? "neutral"}
                dot
              >
                {WORK_ORDER_STATUS_LABELS[data.status] ?? data.status}
              </StatusBadge>
            </div>

            {/* Progress tracker */}
            {!isCancelled && (
              <div className="mt-6 border-t border-qbit-outline-variant/50 pt-5">
                <ProgressTrackerEnterprise
                  percent={data.progressPercent}
                  milestones={data.milestones}
                />
              </div>
            )}
          </SurfaceCard>

          {/* ---------- Completion banner ---------- */}
          {isCompleted && data.completion && (
            <SurfaceCard className="mb-6 border-qbit-success/30 bg-qbit-success/5 p-5">
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Icon name="check_circle" className="text-[32px] text-qbit-success" filled />
                  <div>
                    <p className="text-base font-bold text-qbit-on-surface">Installation Completed</p>
                    <p className="text-xs text-qbit-on-surface-variant">
                      Completed on{" "}
                      {new Date(data.completion.completedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                      {data.engineerName && ` by ${data.engineerName}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.completion.reportAvailable && (
                    <QbitButton
                      variant="primary"
                      size="sm"
                      icon="picture_as_pdf"
                      onClick={handleDownloadReport}
                    >
                      Download Report
                    </QbitButton>
                  )}
                  {!data.completion.feedbackSubmitted && !feedback && (
                    <QbitButton
                      variant="outline"
                      size="sm"
                      icon="star"
                      onClick={() => setShowFeedbackForm(true)}
                    >
                      Rate Installation
                    </QbitButton>
                  )}
                </div>
              </div>
            </SurfaceCard>
          )}

          {/* ---------- Two-column layout ---------- */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: Engineer + Customer Actions */}
            <div className="space-y-4 lg:col-span-1">
              <EngineerCard
                name={data.engineerName}
                initials={data.engineerInitials}
                photoUrl={data.engineerPhotoUrl}
                phone={data.engineerPhone}
                scheduledTime={data.scheduledTime}
                scheduledDate={data.scheduledDate}
                status={data.status}
              />

              <SurfaceCard className="p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  Quick Actions
                </p>
                <CustomerActions
                  engineerPhone={data.engineerPhone}
                  engineerName={data.engineerName}
                  supportPhone={data.supportPhone}
                  supportEmail={data.supportEmail}
                  manualUrl={data.manualUrl}
                  videoUrl={data.videoUrl}
                  warrantyStatus={data.warrantyStatus}
                  warrantyExpiry={data.warrantyExpiry}
                  onViewWarranty={() => {
                    toast({
                      title: "Warranty Information",
                      description: `Status: ${data.warrantyStatus ?? "—"} · Expiry: ${data.warrantyExpiry ? new Date(data.warrantyExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}`,
                    });
                  }}
                />
              </SurfaceCard>

              {data.completion?.feedbackSubmitted || feedback ? (
                feedback && (
                  <RatingCard
                    overallRating={feedback.overallRating}
                    comment={feedback.comment}
                    recommendImprovement={feedback.recommendImprovement}
                    wouldRecommend={feedback.wouldRecommend}
                    customerName={feedback.customerName}
                    submittedAt={feedback.submittedAt}
                  />
                )
              ) : isCompleted && showFeedbackForm ? (
                <SurfaceCard className="p-5">
                  <p className="mb-3 text-sm font-semibold text-qbit-on-surface">Rate Your Experience</p>
                  <FeedbackForm token={token} onSubmitted={handleFeedbackSubmitted} />
                </SurfaceCard>
              ) : null}
            </div>

            {/* Right: Status timeline + Product details */}
            <div className="space-y-4 lg:col-span-2">
              {/* Timeline */}
              <SurfaceCard className="p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  Status Timeline
                </p>
                {data.timeline.length === 0 ? (
                  <p className="text-sm text-qbit-on-surface-variant">No timeline events yet.</p>
                ) : (
                  <ol className="relative">
                    {data.timeline.map((t, idx) => (
                      <li key={idx} className="flex gap-3 pb-5 last:pb-0">
                        <div className="relative flex flex-col items-center">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-qbit-primary text-qbit-on-primary">
                            <Icon name="check" className="text-[14px]" filled />
                          </div>
                          {idx < data.timeline.length - 1 && (
                            <div className="absolute top-7 h-full w-0.5 bg-qbit-primary/40" />
                          )}
                        </div>
                        <div className="flex-1 -mt-0.5">
                          <p className="text-sm font-semibold text-qbit-on-surface">{t.label}</p>
                          {t.description && (
                            <p className="mt-0.5 text-xs text-qbit-on-surface-variant">{t.description}</p>
                          )}
                          <p className="mt-0.5 text-[10px] text-qbit-on-surface-variant">
                            {new Date(t.occurredAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
                <div className="mt-3 flex items-center gap-2 border-t border-qbit-outline-variant/50 pt-3 text-[10px] text-qbit-on-surface-variant">
                  <Icon name="autorenew" className="text-[12px]" />
                  Auto-refreshes every 30 seconds while job is in progress
                </div>
              </SurfaceCard>

              {/* Product details */}
              <SurfaceCard className="p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  Product Details
                </p>
                {data.productName ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                        <Icon name="inventory_2" className="text-[24px]" filled />
                      </div>
                      <div>
                        <p className="text-base font-bold text-qbit-on-surface">{data.productName}</p>
                        <p className="text-xs text-qbit-on-surface-variant">
                          Model: {data.model ?? "—"} · S/N: <span className="font-mono">{data.serialNumber ?? "—"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-qbit-outline-variant/50 pt-3 text-sm">
                      <Row label="Warranty" value={data.warrantyStatus ?? "—"} />
                      {data.warrantyExpiry && (
                        <Row
                          label="Expiry"
                          value={new Date(data.warrantyExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        />
                      )}
                      <Row label="Firmware" value={data.firmwareVersion ?? "—"} mono />
                      <Row label="Driver" value={data.driverVersion ?? "—"} mono />
                    </div>
                    {/* Resource links */}
                    <div className="flex flex-wrap gap-2 border-t border-qbit-outline-variant/50 pt-3">
                      {data.installationGuideUrl && (
                        <a
                          href={data.installationGuideUrl}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-qbit-outline-variant bg-white px-3 py-1 text-xs font-medium text-qbit-primary hover:bg-qbit-primary hover:text-qbit-on-primary"
                        >
                          <Icon name="menu_book" className="text-[12px]" />
                          Installation Guide
                        </a>
                      )}
                      {data.manualUrl && (
                        <a
                          href={data.manualUrl}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-qbit-outline-variant bg-white px-3 py-1 text-xs font-medium text-qbit-primary hover:bg-qbit-primary hover:text-qbit-on-primary"
                        >
                          <Icon name="description" className="text-[12px]" />
                          Manual
                        </a>
                      )}
                      {data.driverDownloadUrl && (
                        <a
                          href={data.driverDownloadUrl}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-qbit-outline-variant bg-white px-3 py-1 text-xs font-medium text-qbit-primary hover:bg-qbit-primary hover:text-qbit-on-primary"
                        >
                          <Icon name="settings_input_component" className="text-[12px]" />
                          Latest Driver
                        </a>
                      )}
                      {data.firmwareDownloadUrl && (
                        <a
                          href={data.firmwareDownloadUrl}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-qbit-outline-variant bg-white px-3 py-1 text-xs font-medium text-qbit-primary hover:bg-qbit-primary hover:text-qbit-on-primary"
                        >
                          <Icon name="system_update" className="text-[12px]" />
                          Latest Firmware
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-qbit-on-surface-variant">No product linked to this work order.</p>
                )}
              </SurfaceCard>
            </div>
          </div>
        </div>
      </main>

      {/* ---------- Report modal ---------- */}
      {showReport && reportData && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowReport(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-white shadow-2xl print:max-h-none print:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-qbit-outline-variant bg-white p-4 print:hidden">
              <h3 className="text-base font-semibold text-qbit-on-surface">
                Installation Report — {reportData.report.reportNumber}
              </h3>
              <div className="flex gap-2">
                <QbitButton variant="outline" size="sm" icon="print" onClick={handlePrintReport}>
                  Print / Save PDF
                </QbitButton>
                <QbitButton variant="ghost" size="sm" icon="close" onClick={() => setShowReport(false)}>
                  Close
                </QbitButton>
              </div>
            </div>
            <div className="p-6">
              <div className="border-b border-qbit-outline-variant pb-4">
                <h4 className="text-lg font-bold text-qbit-on-surface">QBIT Hub — Service Report</h4>
                <p className="text-xs text-qbit-on-surface-variant">
                  Report {reportData.report.reportNumber} · Generated{" "}
                  {new Date(reportData.report.generatedAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Summary</p>
                <p className="mt-1 text-sm text-qbit-on-surface">{reportData.report.summary}</p>
              </div>
              {reportData.report.testsPerformed.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-qbit-on-surface-variant">Tests Performed</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-qbit-outline-variant text-left text-xs text-qbit-on-surface-variant">
                        <th className="py-1">Test</th>
                        <th className="py-1">Result</th>
                        <th className="py-1">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.report.testsPerformed.map((t, idx) => (
                        <tr key={idx} className="border-b border-qbit-outline-variant/30">
                          <td className="py-2">{t.name}</td>
                          <td className="py-2">
                            <span
                              className={
                                "rounded px-1.5 py-0.5 text-xs font-semibold " +
                                (t.result === "pass"
                                  ? "bg-qbit-success/10 text-qbit-success"
                                  : t.result === "fail"
                                    ? "bg-qbit-error/10 text-qbit-error"
                                    : "bg-qbit-surface-container-high text-qbit-on-surface-variant")
                              }
                            >
                              {t.result.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 text-xs text-qbit-on-surface-variant">{t.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {reportData.report.partsReplaced && reportData.report.partsReplaced.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Parts Replaced</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-qbit-on-surface">
                    {reportData.report.partsReplaced.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {reportData.report.recommendations && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Recommendations</p>
                  <p className="mt-1 text-sm text-qbit-on-surface">{reportData.report.recommendations}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-qbit-on-surface-variant">{label}</p>
      <p className={"text-sm text-qbit-on-surface " + (mono ? "font-mono" : "font-medium")}>{value}</p>
    </div>
  );
}
