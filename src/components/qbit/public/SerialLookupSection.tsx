"use client";

/**
 * SerialLookupSection — Homepage serial-number search + animated Support Card.
 *
 * UX:
 *   1. Customer types a serial number in the hero search box
 *   2. Clicks "Search Device" (or presses Enter)
 *   3. Below the hero, an animated Support Card expands smoothly showing:
 *        - Product Information (image, name, model, serial, dates, dealer)
 *        - Customer Information (name, company, mobile, email, GST, city, state)
 *        - Device Information (status, warranty, activation, registration, support)
 *        - Support Resources (driver, brochure, manual, install guide, video,
 *          firmware, FAQ, troubleshooting, raise ticket)
 *        - Warranty Card (Active=green / Expired=red + dates + remaining days)
 *
 *   Edge cases:
 *     - Invalid serial format → red error card "Invalid Serial Number"
 *     - Not registered → amber card "Device Not Registered" + Register / Contact buttons
 *     - API error → red error card with retry
 *
 * No page reload, no popup, no external redirect.
 * Inspired by HP Support Assistant / Dell SupportAssist / Lenovo Support.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ====================== Types ======================
interface MediaFile {
  id: string;
  type: string;
  title: string;
  url: string;
}

interface DeviceInfo {
  productName: string;
  modelNumber: string;
  brand: string | null;
  category: string | null;
  productImage: string | null;
  deviceStatus: string;
  serialNumber: string;
  qrCode: string | null;
  purchaseDate: string | null;
  installationDate: string | null;
  activationDate: string | null;
  registrationDate: string | null;
  dealerName: string | null;
}

interface CustomerInfo {
  name: string;
  companyName: string | null;
  mobileNumber: string | null;
  email: string | null;
  gstNumber: string | null;
  city: string | null;
  state: string | null;
}

interface WarrantyInfo {
  status: "active" | "expired" | "expiring_soon" | "unknown";
  startDate: string | null;
  endDate: string | null;
  remainingDays: number | null;
  period: string | null;
}

interface ResourcesInfo {
  driverDownloadUrl: string | null;
  manualUrl: string | null;
  brochureUrl: string | null;
  datasheetUrl: string | null;
  warrantyUrl: string | null;
  sdkUrl: string | null;
  utilityUrl: string | null;
  installationGuideUrl: string | null;
  latestDriverVersion: string | null;
  latestFirmwareVersion: string | null;
  installationTime: string | null;
  difficultyLevel: string | null;
  faqUrl: string;
  troubleshootingUrl: string;
  supportTicketUrl: string;
  videoUrl: string;
  productPageUrl: string;
  mediaFiles: MediaFile[];
}

export interface LookupResponse {
  valid: boolean;
  found: boolean;
  source?: string;
  device?: DeviceInfo;
  customer?: CustomerInfo;
  warranty?: WarrantyInfo;
  resources?: ResourcesInfo | null;
  error?: string;
}

type State = "idle" | "searching" | "found" | "not-found" | "invalid" | "error";

const EXAMPLE_SERIALS = ["SNQBT000001", "SNQBT000002", "SNQBT000003"];

// ====================== Component ======================
export function SerialLookupSection() {
  const [serial, setSerial] = useState("");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<LookupResponse | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = serial.trim();
    if (!trimmed) {
      setState("invalid");
      setResult({ valid: false, found: false });
      return;
    }

    setState("searching");
    setResult(null);

    try {
      const res = await fetch(
        `/api/public/serial-lookup?serial=${encodeURIComponent(trimmed)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Lookup failed");
      const data: LookupResponse = await res.json();
      setResult(data);

      if (!data.valid) setState("invalid");
      else if (!data.found) setState("not-found");
      else setState("found");
    } catch {
      setState("error");
      setResult({ valid: true, found: false, error: "Network error" });
    }
  }

  function handleReset() {
    setState("idle");
    setResult(null);
    setSerial("");
  }

  function fillExample(s: string) {
    setSerial(s);
    setState("idle");
    setResult(null);
  }

  // Smooth-scroll the result into view when state changes (but only after first search)
  useEffect(() => {
    if (state === "idle") return;
    if (!resultRef.current) return;
    // Small delay so the layout settles before scrolling
    const t = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div className="w-full">
      {/* ===== Search Bar ===== */}
      <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[24px] text-qbit-primary">
            fingerprint
          </span>
          <input
            type="text"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Enter Serial Number (Example: W55-250700152)"
            aria-label="Serial Number"
            className="w-full rounded-2xl border border-qbit-outline-variant bg-white py-4 pl-14 pr-40 text-sm text-qbit-on-surface shadow-lg transition-all placeholder:text-qbit-on-surface-variant/70 focus:border-qbit-primary focus:outline-none focus:ring-2 focus:ring-qbit-primary/30 md:text-base"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={state === "searching"}
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors disabled:opacity-60"
          >
            {state === "searching" ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">search</span>
            )}
            {state === "searching" ? "Searching…" : "Search Device"}
          </button>
        </div>
      </form>

      {/* Quick example chips */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-qbit-on-surface-variant">
        <span className="inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">lightbulb</span>
          Try:
        </span>
        {EXAMPLE_SERIALS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => fillExample(s)}
            className="rounded-md border border-dashed border-qbit-outline-variant bg-white/60 px-2.5 py-1 font-mono text-[11px] text-qbit-on-surface-variant hover:border-qbit-primary hover:text-qbit-primary transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* ===== Result Area (renders below hero, smoothly expands) ===== */}
      <div ref={resultRef} className="mx-auto mt-10 max-w-5xl scroll-mt-24">
        {state === "searching" && <SearchingCard />}
        {state === "found" && result?.device && (
          <SupportCard
            device={result.device}
            customer={result.customer}
            warranty={result.warranty}
            resources={result.resources}
            onReset={handleReset}
          />
        )}
        {state === "not-found" && (
          <NotFoundCard serial={serial} onReset={handleReset} />
        )}
        {state === "invalid" && (
          <InvalidCard onReset={handleReset} />
        )}
        {state === "error" && (
          <ErrorCard onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

// ====================== Sub-cards ======================

function SearchingCard() {
  return (
    <div className="animate-fade-in rounded-3xl border border-qbit-outline-variant bg-white p-12 text-center shadow-lg">
      <span className="material-symbols-outlined mx-auto animate-spin text-[48px] text-qbit-primary">
        progress_activity
      </span>
      <p className="mt-4 text-base font-semibold text-qbit-on-surface">Searching device registry…</p>
      <p className="mt-1 text-sm text-qbit-on-surface-variant">
        Looking up serial number across all registered devices
      </p>
    </div>
  );
}

function SupportCard({
  device, customer, warranty, resources, onReset,
}: {
  device: DeviceInfo;
  customer?: CustomerInfo;
  warranty?: WarrantyInfo;
  resources?: ResourcesInfo | null;
  onReset: () => void;
}) {
  return (
    <div className="animate-fade-in-up space-y-5">
      {/* ===== Success banner ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-qbit-success/30 bg-qbit-success/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-qbit-success/15 text-qbit-success">
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-bold text-qbit-on-surface">Device Found</p>
            <p className="text-xs text-qbit-on-surface-variant">
              Serial: <span className="font-mono">{device.serialNumber}</span>
              {device.brand && ` · ${device.brand} ${device.modelNumber}`}
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-3 py-1.5 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          New Search
        </button>
      </div>

      {/* ===== Product Information + Warranty Card (side by side on lg) ===== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Product info — spans 2 cols */}
        <section className="lg:col-span-2 rounded-2xl border border-qbit-outline-variant bg-white shadow-sm overflow-hidden">
          <SectionHeader icon="inventory_2" title="Product Information" />
          <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-3">
            {/* Image */}
            <div className="sm:col-span-1">
              <div className="aspect-square overflow-hidden rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low">
                {device.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={device.productImage} alt={device.productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="material-symbols-outlined text-[72px] text-qbit-primary/40">inventory_2</span>
                  </div>
                )}
              </div>
            </div>
            {/* Details */}
            <div className="sm:col-span-2 grid grid-cols-2 gap-3">
              <InfoRow label="Product Name" value={device.productName} />
              <InfoRow label="Category" value={prettyCategory(device.category)} />
              <InfoRow label="Model Number" value={device.modelNumber} mono />
              <InfoRow label="Serial Number" value={device.serialNumber} mono />
              <InfoRow label="Product Status" value={prettyStatus(device.deviceStatus)} />
              <InfoRow label="Brand" value={device.brand ?? "—"} />
              <InfoRow label="Purchase Date" value={prettyDate(device.purchaseDate)} />
              <InfoRow label="Installation Date" value={prettyDate(device.installationDate)} />
              <InfoRow label="Dealer Name" value={device.dealerName ?? "—"} />
              {resources?.productPageUrl && (
                <div className="col-span-2 mt-1">
                  <Link
                    href={resources.productPageUrl}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline"
                  >
                    View full product page
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Warranty Card */}
        <WarrantyCard warranty={warranty} />
      </div>

      {/* ===== Customer + Device Information (side by side) ===== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Customer Information */}
        <section className="rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
          <SectionHeader icon="person" title="Customer Information" />
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
            <InfoRow label="Customer Name" value={customer?.name ?? "—"} />
            <InfoRow label="Company Name" value={customer?.companyName ?? "—"} />
            <InfoRow label="Registered Mobile" value={customer?.mobileNumber ?? "—"} mono />
            <InfoRow label="Registered Email" value={customer?.email ?? "—"} mono />
            <InfoRow label="GST Number" value={customer?.gstNumber ?? "—"} mono />
            <InfoRow label="City" value={customer?.city ?? "—"} />
            <InfoRow label="State" value={customer?.state ?? "—"} />
          </div>
        </section>

        {/* Device Information */}
        <section className="rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
          <SectionHeader icon="devices" title="Device Information" />
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
            <InfoRow label="Device Status" value={prettyStatus(device.deviceStatus)} />
            <InfoRow label="Warranty Status" value={prettyWarrantyStatus(warranty?.status)} />
            <InfoRow label="Activation Date" value={prettyDate(device.activationDate)} />
            <InfoRow label="Registration Date" value={prettyDate(device.registrationDate)} />
            <InfoRow
              label="Support Status"
              value={device.deviceStatus === "completed" || device.deviceStatus === "active" ? "Eligible" : "—"}
            />
            {resources?.latestFirmwareVersion && (
              <InfoRow label="Firmware Version" value={resources.latestFirmwareVersion} mono />
            )}
            {resources?.latestDriverVersion && (
              <InfoRow label="Driver Version" value={resources.latestDriverVersion} mono />
            )}
          </div>
        </section>
      </div>

      {/* ===== Support Resources ===== */}
      <section className="rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
        <SectionHeader icon="support_agent" title="Support Resources" />
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ResourceLink
              icon="memory"
              label="Windows Driver"
              sub={resources?.latestDriverVersion ?? undefined}
              url={resources?.driverDownloadUrl ?? null}
              color="bg-qbit-primary/10 text-qbit-primary"
            />
            <ResourceLink
              icon="picture_as_pdf"
              label="Brochure"
              url={resources?.brochureUrl ?? null}
              color="bg-qbit-error/10 text-qbit-error"
            />
            <ResourceLink
              icon="menu_book"
              label="User Manual"
              url={resources?.manualUrl ?? null}
              color="bg-qbit-tertiary/10 text-qbit-tertiary"
            />
            <ResourceLink
              icon="menu_book"
              label="Installation Guide"
              url={resources?.installationGuideUrl ?? null}
              color="bg-qbit-tertiary/10 text-qbit-tertiary"
            />
            <ResourceLink
              icon="videocam"
              label="Installation Video"
              url={resources?.videoUrl ?? null}
              color="bg-qbit-secondary/10 text-qbit-secondary"
              internal
            />
            <ResourceLink
              icon="upgrade"
              label="Firmware"
              sub={resources?.latestFirmwareVersion ?? undefined}
              url={resources?.sdkUrl ?? null}
              fallbackUrl={resources?.productPageUrl ?? null}
              color="bg-qbit-secondary/10 text-qbit-secondary"
              internal
            />
            <ResourceLink
              icon="help"
              label="FAQ"
              url={resources?.faqUrl ?? null}
              color="bg-qbit-primary/10 text-qbit-primary"
              internal
            />
            <ResourceLink
              icon="build"
              label="Troubleshooting"
              url={resources?.troubleshootingUrl ?? null}
              color="bg-qbit-warning/15 text-qbit-warning"
              internal
            />
            <ResourceLink
              icon="support_agent"
              label="Raise Support Ticket"
              url={resources?.supportTicketUrl ?? null}
              color="bg-qbit-error/10 text-qbit-error"
              internal
              cta
            />
          </div>

          {/* Additional media files */}
          {resources?.mediaFiles && resources.mediaFiles.length > 0 && (
            <div className="mt-5 border-t border-qbit-outline-variant/50 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                Additional Downloads
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {resources.mediaFiles
                  .filter((m) => ["driver", "firmware", "sdk", "utility", "brochure", "datasheet", "manual", "warranty"].includes(m.type))
                  .slice(0, 6)
                  .map((m) => (
                    <ResourceLink
                      key={m.id}
                      icon="attach_file"
                      label={m.title}
                      url={m.url}
                      color="bg-qbit-surface-container-high text-qbit-on-surface-variant"
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function WarrantyCard({ warranty }: { warranty?: WarrantyInfo }) {
  if (!warranty) return null;

  const isActive = warranty.status === "active" || warranty.status === "expiring_soon";
  const isExpired = warranty.status === "expired";
  const isUnknown = warranty.status === "unknown";

  const accentBg = isActive ? "bg-qbit-success/10" : isExpired ? "bg-qbit-error/10" : "bg-qbit-warning/10";
  const accentText = isActive ? "text-qbit-success" : isExpired ? "text-qbit-error" : "text-qbit-warning";
  const accentBorder = isActive ? "border-qbit-success/30" : isExpired ? "border-qbit-error/30" : "border-qbit-warning/30";
  const accentBtnBg = isActive ? "bg-qbit-success" : isExpired ? "bg-qbit-error" : "bg-qbit-warning";
  const icon = isActive ? "verified_user" : isExpired ? "gpp_bad" : "help_outline";
  const label = isActive ? "Warranty Active" : isExpired ? "Warranty Expired" : "Warranty Unknown";

  return (
    <section className={`rounded-2xl border ${accentBorder} bg-white shadow-sm overflow-hidden`}>
      <div className={`flex items-center justify-between gap-3 border-b ${accentBorder} ${accentBg} px-6 py-4`}>
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[22px] ${accentText}`}>{icon}</span>
          <h3 className="text-sm font-bold text-qbit-on-surface">Warranty Card</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full ${accentBtnBg} px-3 py-1 text-xs font-bold text-white`}>
          {label}
        </span>
      </div>
      <div className="space-y-3 p-6">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Warranty Period</p>
          <p className="text-sm font-semibold text-qbit-on-surface">{warranty.period ?? "Standard Warranty"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="Start Date" value={prettyDate(warranty.startDate)} />
          <InfoRow label="End Date" value={prettyDate(warranty.endDate)} />
        </div>
        <div className={`rounded-xl ${accentBg} p-3 text-center`}>
          {isUnknown ? (
            <p className="text-xs text-qbit-on-surface-variant">Warranty dates not on file. Contact support to register.</p>
          ) : isExpired ? (
            <p className="text-sm font-semibold text-qbit-error">This device is out of warranty.</p>
          ) : (
            <p className="text-sm font-bold text-qbit-on-surface">
              {warranty.remainingDays} <span className="text-xs font-medium text-qbit-on-surface-variant">days remaining</span>
            </p>
          )}
        </div>
        {isExpired && (
          <Link
            href="/support"
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-qbit-primary px-3 py-2 text-xs font-semibold text-qbit-primary hover:bg-qbit-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">renew</span>
            Renew Warranty
          </Link>
        )}
      </div>
    </section>
  );
}

function NotFoundCard({ serial, onReset }: { serial: string; onReset: () => void }) {
  return (
    <div className="animate-fade-in-up rounded-3xl border border-qbit-warning/30 bg-qbit-warning/5 p-8 text-center shadow-lg md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-qbit-warning/15 text-qbit-warning">
        <span className="material-symbols-outlined text-[36px]">search_off</span>
      </div>
      <h3 className="mt-4 text-xl font-bold text-qbit-on-surface">Device Not Registered</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-qbit-on-surface-variant">
        This Serial Number
        <span className="mx-1 font-mono text-qbit-on-surface">"{serial}"</span>
        does not exist in our Device Registration Database.
      </p>
      <p className="mt-1 text-xs text-qbit-on-surface-variant">
        If you have a valid QBIT device, register it to access drivers, warranty, and support resources.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">app_registration</span>
          Register Device
        </Link>
        <Link
          href="/support"
          className="inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-5 py-2.5 text-sm font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
          Contact Support
        </Link>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-qbit-on-surface-variant hover:text-qbit-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Try Again
        </button>
      </div>
    </div>
  );
}

function InvalidCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="animate-fade-in-up rounded-3xl border border-qbit-error/30 bg-qbit-error/5 p-8 text-center shadow-lg md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-qbit-error/15 text-qbit-error">
        <span className="material-symbols-outlined text-[36px]">error</span>
      </div>
      <h3 className="mt-4 text-xl font-bold text-qbit-on-surface">Invalid Serial Number</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-qbit-on-surface-variant">
        Please check your device sticker and try again.
      </p>
      <p className="mt-1 text-xs text-qbit-on-surface-variant">
        Serial numbers are 4–50 characters and contain only letters, numbers, dashes, and underscores.
      </p>
      <button
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">refresh</span>
        Try Again
      </button>
    </div>
  );
}

function ErrorCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="animate-fade-in-up rounded-3xl border border-qbit-error/30 bg-qbit-error/5 p-8 text-center shadow-lg md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-qbit-error/15 text-qbit-error">
        <span className="material-symbols-outlined text-[36px]">cloud_off</span>
      </div>
      <h3 className="mt-4 text-xl font-bold text-qbit-on-surface">Lookup Failed</h3>
      <p className="mt-2 text-sm text-qbit-on-surface-variant">
        We couldn't reach the device registry. Please check your connection and try again.
      </p>
      <button
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">refresh</span>
        Try Again
      </button>
    </div>
  );
}

// ====================== Helpers ======================

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-qbit-outline-variant/50 px-6 py-4">
      <span className="material-symbols-outlined text-[20px] text-qbit-primary">{icon}</span>
      <h3 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">{title}</h3>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">{label}</p>
      <p className={`text-sm font-medium text-qbit-on-surface ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function ResourceLink({
  icon, label, sub, url, fallbackUrl, color, internal = false, cta = false,
}: {
  icon: string;
  label: string;
  sub?: string;
  url: string | null;
  fallbackUrl?: string | null;
  color: string;
  internal?: boolean;
  cta?: boolean;
}) {
  // If URL missing but fallback exists (e.g. firmware), use fallback
  const href = url || fallbackUrl;
  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-qbit-outline-variant/50 bg-qbit-surface-container-low/50 p-4 opacity-70">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-qbit-on-surface">{label}</p>
          <p className="text-xs text-qbit-on-surface-variant">Not available</p>
        </div>
      </div>
    );
  }

  const cls = `group flex items-center gap-3 rounded-xl border ${cta ? "border-qbit-primary/40 bg-qbit-primary/5" : "border-qbit-outline-variant bg-white"} p-4 transition-all hover:border-qbit-primary/40 hover:shadow-md`;

  if (internal || href.startsWith("/")) {
    return (
      <Link href={href} className={cls}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">{label}</p>
          {sub && <p className="text-xs text-qbit-on-surface-variant">{sub}</p>}
        </div>
        <span className="material-symbols-outlined ml-auto text-[18px] text-qbit-on-surface-variant group-hover:text-qbit-primary">
          arrow_forward
        </span>
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">{label}</p>
        {sub && <p className="text-xs text-qbit-on-surface-variant">{sub}</p>}
      </div>
      <span className="material-symbols-outlined ml-auto text-[18px] text-qbit-on-surface-variant group-hover:text-qbit-primary">
        download
      </span>
    </a>
  );
}

function prettyDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function prettyStatus(s: string | null | undefined): string {
  if (!s) return "—";
  return s
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyCategory(c: string | null | undefined): string {
  if (!c) return "—";
  return c
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyWarrantyStatus(s: string | null | undefined): string {
  if (!s) return "Unknown";
  if (s === "active") return "Active";
  if (s === "expired") return "Expired";
  if (s === "expiring_soon") return "Expiring Soon";
  return "Unknown";
}
