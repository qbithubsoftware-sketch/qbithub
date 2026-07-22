"use client";

/**
 * DiscoveryScanner — Unified device discovery + identification component.
 *
 * Runs the full Phase 1 (Discovery) + Phase 2 (Identification) pipeline:
 *   Phase 1: USB Scan → Bluetooth Scan → LAN Scan (Discovery Engine)
 *   Phase 2: Verify → Fingerprint → Serial Extraction → Model ID → Capabilities (Identification Engine)
 *
 * PRODUCTION RULES:
 *   - NO dummy devices, NO fake data, NO simulated serial numbers
 *   - If no device is connected → show real status only
 *   - If detection fails → show clear error message
 *   - All scan types run automatically, no manual commands needed
 *   - Phase 2 identification enriches each device with real hardware data
 *
 * Flow:
 *   1. User clicks "Launch Hardware Scanner"
 *   2. scanAllPorts() runs USB → Bluetooth → LAN sequentially (Phase 1)
 *   3. identifyAllDevices() runs verification + identification on each device (Phase 2)
 *   4. Enriched devices POSTed to /api/dr-qbit/discovery
 *   5. Server matches against QbitProduct + HardwareSignature + enriches further
 *   6. Results displayed with Device Name, Connection Type, Port, VID/PID
 *
 * Extensible: Adding Barcode Printer, POS, Scanner, Label Printer, etc.
 * only requires registering a new scanner/verifier — no engine changes.
 */

import { useState, useCallback } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";
import {
  scanAllPorts,
  isWebUsbAvailable,
  isBluetoothAvailable,
  isLanAvailable,
  filterPrinterDevices,
  type DiscoveredDevice,
  type DiscoveryResult,
  type DiscoveryConnection,
} from "@/lib/drqbit/device-discovery";
import {
  identifyAllDevices,
} from "@/lib/drqbit/device-identification";
import type { DeviceCapability, IdentificationStatus, DeviceType } from "@/lib/drqbit/types";

/** Scanner status for progress display */
type ScannerPhase = "idle" | "usb" | "bluetooth" | "lan" | "identifying" | "matching" | "complete" | "error";

/** Matched device info returned from server */
interface MatchedDeviceInfo {
  id: string;
  passportNumber: string | null;
  connectionType: string;
  port: string | null;
  deviceName: string;
  manufacturer: string | null;
  vendorId: string | null;
  productId: string | null;
  serialNumber: string | null;
  matched: boolean;
  matchedProductName: string | null;
  matchedProductModel: string | null;
  matchedProductBrand: string | null;
  matchConfidence: number | null;
  matchMethod: string | null;
  driverStatus: string | null;
  firmwareStatus: string | null;
  driverUpdateAvailable: boolean;
  firmwareUpdateAvailable: boolean;
  driverDownloadUrl: string | null;
  manualUrl: string | null;
  knowledgeBaseUrl: string | null;
  /** Phase 2: Device Profile with identification data (available for Phase 3, not rendered) */
  deviceProfile: {
    deviceType: DeviceType | null;
    identificationStatus: IdentificationStatus;
    model: string | null;
    firmwareVersion: string | null;
    hardwareRevision: string | null;
    capabilities: DeviceCapability[];
    serialSource: string | null;
    modelSource: string | null;
    fingerprintHash: string | null;
    identificationErrors: Array<{ step: string; message: string; recoverable: boolean }>;
  } | null;
}

interface DiscoveryScannerProps {
  /** Callback when scan completes with matched results. */
  onScanComplete?: (devices: MatchedDeviceInfo[], discovery: DiscoveryResult) => void;
  /** Callback when scan finds nothing. */
  onNoDevices?: () => void;
}

export function DiscoveryScanner({ onScanComplete, onNoDevices }: DiscoveryScannerProps) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<ScannerPhase>("idle");
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [matchedDevices, setMatchedDevices] = useState<MatchedDeviceInfo[] | null>(null);
  const [scannerAvailabilities, setScannerAvailabilities] = useState<{
    usb: boolean;
    bluetooth: boolean;
    lan: boolean;
    usbReason?: string;
    btReason?: string;
    lanReason?: string;
  } | null>(null);

  // Check scanner availability on mount
  const checkAvailability = useCallback(() => {
    const usb = isWebUsbAvailable();
    const bt = isBluetoothAvailable();
    const lan = isLanAvailable();
    setScannerAvailabilities({
      usb: usb.supported,
      bluetooth: bt.supported,
      lan: lan.supported,
      usbReason: usb.supported ? undefined : usb.reason,
      btReason: bt.supported ? undefined : bt.reason,
      lanReason: lan.supported ? undefined : lan.reason,
    });
  }, []);

  // Run on mount
  useState(() => {
    checkAvailability();
  });

  const PHASE_LABELS: Record<ScannerPhase, string> = {
    idle: "Launch Hardware Scanner",
    usb: "Scanning USB devices…",
    bluetooth: "Scanning Bluetooth devices…",
    lan: "Scanning Network devices…",
    identifying: "Identifying devices (verification, fingerprint, serial, model)…",
    matching: "Matching devices with product library…",
    complete: "Scan Complete",
    error: "Scan Failed",
  };

  const PHASE_ICONS: Record<ScannerPhase, string> = {
    idle: "qr_code_scanner",
    usb: "usb",
    bluetooth: "bluetooth",
    lan: "lan",
    identifying: "fingerprint",
    matching: "inventory_2",
    complete: "check_circle",
    error: "error",
  };

  const handleScan = async () => {
    setPhase("usb");
    setDiscoveryResult(null);
    setMatchedDevices(null);

    try {
      // ===== Step 1: Run Discovery Engine — USB → BT → LAN sequentially (Phase 1) =====

      // Phase: USB
      setPhase("usb");
      toast({
        title: "USB Scan",
        description: "Scanning connected USB devices. Please approve the browser permission dialog if it appears.",
      });

      // Phase: Bluetooth
      setPhase("bluetooth");
      // Note: scanAllPorts() runs all scanners sequentially internally.
      // We set the phase BEFORE calling it so the UI shows progress.
      // The actual scanning happens inside scanAllPorts().

      // Phase: LAN (skipped if Desktop Agent not available)
      setPhase("lan");

      // Run the full sequential scan
      const discovery = await scanAllPorts();
      setDiscoveryResult(discovery);

      // ===== Step 2: Filter for printer-like devices =====

      const printerDevices = filterPrinterDevices(discovery.devices);

      // ===== Step 3: Check if any devices were found =====

      if (printerDevices.length === 0 && discovery.devices.length === 0) {
        // NO devices found at all
        setPhase("complete");

        const skippedMsgs = discovery.scannersSkipped.map((s) => {
          const reason = discovery.errors[s];
          return `${s.toUpperCase()}: ${reason ?? "Not available"}`;
        }).join("; ");

        toast({
          title: "No compatible QBIT device detected",
          description: "Please connect your printer via USB and scan again." +
            (skippedMsgs ? ` (${skippedMsgs})` : ""),
          variant: "destructive",
          duration: 8000,
        });
        onNoDevices?.();
        return;
      }

      // ===== Step 4: Run Identification Engine on each device (Phase 2) =====

      setPhase("identifying");
      toast({
        title: "Identifying devices",
        description: "Verifying device type, extracting serial number, identifying model, detecting capabilities…",
      });

      // Run Phase 2 identification on ALL discovered devices
      // This enriches each device with: verification, fingerprint, serial, model, capabilities
      const identificationResults = identifyAllDevices(discovery);

      // ===== Step 5: Send discovered + identified devices to server for matching =====

      setPhase("matching");
      toast({
        title: "Analyzing devices",
        description: `${printerDevices.length} printer-like device(s) found. Matching with product library…`,
      });

      // Convert DiscoveredDevice + DeviceProfile to API payload format
      // Include Phase 2 identification data alongside Phase 1 discovery data
      const payload = {
        devices: discovery.devices.map((d: DiscoveredDevice, idx: number) => {
          // Find the matching identification result for this device
          const identResult = identificationResults[idx];

          return {
            connectionType: d.connectionType,
            deviceName: d.deviceName,
            manufacturer: d.manufacturer,
            vendorId: d.vendorId,
            productIdCode: d.productId,
            serialNumber: d.serialNumber,
            usbVersion: d.usbVersion,
            port: d.port,
            hardwareId: d.vendorId && d.productId
              ? `USB\\VID_${d.vendorId.replace("0x", "").toUpperCase()}&PID_${d.productId.replace("0x", "").toUpperCase()}`
              : null,
            bluetoothDeviceId: d.bluetoothDeviceId,
            ipAddress: d.ipAddress,
            macAddress: d.macAddress,
            isPrinterLike: d.isPrinterLike,
            // Phase 2 enrichment fields from client-side Identification Engine
            firmwareVersion: d.firmwareVersion ?? undefined,
            hardwareRevision: d.hardwareRevision ?? undefined,
            softwareRevision: d.softwareRevision ?? undefined,
            interfaceClass: d.interfaceClass ?? undefined,
            interfaceClasses: d.interfaceClasses ?? undefined,
            modelNumber: d.modelNumber ?? undefined,
            // Phase 2 Device Profile from client-side identification
            // This is the full verified identity data for the server to enrich
            deviceProfile: identResult?.profile ?? undefined,
          };
        }),
        scannersUsed: discovery.scannersUsed,
        scannersSkipped: discovery.scannersSkipped,
        scanErrors: discovery.errors,
      };

      const res = await fetch("/api/dr-qbit/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Server failed to process scan results");
      }

      const result = await res.json();
      const matched: MatchedDeviceInfo[] = result.devices ?? [];
      setMatchedDevices(matched);
      setPhase("complete");

      const matchedCount = matched.filter((d) => d.matched).length;
      const unknownCount = matched.filter((d) => !d.matched).length;

      toast({
        title: "Scan Complete",
        description: `${matched.length} device(s) detected — ${matchedCount} matched, ${unknownCount} unknown.` +
          (discovery.scannersSkipped.length > 0
            ? ` (${discovery.scannersSkipped.join(", ").toUpperCase()} scan skipped)`
            : ""),
      });

      onScanComplete?.(matched, discovery);
    } catch (e) {
      setPhase("error");
      const message = e instanceof Error ? e.message : "Unknown scan error";

      toast({
        title: "Scan Failed",
        description: message,
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const isScanning = phase !== "idle" && phase !== "complete" && phase !== "error";

  // Render matched device cards
  const renderDeviceCards = () => {
    if (!matchedDevices || matchedDevices.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-t border-qbit-outline-variant/50 pt-4">
          <Icon name="check_circle" className="text-[20px] text-qbit-success" filled />
          <h4 className="text-sm font-semibold text-qbit-on-surface">
            {matchedDevices.length} Device{matchedDevices.length === 1 ? "" : "s"} Detected
          </h4>
        </div>

        {matchedDevices.map((device, idx) => (
          <div
            key={device.id ?? idx}
            className={`rounded-xl border p-4 ${
              device.matched
                ? "border-qbit-success/30 bg-qbit-success/5"
                : "border-qbit-warning/30 bg-qbit-warning/5"
            }`}
          >
            {/* Device header */}
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                device.matched ? "bg-qbit-success/10 text-qbit-success" : "bg-qbit-warning/10 text-qbit-warning"
              }`}>
                <Icon name={device.matched ? "check_circle" : "help_outline"} className="text-[20px]" filled />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-qbit-on-surface">
                  {device.deviceName}
                </p>
                <p className="text-xs text-qbit-on-surface-variant">
                  Connection: {device.connectionType.toUpperCase()} · Port: {device.port ?? "N/A"}
                  {device.vendorId && ` · VID: ${device.vendorId}`}
                  {device.productId && ` · PID: ${device.productId}`}
                  {device.serialNumber && ` · S/N: ${device.serialNumber}`}
                </p>
                {device.passportNumber && (
                  <p className="mt-0.5 font-mono text-[10px] text-qbit-primary">
                    Passport: {device.passportNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Matched product info */}
            {device.matched && device.matchedProductName && (
              <div className="mt-3 rounded-lg bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  Identified Product
                </p>
                <p className="text-sm font-medium text-qbit-on-surface">{device.matchedProductName}</p>
                {device.matchedProductBrand && (
                  <p className="text-xs text-qbit-on-surface-variant">Brand: {device.matchedProductBrand}</p>
                )}
                {device.matchedProductModel && (
                  <p className="text-xs text-qbit-on-surface-variant">Model: {device.matchedProductModel}</p>
                )}
                {device.matchConfidence && (
                  <p className="text-xs text-qbit-on-surface-variant">
                    Match: {(device.matchConfidence * 100).toFixed(0)}% ({device.matchMethod})
                  </p>
                )}
              </div>
            )}

            {/* Driver + Firmware status */}
            {device.matched && (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className={`rounded-lg border p-2 ${
                  device.driverUpdateAvailable
                    ? "border-qbit-warning/30 bg-qbit-warning/5"
                    : "border-qbit-success/20 bg-qbit-success/5"
                }`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Driver</p>
                  <div className="flex items-center gap-1">
                    <Icon
                      name={device.driverUpdateAvailable ? "warning" : "check_circle"}
                      className={`text-[14px] ${device.driverUpdateAvailable ? "text-qbit-warning" : "text-qbit-success"}`}
                      filled
                    />
                    <span className="text-xs font-medium text-qbit-on-surface">{device.driverStatus ?? "Unknown"}</span>
                  </div>
                </div>
                <div className={`rounded-lg border p-2 ${
                  device.firmwareUpdateAvailable
                    ? "border-qbit-warning/30 bg-qbit-warning/5"
                    : "border-qbit-success/20 bg-qbit-success/5"
                }`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Firmware</p>
                  <div className="flex items-center gap-1">
                    <Icon
                      name={device.firmwareUpdateAvailable ? "warning" : "check_circle"}
                      className={`text-[14px] ${device.firmwareUpdateAvailable ? "text-qbit-warning" : "text-qbit-success"}`}
                      filled
                    />
                    <span className="text-xs font-medium text-qbit-on-surface">{device.firmwareStatus ?? "Unknown"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Unknown device info */}
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
    );
  };

  // Render "no devices found" message
  const renderNoDevices = () => {
    if (phase !== "complete" || matchedDevices !== null && matchedDevices.length > 0) return null;
    if (discoveryResult?.devices.length === 0) {
      return (
        <div className="rounded-xl border border-qbit-warning/30 bg-qbit-warning/5 p-6 text-center">
          <Icon name="devices_off" className="mx-auto text-[40px] text-qbit-warning/60" />
          <p className="mt-2 text-sm font-medium text-qbit-on-surface">
            No compatible QBIT device detected
          </p>
          <p className="text-xs text-qbit-on-surface-variant">
            Please connect your printer via USB and scan again.
          </p>
          {discoveryResult && discoveryResult.scannersSkipped.length > 0 && (
            <div className="mt-3 space-y-1">
              {discoveryResult.scannersSkipped.map((s) => (
                <p key={s} className="text-xs text-qbit-on-surface-variant">
                  {s.toUpperCase()}: {discoveryResult.errors[s] ?? "Not available"}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Render scan progress
  const renderScanProgress = () => {
    if (!isScanning) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {phase === "usb" && (
            <div className="flex items-center gap-2">
              <Icon name="usb" className="text-[18px] text-qbit-primary" filled />
              <span className="text-xs font-medium text-qbit-primary">Scanning USB…</span>
            </div>
          )}
          {phase === "bluetooth" && (
            <div className="flex items-center gap-2">
              <Icon name="bluetooth" className="text-[18px] text-qbit-primary" filled />
              <span className="text-xs font-medium text-qbit-primary">Scanning Bluetooth…</span>
            </div>
          )}
          {phase === "lan" && (
            <div className="flex items-center gap-2">
              <Icon name="lan" className="text-[18px] text-qbit-primary" filled />
              <span className="text-xs font-medium text-qbit-primary">Scanning Network…</span>
            </div>
          )}
          {phase === "matching" && (
            <div className="flex items-center gap-2">
              <Icon name="inventory_2" className="text-[18px] text-qbit-primary" filled />
              <span className="text-xs font-medium text-qbit-primary">Matching with product library…</span>
            </div>
          )}
          {phase === "identifying" && (
            <div className="flex items-center gap-2">
              <Icon name="fingerprint" className="text-[18px] text-qbit-primary" filled />
              <span className="text-xs font-medium text-qbit-primary">Identifying devices…</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Scanner availability indicators
  const renderAvailability = () => {
    if (!scannerAvailabilities) return null;

    return (
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
          scannerAvailabilities.usb
            ? "bg-qbit-success/10 text-qbit-success"
            : "bg-qbit-error/10 text-qbit-error"
        }`}>
          <Icon name="usb" className="text-[12px]" filled />
          USB {scannerAvailabilities.usb ? "Ready" : "Not Available"}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
          scannerAvailabilities.bluetooth
            ? "bg-qbit-success/10 text-qbit-success"
            : "bg-qbit-error/10 text-qbit-error"
        }`}>
          <Icon name="bluetooth" className="text-[12px]" filled />
          BT {scannerAvailabilities.bluetooth ? "Ready" : "Not Available"}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
          scannerAvailabilities.lan
            ? "bg-qbit-success/10 text-qbit-success"
            : "bg-qbit-on-surface-variant/10 text-qbit-on-surface-variant"
        }`}>
          <Icon name="lan" className="text-[12px]" filled />
          LAN {scannerAvailabilities.lan ? "Ready" : "Needs Agent"}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Scan button */}
      <div className="flex flex-col items-center gap-3">
        {isScanning ? (
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
            <Icon name={PHASE_ICONS[phase]} className="text-[40px] transition-transform group-hover:scale-110" filled />
          </button>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold text-qbit-on-surface">
            {PHASE_LABELS[phase]}
          </p>
          <p className="text-xs text-qbit-on-surface-variant">
            {isScanning
              ? "USB → Bluetooth → Network scan running sequentially"
              : phase === "complete"
                ? "Click to scan again"
                : phase === "error"
                  ? "Click to retry scan"
                  : "Detects USB, Bluetooth, and Network printers automatically"
            }
          </p>
        </div>
        {renderAvailability()}
      </div>

      {/* Scan progress */}
      {renderScanProgress()}

      {/* No devices found */}
      {renderNoDevices()}

      {/* Matched device cards */}
      {renderDeviceCards()}
    </div>
  );
}
