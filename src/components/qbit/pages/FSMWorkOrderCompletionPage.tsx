"use client";

/**
 * FSMWorkOrderCompletionPage — final sign-off screen.
 *
 * Shows: customer signature pad, summary of work done, printable report view.
 * On "Print Report" → window.print() to produce a PDF via browser.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  SignaturePad,
  type SignaturePadHandle,
} from "@/components/qbit/primitives/SignaturePad";
import { FSM_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useNavigation } from "@/lib/navigation/store";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_TYPE_LABELS,
} from "@/lib/fsm/types";

interface ReportData {
  reportNumber: string;
  summary: string;
  testsPerformed: Array<{ name: string; result: string; notes: string }>;
  partsReplaced: string[] | null;
  recommendations: string | null;
  generatedAt: string;
}

export function FSMWorkOrderCompletionPage() {
  const { user } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const params = useNavigation((s) => s.params);
  const { toast } = useToast();

  const workOrderId = params.id ?? "";
  const sigRef = useRef<SignaturePadHandle>(null);
  const [signerName, setSignerName] = useState("");
  const [hasInk, setHasInk] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [workOrder, setWorkOrder] = useState<{
    jobNumber: string;
    type: string;
    status: string;
    customerName: string;
    companyName: string | null;
    address: string;
    productName: string | null;
    model: string | null;
    serialNumber: string | null;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!workOrderId) return;
    try {
      const [woRes, rptRes] = await Promise.all([
        fetch(`/api/fsm/work-orders/${workOrderId}`, { cache: "no-store" }),
        fetch(`/api/fsm/work-orders/${workOrderId}/report`, { cache: "no-store" }),
      ]);
      if (woRes.ok) {
        const wo = await woRes.json();
        setWorkOrder({
          jobNumber: wo.jobNumber,
          type: wo.type,
          status: wo.status,
          customerName: wo.customerName,
          companyName: wo.companyName,
          address: wo.address,
          productName: wo.productName,
          model: wo.model,
          serialNumber: wo.serialNumber,
        });
        setSignerName(wo.customerName ?? "");
      }
      if (rptRes.ok) {
        const r = await rptRes.json();
        setReport(r.report);
      }
    } catch {
      /* ignore */
    }
  }, [workOrderId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handleSubmitSignature = async () => {
    if (!sigRef.current) return;
    if (!hasInk) {
      toast({ title: "Signature required", description: "Please ask the customer to sign.", variant: "destructive" });
      return;
    }
    if (!signerName.trim()) {
      toast({ title: "Name required", description: "Please enter the signer's name.", variant: "destructive" });
      return;
    }
    const dataUrl = sigRef.current.toDataURL();
    if (!dataUrl) {
      toast({ title: "Signature empty", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/fsm/work-orders/${workOrderId}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName, dataUrl }),
      });
      if (!res.ok) throw new Error("Failed to save signature");
      toast({
        title: "Signature captured",
        description: "Customer sign-off recorded. Job marked complete.",
      });
      navigate("fsm-dashboard");
    } catch (e) {
      toast({
        title: "Signature failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const engineerName = user?.name ?? "Engineer";
  const initials = engineerName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppShell
      variant="field"
      brand={{ title: "QBIT FSM", tagline: "Field Service", icon: "engineering" }}
      navItems={FSM_NAV}
      activeScreen="fsm-work-order-completion"
      user={{ name: engineerName, role: "Installation Engineer", initials }}
      cta={{ label: "Back", icon: "arrow_back", onClick: () => navigate("fsm-work-order-detail", { id: workOrderId }) }}
      topBar={{ searchPlaceholder: "Search…", user: { name: engineerName, role: "Installation Engineer", initials } }}
    >
      <div className="space-y-5">
        <div className="print:hidden">
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">
            Work Order Completion
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Review the report with the customer and capture their signature.
          </p>
        </div>

        {/* Printable report */}
        <SurfaceCard className="p-6 md:p-8 print:shadow-none print:border-0">
          {/* Report header */}
          <div className="border-b border-qbit-outline-variant pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-qbit-on-surface">QBIT Hub — Service Report</h3>
                <p className="mt-1 text-sm text-qbit-on-surface-variant">
                  {report ? `Report ${report.reportNumber}` : "Report pending generation"}
                </p>
              </div>
              <div className="text-right text-xs text-qbit-on-surface-variant">
                <p>Generated: {report ? new Date(report.generatedAt).toLocaleString("en-IN") : "—"}</p>
                <p>Engineer: {engineerName}</p>
              </div>
            </div>
          </div>

          {/* Job + customer */}
          {workOrder && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Job Number</p>
                <p className="font-mono font-semibold text-qbit-on-surface">{workOrder.jobNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Type</p>
                <p className="text-qbit-on-surface">{WORK_ORDER_TYPE_LABELS[workOrder.type as keyof typeof WORK_ORDER_TYPE_LABELS] ?? workOrder.type}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Customer</p>
                <p className="text-qbit-on-surface">{workOrder.customerName}</p>
                {workOrder.companyName && <p className="text-xs text-qbit-on-surface-variant">{workOrder.companyName}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Address</p>
                <p className="text-qbit-on-surface">{workOrder.address}</p>
              </div>
              {workOrder.productName && (
                <div>
                  <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Product</p>
                  <p className="text-qbit-on-surface">{workOrder.productName}</p>
                  <p className="text-xs text-qbit-on-surface-variant">{workOrder.model} · S/N {workOrder.serialNumber}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Status</p>
                <StatusBadge variant="success" dot>{WORK_ORDER_STATUS_LABELS[workOrder.status as keyof typeof WORK_ORDER_STATUS_LABELS] ?? workOrder.status}</StatusBadge>
              </div>
            </div>
          )}

          {/* Summary */}
          {report && (
            <>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Work Summary</p>
                <p className="mt-1 text-sm text-qbit-on-surface">{report.summary}</p>
              </div>

              {/* Tests */}
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Tests Performed</p>
                <table className="mt-2 w-full text-sm">
                  <thead>
                    <tr className="border-b border-qbit-outline-variant text-left text-xs text-qbit-on-surface-variant">
                      <th className="py-1">Test</th>
                      <th className="py-1">Result</th>
                      <th className="py-1">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.testsPerformed.map((t, idx) => (
                      <tr key={idx} className="border-b border-qbit-outline-variant/30">
                        <td className="py-2">{t.name}</td>
                        <td className="py-2">
                          <span
                            className={
                              "inline-block rounded px-1.5 py-0.5 text-xs font-semibold " +
                              (t.result === "pass"
                                ? "bg-qbit-primary/10 text-qbit-primary"
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

              {/* Parts replaced */}
              {report.partsReplaced && report.partsReplaced.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Parts Replaced</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-qbit-on-surface">
                    {report.partsReplaced.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-qbit-on-surface-variant">Recommendations</p>
                  <p className="mt-1 text-sm text-qbit-on-surface">{report.recommendations}</p>
                </div>
              )}
            </>
          )}

          {/* Signature area */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="print:hidden">
              <p className="mb-2 text-xs font-semibold uppercase text-qbit-on-surface-variant">Customer Signature</p>
              <Input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Customer full name"
                className="mb-3"
              />
              <SignaturePad
                ref={sigRef}
                className="h-40"
                watermarkIcon="signature"
                onChange={setHasInk}
              />
              <QbitButton
                variant="primary"
                className="mt-3"
                icon={submitting ? "progress_activity" : "check_circle"}
                disabled={submitting || !hasInk || !signerName.trim()}
                onClick={handleSubmitSignature}
              >
                {submitting ? "Saving…" : "Capture Signature & Complete"}
              </QbitButton>
            </div>
            <div className="hidden print:block">
              <p className="mb-2 text-xs font-semibold uppercase text-qbit-on-surface-variant">Customer Signature</p>
              <div className="h-32 border-b border-qbit-on-surface" />
              <p className="mt-1 text-xs text-qbit-on-surface-variant">Signed by: ___________________________</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-qbit-on-surface-variant">Engineer Signature</p>
              <div className="h-40 rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low/40 p-4">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Icon name="engineering" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
                    <p className="mt-2 text-xs text-qbit-on-surface-variant">{engineerName}</p>
                    <p className="text-[10px] text-qbit-on-surface-variant">Installation Engineer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* Print button */}
        <div className="print:hidden">
          {report ? (
            <QbitButton variant="outline" icon="print" onClick={handlePrint}>
              Print / Save as PDF
            </QbitButton>
          ) : (
            <p className="text-sm text-qbit-on-surface-variant">
              No report generated yet. Go back to the work order and click “Generate Report” first.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
