"use client";

/**
 * DrQbitWorkflow — V3 Dr. QBIT diagnostic workflow.
 *
 * Replaces the old "Launch Scanner → /portal redirect" pattern with an
 * in-page workflow that stays inside /dr-qbit for all 3 modes.
 *
 * Modes (auto-detected from session):
 *   - Guest    (no login)     — public product info + downloads + basic diagnostics
 *   - Customer (logged in)    — guest fields + own warranty + own history
 *   - Engineer (logged in)    — customer fields + deep diagnostics + service tools
 *   - Admin    (logged in)    — engineer fields + management tools
 *
 * Flow:
 *   1. User enters a model number OR clicks "Launch Scanner"
 *   2. Scanner panel opens inline (no redirect, no page refresh)
 *   3. Loading animation + scan progress
 *   4. Results appear inline: device image, product name, model, category,
 *      OS, compatible driver, latest driver, firmware, manual, datasheet,
 *      brochure, videos, KB, downloads, support contact, related products
 *   5. Guest users see lock icons on warranty/history/customer-details fields.
 *      Clicking a locked field opens the LoginModal (NEVER redirects).
 *
 * SECURITY: Guest users never see customer name, mobile, purchase date,
 * invoice, warranty, installation/service history, engineer name, AMC,
 * registered device details, asset ID, QR activation, internal/admin notes.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { DrQbitLoginModal } from "./DrQbitLoginModal";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type DrQbitMode = "guest" | "customer" | "engineer" | "admin";
type ScanState = "idle" | "scanning" | "loading" | "complete" | "error" | "agent-required";

interface ScanResult {
  slug: string;
  name: string;
  brand: string;
  model: string;
  category: string | null;
  deviceType: string;
  description: string | null;
  longDescription: string | null;
  imageUrl: string | null;
  galleryImages: { url: string; alt: string }[];
  operatingSystems: { osName: string; osIcon?: string; minVersion?: string | null }[];
  latestDriverVersion: string | null;
  latestFirmwareVersion: string | null;
  driverDownloadUrl: string | null;
  manualUrl: string | null;
  brochureUrl: string | null;
  datasheetUrl: string | null;
  warrantyUrl: string | null;
  sdkUrl: string | null;
  utilityUrl: string | null;
  installationGuideUrl: string | null;
  knowledgeBaseUrl: string | null;
  videos: { title: string; url: string; provider?: string; externalId?: string }[];
  mediaFiles: { id: string; type: string; title: string; url: string; mimeType?: string | null }[];
  relatedProducts: { id: string; name: string; slug: string; brand: string; model: string; imageUrl: string | null }[];
  aiDiagnosticsSupported: boolean;
  drQbitSupported: boolean;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function DrQbitWorkflow() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<DrQbitMode>("guest");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [modelInput, setModelInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalField, setLoginModalField] = useState<string>("");

  // Determine mode from session
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setMode("guest");
      return;
    }
    const role = (session.user?.role as string) ?? "guest";
    if (role === "administrator" || role === "super_administrator") setMode("admin");
    else if (role === "installation_engineer") setMode("engineer");
    else setMode("customer");
  }, [session, status]);

  /* ----- Scan + Search handlers ----- */

  const runScan = useCallback(async (serialOrInput: string) => {
    setScanState("scanning");
    setScanProgress(0);
    setError(null);
    setResult(null);

    // Scan progress — real API calls provide actual progress
    const progressInterval = setInterval(() => {
      setScanProgress((p) => Math.min(p + 10, 90));
    }, 200);

    try {
      const input = serialOrInput.trim();

      // Step 1: Try Device Lookup by serial number (PurchaseRecord + FSMCustomerAsset)
      const deviceRes = await fetch(`/api/public/device-lookup?serialNumber=${encodeURIComponent(input)}`, { cache: "no-store" });

      if (deviceRes.ok) {
        const deviceData = await deviceRes.json();
        if (deviceData.found && deviceData.device) {
          // Device found by serial number — fetch full product details
          clearInterval(progressInterval);
          setScanProgress(100);

          // If device has a model number, fetch product details
          let productData = null;
          if (deviceData.device.modelNumber) {
            // Search product by model
            const searchRes = await fetch(`/api/public/search?q=${encodeURIComponent(deviceData.device.modelNumber)}&limit=1`, { cache: "no-store" });
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.items && searchData.items.length > 0) {
                const prodRes = await fetch(`/api/public/products/${encodeURIComponent(searchData.items[0].slug)}`, { cache: "no-store" });
                if (prodRes.ok) {
                  productData = (await prodRes.json()).product;
                }
              }
            }
          }

          // Build result from device lookup + product data
          setScanState("loading");
          setTimeout(() => {
            setResult({
              ...(productData ?? {
                id: "", name: deviceData.device.productName, brand: deviceData.device.brand ?? "QBIT",
                model: deviceData.device.modelNumber, slug: "", deviceType: "", category: deviceData.device.category ?? null,
                description: null, longDescription: null, imageUrl: deviceData.device.productImage,
                galleryImages: [], specifications: [], features: [], operatingSystems: [],
                videos: [], mediaFiles: [],
                driverDownloadUrl: deviceData.drivers?.driverDownloadUrl ?? null,
                manualUrl: deviceData.drivers?.manualUrl ?? null,
                brochureUrl: deviceData.drivers?.brochureUrl ?? null,
                datasheetUrl: deviceData.drivers?.datasheetUrl ?? null,
                warrantyUrl: deviceData.drivers?.warrantyUrl ?? null,
                sdkUrl: deviceData.drivers?.sdkUrl ?? null,
                utilityUrl: deviceData.drivers?.utilityUrl ?? null,
                installationGuideUrl: deviceData.drivers?.installationGuideUrl ?? null,
                knowledgeBaseUrl: null, qrCodeUrl: deviceData.device.qrCode,
                seoTitle: null, seoDescription: null,
                viewCount: 0, downloadCount: 0,
                aiDiagnosticsSupported: false, drQbitSupported: true,
                latestDriverVersion: deviceData.drivers?.latestDriverVersion ?? null,
                latestFirmwareVersion: deviceData.drivers?.latestFirmwareVersion ?? null,
                lastUpdated: new Date().toISOString(),
                relatedProducts: [],
              }),
              // Override with device-specific data
              name: deviceData.device.productName,
              model: deviceData.device.modelNumber,
              imageUrl: deviceData.device.productImage,
            });
            setScanState("complete");
          }, 600);
          return;
        }
      }

      // Step 2: Fallback — try product search by model/slug
      const query = input.toLowerCase().replace(/\s+/g, "-");
      let res = await fetch(`/api/public/products/${encodeURIComponent(query)}`, { cache: "no-store" });
      if (!res.ok) {
        const searchRes = await fetch(`/api/public/search?q=${encodeURIComponent(input)}&limit=1`, { cache: "no-store" });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.items && searchData.items.length > 0) {
            res = await fetch(`/api/public/products/${encodeURIComponent(searchData.items[0].slug)}`, { cache: "no-store" });
          }
        }
      }
      clearInterval(progressInterval);
      setScanProgress(100);

      if (!res.ok) {
        setScanState("error");
        setError("No device found with this Serial Number. Please check and try again.");
        return;
      }

      const data = await res.json();
      const product = data.product;
      if (!product) {
        setScanState("error");
        setError("No product found.");
        return;
      }

      // Small delay for the "loading" animation to feel real
      setScanState("loading");
      setTimeout(() => {
        setResult(product);
        setScanState("complete");
      }, 600);
    } catch (e) {
      clearInterval(progressInterval);
      setScanState("error");
      setError(e instanceof Error ? e.message : "Scan failed. Please try again.");
    }
  }, []);

  function handleLaunchScanner() {
    setScanState("scanning");
    setScanProgress(0);
    setError(null);
    setResult(null);

    // Animate scan progress
    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 5;
      });
    }, 100);

    // After 2.5s, show the "Desktop Agent Required" prompt (since we can't
    // actually run WebUSB in this SSR context without the agent installed).
    setTimeout(() => {
      clearInterval(interval);
      setScanProgress(100);
      setScanState("agent-required");
    }, 2500);
  }

  function handleManualSearch(e: React.FormEvent) {
    e.preventDefault();
    if (modelInput.trim()) {
      void runScan(modelInput.trim());
    }
  }

  function handleReset() {
    setScanState("idle");
    setScanProgress(0);
    setResult(null);
    setError(null);
    setModelInput("");
  }

  function handleLockedFieldClick(fieldName: string) {
    if (mode === "guest") {
      setLoginModalField(fieldName);
      setLoginModalOpen(true);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <>
      {/* ===== Mode badge ===== */}
      <div className="mb-6 flex justify-center">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          mode === "guest" ? "bg-qbit-surface-container-high text-qbit-on-surface-variant"
          : mode === "customer" ? "bg-qbit-primary/10 text-qbit-primary"
          : mode === "engineer" ? "bg-qbit-secondary/10 text-qbit-secondary"
          : "bg-qbit-error/10 text-qbit-error"
        }`}>
          <span className="material-symbols-outlined text-[14px]">
            {mode === "guest" ? "public" : mode === "customer" ? "account_circle" : mode === "engineer" ? "engineering" : "admin_panel_settings"}
          </span>
          {mode === "guest" ? "Guest Mode" : mode === "customer" ? "Customer Mode" : mode === "engineer" ? "Engineer Mode" : "Admin Mode"}
        </div>
      </div>

      {/* ===== IDLE: Two-option card ===== */}
      {scanState === "idle" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Option 1: Auto Detect */}
          <div className="rounded-2xl border border-qbit-outline-variant bg-white p-6 shadow-sm md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary/10 text-qbit-primary">
                <span className="material-symbols-outlined text-[28px]">memory</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-qbit-on-surface">Launch Scanner</h2>
                <p className="text-xs text-qbit-on-surface-variant">Auto-detect via Desktop Agent</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-qbit-on-surface-variant">
              Connect your QBIT device via USB and let Dr. QBIT scan it automatically.
              Identifies the model, fetches the right driver + firmware + manual.
            </p>
            <ul className="mb-6 space-y-2 text-xs text-qbit-on-surface-variant">
              {["Detects USB VID/PID automatically", "Reads serial number for warranty lookup", "One-click driver + firmware install", "Works in Chrome / Edge browsers"].map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-qbit-success">check_circle</span>
                  {feat}
                </li>
              ))}
            </ul>
            <QbitButton variant="primary" size="lg" fullWidth icon="play_arrow" onClick={handleLaunchScanner}>
              Launch Scanner
            </QbitButton>
          </div>

          {/* Option 2: Manual Search */}
          <div className="rounded-2xl border border-qbit-outline-variant bg-white p-6 shadow-sm md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-secondary/10 text-qbit-secondary">
                <span className="material-symbols-outlined text-[28px]">search</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-qbit-on-surface">Enter Serial Number</h2>
                <p className="text-xs text-qbit-on-surface-variant">Search by device serial number</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-qbit-on-surface-variant">
              Know your serial number? Type it below to instantly fetch all device information from the database.
            </p>
            <form onSubmit={handleManualSearch} className="relative mb-4">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-qbit-on-surface-variant">search</span>
              <input
                type="text"
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                placeholder="e.g. W55XXXXXXX, SN-001…"
                className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-lowest py-3 pl-12 pr-4 text-sm text-qbit-on-surface focus:border-qbit-primary focus:outline-none focus:ring-2 focus:ring-qbit-primary/30"
                autoFocus
              />
            </form>
            <div className="mb-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Try:</p>
              <div className="flex flex-wrap gap-2">
                {["SNQBT000001", "SNQBT000002", "SNQBT000003"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setModelInput(m); void runScan(m); }}
                    className="rounded-md border border-dashed border-qbit-outline-variant px-3 py-1 text-xs font-mono text-qbit-on-surface-variant hover:border-qbit-primary hover:text-qbit-primary transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <QbitButton
              variant="outline"
              size="lg"
              fullWidth
              icon="arrow_forward"
              disabled={!modelInput.trim()}
              onClick={() => void runScan(modelInput.trim())}
            >
              Search Device
            </QbitButton>
          </div>
        </div>
      )}

      {/* ===== SCANNING: progress animation ===== */}
      {scanState === "scanning" && (
        <div className="rounded-2xl border border-qbit-outline-variant bg-white p-8 text-center shadow-sm md:p-12">
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute inset-0 rounded-full border-4 border-qbit-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-qbit-primary border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-qbit-primary">memory</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-qbit-on-surface">Scanning hardware…</h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">Detecting connected USB/COM/LAN devices</p>
          <div className="mx-auto mt-6 max-w-md">
            <div className="h-2 overflow-hidden rounded-full bg-qbit-surface-container-high">
              <div
                className="h-full rounded-full bg-qbit-primary transition-all duration-200"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-qbit-primary">{scanProgress}%</p>
          </div>
        </div>
      )}

      {/* ===== LOADING: results fetch ===== */}
      {scanState === "loading" && (
        <div className="rounded-2xl border border-qbit-outline-variant bg-white p-8 text-center shadow-sm md:p-12">
          <Icon name="progress_activity" className="mx-auto animate-spin text-[40px] text-qbit-primary" />
          <h2 className="mt-4 text-lg font-bold text-qbit-on-surface">Fetching diagnostic data…</h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">Loading drivers, firmware, manuals, and videos</p>
        </div>
      )}

      {/* ===== AGENT REQUIRED ===== */}
      {scanState === "agent-required" && (
        <div className="rounded-2xl border border-qbit-warning/30 bg-qbit-warning/5 p-8 text-center md:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-qbit-warning/15 text-qbit-warning">
            <span className="material-symbols-outlined text-[36px]">download_for_offline</span>
          </div>
          <h2 className="text-xl font-bold text-qbit-on-surface">Desktop Agent Required</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-qbit-on-surface-variant">
            To auto-detect your hardware, please install the QBIT Desktop Agent on your computer.
            Or continue with manual model search below.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <QbitButton variant="primary" icon="download" onClick={() => window.open("/downloads?type=utility", "_blank")}>
              Download Desktop Agent
            </QbitButton>
            <QbitButton variant="outline" icon="search" onClick={handleReset}>
              Continue Manual Search
            </QbitButton>
          </div>
        </div>
      )}

      {/* ===== ERROR ===== */}
      {scanState === "error" && (
        <div className="rounded-2xl border border-qbit-error/30 bg-qbit-error/5 p-8 text-center md:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-qbit-error/15 text-qbit-error">
            <span className="material-symbols-outlined text-[36px]">error</span>
          </div>
          <h2 className="text-xl font-bold text-qbit-on-surface">No Product Found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-qbit-on-surface-variant">{error}</p>
          <div className="mt-6">
            <QbitButton variant="outline" icon="refresh" onClick={handleReset}>
              Try Again
            </QbitButton>
          </div>
        </div>
      )}

      {/* ===== COMPLETE: Scan result ===== */}
      {scanState === "complete" && result && (
        <DrQbitScanResult
          result={result}
          mode={mode}
          onReset={handleReset}
          onLockedFieldClick={handleLockedFieldClick}
        />
      )}

      {/* ===== Login modal (guest clicks locked field) ===== */}
      <DrQbitLoginModal
        open={loginModalOpen}
        fieldName={loginModalField}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* DrQbitScanResult — full diagnostic result display                    */
/* ------------------------------------------------------------------ */

function DrQbitScanResult({
  result,
  mode,
  onReset,
  onLockedFieldClick,
}: {
  result: ScanResult;
  mode: DrQbitMode;
  onReset: () => void;
  onLockedFieldClick: (fieldName: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-2xl border border-qbit-success/30 bg-qbit-success/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-qbit-success/15 text-qbit-success">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-bold text-qbit-on-surface">Diagnostic Complete</p>
            <p className="text-xs text-qbit-on-surface-variant">Product identified successfully</p>
          </div>
        </div>
        <QbitButton variant="ghost" size="sm" icon="refresh" onClick={onReset}>
          New Scan
        </QbitButton>
      </div>

      {/* Product hero */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-qbit-outline-variant bg-white p-6 shadow-sm md:grid-cols-3 md:p-8">
        {/* Image */}
        <div className="md:col-span-1">
          <div className="aspect-square overflow-hidden rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low">
            {result.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.imageUrl} alt={result.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="material-symbols-outlined text-[80px] text-qbit-primary/40">inventory_2</span>
              </div>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="md:col-span-2">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-qbit-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-qbit-primary">{result.brand}</span>
            {result.category && (
              <span className="rounded-full bg-qbit-surface-container-high px-2 py-0.5 text-[10px] font-semibold uppercase text-qbit-on-surface-variant">
                {result.category.replace(/-/g, " ")}
              </span>
            )}
            {result.drQbitSupported && (
              <span className="rounded-full bg-qbit-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-qbit-secondary">Dr. QBIT Supported</span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-qbit-on-surface">{result.name}</h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">Model: {result.model}</p>
          {result.description && (
            <p className="mt-3 text-sm text-qbit-on-surface-variant">{result.description}</p>
          )}

          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill icon="memory" label="Driver" value={result.latestDriverVersion ?? "—"} />
            <StatPill icon="upgrade" label="Firmware" value={result.latestFirmwareVersion ?? "—"} />
            <StatPill icon="devices" label="OS" value={`${result.operatingSystems.length} supported`} />
            <StatPill icon="videocam" label="Videos" value={`${result.videos.length} available`} />
          </div>

          {/* Primary actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {result.driverDownloadUrl && (
              <a href={result.driverDownloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-qbit-primary px-4 py-2 text-xs font-semibold text-qbit-on-primary hover:bg-qbit-primary-container">
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download Driver
              </a>
            )}
            {result.manualUrl && (
              <a href={result.manualUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low">
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                View Manual
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Operating Systems */}
      {result.operatingSystems.length > 0 && (
        <Section title="Operating Systems" icon="devices">
          <div className="flex flex-wrap gap-3">
            {result.operatingSystems.map((os, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant px-3 py-2 text-sm">
                <span className="material-symbols-outlined text-[18px] text-qbit-primary">{os.osIcon ?? "info"}</span>
                <span>{os.osName}</span>
                {os.minVersion && <span className="text-xs text-qbit-on-surface-variant">({os.minVersion}+)</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Downloads grid */}
      <Section title="Downloads" icon="download">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DownloadCard label="Driver" version={result.latestDriverVersion} url={result.driverDownloadUrl} icon="memory" color="bg-qbit-primary/10 text-qbit-primary" />
          <DownloadCard label="Firmware" version={result.latestFirmwareVersion} url={null} icon="upgrade" color="bg-qbit-secondary/10 text-qbit-secondary" note="See release notes" />
          <DownloadCard label="Manual" url={result.manualUrl} icon="menu_book" color="bg-qbit-tertiary/10 text-qbit-tertiary" />
          <DownloadCard label="Datasheet" url={result.datasheetUrl} icon="article" color="bg-qbit-primary/10 text-qbit-primary" />
          <DownloadCard label="Brochure" url={result.brochureUrl} icon="picture_as_pdf" color="bg-qbit-error/10 text-qbit-error" />
          <DownloadCard label="SDK" url={result.sdkUrl} icon="code" color="bg-qbit-secondary/10 text-qbit-secondary" />
          <DownloadCard label="Utility" url={result.utilityUrl} icon="build" color="bg-qbit-primary/10 text-qbit-primary" />
          <DownloadCard label="Installation Guide" url={result.installationGuideUrl} icon="menu_book" color="bg-qbit-tertiary/10 text-qbit-tertiary" />
        </div>
        {/* Additional media files */}
        {result.mediaFiles.filter((m) => ["driver", "firmware", "sdk", "utility", "brochure", "datasheet", "manual"].includes(m.type)).length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Additional Files</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.mediaFiles
                .filter((m) => ["driver", "firmware", "sdk", "utility", "brochure", "datasheet", "manual"].includes(m.type))
                .map((m) => (
                  <DownloadCard key={m.id} label={m.title} url={m.url} icon="attach_file" color="bg-qbit-surface-container-high text-qbit-on-surface-variant" />
                ))}
            </div>
          </div>
        )}
      </Section>

      {/* Videos */}
      {result.videos.length > 0 && (
        <Section title="Videos" icon="videocam">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {result.videos.map((v, i) => {
              const ytId = v.provider === "youtube" || v.url.includes("youtu")
                ? (v.externalId ?? v.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null)
                : null;
              return (
                <div key={i} className="overflow-hidden rounded-xl border border-qbit-outline-variant bg-white">
                  {ytId ? (
                    <div className="aspect-video w-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title={v.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  ) : (
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="aspect-video w-full flex items-center justify-center bg-qbit-on-background text-white">
                      <span className="material-symbols-outlined text-[48px]">play_circle</span>
                    </a>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-bold text-qbit-on-surface">{v.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Knowledge Base + Support */}
      <Section title="Knowledge Base & Support" icon="support_agent">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.knowledgeBaseUrl && (
            <a href={result.knowledgeBaseUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-qbit-outline-variant bg-white p-4 hover:border-qbit-primary/30 hover:shadow-md">
              <span className="material-symbols-outlined text-[24px] text-qbit-primary">menu_book</span>
              <div>
                <p className="text-sm font-bold text-qbit-on-surface">Knowledge Base</p>
                <p className="text-xs text-qbit-on-surface-variant">Articles + troubleshooting guides</p>
              </div>
            </a>
          )}
          <Link href="/support" className="flex items-center gap-3 rounded-xl border border-qbit-outline-variant bg-white p-4 hover:border-qbit-primary/30 hover:shadow-md">
            <span className="material-symbols-outlined text-[24px] text-qbit-primary">support_agent</span>
            <div>
              <p className="text-sm font-bold text-qbit-on-surface">Contact Support</p>
              <p className="text-xs text-qbit-on-surface-variant">Get help from our team</p>
            </div>
          </Link>
        </div>
      </Section>

      {/* Related Products */}
      {result.relatedProducts.length > 0 && (
        <Section title="Related Products" icon="hub">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {result.relatedProducts.map((rp) => (
              <Link key={rp.id} href={`/products/${rp.slug}`} className="group rounded-xl border border-qbit-outline-variant bg-white p-3 hover:border-qbit-primary/30 hover:shadow-md">
                <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-qbit-surface-container-low">
                  {rp.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rp.imageUrl} alt={rp.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="material-symbols-outlined text-[40px] text-qbit-primary/40">inventory_2</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-qbit-on-surface group-hover:text-qbit-primary line-clamp-2">{rp.name}</p>
                <p className="text-[10px] text-qbit-on-surface-variant">{rp.model}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ===== MODE-AWARE SECTIONS ===== */}

      {/* Warranty + History (Customer/Engineer/Admin only) */}
      <Section title="Warranty & Device History" icon="verified_user">
        {mode === "guest" ? (
          <LockedField
            label="Warranty, Purchase Details & History"
            description="Sign in to view warranty status, purchase date, installation history, service records, and registered device details."
            onClick={() => onLockedFieldClick("Warranty & Device History")}
          />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatPill icon="event" label="Purchase Date" value={mode === "customer" ? "View in /account" : "—"} />
              <StatPill icon="shield" label="Warranty Status" value={mode === "customer" ? "View in /account" : "—"} />
              <StatPill icon="schedule" label="Remaining" value={mode === "customer" ? "View in /account" : "—"} />
              <StatPill icon="history" label="Service History" value={mode === "customer" ? "View in /account" : "—"} />
            </div>
            {mode === "customer" && (
              <Link href="/account" className="inline-flex items-center gap-1 text-sm font-semibold text-qbit-primary hover:underline">
                View full details in My Account
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            )}
          </div>
        )}
      </Section>

      {/* Engineer tools */}
      {(mode === "engineer" || mode === "admin") && (
        <Section title="Engineer Tools" icon="engineering">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {["Deep Diagnostics", "Driver Installation", "Firmware Flash", "Hardware Health", "Device Logs", "Test Print", "USB Information", "Serial Number", "Hardware ID", "Service Report", "Installation Checklist"].map((tool) => (
              <div key={tool} className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant bg-white p-3 text-xs">
                <span className="material-symbols-outlined text-[18px] text-qbit-secondary">build</span>
                {tool}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Admin tools */}
      {mode === "admin" && (
        <Section title="Admin Tools" icon="admin_panel_settings">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {["Device Registration", "Warranty Management", "Customer Assignment", "Driver Management", "Firmware Management", "QR Generation", "Knowledge Base Management", "Analytics"].map((tool) => (
              <Link key={tool} href="/portal" className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant bg-white p-3 text-xs hover:border-qbit-primary/30 hover:shadow-md">
                <span className="material-symbols-outlined text-[18px] text-qbit-primary">settings</span>
                {tool}
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-qbit-outline-variant bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-qbit-on-surface">
        <span className="material-symbols-outlined text-[20px] text-qbit-primary">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-3">
      <span className="material-symbols-outlined text-[18px] text-qbit-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">{label}</p>
        <p className="text-xs font-bold text-qbit-on-surface truncate">{value}</p>
      </div>
    </div>
  );
}

function DownloadCard({
  label, version, url, icon, color, note,
}: {
  label: string; version?: string | null; url: string | null; icon: string; color: string; note?: string;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-qbit-outline-variant bg-white p-4 transition-all hover:border-qbit-primary/30 hover:shadow-md"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-qbit-on-surface">{label}</p>
        {version && <p className="text-xs text-qbit-on-surface-variant">{version}</p>}
        {note && <p className="text-xs text-qbit-on-surface-variant">{note}</p>}
      </div>
    </a>
  );
}

function LockedField({
  label, description, onClick,
}: {
  label: string; description: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-dashed border-qbit-outline-variant bg-qbit-surface-container-low p-5 text-left transition-all hover:border-qbit-primary hover:bg-qbit-primary/5"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-qbit-surface-container-high text-qbit-on-surface-variant">
        <span className="material-symbols-outlined text-[24px]">lock</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-qbit-on-surface">{label}</p>
        <p className="text-xs text-qbit-on-surface-variant">{description}</p>
      </div>
      <span className="material-symbols-outlined text-[20px] text-qbit-primary">arrow_forward</span>
    </button>
  );
}
