"use client";

/**
 * DuplicateSerialResolution — handles duplicate serial number resolution.
 *
 * Shows "Duplicate Serial Number Detected" banner (amber/warning).
 * Lists all devices sharing that serial number.
 * For each device: Product Name, Model, Manufacturer, Registration Date.
 * Resolution options (text inputs):
 *   - Invoice Number
 *   - Purchase Date
 *   - Dealer Name
 *   - Registered Mobile Number
 *   - Customer Name
 * "Verify" button → calls GET /api/dr-qbit/uuid/serial-search with filters.
 * On resolution success → navigates to device-uuid-profile with resolved UUID.
 *
 * Props: { serialNumber: string; onResolved: (deviceUuid: string) => void }
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/lib/navigation/store";

interface DuplicateDevice {
  id: string;
  deviceUuid: string;
  productName: string | null;
  model: string | null;
  manufacturer: string | null;
  registrationDate: string | null;
  serialNumber: string;
  deviceName: string | null;
  brand: string | null;
  invoiceNumber: string | null;
  purchaseDate: string | null;
  dealerName: string | null;
  customerName: string | null;
  customerMobile: string | null;
  productImage: string | null;
}

interface DuplicateSerialResolutionProps {
  serialNumber: string;
  onResolved: (deviceUuid: string) => void;
}

export function DuplicateSerialResolution({
  serialNumber,
  onResolved,
}: DuplicateSerialResolutionProps) {
  const { toast } = useToast();
  const navigate = useNavigation((s) => s.navigate);

  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<DuplicateDevice[]>([]);
  const [searched, setSearched] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvedUuid, setResolvedUuid] = useState<string | null>(null);

  // Resolution filter fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [customerName, setCustomerName] = useState("");

  async function handleSearchDevices() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dr-qbit/uuid/serial-search?serial=${encodeURIComponent(serialNumber)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      if (data.found && data.devices) {
        setDevices(
          data.devices.map((d: Record<string, unknown>) => ({
            id: d.id as string,
            deviceUuid: d.deviceUuid as string,
            productName: d.productName as string | null,
            model: d.model as string | null,
            manufacturer: d.manufacturer as string | null,
            registrationDate: d.registrationDate as string | null,
            serialNumber: d.serialNumber as string,
            deviceName: d.deviceName as string | null,
            brand: d.brand as string | null,
            invoiceNumber: d.invoiceNumber as string | null,
            purchaseDate: d.purchaseDate as string | null,
            dealerName: d.dealerName as string | null,
            customerName: d.customerName as string | null,
            customerMobile: d.customerMobile as string | null,
            productImage: d.productImage as string | null,
          }))
        );
      } else if (data.found && data.device) {
        // Single device — no duplicate, just navigate
        const uuid = data.device.deviceUuid as string;
        setResolvedUuid(uuid);
        onResolved(uuid);
        navigate("device-uuid-profile", { deviceUuid: uuid });
      } else {
        toast({
          title: "No Devices Found",
          description: `No registered devices found with serial number: ${serialNumber}`,
          variant: "destructive",
        });
      }
      setSearched(true);
    } catch (e) {
      toast({
        title: "Search Failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setResolving(true);
    try {
      const params = new URLSearchParams({ serial: serialNumber });
      if (invoiceNumber) params.set("invoice", invoiceNumber);
      if (purchaseDate) params.set("purchaseDate", purchaseDate);
      if (dealerName) params.set("dealerName", dealerName);
      if (mobileNumber) params.set("mobile", mobileNumber);
      if (customerName) params.set("customerName", customerName);

      const res = await fetch(`/api/dr-qbit/uuid/serial-search?${params.toString()}`);
      if (!res.ok) throw new Error("Verification failed");
      const data = await res.json();

      if (data.found && data.resolved && data.device) {
        const uuid = data.device.deviceUuid as string;
        setResolvedUuid(uuid);
        toast({
          title: "Device Identified!",
          description: `Resolved to Device UUID: ${uuid}`,
        });
        onResolved(uuid);
        navigate("device-uuid-profile", { deviceUuid: uuid });
      } else if (data.found && data.count > 1) {
        toast({
          title: "Resolution Failed",
          description:
            "The provided filters did not uniquely identify one device. Try adding more details.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Match Found",
          description: "No device matches the provided verification details.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Verification Failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <div className="flex items-center gap-3 rounded-xl border border-qbit-warning/30 bg-qbit-warning/5 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-qbit-warning/10">
          <Icon name="warning" className="text-[20px] text-qbit-warning" filled />
        </div>
        <div>
          <p className="text-sm font-bold text-qbit-warning">
            Duplicate Serial Number Detected
          </p>
          <p className="text-xs text-qbit-on-surface-variant">
            Multiple devices share the serial number <code className="rounded bg-qbit-surface-container px-1.5 py-0.5 text-xs font-mono text-qbit-primary">{serialNumber}</code>.
            The QBIT Device UUID is used for unique identification instead.
          </p>
        </div>
      </div>

      {/* Search button if not yet searched */}
      {!searched && (
        <QbitButton
          variant="primary"
          icon={loading ? "progress_activity" : "search"}
          disabled={loading}
          onClick={handleSearchDevices}
          fullWidth
        >
          {loading ? "Searching Devices…" : "Find All Devices With This Serial"}
        </QbitButton>
      )}

      {/* Device list */}
      {devices.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-qbit-on-surface">
            {devices.length} devices share this serial number
          </p>
          <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
            {devices.map((device) => (
              <SurfaceCard key={device.id} className="p-3" hover>
                <div className="flex items-center gap-3">
                  {/* Product image or icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-surface-container-low shrink-0 overflow-hidden">
                    {device.productImage ? (
                      <img
                        src={device.productImage}
                        alt={device.productName ?? "Device"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon name="print" className="text-[24px] text-qbit-on-surface-variant" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-qbit-on-surface truncate">
                      {device.productName ?? device.deviceName ?? "Unknown Device"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-qbit-on-surface-variant">
                      {device.model && <span>Model: {device.model}</span>}
                      {device.manufacturer && <span>• Mfg: {device.manufacturer}</span>}
                    </div>
                    {device.registrationDate && (
                      <p className="text-xs text-qbit-on-surface-variant mt-0.5">
                        Registered: {new Date(device.registrationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span className="rounded-full bg-qbit-surface-container-low px-2 py-0.5 text-[10px] font-mono text-qbit-primary">
                      {device.deviceUuid?.slice(0, 12)}…
                    </span>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>
      )}

      {/* Resolution form */}
      {searched && devices.length > 1 && !resolvedUuid && (
        <SurfaceCard className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="verified_user" className="text-[18px] text-qbit-primary" filled />
            <p className="text-sm font-bold text-qbit-on-surface">
              Verify Your Device
            </p>
          </div>
          <p className="text-xs text-qbit-on-surface-variant">
            Enter any of the following details from your purchase to uniquely identify your device.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Invoice Number */}
            <div>
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1 block">
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
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1 block">
                Purchase Date
              </label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Dealer Name */}
            <div>
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1 block">
                Dealer Name
              </label>
              <Input
                value={dealerName}
                onChange={(e) => setDealerName(e.target.value)}
                placeholder="e.g. QBIT Distributors"
                className="text-sm"
              />
            </div>

            {/* Registered Mobile Number */}
            <div>
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1 block">
                Registered Mobile Number
              </label>
              <Input
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. +91-9876543210"
                className="text-sm"
              />
            </div>

            {/* Customer Name */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-qbit-on-surface-variant mb-1 block">
                Customer Name
              </label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="text-sm"
              />
            </div>
          </div>

          <QbitButton
            variant="primary"
            icon={resolving ? "progress_activity" : "verified_user"}
            disabled={resolving || (!invoiceNumber && !purchaseDate && !dealerName && !mobileNumber && !customerName)}
            onClick={handleVerify}
            fullWidth
          >
            {resolving ? "Verifying…" : "Verify & Identify Device"}
          </QbitButton>
        </SurfaceCard>
      )}

      {/* Resolution success */}
      {resolvedUuid && (
        <SurfaceCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-success/10">
              <Icon name="check_circle" className="text-[24px] text-qbit-success" filled />
            </div>
            <div>
              <p className="text-sm font-bold text-qbit-success">Device Identified!</p>
              <p className="text-xs text-qbit-on-surface-variant">
                Resolved to UUID: <code className="font-mono text-qbit-primary">{resolvedUuid}</code>
              </p>
            </div>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
