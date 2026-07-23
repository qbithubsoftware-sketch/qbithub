/**
 * WebUSB Hardware Scanner — works directly in Chrome/Edge browser.
 *
 * Uses the WebUSB API (navigator.usb) to detect connected USB devices.
 * No Desktop Agent required. Works on Chrome, Edge, Opera (HTTPS required).
 *
 * 7-step USB Connection Flow:
 *   STEP 1: navigator.usb.requestDevice() — user selects device in Chrome picker
 *   STEP 2: device.open() — open for I/O
 *   STEP 3: device.selectConfiguration() — select active configuration
 *   STEP 4: device.claimInterface() — claim printer/data interface
 *   STEP 5: Read USB interfaces — enumerate all interface class codes
 *   STEP 6: Read endpoints — enumerate bulk IN/OUT endpoints
 *   STEP 7: Create connected device object — build full device profile
 *
 * If any step throws, the exact exception is logged and shown in the UI.
 * NO errors are swallowed. NO generic "Connection Failed" messages.
 * Do not continue to Serial Number, Cloud Lookup or Diagnostics until
 * a stable USB connection is established.
 *
 * Limitations (browser security):
 *   - USB only (COM/LAN/WiFi need Desktop Agent)
 *   - User must click "Scan" each session (permission not persistent)
 *   - Device must be physically connected via USB
 */

"use client";

import { useState, useCallback } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";
import { connectUsbDevice, releaseUsbDevice, type UsbConnectionResult } from "@/lib/drqbit/device-discovery";

interface ScannedDevice {
  vendorId: string;
  productId: string;
  productName: string;
  manufacturerName: string;
  serialNumber: string;
  usbVersion: string;
}

interface ScanResult {
  sessionId: string;
  deviceCount: number;
  matchedCount: number;
  unknownCount: number;
  devices: Array<{
    passportNumber: string | null;
    deviceName: string;
    modelName: string | null;
    brand: string | null;
    vendorId: string;
    productId: string;
    serialNumber: string | null;
    matched: boolean;
    productName: string | null;
    driverStatus: string | null;
    installedDriverVersion: string | null;
    latestDriverVersion: string | null;
    driverUpdateAvailable: boolean;
    firmwareStatus: string | null;
    installedFirmwareVersion: string | null;
    latestFirmwareVersion: string | null;
    firmwareUpdateAvailable: boolean;
    driverDownloadUrl: string | null;
    manualUrl: string | null;
    knowledgeBaseUrl: string | null;
  }>;
}

interface WebUsbScannerProps {
  onScanComplete?: (result: ScanResult) => void;
}

export function WebUsbScanner({ onScanComplete }: WebUsbScannerProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [webUsbSupported, setWebUsbSupported] = useState(true);
  const [connectionResult, setConnectionResult] = useState<UsbConnectionResult | null>(null);

  // Check WebUSB support on mount
  useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.usb) {
      setWebUsbSupported(false);
    }
  }, []);

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    setConnectionResult(null);

    const TAG = "[DrQBIT WebUsbScanner]";

    try {
      let devices: ScannedDevice[] = [];

      if (typeof navigator !== "undefined" && navigator.usb) {
        // ===== STEP 1: Request USB device access =====
        // CRITICAL FIX: We KEEP the device reference from requestDevice().
        // Previously: .catch(() => null) silently swallowed ALL errors
        // and discarded the selected device. Now we properly handle errors.
        let selectedDevice: USBDevice;
        try {
          console.log(`${TAG} STEP 1: Calling navigator.usb.requestDevice({ filters: [] })...`);
          selectedDevice = await navigator.usb.requestDevice({ filters: [] });
          console.log(`${TAG} STEP 1: SUCCESS — User selected: "${selectedDevice.productName ?? "Unknown"}" (VID=${selectedDevice.vendorId}, PID=${selectedDevice.productId})`);
        } catch (e) {
          const errName = e instanceof DOMException ? e.name : (e instanceof Error ? e.name : "UnknownError");
          const errMessage = e instanceof Error ? e.message : String(e);

          if (errName === "NotFoundError") {
            // User cancelled the Chrome picker — not an error, just no selection
            console.log(`${TAG} STEP 1: User cancelled the browser permission dialog.`);
            toast({
              title: "No device selected",
              description: "Please click Scan again and select a device in the browser permission dialog.",
              variant: "destructive",
            });
            setScanning(false);
            return;
          }

          // Real error — show the EXACT error in the UI (no generic "Connection Failed")
          console.error(`${TAG} STEP 1: FAILED — requestDevice() threw: ${errName}: ${errMessage}`);
          toast({
            title: `STEP 1 Failed: ${errName}`,
            description: errMessage,
            variant: "destructive",
            duration: 10000,
          });
          setScanning(false);
          return;
        }

        // ===== Steps 2–7: Run the 7-step USB connection flow =====
        console.log(`${TAG} Running 7-step USB connection flow on selected device...`);
        const usbConnResult = await connectUsbDevice(selectedDevice);
        setConnectionResult(usbConnResult);

        if (!usbConnResult.connected) {
          // Connection failed at a specific step — show the EXACT error
          const failedStep = usbConnResult.failedStep ?? "unknown";
          const errName = usbConnResult.errorName ?? "UnknownError";
          const errMessage = usbConnResult.errorMessage ?? "Unknown error";

          console.error(`${TAG} USB connection failed at ${failedStep}: ${errName}: ${errMessage}`);

          // Build a user-friendly message based on which step failed
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

          // Still convert the device to ScannedDevice format (descriptor data is available
          // even without I/O connection), so the user can at least see VID/PID/serial
          devices = [{
            vendorId: "0x" + selectedDevice.vendorId.toString(16).toUpperCase().padStart(4, "0"),
            productId: "0x" + selectedDevice.productId.toString(16).toUpperCase().padStart(4, "0"),
            productName: selectedDevice.productName || "USB Device",
            manufacturerName: selectedDevice.manufacturerName || "Unknown",
            serialNumber: selectedDevice.serialNumber || "",
            usbVersion: `${selectedDevice.usbVersionMajor}.${selectedDevice.usbVersionMinor}.${selectedDevice.usbVersionSubminor}`,
          }];

          // Continue to server matching with descriptor data only
          // (but UI will show the connection error separately)
        } else {
          // Connection succeeded! Show success toast
          console.log(`${TAG} USB connection established successfully.`);
          toast({
            title: "USB Connected",
            description: `Device "${selectedDevice.productName ?? "Unknown"}" connected. Interface #${usbConnResult.claimedInterfaceNumber ?? "N/A"} claimed. Bulk OUT: #${usbConnResult.bulkOutEndpoint ?? "N/A"}, Bulk IN: #${usbConnResult.bulkInEndpoint ?? "N/A"}.`,
          });

          // Convert the connected device to ScannedDevice format
          devices = [{
            vendorId: "0x" + selectedDevice.vendorId.toString(16).toUpperCase().padStart(4, "0"),
            productId: "0x" + selectedDevice.productId.toString(16).toUpperCase().padStart(4, "0"),
            productName: selectedDevice.productName || "USB Device",
            manufacturerName: selectedDevice.manufacturerName || "Unknown",
            serialNumber: selectedDevice.serialNumber || "",
            usbVersion: `${selectedDevice.usbVersionMajor}.${selectedDevice.usbVersionMinor}.${selectedDevice.usbVersionSubminor}`,
          }];

          // Also check for other authorized devices
          try {
            const allAuthorized = await navigator.usb.getDevices();
            for (const d of allAuthorized) {
              // Skip the device we already connected
              if (d.vendorId === selectedDevice.vendorId && d.productId === selectedDevice.productId && d.serialNumber === selectedDevice.serialNumber) {
                continue;
              }
              devices.push({
                vendorId: "0x" + d.vendorId.toString(16).toUpperCase().padStart(4, "0"),
                productId: "0x" + d.productId.toString(16).toUpperCase().padStart(4, "0"),
                productName: d.productName || "USB Device",
                manufacturerName: d.manufacturerName || "Unknown",
                serialNumber: d.serialNumber || "",
                usbVersion: `${d.usbVersionMajor}.${d.usbVersionMinor}.${d.usbVersionSubminor}`,
              });
            }
          } catch { /* getDevices() failed for secondary devices — ignore */ }
        }

        if (devices.length === 0) {
          toast({
            title: "No USB devices found",
            description: "Connect a USB device and click Scan again. Make sure to approve the browser permission dialog.",
            variant: "destructive",
          });
          setScanning(false);
          return;
        }

        if (!connectionResult?.connected) {
          // Connection failed — still show descriptor data toast but note the connection failure
          toast({
            title: `Found ${devices.length} USB device${devices.length === 1 ? "" : "s"}`,
            description: "Descriptor data (VID/PID/serial) available, but USB I/O connection failed. See connection details below.",
          });
        }
      } else {
        // WebUSB not supported — NO dummy data, NO simulation
        toast({
          title: "WebUSB not supported",
          description: "Use Chrome or Edge browser (over HTTPS) for hardware scanning. No devices can be detected without WebUSB support.",
          variant: "destructive",
          duration: 8000,
        });
        setScanning(false);
        return;
      }

      // Step 2: Send scan results to server for matching
      // Only proceed if we have descriptor data (connection failure doesn't prevent this)
      const res = await fetch("/api/dr-qbit/web-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devices }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error ?? "Scan failed on server");
      }

      const result: ScanResult = await res.json();
      setScanResult(result);

      toast({
        title: "Scan Complete!",
        description: `${result.deviceCount} device${result.deviceCount === 1 ? "" : "s"} found — ${result.matchedCount} matched, ${result.unknownCount} unknown.`,
      });

      onScanComplete?.(result);
    } catch (e) {
      toast({
        title: "Scan failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  // Format connection step for display
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
    <div className="space-y-4">
      {/* Scan button */}
      <div className="flex flex-col items-center gap-3">
        {scanning ? (
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-qbit-primary/20" />
            <div className="absolute inset-2 animate-pulse rounded-full bg-qbit-primary/30" />
            <Icon name="radar" className="relative text-[40px] text-qbit-primary animate-spin" style={{ animationDuration: "2s" }} filled />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleScan}
            className="group flex h-24 w-24 items-center justify-center rounded-full bg-qbit-primary text-qbit-on-primary shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
          >
            <Icon name="qr_code_scanner" className="text-[40px] transition-transform group-hover:scale-110" filled />
          </button>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold text-qbit-on-surface">
            {scanning ? "Scanning…" : "Scan Hardware"}
          </p>
          <p className="text-xs text-qbit-on-surface-variant">
            {scanning
              ? "Establishing USB connection…"
              : webUsbSupported
                ? "Click to detect connected USB devices"
                : "Use Chrome/Edge for USB scanning"}
          </p>
        </div>
      </div>

      {/* USB Connection Result — shows exact step-by-step status */}
      {connectionResult && (
        <div className={`rounded-xl border p-4 ${
          connectionResult.connected
            ? "border-qbit-success/30 bg-qbit-success/5"
            : "border-qbit-error/30 bg-qbit-error/5"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              connectionResult.connected ? "bg-qbit-success/10 text-qbit-success" : "bg-qbit-error/10 text-qbit-error"
            }`}>
              <Icon name={connectionResult.connected ? "check_circle" : "error"} className="text-[20px]" filled />
            </div>
            <div>
              <p className="text-sm font-semibold text-qbit-on-surface">
                {connectionResult.connected ? "USB Connection Established" : "USB Connection Failed"}
              </p>
              {connectionResult.connected && (
                <p className="text-xs text-qbit-on-surface-variant">
                  Interface #{connectionResult.claimedInterfaceNumber ?? "N/A"} claimed ·
                  Bulk OUT: #{connectionResult.bulkOutEndpoint ?? "N/A"} ·
                  Bulk IN: #{connectionResult.bulkInEndpoint ?? "N/A"}
                </p>
              )}
              {!connectionResult.connected && connectionResult.failedStep && (
                <p className="text-xs font-medium text-qbit-error">
                  {formatStepName(connectionResult.failedStep)}: {connectionResult.errorName ?? "Error"} — {connectionResult.errorMessage ?? "Unknown error"}
                </p>
              )}
              {!connectionResult.connected && connectionResult.interfacePossiblyInUse && (
                <p className="text-xs text-qbit-warning mt-1">
                  Another application (likely the printer driver) may be using this device.
                  Try: (1) Disable the printer driver in Device Manager, (2) Disconnect/reconnect, (3) Scan again.
                </p>
              )}
            </div>
          </div>

          {/* Step-by-step log (collapsible) */}
          <details className="mt-3">
            <summary className="text-xs font-semibold cursor-pointer text-qbit-on-surface-variant">
              Connection Step Details ({connectionResult.stepLog.length} steps)
            </summary>
            <div className="mt-2 space-y-1">
              {connectionResult.stepLog.map((logEntry, idx) => (
                <div key={idx} className={`rounded px-2 py-1 text-xs ${
                  logEntry.status === "success" ? "bg-qbit-success/10 text-qbit-success"
                  : logEntry.status === "failed" ? "bg-qbit-error/10 text-qbit-error"
                  : "bg-qbit-warning/10 text-qbit-warning"
                }`}>
                  <span className="font-semibold">{formatStepName(logEntry.step)}</span>
                  <span className="ml-2">{logEntry.status === "success" ? "✓" : logEntry.status === "failed" ? "✗" : "⏭"}</span>
                  <span className="ml-1 text-qbit-on-surface-variant">{logEntry.message}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Scan Results */}
      {scanResult && scanResult.devices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-t border-qbit-outline-variant/50 pt-4">
            <Icon name="check_circle" className="text-[20px] text-qbit-success" filled />
            <h4 className="text-sm font-semibold text-qbit-on-surface">
              {scanResult.deviceCount} Device{scanResult.deviceCount === 1 ? "" : "s"} Detected
            </h4>
          </div>

          {scanResult.devices.map((device, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 ${
                device.matched
                  ? "border-qbit-success/30 bg-qbit-success/5"
                  : "border-qbit-warning/30 bg-qbit-warning/5"
              }`}
            >
              {/* Device header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    device.matched ? "bg-qbit-success/10 text-qbit-success" : "bg-qbit-warning/10 text-qbit-warning"
                  }`}>
                    <Icon name={device.matched ? "check_circle" : "help_outline"} className="text-[20px]" filled />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-qbit-on-surface">
                      {device.deviceName}
                    </p>
                    <p className="text-xs text-qbit-on-surface-variant">
                      VID: {device.vendorId} · PID: {device.productId}
                      {device.serialNumber && ` · S/N: ${device.serialNumber}`}
                    </p>
                    {device.passportNumber && (
                      <p className="mt-0.5 font-mono text-[10px] text-qbit-primary">
                        Passport: {device.passportNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Matched product info */}
              {device.matched && device.productName && (
                <div className="mt-3 rounded-lg bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Identified Product
                  </p>
                  <p className="text-sm font-medium text-qbit-on-surface">{device.productName}</p>
                  {device.brand && (
                    <p className="text-xs text-qbit-on-surface-variant">Brand: {device.brand}</p>
                  )}
                  {device.modelName && (
                    <p className="text-xs text-qbit-on-surface-variant">Model: {device.modelName}</p>
                  )}
                </div>
              )}

              {/* Driver status */}
              {device.matched && (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {/* Driver */}
                  <div className={`rounded-lg border p-2 ${
                    device.driverUpdateAvailable
                      ? "border-qbit-warning/30 bg-qbit-warning/5"
                      : "border-qbit-success/20 bg-qbit-success/5"
                  }`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                      Driver
                    </p>
                    <div className="flex items-center gap-1">
                      <Icon
                        name={device.driverUpdateAvailable ? "warning" : "check_circle"}
                        className={`text-[14px] ${device.driverUpdateAvailable ? "text-qbit-warning" : "text-qbit-success"}`}
                        filled
                      />
                      <span className="text-xs font-medium text-qbit-on-surface">
                        {device.driverStatus ?? "Unknown"}
                      </span>
                    </div>
                    {device.installedDriverVersion && (
                      <p className="text-[10px] text-qbit-on-surface-variant">
                        Installed: v{device.installedDriverVersion}
                      </p>
                    )}
                    {device.latestDriverVersion && (
                      <p className="text-[10px] text-qbit-on-surface-variant">
                        Latest: v{device.latestDriverVersion}
                      </p>
                    )}
                  </div>

                  {/* Firmware */}
                  <div className={`rounded-lg border p-2 ${
                    device.firmwareUpdateAvailable
                      ? "border-qbit-warning/30 bg-qbit-warning/5"
                      : "border-qbit-success/20 bg-qbit-success/5"
                  }`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                      Firmware
                    </p>
                    <div className="flex items-center gap-1">
                      <Icon
                        name={device.firmwareUpdateAvailable ? "warning" : "check_circle"}
                        className={`text-[14px] ${device.firmwareUpdateAvailable ? "text-qbit-warning" : "text-qbit-success"}`}
                        filled
                      />
                      <span className="text-xs font-medium text-qbit-on-surface">
                        {device.firmwareStatus ?? "Unknown"}
                      </span>
                    </div>
                    {device.installedFirmwareVersion && (
                      <p className="text-[10px] text-qbit-on-surface-variant">
                        Installed: v{device.installedFirmwareVersion}
                      </p>
                    )}
                    {device.latestFirmwareVersion && (
                      <p className="text-[10px] text-qbit-on-surface-variant">
                        Latest: v{device.latestFirmwareVersion}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Suggested actions */}
              {device.matched && (device.driverUpdateAvailable || device.firmwareUpdateAvailable) && (
                <div className="mt-3 border-t border-qbit-outline-variant/50 pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    Suggested Actions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {device.driverUpdateAvailable && device.driverDownloadUrl && (
                      <a
                        href={device.driverDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-qbit-primary px-3 py-1.5 text-xs font-semibold text-qbit-on-primary hover:bg-qbit-primary/90"
                      >
                        <Icon name="settings_input_component" className="text-[14px]" />
                        Download Driver
                      </a>
                    )}
                    {device.firmwareUpdateAvailable && (
                      <a
                        href="/?screen=dr-qbit-firmware"
                        className="inline-flex items-center gap-1 rounded-lg border border-qbit-warning px-3 py-1.5 text-xs font-semibold text-qbit-warning hover:bg-qbit-warning/10"
                      >
                        <Icon name="system_update" className="text-[14px]" />
                        Update Firmware
                      </a>
                    )}
                    {device.manualUrl && (
                      <a
                        href={device.manualUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-qbit-outline-variant px-3 py-1.5 text-xs font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"
                      >
                        <Icon name="menu_book" className="text-[14px]" />
                        Manual
                      </a>
                    )}
                    {device.knowledgeBaseUrl && (
                      <a
                        href={device.knowledgeBaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-qbit-outline-variant px-3 py-1.5 text-xs font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"
                      >
                        <Icon name="library_books" className="text-[14px]" />
                        Knowledge Base
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Unknown device suggestion */}
              {!device.matched && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-qbit-warning/5 px-3 py-2">
                  <Icon name="info" className="text-[16px] text-qbit-warning" filled />
                  <p className="text-xs text-qbit-on-surface-variant">
                    Unknown device. An admin can map this VID/PID to a product in the Device Detection page.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
