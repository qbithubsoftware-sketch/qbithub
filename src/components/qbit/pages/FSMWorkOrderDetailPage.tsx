"use client";

/**
 * FSMWorkOrderDetailPage — full work order detail with timeline, actions,
 * photos, customer info, product info, and Dr. QBIT entry.
 *
 * Reuses: AppShell, FSM_NAV, primitives, WorkOrderTimeline, EngineerActions,
 * PhotoUploader, NotificationCenter.
 */

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  WorkOrderTimeline,
  EngineerActions,
  PhotoUploader,
  NotificationCenter,
  ReportGenerator,
} from "@/components/qbit/fsm";
import { FSM_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import {
  type TimelineEntryDTO,
  type WorkOrderDetailDTO,
  type WorkOrderStatus,
  PRIORITY_BADGES,
  PRIORITY_LABELS,
  WORK_ORDER_STATUS_BADGES,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_TYPE_ICONS,
  WORK_ORDER_TYPE_LABELS,
} from "@/lib/fsm/types";

interface PhotoEntry {
  id: string;
  category: string;
  storagePath: string;
  caption: string | null;
  capturedAt: string;
}

interface NotificationEntry {
  id: string;
  channel: string;
  template: string;
  recipient: string;
  subject?: string | null;
  body: string;
  status: string;
  sentAt: string;
}

export function FSMWorkOrderDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const params = useNavigation((s) => s.params);
  const { toast } = useToast();

  const workOrderId = params.id ?? "";

  const [wo, setWo] = useState<WorkOrderDetailDTO | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntryDTO[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportGen, setShowReportGen] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "photos" | "notifications" | "drqbit">("timeline");

  const fetchAll = useCallback(async () => {
    if (!workOrderId) return;
    setLoading(true);
    try {
      const [woRes, tlRes, phRes, ntRes] = await Promise.all([
        fetch(`/api/fsm/work-orders/${workOrderId}`, { cache: "no-store" }),
        fetch(`/api/fsm/work-orders/${workOrderId}/timeline`, { cache: "no-store" }),
        fetch(`/api/fsm/work-orders/${workOrderId}/photos`, { cache: "no-store" }),
        fetchNotifications(workOrderId),
      ]);
      if (woRes.ok) setWo((await woRes.json()) as WorkOrderDetailDTO);
      if (tlRes.ok) {
        const { items } = (await tlRes.json()) as { items: TimelineEntryDTO[] };
        setTimeline(items);
      }
      if (phRes.ok) {
        const { items } = (await phRes.json()) as { items: PhotoEntry[] };
        setPhotos(items);
      }
      setNotifications(ntRes);
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handleAction = async (action: string) => {
    if (!wo) return;
    if (action === "reschedule") {
      // simple prompt — in production this would be a date picker modal
      const newDateStr = window.prompt("Reschedule to (YYYY-MM-DD HH:MM):");
      if (!newDateStr) return;
      const newDate = new Date(newDateStr);
      if (isNaN(newDate.getTime())) {
        toast({ title: "Invalid date", variant: "destructive" });
        return;
      }
      await patchAction(action, { rescheduledTo: newDate.toISOString(), reason: "Rescheduled by engineer" });
      return;
    }
    await patchAction(action, {});
  };

  const patchAction = async (action: string, extra: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/fsm/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Action failed");
      }
      const { workOrder } = (await res.json()) as { workOrder: WorkOrderDetailDTO };
      setWo((prev) => (prev ? { ...prev, ...workOrder } : prev));
      toast({
        title: "Status updated",
        description: `Job is now "${WORK_ORDER_STATUS_LABELS[workOrder.status as WorkOrderStatus]}"`,
      });
      // Refresh timeline + notifications
      void fetchAll();
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUploaded = (photo: PhotoEntry) => {
    setPhotos((prev) => [...prev, photo]);
  };

  const handleOpenDrQbit = () => {
    setActiveTab("drqbit");
  };

  const handleNavigate = () => {
    if (!wo?.geoLat || !wo?.geoLng) {
      toast({ title: "Location not set", description: "No coordinates on file for this customer.", variant: "destructive" });
      return;
    }
    window.open(`https://www.google.com/maps/search/?api=1&query=${wo.geoLat},${wo.geoLng}`, "_blank");
  };

  const handleGenerateReport = () => {
    setShowReportGen(true);
  };

  const handleReportSuccess = (report: { reportNumber: string }) => {
    toast({
      title: "Report generated",
      description: `${report.reportNumber} created. You can now print or download it.`,
    });
    setShowReportGen(false);
    // Move to completion screen
    navigate("fsm-work-order-completion", { id: workOrderId, reportNumber: report.reportNumber });
  };

  const engineerName = user?.name ?? "Engineer";
  const initials = engineerName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading && !wo) {
    return (
      <AppShell
        variant="field"
        brand={{ title: "QBIT FSM", tagline: "Field Service", icon: "engineering" }}
        navItems={FSM_NAV}
        activeScreen="fsm-work-order-detail"
        user={{ name: engineerName, role: "Installation Engineer", initials }}
        topBar={{ searchPlaceholder: "Search…", user: { name: engineerName, role: "Installation Engineer", initials } }}
      >
        <div className="flex h-64 items-center justify-center">
          <Icon name="progress_activity" className="text-[32px] animate-spin text-qbit-primary" />
        </div>
      </AppShell>
    );
  }

  if (!wo) {
    return (
      <AppShell
        variant="field"
        brand={{ title: "QBIT FSM", tagline: "Field Service", icon: "engineering" }}
        navItems={FSM_NAV}
        activeScreen="fsm-work-order-detail"
        user={{ name: engineerName, role: "Installation Engineer", initials }}
        topBar={{ searchPlaceholder: "Search…", user: { name: engineerName, role: "Installation Engineer", initials } }}
      >
        <div className="rounded-xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
          <Icon name="search_off" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
          <p className="mt-3 text-sm text-qbit-on-surface-variant">Work order not found.</p>
          <QbitButton className="mt-4" variant="outline" icon="arrow_back" onClick={() => navigate("fsm-dashboard")}>
            Back to Dashboard
          </QbitButton>
        </div>
      </AppShell>
    );
  }

  const googleMapsUrl = wo.geoLat && wo.geoLng
    ? `https://www.google.com/maps/search/?api=1&query=${wo.geoLat},${wo.geoLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wo.address)}`;

  return (
    <AppShell
      variant="field"
      brand={{ title: "QBIT FSM", tagline: "Field Service", icon: "engineering" }}
      navItems={FSM_NAV}
      activeScreen="fsm-work-order-detail"
      user={{ name: engineerName, role: "Installation Engineer", initials }}
      cta={{ label: "Back", icon: "arrow_back", onClick: () => navigate("fsm-dashboard") }}
      topBar={{ searchPlaceholder: "Search…", user: { name: engineerName, role: "Installation Engineer", initials } }}
    >
      <div className="space-y-5">
        {/* -------------------------------------------------------------- */}
        {/* Header card                                                    */}
        {/* -------------------------------------------------------------- */}
        <SurfaceCard className="p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                <Icon name={WORK_ORDER_TYPE_ICONS[wo.type]} className="text-[26px]" filled />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-qbit-primary">{wo.jobNumber}</span>
                  <TagBadge variant="neutral">{WORK_ORDER_TYPE_LABELS[wo.type]}</TagBadge>
                </div>
                <h1 className="mt-0.5 text-xl font-bold text-qbit-on-surface">{wo.customerName}</h1>
                {wo.companyName && (
                  <p className="text-sm text-qbit-on-surface-variant">{wo.companyName}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant={WORK_ORDER_STATUS_BADGES[wo.status]} dot>
                {WORK_ORDER_STATUS_LABELS[wo.status]}
              </StatusBadge>
              <TagBadge variant={PRIORITY_BADGES[wo.priority]}>
                {PRIORITY_LABELS[wo.priority]} Priority
              </TagBadge>
            </div>
          </div>

          {/* Action bar */}
          <div className="mt-4 border-t border-qbit-outline-variant/50 pt-4">
            <EngineerActions
              status={wo.status}
              customerPhone={wo.customerPhone}
              workOrderJobNumber={wo.jobNumber}
              onAction={handleAction}
              onOpenDrQbit={handleOpenDrQbit}
              onNavigate={handleNavigate}
            />
            {(wo.status === "testing" || wo.status === "installing") && (
              <QbitButton
                variant="primary"
                size="sm"
                icon="picture_as_pdf"
                className="ml-2"
                onClick={handleGenerateReport}
              >
                Generate Report
              </QbitButton>
            )}
          </div>
        </SurfaceCard>

        {/* -------------------------------------------------------------- */}
        {/* Tab navigation                                                */}
        {/* -------------------------------------------------------------- */}
        <div className="flex gap-1 rounded-xl bg-qbit-surface-container-low p-1">
          {[
            { id: "timeline", label: "Timeline", icon: "timeline" },
            { id: "photos", label: `Photos (${photos.length})`, icon: "photo_camera" },
            { id: "notifications", label: `Notifications (${notifications.length})`, icon: "notifications" },
            { id: "drqbit", label: "Dr. QBIT", icon: "smart_toy" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                (activeTab === tab.id
                  ? "bg-white text-qbit-primary shadow-sm"
                  : "text-qbit-on-surface-variant hover:text-qbit-on-surface")
              }
            >
              <Icon name={tab.icon} className="text-[16px]" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Tab content                                                   */}
        {/* -------------------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left: tab content (lg:col-span-2) */}
          <div className="lg:col-span-2">
            {activeTab === "timeline" && (
              <SurfaceCard className="p-5 md:p-6">
                <h3 className="mb-4 text-base font-semibold text-qbit-on-surface">Job Timeline</h3>
                <WorkOrderTimeline entries={timeline} currentStatus={wo.status} />
              </SurfaceCard>
            )}

            {activeTab === "photos" && (
              <SurfaceCard className="p-5 md:p-6">
                <h3 className="mb-4 text-base font-semibold text-qbit-on-surface">Photo Documentation</h3>
                <PhotoUploader
                  workOrderId={workOrderId}
                  photos={photos}
                  onUploaded={handlePhotoUploaded}
                  onError={(msg) => toast({ title: "Upload failed", description: msg, variant: "destructive" })}
                />
              </SurfaceCard>
            )}

            {activeTab === "notifications" && (
              <SurfaceCard className="p-5 md:p-6">
                <h3 className="mb-4 text-base font-semibold text-qbit-on-surface">Customer Notifications</h3>
                <NotificationCenter notifications={notifications} />
              </SurfaceCard>
            )}

            {activeTab === "drqbit" && (
              <SurfaceCard className="p-5 md:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary text-qbit-on-primary">
                    <Icon name="smart_toy" className="text-[22px]" filled />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-qbit-on-surface">Dr. QBIT Diagnostics</h3>
                    <p className="text-xs text-qbit-on-surface-variant">
                      Scan device, check health, run diagnostics, generate report.
                    </p>
                  </div>
                </div>

                <ol className="space-y-2">
                  {[
                    { step: 1, label: "Scan Device", icon: "qr_code_scanner", desc: "Scan or enter serial number" },
                    { step: 2, label: "Device Health", icon: "health_and_safety", desc: "Run health checks" },
                    { step: 3, label: "Driver Status", icon: "settings_input_component", desc: "Check installed driver version" },
                    { step: 4, label: "Firmware Status", icon: "system_update", desc: "Check firmware version" },
                    { step: 5, label: "Diagnostics", icon: "biotech", desc: "Run diagnostic tests" },
                    { step: 6, label: "Test Print", icon: "print", desc: "Print a test page" },
                    { step: 7, label: "Generate Report", icon: "picture_as_pdf", desc: "Compile findings into PDF" },
                  ].map((s) => (
                    <li key={s.step} className="flex items-start gap-3 rounded-lg border border-qbit-outline-variant/50 bg-white p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-qbit-primary/10 text-xs font-bold text-qbit-primary">
                        {s.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon name={s.icon} className="text-[16px] text-qbit-primary" />
                          <span className="text-sm font-semibold text-qbit-on-surface">{s.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-qbit-on-surface-variant">{s.desc}</p>
                      </div>
                      {s.step === 7 ? (
                        <QbitButton size="sm" variant="primary" icon="picture_as_pdf" onClick={handleGenerateReport}>
                          Generate
                        </QbitButton>
                      ) : (
                        <QbitButton
                          size="sm"
                          variant="ghost"
                          icon="arrow_forward"
                          onClick={() => navigate("support-tickets", { workOrderId, step: String(s.step) })}
                        >
                          Open
                        </QbitButton>
                      )}
                    </li>
                  ))}
                </ol>

                <QbitButton
                  variant="surface"
                  fullWidth
                  className="mt-4"
                  icon="smart_toy"
                  iconRight="arrow_forward"
                  onClick={() => navigate("support-tickets", { workOrderId })}
                >
                  Open Dr. QBIT Chat
                </QbitButton>
              </SurfaceCard>
            )}

            {/* Report Generator modal-like inline */}
            {showReportGen && (
              <SurfaceCard className="mt-5 p-5 md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-qbit-on-surface">Generate Completion Report</h3>
                  <QbitButton variant="ghost" size="sm" icon="close" onClick={() => setShowReportGen(false)}>
                    Cancel
                  </QbitButton>
                </div>
                <ReportGenerator
                  workOrderId={workOrderId}
                  workOrderType={wo.type}
                  onSuccess={handleReportSuccess}
                />
              </SurfaceCard>
            )}
          </div>

          {/* Right: customer + product info (lg:col-span-1) */}
          <div className="space-y-5">
            {/* Customer */}
            <SurfaceCard className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                <Icon name="person" className="text-[16px]" />
                Customer
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-qbit-on-surface">{wo.customerName}</p>
                {wo.companyName && (
                  <p className="text-qbit-on-surface-variant">{wo.companyName}</p>
                )}
                <a href={`tel:${wo.customerPhone}`} className="inline-flex items-center gap-1.5 text-qbit-primary hover:underline">
                  <Icon name="call" className="text-[14px]" />
                  {wo.customerPhone}
                </a>
                {wo.customerEmail && (
                  <a href={`mailto:${wo.customerEmail}`} className="block inline-flex items-center gap-1.5 text-qbit-primary hover:underline">
                    <Icon name="mail" className="text-[14px]" />
                    {wo.customerEmail}
                  </a>
                )}
              </div>
              <div className="mt-3 border-t border-qbit-outline-variant/50 pt-3">
                <p className="mb-1 text-xs font-semibold text-qbit-on-surface-variant">Installation Address</p>
                <p className="text-sm text-qbit-on-surface">{wo.address}</p>
                <a
                  href={googleMapsUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-qbit-primary hover:underline"
                >
                  <Icon name="map" className="text-[14px]" />
                  Open in Google Maps
                </a>
              </div>
            </SurfaceCard>

            {/* Product */}
            {wo.assetId && (
              <SurfaceCard className="p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  <Icon name="inventory_2" className="text-[16px]" />
                  Product
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-qbit-on-surface">{wo.productName ?? "—"}</p>
                  <Row label="Model" value={wo.model ?? "—"} />
                  <Row label="Serial Number" value={wo.serialNumber ?? "—"} mono />
                  {wo.qrCode && (
                    <a
                      href={wo.qrCode}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-qbit-primary hover:underline"
                    >
                      <Icon name="qr_code" className="text-[14px]" />
                      View QR
                    </a>
                  )}
                  {wo.purchaseDate && (
                    <Row label="Purchase Date" value={new Date(wo.purchaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
                  )}
                  {wo.warrantyStatus && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-qbit-on-surface-variant">Warranty:</span>
                      <StatusBadge
                        variant={wo.warrantyStatus === "active" ? "success" : "warning"}
                        dot
                      >
                        {wo.warrantyStatus}
                      </StatusBadge>
                      {wo.warrantyExpiry && (
                        <span className="text-[10px] text-qbit-on-surface-variant">
                          until {new Date(wo.warrantyExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="border-t border-qbit-outline-variant/50 pt-2">
                    <Row label="Firmware" value={wo.firmwareVersion ?? "—"} mono />
                    <Row label="Driver" value={wo.driverVersion ?? "—"} mono />
                  </div>
                </div>
              </SurfaceCard>
            )}

            {/* Schedule */}
            <SurfaceCard className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                <Icon name="schedule" className="text-[16px]" />
                Schedule
              </h3>
              <div className="space-y-2 text-sm">
                <Row
                  label="Scheduled Date"
                  value={new Date(wo.scheduledDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                />
                <Row label="Scheduled Time" value={wo.scheduledTime ?? "—"} />
                <Row label="Estimated Duration" value={`${wo.estimatedMinutes} min`} />
                {wo.arrivedAt && <Row label="Arrived" value={formatTime(wo.arrivedAt)} />}
                {wo.startedAt && <Row label="Started" value={formatTime(wo.startedAt)} />}
                {wo.completedAt && <Row label="Completed" value={formatTime(wo.completedAt)} />}
              </div>
            </SurfaceCard>

            {wo.assignedEngineerName && (
              <SurfaceCard className="p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  <Icon name="engineering" className="text-[16px]" />
                  Assigned Engineer
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-qbit-primary-container text-qbit-on-primary-container">
                    <Icon name="person" className="text-[20px]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-qbit-on-surface">{wo.assignedEngineerName}</p>
                    <p className="text-xs text-qbit-on-surface-variant">Installation Engineer</p>
                  </div>
                </div>
              </SurfaceCard>
            )}

            {wo.description && (
              <SurfaceCard className="p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  <Icon name="description" className="text-[16px]" />
                  Description
                </h3>
                <p className="text-sm text-qbit-on-surface">{wo.description}</p>
              </SurfaceCard>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-qbit-on-surface-variant">{label}</span>
      <span className={"text-sm text-qbit-on-surface " + (mono ? "font-mono" : "font-medium")}>{value}</span>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Fetches notifications for a work order. */
async function fetchNotifications(workOrderId: string): Promise<NotificationEntry[]> {
  try {
    const res = await fetch(`/api/fsm/work-orders/${workOrderId}/notifications`, { cache: "no-store" });
    if (!res.ok) return [];
    const { items } = (await res.json()) as { items: NotificationEntry[] };
    return items;
  } catch {
    return [];
  }
}
