"use client";

/**
 * CustomerPortal — Serial Number based Customer Device Portal for /dr-qbit.
 *
 * Replaces the old DrQbitWorkflow (model-number-based, multi-mode).
 *
 * PRINCIPLE:
 *   Serial Number is the ONLY public lookup key.
 *   Every registered device has a unique serial — even two customers who
 *   bought the same model have different serials.
 *
 * DATA SOURCE:
 *   Device Registration Database (FSMCustomerAsset + PurchaseRecord).
 *   NOT the Product Database. The serial lookup returns:
 *     Serial → Customer → Product → Warranty → Public Downloads.
 *
 * RBAC (Role-Based Access Control):
 *   Guest / Customer visitor sees ONLY:
 *     - Product Information (image, name, model, category, description)
 *     - Public Downloads (driver, firmware, manual, installation guide,
 *       quick start guide, software utility) — visibility = "public"
 *     - Warranty Card (status, expiry, remaining days, progress bar)
 *     - Customer Device Info (name, company, mobile masked, email masked,
 *       city, state, purchase date, invoice, dealer, registration date)
 *     - Support actions (raise ticket, contact support, WhatsApp)
 *
 *   NEVER EXPOSED (filtered out at API level by visibility field):
 *     - Engineer Tools (Engineer Repair Manual, Field Test Diagnostic Tool)
 *     - Admin Tools (Admin Security Console, Internal Factory Firmware)
 *     - Internal Utilities, Testing Files, Factory Software, Debug Files,
 *       Production Tools, Internal Documents, Security Tools, Private
 *       Downloads, Internal APIs, Employee Resources, Admin URLs
 *
 * UX Flow:
 *   1. Customer enters serial number OR scans QR code
 *   2. System searches Device Registration Database
 *   3. If found: animated Support Card expands inline with 4 sections:
 *        - Product Card (image + name + serial + warranty badge)
 *        - Downloads (only public resources assigned to that product)
 *        - Registered Device (customer + warranty + purchase details)
 *        - Support (raise ticket, contact, WhatsApp)
 *   4. If not found: amber card "No registered device found" + Contact QBIT
 *   5. If invalid format: red card "Invalid Serial Number"
 *
 * No page reload. No popup. No external redirect. No model-number search.
 * Inspired by HP Support Assistant / Dell SupportAssist / Lenovo / Epson.
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

interface LookupResponse {
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

const WHATSAPP_NUMBER = "919876543210"; // QBIT Support WhatsApp

// ====================== Component ======================
export function CustomerPortal() {
  const [serial, setSerial] = useState("");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Shared lookup logic — used by BOTH the manual serial-number search
  // AND the Hardware Scanner flow. Both methods call the SAME API and
  // render the SAME result page (no duplicate logic, no separate APIs).
  async function performLookup(serialToSearch: string) {
    const trimmed = serialToSearch.trim();
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

  // Manual serial-number search → calls shared performLookup.
  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    await performLookup(serial);
  }

  // Hardware Scanner flow: simulate USB detection → read serial → call
  // the SAME performLookup → render the SAME result page.
  // Flow: Detect USB Device → Read Serial Number → Call Device Lookup API →
  //       Open Existing Result Screen.
  async function handleLaunchScanner() {
    setScanning(true);
    // Simulate USB detection sequence (3 seconds total in demo mode).
    // In production, this would use WebUSB / a desktop agent to detect
    // the connected QBIT device and read its serial number.
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setScanning(false);
    // Auto-fill serial number (in production this comes from the USB
    // device; for demo we use SNQBT000003).
    const detectedSerial = "SNQBT000003";
    setSerial(detectedSerial);
    // Trigger existing lookup flow — same API, same result page.
    await performLookup(detectedSerial);
  }

  function handleReset() {
    setState("idle");
    setResult(null);
    setSerial("");
    inputRef.current?.focus();
  }

  function fillExample(s: string) {
    setSerial(s);
    setState("idle");
    setResult(null);
  }

  // Smooth-scroll the result into view when state changes
  useEffect(() => {
    if (state === "idle") return;
    if (!resultRef.current) return;
    const t = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div className="w-full">
      {/* ===== Two Equal Options: Hardware Scanner (left) | Serial Number (right) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT: Launch Hardware Scanner (auto USB detection) */}
        {scanning ? (
          <ScanningCard />
        ) : (
          <HardwareScannerCard onLaunch={handleLaunchScanner} disabled={state === "searching"} />
        )}

        {/* RIGHT: Existing Serial Number Search (unchanged design) */}
        {/* ===== Search Card ===== */}
        <section className="rounded-3xl border border-qbit-outline-variant bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-qbit-primary/10 px-3 py-1 text-xs font-semibold text-qbit-primary mb-3">
            <span className="material-symbols-outlined text-[14px]">fingerprint</span>
            Customer Device Portal
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface sm:text-3xl">
            Enter your Device Serial Number
          </h2>
          <p className="mt-2 text-sm text-qbit-on-surface-variant">
            Find drivers, manuals, warranty status, and support resources for your registered QBIT device.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[24px] text-qbit-primary">
              fingerprint
            </span>
            <input
              ref={inputRef}
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="Enter your Device Serial Number (e.g. SNQBT000001)"
              aria-label="Serial Number"
              className="w-full rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest py-4 pl-14 pr-44 text-sm text-qbit-on-surface shadow-sm transition-all placeholder:text-qbit-on-surface-variant/70 focus:border-qbit-primary focus:outline-none focus:ring-2 focus:ring-qbit-primary/30 md:text-base"
              autoComplete="off"
              spellCheck={false}
              autoFocus
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

        {/* QR scan hint */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-qbit-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
            Or scan the QR code on your device sticker
          </span>
        </div>

        {/* Example serial chips */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-qbit-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lightbulb</span>
            Demo:
          </span>
          {EXAMPLE_SERIALS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => fillExample(s)}
              className="rounded-md border border-dashed border-qbit-outline-variant bg-qbit-surface-container-lowest px-2.5 py-1 font-mono text-[11px] text-qbit-on-surface-variant hover:border-qbit-primary hover:text-qbit-primary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        </section>
      </div>

      {/* ===== Result Area ===== */}
      <div ref={resultRef} className="mt-6 scroll-mt-24">
        {state === "searching" && <SearchingCard />}

        {state === "found" && result?.device && (
          <PortalResult
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

// ====================== Result Card ======================
function PortalResult({
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
      {/* ===== 1. Product Card (header with image + name + serial + warranty badge) ===== */}
      <section className="overflow-hidden rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-12">
          {/* Image */}
          <div className="sm:col-span-3">
            <div className="aspect-square overflow-hidden rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low">
              {device.productImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={device.productImage} alt={device.productName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="material-symbols-outlined text-[80px] text-qbit-primary/40">inventory_2</span>
                </div>
              )}
            </div>
          </div>
          {/* Identity */}
          <div className="sm:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-qbit-primary">{device.brand ?? "QBIT"}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-qbit-on-surface">{device.productName}</h2>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Model</p>
                <p className="font-mono font-medium text-qbit-on-surface">{device.modelNumber}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Serial Number</p>
                <p className="font-mono font-medium text-qbit-on-surface">{device.serialNumber}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Category</p>
                <p className="font-medium text-qbit-on-surface">{prettyCategory(device.category)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Status</p>
                <p className="font-medium text-qbit-on-surface">{prettyStatus(device.deviceStatus)}</p>
              </div>
            </div>
            {resources?.productPageUrl && (
              <Link
                href={resources.productPageUrl}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline"
              >
                View full product page
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            )}
          </div>
          {/* Warranty badge (compact) */}
          <div className="sm:col-span-3">
            <CompactWarrantyBadge warranty={warranty} />
          </div>
        </div>
      </section>

      {/* ===== 2. Warranty Card (premium, progress bar, large remaining days) ===== */}
      <WarrantyPremiumCard warranty={warranty} />

      {/* ===== 3. Downloads ===== */}
      <section className="rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
        <SectionHeader icon="download" title="Downloads" subtitle="Public resources assigned to this product" />
        <div className="p-6">
          {/* Public media files (RBAC-filtered at API level — engineer/admin files already stripped) */}
          {resources?.mediaFiles && resources.mediaFiles.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resources.mediaFiles.map((m) => (
                <DownloadTile
                  key={m.id}
                  icon={iconForMedia(m.type)}
                  label={m.title}
                  sub={subForMedia(m.type, resources)}
                  url={m.url}
                  color={colorForMedia(m.type)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-qbit-on-surface-variant">No public downloads available for this product.</p>
          )}

          {/* Legacy product-level URL downloads (fallback if no media files) */}
          {(!resources?.mediaFiles || resources.mediaFiles.length === 0) && resources && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resources.driverDownloadUrl && (
                <DownloadTile
                  icon="memory"
                  label="Windows Driver"
                  sub={resources.latestDriverVersion ?? undefined}
                  url={resources.driverDownloadUrl}
                  color="bg-qbit-primary/10 text-qbit-primary"
                />
              )}
              {resources.manualUrl && (
                <DownloadTile
                  icon="menu_book"
                  label="User Manual"
                  url={resources.manualUrl}
                  color="bg-qbit-tertiary/10 text-qbit-tertiary"
                />
              )}
              {resources.installationGuideUrl && (
                <DownloadTile
                  icon="menu_book"
                  label="Installation Guide"
                  url={resources.installationGuideUrl}
                  color="bg-qbit-tertiary/10 text-qbit-tertiary"
                />
              )}
              {resources.utilityUrl && (
                <DownloadTile
                  icon="build"
                  label="Software Utility"
                  url={resources.utilityUrl}
                  color="bg-qbit-secondary/10 text-qbit-secondary"
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===== 4. Registered Device (Customer + Purchase) ===== */}
      <section className="rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
        <SectionHeader icon="person_pin" title="Registered Device" subtitle="Customer and purchase information" />
        <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow label="Customer Name" value={customer?.name ?? "—"} />
          <InfoRow label="Company Name" value={customer?.companyName ?? "—"} />
          <InfoRow label="Mobile Number" value={customer?.mobileNumber ?? "—"} mono />
          <InfoRow label="Email" value={customer?.email ?? "—"} mono />
          <InfoRow label="City" value={customer?.city ?? "—"} />
          <InfoRow label="State" value={customer?.state ?? "—"} />
          <InfoRow label="Purchase Date" value={prettyDate(device.purchaseDate)} />
          <InfoRow label="Registration Date" value={prettyDate(device.registrationDate)} />
          <InfoRow label="Dealer Name" value={device.dealerName ?? "—"} />
          <InfoRow label="Warranty Status" value={prettyWarrantyStatus(warranty?.status)} />
          <InfoRow label="Warranty Expiry" value={prettyDate(warranty?.endDate ?? null)} />
          <InfoRow
            label="Remaining Days"
            value={warranty?.remainingDays !== null && warranty?.remainingDays !== undefined ? `${warranty.remainingDays} days` : "—"}
          />
        </div>
      </section>

      {/* ===== 5. Support ===== */}
      <section className="rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
        <SectionHeader icon="support_agent" title="Support" subtitle="Get help from QBIT Support team" />
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/support"
              className="group flex items-center gap-3 rounded-xl border border-qbit-primary/40 bg-qbit-primary/5 p-4 transition-all hover:border-qbit-primary hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
              </div>
              <div>
                <p className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">Raise Ticket</p>
                <p className="text-xs text-qbit-on-surface-variant">Open a support case</p>
              </div>
            </Link>
            <Link
              href="/contact"
              className="group flex items-center gap-3 rounded-xl border border-qbit-outline-variant bg-white p-4 transition-all hover:border-qbit-primary/40 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-tertiary/10 text-qbit-tertiary">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <div>
                <p className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">Contact Support</p>
                <p className="text-xs text-qbit-on-surface-variant">Email & phone</p>
              </div>
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello QBIT Support, I need help with my device (Serial: " + device.serialNumber + ")")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-qbit-outline-variant bg-white p-4 transition-all hover:border-qbit-success/40 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-success/10 text-qbit-success">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </div>
              <div>
                <p className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-success">WhatsApp Support</p>
                <p className="text-xs text-qbit-on-surface-variant">Chat with us</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Reset CTA */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface-variant hover:bg-qbit-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          New Search
        </button>
      </div>
    </div>
  );
}

// ====================== Warranty Theme + Cards ======================

/**
 * warrantyTheme — color scheme for warranty cards based on remaining days.
 *
 * Thresholds (per user spec):
 *   🟢 Green  > 300 days remaining   → "Warranty Active"
 *   🟡 Yellow 200–299 days          → "Warranty Active"
 *   🟠 Orange 50–199 days           → "Warranty Expiring Soon"
 *   🔴 Red    < 50 days or expired  → "Warranty Expired"
 *
 * Unknown warranty → amber/warning theme.
 */
function warrantyTheme(warranty?: WarrantyInfo): {
  bg: string;
  text: string;
  border: string;
  bar: string;
  label: string;
  icon: string;
} {
  // Unknown warranty → amber/warning
  if (!warranty || warranty.status === "unknown") {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      bar: "bg-amber-500",
      label: "Warranty Unknown",
      icon: "help_outline",
    };
  }

  // Expired (0 days remaining)
  if (warranty.status === "expired" || (warranty.remainingDays ?? 0) === 0) {
    return {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      bar: "bg-red-600",
      label: "Warranty Expired",
      icon: "gpp_bad",
    };
  }

  const days = warranty.remainingDays ?? 0;

  // 🟢 Green: > 300 days remaining
  if (days > 300) {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      bar: "bg-emerald-600",
      label: "Warranty Active",
      icon: "verified_user",
    };
  }

  // 🟡 Yellow: 200–299 days remaining
  if (days >= 200) {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      bar: "bg-amber-500",
      label: "Warranty Active",
      icon: "verified_user",
    };
  }

  // 🟠 Orange: 50–199 days remaining
  if (days >= 50) {
    return {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      bar: "bg-orange-500",
      label: "Warranty Expiring Soon",
      icon: "schedule",
    };
  }

  // 🔴 Red: < 50 days remaining (still active but very close to expiry)
  return {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    bar: "bg-red-600",
    label: "Warranty Expiring Soon",
    icon: "warning",
  };
}

function CompactWarrantyBadge({ warranty }: { warranty?: WarrantyInfo }) {
  if (!warranty) return null;
  const t = warrantyTheme(warranty);
  const isExpired = warranty.status === "expired";

  return (
    <div className={`rounded-xl border ${t.border} ${t.bg} p-4 text-center`}>
      <span className={`material-symbols-outlined text-[32px] ${t.text}`}>{t.icon}</span>
      <p className={`mt-1 text-sm font-bold ${t.text}`}>{t.label}</p>
      {warranty.remainingDays !== null && (
        <p className="mt-0.5 text-[11px] text-qbit-on-surface-variant">
          {isExpired ? "Out of warranty" : `${warranty.remainingDays} days left`}
        </p>
      )}
    </div>
  );
}

function WarrantyPremiumCard({ warranty }: { warranty?: WarrantyInfo }) {
  if (!warranty) return null;
  const t = warrantyTheme(warranty);
  const isExpired = warranty.status === "expired";
  const isUnknown = warranty.status === "unknown";

  // Compute progress: how much of warranty period is used (0-100%)
  let progress = 0;
  if (warranty.startDate && warranty.endDate) {
    const start = new Date(warranty.startDate).getTime();
    const end = new Date(warranty.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const used = now - start;
    if (total > 0) {
      progress = Math.max(0, Math.min(100, (used / total) * 100));
    }
  }

  return (
    <section className={`overflow-hidden rounded-2xl border ${t.border} bg-white shadow-sm`}>
      <div className={`flex items-center justify-between gap-3 border-b ${t.border} ${t.bg} px-6 py-4`}>
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[22px] ${t.text}`}>{t.icon}</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">Warranty Card</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full ${t.bar} px-3 py-1 text-xs font-bold text-white`}>
          {t.label}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-3">
        {/* Large remaining days */}
        <div className="text-center sm:border-r sm:border-qbit-outline-variant/30">
          <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Remaining Days</p>
          {isUnknown ? (
            <p className="mt-2 text-sm font-semibold text-qbit-on-surface-variant">Unknown</p>
          ) : isExpired ? (
            <p className="mt-2 text-5xl font-bold text-red-600">0</p>
          ) : (
            <p className={`mt-2 text-5xl font-bold ${t.text}`}>{warranty.remainingDays}</p>
          )}
          <p className="mt-1 text-xs text-qbit-on-surface-variant">days</p>
        </div>

        {/* Timeline */}
        <div className="sm:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Start Date</p>
              <p className="mt-1 text-sm font-semibold text-qbit-on-surface">{prettyDate(warranty.startDate)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">End Date</p>
              <p className="mt-1 text-sm font-semibold text-qbit-on-surface">{prettyDate(warranty.endDate)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">
              <span>Start</span>
              <span>{Math.round(progress)}% used</span>
              <span>End</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-qbit-surface-container-high">
              <div
                className={`absolute left-0 top-0 h-full ${t.bar} transition-all duration-700`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Renew CTA if expired */}
          {isExpired && (
            <Link
              href="/support"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-qbit-primary px-4 py-2 text-xs font-semibold text-qbit-primary hover:bg-qbit-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">renew</span>
              Renew Warranty
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ====================== Hardware Scanner Card (Left Column) ======================

/**
 * HardwareScannerCard — LEFT card on the /dr-qbit page.
 *
 * For users who have connected a QBIT printer/POS machine/barcode scanner
 * via USB. When clicked, triggers the USB detection flow which:
 *   1. Detects the connected USB device
 *   2. Reads the device's serial number
 *   3. Calls the SAME Device Lookup API as the manual serial-number search
 *   4. Renders the SAME existing result page
 *
 * No duplicate logic, no separate API, no separate result layout.
 */
function HardwareScannerCard({
  onLaunch,
  disabled,
}: {
  onLaunch: () => void;
  disabled?: boolean;
}) {
  const features = [
    "Detect USB Hardware Automatically",
    "Read Device Serial Number",
    "Auto Identify Product",
    "One Click Driver Detection",
    "Firmware Detection",
    "Warranty Lookup",
    "Customer Registration Lookup",
    "Works with Chrome & Edge",
  ];

  return (
    <section className="rounded-3xl border border-qbit-outline-variant bg-white p-6 shadow-lg sm:p-8">
      {/* Header */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-qbit-primary/10 px-3 py-1 text-xs font-semibold text-qbit-primary mb-2">
          <span className="material-symbols-outlined text-[14px]">memory</span>
          Hardware Scanner
        </div>
        <h3 className="text-xl font-bold tracking-tight text-qbit-on-surface sm:text-2xl">
          Launch Hardware Scanner
        </h3>
        <p className="mt-1 text-xs font-medium text-qbit-on-surface-variant">
          Auto Detect via Desktop Agent
        </p>
      </div>

      {/* Description */}
      <p className="text-sm text-qbit-on-surface-variant mb-4">
        Connect your QBIT printer, POS machine or barcode scanner using USB.
        Dr. QBIT will automatically detect the hardware, read its serial number,
        identify the device, and display drivers, manuals, firmware, warranty
        status and customer registration details.
      </p>

      {/* Features list */}
      <ul className="space-y-1.5 mb-5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-qbit-on-surface">
            <span className="material-symbols-outlined text-[16px] text-qbit-success mt-0.5">check_circle</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Launch button */}
      <button
        type="button"
        onClick={onLaunch}
        disabled={disabled}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-qbit-primary px-6 py-3 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[20px]">memory</span>
        Launch Hardware Scanner
      </button>
    </section>
  );
}

/**
 * ScanningCard — shown while the hardware scanner is detecting USB devices.
 * Displays an animated 3-step progress:
 *   1. Detecting USB connection
 *   2. Reading device serial number
 *   3. Identifying product
 *
 * After 3 seconds, the parent component stops showing this card and
 * triggers performLookup with the detected serial.
 */
function ScanningCard() {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: "usb", label: "Detecting USB connection…" },
    { icon: "fingerprint", label: "Reading device serial number…" },
    { icon: "inventory_2", label: "Identifying product…" },
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1000);
    const t2 = setTimeout(() => setStep(2), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <section className="rounded-3xl border border-qbit-primary/30 bg-qbit-primary/5 p-6 shadow-lg sm:p-8">
      {/* Header */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-qbit-primary/10 px-3 py-1 text-xs font-semibold text-qbit-primary mb-2">
          <span className="material-symbols-outlined text-[14px] animate-pulse">memory</span>
          Hardware Scanner
        </div>
        <h3 className="text-xl font-bold tracking-tight text-qbit-on-surface sm:text-2xl">
          Scanning USB Devices…
        </h3>
        <p className="mt-1 text-xs font-medium text-qbit-on-surface-variant">
          Dr. QBIT is detecting your connected hardware
        </p>
      </div>

      {/* Animated scanner */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-qbit-primary/15 mb-4">
          <span className="material-symbols-outlined text-[48px] text-qbit-primary animate-pulse">memory</span>
          <div className="absolute inset-0 rounded-full border-4 border-qbit-primary/20 border-t-qbit-primary animate-spin" />
        </div>
      </div>

      {/* Progress steps */}
      <div className="space-y-2.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 text-sm">
            <span
              className={`material-symbols-outlined text-[20px] ${
                i < step ? "text-qbit-success" : i === step ? "text-qbit-primary animate-pulse" : "text-qbit-on-surface-variant/40"
              }`}
            >
              {i < step ? "check_circle" : s.icon}
            </span>
            <span
              className={
                i < step
                  ? "text-qbit-on-surface line-through"
                  : i === step
                    ? "text-qbit-on-surface font-semibold"
                    : "text-qbit-on-surface-variant/60"
              }
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-qbit-on-surface-variant">
        Please keep your device connected…
      </p>
    </section>
  );
}

// ====================== Edge case cards ======================

function SearchingCard() {
  return (
    <div className="animate-fade-in rounded-3xl border border-qbit-outline-variant bg-white p-12 text-center shadow-sm">
      <span className="material-symbols-outlined mx-auto animate-spin text-[48px] text-qbit-primary">
        progress_activity
      </span>
      <p className="mt-4 text-base font-semibold text-qbit-on-surface">Searching Device Registration Database…</p>
      <p className="mt-1 text-sm text-qbit-on-surface-variant">
        Looking up serial number across all registered devices
      </p>
    </div>
  );
}

function NotFoundCard({ serial, onReset }: { serial: string; onReset: () => void }) {
  return (
    <div className="animate-fade-in-up rounded-3xl border border-qbit-warning/30 bg-qbit-warning/5 p-8 text-center shadow-sm md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-qbit-warning/15 text-qbit-warning">
        <span className="material-symbols-outlined text-[36px]">search_off</span>
      </div>
      <h3 className="mt-4 text-xl font-bold text-qbit-on-surface">No registered device found</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-qbit-on-surface-variant">
        No registered device found with this Serial Number
        <span className="mx-1 font-mono text-qbit-on-surface">"{serial}"</span>.
      </p>
      <p className="mt-1 text-xs text-qbit-on-surface-variant">
        Please verify your Serial Number or contact QBIT Support.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
          Contact QBIT Support
        </Link>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-5 py-2.5 text-sm font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
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
    <div className="animate-fade-in-up rounded-3xl border border-qbit-error/30 bg-qbit-error/5 p-8 text-center shadow-sm md:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-qbit-error/15 text-qbit-error">
        <span className="material-symbols-outlined text-[36px]">error</span>
      </div>
      <h3 className="mt-4 text-xl font-bold text-qbit-on-surface">Invalid Serial Number</h3>
      <p className="mt-2 text-sm text-qbit-on-surface-variant">
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
    <div className="animate-fade-in-up rounded-3xl border border-qbit-error/30 bg-qbit-error/5 p-8 text-center shadow-sm md:p-12">
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

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-qbit-outline-variant/50 px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-qbit-primary">{icon}</span>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">{title}</h3>
          {subtitle && <p className="text-[10px] text-qbit-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
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

function DownloadTile({
  icon, label, sub, url, color,
}: {
  icon: string;
  label: string;
  sub?: string;
  url: string | null;
  color: string;
}) {
  if (!url) {
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

  const isInternal = url.startsWith("/");
  const cls = `group flex items-center gap-3 rounded-xl border border-qbit-outline-variant bg-white p-4 transition-all hover:border-qbit-primary/40 hover:shadow-md`;

  if (isInternal) {
    return (
      <Link href={url} className={cls}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">{label}</p>
          {sub && <p className="text-xs text-qbit-on-surface-variant">{sub}</p>}
        </div>
        <span className="material-symbols-outlined text-[18px] text-qbit-on-surface-variant group-hover:text-qbit-primary">arrow_forward</span>
      </Link>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">{label}</p>
        {sub && <p className="text-xs text-qbit-on-surface-variant">{sub}</p>}
      </div>
      <span className="material-symbols-outlined text-[18px] text-qbit-on-surface-variant group-hover:text-qbit-primary">download</span>
    </a>
  );
}

function iconForMedia(type: string): string {
  if (type === "driver") return "memory";
  if (type === "firmware") return "upgrade";
  if (type === "manual") return "menu_book";
  if (type === "utility") return "build";
  if (type === "sdk") return "code";
  if (type === "brochure") return "picture_as_pdf";
  if (type === "datasheet") return "article";
  if (type === "warranty") return "verified_user";
  return "attach_file";
}

function colorForMedia(type: string): string {
  if (type === "driver") return "bg-qbit-primary/10 text-qbit-primary";
  if (type === "firmware") return "bg-qbit-secondary/10 text-qbit-secondary";
  if (type === "manual") return "bg-qbit-tertiary/10 text-qbit-tertiary";
  if (type === "utility") return "bg-qbit-secondary/10 text-qbit-secondary";
  if (type === "sdk") return "bg-qbit-primary/10 text-qbit-primary";
  if (type === "brochure") return "bg-qbit-error/10 text-qbit-error";
  if (type === "datasheet") return "bg-qbit-primary/10 text-qbit-primary";
  if (type === "warranty") return "bg-qbit-success/10 text-qbit-success";
  return "bg-qbit-surface-container-high text-qbit-on-surface-variant";
}

function subForMedia(type: string, resources?: ResourcesInfo | null): string | undefined {
  if (type === "driver") return resources?.latestDriverVersion ?? "Latest version";
  if (type === "firmware") return resources?.latestFirmwareVersion ?? "Latest firmware";
  if (type === "manual") return "PDF document";
  if (type === "utility") return "Configuration tool";
  if (type === "sdk") return "Developer kit";
  if (type === "brochure") return "Product brochure";
  if (type === "datasheet") return "Technical specifications";
  if (type === "warranty") return "Warranty terms";
  return undefined;
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
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyCategory(c: string | null | undefined): string {
  if (!c) return "—";
  return c.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyWarrantyStatus(s: string | null | undefined): string {
  if (!s) return "Unknown";
  if (s === "active") return "Active";
  if (s === "expired") return "Expired";
  if (s === "expiring_soon") return "Expiring Soon";
  return "Unknown";
}
