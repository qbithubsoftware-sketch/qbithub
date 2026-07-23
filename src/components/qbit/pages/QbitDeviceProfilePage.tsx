"use client";

/**
 * QbitDeviceProfilePage — Customer Device Profile page.
 *
 * Shows the complete profile for a device identified by its QBIT Device UUID.
 * Features:
 *   - Product Image, Product Name, Model Number, Serial Number
 *   - Warranty Status card (active=green, expired=red, with dates and remaining days)
 *   - Activation Date, Firmware Version
 *   - Downloads section (drivers, manuals, firmware)
 *   - Knowledge Base & Support links
 *   - Repair History placeholder
 *   - NEVER show internal UUID unless Developer Mode is enabled (toggle in footer)
 *   - Duplicate Serial warning banner (amber) if duplicateSerialFlag is true
 *   - QR Code display section
 *
 * The page receives deviceUuid via navigation params (useNavigation().params.deviceUuid).
 * It calls GET /api/dr-qbit/uuid/lookup?uuid={deviceUuid} to fetch device data.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { useNavigation } from "@/lib/navigation/store";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/hooks/use-toast";
import { QbitDeviceQRCode } from "@/components/qbit/QbitDeviceQRCode";
import { DuplicateSerialResolution } from "@/components/qbit/DuplicateSerialResolution";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface DeviceProfile {
  id: string;
  deviceUuid: string;
  passportNumber: string;
  qrCode: string | null;
  // Product info
  productName: string | null;
  productBrand: string | null;
  productModel: string | null;
  productImage: string | null;
  productType: string | null;
  productSlug: string | null;
  productDescription: string | null;
  // Customer-visible fields
  serialNumber: string | null;
  manufacturer: string | null;
  firmwareVersion: string | null;
  hardwareRevision: string | null;
  productCode: string | null;
  deviceStatus: string;
  // Warranty
  warrantyStatus: string;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  warrantyDaysRemaining: number | null;
  extendedWarranty: boolean;
  // Customer info
  customerName: string | null;
  customerCompany: string | null;
  customerMobile: string | null;
  // Dealer info
  dealerName: string | null;
  // Business
  invoiceNumber: string | null;
  purchaseDate: string | null;
  registrationDate: string | null;
  activationDate: string | null;
  // Driver
  driverStatus: string;
  installedDriverVersion: string | null;
  latestDriverVersion: string | null;
  latestDriverDownloadUrl: string | null;
  // Firmware
  firmwareStatus: string;
  // Duplicate serial flag
  duplicateSerialFlag: boolean;
  fingerprintQuality: string | null;
  // Developer Mode only
  hardwareFingerprint: string | null;
  chipUid: string | null;
  factoryDeviceUuid: string | null;
  ethernetMacAddress: string | null;
  bluetoothMacAddress: string | null;
  usbDeviceInstanceId: string | null;
  vendorId: string | null;
  productIdCode: string | null;
  primaryIdentifier: string | null;
  // Timestamps
  firstDetectedAt: string | null;
  lastConnectedAt: string | null;
}

const WARRANTY_STATUS_CONFIG = {
  active: {
    color: "text-qbit-success",
    bg: "bg-qbit-success/10 border-qbit-success/30",
    icon: "verified_user",
    label: "Warranty Active",
  },
  expired: {
    color: "text-qbit-error",
    bg: "bg-qbit-error/10 border-qbit-error/30",
    icon: "report",
    label: "Warranty Expired",
  },
  unknown: {
    color: "text-qbit-on-surface-variant",
    bg: "bg-qbit-surface-container-low border-qbit-outline-variant",
    icon: "help",
    label: "Warranty Unknown",
  },
};

export function QbitDeviceProfilePage() {
  const { user, role } = useAuth();
  const navigate = useNavigation((s) => s.navigate);
  const params = useNavigation((s) => s.params);
  const { toast } = useToast();

  const deviceUuid = params.deviceUuid ?? "";

  const [device, setDevice] = useState<DeviceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

  const fetchDevice = useCallback(async () => {
    if (!deviceUuid) {
      setError("No device UUID provided. Please navigate from a valid source.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dr-qbit/uuid/lookup?uuid=${encodeURIComponent(deviceUuid)}`
      );
      if (!res.ok) throw new Error("Lookup request failed");
      const data = await res.json();
      if (!data.found) {
        setError(data.message ?? "Device not found in the system.");
        setDevice(null);
      } else {
        setDevice(data.device as DeviceProfile);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setDevice(null);
    } finally {
      setLoading(false);
    }
  }, [deviceUuid]);

  useEffect(() => {
    fetchDevice();
  }, [fetchDevice]);

  const warrantyKey = (device?.warrantyStatus ?? "unknown") as keyof typeof WARRANTY_STATUS_CONFIG;
  const warrantyConfig = WARRANTY_STATUS_CONFIG[warrantyKey] ?? WARRANTY_STATUS_CONFIG.unknown;

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const shellUser = {
    name: user?.name ?? "Admin",
    role: role ?? "administrator",
    initials: user?.name?.slice(0, 2).toUpperCase() ?? "AD",
  };

  const topBar = {
    title: device?.productName ?? "Device Profile",
    breadcrumbs: [
      { label: "Home", icon: "home", onClick: () => navigate("home") },
      { label: "Dr. QBIT", icon: "smart_toy", onClick: () => navigate("dr-qbit-detection") },
      { label: "UUID Profile", icon: "fingerprint" },
    ],
    actions: [],
  };

  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-primary">
              <Icon name="fingerprint" className="text-[28px] text-qbit-on-primary" filled />
              <span className="absolute inset-0 rounded-2xl border-2 border-qbit-primary/30 border-t-qbit-primary animate-spin" />
            </div>
            <p className="text-sm font-semibold text-qbit-on-surface">Loading Device Profile…</p>
            <p className="text-xs text-qbit-on-surface-variant">Looking up UUID: {deviceUuid}</p>
          </div>
        </div>
      );
    }

    if (error || !device) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-qbit-error/10">
              <Icon name="report" className="text-[32px] text-qbit-error" filled />
            </div>
            <p className="text-lg font-bold text-qbit-on-surface">Device Not Found</p>
            <p className="text-sm text-qbit-on-surface-variant">{error ?? "This UUID is not registered in our system."}</p>
            <QbitButton variant="primary" icon="home" onClick={() => navigate("home")}>
              Back to Dashboard
            </QbitButton>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 min-h-screen flex flex-col">
        {/* Duplicate Serial Warning Banner */}
        {device.duplicateSerialFlag && (
          <DuplicateSerialResolution
            serialNumber={device.serialNumber ?? ""}
            onResolved={(uuid) => navigate("device-uuid-profile", { deviceUuid: uuid })}
          />
        )}

        {/* Product Header Card */}
        <SurfaceCard className="p-6">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Product Image */}
            <div className="flex h-20 w-20 sm:h-28 sm:w-28 items-center justify-center rounded-xl bg-qbit-surface-container-low shrink-0 overflow-hidden">
              {device.productImage ? (
                <img
                  src={device.productImage}
                  alt={device.productName ?? "Device"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Icon name="print" className="text-[48px] text-qbit-on-surface-variant" />
              )}
            </div>
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-qbit-on-surface truncate">
                  {device.productName ?? "Unknown Device"}
                </h1>
                <Badge variant="outline" className="text-xs shrink-0">
                  {device.deviceStatus}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-qbit-on-surface-variant mb-3">
                {device.productModel && <span>Model: <strong className="text-qbit-on-surface">{device.productModel}</strong></span>}
                {device.serialNumber && <span>Serial: <strong className="text-qbit-on-surface">{device.serialNumber}</strong></span>}
                {device.manufacturer && <span>Manufacturer: <strong className="text-qbit-on-surface">{device.manufacturer}</strong></span>}
              </div>
              {device.productDescription && (
                <p className="text-xs text-qbit-on-surface-variant line-clamp-2">{device.productDescription}</p>
              )}
              {/* Passport number */}
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-qbit-primary/10 px-2 py-0.5 text-[10px] font-semibold text-qbit-primary">
                  PASSPORT {device.passportNumber}
                </span>
                {device.fingerprintQuality && (
                  <span className="rounded-full bg-qbit-surface-container-low px-2 py-0.5 text-[10px] font-medium text-qbit-on-surface-variant">
                    Fingerprint: {device.fingerprintQuality}
                  </span>
                )}
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            label="Warranty Status"
            value={warrantyConfig.label}
            icon={warrantyConfig.icon}
            iconBg={device.warrantyStatus === "active" ? "bg-qbit-success/10 text-qbit-success" : device.warrantyStatus === "expired" ? "bg-qbit-error/10 text-qbit-error" : "bg-qbit-surface-container-low text-qbit-on-surface-variant"}
          />
          <KpiCard
            label="Days Remaining"
            value={device.warrantyDaysRemaining !== null ? `${device.warrantyDaysRemaining}d` : "N/A"}
            icon="schedule"
            iconBg="bg-qbit-primary/10 text-qbit-primary"
            delta={device.warrantyDaysRemaining !== null && device.warrantyDaysRemaining > 0 ? `${device.warrantyDaysRemaining} days left` : undefined}
            deltaVariant={device.warrantyDaysRemaining !== null && device.warrantyDaysRemaining > 0 ? "up" : "down"}
          />
          <KpiCard
            label="Firmware Version"
            value={device.firmwareVersion ?? "Unknown"}
            icon="upgrade"
            iconBg="bg-qbit-secondary/10 text-qbit-secondary"
          />
          <KpiCard
            label="Driver Status"
            value={device.driverStatus}
            icon="memory"
            iconBg={device.driverStatus === "up_to_date" ? "bg-qbit-success/10 text-qbit-success" : "bg-qbit-warning/10 text-qbit-warning"}
          />
        </div>

        {/* Warranty Detail Card */}
        <SurfaceCard className={cn("p-4", warrantyConfig.bg)}>
          <div className="flex items-center gap-3">
            <Icon name={warrantyConfig.icon} className={`text-[24px] ${warrantyConfig.color}`} filled />
            <div className="flex-1">
              <p className={`text-sm font-bold ${warrantyConfig.color}`}>{warrantyConfig.label}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-qbit-on-surface-variant mt-1">
                {device.warrantyStartDate && (
                  <span>Start: {new Date(device.warrantyStartDate).toLocaleDateString()}</span>
                )}
                {device.warrantyEndDate && (
                  <span>End: {new Date(device.warrantyEndDate).toLocaleDateString()}</span>
                )}
                {device.warrantyDaysRemaining !== null && (
                  <span>
                    {device.warrantyDaysRemaining > 0
                      ? `${device.warrantyDaysRemaining} days remaining`
                      : "Expired"}
                  </span>
                )}
                {device.extendedWarranty && (
                  <Badge variant="outline" className="text-xs bg-qbit-success/5 text-qbit-success border-qbit-success/30">
                    Extended Warranty
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* Tabs Section */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full grid grid-cols-4 sm:grid-cols-5 bg-qbit-surface-container-low">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="downloads">Downloads</TabsTrigger>
            <TabsTrigger value="warranty">Warranty</TabsTrigger>
            <TabsTrigger value="qr-code">QR Code</TabsTrigger>
            <TabsTrigger value="support" className="hidden sm:block">Support</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <SurfaceCard className="p-4 space-y-3">
              <p className="text-sm font-bold text-qbit-on-surface">Device Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailRow label="Product Name" value={device.productName ?? "N/A"} icon="inventory_2" />
                <DetailRow label="Model Number" value={device.productModel ?? "N/A"} icon="devices" />
                <DetailRow label="Serial Number" value={device.serialNumber ?? "N/A"} icon="tag" />
                <DetailRow label="Manufacturer" value={device.manufacturer ?? "N/A"} icon="factory" />
                <DetailRow label="Firmware Version" value={device.firmwareVersion ?? "N/A"} icon="upgrade" />
                <DetailRow label="Hardware Revision" value={device.hardwareRevision ?? "N/A"} icon="hardware" />
                <DetailRow label="Activation Date" value={device.activationDate ? new Date(device.activationDate).toLocaleDateString() : "N/A"} icon="event_available" />
                <DetailRow label="Registration Date" value={device.registrationDate ? new Date(device.registrationDate).toLocaleDateString() : "N/A"} icon="how_to_reg" />
                <DetailRow label="Product Code" value={device.productCode ?? "N/A"} icon="barcode" />
                <DetailRow label="Connection Type" value={device.deviceStatus === "registered" ? "USB" : "N/A"} icon="cable" />
              </div>
              {/* Customer & Dealer */}
              <div className="border-t border-qbit-outline-variant/30 pt-3 mt-2">
                <p className="text-xs font-bold text-qbit-on-surface-variant mb-2">Customer & Dealer</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <DetailRow label="Customer" value={device.customerName ?? "Not assigned"} icon="person" />
                  <DetailRow label="Customer Company" value={device.customerCompany ?? "N/A"} icon="business" />
                  <DetailRow label="Customer Mobile" value={device.customerMobile ?? "N/A"} icon="phone" />
                  <DetailRow label="Dealer" value={device.dealerName ?? "Not assigned"} icon="handshake" />
                </div>
              </div>
              {/* Invoice & Purchase */}
              <div className="border-t border-qbit-outline-variant/30 pt-3 mt-2">
                <p className="text-xs font-bold text-qbit-on-surface-variant mb-2">Purchase Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <DetailRow label="Invoice Number" value={device.invoiceNumber ?? "N/A"} icon="receipt" />
                  <DetailRow label="Purchase Date" value={device.purchaseDate ? new Date(device.purchaseDate).toLocaleDateString() : "N/A"} icon="calendar_today" />
                </div>
              </div>
            </SurfaceCard>

            {/* Repair History Placeholder */}
            <SurfaceCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-qbit-surface-container-low">
                  <Icon name="build_circle" className="text-[20px] text-qbit-on-surface-variant" />
                </div>
                <div>
                  <p className="text-sm font-bold text-qbit-on-surface">Repair History</p>
                  <p className="text-xs text-qbit-on-surface-variant">No repair records found for this device.</p>
                </div>
              </div>
            </SurfaceCard>
          </TabsContent>

          {/* Downloads Tab */}
          <TabsContent value="downloads" className="space-y-4 mt-4">
            <SurfaceCard className="p-4 space-y-3">
              <p className="text-sm font-bold text-qbit-on-surface">Available Downloads</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Drivers */}
                <DownloadCard
                  title="Drivers"
                  icon="memory"
                  status={device.driverStatus}
                  installed={device.installedDriverVersion}
                  latest={device.latestDriverVersion}
                  downloadUrl={device.latestDriverDownloadUrl}
                />
                {/* Manuals */}
                <DownloadCard
                  title="Manuals"
                  icon="menu_book"
                  status="available"
                  installed={null}
                  latest="Latest Version"
                  downloadUrl={null}
                />
                {/* Firmware */}
                <DownloadCard
                  title="Firmware"
                  icon="upgrade"
                  status={device.firmwareStatus}
                  installed={device.firmwareVersion ?? null}
                  latest="Latest Release"
                  downloadUrl={null}
                />
                {/* SDK */}
                <DownloadCard
                  title="SDK & Utilities"
                  icon="code"
                  status="available"
                  installed={null}
                  latest="Available"
                  downloadUrl={null}
                />
              </div>
            </SurfaceCard>
          </TabsContent>

          {/* Warranty Tab */}
          <TabsContent value="warranty" className="space-y-4 mt-4">
            <SurfaceCard className={cn("p-6", warrantyConfig.bg)}>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/50">
                  <Icon name={warrantyConfig.icon} className={`text-[32px] ${warrantyConfig.color}`} filled />
                </div>
                <div className="flex-1">
                  <p className={`text-lg font-bold ${warrantyConfig.color}`}>{warrantyConfig.label}</p>
                  <div className="space-y-1 mt-2">
                    {device.warrantyStartDate && (
                      <p className="text-sm text-qbit-on-surface-variant">
                        Start Date: <strong className="text-qbit-on-surface">{new Date(device.warrantyStartDate).toLocaleDateString()}</strong>
                      </p>
                    )}
                    {device.warrantyEndDate && (
                      <p className="text-sm text-qbit-on-surface-variant">
                        End Date: <strong className="text-qbit-on-surface">{new Date(device.warrantyEndDate).toLocaleDateString()}</strong>
                      </p>
                    )}
                    {device.warrantyDaysRemaining !== null && (
                      <p className="text-sm text-qbit-on-surface-variant">
                        Days Remaining: <strong className={warrantyConfig.color}>{device.warrantyDaysRemaining > 0 ? device.warrantyDaysRemaining : 0} days</strong>
                      </p>
                    )}
                    {device.extendedWarranty && (
                      <Badge variant="outline" className="text-xs bg-qbit-success/5 text-qbit-success border-qbit-success/30 mt-1">
                        Extended Warranty Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr-code" className="mt-4">
            <QbitDeviceQRCode
              deviceUuid={device.deviceUuid}
              serialNumber={device.serialNumber ?? undefined}
              productName={device.productName ?? undefined}
            />
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-4 mt-4">
            <SurfaceCard className="p-4 space-y-3">
              <p className="text-sm font-bold text-qbit-on-surface">Knowledge Base & Support</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SupportLink
                  title="Knowledge Base"
                  description="Browse articles, FAQs, and troubleshooting guides"
                  icon="menu_book"
                  onClick={() => navigate("support-kb")}
                />
                <SupportLink
                  title="Support Tickets"
                  description="Get help from our support team"
                  icon="confirmation_number"
                  onClick={() => navigate("support-tickets")}
                />
                <SupportLink
                  title="Dr. QBIT Diagnostics"
                  description="AI-powered diagnostics for your device"
                  icon="smart_toy"
                  onClick={() => navigate("dr-qbit-diagnostics")}
                />
                <SupportLink
                  title="Driver Download Center"
                  description="Download the latest drivers and firmware"
                  icon="download"
                  onClick={() => navigate("driver-download-center")}
                />
              </div>
            </SurfaceCard>
          </TabsContent>
        </Tabs>

        {/* Developer Mode Section (only visible when devMode toggle is enabled) */}
        {devMode && device && (
          <SurfaceCard className="p-4 space-y-3 border-qbit-warning/30 bg-qbit-warning/5">
            <div className="flex items-center gap-2">
              <Icon name="developer_mode" className="text-[18px] text-qbit-warning" filled />
              <p className="text-sm font-bold text-qbit-warning">Developer Mode — Internal Data</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <DetailRow label="Device UUID" value={device.deviceUuid ?? "N/A"} icon="fingerprint" />
              <DetailRow label="Hardware Fingerprint" value={device.hardwareFingerprint ? `${device.hardwareFingerprint.slice(0, 16)}…` : "N/A"} icon="hash" />
              <DetailRow label="Primary Identifier" value={device.primaryIdentifier ?? "N/A"} icon="priority_high" />
              <DetailRow label="Fingerprint Quality" value={device.fingerprintQuality ?? "N/A"} icon="verified" />
              <DetailRow label="Chip UID" value={device.chipUid ?? "N/A"} icon="memory" />
              <DetailRow label="Factory Device UUID" value={device.factoryDeviceUuid ?? "N/A"} icon="fingerprint" />
              <DetailRow label="Ethernet MAC" value={device.ethernetMacAddress ?? "N/A"} icon="lan" />
              <DetailRow label="Bluetooth MAC" value={device.bluetoothMacAddress ?? "N/A"} icon="bluetooth" />
              <DetailRow label="USB Device Instance ID" value={device.usbDeviceInstanceId ?? "N/A"} icon="usb" />
              <DetailRow label="Vendor ID" value={device.vendorId ?? "N/A"} icon="barcode" />
              <DetailRow label="Product ID Code" value={device.productIdCode ?? "N/A"} icon="qr_code" />
              <DetailRow label="Duplicate Serial" value={device.duplicateSerialFlag ? "YES" : "NO"} icon="warning" />
              <DetailRow label="Last Connected" value={device.lastConnectedAt ? new Date(device.lastConnectedAt).toLocaleString() : "N/A"} icon="schedule" />
              <DetailRow label="First Detected" value={device.firstDetectedAt ? new Date(device.firstDetectedAt).toLocaleString() : "N/A"} icon="history" />
            </div>
          </SurfaceCard>
        )}

        {/* Footer with Developer Mode toggle */}
        <footer className="mt-auto pt-4 pb-2 border-t border-qbit-outline-variant/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-qbit-on-surface-variant">
              {device ? `Passport ${device.passportNumber}` : "QBIT Device Identity Architecture"}
            </p>
            <button
              onClick={() => setDevMode((d) => !d)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors"
            >
              <Icon name={devMode ? "developer_mode" : "code"} className="text-[14px]" filled={devMode} />
              {devMode ? "Developer Mode: ON" : "Developer Mode"}
            </button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Device Identity Architecture", icon: "fingerprint" }}
      navItems={ADMIN_NAV}
      activeScreen="device-uuid-profile"
      user={shellUser}
      topBar={topBar}
    >
      {renderContent()}
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Helper Components                                                    */
/* ------------------------------------------------------------------ */

function DetailRow({ label, value, icon }: { label: string; value: string; icon: string }) {
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

function DownloadCard({
  title,
  icon,
  status,
  installed,
  latest,
  downloadUrl,
}: {
  title: string;
  icon: string;
  status: string;
  installed: string | null;
  latest: string | null;
  downloadUrl: string | null;
}) {
  const statusLabel = status === "up_to_date" ? "Up to Date" : status === "driver_outdated" ? "Update Available" : status === "driver_missing" ? "Missing" : "Available";
  const statusColor = status === "up_to_date" ? "text-qbit-success" : status === "driver_outdated" || status === "driver_missing" ? "text-qbit-warning" : "text-qbit-on-surface-variant";

  return (
    <SurfaceCard className="p-3 space-y-2" hover>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-qbit-primary/10">
          <Icon name={icon} className="text-[18px] text-qbit-primary" />
        </div>
        <p className="text-sm font-bold text-qbit-on-surface">{title}</p>
      </div>
      {installed && (
        <p className="text-xs text-qbit-on-surface-variant">
          Installed: <strong className="text-qbit-on-surface">{installed}</strong>
        </p>
      )}
      {latest && (
        <p className="text-xs text-qbit-on-surface-variant">
          Latest: <strong className="text-qbit-on-surface">{latest}</strong>
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
        {downloadUrl && (
          <QbitButton variant="outline" size="sm" icon="download">
            Download
          </QbitButton>
        )}
      </div>
    </SurfaceCard>
  );
}

function SupportLink({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-3 rounded-xl border border-qbit-outline-variant/50 bg-qbit-surface-container-lowest p-4 transition-all hover:border-qbit-primary/30 hover:shadow-md w-full text-left"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-qbit-primary/10 shrink-0">
        <Icon name={icon} className="text-[20px] text-qbit-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-qbit-on-surface group-hover:text-qbit-primary">{title}</p>
        <p className="text-xs text-qbit-on-surface-variant">{description}</p>
      </div>
      <Icon name="arrow_forward" className="text-[16px] text-qbit-on-surface-variant group-hover:text-qbit-primary shrink-0 mt-1" />
    </button>
  );
}


