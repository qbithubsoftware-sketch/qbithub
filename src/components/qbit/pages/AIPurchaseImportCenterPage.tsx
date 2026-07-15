"use client";

/**
 * DeviceLookupCenterPage — Enterprise Device Lookup Center.
 *
 * Renamed from "AI Product Import Center" to "Device Lookup Center".
 *
 * Purpose: Enter a Serial Number → instantly view complete device details
 * including customer, warranty, drivers, manuals, installation info, QR,
 * and quick actions.
 *
 * Reuses the EXACT same UI pattern (AppShell + cards + tables + dialogs).
 * Visible ONLY to super_administrator + administrator.
 */

import { useCallback, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/hooks/use-toast";

interface DeviceLookupResult {
  found: boolean;
  source?: string;
  message?: string;
  device?: {
    productName: string;
    modelNumber: string;
    brand: string | null;
    category: string | null;
    deviceType: string | null;
    productImage: string | null;
    deviceStatus: string;
    serialNumber: string;
    qrCode: string | null;
  };
  customer?: {
    name: string;
    companyName: string | null;
    mobileNumber: string;
    email: string | null;
    gstNumber: string | null;
    address: string | null;
  };
  warranty?: {
    status: string;
    startDate: string | null;
    endDate: string | null;
    remainingDays: number | null;
    period: string | null;
  };
  drivers?: {
    driverDownloadUrl: string | null;
    manualUrl: string | null;
    brochureUrl: string | null;
    datasheetUrl: string | null;
    warrantyUrl: string | null;
    sdkUrl: string | null;
    utilityUrl: string | null;
    installationGuideUrl: string | null;
    knowledgeBaseUrl: string | null;
    latestDriverVersion: string | null;
    latestFirmwareVersion: string | null;
    mediaFiles: Array<{ id: string; type: string; title: string; url: string; mimeType: string | null }>;
  } | null;
  installation?: {
    installationDate: string | null;
    installedBy: string | null;
    lastServiceDate: string | null;
    amcStatus: string;
    firmwareVersion: string | null;
    driverVersion: string | null;
  };
  installationResources?: {
    instructions: string | null;
    requiredSoftware: string | null;
    requiredDrivers: string | null;
    requiredAccessories: string | null;
    installationTime: string | null;
    difficultyLevel: string | null;
  } | null;
  specifications: Array<{ property: string; value: string; group: string | null }>;
  purchase?: {
    purchaseId: string;
    invoiceNumber: string | null;
    purchaseDate: string | null;
    dealerName: string | null;
    totalAmount: number | null;
  };
}

type LookupState = "idle" | "searching" | "found" | "not-found" | "error";

export function AIPurchaseImportCenterPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [serialInput, setSerialInput] = useState("");
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [result, setResult] = useState<DeviceLookupResult | null>(null);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!serialInput.trim()) {
      toast({ title: "Please enter a serial number", variant: "destructive" });
      return;
    }

    setLookupState("searching");
    setResult(null);

    try {
      const res = await fetch(`/api/admin/device-lookup?serialNumber=${encodeURIComponent(serialInput.trim())}`, { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Lookup failed");
      }
      const data: DeviceLookupResult = await res.json();

      if (data.found) {
        setResult(data);
        setLookupState("found");
        toast({ title: "Device found!", description: `${data.device?.productName} — S/N: ${data.device?.serialNumber}` });
      } else {
        setResult(data);
        setLookupState("not-found");
      }
    } catch (e) {
      setLookupState("error");
      toast({ title: "Lookup failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }

  function handleReset() {
    setLookupState("idle");
    setResult(null);
    setSerialInput("");
  }

  function handleCopyDetails() {
    if (!result?.device) return;
    const details = [
      `Product: ${result.device.productName}`,
      `Model: ${result.device.modelNumber}`,
      `Serial: ${result.device.serialNumber}`,
      result.customer ? `Customer: ${result.customer.name}` : "",
      result.customer ? `Mobile: ${result.customer.mobileNumber}` : "",
      result.warranty ? `Warranty: ${result.warranty.status}` : "",
    ].filter(Boolean).join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(details);
      toast({ title: "Device details copied!" });
    }
  }

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Device Lookup", icon: "search" }}
      navItems={ADMIN_NAV}
      activeScreen="ai-purchase-center"
      user={{ name: userName, role: "Administrator", initials }}
      cta={{ label: "Reset", icon: "refresh", onClick: handleReset }}
      topBar={{ searchPlaceholder: "Search devices…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-qbit-on-surface">
            <Icon name="search" className="text-[28px] text-qbit-primary" />
            Device Lookup Center
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Enter a Serial Number to instantly view complete device details — customer, warranty, drivers, manuals, installation info, and more.
          </p>
        </div>

        {/* Search box */}
        <SurfaceCard className="p-6">
          <form onSubmit={handleLookup} className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                Serial Number
              </label>
              <div className="relative">
                <Icon name="fingerprint" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-qbit-on-surface-variant" />
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  placeholder="Enter Serial Number (e.g. DEMO-T800-001)"
                  className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-lowest py-3 pl-11 pr-4 text-sm text-qbit-on-surface focus:border-qbit-primary focus:outline-none focus:ring-2 focus:ring-qbit-primary/30"
                  autoFocus
                />
              </div>
            </div>
            <QbitButton
              type="submit"
              variant="primary"
              size="lg"
              icon={lookupState === "searching" ? "progress_activity" : "search"}
              disabled={lookupState === "searching"}
            >
              {lookupState === "searching" ? "Searching…" : "Lookup Device"}
            </QbitButton>
          </form>
          {/* Quick examples */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-qbit-on-surface-variant">Try:</span>
            {["DEMO-T800-001", "DEMO-CD410-002", "DEMO-SME1-003"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setSerialInput(s); }}
                className="rounded-md border border-dashed border-qbit-outline-variant px-2 py-1 text-xs font-mono text-qbit-on-surface-variant hover:border-qbit-primary hover:text-qbit-primary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </SurfaceCard>

        {/* ===== SEARCHING state ===== */}
        {lookupState === "searching" && (
          <div className="rounded-2xl border border-qbit-outline-variant bg-white p-12 text-center shadow-sm">
            <Icon name="progress_activity" className="mx-auto animate-spin text-[40px] text-qbit-primary" />
            <p className="mt-4 text-sm font-medium text-qbit-on-surface">Searching device registry…</p>
            <p className="mt-1 text-xs text-qbit-on-surface-variant">Looking up serial number across all records</p>
          </div>
        )}

        {/* ===== NOT FOUND ===== */}
        {lookupState === "not-found" && (
          <div className="rounded-2xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
            <Icon name="search_off" className="mx-auto text-[48px] text-qbit-on-surface-variant/40" />
            <p className="mt-3 text-sm font-medium text-qbit-on-surface">No device found with this Serial Number.</p>
            <p className="mt-1 text-xs text-qbit-on-surface-variant">
              Check the serial number and try again, or register a new purchase via the Product Master.
            </p>
            <QbitButton variant="outline" size="sm" icon="refresh" className="mt-4" onClick={handleReset}>
              New Lookup
            </QbitButton>
          </div>
        )}

        {/* ===== ERROR ===== */}
        {lookupState === "error" && (
          <div className="rounded-2xl border border-qbit-error/30 bg-qbit-error/5 p-8 text-center">
            <Icon name="error" className="mx-auto text-[40px] text-qbit-error" />
            <p className="mt-3 text-sm font-medium text-qbit-on-surface">Lookup failed.</p>
            <QbitButton variant="outline" size="sm" icon="refresh" className="mt-4" onClick={handleReset}>
              Try Again
            </QbitButton>
          </div>
        )}

        {/* ===== FOUND — full device details ===== */}
        {lookupState === "found" && result && result.device && (
          <div className="space-y-5">
            {/* Success banner */}
            <div className="flex items-center justify-between rounded-2xl border border-qbit-success/30 bg-qbit-success/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-qbit-success/15 text-qbit-success">
                  <Icon name="check_circle" className="text-[22px]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-qbit-on-surface">Device Found</p>
                  <p className="text-xs text-qbit-on-surface-variant">Source: {result.source === "purchase-record" ? "Purchase Database" : "Asset Registry"} · S/N: {result.device.serialNumber}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <QbitButton variant="ghost" size="sm" icon="content_copy" onClick={handleCopyDetails}>Copy Details</QbitButton>
                <QbitButton variant="ghost" size="sm" icon="refresh" onClick={handleReset}>New Lookup</QbitButton>
              </div>
            </div>

            {/* Device Information + Image */}
            <SurfaceCard className="overflow-hidden">
              <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
                <div className="md:col-span-1">
                  <div className="aspect-square overflow-hidden rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low">
                    {result.device.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={result.device.productImage} alt={result.device.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon name="inventory_2" className="text-[80px] text-qbit-primary/40" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-qbit-primary">
                    <Icon name="info" className="text-[16px]" /> Device Information
                  </h3>
                  <h2 className="text-2xl font-bold text-qbit-on-surface">{result.device.productName}</h2>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <InfoRow label="Model" value={result.device.modelNumber} />
                    <InfoRow label="Brand" value={result.device.brand ?? "—"} />
                    <InfoRow label="Category" value={result.device.category?.replace(/-/g, " ") ?? "—"} />
                    <InfoRow label="Serial Number" value={result.device.serialNumber} mono />
                    <InfoRow label="Device Type" value={result.device.deviceType?.replace(/_/g, " ") ?? "—"} />
                    <InfoRow label="Status" value={result.device.deviceStatus} />
                  </div>
                </div>
              </div>
            </SurfaceCard>

            {/* Customer + Warranty (side by side) */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Customer */}
              {result.customer && (
                <SurfaceCard className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
                    <Icon name="person" className="text-[20px] text-qbit-primary" /> Customer Information
                  </h3>
                  <div className="space-y-2">
                    <InfoRow label="Customer Name" value={result.customer.name} />
                    <InfoRow label="Company" value={result.customer.companyName ?? "—"} />
                    <InfoRow label="Mobile Number" value={result.customer.mobileNumber} />
                    <InfoRow label="Email" value={result.customer.email ?? "—"} />
                    <InfoRow label="GST Number" value={result.customer.gstNumber ?? "—"} />
                    <InfoRow label="Address" value={result.customer.address ?? "—"} />
                  </div>
                </SurfaceCard>
              )}

              {/* Warranty */}
              {result.warranty && (
                <SurfaceCard className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
                    <Icon name="verified_user" className="text-[20px] text-qbit-primary" /> Warranty
                  </h3>
                  <div className="mb-4">
                    <StatusBadge
                      variant={
                        result.warranty.status === "active" ? "success"
                        : result.warranty.status === "expired" ? "error"
                        : result.warranty.status === "expiring_soon" ? "warning"
                        : "neutral"
                      }
                      dot
                    >
                      {result.warranty.status === "active" ? "Active"
                        : result.warranty.status === "expired" ? "Expired"
                        : result.warranty.status === "expiring_soon" ? "Expiring Soon"
                        : "Unknown"}
                      {result.warranty.remainingDays !== null && result.warranty.status !== "expired" && ` · ${result.warranty.remainingDays} days left`}
                    </StatusBadge>
                  </div>
                  <div className="space-y-2">
                    <InfoRow label="Warranty Period" value={result.warranty.period ?? "—"} />
                    <InfoRow label="Start Date" value={result.warranty.startDate ? new Date(result.warranty.startDate).toLocaleDateString("en-IN") : "—"} />
                    <InfoRow label="Expiry Date" value={result.warranty.endDate ? new Date(result.warranty.endDate).toLocaleDateString("en-IN") : "—"} />
                    <InfoRow label="Remaining Days" value={result.warranty.remainingDays !== null ? `${result.warranty.remainingDays} days` : "—"} />
                  </div>
                </SurfaceCard>
              )}
            </div>

            {/* Driver Downloads */}
            {result.drivers && (
              <SurfaceCard className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
                  <Icon name="download" className="text-[20px] text-qbit-primary" /> Driver Downloads
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DownloadCard label="Driver" version={result.drivers.latestDriverVersion} url={result.drivers.driverDownloadUrl} icon="memory" color="bg-qbit-primary/10 text-qbit-primary" />
                  <DownloadCard label="Firmware" version={result.drivers.latestFirmwareVersion} url={null} icon="upgrade" color="bg-qbit-secondary/10 text-qbit-secondary" />
                  <DownloadCard label="SDK" url={result.drivers.sdkUrl} icon="code" color="bg-qbit-primary/10 text-qbit-primary" />
                  <DownloadCard label="Utility" url={result.drivers.utilityUrl} icon="build" color="bg-qbit-secondary/10 text-qbit-secondary" />
                  {result.drivers.mediaFiles
                    .filter((m) => ["driver", "firmware", "sdk", "utility"].includes(m.type))
                    .map((m) => (
                      <DownloadCard key={m.id} label={m.title} url={m.url} icon="attach_file" color="bg-qbit-surface-container-high text-qbit-on-surface-variant" />
                    ))}
                </div>
              </SurfaceCard>
            )}

            {/* Documents */}
            {result.drivers && (
              <SurfaceCard className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
                  <Icon name="description" className="text-[20px] text-qbit-primary" /> Documents
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DownloadCard label="User Manual" url={result.drivers.manualUrl} icon="menu_book" color="bg-qbit-tertiary/10 text-qbit-tertiary" />
                  <DownloadCard label="Datasheet" url={result.drivers.datasheetUrl} icon="article" color="bg-qbit-primary/10 text-qbit-primary" />
                  <DownloadCard label="Brochure" url={result.drivers.brochureUrl} icon="picture_as_pdf" color="bg-qbit-error/10 text-qbit-error" />
                  <DownloadCard label="Warranty Card" url={result.drivers.warrantyUrl} icon="verified_user" color="bg-qbit-success/10 text-qbit-success" />
                  <DownloadCard label="Installation Guide" url={result.drivers.installationGuideUrl} icon="menu_book" color="bg-qbit-tertiary/10 text-qbit-tertiary" />
                  {result.drivers.mediaFiles
                    .filter((m) => ["brochure", "datasheet", "manual", "warranty"].includes(m.type))
                    .map((m) => (
                      <DownloadCard key={m.id} label={m.title} url={m.url} icon="attach_file" color="bg-qbit-surface-container-high text-qbit-on-surface-variant" />
                    ))}
                </div>
              </SurfaceCard>
            )}

            {/* Installation Resources */}
            {result.installation && (
              <SurfaceCard className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
                  <Icon name="build" className="text-[20px] text-qbit-primary" /> Installation & Service
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoRow label="Installation Date" value={result.installation.installationDate ? new Date(result.installation.installationDate).toLocaleDateString("en-IN") : "—"} />
                  <InfoRow label="Installed By" value={result.installation.installedBy ?? "—"} />
                  <InfoRow label="Last Service" value={result.installation.lastServiceDate ? new Date(result.installation.lastServiceDate).toLocaleDateString("en-IN") : "—"} />
                  <InfoRow label="AMC Status" value={result.installation.amcStatus} />
                  <InfoRow label="Firmware Version" value={result.installation.firmwareVersion ?? "—"} />
                  <InfoRow label="Driver Version" value={result.installation.driverVersion ?? "—"} />
                </div>
                {result.installationResources && (
                  <div className="mt-4 border-t border-qbit-outline-variant/50 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Installation Resources</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <InfoRow label="Install Time" value={result.installationResources.installationTime ?? "—"} />
                      <InfoRow label="Difficulty" value={result.installationResources.difficultyLevel ?? "—"} />
                      <InfoRow label="Required Software" value={result.installationResources.requiredSoftware ?? "—"} />
                    </div>
                    {result.installationResources.instructions && (
                      <div className="mt-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Instructions</p>
                        <p className="text-xs text-qbit-on-surface-variant whitespace-pre-line">{result.installationResources.instructions}</p>
                      </div>
                    )}
                  </div>
                )}
              </SurfaceCard>
            )}

            {/* Purchase info */}
            {result.purchase && (
              <SurfaceCard className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
                  <Icon name="receipt_long" className="text-[20px] text-qbit-primary" /> Purchase Information
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoRow label="Purchase ID" value={result.purchase.purchaseId} mono />
                  <InfoRow label="Invoice Number" value={result.purchase.invoiceNumber ?? "—"} />
                  <InfoRow label="Purchase Date" value={result.purchase.purchaseDate ? new Date(result.purchase.purchaseDate).toLocaleDateString("en-IN") : "—"} />
                  <InfoRow label="Dealer" value={result.purchase.dealerName ?? "—"} />
                  {result.purchase.totalAmount && (
                    <InfoRow label="Total Amount" value={`₹${result.purchase.totalAmount.toLocaleString("en-IN")}`} />
                  )}
                </div>
              </SurfaceCard>
            )}

            {/* Quick Actions */}
            <SurfaceCard className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
                <Icon name="flash_on" className="text-[20px] text-qbit-primary" /> Quick Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                {result.drivers?.driverDownloadUrl && (
                  <a href={result.drivers.driverDownloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-qbit-primary px-4 py-2 text-xs font-semibold text-qbit-on-primary hover:bg-qbit-primary-container">
                    <Icon name="download" className="text-[16px]" /> Download Driver
                  </a>
                )}
                {result.drivers?.manualUrl && (
                  <a href={result.drivers.manualUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low">
                    <Icon name="menu_book" className="text-[16px]" /> Download Manual
                  </a>
                )}
                {result.device.qrCode && (
                  <a href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(result.device.qrCode)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low">
                    <Icon name="qr_code" className="text-[16px]" /> View QR Code
                  </a>
                )}
                <button onClick={handleCopyDetails} className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low">
                  <Icon name="content_copy" className="text-[16px]" /> Copy Details
                </button>
                <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low">
                  <Icon name="print" className="text-[16px]" /> Print
                </button>
              </div>
            </SurfaceCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Helper sub-components                                               */
/* ------------------------------------------------------------------ */

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">{label}</p>
      <p className={`text-sm font-medium text-qbit-on-surface ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function DownloadCard({ label, version, url, icon, color }: { label: string; version?: string | null; url: string | null; icon: string; color: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-qbit-outline-variant bg-white p-4 transition-all hover:border-qbit-primary/30 hover:shadow-md">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon name={icon} className="text-[20px]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-qbit-on-surface">{label}</p>
        {version && <p className="text-xs text-qbit-on-surface-variant">{version}</p>}
      </div>
    </a>
  );
}
