"use client";

/**
 * CustomerTracking — public customer-facing tracking component.
 *
 * Renders a friendly progress timeline + engineer card + product/warranty info.
 * Deliberately shows NO address (beyond city), NO internal notes, NO pricing.
 */

import { useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import {
  type PublicCustomerView,
  type WorkOrderStatus,
  WORK_ORDER_STATUS_BADGES,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_TYPE_LABELS,
} from "@/lib/fsm/types";

interface CustomerTrackingProps {
  initialData?: PublicCustomerView | null;
}

export function CustomerTracking({ initialData }: CustomerTrackingProps) {
  const [code, setCode] = useState("");
  const [data, setData] = useState<PublicCustomerView | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    if (!code.trim()) {
      setError("Please enter your tracking code or job number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/fsm-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingCode: code.trim() }),
      });
      if (res.status === 404) {
        setError("Tracking code not found. Please check and try again.");
        setData(null);
        return;
      }
      if (!res.ok) throw new Error("Lookup failed");
      const json = await res.json();
      setData(json as PublicCustomerView);
    } catch {
      setError("Unable to fetch tracking right now. Please try again later.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-qbit-primary/10 text-qbit-primary">
            <Icon name="track_changes" className="text-[32px]" filled />
          </div>
          <h2 className="text-2xl font-bold text-qbit-on-surface">Track Your Service</h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Enter the tracking code from your SMS / WhatsApp to see real-time job status.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="e.g. TRK-9F2A4B or WO-94281"
            className="flex-1 rounded-lg border border-qbit-outline-variant bg-white px-4 py-3 text-sm focus:border-qbit-primary focus:outline-none focus:ring-2 focus:ring-qbit-primary/20"
            aria-label="Tracking code"
          />
          <QbitButton onClick={lookup} disabled={loading} icon={loading ? "progress_activity" : "search"}>
            {loading ? "Searching…" : "Track"}
          </QbitButton>
        </div>
        {error && (
          <div className="rounded-lg bg-qbit-error/10 px-4 py-3 text-sm text-qbit-error">
            <Icon name="error" className="mr-1 inline text-[16px]" />
            {error}
          </div>
        )}
      </div>
    );
  }

  return <TrackingResult data={data} />;
}

function TrackingResult({ data }: { data: PublicCustomerView }) {
  const currentStatus = data.status as WorkOrderStatus;
  const completed = currentStatus === "completed";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Status hero */}
      <div
        className={
          "rounded-2xl border p-6 text-center " +
          (completed
            ? "border-qbit-primary/30 bg-qbit-primary-fixed/40"
            : "border-qbit-outline-variant bg-white")
        }
      >
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-qbit-primary text-qbit-on-primary">
          <Icon name={completed ? "task_alt" : "engineering"} className="text-[32px]" filled />
        </div>
        <h2 className="text-2xl font-bold text-qbit-on-surface">
          {WORK_ORDER_STATUS_LABELS[currentStatus]}
        </h2>
        <p className="mt-1 text-sm text-qbit-on-surface-variant">
          {WORK_ORDER_TYPE_LABELS[data.type]} · Job {data.jobNumber}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <StatusBadge variant={WORK_ORDER_STATUS_BADGES[currentStatus]} dot>
            {WORK_ORDER_STATUS_LABELS[currentStatus]}
          </StatusBadge>
          <span className="inline-flex items-center gap-1 rounded-full border border-qbit-outline-variant px-2.5 py-0.5 text-xs font-medium text-qbit-on-surface-variant">
            <Icon name="schedule" className="text-[12px]" />
            {new Date(data.scheduledDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
            {data.scheduledTime ? ` · ${data.scheduledTime}` : ""}
          </span>
        </div>
      </div>

      {/* Milestone progress bar */}
      <div className="rounded-xl border border-qbit-outline-variant bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
          Progress Timeline
        </h3>
        <ol className="relative">
          {data.timeline.map((t, idx) => (
            <li key={idx} className="flex gap-3 pb-5 last:pb-0">
              <div className="relative flex flex-col items-center">
                <div
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-full " +
                    (t.done
                      ? "bg-qbit-primary text-qbit-on-primary"
                      : "bg-qbit-surface-container-high text-qbit-on-surface-variant")
                  }
                >
                  <Icon
                    name={t.done ? "check" : "circle"}
                    className="text-[14px]"
                    filled={t.done}
                  />
                </div>
                {idx < data.timeline.length - 1 && (
                  <div
                    className={
                      "absolute top-7 h-full w-0.5 " +
                      (t.done ? "bg-qbit-primary" : "bg-qbit-outline-variant")
                    }
                  />
                )}
              </div>
              <div className="flex-1 -mt-0.5">
                <p className={"text-sm font-semibold " + (t.done ? "text-qbit-on-surface" : "text-qbit-on-surface-variant")}>
                  {t.label}
                </p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-qbit-on-surface-variant">{t.description}</p>
                )}
                {t.occurredAt && (
                  <p className="mt-0.5 text-[10px] text-qbit-on-surface-variant">
                    {new Date(t.occurredAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Engineer + Product cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {data.engineerName && (
          <div className="rounded-xl border border-qbit-outline-variant bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
              Your Engineer
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-qbit-primary-container text-qbit-on-primary-container">
                <Icon name="engineering" className="text-[24px]" />
              </div>
              <div>
                <p className="text-base font-semibold text-qbit-on-surface">{data.engineerName}</p>
                {data.engineerPhone && (
                  <a
                    href={`tel:${data.engineerPhone}`}
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-qbit-primary hover:underline"
                  >
                    <Icon name="call" className="text-[12px]" />
                    {data.engineerPhone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {data.productName && (
          <div className="rounded-xl border border-qbit-outline-variant bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
              Product
            </h3>
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold text-qbit-on-surface">{data.productName}</p>
              <p className="text-xs text-qbit-on-surface-variant">Model: {data.model}</p>
              <p className="text-xs text-qbit-on-surface-variant">S/N: {data.serialNumber}</p>
              <div className="flex items-center gap-2 pt-1">
                <StatusBadge
                  variant={data.warrantyStatus === "active" ? "success" : "warning"}
                  dot
                >
                  Warranty: {data.warrantyStatus}
                </StatusBadge>
                {data.warrantyExpiry && (
                  <span className="text-[10px] text-qbit-on-surface-variant">
                    until {new Date(data.warrantyExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help footer */}
      <div className="rounded-xl bg-qbit-surface-container-low p-5 text-center">
        <p className="text-sm text-qbit-on-surface-variant">
          Need help? Call QBIT Support at <span className="font-semibold text-qbit-primary">1800-123-4567</span>
        </p>
      </div>
    </div>
  );
}
