/**
 * WebUSB Hardware Scanner — works directly in Chrome/Edge browser.
 *
 * Uses the WebUSB API (navigator.usb) to detect connected USB devices.
 * No Desktop Agent required. Works on Chrome, Edge, Opera (HTTPS required).
 *
 * Flow:
 *   1. User clicks "Scan Hardware"
 *   2. Browser requests USB permission (one-time)
 *   3. WebUSB enumerates all connected USB devices
 *   4. Each device's VID/PID/serial/manufacturer is read
 *   5. Results are POSTed to /api/dr-qbit/web-scan
 *   6. Server matches against QbitProduct + HardwareSignature
 *   7. Device Passport + Driver/Firmware suggestions are returned
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

  // Check WebUSB support on mount
  useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.usb) {
      setWebUsbSupported(false);
    }
  }, []);

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);

    try {
      // Step 1: Request USB device access (browser will show permission dialog)
      let devices: ScannedDevice[] = [];

      if (typeof navigator !== "undefined" && navigator.usb) {
        try {
          // Request permission to access USB devices
          await navigator.usb.requestDevice({ filters: [] }).catch(() => null);

          // Get all authorized devices
          const authorizedDevices = await navigator.usb.getDevices();

          if (authorizedDevices.length === 0) {
            toast({
              title: "No USB devices found",
              description: "Connect a USB device and click Scan again. Make sure to approve the browser permission dialog.",
              variant: "destructive",
            });
            setScanning(false);
            return;
          }

          // Convert WebUSB devices to our format
          devices = authorizedDevices.map((d: USBDevice) => ({
            vendorId: "0x" + d.vendorId.toString(16).toUpperCase().padStart(4, "0"),
            productId: "0x" + d.productId.toString(16).toUpperCase().padStart(4, "0"),
            productName: d.productName || "USB Device",
            manufacturerName: d.manufacturerName || "Unknown",
            serialNumber: d.serialNumber || "",
            usbVersion: `${d.usbVersionMajor}.${d.usbVersionMinor}.${d.usbVersionSubminor}`,
          }));

          toast({
            title: `Found ${devices.length} USB device${devices.length === 1 ? "" : "s"}`,
            description: "Analyzing hardware signatures and matching with product library…",
          });
        } catch (usbError) {
          // User cancelled permission dialog or WebUSB failed
          toast({
            title: "USB permission needed",
            description: "Please click 'Scan' again and approve the USB device permission dialog in your browser.",
            variant: "destructive",
          });
          setScanning(false);
          return;
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
      const res = await fetch("/api/dr-qbit/web-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devices }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
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
              ? "Reading USB device information…"
              : webUsbSupported
                ? "Click to detect connected USB devices"
                : "Use Chrome/Edge for USB scanning"}
          </p>
        </div>
      </div>

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
