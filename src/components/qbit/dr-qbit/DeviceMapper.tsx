"use client";

/**
 * DeviceMapper — modal dialog for mapping an unknown device to a product.
 *
 * Reuses SurfaceCard, Icon, QbitButton + shadcn Dialog.
 * Fetches product suggestions from /api/dr-qbit/products.
 */

import { useEffect, useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface UnknownDeviceDTO {
  id: string;
  hardwareId: string | null;
  vendorId: string | null;
  productIdCode: string | null;
  deviceName: string | null;
  manufacturer: string | null;
  model: string | null;
  connectionType: string | null;
  port: string | null;
  macAddress: string | null;
  ipAddress: string | null;
  mappedProductId: string | null;
  mappedProductName: string | null;
  firstSeenAt: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  manufacturer: string | null;
  model: string;
  deviceType: string;
  description: string | null;
}

interface DeviceMapperProps {
  device: UnknownDeviceDTO | null;
  onClose: () => void;
  onMapped?: (deviceId: string, productId: string) => void;
}

const DEVICE_TYPE_ICONS: Record<string, string> = {
  windows_pos: "desktop_windows",
  android_pos: "phone_android",
  thermal_printer: "print",
  barcode_scanner: "barcode_scanner",
  cash_drawer: "point_of_sale",
  customer_display: "monitor",
  label_printer: "label",
  kitchen_printer: "restaurant",
  kiosk: "storefront",
  weighing_scale: "scale",
  unknown: "help_outline",
};

export function DeviceMapper({ device, onClose, onMapped }: DeviceMapperProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [mapping, setMapping] = useState(false);

  useEffect(() => {
    if (!device) return;
    void fetchProducts();
  }, [device]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/dr-qbit/products?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setProducts(data.items ?? []);
    } catch {
      toast({ title: "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMap = async () => {
    if (!device || !selectedProductId) return;
    setMapping(true);
    try {
      const res = await fetch(`/api/dr-qbit/unknown/${device.id}/map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Mapping failed");
      }
      const data = await res.json();
      toast({
        title: "Device mapped",
        description: `Unknown device → ${data.productName}. Future scans will auto-match.`,
      });
      onMapped?.(device.id, selectedProductId);
      onClose();
    } catch (e) {
      toast({
        title: "Mapping failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setMapping(false);
    }
  };

  if (!device) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-qbit-outline-variant bg-white p-4">
          <div>
            <h3 className="text-base font-semibold text-qbit-on-surface">Map Unknown Device</h3>
            <p className="text-xs text-qbit-on-surface-variant">
              Select a product from the catalog. A hardware signature will be created for future auto-matching.
            </p>
          </div>
          <QbitButton variant="ghost" size="sm" icon="close" onClick={onClose}>
            Close
          </QbitButton>
        </div>

        {/* Device details */}
        <div className="border-b border-qbit-outline-variant bg-qbit-warning/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-qbit-warning/10 text-qbit-warning">
              <Icon name="help_outline" className="text-[20px]" filled />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-qbit-on-surface">
                {device.deviceName ?? "Unknown Device"}
              </p>
              <p className="text-xs text-qbit-on-surface-variant">
                {device.manufacturer ?? "Unknown manufacturer"} · {device.model ?? "Unknown model"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {device.vendorId && <TagBadge variant="neutral">VID: {device.vendorId}</TagBadge>}
                {device.productIdCode && <TagBadge variant="neutral">PID: {device.productIdCode}</TagBadge>}
                {device.connectionType && <TagBadge variant="primary">{device.connectionType.toUpperCase()}</TagBadge>}
                {device.macAddress && <TagBadge variant="neutral">MAC: {device.macAddress}</TagBadge>}
              </div>
            </div>
          </div>
        </div>

        {/* Product search + list */}
        <div className="p-4">
          <div className="mb-3 flex gap-2">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
              placeholder="Search products by name, model, brand…"
              className="text-sm"
            />
            <QbitButton variant="outline" size="sm" icon="search" onClick={fetchProducts}>
              Search
            </QbitButton>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <Icon name="progress_activity" className="mx-auto text-[24px] animate-spin text-qbit-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-sm text-qbit-on-surface-variant">
              No products found. Try a different search.
            </div>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-auto">
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProductId(p.id)}
                  className={
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors " +
                    (selectedProductId === p.id
                      ? "border-qbit-primary bg-qbit-primary/5 ring-2 ring-qbit-primary/20"
                      : "border-qbit-outline-variant/50 bg-white hover:bg-qbit-surface-container-low")
                  }
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                    <Icon name={DEVICE_TYPE_ICONS[p.deviceType] ?? "inventory_2"} className="text-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-qbit-on-surface">{p.name}</p>
                    <p className="text-xs text-qbit-on-surface-variant">
                      {p.brand} · {p.model}
                    </p>
                  </div>
                  {selectedProductId === p.id && (
                    <Icon name="check_circle" className="text-[20px] text-qbit-primary" filled />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-qbit-outline-variant bg-white p-4">
          <p className="text-xs text-qbit-on-surface-variant">
            {selectedProductId ? "Ready to map" : "Select a product to continue"}
          </p>
          <div className="flex gap-2">
            <QbitButton variant="ghost" size="sm" onClick={onClose}>Cancel</QbitButton>
            <QbitButton
              variant="primary"
              size="sm"
              icon={mapping ? "progress_activity" : "link"}
              disabled={!selectedProductId || mapping}
              onClick={handleMap}
            >
              {mapping ? "Mapping…" : "Map Device"}
            </QbitButton>
          </div>
        </div>
      </div>
    </div>
  );
}
