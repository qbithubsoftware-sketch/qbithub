"use client";

/**
 * ProductMasterFullEditPage — full-page product editor (replaces Quick Edit popup).
 *
 * Redesigned per V5 spec:
 *   1. Full-page editor (not a popup) — keeps sidebar + top nav visible
 *   2. Product Images section with drag & drop upload (main + gallery)
 *   3. URL fields replaced with SearchableResourceDropdown:
 *      - Driver Resource (was: driverDownloadUrl)
 *      - Maintenance Resource (was: maintenance URL — manual type)
 *      - Browser Resource (was: utility/browser URL — utility type)
 *      - Download Resource (was: SDK/utility URL)
 *      - Installation Resource (was: installationGuideUrl)
 *   4. Live Preview section showing all linked resources before save
 *   5. Save logic updates product + preserves linked resources
 *
 * Workflow:
 *   - Admin clicks "Quick Edit" on a product in ProductMasterPage
 *   - Navigates to this full-page editor with ?productId=XXX param
 *   - Loads product details + all uploaded resources
 *   - Admin edits fields, manages images, links resources via dropdowns
 *   - Live Preview shows what's linked
 *   - Save → PUT /api/admin/products/[id] + image upload
 */

import { useCallback, useEffect, useRef, useState } from "react";
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
import { SearchableResourceDropdown, type ResourceOption } from "@/components/qbit/admin/SearchableResourceDropdown";

// ====================== Types ======================
interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  manufacturer: string | null;
  model: string;
  slug: string;
  deviceType: string;
  category: string | null;
  description: string | null;
  longDescription: string | null;
  imageUrl: string | null;
  galleryImages: string | null; // JSON string
  sku: string | null;
  serialPattern: string | null;
  warrantyDuration: string | null;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  // URL fields (will be replaced by resource IDs in dropdowns)
  driverDownloadUrl: string | null;
  manualUrl: string | null;
  installationGuideUrl: string | null;
  utilityUrl: string | null;
  sdkUrl: string | null;
  brochureUrl: string | null;
  datasheetUrl: string | null;
  warrantyUrl: string | null;
  knowledgeBaseUrl: string | null;
  latestDriverVersion: string | null;
  latestFirmwareVersion: string | null;
}

interface ResourceItem {
  id: string;
  type: string;
  title: string;
  url: string;
  mimeType: string | null;
  altText: string | null;
  createdAt: string;
}

// ====================== Constants ======================
const DEVICE_TYPES = [
  { value: "thermal_printer", label: "Thermal Printer", slug: "thermal-printer" },
  { value: "barcode_scanner", label: "Barcode Scanner", slug: "barcode-scanner" },
  { value: "windows_pos", label: "Windows POS", slug: "windows-pos" },
  { value: "android_pos", label: "Android POS", slug: "android-pos" },
  { value: "cash_drawer", label: "Cash Drawer", slug: "cash-drawer" },
  { value: "customer_display", label: "Customer Display", slug: "customer-display" },
  { value: "label_printer", label: "Label Printer", slug: "label-printer" },
  { value: "kiosk", label: "Kiosk", slug: "kiosk" },
];

// ====================== Component ======================
export function ProductMasterFullEditPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigation((s) => s.navigate);
  const params = useNavigation((s) => s.params);
  const productId = params.productId ?? params.id ?? "";

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resources, setResources] = useState<ResourceItem[]>([]);

  // Form state
  const [form, setForm] = useState<Record<string, unknown>>({});
  // Resource ID selections (replacing URL fields)
  const [driverResourceId, setDriverResourceId] = useState<string | null>(null);
  const [maintenanceResourceId, setMaintenanceResourceId] = useState<string | null>(null);
  const [browserResourceId, setBrowserResourceId] = useState<string | null>(null);
  const [downloadResourceId, setDownloadResourceId] = useState<string | null>(null);
  const [installationResourceId, setInstallationResourceId] = useState<string | null>(null);

  // Image upload state
  const [mainImageUrl, setMainImageUrl] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // ===== Fetch product details =====
  const fetchProduct = useCallback(async () => {
    if (!productId) {
      toast({ title: "No product ID provided", variant: "destructive" });
      navigate("product-master");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load product");
      const data = await res.json();
      const p = data.product ?? data;
      setProduct(p);
      setForm({
        name: p.name ?? "",
        brand: p.brand ?? "QBIT",
        manufacturer: p.manufacturer ?? "",
        model: p.model ?? "",
        deviceType: p.deviceType ?? "thermal_printer",
        description: p.description ?? "",
        longDescription: p.longDescription ?? "",
        sku: p.sku ?? "",
        serialPattern: p.serialPattern ?? "",
        warrantyDuration: p.warrantyDuration ?? "12 months",
        status: p.status ?? "active",
        isFeatured: p.isFeatured ?? false,
        isTrending: p.isTrending ?? false,
      });
      setMainImageUrl(p.imageUrl ?? "");
      // Parse gallery images (JSON string of {url, alt}[] OR comma-separated URLs)
      let gallery: string[] = [];
      if (p.galleryImages) {
        try {
          const parsed = JSON.parse(p.galleryImages);
          if (Array.isArray(parsed)) {
            gallery = parsed.map((g: { url?: string } | string) =>
              typeof g === "string" ? g : g.url ?? ""
            ).filter(Boolean);
          }
        } catch {
          gallery = String(p.galleryImages).split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
      setGalleryImages(gallery);
    } catch (e) {
      toast({
        title: "Failed to load product",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
      navigate("product-master");
    } finally {
      setLoading(false);
    }
  }, [productId, navigate, toast]);

  // ===== Fetch resources for this product =====
  const fetchResources = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}/resources`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const items: ResourceItem[] = (data.resources ?? []).map((r: ResourceItem) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        url: r.url,
        mimeType: r.mimeType,
        altText: r.altText,
        createdAt: r.createdAt,
      }));
      setResources(items);

      // Auto-match existing URL fields to resource IDs (best-effort)
      if (product) {
        if (product.driverDownloadUrl) {
          const match = items.find((r) => r.url === product.driverDownloadUrl);
          if (match) setDriverResourceId(match.id);
        }
        if (product.manualUrl) {
          const match = items.find((r) => r.url === product.manualUrl);
          if (match) setMaintenanceResourceId(match.id);
        }
        if (product.utilityUrl) {
          const match = items.find((r) => r.url === product.utilityUrl);
          if (match) setBrowserResourceId(match.id);
        }
        if (product.sdkUrl || product.utilityUrl) {
          const match = items.find((r) => r.url === product.sdkUrl || r.url === product.utilityUrl);
          if (match) setDownloadResourceId(match.id);
        }
        if (product.installationGuideUrl) {
          const match = items.find((r) => r.url === product.installationGuideUrl);
          if (match) setInstallationResourceId(match.id);
        }
      }
    } catch {
      // silent fail — dropdowns will just be empty
    }
  }, [productId, product]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product) void fetchResources();
  }, [product, fetchResources]);

  // ===== Resource dropdown helpers =====
  const resourceOptions: ResourceOption[] = resources.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    url: r.url,
    mimeType: r.mimeType,
    altText: r.altText,
    createdAt: r.createdAt,
  }));

  const driverResource = resourceOptions.find((r) => r.id === driverResourceId) ?? null;
  const maintenanceResource = resourceOptions.find((r) => r.id === maintenanceResourceId) ?? null;
  const browserResource = resourceOptions.find((r) => r.id === browserResourceId) ?? null;
  const downloadResource = resourceOptions.find((r) => r.id === downloadResourceId) ?? null;
  const installationResource = resourceOptions.find((r) => r.id === installationResourceId) ?? null;

  // ===== Image upload handlers (REAL upload via /api/admin/upload-image) =====
  async function handleImageUpload(file: File, isGallery: boolean = false): Promise<void> {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file (JPG, PNG, WEBP)", variant: "destructive" });
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Unsupported format. Use JPG, PNG, or WEBP.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    setUploadingImage(true);
    try {
      // ===== REAL UPLOAD: POST file to /api/admin/upload-image =====
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }
      const data = await res.json();
      const url: string = data.url; // "/uploads/products/<filename>"

      // ===== INSTANT PREVIEW: update state immediately (no save required) =====
      if (isGallery) {
        setGalleryImages((prev) => [...prev, url]);
      } else {
        setMainImageUrl(url);
      }
      toast({ title: "Image uploaded", description: file.name });
    } catch (e) {
      toast({
        title: "Image upload failed",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean) {
    const files = Array.from(e.target.files ?? []);
    for (const f of files) {
      void handleImageUpload(f, isGallery);
    }
    // Reset input
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const f of files) {
      void handleImageUpload(f, true); // dropped files go to gallery
    }
  }

  function removeGalleryImage(idx: number) {
    setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function setFeaturedImage(idx: number) {
    const url = galleryImages[idx];
    setMainImageUrl(url);
    setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
    toast({ title: "Set as main image" });
  }

  // ===== Save =====
  async function handleSave() {
    if (!product) return;
    if (!form.name || !form.model) {
      toast({ title: "Product Name and Model are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Build update payload — replace URL fields with selected resource URLs
      const payload: Record<string, unknown> = {
        name: form.name,
        brand: form.brand,
        manufacturer: form.manufacturer || null,
        model: form.model,
        deviceType: form.deviceType,
        description: form.description || null,
        longDescription: form.longDescription || null,
        sku: form.sku || null,
        serialPattern: form.serialPattern || null,
        warrantyDuration: form.warrantyDuration || null,
        status: form.status,
        isActive: form.status === "active",
        isFeatured: !!form.isFeatured,
        isTrending: !!form.isTrending,
        imageUrl: mainImageUrl || null,
        galleryImages: galleryImages.length > 0
          ? JSON.stringify(galleryImages.map((url) => ({ url, alt: form.name ?? "Product image" })))
          : null,
        // Resource-mapped URL fields (selected via dropdowns)
        driverDownloadUrl: driverResource?.url ?? null,
        manualUrl: maintenanceResource?.url ?? null,
        utilityUrl: browserResource?.url ?? downloadResource?.url ?? null,
        sdkUrl: downloadResource?.url ?? null,
        installationGuideUrl: installationResource?.url ?? null,
        latestDriverVersion: driverResource ? extractVersion(driverResource) : product.latestDriverVersion,
      };

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast({ title: "Product updated!", description: `${form.name} saved successfully.` });
      navigate("product-master");
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  // ===== Loading state =====
  if (loading) {
    return (
      <AppShell
        variant="admin"
        brand={{ title: "QBIT Hub", tagline: "Product Master", icon: "database" }}
        navItems={ADMIN_NAV}
        activeScreen="product-master-edit"
        user={{ name: userName, role: "Administrator", initials }}
        topBar={{ searchPlaceholder: "Edit product…", user: { name: userName, role: "Administrator", initials } }}
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <Icon name="progress_activity" className="animate-spin text-[40px] text-qbit-primary" />
        </div>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell
        variant="admin"
        brand={{ title: "QBIT Hub", tagline: "Product Master", icon: "database" }}
        navItems={ADMIN_NAV}
        activeScreen="product-master-edit"
        user={{ name: userName, role: "Administrator", initials }}
        topBar={{ searchPlaceholder: "Edit product…", user: { name: userName, role: "Administrator", initials } }}
      >
        <SurfaceCard className="p-12 text-center">
          <Icon name="error" className="mx-auto text-[40px] text-qbit-error" />
          <p className="mt-3 text-sm font-medium text-qbit-on-surface">Product not found.</p>
          <QbitButton variant="outline" size="sm" icon="arrow_back" className="mt-4" onClick={() => navigate("product-master")}>
            Back to Product Master
          </QbitButton>
        </SurfaceCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Product Master", icon: "database" }}
      navItems={ADMIN_NAV}
      activeScreen="product-master-edit"
      user={{ name: userName, role: "Administrator", initials }}
      topBar={{ searchPlaceholder: "Edit product…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <button
              onClick={() => navigate("product-master")}
              className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-qbit-on-surface-variant hover:text-qbit-primary"
            >
              <Icon name="arrow_back" className="text-[14px]" />
              Back to Product Master
            </button>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-qbit-on-surface">
              <Icon name="edit" className="text-[28px] text-qbit-primary" />
              Edit Product
            </h2>
            <p className="mt-1 text-sm text-qbit-on-surface-variant">
              {product.name} · <span className="font-mono">{product.model}</span> · ID: <span className="font-mono">{product.id}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <QbitButton variant="ghost" icon="arrow_back" onClick={() => navigate("product-master")}>Cancel</QbitButton>
            <QbitButton variant="primary" icon={saving ? "progress_activity" : "save"} disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save Changes"}
            </QbitButton>
          </div>
        </div>

        {/* ===== Section 1: Basic Information ===== */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="info" className="text-[20px] text-qbit-primary" /> Basic Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Product Name *</label>
              <Input value={String(form.name ?? "")} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Model Number *</label>
              <Input value={String(form.model ?? "")} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Brand</label>
              <Input value={String(form.brand ?? "")} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Manufacturer</label>
              <Input value={String(form.manufacturer ?? "")} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Device Type</label>
              <select
                value={String(form.deviceType ?? "thermal_printer")}
                onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
                className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
              >
                {DEVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">SKU</label>
              <Input value={String(form.sku ?? "")} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Serial Prefix</label>
              <Input value={String(form.serialPattern ?? "")} onChange={(e) => setForm({ ...form, serialPattern: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Warranty Duration</label>
              <Input value={String(form.warrantyDuration ?? "")} onChange={(e) => setForm({ ...form, warrantyDuration: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Description</label>
              <Textarea rows={2} value={String(form.description ?? "")} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Long Description</label>
              <Textarea rows={3} value={String(form.longDescription ?? "")} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Status</label>
              <select
                value={String(form.status ?? "active")}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary"
                />
                <span className="text-xs font-medium text-qbit-on-surface-variant">Featured</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.isTrending}
                  onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
                  className="h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary"
                />
                <span className="text-xs font-medium text-qbit-on-surface-variant">Trending</span>
              </label>
            </div>
          </div>
        </SurfaceCard>

        {/* ===== Section 2: Product Images (drag & drop) ===== */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="photo_library" className="text-[20px] text-qbit-primary" /> Product Images
          </h3>

          {/* Main image */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Main Product Image</label>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low">
                {mainImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mainImageUrl} alt="Main" className="h-full w-full object-cover" />
                ) : (
                  <Icon name="image" className="text-[32px] text-qbit-on-surface-variant/40" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileInput(e, false)}
                  className="hidden"
                />
                <QbitButton
                  variant="outline"
                  size="sm"
                  icon={uploadingImage ? "progress_activity" : "upload"}
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {mainImageUrl ? "Replace Main Image" : "Upload Main Image"}
                </QbitButton>
                <p className="mt-1.5 text-[11px] text-qbit-on-surface-variant">
                  JPG, PNG, or WEBP · Max 5MB · This image appears as the product cover.
                </p>
              </div>
            </div>
          </div>

          {/* Gallery images */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
              Gallery Images ({galleryImages.length})
            </label>

            {/* Drag & drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => galleryInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                dragOver
                  ? "border-qbit-primary bg-qbit-primary/5"
                  : "border-qbit-outline-variant bg-qbit-surface-container-low/30 hover:border-qbit-primary/40"
              }`}
            >
              <Icon name="cloud_upload" className="text-[32px] text-qbit-on-surface-variant/60" />
              <p className="mt-2 text-sm font-medium text-qbit-on-surface">
                {dragOver ? "Drop images here…" : "Drag & drop gallery images here"}
              </p>
              <p className="mt-0.5 text-[11px] text-qbit-on-surface-variant">or click to browse · JPG, PNG, WEBP</p>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => handleFileInput(e, true)}
                className="hidden"
              />
            </div>

            {/* Gallery thumbnails */}
            {galleryImages.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {galleryImages.map((url, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                    {/* Hover actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFeaturedImage(idx); }}
                        className="rounded p-1.5 text-white hover:bg-white/20"
                        title="Set as main image"
                      >
                        <Icon name="star" className="text-[16px]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeGalleryImage(idx); }}
                        className="rounded p-1.5 text-white hover:bg-red-500/40"
                        title="Delete image"
                      >
                        <Icon name="delete" className="text-[16px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SurfaceCard>

        {/* ===== Section 3: Resource Mapping (dropdowns replace URL fields) ===== */}
        <SurfaceCard className="p-6">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="link" className="text-[20px] text-qbit-primary" /> Resource Mapping
          </h3>
          <p className="mb-4 text-[11px] text-qbit-on-surface-variant">
            Select resources uploaded for this product — no manual URL pasting needed. Upload new resources via Product &amp; Resource Manager.
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SearchableResourceDropdown
              label="Driver Resource"
              description="Linked as the official driver download for this product."
              icon="memory"
              resources={resourceOptions}
              filterTypes={["windows_driver", "driver"]}
              value={driverResourceId}
              onChange={(id) => setDriverResourceId(id)}
            />

            <SearchableResourceDropdown
              label="Maintenance Resource"
              description="Maintenance guide, cleaning guide, or repair manual."
              icon="build"
              resources={resourceOptions}
              filterTypes={["manual", "troubleshooting"]}
              value={maintenanceResourceId}
              onChange={(id) => setMaintenanceResourceId(id)}
            />

            <SearchableResourceDropdown
              label="Browser Resource"
              description="Browser-based utility, web POS tool, or configuration guide."
              icon="apps"
              resources={resourceOptions}
              filterTypes={["windows_software", "utility"]}
              value={browserResourceId}
              onChange={(id) => setBrowserResourceId(id)}
            />

            <SearchableResourceDropdown
              label="Download Resource"
              description="Primary download (SDK, utility, or software package)."
              icon="download"
              resources={resourceOptions}
              filterTypes={["sdk", "windows_software", "utility", "android_software"]}
              value={downloadResourceId}
              onChange={(id) => setDownloadResourceId(id)}
            />

            <SearchableResourceDropdown
              label="Installation Resource"
              description="Installation guide PDF, quick start guide, or setup wizard."
              icon="menu_book"
              resources={resourceOptions}
              filterTypes={["manual"]}
              value={installationResourceId}
              onChange={(id) => setInstallationResourceId(id)}
            />
          </div>

          {/* Empty state */}
          {resources.length === 0 && (
            <div className="mt-4 rounded-lg border border-dashed border-qbit-warning/40 bg-qbit-warning/5 p-4 text-center">
              <Icon name="info" className="mx-auto text-[20px] text-qbit-warning" />
              <p className="mt-1 text-xs font-medium text-qbit-on-surface">No resources uploaded for this product yet.</p>
              <p className="mt-0.5 text-[11px] text-qbit-on-surface-variant">
                Upload resources via <strong>Product &amp; Resource Manager</strong> to enable dropdown selection here.
              </p>
            </div>
          )}
        </SurfaceCard>

        {/* ===== Section 4: Live Preview of Linked Resources ===== */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="preview" className="text-[20px] text-qbit-primary" /> Live Preview — Linked Resources
          </h3>

          <div className="space-y-2">
            <LinkedResourceRow label="Driver" icon="memory" resource={driverResource} />
            <LinkedResourceRow label="Maintenance" icon="build" resource={maintenanceResource} />
            <LinkedResourceRow label="Browser" icon="apps" resource={browserResource} />
            <LinkedResourceRow label="Download" icon="download" resource={downloadResource} />
            <LinkedResourceRow label="Installation" icon="menu_book" resource={installationResource} />
          </div>

          {/* Summary stats */}
          <div className="mt-4 flex items-center justify-between rounded-lg border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-3">
            <div className="flex items-center gap-2">
              <Icon name="check_circle" className="text-[18px] text-qbit-success" />
              <p className="text-xs font-semibold text-qbit-on-surface">
                {[driverResource, maintenanceResource, browserResource, downloadResource, installationResource].filter(Boolean).length} of 5 resources linked
              </p>
            </div>
            <span className="rounded-md bg-qbit-primary/10 px-2 py-0.5 text-[11px] font-semibold text-qbit-primary">
              {resources.length} total resources available
            </span>
          </div>
        </SurfaceCard>

        {/* ===== Bottom Save Bar ===== */}
        <div className="sticky bottom-4 flex justify-end gap-2 rounded-xl border border-qbit-outline-variant bg-white/95 p-3 shadow-lg backdrop-blur">
          <QbitButton variant="ghost" icon="arrow_back" onClick={() => navigate("product-master")}>Cancel</QbitButton>
          <QbitButton variant="primary" icon={saving ? "progress_activity" : "save"} disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Changes"}
          </QbitButton>
        </div>
      </div>
    </AppShell>
  );
}

// ====================== Linked Resource Row (Live Preview) ======================
function LinkedResourceRow({
  label,
  icon,
  resource,
}: {
  label: string;
  icon: string;
  resource: ResourceOption | null;
}) {
  if (!resource) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-qbit-outline-variant/50 bg-qbit-surface-container-low/30 p-3">
        <Icon name={icon} className="text-[18px] text-qbit-on-surface-variant/40" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-qbit-on-surface-variant">{label}</p>
          <p className="text-[11px] text-qbit-on-surface-variant/60">Not linked — select a resource above</p>
        </div>
        <span className="rounded-md bg-qbit-surface-container-high px-2 py-0.5 text-[10px] font-semibold uppercase text-qbit-on-surface-variant">Pending</span>
      </div>
    );
  }

  const version = extractVersion(resource);
  const subLabel = extractSubLabel(resource);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-qbit-success/30 bg-qbit-success/5 p-3">
      <Icon name={icon} className="text-[18px] text-qbit-success" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-qbit-on-surface">{label}</p>
          <span className="rounded-md bg-qbit-success/15 px-1.5 py-0.5 text-[10px] font-bold text-qbit-success">Linked</span>
        </div>
        <p className="truncate text-xs font-medium text-qbit-on-surface">{resource.title}</p>
        {subLabel && <p className="truncate text-[11px] text-qbit-on-surface-variant">{subLabel}</p>}
      </div>
      {version && (
        <span className="shrink-0 rounded bg-qbit-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-qbit-primary">{version}</span>
      )}
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded p-1.5 text-qbit-on-surface-variant hover:bg-white"
        title="Open resource"
      >
        <Icon name="open_in_new" className="text-[16px]" />
      </a>
    </div>
  );
}

// ====================== Helpers ======================
function extractVersion(resource: ResourceOption): string {
  if (!resource.altText) return "";
  try {
    const parsed = JSON.parse(resource.altText);
    if (parsed?.meta) {
      return parsed.meta.version ?? parsed.meta.driverVersion ?? parsed.meta.firmwareVersion ?? "";
    }
  } catch {
    // ignore
  }
  return "";
}

function extractSubLabel(resource: ResourceOption): string {
  if (!resource.altText) return "";
  try {
    const parsed = JSON.parse(resource.altText);
    if (parsed?.meta) {
      return (
        parsed.meta.supportedOS ??
        parsed.meta.manualType ??
        parsed.meta.docType ??
        parsed.meta.viewType ??
        parsed.meta.category ??
        parsed.meta.language ??
        ""
      );
    }
  } catch {
    // ignore
  }
  return "";
}
