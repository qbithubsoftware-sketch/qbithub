"use client";

/**
 * WifiSetupWizard — Dr. QBIT Wi-Fi Setup Wizard.
 *
 * LAUNCH:
 *   Clicked from the homepage "Wi-Fi Setup" card OR from the Smart Device
 *   Setup section on /dr-qbit (only shown when supportsWifi=true).
 *
 * 4-STEP FLOW (per spec):
 *   Step 1 — Detect Device
 *     Simulates USB detection: reads product name, model, serial, USB
 *     Vendor ID, USB Product ID, firmware version. (Demo mode auto-fills
 *     the connected device from props.)
 *
 *   Step 2 — Compatibility Check
 *     Verifies supportsWifi=true. If false → show "This model supports USB
 *     only" message and stop (no error page).
 *
 *   Step 3 — SDK & Firmware Detection (CRITICAL)
 *     Checks sdkAvailable + firmwareConfigSupported. If BOTH true → enable
 *     Automatic Wi-Fi Setup. If EITHER false → switch to Guided Mode.
 *     The customer NEVER sees an error page — only Auto or Guided mode.
 *
 *   Step 4 — Wi-Fi Setup (Auto OR Guided based on Step 3)
 *     Auto Mode:
 *       - Select/enter Wi-Fi SSID
 *       - Enter Wi-Fi password
 *       - Click "Connect Device"
 *       - Send credentials (simulated), verify connection, display
 *         "Connected" + IP address + connection status
 *     Guided Mode:
 *       - Step-by-step instructions (turn on, enable pairing, connect to
 *         hotspot, enter password, finish)
 *       - No automatic config — just instructions
 *
 * NEVER shows unsupported features. If a device doesn't support Wi-Fi,
 * the wizard stops at Step 2 with a friendly message.
 *
 * Inspired by HP Smart, Epson Smart Panel, Brother iPrint&Scan.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

// ====================== Types ======================
interface DeviceCapabilities {
  supportsWifi: boolean;
  autoDriverInstall: boolean;
  sdkAvailable: boolean;
  firmwareConfigSupported: boolean;
  connectionTypes: string[];
}

interface ConnectedDeviceInfo {
  productName: string;
  model: string;
  serial: string;
  usbVendorId: string;
  usbProductId: string;
  firmwareVersion: string | null;
}

interface WifiSetupWizardProps {
  /** Pre-detected device info (from serial lookup result). */
  device: ConnectedDeviceInfo;
  /** Product capability flags (from serial lookup result). */
  capabilities: DeviceCapabilities;
  /** Optional callback when wizard completes. */
  onComplete?: () => void;
  /** Optional callback when user cancels. */
  onCancel?: () => void;
}

type Step = "detect" | "compatibility" | "sdk-check" | "auto-setup" | "guided-setup" | "connected";

// ====================== Component ======================
export function WifiSetupWizard({
  device,
  capabilities,
  onComplete,
  onCancel,
}: WifiSetupWizardProps) {
  const [step, setStep] = useState<Step>("detect");
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [detectedInfo, setDetectedInfo] = useState<ConnectedDeviceInfo | null>(null);
  const [setupMode, setSetupMode] = useState<"auto" | "guided" | null>(null);

  // Auto-detect form state (Step 4 Auto)
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    ipAddress?: string;
    status: string;
  } | null>(null);

  // ===== Step 1: Detect Device (simulated USB detection, ~2 seconds) =====
  useEffect(() => {
    if (step !== "detect") return;
    setDetectionProgress(0);
    const t1 = setTimeout(() => setDetectionProgress(33), 700);
    const t2 = setTimeout(() => setDetectionProgress(66), 1400);
    const t3 = setTimeout(() => {
      setDetectionProgress(100);
      // Simulated USB detection — fills in device info from props
      // In production, this would use WebUSB or a desktop agent to read
      // the actual USB Vendor ID / Product ID / firmware version.
      setDetectedInfo({
        ...device,
        // Generate plausible USB IDs for demo (in production these come from the device)
        usbVendorId: device.usbVendorId || "0x1FC9",
        usbProductId: device.usbProductId || "0x20A0",
        firmwareVersion: device.firmwareVersion || "v1.8.0",
      });
      // Auto-advance to Step 2 after detection completes
      setTimeout(() => setStep("compatibility"), 500);
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [step, device]);

  // ===== Step 2: Compatibility Check (instant — just reads capability flag) =====
  // If supportsWifi=false → stay on compatibility step with friendly message
  // If supportsWifi=true → advance to Step 3

  // ===== Step 3: SDK & Firmware Detection =====
  // If sdkAvailable AND firmwareConfigSupported → Auto mode
  // Else → Guided mode
  // (The customer NEVER sees an error — just Auto or Guided.)

  function handleCompatibilityContinue() {
    if (!capabilities.supportsWifi) {
      // Stop here — USB-only device. Don't advance.
      return;
    }
    setStep("sdk-check");
  }

  function handleSdkCheckContinue() {
    if (capabilities.sdkAvailable && capabilities.firmwareConfigSupported) {
      setSetupMode("auto");
      setStep("auto-setup");
    } else {
      setSetupMode("guided");
      setStep("guided-setup");
    }
  }

  // ===== Step 4 Auto: Connect to Wi-Fi (simulated) =====
  async function handleAutoConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!ssid.trim() || password.length < 8) return;

    setConnecting(true);
    setConnectionResult(null);

    // Simulate sending credentials to device via SDK / firmware config API.
    // In production, this would call the device's configuration endpoint
    // (e.g. via WebUSB / SDK / LAN API).
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Simulate successful connection (in production, verify with device)
    setConnectionResult({
      success: true,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 200) + 50}`,
      status: "Connected",
    });
    setConnecting(false);
    setStep("connected");
  }

  // ===== Render =====
  return (
    <div className="rounded-2xl border border-qbit-primary/30 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-qbit-outline-variant/50 bg-qbit-primary/5 px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-qbit-primary">wifi</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">
              Wi-Fi Setup Wizard
            </h3>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg p-1.5 text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
              aria-label="Close wizard"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="border-b border-qbit-outline-variant/30 bg-qbit-surface-container-low/50 px-6 py-3">
        <div className="flex items-center justify-center gap-2">
          {[
            { num: 1, label: "Detect", key: "detect" },
            { num: 2, label: "Compatibility", key: "compatibility" },
            { num: 3, label: "SDK Check", key: "sdk-check" },
            { num: 4, label: "Setup", key: setupMode === "guided" ? "guided-setup" : "auto-setup" },
          ].map((s, i) => {
            const stepOrder = ["detect", "compatibility", "sdk-check", "auto-setup", "guided-setup", "connected"];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = stepOrder.indexOf(s.key);
            const isDone = currentIdx > thisIdx;
            const isCurrent = step === s.key;
            return (
              <div key={s.key} className="flex items-center">
                {i > 0 && <div className={`mx-1 h-0.5 w-6 ${isDone ? "bg-qbit-success" : "bg-qbit-outline-variant"}`} />}
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                    isDone
                      ? "bg-qbit-success text-white"
                      : isCurrent
                        ? "bg-qbit-primary text-white"
                        : "bg-qbit-surface-container-high text-qbit-on-surface-variant"
                  }`}
                >
                  {isDone ? <span className="material-symbols-outlined text-[14px]">check</span> : s.num}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="p-6">
        {/* ===== Step 1: Detect Device ===== */}
        {step === "detect" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-qbit-primary/10">
              <span className="material-symbols-outlined text-[40px] text-qbit-primary animate-pulse">usb</span>
            </div>
            <h4 className="text-base font-bold text-qbit-on-surface">Detecting connected device…</h4>
            <p className="mt-1 text-xs text-qbit-on-surface-variant">
              Reading USB device information, model number, serial number, and firmware version.
            </p>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">
                <span>Detection Progress</span>
                <span>{detectionProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-qbit-surface-container-high">
                <div
                  className="h-full bg-qbit-primary transition-all duration-300"
                  style={{ width: `${detectionProgress}%` }}
                />
              </div>
            </div>

            {/* Detection steps */}
            <div className="mt-5 space-y-1.5 text-left">
              {[
                { label: "Scanning USB devices…", done: detectionProgress >= 33 },
                { label: "Reading device descriptor…", done: detectionProgress >= 66 },
                { label: "Identifying product + serial…", done: detectionProgress >= 100 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span className={`material-symbols-outlined text-[16px] ${item.done ? "text-qbit-success" : "text-qbit-on-surface-variant/40"}`}>
                    {item.done ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  <span className={item.done ? "text-qbit-on-surface" : "text-qbit-on-surface-variant/60"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Step 2: Compatibility Check ===== */}
        {step === "compatibility" && detectedInfo && (
          <div>
            {/* Detected device card */}
            <div className="mb-5 rounded-xl border border-qbit-success/30 bg-qbit-success/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-qbit-success/15 text-qbit-success">
                  <span className="material-symbols-outlined text-[22px]">usb</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-qbit-on-surface">Device Connected Successfully</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-qbit-on-surface-variant">
                    <p><span className="font-semibold text-qbit-on-surface">Product:</span> {detectedInfo.productName}</p>
                    <p><span className="font-semibold text-qbit-on-surface">Model:</span> <span className="font-mono">{detectedInfo.model}</span></p>
                    <p><span className="font-semibold text-qbit-on-surface">Serial:</span> <span className="font-mono">{detectedInfo.serial}</span></p>
                    <p><span className="font-semibold text-qbit-on-surface">Firmware:</span> <span className="font-mono">{detectedInfo.firmwareVersion}</span></p>
                    <p><span className="font-semibold text-qbit-on-surface">USB Vendor ID:</span> <span className="font-mono">{detectedInfo.usbVendorId}</span></p>
                    <p><span className="font-semibold text-qbit-on-surface">USB Product ID:</span> <span className="font-mono">{detectedInfo.usbProductId}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compatibility result */}
            {capabilities.supportsWifi ? (
              <div className="rounded-xl border border-qbit-success/30 bg-qbit-success/5 p-4 text-center">
                <span className="material-symbols-outlined mx-auto text-[32px] text-qbit-success">check_circle</span>
                <p className="mt-1 text-sm font-bold text-qbit-on-surface">Wi-Fi Supported</p>
                <p className="mt-1 text-xs text-qbit-on-surface-variant">
                  This QBIT model supports Wi-Fi configuration. Ready to proceed.
                </p>
                <button
                  onClick={handleCompatibilityContinue}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
                >
                  Continue to SDK Check
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-qbit-warning/30 bg-qbit-warning/5 p-4 text-center">
                <span className="material-symbols-outlined mx-auto text-[32px] text-qbit-warning">usb</span>
                <p className="mt-1 text-sm font-bold text-qbit-on-surface">USB Connection Only</p>
                <p className="mt-1 text-xs text-qbit-on-surface-variant">
                  This QBIT model does not support Wi-Fi configuration.
                  Wi-Fi setup is not available for this device.
                </p>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-qbit-outline-variant px-5 py-2.5 text-sm font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== Step 3: SDK & Firmware Detection ===== */}
        {step === "sdk-check" && (
          <div>
            <h4 className="mb-3 text-base font-bold text-qbit-on-surface">Checking SDK & Firmware Capabilities</h4>
            <p className="mb-4 text-xs text-qbit-on-surface-variant">
              Before enabling automatic Wi-Fi configuration, Dr. QBIT verifies whether the connected
              device exposes the required SDK, communication protocol, configuration API, and firmware commands.
            </p>

            <div className="space-y-2">
              {[
                { label: "Manufacturer SDK", available: capabilities.sdkAvailable },
                { label: "USB Communication Protocol", available: capabilities.sdkAvailable },
                { label: "Configuration API", available: capabilities.firmwareConfigSupported },
                { label: "Firmware Configuration Commands", available: capabilities.firmwareConfigSupported },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    item.available
                      ? "border-qbit-success/30 bg-qbit-success/5"
                      : "border-qbit-outline-variant bg-qbit-surface-container-low"
                  }`}
                >
                  <span className="text-xs font-medium text-qbit-on-surface">{item.label}</span>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${item.available ? "text-qbit-success" : "text-qbit-on-surface-variant"}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {item.available ? "check_circle" : "cancel"}
                    </span>
                    {item.available ? "Available" : "Not Available"}
                  </span>
                </div>
              ))}
            </div>

            {/* Decision preview */}
            <div className={`mt-4 rounded-xl border p-4 ${capabilities.sdkAvailable && capabilities.firmwareConfigSupported ? "border-qbit-primary/30 bg-qbit-primary/5" : "border-qbit-tertiary/30 bg-qbit-tertiary/5"}`}>
              <p className="text-xs font-semibold text-qbit-on-surface">
                {capabilities.sdkAvailable && capabilities.firmwareConfigSupported
                  ? "✓ Automatic Wi-Fi Setup is available for this device."
                  : "ℹ Automatic configuration is not available. Dr. QBIT will switch to Guided Wi-Fi Setup Mode."}
              </p>
            </div>

            <button
              onClick={handleSdkCheckContinue}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
            >
              {capabilities.sdkAvailable && capabilities.firmwareConfigSupported
                ? "Start Automatic Wi-Fi Setup"
                : "Continue to Guided Setup"}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* ===== Step 4 Auto: Automatic Wi-Fi Setup ===== */}
        {step === "auto-setup" && (
          <div>
            <h4 className="mb-1 text-base font-bold text-qbit-on-surface">Automatic Wi-Fi Setup</h4>
            <p className="mb-4 text-xs text-qbit-on-surface-variant">
              This device supports automatic configuration. Enter your Wi-Fi credentials and Dr. QBIT
              will send them securely to the device via the manufacturer SDK.
            </p>

            <form onSubmit={handleAutoConnect} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  Wi-Fi Network Name (SSID)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant">wifi</span>
                  <input
                    type="text"
                    required
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="e.g. MyHomeWiFi"
                    className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-3 pl-10 pr-3 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  Wi-Fi Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant">lock</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low py-3 pl-10 pr-10 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-qbit-on-surface-variant hover:text-qbit-primary"
                  >
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-qbit-on-surface-variant">
                  🔒 Credentials are sent securely via the device SDK. QBIT does not store your Wi-Fi password.
                </p>
              </div>

              <button
                type="submit"
                disabled={connecting || !ssid.trim() || password.length < 8}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-qbit-primary px-5 py-3 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors disabled:opacity-60"
              >
                {connecting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Sending credentials to device…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">wifi</span>
                    Connect Device
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ===== Step 4 Guided: Guided Wi-Fi Setup ===== */}
        {step === "guided-setup" && (
          <div>
            <h4 className="mb-1 text-base font-bold text-qbit-on-surface">Guided Wi-Fi Setup</h4>
            <p className="mb-4 text-xs text-qbit-on-surface-variant">
              Automatic configuration is not available for this device. Follow these step-by-step
              instructions to configure Wi-Fi manually.
            </p>

            <ol className="space-y-3">
              {[
                { title: "Turn on the printer", desc: "Press and hold the power button until the status LED turns solid green." },
                { title: "Enable Wi-Fi pairing mode", desc: "Press and hold the Wi-Fi button for 3 seconds until the Wi-Fi LED starts flashing." },
                { title: "Connect to the printer hotspot", desc: "On your phone or computer, connect to the Wi-Fi network named \"QBIT-Setup-XXXX\" (no password required)." },
                { title: "Open the setup page", desc: "Open a browser and visit http://192.168.10.1 to access the printer's web setup interface." },
                { title: "Enter your Wi-Fi password", desc: "Select your home/office Wi-Fi network from the list, enter the password, and click \"Save\"." },
                { title: "Finish setup", desc: "Wait for the Wi-Fi LED to turn solid green (≈30 seconds). The printer is now connected to your network." },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-qbit-primary/10 text-xs font-bold text-qbit-primary">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-qbit-on-surface">{item.title}</p>
                    <p className="text-xs text-qbit-on-surface-variant">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-xl border border-qbit-tertiary/30 bg-qbit-tertiary/5 p-3">
              <p className="text-xs text-qbit-on-surface-variant">
                <span className="font-semibold text-qbit-on-surface">Need help?</span>{" "}
                <Link href="/support" className="text-qbit-primary hover:underline">Contact QBIT Support</Link>
                {" "}or watch the{" "}
                <Link href="/videos" className="text-qbit-primary hover:underline">Wi-Fi setup video tutorial</Link>.
              </p>
            </div>

            {onComplete && (
              <button
                onClick={onComplete}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                I've Completed the Setup
              </button>
            )}
          </div>
        )}

        {/* ===== Step 5: Connected (Auto mode success) ===== */}
        {step === "connected" && connectionResult && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-qbit-success/15">
              <span className="material-symbols-outlined text-[40px] text-qbit-success">wifi</span>
            </div>
            <h4 className="text-lg font-bold text-qbit-on-surface">Connected Successfully!</h4>
            <p className="mt-1 text-sm text-qbit-on-surface-variant">
              Your QBIT device is now connected to <span className="font-semibold text-qbit-on-surface">{ssid}</span>.
            </p>

            <div className="mt-5 rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low p-4">
              <div className="grid grid-cols-2 gap-3 text-left text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Connection Status</p>
                  <p className="font-semibold text-qbit-success">{connectionResult.status}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">IP Address</p>
                  <p className="font-mono font-semibold text-qbit-on-surface">{connectionResult.ipAddress}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Network (SSID)</p>
                  <p className="font-semibold text-qbit-on-surface">{ssid}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Device Serial</p>
                  <p className="font-mono font-semibold text-qbit-on-surface">{detectedInfo?.serial}</p>
                </div>
              </div>
            </div>

            {onComplete && (
              <button
                onClick={onComplete}
                className="mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
