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
import { useSearchParams } from "next/navigation";
import { WifiSetupWizard } from "./WifiSetupWizard";
import { useToast } from "@/hooks/use-toast";
import {
  connectUsbDevice,
  releaseUsbDevice,
  type UsbConnectionResult,
  type UsbConnectionStep,
} from "@/lib/drqbit/device-discovery";

// ====================== Types ======================
interface MediaFile {
  id: string;
  type: string;
  title: string;
  url: string;
}

export interface DeviceInfo {
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

export interface CustomerInfo {
  name: string;
  companyName: string | null;
  mobileNumber: string | null;
  email: string | null;
  gstNumber: string | null;
  city: string | null;
  state: string | null;
}

export interface WarrantyInfo {
  status: "active" | "expired" | "expiring_soon" | "unknown";
  startDate: string | null;
  endDate: string | null;
  remainingDays: number | null;
  period: string | null;
}

export interface ResourcesInfo {
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
  // V4 Smart Device Setup capabilities (optional for backward compat)
  capabilities?: DeviceCapabilities;
}

export interface DeviceCapabilities {
  supportsWifi: boolean;
  autoDriverInstall: boolean;
  sdkAvailable: boolean;
  firmwareConfigSupported: boolean;
  connectionTypes: string[];
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

const WHATSAPP_NUMBER = "919876543210"; // QBIT Support WhatsApp

// ====================== Component ======================
export function CustomerPortal() {
  const { toast } = useToast();
  const [serial, setSerial] = useState("");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const [wifiSetupOpen, setWifiSetupOpen] = useState(false);
  const [usbConnectionResult, setUsbConnectionResult] = useState<UsbConnectionResult | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ===== Auto-search from URL ?serial= query param =====
  // When the homepage search bar detects a serial number, it redirects to
  // /dr-qbit?serial=XXX. On mount, we read that query param, pre-fill the
  // serial input, and auto-trigger performLookup — no second button click,
  // no retyping. This makes the homepage → Dr. QBIT handoff seamless.
  const searchParams = useSearchParams();
  const autoSearchTriggered = useRef(false);
  useEffect(() => {
    if (autoSearchTriggered.current) return;
    const serialFromUrl = searchParams?.get("serial")?.trim();
    if (serialFromUrl && serialFromUrl.length >= 4) {
      autoSearchTriggered.current = true;
      setSerial(serialFromUrl);
      // Small delay to let the input render with the value, then auto-search.
      setTimeout(() => {
        void performLookup(serialFromUrl);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  // Hardware Scanner flow: Full 7-step USB connection → read serial → call
  // the SAME performLookup → render the SAME result page.
  //
  // 7-Step USB Connection Flow:
  //   STEP 1: navigator.usb.requestDevice() — user selects device in Chrome picker
  //   STEP 2: device.open() — open the device for I/O operations
  //   STEP 3: device.selectConfiguration() — select the active USB configuration
  //   STEP 4: device.claimInterface() — claim the printer/data interface
  //   STEP 5: Read USB interfaces — enumerate all interface class codes
  //   STEP 6: Read endpoints — enumerate bulk IN/OUT endpoints
  //   STEP 7: Create connected device object — build UsbConnectionResult
  //
  // If any step throws an exception:
  //   - Log the exact exception to console
  //   - Show the exact error in the UI (toast + connection status card)
  //   - Do NOT swallow errors
  //   - Do NOT return generic "Connection Failed"
  //   - Do NOT continue to Serial Number / Cloud Lookup / Diagnostics
  //
  // Diagnostic checks performed:
  //   - Is device.configuration null after open()?
  //   - Does the device expose multiple interfaces?
  //   - Is the correct interface being claimed?
  //   - Is another application (printer driver) already using the interface?
  async function handleLaunchScanner() {
    setScanning(true);
    setUsbConnectionResult(null);
    const TAG = "[DrQBIT Portal USB]";

    // Check if WebUSB is available
    if (typeof navigator === "undefined" || !navigator.usb) {
      // WebUSB not supported in this browser
      console.error(`${TAG} WebUSB is NOT available in this browser. Use Chrome or Edge over HTTPS.`);
      toast({
        title: "WebUSB Not Supported",
        description: "Use Chrome or Edge browser over HTTPS to detect USB hardware. No devices can be detected without WebUSB.",
        variant: "destructive",
        duration: 8000,
      });
      setScanning(false);
      return;
    }

    // ===== STEP 1: navigator.usb.requestDevice() =====
    let selectedDevice: USBDevice;
    try {
      console.log(`${TAG} STEP 1: Calling navigator.usb.requestDevice({ filters: [] })...`);
      selectedDevice = await navigator.usb.requestDevice({ filters: [] });
      console.log(`${TAG} STEP 1: SUCCESS — User selected device: "${selectedDevice.productName ?? "Unknown"}" (VID=0x${selectedDevice.vendorId.toString(16).toUpperCase().padStart(4, "0")}, PID=0x${selectedDevice.productId.toString(16).toUpperCase().padStart(4, "0")})`);
      console.log(`${TAG} STEP 1: Serial number from descriptor: "${selectedDevice.serialNumber ?? "NOT EXPOSED"}"`);
      console.log(`${TAG} STEP 1: Manufacturer: "${selectedDevice.manufacturerName ?? "N/A"}"`);
      console.log(`${TAG} STEP 1: USB Version: ${selectedDevice.usbVersionMajor}.${selectedDevice.usbVersionMinor}.${selectedDevice.usbVersionSubminor}`);
      console.log(`${TAG} STEP 1: Configurations count: ${selectedDevice.configurations.length}`);

      toast({
        title: "STEP 1: Device Selected",
        description: `"${selectedDevice.productName ?? "Unknown"}" (VID=0x${selectedDevice.vendorId.toString(16).toUpperCase().padStart(4, "0")}, PID=0x${selectedDevice.productId.toString(16).toUpperCase().padStart(4, "0")}). Running 7-step USB connection flow...`,
      });
    } catch (e) {
      const errName = e instanceof DOMException ? e.name : (e instanceof Error ? e.name : "UnknownError");
      const errMessage = e instanceof Error ? e.message : String(e);

      if (errName === "NotFoundError") {
        // User cancelled the Chrome picker — not an error, just no selection
        console.log(`${TAG} STEP 1: User cancelled the browser permission dialog. No device selected.`);
        toast({
          title: "No Device Selected",
          description: "Please click 'Launch Hardware Scanner' again and select a device in the browser permission dialog.",
          variant: "destructive",
        });
      } else {
        // Real error — log the exact exception and show it in the UI
        console.error(`${TAG} STEP 1: FAILED — requestDevice() threw: ${errName}: ${errMessage}`);
        toast({
          title: `STEP 1 Failed: ${errName}`,
          description: errMessage,
          variant: "destructive",
          duration: 10000,
        });
      }
      setScanning(false);
      return;
    }

    // ===== STEPS 2–7: Run the 7-step USB connection flow =====
    console.log(`${TAG} Running 7-step USB connection flow on "${selectedDevice.productName ?? "Unknown"}"...`);
    const usbConnResult = await connectUsbDevice(selectedDevice);
    setUsbConnectionResult(usbConnResult);

    if (!usbConnResult.connected) {
      // Connection failed at a specific step — show the EXACT error
      const failedStep = usbConnResult.failedStep ?? "unknown";
      const errName = usbConnResult.errorName ?? "UnknownError";
      const errMessage = usbConnResult.errorMessage ?? "Unknown error";

      console.error(`${TAG} USB connection FAILED at ${failedStep}: ${errName}: ${errMessage}`);

      // Build user-friendly message based on which step failed
      let userTitle = `USB ${failedStep} Failed`;
      let userDescription = errMessage;

      if (failedStep === "step2_open") {
        userTitle = "STEP 2 Failed: Cannot Open Device";
        userDescription = `device.open() failed: ${errName}: ${errMessage}. ${usbConnResult.interfacePossiblyInUse ? "Another application (likely the printer driver) may be using this device. Try disconnecting the printer, disabling the auto-installed driver, and scanning again." : "The device may not support WebUSB I/O operations. Descriptor data (VID/PID/serial) is still available."}`;
      } else if (failedStep === "step3_selectConfiguration") {
        userTitle = "STEP 3 Failed: Cannot Select Configuration";
        userDescription = `selectConfiguration() failed: ${errName}: ${errMessage}. The device may have rejected the configuration selection.`;
      } else if (failedStep === "step4_claimInterface") {
        userTitle = "STEP 4 Failed: Cannot Claim Interface";
        userDescription = `claimInterface() failed: ${errName}: ${errMessage}. ${usbConnResult.interfacePossiblyInUse ? "Another application (likely the printer driver) is probably using the interface. The OS may have auto-installed a driver that claimed the interface. Try: (1) Disable the printer driver in Device Manager, (2) Disconnect and reconnect the printer, (3) Scan again." : "The interface could not be claimed. The device may require a specific protocol."}`;
      }

      toast({
        title: userTitle,
        description: userDescription,
        variant: "destructive",
        duration: 12000,
      });

      // Do NOT proceed to Serial Number, Cloud Lookup, or Diagnostics.
      // The USB connection must be stable before continuing.
      // The connection status card will show the full step log and diagnostics.
      setScanning(false);
      return;
    }

    // ===== USB Connection Established Successfully =====
    console.log(`${TAG} USB CONNECTION ESTABLISHED SUCCESSFULLY`);
    console.log(`${TAG} Claimed interface: #${usbConnResult.claimedInterfaceNumber ?? "N/A"}`);
    console.log(`${TAG} Bulk OUT endpoint: #${usbConnResult.bulkOutEndpoint ?? "N/A"}`);
    console.log(`${TAG} Bulk IN endpoint: #${usbConnResult.bulkInEndpoint ?? "N/A"}`);

    toast({
      title: "USB Connected",
      description: `Device "${selectedDevice.productName ?? "Unknown"}" connected. Interface #${usbConnResult.claimedInterfaceNumber ?? "N/A"} claimed. Bulk OUT: #${usbConnResult.bulkOutEndpoint ?? "N/A"}, Bulk IN: #${usbConnResult.bulkInEndpoint ?? "N/A"}.`,
    });

    // ===== Read serial number from the connected USB device =====
    const detectedSerial = selectedDevice.serialNumber;
    console.log(`${TAG} Serial number from connected device: "${detectedSerial ?? "NOT EXPOSED"}"`);

    if (detectedSerial && detectedSerial.length >= 4) {
      // We got a real serial number from the USB device
      setSerial(detectedSerial);
      setScanning(false);
      await performLookup(detectedSerial);
    } else {
      // Device doesn't expose a serial number via WebUSB descriptor.
      // This is common for many USB printers — the serial may require
      // an ESC/POS command to read it from the device memory.
      // DO NOT silently return — show a clear message to the user.
      console.warn(`${TAG} Device "${selectedDevice.productName ?? "Unknown"}" does not expose a serial number via WebUSB descriptor. Serial: "${detectedSerial ?? "null"}".`);
      toast({
        title: "Serial Number Not Available",
        description: `Device "${selectedDevice.productName ?? "Unknown"}" (VID=0x${selectedDevice.vendorId.toString(16).toUpperCase().padStart(4, "0")}, PID=0x${selectedDevice.productId.toString(16).toUpperCase().padStart(4, "0")}) was connected successfully, but does not expose a serial number via the USB descriptor. Please enter the serial number manually below. It is printed on your device sticker or invoice.`,
        variant: "destructive",
        duration: 12000,
      });
      setScanning(false);
    }
  }

  function handleReset() {
    setState("idle");
    setResult(null);
    setSerial("");
    setUsbConnectionResult(null);
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

  // Format USB connection step name for display
  const formatStepName = (step: string): string => {
    const stepNames: Record<string, string> = {
      step1_requestDevice: "STEP 1: requestDevice()",
      step2_open: "STEP 2: device.open()",
      step3_selectConfiguration: "STEP 3: selectConfiguration()",
      step4_claimInterface: "STEP 4: claimInterface()",
      step5_readInterfaces: "STEP 5: Read Interfaces",
      step6_readEndpoints: "STEP 6: Read Endpoints",
      step7_createDeviceObject: "STEP 7: Create Device Object",
    };
    return stepNames[step] ?? step;
  };

  return (
    <div className="w-full">
      {/* ===== Top Row: Dr. QBIT Scanner (left) | Wi-Fi Setup (right) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT: Launch Dr. QBIT (auto USB detection) */}
        {scanning ? (
          <ScanningCard />
        ) : (
          <HardwareScannerCard onLaunch={handleLaunchScanner} disabled={state === "searching"} />
        )}

        {/* RIGHT: Wi-Fi Setup (for supported QBIT Wi-Fi printers) */}
        {wifiSetupOpen ? (
          <WifiSetupCardActive
            onClose={() => setWifiSetupOpen(false)}
            deviceInfo={result?.device ?? null}
            capabilitiesInfo={result?.resources?.capabilities ?? null}
          />
        ) : (
          <WifiSetupCard onLaunch={() => setWifiSetupOpen(true)} disabled={state === "searching"} />
        )}
      </div>

      {/* ===== USB Connection Status Card — shown after scan completes ===== */}
      {usbConnectionResult && !scanning && (
        <UsbConnectionStatusCard
          result={usbConnectionResult}
          formatStepName={formatStepName}
          onRetry={handleLaunchScanner}
        />
      )}

      {/* ===== Search Device — Full-width below the cards ===== */}
      <div className="mt-5">
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
export function PortalResult({
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

      {/* ===== 3.5. Smart Device Setup (NEW — below Downloads) ===== */}
      <SmartDeviceSetupSection device={device} resources={resources} />

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

// ====================== Smart Device Setup Section (V4) ======================

/**
 * SmartDeviceSetupSection — appears below Downloads on the /dr-qbit result page.
 *
 * Contains:
 *   1. Driver Installation
 *      - If autoDriverInstall=true → "Install Driver Automatically" button
 *        (detects OS, downloads correct driver, launches installer)
 *      - If autoDriverInstall=false → "Download Driver" (manual fallback)
 *
 *   2. Wi-Fi Setup
 *      - If supportsWifi=true → "Configure Wi-Fi" button → opens WifiSetupWizard
 *      - If supportsWifi=false → "This model supports USB connection only.
 *        Wi-Fi setup is not available." (never shows unsupported features)
 *
 * Smart Rules (per spec):
 *   - Wi-Fi Supported = No  → hide Wi-Fi Setup (or show "unavailable" message)
 *   - SDK Available = No    → disable Automatic Configuration, use Guided Setup
 *   - Auto Driver Install = No → show only Driver Download (manual)
 *
 * The customer NEVER sees unsupported features as available.
 */
function SmartDeviceSetupSection({
  device,
  resources,
}: {
  device: DeviceInfo;
  resources?: ResourcesInfo | null;
}) {
  const [showWifiWizard, setShowWifiWizard] = useState(false);
  const [driverInstallState, setDriverInstallState] = useState<
    "idle" | "detecting" | "downloading" | "installing" | "verifying" | "done" | "manual"
  >("idle");
  const [driverInstallLog, setDriverInstallLog] = useState<string[]>([]);
  const [osInfo] = useState({
    os: typeof navigator !== "undefined" && navigator.platform?.includes("Win")
      ? "Windows"
      : typeof navigator !== "undefined" && navigator.platform?.includes("Mac")
        ? "macOS"
        : typeof navigator !== "undefined" && navigator.platform?.includes("Linux")
          ? "Linux"
          : "Unknown",
    arch: "64-bit", // most modern systems
  });

  const capabilities = resources?.capabilities;
  const supportsWifi = capabilities?.supportsWifi ?? false;
  const autoDriverInstall = capabilities?.autoDriverInstall ?? false;

  // ===== Driver Installation flow (requires Desktop Agent) =====
  // The browser cannot install drivers directly. This flow attempts to
  // use the Desktop Agent for real driver installation. If the agent is
  // not available, it redirects to manual download.
  async function handleInstallDriver() {
    setDriverInstallLog([]);
    setDriverInstallState("detecting");
    setDriverInstallLog((l) => [...l, `Detecting OS: ${osInfo.os} ${osInfo.arch}`]);
    setDriverInstallLog((l) => [...l, `Device Model: ${device.productName} (${device.modelNumber})`]);

    // Try to connect to the Desktop Agent for driver installation
    try {
      const DESKTOP_AGENT_PORT = 53742;
      const healthCheck = await fetch(`http://localhost:${DESKTOP_AGENT_PORT}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      }).catch(() => null);

      if (!healthCheck?.ok) {
        // Desktop Agent not available — redirect to manual download
        setDriverInstallLog((l) => [...l, "Desktop Agent not found. Switching to manual download."]);
        setDriverInstallState("manual");
        if (resources?.driverDownloadUrl) {
          window.open(resources.driverDownloadUrl, "_blank", "noopener,noreferrer");
        }
        return;
      }

      // Desktop Agent is running — send driver install command
      setDriverInstallState("downloading");
      setDriverInstallLog((l) => [...l, `Requesting driver: ${resources?.latestDriverVersion ?? "latest"} for ${osInfo.os}`]);

      const installRes = await fetch(`http://localhost:${DESKTOP_AGENT_PORT}/install-driver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelNumber: device.modelNumber,
          serialNumber: device.serialNumber,
          productName: device.productName,
          os: osInfo.os,
          arch: osInfo.arch,
          driverVersion: resources?.latestDriverVersion ?? null,
        }),
        signal: AbortSignal.timeout(120000), // 2-minute timeout for full install
      });

      if (installRes.ok) {
        const result = await installRes.json();
        setDriverInstallState("done");
        setDriverInstallLog((l) => [...l, result.message ?? "Driver installation completed."]);
      } else {
        setDriverInstallLog((l) => [...l, "Driver installation failed. Switching to manual download."]);
        setDriverInstallState("manual");
        if (resources?.driverDownloadUrl) {
          window.open(resources.driverDownloadUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch {
      // Desktop Agent not reachable — redirect to manual download
      setDriverInstallLog((l) => [...l, "Desktop Agent not reachable. Switching to manual download."]);
      setDriverInstallState("manual");
      if (resources?.driverDownloadUrl) {
        window.open(resources.driverDownloadUrl, "_blank", "noopener,noreferrer");
      }
    }
  }

  function handleManualDownload() {
    setDriverInstallState("manual");
    if (resources?.driverDownloadUrl) {
      window.open(resources.driverDownloadUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <section className="rounded-2xl border border-qbit-primary/30 bg-gradient-to-br from-qbit-primary/5 to-white shadow-sm">
      <div className="flex items-center justify-between border-b border-qbit-primary/20 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-qbit-primary">smart_toy</span>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">Smart Device Setup</h3>
            <p className="text-[10px] text-qbit-on-surface-variant">Automated configuration powered by Dr. QBIT</p>
          </div>
        </div>
        <span className="rounded-md bg-qbit-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-qbit-primary">V4</span>
      </div>

      <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
        {/* ===== Driver Installation ===== */}
        <div className="rounded-xl border border-qbit-outline-variant bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-qbit-primary">memory</span>
            <h4 className="text-sm font-bold text-qbit-on-surface">Driver Installation</h4>
          </div>

          {autoDriverInstall ? (
            <div>
              <p className="mb-3 text-xs text-qbit-on-surface-variant">
                This device supports automatic driver installation. Dr. QBIT will detect your OS,
                download the correct driver, launch the installer, and verify the installation.
              </p>

              <button
                onClick={handleInstallDriver}
                disabled={driverInstallState !== "idle" && driverInstallState !== "manual" && driverInstallState !== "done"}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-qbit-primary px-4 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors disabled:opacity-60"
              >
                {driverInstallState === "idle" || driverInstallState === "manual" ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    Install Driver Automatically
                  </>
                ) : driverInstallState === "done" ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Installed
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    {driverInstallState === "detecting" ? "Detecting…" :
                     driverInstallState === "downloading" ? "Downloading…" :
                     driverInstallState === "installing" ? "Installing…" :
                     "Verifying…"}
                  </>
                )}
              </button>

              {/* Installation log */}
              {driverInstallLog.length > 0 && (
                <div className="mt-3 rounded-lg border border-qbit-outline-variant/50 bg-qbit-surface-container-lowest p-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Installation Log</p>
                  <div className="space-y-0.5">
                    {driverInstallLog.map((line, i) => (
                      <p key={i} className="font-mono text-[11px] text-qbit-on-surface-variant">
                        <span className="text-qbit-primary">›</span> {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {driverInstallState === "done" && (
                <div className="mt-3 rounded-lg border border-qbit-success/30 bg-qbit-success/5 p-3 text-center">
                  <p className="text-xs font-semibold text-qbit-success">
                    ✓ Driver installed successfully for {device.productName}
                  </p>
                </div>
              )}

              {/* Manual fallback link */}
              {resources?.driverDownloadUrl && (
                <button
                  onClick={handleManualDownload}
                  className="mt-2 w-full text-center text-[11px] font-semibold text-qbit-on-surface-variant hover:text-qbit-primary"
                >
                  Or download driver manually →
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-3 text-xs text-qbit-on-surface-variant">
                Automatic driver installation is not available for this device.
                You can download the driver manually using the button below.
              </p>
              {resources?.driverDownloadUrl ? (
                <a
                  href={resources.driverDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-qbit-primary px-4 py-2.5 text-sm font-semibold text-qbit-primary hover:bg-qbit-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download Driver
                  {resources.latestDriverVersion && (
                    <span className="text-[11px] text-qbit-on-surface-variant">({resources.latestDriverVersion})</span>
                  )}
                </a>
              ) : (
                <p className="text-xs text-qbit-on-surface-variant">No driver download available.</p>
              )}
            </div>
          )}
        </div>

        {/* ===== Wi-Fi Setup ===== */}
        <div className="rounded-xl border border-qbit-outline-variant bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-qbit-primary">wifi</span>
            <h4 className="text-sm font-bold text-qbit-on-surface">Wi-Fi Setup</h4>
          </div>

          {supportsWifi ? (
            <div>
              <p className="mb-3 text-xs text-qbit-on-surface-variant">
                This QBIT model supports Wi-Fi configuration. Click below to launch the Wi-Fi Setup Wizard.
              </p>
              <button
                onClick={() => setShowWifiWizard(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-qbit-primary px-4 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">wifi</span>
                Configure Wi-Fi
              </button>

              {/* Supported connection types */}
              {capabilities?.connectionTypes && capabilities.connectionTypes.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Connections:</span>
                  {capabilities.connectionTypes.map((ct) => (
                    <span
                      key={ct}
                      className="rounded-md bg-qbit-surface-container-high px-2 py-0.5 text-[10px] font-semibold uppercase text-qbit-on-surface-variant"
                    >
                      {ct}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-3 text-xs text-qbit-on-surface-variant">
                This model supports USB connection only. Wi-Fi setup is not available.
              </p>
              <div className="rounded-lg border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-3 text-center">
                <span className="material-symbols-outlined mx-auto text-[24px] text-qbit-on-surface-variant">usb</span>
                <p className="mt-1 text-xs font-semibold text-qbit-on-surface-variant">USB Connection Only</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Wi-Fi Setup Wizard Modal ===== */}
      {showWifiWizard && capabilities && device && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <WifiSetupWizard
              device={{
                productName: device.productName,
                model: device.modelNumber,
                serial: device.serialNumber,
                usbVendorId: "", // filled in by detection
                usbProductId: "",
                firmwareVersion: resources?.latestFirmwareVersion ?? null,
              }}
              capabilities={capabilities}
              onComplete={() => setShowWifiWizard(false)}
              onCancel={() => setShowWifiWizard(false)}
            />
          </div>
        </div>
      )}
    </section>
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
 * ScanningCard — shown while the hardware scanner is running the 7-step
 * USB connection flow. Displays an animated 7-step progress:
 *   STEP 1: requestDevice() — User selects device in Chrome picker
 *   STEP 2: device.open() — Open the device for I/O
 *   STEP 3: selectConfiguration() — Select active USB configuration
 *   STEP 4: claimInterface() — Claim printer/data interface
 *   STEP 5: Read USB interfaces
 *   STEP 6: Read endpoints
 *   STEP 7: Create connected device object
 */
function ScanningCard() {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: "usb", label: "STEP 1: requestDevice() — Selecting device…" },
    { icon: "lock_open", label: "STEP 2: device.open() — Opening device…" },
    { icon: "settings", label: "STEP 3: selectConfiguration() — Selecting configuration…" },
    { icon: "cable", label: "STEP 4: claimInterface() — Claiming interface…" },
    { icon: "list", label: "STEP 5: Reading USB interfaces…" },
    { icon: "swap_vert", label: "STEP 6: Reading endpoints…" },
    { icon: "check_circle", label: "STEP 7: Creating connected device object…" },
  ];

  useEffect(() => {
    // Animate through the 7 steps — each step advances after a delay
    // (real timing is controlled by the async scan, this is visual only)
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 1800),
      setTimeout(() => setStep(4), 2400),
      setTimeout(() => setStep(5), 3000),
      setTimeout(() => setStep(6), 3500),
    ];
    return () => timers.forEach(clearTimeout);
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
          Establishing USB Connection…
        </h3>
        <p className="mt-1 text-xs font-medium text-qbit-on-surface-variant">
          Dr. QBIT is running the 7-step USB connection flow
        </p>
      </div>

      {/* Animated scanner */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-qbit-primary/15 mb-3">
          <span className="material-symbols-outlined text-[40px] text-qbit-primary animate-pulse">memory</span>
          <div className="absolute inset-0 rounded-full border-4 border-qbit-primary/20 border-t-qbit-primary animate-spin" />
        </div>
      </div>

      {/* 7-Step Progress */}
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className={`material-symbols-outlined text-[18px] ${
                i < step ? "text-qbit-success" : i === step ? "text-qbit-primary animate-pulse" : "text-qbit-on-surface-variant/40"
              }`}
            >
              {i < step ? "check_circle" : s.icon}
            </span>
            <span
              className={
                i < step
                  ? "text-qbit-on-surface"
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

      <p className="mt-4 text-center text-xs text-qbit-on-surface-variant">
        Please keep your device connected and approve the browser permission dialog…
      </p>
    </section>
  );
}

/**
 * UsbConnectionStatusCard — shown after the 7-step USB connection flow
 * completes (success OR failure). Displays the full step log, diagnostic
 * checks, and exact error messages. No generic "Connection Failed".
 *
 * If the connection failed, shows a Retry button.
 * If the connection succeeded, shows the connection details.
 */
function UsbConnectionStatusCard({
  result,
  formatStepName,
  onRetry,
}: {
  result: UsbConnectionResult;
  formatStepName: (step: string) => string;
  onRetry: () => void;
}) {
  const isConnected = result.connected;
  const failedStep = result.failedStep;
  const errName = result.errorName;
  const errMessage = result.errorMessage;

  return (
    <section className={`mt-5 rounded-3xl border p-6 shadow-lg sm:p-8 ${
      isConnected
        ? "border-qbit-success/30 bg-qbit-success/5"
        : "border-qbit-error/30 bg-qbit-error/5"
    }`}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          isConnected ? "bg-qbit-success/10 text-qbit-success" : "bg-qbit-error/10 text-qbit-error"
        }`}>
          <span className="material-symbols-outlined text-[28px]">
            {isConnected ? "check_circle" : "error"}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-qbit-on-surface">
            {isConnected ? "USB Connection Established" : `Connection Failed: ${formatStepName(failedStep ?? "unknown")}`}
          </h3>
          {!isConnected && errMessage && (
            <p className="text-sm font-medium text-qbit-error mt-0.5">
              {errName}: {errMessage}
            </p>
          )}
          {isConnected && (
            <p className="text-sm text-qbit-on-surface-variant mt-0.5">
              Interface #{result.claimedInterfaceNumber ?? "N/A"} claimed. Bulk OUT: #{result.bulkOutEndpoint ?? "N/A"}, Bulk IN: #{result.bulkInEndpoint ?? "N/A"}.
            </p>
          )}
        </div>
      </div>

      {/* Diagnostic Checks */}
      {!isConnected && (
        <div className="mb-4 rounded-xl border border-qbit-error/20 bg-white p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-qbit-error mb-2">Diagnostic Checks</h4>
          <ul className="space-y-1.5 text-xs text-qbit-on-surface">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-qbit-on-surface-variant">info</span>
              <span>device.configuration null after open(): <strong>{result.configurationWasNullAfterOpen === null ? "N/A" : result.configurationWasNullAfterOpen ? "YES (selectConfiguration needed)" : "NO (configuration already set)"}</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-qbit-on-surface-variant">info</span>
              <span>Device exposes multiple interfaces: <strong>{result.interfaceCount === null ? "N/A" : result.interfaceCount > 1 ? `YES (${result.interfaceCount} interfaces)` : result.interfaceCount === 1 ? "NO (1 interface)" : "NO (0 interfaces)"}</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-qbit-on-surface-variant">info</span>
              <span>Interface claimed: <strong>{result.claimedInterfaceNumber === null ? "NOT CLAIMED" : `#${result.claimedInterfaceNumber}`}</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">{result.interfacePossiblyInUse ? "warning" : "check_circle"}</span>
              <span className={result.interfacePossiblyInUse ? "text-qbit-error font-semibold" : "text-qbit-on-surface"}>
                Another app (printer driver) using interface: <strong>{result.interfacePossiblyInUse === null ? "N/A" : result.interfacePossiblyInUse ? "YES — OS driver may have auto-claimed the interface" : "NO — interface was available"}</strong>
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Connected Device Details */}
      {isConnected && (
        <div className="mb-4 rounded-xl border border-qbit-success/20 bg-white p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-qbit-success mb-2">Connection Details</h4>
          <ul className="space-y-1.5 text-xs text-qbit-on-surface">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-qbit-success">check_circle</span>
              <span>Claimed interface: #{result.claimedInterfaceNumber ?? "N/A"}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-qbit-success">check_circle</span>
              <span>Bulk OUT endpoint (send data): #{result.bulkOutEndpoint ?? "N/A"}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-qbit-success">check_circle</span>
              <span>Bulk IN endpoint (read data): #{result.bulkInEndpoint ?? "N/A"}</span>
            </li>
          </ul>
        </div>
      )}

      {/* Step Log — detailed log of each step */}
      <div className="rounded-xl border border-qbit-outline-variant/30 bg-white p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant mb-2">Step Log</h4>
        <div className="space-y-1.5">
          {result.stepLog.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <span className={`material-symbols-outlined text-[14px] shrink-0 mt-0.5 ${
                log.status === "success" ? "text-qbit-success"
                : log.status === "failed" ? "text-qbit-error"
                : "text-qbit-on-surface-variant"
              }`}>
                {log.status === "success" ? "check_circle" : log.status === "failed" ? "error" : "skip_next"}
              </span>
              <div>
                <span className="font-semibold text-qbit-on-surface">{formatStepName(log.step)}</span>
                <span className={`ml-1 ${
                  log.status === "success" ? "text-qbit-success"
                  : log.status === "failed" ? "text-qbit-error"
                  : "text-qbit-on-surface-variant"
                }`}>
                  — {log.status === "success" ? "OK" : log.status === "failed" ? "FAILED" : "SKIPPED"}
                </span>
                <p className="text-qbit-on-surface-variant mt-0.5">{log.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retry button (shown only on failure) */}
      {!isConnected && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-qbit-primary px-6 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Retry USB Connection
          </button>
        </div>
      )}
    </section>
  );
}

// ====================== Wi-Fi Setup Card (Middle Column) ======================

/**
 * WifiSetupCard — MIDDLE card on /dr-qbit homepage.
 *
 * For users who want to configure Wi-Fi on a supported QBIT Wi-Fi printer.
 * When clicked, launches the Wi-Fi Setup Wizard flow which:
 *   1. Detects the connected USB device
 *   2. Checks if it supports Wi-Fi (supportsWifi=true)
 *      - If yes → continue to Wi-Fi Setup Wizard
 *      - If no → "This QBIT model does not support Wi-Fi configuration."
 *   3. Verifies SDK + firmware capabilities → Auto or Guided mode
 *   4. Performs Wi-Fi setup (Auto) or shows instructions (Guided)
 *
 * In demo mode, the wizard opens a modal that walks through the full flow.
 * In production, this would use WebUSB to detect the actual connected device.
 */
function WifiSetupCard({
  onLaunch,
  disabled,
}: {
  onLaunch: () => void;
  disabled?: boolean;
}) {
  return (
    <section className="rounded-3xl border border-qbit-outline-variant bg-white p-6 shadow-lg sm:p-8">
      {/* Header */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-qbit-secondary/10 px-3 py-1 text-xs font-semibold text-qbit-secondary mb-2">
          <span className="material-symbols-outlined text-[14px]">wifi</span>
          Wi-Fi Setup
        </div>
        <h3 className="text-xl font-bold tracking-tight text-qbit-on-surface sm:text-2xl">
          Configure Wi-Fi
        </h3>
        <p className="mt-1 text-xs font-medium text-qbit-on-surface-variant">
          For supported QBIT Wi-Fi printers
        </p>
      </div>

      {/* Description */}
      <p className="text-sm text-qbit-on-surface-variant mb-4">
        Configure Wi-Fi on supported QBIT Wi-Fi printers. Dr. QBIT will
        automatically detect the connected device, verify Wi-Fi support,
        and guide you through setup.
      </p>

      {/* Features list */}
      <ul className="space-y-1.5 mb-5">
        {[
          "Auto-detect connected QBIT device",
          "Verify Wi-Fi support",
          "Automatic or guided Wi-Fi configuration",
          "Secure credential transmission",
          "Connection verification + IP display",
        ].map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-qbit-on-surface">
            <span className="material-symbols-outlined text-[16px] text-qbit-secondary mt-0.5">check_circle</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Launch button */}
      <button
        type="button"
        onClick={onLaunch}
        disabled={disabled}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-qbit-secondary px-6 py-3 text-sm font-semibold text-white hover:bg-qbit-secondary/90 transition-colors disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[20px]">wifi</span>
        Launch Wi-Fi Setup
      </button>
    </section>
  );
}

/**
 * WifiSetupCardActive — shown in place of WifiSetupCard when the user clicks
 * "Launch Wi-Fi Setup". Renders a compact inline version of the wizard flow.
 *
 * The full wizard (WifiSetupWizard component) opens in a modal overlay when
 * the user clicks "Start Detection" inside this card.
 */
function WifiSetupCardActive({ onClose, deviceInfo, capabilitiesInfo }: { onClose: () => void; deviceInfo: DeviceInfo | null; capabilitiesInfo: DeviceCapabilities | null }) {
  const [showFullWizard, setShowFullWizard] = useState(false);

  return (
    <section className="rounded-3xl border border-qbit-secondary/30 bg-qbit-secondary/5 p-6 shadow-lg sm:p-8">
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-qbit-secondary/10 px-3 py-1 text-xs font-semibold text-qbit-secondary mb-2">
          <span className="material-symbols-outlined text-[14px]">wifi</span>
          Wi-Fi Setup
        </div>
        <h3 className="text-xl font-bold tracking-tight text-qbit-on-surface sm:text-2xl">
          Wi-Fi Setup Wizard
        </h3>
        <p className="mt-1 text-xs font-medium text-qbit-on-surface-variant">
          Connect your QBIT device via USB, then click below to start.
        </p>
      </div>

      <div className="rounded-xl border border-qbit-outline-variant bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[24px] text-qbit-secondary mt-0.5">info</span>
          <div className="text-xs text-qbit-on-surface-variant space-y-1.5">
            <p className="font-semibold text-qbit-on-surface">Before you begin:</p>
            <p>1. Connect your QBIT printer/POS via USB cable</p>
            <p>2. Power on the device</p>
            <p>3. Have your Wi-Fi network name (SSID) + password ready</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowFullWizard(true)}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-qbit-secondary px-6 py-3 text-sm font-semibold text-white hover:bg-qbit-secondary/90 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">play_arrow</span>
        Start Wi-Fi Setup
      </button>

      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full text-center text-xs font-semibold text-qbit-on-surface-variant hover:text-qbit-on-surface"
      >
        Cancel
      </button>

      {/* Full Wi-Fi Setup Wizard Modal */}
      {showFullWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <WifiSetupWizard
              device={{
                productName: deviceInfo?.productName ?? "QBIT Device",
                model: deviceInfo?.modelNumber ?? "",
                serial: deviceInfo?.serialNumber ?? "",
                usbVendorId: "",
                usbProductId: "",
                firmwareVersion: null,
              }}
              capabilities={{
                supportsWifi: capabilitiesInfo?.supportsWifi ?? false,
                autoDriverInstall: capabilitiesInfo?.autoDriverInstall ?? false,
                sdkAvailable: capabilitiesInfo?.sdkAvailable ?? false,
                firmwareConfigSupported: capabilitiesInfo?.firmwareConfigSupported ?? false,
                connectionTypes: capabilitiesInfo?.connectionTypes ?? ["usb"],
              }}
              onComplete={() => {
                setShowFullWizard(false);
                onClose();
              }}
              onCancel={() => setShowFullWizard(false)}
            />
          </div>
        </div>
      )}
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

export function NotFoundCard({ serial, onReset }: { serial: string; onReset: () => void }) {
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

export function InvalidCard({ onReset }: { onReset: () => void }) {
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

export function ErrorCard({ onReset }: { onReset: () => void }) {
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
