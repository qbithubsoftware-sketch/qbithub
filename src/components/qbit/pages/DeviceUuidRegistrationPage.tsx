"use client";

/**
 * DeviceUuidRegistrationPage — Admin Device Registration page with the scan workflow.
 *
 * Step 1: Click "Scan Device" button → uses FingerprintDiscoveryCard
 * Step 2: Display scanned hardware info (auto-populated from FingerprintScanResult)
 * Step 3: Show Device UUID, Fingerprint Quality, Duplicate Serial indicator
 * Step 4: Admin fills in business fields:
 *   - Customer selection (dropdown from CustomerAccount)
 *   - Dealer selection (dropdown from Users with dealer role)
 *   - Invoice Number (text input)
 *   - Purchase Date (date input)
 *   - Warranty Start Date / End Date (date inputs)
 *   - Product selection (dropdown from QbitProduct)
 * Step 5: Click "Save Device" → POST /api/dr-qbit/uuid/register
 * Step 6: Show success message with QR Code
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Input } from "@/components/ui/input";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { useNavigation } from "@/lib/navigation/store";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/hooks/use-toast";
import { FingerprintDiscoveryCard, type FingerprintScanResult } from "@/components/qbit/admin/FingerprintDiscoveryCard";
import { QbitDeviceQRCode } from "@/components/qbit/QbitDeviceQRCode";
import { FINGERPRINT_QUALITY_DISPLAY, DETECTION_PRIORITY_LABELS, DETECTION_PRIORITY_ICONS } from "@/lib/drqbit/fingerprint-types";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface CustomerOption {
  id: string;
  name: string;
  mobileNumber: string;
  companyName: string | null;
}

interface DealerOption {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  name: string;
  brand: string;
  model: string;
  imageUrl: string | null;
  deviceType: string;
}

interface RegistrationResult {
  deviceUuid: string;
  passportNumber: string;
  qrCode: string;
  serialNumber: string | null;
  deviceName: string | null;
  duplicateSerialDetected: boolean;
  message: string;
}

/* ------------------------------------------------------------------ */
/* Step tracker                                                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  { id: 1, label: "Scan Device", icon: "search" },
  { id: 2, label: "Hardware Info", icon: "memory" },
  { id: 3, label: "UUID & Fingerprint", icon: "fingerprint" },
  { id: 4, label: "Business Fields", icon: "assignment" },
  { id: 5, label: "Save Device", icon: "save" },
  { id: 6, label: "Success", icon: "check_circle" },
];

export function DeviceUuidRegistrationPage() {
  const { user, role } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const { toast } = useToast();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Scan result from FingerprintDiscoveryCard
  const [scanResult, setScanResult] = useState<FingerprintScanResult | null>(null);

  // Business fields
  const [customerId, setCustomerId] = useState("");
  const [dealerId, setDealerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyStartDate, setWarrantyStartDate] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");
  const [productId, setProductId] = useState("");

  // Dropdown data
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Registration result
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [saving, setSaving] = useState(false);

  /* ------------------------------------------------------------------ */
  /* Fetch dropdown data                                                 */
  /* ------------------------------------------------------------------ */

  const fetchDropdownData = useCallback(async () => {
    try {
      // Fetch customers
      const custRes = await fetch("/api/dr-qbit/uuid/serial-search?serial=dummy&_customers=true");
      // Instead, use a simpler approach - fetch from known endpoints
      const [custData, dealerData, prodData] = await Promise.all([
        fetch("/api/admin/customers").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/admin/users?role=dealer").then(r => r.ok ? r.json() : []).catch(() => []),
        fetch("/api/dr-qbit/products").then(r => r.ok ? r.json() : []).catch(() => []),
      ]);

      setCustomers(
        (Array.isArray(custData) ? custData : custData?.customers ?? []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          mobileNumber: c.mobileNumber as string,
          companyName: c.companyName as string | null,
        }))
      );
      setDealers(
        (Array.isArray(dealerData) ? dealerData : dealerData?.users ?? []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          name: d.name as string,
        }))
      );
      setProducts(
        (Array.isArray(prodData) ? prodData : prodData?.products ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          brand: p.brand as string,
          model: p.model as string,
          imageUrl: p.imageUrl as string | null,
          deviceType: p.deviceType as string,
        }))
      );
    } catch {
      // Silently fail — dropdowns will be empty but registration can still proceed
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  /* ------------------------------------------------------------------ */
  /* Scan complete handler                                               */
  /* ------------------------------------------------------------------ */

  function handleScanComplete(result: FingerprintScanResult) {
    setScanResult(result);
    setCurrentStep(2); // advance to Hardware Info step

    toast({
      title: result.isNewDevice
        ? "New Device Detected"
        : "Existing Device Found",
      description: `UUID: ${result.deviceUuid} • Quality: ${result.fingerprintResult.quality}`,
    });

    // If device already exists, we can navigate to its profile
    if (result.lookupAction === "open_profile" && result.passportId) {
      toast({
        title: "Device Already Registered",
        description: "This device has an existing profile. You can view it or update the registration.",
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Save device handler                                                 */
  /* ------------------------------------------------------------------ */

  async function handleSaveDevice() {
    if (!scanResult) return;
    setSaving(true);

    try {
      const body = {
        fingerprintResult: {
          fingerprintHash: scanResult.fingerprintResult.fingerprintHash,
          deviceUuid: scanResult.fingerprintResult.deviceUuid,
          primaryIdentifier: scanResult.fingerprintResult.primaryIdentifier,
          quality: scanResult.fingerprintResult.quality,
          duplicateSerialDetected: scanResult.fingerprintResult.duplicateSerialDetected,
          identifierCount: scanResult.fingerprintResult.identifierCount,
          usedIdentifiers: scanResult.fingerprintResult.usedIdentifiers,
          generatedAt: scanResult.fingerprintResult.generatedAt,
        },
        identity: {
          manufacturer: scanResult.identity.manufacturer,
          productName: scanResult.identity.productName,
          model: scanResult.identity.model,
          productCode: scanResult.identity.productCode,
          firmwareVersion: scanResult.identity.firmwareVersion,
          hardwareRevision: scanResult.identity.hardwareRevision,
          sdkSerialNumber: scanResult.identity.sdkSerialNumber,
          vendorId: scanResult.identity.vendorId,
          productId: scanResult.identity.productId,
          usbDeviceInstanceId: scanResult.identity.usbDeviceInstanceId,
          usbContainerId: scanResult.identity.usbContainerId,
          usbDevicePath: scanResult.identity.usbDevicePath,
          chipUid: scanResult.identity.chipUid,
          factoryDeviceUuid: scanResult.identity.factoryDeviceUuid,
          ethernetMacAddress: scanResult.identity.ethernetMacAddress,
          bluetoothMacAddress: scanResult.identity.bluetoothMacAddress,
        },
        // Business fields
        customerId: customerId || undefined,
        dealerId: dealerId || undefined,
        invoiceNumber: invoiceNumber || undefined,
        purchaseDate: purchaseDate || undefined,
        warrantyStartDate: warrantyStartDate || undefined,
        warrantyEndDate: warrantyEndDate || undefined,
        productId: productId || undefined,
      };

      const res = await fetch("/api/dr-qbit/uuid/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Registration failed");
      }

      const data = await res.json();
      setRegistrationResult({
        deviceUuid: data.device.deviceUuid ?? scanResult.fingerprintResult.deviceUuid,
        passportNumber: data.device.passportNumber ?? "PASS-NEW",
        qrCode: data.device.qrCode ?? `QBT://DEVICE/${scanResult.fingerprintResult.deviceUuid}`,
        serialNumber: data.device.serialNumber ?? scanResult.identity.sdkSerialNumber ?? null,
        deviceName: data.device.deviceName ?? scanResult.identity.productName ?? null,
        duplicateSerialDetected: data.duplicateSerialDetected ?? false,
        message: data.message ?? "Device registered successfully",
      });
      setCurrentStep(6);

      toast({
        title: "Device Registered!",
        description: `UUID: ${data.device.deviceUuid} • Passport: ${data.device.passportNumber}`,
      });
    } catch (e) {
      toast({
        title: "Registration Failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Navigate to profile after registration                              */
  /* ------------------------------------------------------------------ */

  function handleViewProfile() {
    if (registrationResult) {
      navigate("device-uuid-profile", { deviceUuid: registrationResult.deviceUuid });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const shellUser = {
    name: user?.name ?? "Admin",
    role: role ?? "administrator",
    initials: user?.name?.slice(0, 2).toUpperCase() ?? "AD",
  };

  const topBar = {
    title: "Device Registration (UUID)",
    breadcrumbs: [
      { label: "Home", icon: "home", onClick: () => navigate("home") },
      { label: "Dr. QBIT", icon: "smart_toy", onClick: () => navigate("dr-qbit-detection") },
      { label: "Device Register (UUID)", icon: "fingerprint" },
    ],
    actions: [],
  };

  const qualityDisplay = scanResult
    ? FINGERPRINT_QUALITY_DISPLAY[scanResult.fingerprintResult.quality]
    : null;

  function renderStepContent() {
    // Step 1: Scan Device
    if (currentStep === 1) {
      return (
        <SurfaceCard className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary/10">
              <Icon name="search" className="text-[24px] text-qbit-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-qbit-on-surface">Scan Device</p>
              <p className="text-sm text-qbit-on-surface-variant">
                Connect a USB device and click "Scan Device" to auto-detect and extract hardware identifiers.
              </p>
            </div>
          </div>

          <FingerprintDiscoveryCard onScanComplete={handleScanComplete} />

          {/* Manual UUID input fallback */}
          <div className="border-t border-qbit-outline-variant/30 pt-4 mt-4">
            <p className="text-xs text-qbit-on-surface-variant mb-2">
              Alternatively, enter a known Device UUID to register or update:
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="QBT-XXXXXXXX-XXXX-XXXX"
                className="text-sm font-mono"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.startsWith("QBT-")) {
                    // Navigate to profile page with this UUID
                    navigate("device-uuid-profile", { deviceUuid: e.currentTarget.value });
                  }
                }}
              />
              <QbitButton variant="outline" icon="arrow_forward" size="sm">
                Lookup
              </QbitButton>
            </div>
          </div>
        </SurfaceCard>
      );
    }

    // Step 2: Hardware Info
    if (currentStep === 2 && scanResult) {
      const id = scanResult.identity;
      return (
        <SurfaceCard className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary/10">
              <Icon name="memory" className="text-[24px] text-qbit-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-qbit-on-surface">Hardware Info (Auto-populated)</p>
              <p className="text-sm text-qbit-on-surface-variant">
                All fields were extracted from the physical device during scan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoItem label="Device Name" value={id.productName ?? "Unknown"} icon="devices" />
            <InfoItem label="Manufacturer" value={id.manufacturer ?? "Unknown"} icon="factory" />
            <InfoItem label="Model" value={id.model ?? "Unknown"} icon="inventory_2" />
            <InfoItem label="Serial Number" value={id.sdkSerialNumber ?? "N/A"} icon="tag" />
            <InfoItem label="Vendor ID" value={id.vendorId ?? "N/A"} icon="barcode" />
            <InfoItem label="Product ID" value={id.productId ?? "N/A"} icon="qr_code" />
            <InfoItem label="Firmware Version" value={id.firmwareVersion ?? "N/A"} icon="upgrade" />
            <InfoItem label="Hardware Revision" value={id.hardwareRevision ?? "N/A"} icon="hardware" />
            <InfoItem label="Product Code" value={id.productCode ?? "N/A"} icon="label" />
            <InfoItem label="USB Instance ID" value={id.usbDeviceInstanceId ?? "N/A"} icon="usb" />
            <InfoItem label="Chip UID" value={id.chipUid ?? "N/A"} icon="memory" />
            <InfoItem label="Factory UUID" value={id.factoryDeviceUuid ?? "N/A"} icon="fingerprint" />
          </div>

          {id.ethernetMacAddress && <InfoItem label="Ethernet MAC" value={id.ethernetMacAddress} icon="lan" />}
          {id.bluetoothMacAddress && <InfoItem label="Bluetooth MAC" value={id.bluetoothMacAddress} icon="bluetooth" />}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <QbitButton variant="outline" icon="arrow_back" onClick={() => setCurrentStep(1)}>
              Re-scan
            </QbitButton>
            <QbitButton variant="primary" icon="arrow_forward" onClick={() => setCurrentStep(3)}>
              View UUID & Fingerprint
            </QbitButton>
          </div>
        </SurfaceCard>
      );
    }

    // Step 3: UUID & Fingerprint
    if (currentStep === 3 && scanResult) {
      const fp = scanResult.fingerprintResult;
      return (
        <SurfaceCard className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary/10">
              <Icon name="fingerprint" className="text-[24px] text-qbit-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-qbit-on-surface">Device UUID & Fingerprint</p>
              <p className="text-sm text-qbit-on-surface-variant">
                The QBIT Device UUID is the permanent, immutable identity for this device.
              </p>
            </div>
          </div>

          {/* Device UUID */}
          <div className="rounded-xl border-2 border-qbit-primary/30 bg-qbit-primary/5 p-4 text-center">
            <p className="text-xs text-qbit-on-surface-variant mb-1">QBIT Device UUID</p>
            <p className="text-lg font-mono font-bold text-qbit-primary break-all">{fp.deviceUuid}</p>
          </div>

          {/* Fingerprint Quality */}
          {qualityDisplay && (
            <div className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low p-3">
              <Icon name={qualityDisplay.icon} className={`text-[20px] ${qualityDisplay.color}`} filled />
              <div>
                <p className={`text-sm font-bold ${qualityDisplay.color}`}>{qualityDisplay.label} Fingerprint</p>
                <p className="text-xs text-qbit-on-surface-variant">{qualityDisplay.description}</p>
              </div>
            </div>
          )}

          {/* Primary Identifier */}
          <div className="flex items-center gap-2 text-sm">
            <Icon name={DETECTION_PRIORITY_ICONS[fp.primaryIdentifier]} className="text-[18px] text-qbit-primary" />
            <span className="text-qbit-on-surface-variant">Primary Identifier:</span>
            <span className="font-semibold text-qbit-on-surface">{DETECTION_PRIORITY_LABELS[fp.primaryIdentifier]}</span>
          </div>

          {/* Identifier Count */}
          <p className="text-xs text-qbit-on-surface-variant">
            {fp.identifierCount} identifiers collected •
            Hash: <code className="text-qbit-primary">{fp.fingerprintHash.slice(0, 16)}…</code>
          </p>

          {/* Duplicate Serial Indicator */}
          {scanResult.duplicateSerial && (
            <div className="flex items-center gap-2 rounded-lg border border-qbit-warning/30 bg-qbit-warning/5 p-3">
              <Icon name="warning" className="text-[18px] text-qbit-warning" filled />
              <div>
                <p className="text-sm font-bold text-qbit-warning">Duplicate Serial Number Detected</p>
                <p className="text-xs text-qbit-on-surface-variant">
                  Another device shares this serial. The Hardware Fingerprint will be used for unique identification.
                </p>
              </div>
            </div>
          )}

          {/* Device Status */}
          <div className="flex items-center gap-2 text-sm">
            <Icon name={scanResult.isNewDevice ? "add_circle" : "check_circle"} className={`text-[18px] ${scanResult.isNewDevice ? "text-qbit-primary" : "text-qbit-success"}`} filled />
            <span className={scanResult.isNewDevice ? "text-qbit-primary font-semibold" : "text-qbit-success font-semibold"}>
              {scanResult.isNewDevice ? "New Device — Ready for Registration" : "Existing Device — Profile Found"}
            </span>
            {scanResult.passportNumber && (
              <span className="text-xs text-qbit-on-surface-variant">({scanResult.passportNumber})</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <QbitButton variant="outline" icon="arrow_back" onClick={() => setCurrentStep(2)}>
              Back to Hardware Info
            </QbitButton>
            {scanResult.isNewDevice ? (
              <QbitButton variant="primary" icon="assignment" onClick={() => setCurrentStep(4)}>
                Fill Business Fields
              </QbitButton>
            ) : (
              <QbitButton
                variant="primary"
                icon="visibility"
                onClick={() => navigate("device-uuid-profile", { deviceUuid: scanResult.deviceUuid })}
              >
                View Device Profile
              </QbitButton>
            )}
          </div>
        </SurfaceCard>
      );
    }

    // Step 4: Business Fields
    if (currentStep === 4 && scanResult) {
      return (
        <SurfaceCard className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary/10">
              <Icon name="assignment" className="text-[24px] text-qbit-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-qbit-on-surface">Business & Registration Fields</p>
              <p className="text-sm text-qbit-on-surface-variant">
                Fill in purchase and warranty information to complete the registration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Selection */}
            <div>
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1.5 block">
                Customer Account
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="h-10 w-full rounded-xl border border-qbit-outline-variant/60 bg-qbit-surface-container-lowest px-3 text-sm text-qbit-on-surface focus:outline-none focus:ring-2 focus:ring-qbit-primary/30"
              >
                <option value="">— Select Customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""} — {c.mobileNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Dealer Selection */}
            <div>
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1.5 block">
                Dealer
              </label>
              <select
                value={dealerId}
                onChange={(e) => setDealerId(e.target.value)}
                className="h-10 w-full rounded-xl border border-qbit-outline-variant/60 bg-qbit-surface-container-lowest px-3 text-sm text-qbit-on-surface focus:outline-none focus:ring-2 focus:ring-qbit-primary/30"
              >
                <option value="">— Select Dealer —</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Number */}
            <div>
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1.5 block">
                Invoice Number
              </label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2024-00123"
                className="text-sm"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1.5 block">
                Purchase Date
              </label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Warranty Start Date */}
            <div>
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1.5 block">
                Warranty Start Date
              </label>
              <Input
                type="date"
                value={warrantyStartDate}
                onChange={(e) => setWarrantyStartDate(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Warranty End Date */}
            <div>
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1.5 block">
                Warranty End Date
              </label>
              <Input
                type="date"
                value={warrantyEndDate}
                onChange={(e) => setWarrantyEndDate(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Product Selection */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1.5 block">
                Product (from Product Master)
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="h-10 w-full rounded-xl border border-qbit-outline-variant/60 bg-qbit-surface-container-lowest px-3 text-sm text-qbit-on-surface focus:outline-none focus:ring-2 focus:ring-qbit-primary/30"
              >
                <option value="">— Select Product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} {p.name} ({p.model}) — {p.deviceType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <QbitButton variant="outline" icon="arrow_back" onClick={() => setCurrentStep(3)}>
              Back to UUID & Fingerprint
            </QbitButton>
            <QbitButton variant="primary" icon="save" onClick={() => setCurrentStep(5)}>
              Ready to Save
            </QbitButton>
          </div>
        </SurfaceCard>
      );
    }

    // Step 5: Save Device (confirmation)
    if (currentStep === 5 && scanResult) {
      return (
        <SurfaceCard className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary/10">
              <Icon name="save" className="text-[24px] text-qbit-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-qbit-on-surface">Confirm & Save Device</p>
              <p className="text-sm text-qbit-on-surface-variant">
                Review the registration details and click "Save Device" to register in the QBIT system.
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-qbit-primary/30 bg-qbit-primary/5 p-4 space-y-2">
            <p className="text-sm font-bold text-qbit-on-surface">Registration Summary</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <p className="text-qbit-on-surface-variant">
                Device UUID: <strong className="text-qbit-primary font-mono">{scanResult.fingerprintResult.deviceUuid}</strong>
              </p>
              <p className="text-qbit-on-surface-variant">
                Serial Number: <strong className="text-qbit-on-surface">{scanResult.identity.sdkSerialNumber ?? "N/A"}</strong>
              </p>
              <p className="text-qbit-on-surface-variant">
                Device Name: <strong className="text-qbit-on-surface">{scanResult.identity.productName ?? "Unknown"}</strong>
              </p>
              <p className="text-qbit-on-surface-variant">
                Manufacturer: <strong className="text-qbit-on-surface">{scanResult.identity.manufacturer ?? "Unknown"}</strong>
              </p>
              <p className="text-qbit-on-surface-variant">
                Fingerprint: <strong className={qualityDisplay?.color ?? ""}>{qualityDisplay?.label ?? "Unknown"}</strong>
              </p>
              <p className="text-qbit-on-surface-variant">
                Duplicate Serial: <strong className={scanResult.duplicateSerial ? "text-qbit-warning" : "text-qbit-success"}>
                  {scanResult.duplicateSerial ? "YES" : "NO"}
                </strong>
              </p>
            </div>
          </div>

          {/* Business fields summary */}
          <div className="rounded-xl border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-3 space-y-1 text-sm">
            <p className="text-xs font-bold text-qbit-on-surface-variant">Business Fields</p>
            {customerId && <p>Customer: <strong className="text-qbit-on-surface">{customers.find(c => c.id === customerId)?.name ?? customerId}</strong></p>}
            {dealerId && <p>Dealer: <strong className="text-qbit-on-surface">{dealers.find(d => d.id === dealerId)?.name ?? dealerId}</strong></p>}
            {invoiceNumber && <p>Invoice: <strong className="text-qbit-on-surface">{invoiceNumber}</strong></p>}
            {purchaseDate && <p>Purchase Date: <strong className="text-qbit-on-surface">{purchaseDate}</strong></p>}
            {warrantyStartDate && <p>Warranty Start: <strong className="text-qbit-on-surface">{warrantyStartDate}</strong></p>}
            {warrantyEndDate && <p>Warranty End: <strong className="text-qbit-on-surface">{warrantyEndDate}</strong></p>}
            {productId && <p>Product: <strong className="text-qbit-on-surface">{products.find(p => p.id === productId)?.name ?? productId}</strong></p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <QbitButton variant="outline" icon="arrow_back" onClick={() => setCurrentStep(4)}>
              Back to Business Fields
            </QbitButton>
            <QbitButton
              variant="primary"
              icon={saving ? "progress_activity" : "save"}
              disabled={saving}
              onClick={handleSaveDevice}
            >
              {saving ? "Saving Device…" : "Save Device"}
            </QbitButton>
          </div>
        </SurfaceCard>
      );
    }

    // Step 6: Success
    if (currentStep === 6 && registrationResult) {
      return (
        <div className="space-y-4">
          {/* Success banner */}
          <SurfaceCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-qbit-success/10">
                <Icon name="check_circle" className="text-[32px] text-qbit-success" filled />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-qbit-success">Device Registered Successfully!</p>
                <p className="text-sm text-qbit-on-surface-variant">{registrationResult.message}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="rounded-full bg-qbit-primary/10 px-2 py-0.5 text-[10px] font-semibold text-qbit-primary">
                    UUID: {registrationResult.deviceUuid}
                  </span>
                  <span className="rounded-full bg-qbit-surface-container-low px-2 py-0.5 text-[10px] font-medium text-qbit-on-surface-variant">
                    Passport: {registrationResult.passportNumber}
                  </span>
                  {registrationResult.serialNumber && (
                    <span className="rounded-full bg-qbit-surface-container-low px-2 py-0.5 text-[10px] font-medium text-qbit-on-surface-variant">
                      Serial: {registrationResult.serialNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* Duplicate serial warning */}
          {registrationResult.duplicateSerialDetected && (
            <div className="flex items-center gap-3 rounded-xl border border-qbit-warning/30 bg-qbit-warning/5 p-4">
              <Icon name="warning" className="text-[20px] text-qbit-warning" filled />
              <div>
                <p className="text-sm font-bold text-qbit-warning">Duplicate Serial Number Detected</p>
                <p className="text-xs text-qbit-on-surface-variant">
                  The device was registered using its Hardware Fingerprint UUID for unique identification.
                  The serial number is shared with another device.
                </p>
              </div>
            </div>
          )}

          {/* QR Code */}
          <QbitDeviceQRCode
            deviceUuid={registrationResult.deviceUuid}
            serialNumber={registrationResult.serialNumber ?? undefined}
            productName={registrationResult.deviceName ?? undefined}
          />

          {/* Actions */}
          <div className="flex gap-2">
            <QbitButton variant="primary" icon="visibility" onClick={handleViewProfile}>
              View Device Profile
            </QbitButton>
            <QbitButton variant="outline" icon="add_circle" onClick={() => {
              // Reset for new registration
              setScanResult(null);
              setRegistrationResult(null);
              setCurrentStep(1);
              setCustomerId("");
              setDealerId("");
              setInvoiceNumber("");
              setPurchaseDate("");
              setWarrantyStartDate("");
              setWarrantyEndDate("");
              setProductId("");
            }}>
              Register Another Device
            </QbitButton>
            <QbitButton variant="ghost" icon="home" onClick={() => navigate("home")}>
              Back to Dashboard
            </QbitButton>
          </div>
        </div>
      );
    }

    // Fallback — no data
    return (
      <SurfaceCard className="p-6 text-center">
        <Icon name="info" className="text-[32px] text-qbit-on-surface-variant mb-2" />
        <p className="text-sm text-qbit-on-surface-variant">No scan data available. Start by scanning a device.</p>
        <QbitButton variant="primary" icon="search" onClick={() => setCurrentStep(1)} className="mt-2">
          Scan Device
        </QbitButton>
      </SurfaceCard>
    );
  }

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Universal Device Identity", icon: "fingerprint" }}
      navItems={ADMIN_NAV}
      activeScreen="device-uuid-register"
      user={shellUser}
      topBar={topBar}
    >
      {/* Step Progress Tracker */}
      <div className="mb-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <button
                key={step.id}
                onClick={() => {
                  // Only allow navigation to completed steps or current step
                  if (step.id <= currentStep && (scanResult || step.id === 1)) {
                    setCurrentStep(step.id);
                  }
                }}
                disabled={step.id > currentStep || (!scanResult && step.id !== 1)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all shrink-0",
                  isActive && "bg-qbit-primary/10 text-qbit-primary font-semibold",
                  isCompleted && "bg-qbit-success/10 text-qbit-success",
                  !isActive && !isCompleted && "text-qbit-on-surface-variant opacity-50",
                )}
              >
                <Icon name={isCompleted ? "check_circle" : step.icon} className="text-[14px]" filled={isCompleted || isActive} />
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {renderStepContent()}
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Helper Components                                                    */
/* ------------------------------------------------------------------ */

function InfoItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-qbit-surface-container-low p-2">
      <Icon name={icon} className="text-[16px] text-qbit-on-surface-variant shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">{label}</p>
        <p className="text-sm font-medium text-qbit-on-surface truncate">{value}</p>
      </div>
    </div>
  );
}
