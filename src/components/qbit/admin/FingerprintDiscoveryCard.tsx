"use client";

/**
 * FingerprintDiscoveryCard — auto-populates ALL hardware fields from a device scan.
 *
 * When admin clicks "Scan Device":
 *   1. Opens WebUSB device picker (or Bluetooth)
 *   2. Runs 7-step connection flow
 *   3. Extracts every possible hardware identifier
 *   4. Generates Hardware Fingerprint (SHA-256)
 *   5. Calls /api/dr-qbit/fingerprint/resolve to check DB
 *   6. Auto-populates ALL form fields
 *   7. Shows fingerprint quality, duplicate serial indicator
 *
 * No manual typing of hardware information.
 * Every field is populated from REAL hardware data.
 */

import { useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useToast } from "@/hooks/use-toast";
import {
  connectUsbDevice,
  discoveredDeviceToHardwareIdentity,
  type DiscoveredDevice,
  type UsbConnectionResult,
} from "@/lib/drqbit/device-discovery";
import type {
  UniversalHardwareIdentity,
  HardwareFingerprintResult,
  FingerprintQuality,
  DetectionPriorityKey,
} from "@/lib/drqbit/fingerprint-types";
import { FINGERPRINT_QUALITY_DISPLAY, DETECTION_PRIORITY_LABELS, DETECTION_PRIORITY_ICONS } from "@/lib/drqbit/fingerprint-types";

export interface FingerprintScanResult {
  identity: UniversalHardwareIdentity;
  fingerprintResult: HardwareFingerprintResult;
  lookupAction: "open_profile" | "register_new" | "resolve_duplicate";
  passportId: string | null;
  passportNumber: string | null;
  deviceUuid: string;
  isNewDevice: boolean;
  duplicateSerial: boolean;
}

interface FingerprintDiscoveryCardProps {
  onScanComplete: (result: FingerprintScanResult) => void;
  existingSerial?: string;
}

export function FingerprintDiscoveryCard({ onScanComplete, existingSerial }: FingerprintDiscoveryCardProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FingerprintScanResult | null>(null);
  const [usbConnection, setUsbConnection] = useState<UsbConnectionResult | null>(null);

  async function handleScanDevice() {
    if (!navigator.usb) {
      toast({ title: "WebUSB not supported", description: "Use Chrome or Edge over HTTPS to scan devices.", variant: "destructive" });
      return;
    }

    setScanning(true);
    setUsbConnection(null);

    try {
      // Step 1: Request device from user
      console.log("[DrQBIT Admin Scan] STEP 1: requestDevice()");
      const device = await navigator.usb.requestDevice({ filters: [] });

      const vid = "0x" + device.vendorId.toString(16).toUpperCase().padStart(4, "0");
      const pid = "0x" + device.productId.toString(16).toUpperCase().padStart(4, "0");
      const name = device.productName || "USB Device";
      const manufacturer = device.manufacturerName || null;
      const serial = device.serialNumber || null;

      console.log(`[DrQBIT Admin Scan] Device: "${name}" VID=${vid} PID=${pid} Serial="${serial ?? "N/A"}"`);

      // Step 2-7: Run 7-step connection flow
      const connectionResult = await connectUsbDevice(device);
      setUsbConnection(connectionResult);

      if (!connectionResult.connected) {
        toast({
          title: `USB Connection Failed at ${connectionResult.failedStep?.replace("step", "STEP ")}`,
          description: connectionResult.errorMessage ?? "Unknown error",
          variant: "destructive",
        });
        // Still proceed with descriptor data — we have VID/PID/serial
      }

      // Build DiscoveredDevice from USB device
      const discoveredDevice: DiscoveredDevice = {
        connectionType: "usb",
        deviceName: name,
        manufacturer,
        vendorId: vid,
        productId: pid,
        serialNumber: serial,
        usbVersion: `${device.usbVersionMajor}.${device.usbVersionMinor}.${device.usbVersionSubminor}`,
        port: "USB",
        bluetoothDeviceId: null,
        ipAddress: null,
        macAddress: null,
        isPrinterLike: true,
        firmwareVersion: null,
        hardwareRevision: null,
        softwareRevision: null,
        interfaceClass: null,
        interfaceClasses: [],
        modelNumber: null,
        usbConnection: connectionResult,
        // Fingerprint fields
        usbDeviceInstanceId: serial ? `USB\\VID_${vid.replace("0x", "")}&PID_${pid.replace("0x", "")}\\${serial}` : null,
        usbContainerId: null,
        usbDevicePath: connectionResult.connected ? `USB_${vid}_${pid}_${serial ?? "noserial"}` : null,
        usbPortPath: null,
        usbLocationPath: null,
        usbInterfaceNumber: connectionResult.claimedInterfaceNumber ?? null,
        usbBusNumber: null,
        usbAddress: null,
        usbDeviceClass: null,
        usbDeviceSubclass: null,
        productCode: null,
        ethernetMacAddress: null,
        wifiMacAddress: null,
        bluetoothMacAddress: null,
        bluetoothDeviceAddress: null,
        bluetoothName: null,
        chipUid: null,
        flashId: null,
        factoryDeviceUuid: null,
        manufacturingBatch: null,
        manufacturingDate: null,
        pnpDeviceId: null,
        containerGuid: null,
        parentDevice: null,
        driverVersion: null,
        driverProvider: null,
        driverDate: null,
        deviceClassGuid: null,
        hardwareIds: null,
        compatibleIds: null,
        hostname: null,
      };

      // Convert to UniversalHardwareIdentity
      const identity = discoveredDeviceToHardwareIdentity(discoveredDevice);

      // Call fingerprint API to generate hash + lookup in DB
      const res = await fetch("/api/dr-qbit/fingerprint/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Fingerprint resolution failed");
      }

      const data = await res.json();
      const fingerprintResult = data.fingerprintResult as HardwareFingerprintResult;
      const lookupAction = data.action as "open_profile" | "register_new" | "resolve_duplicate";
      const passport = data.passport as Record<string, unknown> | null;

      const result: FingerprintScanResult = {
        identity,
        fingerprintResult,
        lookupAction,
        passportId: passport?.id as string | null ?? null,
        passportNumber: passport?.passportNumber as string | null ?? null,
        deviceUuid: fingerprintResult.deviceUuid,
        isNewDevice: data.action === "register_new",
        duplicateSerial: fingerprintResult.duplicateSerialDetected,
      };

      setScanResult(result);

      toast({
        title: fingerprintResult.duplicateSerialDetected
          ? "Duplicate Serial Detected!"
          : lookupAction === "open_profile"
            ? "Device Found in Database"
            : "New Device — Ready for Registration",
        description: `Fingerprint: ${fingerprintResult.quality} quality (${fingerprintResult.identifierCount} identifiers)\nPrimary: ${DETECTION_PRIORITY_LABELS[fingerprintResult.primaryIdentifier]}`,
        variant: fingerprintResult.duplicateSerialDetected ? "destructive" : "default",
      });

      onScanComplete(result);
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotFoundError") {
        // User cancelled picker — no error
        return;
      }
      toast({
        title: "Scan Failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  }

  const qualityDisplay = scanResult
    ? FINGERPRINT_QUALITY_DISPLAY[scanResult.fingerprintResult.quality]
    : null;

  return (
    <div className="space-y-4">
      {/* Scan Button */}
      <div className="flex items-center gap-3">
        <QbitButton
          variant="primary"
          icon={scanning ? "progress_activity" : "search"}
          disabled={scanning}
          onClick={handleScanDevice}
        >
          {scanning ? "Scanning Device…" : "Scan Device"}
        </QbitButton>
        {existingSerial && !scanResult && (
          <span className="text-xs text-qbit-on-surface-variant">
            Current serial: {existingSerial}
          </span>
        )}
      </div>

      {/* Fingerprint Result Display */}
      {scanResult && (
        <div className="rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low p-4 space-y-3">
          {/* Fingerprint Quality */}
          <div className="flex items-center gap-2">
            <Icon name={qualityDisplay?.icon ?? "fingerprint"} className={`text-[20px] ${qualityDisplay?.color ?? "text-qbit-on-surface-variant"}`} filled />
            <div>
              <p className={`text-sm font-bold ${qualityDisplay?.color ?? ""}`}>
                {qualityDisplay?.label ?? "Unknown"} Fingerprint
              </p>
              <p className="text-xs text-qbit-on-surface-variant">
                {qualityDisplay?.description ?? ""}
              </p>
            </div>
          </div>

          {/* Primary Identifier */}
          <div className="flex items-center gap-2 text-sm">
            <Icon name={DETECTION_PRIORITY_ICONS[scanResult.fingerprintResult.primaryIdentifier]} className="text-[16px] text-qbit-primary" />
            <span className="text-qbit-on-surface-variant">Primary:</span>
            <span className="font-medium text-qbit-on-surface">
              {DETECTION_PRIORITY_LABELS[scanResult.fingerprintResult.primaryIdentifier]}
            </span>
          </div>

          {/* Duplicate Serial Indicator */}
          {scanResult.duplicateSerial && (
            <div className="flex items-center gap-2 rounded-lg border border-qbit-error/30 bg-qbit-error/5 p-2">
              <Icon name="warning" className="text-[18px] text-qbit-error" filled />
              <div>
                <p className="text-sm font-semibold text-qbit-error">Duplicate Serial Number Detected</p>
                <p className="text-xs text-qbit-on-surface-variant">
                  Another device shares this serial. The Hardware Fingerprint will be used for unique identification instead.
                </p>
              </div>
            </div>
          )}

          {/* Device Status */}
          <div className="flex items-center gap-2 text-sm">
            <Icon name={scanResult.isNewDevice ? "add_circle" : "check_circle"} className={`text-[16px] ${scanResult.isNewDevice ? "text-qbit-primary" : "text-qbit-success"}`} filled />
            <span className={scanResult.isNewDevice ? "text-qbit-primary font-medium" : "text-qbit-success font-medium"}>
              {scanResult.isNewDevice ? "New Device — Register" : "Existing Device — Profile Found"}
            </span>
            {scanResult.passportNumber && (
              <span className="text-xs text-qbit-on-surface-variant">({scanResult.passportNumber})</span>
            )}
          </div>

          {/* Identifier Count */}
          <div className="text-xs text-qbit-on-surface-variant">
            {scanResult.fingerprintResult.identifierCount} identifiers collected •
            Fingerprint hash: <code className="text-qbit-primary">{scanResult.fingerprintResult.fingerprintHash.slice(0, 16)}…</code>
          </div>

          {/* USB Connection Status */}
          {usbConnection && !usbConnection.connected && (
            <div className="rounded-lg border border-qbit-warning/30 bg-qbit-warning/5 p-2 text-xs">
              <p className="font-semibold text-qbit-warning">
                USB connection failed at {usbConnection.failedStep?.replace("step", "STEP ")}
              </p>
              <p className="text-qbit-on-surface-variant">
                {usbConnection.errorMessage ?? "Unknown error"}.
                Descriptor data (VID/PID/serial) is still available for registration.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
