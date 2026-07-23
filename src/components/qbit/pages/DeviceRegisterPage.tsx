"use client";

/**
 * DeviceRegisterPage — full-page device registration form.
 *
 * Replaces the popup dialog with a dedicated full-page form similar to
 * Microsoft Dynamics 365 / Zoho CRM / Odoo.
 *
 * Features:
 *   - Product selection dropdown (from Product Master — auto-fills fields)
 *   - Device image upload (drag & drop, preview, max 5 images)
 *   - Driver selection (multi-select from Upload Master)
 *   - Manual selection (multi-select from Upload Master)
 *   - Installation guide selection (multi-select from Upload Master)
 *   - Video selection (multi-select from Upload Master)
 *   - Brochure & document selection (multi-select from Upload Master)
 *   - Customer information section
 *   - Purchase & warranty section
 *   - Sticky action bar: Save, Save & Register Another, Save as Draft, Cancel
 *
 * After saving, all selected resources are auto-linked to the serial number.
 * Device Lookup will instantly show all linked resources.
 */

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/lib/navigation/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FingerprintDiscoveryCard, type FingerprintScanResult } from "@/components/qbit/admin/FingerprintDiscoveryCard";
import type { UniversalHardwareIdentity, HardwareFingerprintResult } from "@/lib/drqbit/fingerprint-types";

interface ProductOption {
  id: string;
  name: string;
  model: string;
  brand: string;
  category: string | null;
  imageUrl: string | null;
  slug: string;
}

const DEVICE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "in_repair", label: "In Repair" },
  { value: "replaced", label: "Replaced" },
  { value: "returned", label: "Returned" },
];

const DRIVER_OPTIONS = [
  "Windows Driver", "Windows 11 Driver", "Android Driver", "Linux Driver",
  "macOS Driver", "Firmware", "SDK", "Utility", "OPOS Driver", "JavaPOS Driver",
  "Thermal Printer Driver", "Barcode Scanner Driver", "Touch Driver",
  "USB Driver", "LAN Driver", "WiFi Driver", "Bluetooth Driver",
];

const MANUAL_OPTIONS = [
  "User Manual", "Service Manual", "Technical Manual", "Quick Start Guide",
  "Installation Guide", "Datasheet", "Brochure", "Warranty PDF",
];

const VIDEO_OPTIONS = [
  "Product Demo", "Installation Video", "Training Video",
  "Troubleshooting Video", "Firmware Update Video",
];

const DOCUMENT_OPTIONS = [
  "Brochure", "Datasheet", "Warranty PDF", "Certificates",
  "Compliance Documents", "Safety Documents",
];

export function DeviceRegisterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigation((s) => s.navigate);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [deviceStatus, setDeviceStatus] = useState("active");
  const [deviceImages, setDeviceImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Customer
  const [customerName, setCustomerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Purchase
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  // Warranty
  const [warrantyStartDate, setWarrantyStartDate] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");
  const [warrantyDuration, setWarrantyDuration] = useState("");

  // Installation
  const [installedBy, setInstalledBy] = useState("");
  const [installationNotes, setInstallationNotes] = useState("");

  // Service
  const [amcStatus, setAmcStatus] = useState("none");
  const [serviceNotes, setServiceNotes] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  // Resource selections
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  const [selectedManuals, setSelectedManuals] = useState<Set<string>>(new Set());
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  // Universal Hardware Fingerprint — scan result
  const [fingerprintScan, setFingerprintScan] = useState<FingerprintScanResult | null>(null);
  const [fingerprintIdentity, setFingerprintIdentity] = useState<UniversalHardwareIdentity | null>(null);

  // Fingerprint fields (auto-populated from scan)
  const [vendorId, setVendorId] = useState("");
  const [productIdCode, setProductIdCode] = useState("");
  const [hardwareFingerprint, setHardwareFingerprint] = useState("");
  const [deviceUuid, setDeviceUuid] = useState("");
  const [chipUid, setChipUid] = useState("");
  const [factoryDeviceUuid, setFactoryDeviceUuid] = useState("");
  const [ethernetMac, setEthernetMac] = useState("");
  const [bluetoothMac, setBluetoothMac] = useState("");
  const [usbDeviceInstanceId, setUsbDeviceInstanceId] = useState("");
  const [usbContainerId, setUsbContainerId] = useState("");
  const [duplicateSerialFlag, setDuplicateSerialFlag] = useState(false);
  const [fingerprintQuality, setFingerprintQuality] = useState("");
  const [primaryIdentifier, setPrimaryIdentifier] = useState("");

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // Fetch products for dropdown
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/admin/products?limit=500", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setProducts(data.items?.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        model: p.model as string,
        brand: p.brand as string,
        category: (p.category as string | null) ?? null,
        imageUrl: (p.imageUrl as string | null) ?? null,
        slug: (p.slug as string) ?? "",
      })) ?? []);
    } catch {
      toast({ title: "Failed to load products", variant: "destructive" });
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  function handleProductSelect(productId: string) {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      setProductName(product.name);
      setModelNumber(product.model);
      setBrand(product.brand);
      setCategory(product.category ?? "");
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type));
    if (deviceImages.length + valid.length > 5) {
      toast({ title: "Maximum 5 images allowed", variant: "destructive" });
      return;
    }
    const newImages = [...deviceImages, ...valid];
    setDeviceImages(newImages);
    setImagePreviews(newImages.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(index: number) {
    const newImages = deviceImages.filter((_, i) => i !== index);
    setDeviceImages(newImages);
    setImagePreviews(newImages.map((f) => URL.createObjectURL(f)));
  }

  function toggleSelection(set: Set<string>, value: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  /** Auto-populate ALL form fields from fingerprint scan result. */
  function handleFingerprintScanComplete(result: FingerprintScanResult) {
    setFingerprintScan(result);
    setFingerprintIdentity(result.identity);

    // Auto-populate basic fields from scan
    const identity = result.identity;
    if (identity.sdkSerialNumber) setSerialNumber(identity.sdkSerialNumber);
    if (identity.productName) setProductName(identity.productName);
    if (identity.model) setModelNumber(identity.model);
    if (identity.manufacturer) setBrand(identity.manufacturer);
    if (identity.firmwareVersion) {} // available but not in current form

    // Auto-populate fingerprint fields
    const fp = result.fingerprintResult;
    setVendorId(identity.vendorId ?? "");
    setProductIdCode(identity.productId ?? "");
    setHardwareFingerprint(fp.fingerprintHash);
    setDeviceUuid(fp.deviceUuid);
    setChipUid(identity.chipUid ?? "");
    setFactoryDeviceUuid(identity.factoryDeviceUuid ?? "");
    setEthernetMac(identity.ethernetMacAddress ?? "");
    setBluetoothMac(identity.bluetoothMacAddress ?? "");
    setUsbDeviceInstanceId(identity.usbDeviceInstanceId ?? "");
    setUsbContainerId(identity.usbContainerId ?? "");
    setDuplicateSerialFlag(fp.duplicateSerialDetected);
    setFingerprintQuality(fp.quality);
    setPrimaryIdentifier(fp.primaryIdentifier);
  }

  function resetForm() {
    setSelectedProductId("");
    setSerialNumber("");
    setProductName("");
    setModelNumber("");
    setBrand("");
    setCategory("");
    setDeviceStatus("active");
    setDeviceImages([]);
    setImagePreviews([]);
    setCustomerName("");
    setCompanyName("");
    setMobileNumber("");
    setEmail("");
    setGstNumber("");
    setAddress("");
    setCity("");
    setState("");
    setPincode("");
    setInvoiceNumber("");
    setPurchaseDate("");
    setDealerName("");
    setPurchasePrice("");
    setWarrantyStartDate("");
    setWarrantyEndDate("");
    setWarrantyDuration("");
    setInstalledBy("");
    setInstallationNotes("");
    setAmcStatus("none");
    setServiceNotes("");
    setNotes("");
    setSelectedDrivers(new Set());
    setSelectedManuals(new Set());
    setSelectedVideos(new Set());
    setSelectedDocuments(new Set());
  }

  async function handleSave(registerAnother = false, saveAsDraft = false) {
    if (!serialNumber || !productName || !customerName || !mobileNumber) {
      toast({ title: "Required fields missing", description: "Serial Number, Product Name, Customer Name, Mobile Number are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        serialNumber, productName, modelNumber, brand,
        customerName, companyName, mobileNumber, email, gstNumber,
        address, city, state, pincode,
        invoiceNumber, purchaseDate, dealerName, purchasePrice,
        warrantyStartDate, warrantyEndDate, warrantyDuration,
        installedBy, installationNotes, amcStatus, serviceNotes, notes,
        deviceStatus: saveAsDraft ? "inactive" : deviceStatus,
        selectedDrivers: [...selectedDrivers],
        selectedManuals: [...selectedManuals],
        selectedVideos: [...selectedVideos],
        selectedDocuments: [...selectedDocuments],
        selectedProductId,
        // Universal Hardware Fingerprint fields (auto-populated from scan)
        vendorId, productIdCode,
        hardwareFingerprint, deviceUuid,
        chipUid, factoryDeviceUuid,
        ethernetMac, bluetoothMac,
        usbDeviceInstanceId, usbContainerId,
        duplicateSerialFlag,
        fingerprintQuality, primaryIdentifier,
        ...(fingerprintIdentity ? { fingerprintIdentity } : {}),
      };

      const res = await fetch("/api/admin/device-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast({ title: saveAsDraft ? "Draft saved" : "Device registered!", description: `S/N: ${serialNumber}` });

      if (registerAnother) {
        resetForm();
      } else {
        navigate("ai-purchase-center");
      }
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Register Device", icon: "add_circle" }}
      navItems={ADMIN_NAV}
      activeScreen="device-register"
      user={{ name: userName, role: "Administrator", initials }}
      cta={{ label: "Back", icon: "arrow_back", onClick: () => navigate("ai-purchase-center") }}
      topBar={{ searchPlaceholder: "Search…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-qbit-on-surface">
            <Icon name="add_circle" className="text-[28px] text-qbit-primary" />
            Register New Device
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Register a device with its serial number. Select a product from Product Master to auto-fill fields, then link drivers, manuals, and videos from Upload Master.
          </p>
        </div>

        {/* Section 1 — Product Selection */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="inventory_2" className="text-[20px] text-qbit-primary" /> Product Selection
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Select Product from Product Master</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
                disabled={loadingProducts}
              >
                <option value="">{loadingProducts ? "Loading products…" : "Select a product (auto-fills fields below)…"}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Serial Number *</label>
              <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Auto-filled from scan or manual entry" />
              {duplicateSerialFlag && (
                <p className="mt-1 text-xs text-qbit-error flex items-center gap-1">
                  <Icon name="warning" className="text-[14px]" filled /> Duplicate serial detected — Fingerprint used for unique ID
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Product Name *</label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Auto-filled from scan or product" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Model Number</label>
              <Input value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} placeholder="Auto-filled" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Brand</label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Auto-filled" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Auto-filled" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Device Status</label>
              <select value={deviceStatus} onChange={(e) => setDeviceStatus(e.target.value)} className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm">
                {DEVICE_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Scan Device — auto-populates ALL fields */}
          <div className="mt-6 border-t border-qbit-outline-variant/50 pt-4">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-qbit-primary">
              <Icon name="fingerprint" className="text-[16px]" /> Universal Hardware Fingerprint — Scan Device
            </h4>
            <p className="mb-3 text-xs text-qbit-on-surface-variant">
              Click Scan Device to auto-populate every hardware field. The system collects all identifiers (VID, PID, Serial, Chip UID, MAC addresses, etc.) and generates a unique Hardware Fingerprint.
              Never type hardware info manually when the device is connected.
            </p>
            <FingerprintDiscoveryCard
              onScanComplete={handleFingerprintScanComplete}
              existingSerial={serialNumber}
            />
          </div>
        </SurfaceCard>

        {/* Section — Hardware Fingerprint Details (auto-populated from scan) */}
        {fingerprintScan && (
          <SurfaceCard className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
              <Icon name="fingerprint" className="text-[20px] text-qbit-primary" /> Hardware Fingerprint Details
            </h3>
            <p className="mb-4 text-xs text-qbit-on-surface-variant">All fields below were auto-populated from the device scan. These identifiers are stored permanently and used for unique identification.</p>

            {/* Duplicate serial warning */}
            {duplicateSerialFlag && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-qbit-error/30 bg-qbit-error/5 p-3">
                <Icon name="warning" className="text-[20px] text-qbit-error" filled />
                <div>
                  <p className="text-sm font-semibold text-qbit-error">Duplicate Serial Number Detected</p>
                  <p className="text-xs text-qbit-on-surface-variant">
                    Another device in the database shares this serial number. The Hardware Fingerprint ({fingerprintQuality} quality) will be used as the primary unique identifier instead.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Fingerprint Core */}
              <div>
                <label className="mb-1 block text-sm font-medium text-qbit-primary">Hardware Fingerprint Hash *</label>
                <Input value={hardwareFingerprint} readOnly className="font-mono text-xs bg-qbit-surface-container-low" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-qbit-primary">Device UUID *</label>
                <Input value={deviceUuid} readOnly className="font-mono text-xs bg-qbit-surface-container-low" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Fingerprint Quality</label>
                <Input value={fingerprintQuality || "—"} readOnly className="bg-qbit-surface-container-low" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Primary Identifier</label>
                <Input value={primaryIdentifier || "—"} readOnly className="bg-qbit-surface-container-low" />
              </div>

              {/* USB Information */}
              <div className="col-span-2 border-t border-qbit-outline-variant/50 pt-3 mt-1">
                <p className="text-xs font-bold uppercase tracking-wider text-qbit-primary mb-2">USB Information</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Vendor ID (VID)</label>
                <Input value={vendorId || "—"} readOnly className="font-mono bg-qbit-surface-container-low" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Product ID (PID)</label>
                <Input value={productIdCode || "—"} readOnly className="font-mono bg-qbit-surface-container-low" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">USB Device Instance ID</label>
                <Input value={usbDeviceInstanceId || "—"} readOnly className="font-mono text-xs bg-qbit-surface-container-low" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">USB Container ID</label>
                <Input value={usbContainerId || "—"} readOnly className="font-mono bg-qbit-surface-container-low" />
              </div>

              {/* Deep Hardware Identity */}
              <div className="col-span-2 border-t border-qbit-outline-variant/50 pt-3 mt-1">
                <p className="text-xs font-bold uppercase tracking-wider text-qbit-primary mb-2">Deep Hardware Identity</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Chip UID</label>
                <Input value={chipUid || "—"} readOnly className="font-mono bg-qbit-surface-container-low" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Factory Device UUID</label>
                <Input value={factoryDeviceUuid || "—"} readOnly className="font-mono bg-qbit-surface-container-low" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Ethernet MAC</label>
                <Input value={ethernetMac || "—"} readOnly className="font-mono bg-qbit-surface-container-low" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Bluetooth MAC</label>
                <Input value={bluetoothMac || "—"} readOnly className="font-mono bg-qbit-surface-container-low" />
              </div>
            </div>
          </SurfaceCard>
        )}

        {/* Section 2 — Device Images */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="image" className="text-[20px] text-qbit-primary" /> Device Images
          </h3>
          <div className="rounded-xl border-2 border-dashed border-qbit-outline-variant p-6 text-center transition-colors hover:border-qbit-primary/40">
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageUpload} className="hidden" id="device-image-upload" />
            <label htmlFor="device-image-upload" className="cursor-pointer">
              <Icon name="cloud_upload" className="mx-auto text-[48px] text-qbit-on-surface-variant/40" />
              <p className="mt-2 text-sm font-medium text-qbit-on-surface">Click to upload device images</p>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">JPG, PNG, WEBP — Min 1, Max 5</p>
            </label>
          </div>
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-qbit-outline-variant">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Device image ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-qbit-error text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <Icon name="close" className="text-[14px]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        {/* Section 3 — Customer Information */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="person" className="text-[20px] text-qbit-primary" /> Customer Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium">Customer Name *</label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Company Name</label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Mobile Number *</label><Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="9876543210" /></div>
            <div><label className="mb-1 block text-sm font-medium">Email</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">GST Number</label><Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">City</label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">State</label><Input value={state} onChange={(e) => setState(e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Pincode</label><Input value={pincode} onChange={(e) => setPincode(e.target.value)} /></div>
            <div className="col-span-2"><label className="mb-1 block text-sm font-medium">Address</label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          </div>
        </SurfaceCard>

        {/* Section 4 — Purchase & Warranty */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="receipt_long" className="text-[20px] text-qbit-primary" /> Purchase & Warranty
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium">Invoice Number</label><Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Purchase Date *</label><Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Warranty Start Date *</label><Input type="date" value={warrantyStartDate} onChange={(e) => setWarrantyStartDate(e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Warranty End Date *</label><Input type="date" value={warrantyEndDate} onChange={(e) => setWarrantyEndDate(e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Warranty Duration</label><Input value={warrantyDuration} onChange={(e) => setWarrantyDuration(e.target.value)} placeholder="12 months" /></div>
            <div><label className="mb-1 block text-sm font-medium">Dealer Name</label><Input value={dealerName} onChange={(e) => setDealerName(e.target.value)} /></div>
          </div>
        </SurfaceCard>

        {/* Section 5 — Installation & Service */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="build" className="text-[20px] text-qbit-primary" /> Installation & Service
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium">Installed By</label><Input value={installedBy} onChange={(e) => setInstalledBy(e.target.value)} /></div>
            <div>
              <label className="mb-1 block text-sm font-medium">AMC Status</label>
              <select value={amcStatus} onChange={(e) => setAmcStatus(e.target.value)} className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm">
                <option value="none">None</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="col-span-2"><label className="mb-1 block text-sm font-medium">Installation Notes</label><Textarea rows={2} value={installationNotes} onChange={(e) => setInstallationNotes(e.target.value)} /></div>
            <div className="col-span-2"><label className="mb-1 block text-sm font-medium">Service Notes</label><Textarea rows={2} value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} /></div>
            <div className="col-span-2"><label className="mb-1 block text-sm font-medium">General Notes</label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
        </SurfaceCard>

        {/* Section 6 — Resource Linking */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="link" className="text-[20px] text-qbit-primary" /> Link Resources from Upload Master
          </h3>
          <p className="mb-4 text-xs text-qbit-on-surface-variant">Select resources to auto-link with this device. When someone searches the serial number, all selected resources will appear automatically.</p>

          {/* Drivers */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-qbit-primary">Drivers</label>
            <div className="flex flex-wrap gap-2">
              {DRIVER_OPTIONS.map((d) => (
                <label key={d} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${selectedDrivers.has(d) ? "border-qbit-primary bg-qbit-primary/10 text-qbit-primary" : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"}`}>
                  <Checkbox checked={selectedDrivers.has(d)} onCheckedChange={() => toggleSelection(selectedDrivers, d, setSelectedDrivers)} />
                  {d}
                </label>
              ))}
            </div>
          </div>

          {/* Manuals */}
          <div className="mb-4 border-t border-qbit-outline-variant/50 pt-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-qbit-primary">Manuals & Guides</label>
            <div className="flex flex-wrap gap-2">
              {MANUAL_OPTIONS.map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${selectedManuals.has(m) ? "border-qbit-primary bg-qbit-primary/10 text-qbit-primary" : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"}`}>
                  <Checkbox checked={selectedManuals.has(m)} onCheckedChange={() => toggleSelection(selectedManuals, m, setSelectedManuals)} />
                  {m}
                </label>
              ))}
            </div>
          </div>

          {/* Videos */}
          <div className="mb-4 border-t border-qbit-outline-variant/50 pt-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-qbit-primary">Videos</label>
            <div className="flex flex-wrap gap-2">
              {VIDEO_OPTIONS.map((v) => (
                <label key={v} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${selectedVideos.has(v) ? "border-qbit-primary bg-qbit-primary/10 text-qbit-primary" : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"}`}>
                  <Checkbox checked={selectedVideos.has(v)} onCheckedChange={() => toggleSelection(selectedVideos, v, setSelectedVideos)} />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="border-t border-qbit-outline-variant/50 pt-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-qbit-primary">Brochures & Documents</label>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_OPTIONS.map((d) => (
                <label key={d} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${selectedDocuments.has(d) ? "border-qbit-primary bg-qbit-primary/10 text-qbit-primary" : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"}`}>
                  <Checkbox checked={selectedDocuments.has(d)} onCheckedChange={() => toggleSelection(selectedDocuments, d, setSelectedDocuments)} />
                  {d}
                </label>
              ))}
            </div>
          </div>
        </SurfaceCard>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-xl border border-qbit-outline-variant bg-white/95 p-4 shadow-lg backdrop-blur">
          <QbitButton variant="ghost" icon="arrow_back" onClick={() => navigate("ai-purchase-center")}>Cancel</QbitButton>
          <QbitButton variant="outline" icon="edit_note" disabled={saving} onClick={() => handleSave(false, true)}>Save as Draft</QbitButton>
          <QbitButton variant="outline" icon="add" disabled={saving} onClick={() => handleSave(true, false)}>Save & Register Another</QbitButton>
          <QbitButton variant="primary" icon={saving ? "progress_activity" : "check"} disabled={saving} onClick={() => handleSave(false, false)}>
            {saving ? "Saving…" : "Save Device"}
          </QbitButton>
        </div>
      </div>
    </AppShell>
  );
}
