"use client";

/**
 * ProductAndResourceManager — V5 unified single-page workflow.
 *
 * Replaces the old 3-step flow (Product Master → Upload Master → Resource Center)
 * with ONE seamless page:
 *
 *   Create Product → Save → Upload Resources → Done
 *
 * LAYOUT:
 *   Top bar: Search Product + Filter by Category + Filter by Brand + Recent Products
 *
 *   Section 1 — Product Information
 *     Category, Brand, Name, Model, Serial Prefix, Warranty, Description,
 *     Image URL, Status (Active/Inactive), Save Product button
 *
 *   Section 2 — Product Resources (auto-appears after save; accordion cards)
 *     ▶ Windows Drivers
 *     ▶ Windows Software
 *     ▶ Android Software
 *     ▶ Firmware
 *     ▶ Manuals & Guides
 *     ▶ Installation Videos
 *     ▶ Product Gallery
 *     Only one card expanded at a time. Each card has upload form + existing list.
 *
 *   Section 3 — Live Resource Summary
 *     Product card + grouped resource counts + Overall Status (Complete/Incomplete)
 *
 * WORKFLOW:
 *   1. Admin searches existing product OR clicks "Create New Product"
 *   2. Fills product information form
 *   3. Clicks "Save Product" → product created/updated
 *   4. Section 2 (Resources) automatically appears below
 *   5. Admin uploads resources via accordion cards
 *   6. Live Resource Summary updates in real-time
 *   7. Customer searches product in Dr. QBIT → all resources auto-appear
 *
 * UI inspired by Microsoft 365 Admin Center, Atlassian, Stripe Dashboard,
 * Apple Business Manager.
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

// ====================== Types ======================
interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  model: string;
  slug: string;
  category: string | null;
  deviceType: string | null;
  imageUrl: string | null;
  sku: string | null;
  serialPattern: string | null;
  warrantyDuration: string | null;
  description: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
}

interface ProductMedia {
  id: string;
  productId: string;
  type: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  altText: string | null;
  sortIndex: number;
  visibility: string;
  createdAt: string;
}

interface ProductFormState {
  id?: string; // present when editing existing product
  name: string;
  brand: string;
  model: string;
  category: string;
  deviceType: string;
  serialPattern: string;
  warrantyDuration: string;
  description: string;
  imageUrl: string;
  status: "active" | "inactive";
}

// ====================== Constants ======================
const PRODUCT_CATEGORIES = [
  "Window POS", "Android POS", "Handy POS", "Thermal Printer", "Portable Printer",
  "Barcode Printer", "Barcode Scanner", "Cash Drawer", "Customer Side Display",
  "Self Ordering Kiosk", "Digital Standee", "Accessories", "Other",
];

const CATEGORY_TO_DEVICE_TYPE: Record<string, string> = {
  "Window POS": "windows_pos",
  "Android POS": "android_pos",
  "Handy POS": "handy_pos",
  "Thermal Printer": "thermal_printer",
  "Portable Printer": "portable_printer",
  "Barcode Printer": "barcode_printer",
  "Barcode Scanner": "barcode_scanner",
  "Cash Drawer": "cash_drawer",
  "Customer Side Display": "customer_display",
  "Self Ordering Kiosk": "kiosk",
  "Digital Standee": "digital_standee",
  "Accessories": "accessory",
  "Other": "other",
};

const EMPTY_FORM: ProductFormState = {
  name: "", brand: "QBIT", model: "", category: "", deviceType: "",
  serialPattern: "", warrantyDuration: "12 months", description: "",
  imageUrl: "", status: "active",
};

// Accordion resource sections
interface ResourceSectionConfig {
  id: string;
  title: string;
  icon: string;
  color: string;
  mediaType: string;
  acceptTypes: string;
  allowUrl?: boolean;
  fields: Array<{
    name: string;
    label: string;
    required?: boolean;
    type?: "text" | "textarea" | "date" | "select";
    options?: string[];
    placeholder?: string;
  }>;
}

const RESOURCE_SECTIONS: ResourceSectionConfig[] = [
  {
    id: "windows_drivers",
    title: "Windows Drivers",
    icon: "memory",
    color: "bg-qbit-primary/10 text-qbit-primary",
    mediaType: "windows_driver",
    acceptTypes: ".zip,.exe,.msi,.inf",
    fields: [
      { name: "name", label: "Driver Name", required: true, placeholder: "Windows 11 Driver" },
      { name: "version", label: "Version", required: true, placeholder: "v2.4.1" },
      {
        name: "supportedOS",
        label: "Supported OS",
        type: "select",
        options: ["Windows 11", "Windows 10", "Windows 8", "Windows 7", "Windows 11 + 10", "All Windows"],
      },
      { name: "releaseNotes", label: "Release Notes", type: "textarea", placeholder: "What changed in this version?" },
    ],
  },
  {
    id: "windows_software",
    title: "Windows Software",
    icon: "apps",
    color: "bg-qbit-secondary/10 text-qbit-secondary",
    mediaType: "windows_software",
    acceptTypes: ".exe,.msi,.zip",
    fields: [
      { name: "name", label: "Software Name", required: true, placeholder: "POS Utility" },
      { name: "version", label: "Version", required: true, placeholder: "v1.0.0" },
      { name: "releaseDate", label: "Release Date", type: "date" },
      { name: "description", label: "Description", type: "textarea", placeholder: "What does this software do?" },
    ],
  },
  {
    id: "android_software",
    title: "Android Software",
    icon: "phone_android",
    color: "bg-qbit-tertiary/10 text-qbit-tertiary",
    mediaType: "android_software",
    acceptTypes: ".apk,.zip",
    allowUrl: true,
    fields: [
      { name: "name", label: "App Name", required: true, placeholder: "Barcode Scanner App" },
      { name: "version", label: "Version", required: true, placeholder: "v1.2.0" },
      { name: "minAndroid", label: "Minimum Android Version", placeholder: "Android 8.0 (Oreo)" },
      { name: "playStoreLink", label: "Play Store Link (optional)", placeholder: "https://play.google.com/store/apps/..." },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    id: "firmware",
    title: "Firmware",
    icon: "upgrade",
    color: "bg-qbit-warning/15 text-qbit-warning",
    mediaType: "firmware",
    acceptTypes: ".bin,.hex,.img",
    fields: [
      { name: "name", label: "Firmware Name", required: true, placeholder: "P80UE Firmware v1.8.0" },
      { name: "version", label: "Version", required: true, placeholder: "v1.8.0" },
      { name: "compatibleModels", label: "Supported Models", placeholder: "P80UE, P80 Beta" },
      { name: "releaseNotes", label: "Release Notes", type: "textarea" },
    ],
  },
  {
    id: "manuals",
    title: "Manuals & Guides",
    icon: "menu_book",
    color: "bg-qbit-tertiary/10 text-qbit-tertiary",
    mediaType: "manual",
    acceptTypes: ".pdf,.doc,.docx",
    fields: [
      { name: "name", label: "Manual Name", required: true, placeholder: "User Manual" },
      {
        name: "manualType",
        label: "Manual Type",
        type: "select",
        options: ["User Manual", "Quick Start Guide", "Installation Guide", "Warranty Guide", "Maintenance Guide", "Troubleshooting Guide", "Cleaning Guide"],
      },
      {
        name: "language",
        label: "Language",
        type: "select",
        options: ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Kannada", "Bengali", "Gujarati", "Multi-language"],
      },
    ],
  },
  {
    id: "videos",
    title: "Installation Videos",
    icon: "videocam",
    color: "bg-qbit-error/10 text-qbit-error",
    mediaType: "video",
    acceptTypes: "url",
    allowUrl: true,
    fields: [
      { name: "name", label: "Video Title", required: true, placeholder: "P80UE Installation Walkthrough" },
      { name: "videoUrl", label: "Video URL (YouTube/Vimeo)", required: true, placeholder: "https://www.youtube.com/watch?v=..." },
      { name: "thumbnailUrl", label: "Thumbnail URL (optional)", placeholder: "https://..." },
      { name: "duration", label: "Duration", placeholder: "12:45" },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: ["Installation", "Setup", "Troubleshooting", "Maintenance", "Training", "Product Demo"],
      },
    ],
  },
  {
    id: "gallery",
    title: "Product Gallery",
    icon: "photo_library",
    color: "bg-qbit-primary/10 text-qbit-primary",
    mediaType: "gallery_image",
    acceptTypes: "image/*",
    fields: [
      { name: "name", label: "Image Name", required: true, placeholder: "Front View" },
      {
        name: "viewType",
        label: "View Type",
        type: "select",
        options: ["Front", "Back", "Side", "Ports", "Inside View", "Accessories", "Packaging", "Other"],
      },
      { name: "altText", label: "Alt Text (accessibility)", placeholder: "P80UE front view" },
    ],
  },
];

// ====================== Component ======================
export function ProductAndResourceManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentScreen = useNavigation((s) => s.current);

  // Product list + filters
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  // Selected/created product
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);

  // Resources
  const [resources, setResources] = useState<ProductMedia[]>([]);
  const [grouped, setGrouped] = useState<Record<string, ProductMedia[]>>({});
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<ProductMedia | null>(null);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // ===== Fetch products list =====
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/admin/products?limit=500", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const items: ProductSummary[] = (data.items ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        brand: p.brand as string,
        model: p.model as string,
        slug: p.slug as string,
        category: (p.category as string | null) ?? null,
        deviceType: (p.deviceType as string | null) ?? null,
        imageUrl: (p.imageUrl as string | null) ?? null,
        sku: (p.sku as string | null) ?? null,
        serialPattern: (p.serialPattern as string | null) ?? null,
        warrantyDuration: (p.warrantyDuration as string | null) ?? null,
        description: (p.description as string | null) ?? null,
        status: (p.status as string) ?? "active",
        isActive: (p.isActive as boolean) ?? true,
        createdAt: (p.createdAt as string) ?? new Date().toISOString(),
      }));
      setProducts(items);
    } catch {
      toast({ title: "Failed to load products", variant: "destructive" });
    } finally {
      setProductsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // ===== Fetch resources for selected/saved product =====
  const fetchResources = useCallback(async () => {
    if (!savedProductId) {
      setResources([]);
      setGrouped({});
      return;
    }
    setResourcesLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${savedProductId}/resources`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResources(data.resources ?? []);
      setGrouped(data.grouped ?? {});
    } catch {
      setResources([]);
      setGrouped({});
    } finally {
      setResourcesLoading(false);
    }
  }, [savedProductId]);

  useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  // ===== Filtered products for the sidebar/search panel =====
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.model.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (brandFilter && p.brand !== brandFilter) return false;
    return true;
  });
  const recentProducts = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // ===== Select existing product =====
  function handleSelectProduct(p: ProductSummary) {
    setForm({
      id: p.id,
      name: p.name,
      brand: p.brand,
      model: p.model,
      category: p.category ?? "",
      deviceType: p.deviceType ?? "",
      serialPattern: p.serialPattern ?? "",
      warrantyDuration: p.warrantyDuration ?? "12 months",
      description: p.description ?? "",
      imageUrl: p.imageUrl ?? "",
      status: p.isActive ? "active" : "inactive",
    });
    setSavedProductId(p.id);
    setOpenSectionId(null);
    setEditingResource(null);
    // Scroll to product form
    setTimeout(() => {
      document.getElementById("product-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  // ===== Create new product (reset form) =====
  function handleCreateNew() {
    setForm(EMPTY_FORM);
    setSavedProductId(null);
    setResources([]);
    setGrouped({});
    setOpenSectionId(null);
    setEditingResource(null);
    setTimeout(() => {
      document.getElementById("product-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  // ===== Save product (create or update) =====
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.model.trim()) {
      toast({ title: "Product Name and Model are required", variant: "destructive" });
      return;
    }
    if (!form.category) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }

    setSavingProduct(true);
    try {
      const deviceType = form.deviceType || CATEGORY_TO_DEVICE_TYPE[form.category] || "other";
      const payload = {
        name: form.name,
        brand: form.brand || "QBIT",
        model: form.model,
        category: form.category,
        deviceType,
        serialPattern: form.serialPattern || undefined,
        warrantyDuration: form.warrantyDuration || undefined,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        status: form.status,
        isActive: form.status === "active",
      };

      let res: Response;
      if (form.id) {
        // Update existing
        res = await fetch(`/api/admin/products/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      const data = await res.json();
      const savedId = data.product?.id ?? form.id;
      setSavedProductId(savedId);
      setForm({ ...form, id: savedId });
      toast({
        title: form.id ? "Product updated!" : "Product created!",
        description: `${form.name} — resources section is now available below.`,
      });
      // Refresh products list
      void fetchProducts();
      // Auto-expand first resource section to invite uploading
      setOpenSectionId("windows_drivers");
      // Scroll to resources section
      setTimeout(() => {
        document.getElementById("resources-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSavingProduct(false);
    }
  }

  // ===== Resource CRUD (delegated to /api/admin/products/[id]/resources) =====
  async function handleDeleteResource(r: ProductMedia) {
    if (!savedProductId) return;
    if (!confirm(`Delete "${r.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${savedProductId}/resources/${r.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Resource deleted" });
      void fetchResources();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  // ===== Counts for live summary =====
  const counts: Record<string, number> = {
    windows_driver: grouped.windows_driver?.length ?? 0,
    windows_software: grouped.windows_software?.length ?? 0,
    android_software: grouped.android_software?.length ?? 0,
    firmware: grouped.firmware?.length ?? 0,
    manual: grouped.manual?.length ?? 0,
    video: grouped.video?.length ?? 0,
    gallery_image: grouped.gallery_image?.length ?? 0,
  };
  const totalResources = Object.values(counts).reduce((a, b) => a + b, 0);
  const overallStatus = totalResources > 0 ? "Complete" : "Incomplete";

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Product & Resource Manager", icon: "inventory_2" }}
      navItems={ADMIN_NAV}
      activeScreen={currentScreen}
      user={{ name: userName, role: "Administrator", initials }}
      topBar={{ searchPlaceholder: "Search products…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-qbit-on-surface">
              <Icon name="inventory_2" className="text-[28px] text-qbit-primary" />
              Product & Resource Manager
            </h2>
            <p className="mt-1 text-sm text-qbit-on-surface-variant">
              Single source of truth — create product, upload resources, all on one page.
            </p>
          </div>
          <QbitButton variant="primary" icon="add" onClick={handleCreateNew}>
            Create New Product
          </QbitButton>
        </div>

        {/* ===== Top: Search + Filters + Recent ===== */}
        <SurfaceCard className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Search Product</label>
              <Input
                type="text"
                placeholder="Name, model, brand…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
              >
                <option value="">All categories</option>
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Brand</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
              >
                <option value="">All brands</option>
                {uniqueBrands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Recent products (quick-access chips) */}
          {!searchQuery && !categoryFilter && !brandFilter && recentProducts.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-qbit-outline-variant/30 pt-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Recent:</span>
              {recentProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    savedProductId === p.id
                      ? "border-qbit-primary bg-qbit-primary/10 text-qbit-primary"
                      : "border-qbit-outline-variant text-qbit-on-surface-variant hover:border-qbit-primary hover:text-qbit-primary"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Filtered list (collapsible) */}
          {(searchQuery || categoryFilter || brandFilter) && (
            <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-qbit-outline-variant">
              {productsLoading ? (
                <p className="px-3 py-4 text-center text-xs text-qbit-on-surface-variant">Loading…</p>
              ) : filteredProducts.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-qbit-on-surface-variant">No products found.</p>
              ) : (
                <ul className="divide-y divide-qbit-outline-variant/30">
                  {filteredProducts.slice(0, 50).map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                          savedProductId === p.id ? "bg-qbit-primary/10" : "hover:bg-qbit-surface-container-low"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-qbit-outline-variant bg-qbit-surface-container-low">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <Icon name="inventory_2" className="text-[18px] text-qbit-on-surface-variant" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-qbit-on-surface">{p.name}</p>
                          <p className="truncate text-[11px] text-qbit-on-surface-variant">{p.brand} · {p.model} · {p.category ?? "—"}</p>
                        </div>
                        {savedProductId === p.id && <Icon name="check_circle" className="text-[18px] text-qbit-primary" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </SurfaceCard>

        {/* ===== Section 1: Product Information ===== */}
        <SurfaceCard id="product-form-section" className="p-6 scroll-mt-24">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
              <Icon name="info" className="text-[20px] text-qbit-primary" />
              {form.id ? "Edit Product Information" : "Product Information"}
              {form.id && (
                <span className="rounded-md bg-qbit-success/15 px-2 py-0.5 text-[10px] font-semibold text-qbit-success">SAVED</span>
              )}
            </h3>
            {form.id && (
              <span className="font-mono text-[10px] text-qbit-on-surface-variant">ID: {form.id}</span>
            )}
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value, deviceType: CATEGORY_TO_DEVICE_TYPE[e.target.value] ?? form.deviceType })}
                  className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select category…</option>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Brand</label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="QBIT" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Product Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="PAT-200 Thermal Printer" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Model Number *</label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="PAT-200" required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Serial Prefix</label>
                <Input value={form.serialPattern} onChange={(e) => setForm({ ...form, serialPattern: e.target.value })} placeholder="PAT200-" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Warranty</label>
                <Input value={form.warrantyDuration} onChange={(e) => setForm({ ...form, warrantyDuration: e.target.value })} placeholder="12 months" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Product Image URL</label>
                <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                  className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Description</label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short product description…"
                />
              </div>
            </div>

            {/* Image preview */}
            {form.imageUrl && (
              <div className="flex items-center gap-3 rounded-lg border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-qbit-outline-variant bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <p className="text-[11px] text-qbit-on-surface-variant">Image preview</p>
              </div>
            )}

            {/* Save button */}
            <div className="flex justify-end gap-2 border-t border-qbit-outline-variant/30 pt-4">
              <QbitButton variant="ghost" onClick={handleCreateNew}>Reset</QbitButton>
              <QbitButton type="submit" variant="primary" icon={savingProduct ? "progress_activity" : "save"} disabled={savingProduct}>
                {savingProduct ? "Saving…" : form.id ? "Update Product" : "Save Product"}
              </QbitButton>
            </div>
          </form>
        </SurfaceCard>

        {/* ===== Section 2: Product Resources (auto-appears after save) ===== */}
        {savedProductId && (
          <div id="resources-section" className="scroll-mt-24 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-qbit-on-surface">
                <Icon name="folder_open" className="text-[22px] text-qbit-primary" />
                Product Resources
              </h3>
              <span className="rounded-md bg-qbit-primary/10 px-2.5 py-1 text-[11px] font-semibold text-qbit-primary">
                {totalResources} resource{totalResources !== 1 ? "s" : ""} uploaded
              </span>
            </div>

            {resourcesLoading ? (
              <SurfaceCard className="p-12 text-center">
                <Icon name="progress_activity" className="mx-auto animate-spin text-[40px] text-qbit-primary" />
                <p className="mt-3 text-sm text-qbit-on-surface-variant">Loading resources…</p>
              </SurfaceCard>
            ) : (
              <div className="space-y-2">
                {RESOURCE_SECTIONS.map((section) => (
                  <ResourceAccordion
                    key={section.id}
                    section={section}
                    resources={grouped[section.mediaType] ?? []}
                    isOpen={openSectionId === section.id}
                    onToggle={() => setOpenSectionId(openSectionId === section.id ? null : section.id)}
                    productId={savedProductId}
                    onResourceChanged={() => void fetchResources()}
                    onEdit={(r) => setEditingResource(r)}
                    onDelete={handleDeleteResource}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Section 3: Live Resource Summary ===== */}
        {savedProductId && (
          <LiveResourceSummary
            form={form}
            counts={counts}
            totalResources={totalResources}
            overallStatus={overallStatus}
          />
        )}

        {/* ===== Edit Resource Modal ===== */}
        {editingResource && savedProductId && (
          <EditResourceModal
            resource={editingResource}
            productId={savedProductId}
            onClose={() => setEditingResource(null)}
            onSaved={() => {
              setEditingResource(null);
              void fetchResources();
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

// ====================== Resource Accordion ======================
function ResourceAccordion({
  section,
  resources,
  isOpen,
  onToggle,
  productId,
  onResourceChanged,
  onEdit,
  onDelete,
}: {
  section: ResourceSectionConfig;
  resources: ProductMedia[];
  isOpen: boolean;
  onToggle: () => void;
  productId: string;
  onResourceChanged: () => void;
  onEdit: (r: ProductMedia) => void;
  onDelete: (r: ProductMedia) => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [useUrlMode, setUseUrlMode] = useState(false);

  function resetForm() {
    setFormData({});
    setSelectedFile(null);
    setUrlInput("");
    setUseUrlMode(false);
  }

  async function handleUpload() {
    for (const field of section.fields) {
      if (field.required && !formData[field.name]) {
        toast({ title: `${field.label} is required`, variant: "destructive" });
        return;
      }
    }

    let url = urlInput.trim();
    if (section.acceptTypes !== "url" && !useUrlMode) {
      if (!selectedFile) {
        toast({ title: "Please select a file to upload", variant: "destructive" });
        return;
      }
      url = `https://qbithub.vercel.app/uploads/${section.mediaType}/${productId}/${encodeURIComponent(selectedFile.name)}`;
    }
    if (!url) {
      toast({ title: "URL is required", variant: "destructive" });
      return;
    }

    const titleField = section.fields.find((f) => f.required) ?? section.fields[0];
    const title = formData[titleField.name] || selectedFile?.name || url;

    setUploading(true);
    try {
      const meta: Record<string, string> = {};
      for (const field of section.fields) {
        if (formData[field.name]) meta[field.name] = formData[field.name];
      }
      meta["uploadedFileName"] = selectedFile?.name ?? "";

      const res = await fetch(`/api/admin/products/${productId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: section.mediaType,
          title,
          url,
          mimeType: selectedFile?.type ?? (section.acceptTypes === "url" ? "video/external" : null),
          fileSize: selectedFile?.size ?? null,
          visibility: "public",
          meta,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }
      toast({ title: "Resource added!", description: `${section.title}: ${title}` });
      resetForm();
      onResourceChanged();
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <SurfaceCard className="overflow-hidden">
      {/* Accordion header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-qbit-surface-container-low/50"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${section.color}`}>
            <Icon name={section.icon} className="text-[20px]" />
          </div>
          <div>
            <p className="text-sm font-bold text-qbit-on-surface">{section.title}</p>
            <p className="text-[11px] text-qbit-on-surface-variant">
              {resources.length > 0
                ? `${resources.length} resource${resources.length !== 1 ? "s" : ""} uploaded`
                : "No resources yet — click to add"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {resources.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-qbit-primary/10 px-2 py-0.5 text-[11px] font-bold text-qbit-primary">
              {resources.length}
            </span>
          )}
          <Icon name={isOpen ? "expand_less" : "expand_more"} className="text-[20px] text-qbit-on-surface-variant" />
        </div>
      </button>

      {/* Accordion body */}
      {isOpen && (
        <div className="border-t border-qbit-outline-variant/30">
          {/* Existing resources list */}
          {resources.length > 0 && (
            <div className="bg-qbit-surface-container-low/30 px-5 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                Existing ({resources.length})
              </p>
              <ul className="space-y-1.5">
                {resources.map((r) => {
                  const meta = parseMeta(r.altText);
                  return (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 rounded-lg border border-qbit-outline-variant/50 bg-white p-2.5"
                    >
                      <Icon name={iconForType(r.type)} className="text-[18px] text-qbit-on-surface-variant shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-qbit-on-surface">{r.title}</p>
                        <p className="truncate text-[10px] text-qbit-on-surface-variant">
                          {meta.version ? `v${meta.version} · ` : ""}
                          {meta.supportedOS || meta.manualType || meta.viewType || meta.category || ""}
                          {meta.language ? ` · ${meta.language}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => window.open(r.url, "_blank", "noopener,noreferrer")}
                          className="rounded p-1.5 text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
                          title="Download / Test"
                        >
                          <Icon name="download" className="text-[16px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(r)}
                          className="rounded p-1.5 text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
                          title="Edit"
                        >
                          <Icon name="edit" className="text-[16px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(r)}
                          className="rounded p-1.5 text-qbit-error hover:bg-qbit-error/10"
                          title="Delete"
                        >
                          <Icon name="delete" className="text-[16px]" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Upload form */}
          <div className="px-5 py-4">
            {/* URL mode toggle */}
            {section.allowUrl && section.acceptTypes !== "url" && (
              <div className="mb-3 flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={useUrlMode}
                    onChange={(e) => setUseUrlMode(e.target.checked)}
                    className="h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary"
                  />
                  <span className="font-medium text-qbit-on-surface-variant">Use URL instead of file upload</span>
                </label>
              </div>
            )}

            {section.acceptTypes === "url" || useUrlMode ? (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">URL</label>
                <Input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://…" />
              </div>
            ) : (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  File ({section.acceptTypes})
                </label>
                <div className="rounded-lg border border-dashed border-qbit-outline-variant bg-qbit-surface-container-low/30 p-3">
                  <input
                    type="file"
                    accept={section.acceptTypes}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-xs text-qbit-on-surface-variant file:mr-3 file:rounded-md file:border-0 file:bg-qbit-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-qbit-on-primary hover:file:bg-qbit-primary-container"
                  />
                  {selectedFile && (
                    <p className="mt-1.5 text-[11px] text-qbit-on-surface-variant">
                      <Icon name="attach_file" className="text-[14px] inline" /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                    {field.label}{field.required && <span className="text-qbit-error"> *</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea
                      rows={2}
                      value={formData[field.name] ?? ""}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={formData[field.name] ?? ""}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select…</option>
                      {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <Input
                      type={field.type ?? "text"}
                      value={formData[field.name] ?? ""}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <QbitButton
                variant="primary"
                size="sm"
                icon={uploading ? "progress_activity" : "upload"}
                disabled={uploading}
                onClick={handleUpload}
              >
                {uploading ? "Uploading…" : "Upload Resource"}
              </QbitButton>
            </div>
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}

// ====================== Live Resource Summary ======================
function LiveResourceSummary({
  form,
  counts,
  totalResources,
  overallStatus,
}: {
  form: ProductFormState;
  counts: Record<string, number>;
  totalResources: number;
  overallStatus: string;
}) {
  const sections = [
    { type: "windows_driver", label: "Windows Drivers", icon: "memory" },
    { type: "windows_software", label: "Windows Software", icon: "apps" },
    { type: "android_software", label: "Android Apps", icon: "phone_android" },
    { type: "firmware", label: "Firmware", icon: "upgrade" },
    { type: "manual", label: "Manuals", icon: "menu_book" },
    { type: "video", label: "Videos", icon: "videocam" },
    { type: "gallery_image", label: "Images", icon: "photo_library" },
  ];

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="border-b border-qbit-outline-variant/50 bg-gradient-to-r from-qbit-primary/10 to-transparent px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon name="preview" className="text-[20px] text-qbit-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">Live Resource Summary</h3>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            overallStatus === "Complete" ? "bg-qbit-success text-white" : "bg-qbit-warning text-white"
          }`}>
            {overallStatus}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Product card */}
        <div className="mb-4 flex items-center gap-4 rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-qbit-outline-variant bg-white">
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt={form.name} className="h-full w-full object-cover" />
            ) : (
              <Icon name="inventory_2" className="text-[32px] text-qbit-on-surface-variant" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-qbit-primary">{form.brand}</p>
            <h4 className="truncate text-base font-bold text-qbit-on-surface">{form.name || "Untitled Product"}</h4>
            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-qbit-on-surface-variant sm:grid-cols-4">
              <p>Category: <span className="font-medium text-qbit-on-surface">{form.category || "—"}</span></p>
              <p>Model: <span className="font-mono font-medium text-qbit-on-surface">{form.model || "—"}</span></p>
              <p>Serial: <span className="font-mono font-medium text-qbit-on-surface">{form.serialPattern || "—"}</span></p>
              <p>Warranty: <span className="font-medium text-qbit-on-surface">{form.warrantyDuration || "—"}</span></p>
            </div>
          </div>
        </div>

        {/* Resource counts */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {sections.map((section) => {
            const count = counts[section.type] ?? 0;
            return (
              <div
                key={section.type}
                className={`rounded-xl border p-3 text-center ${
                  count > 0
                    ? "border-qbit-success/30 bg-qbit-success/5"
                    : "border-qbit-outline-variant/50 bg-qbit-surface-container-low/30"
                }`}
              >
                <Icon
                  name={section.icon}
                  className={`mx-auto text-[20px] ${count > 0 ? "text-qbit-success" : "text-qbit-on-surface-variant/40"}`}
                />
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  {section.label}
                </p>
                <p className={`text-lg font-bold ${count > 0 ? "text-qbit-success" : "text-qbit-on-surface-variant"}`}>
                  {count}
                </p>
              </div>
            );
          })}
        </div>

        {/* Overall status footer */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-3">
          <div className="flex items-center gap-2">
            <Icon
              name={overallStatus === "Complete" ? "check_circle" : "pending"}
              className={`text-[20px] ${overallStatus === "Complete" ? "text-qbit-success" : "text-qbit-warning"}`}
            />
            <p className="text-xs font-semibold text-qbit-on-surface">
              {totalResources > 0
                ? `${totalResources} resource${totalResources !== 1 ? "s" : ""} linked`
                : "No resources linked yet — upload via accordion cards above"}
            </p>
          </div>
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            overallStatus === "Complete" ? "bg-qbit-success/15 text-qbit-success" : "bg-qbit-warning/15 text-qbit-warning"
          }`}>
            {overallStatus}
          </span>
        </div>
      </div>
    </SurfaceCard>
  );
}

// ====================== Edit Resource Modal ======================
function EditResourceModal({
  resource,
  productId,
  onClose,
  onSaved,
}: {
  resource: ProductMedia;
  productId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(resource.title);
  const [url, setUrl] = useState(resource.url);
  const [visibility, setVisibility] = useState(resource.visibility);
  const [meta, setMeta] = useState<Record<string, string>>(parseMeta(resource.altText));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim() || !url.trim()) {
      toast({ title: "Title and URL are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/resources/${resource.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url, visibility, meta }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Resource updated" });
      onSaved();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-qbit-outline-variant px-5 py-4">
          <h3 className="text-base font-bold text-qbit-on-surface">Edit Resource</h3>
          <p className="text-[11px] text-qbit-on-surface-variant">Type: {prettyType(resource.type)}</p>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">URL</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
            <button
              type="button"
              onClick={() => {
                const newUrl = prompt("Enter new file URL:", url);
                if (newUrl) setUrl(newUrl);
              }}
              className="mt-1 text-[11px] font-semibold text-qbit-primary hover:underline"
            >
              Replace File
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
            >
              <option value="public">Public (everyone)</option>
              <option value="employee">Employee only</option>
              <option value="engineer">Engineer + Admin</option>
              <option value="admin">Admin only</option>
            </select>
          </div>
          {Object.keys(meta).length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Metadata</p>
              <div className="rounded-lg border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-2">
                {Object.entries(meta).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 text-[11px]">
                    <span className="font-medium text-qbit-on-surface-variant">{k}:</span>
                    <span className="text-qbit-on-surface">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              className="inline-flex items-center gap-1 rounded-lg border border-qbit-outline-variant px-3 py-1.5 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low"
            >
              <Icon name="download" className="text-[14px]" /> Download Test
            </button>
            {resource.mimeType?.includes("image") && (
              <button
                type="button"
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                className="inline-flex items-center gap-1 rounded-lg border border-qbit-outline-variant px-3 py-1.5 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low"
              >
                <Icon name="image" className="text-[14px]" /> Preview
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-qbit-outline-variant px-5 py-4">
          <QbitButton variant="ghost" size="sm" onClick={onClose}>Cancel</QbitButton>
          <QbitButton variant="primary" size="sm" icon={saving ? "progress_activity" : "check"} disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Changes"}
          </QbitButton>
        </div>
      </div>
    </div>
  );
}

// ====================== Helpers ======================
function iconForType(type: string): string {
  const map: Record<string, string> = {
    windows_driver: "memory",
    windows_software: "apps",
    android_software: "phone_android",
    firmware: "upgrade",
    manual: "menu_book",
    troubleshooting: "build",
    video: "videocam",
    gallery_image: "photo_library",
    image: "photo_library",
    brochure: "picture_as_pdf",
    datasheet: "article",
    warranty: "verified_user",
    sdk: "code",
    utility: "build",
    driver: "memory",
    other: "attach_file",
  };
  return map[type] ?? "attach_file";
}

function prettyType(type: string): string {
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function parseMeta(altText: string | null): Record<string, string> {
  if (!altText) return {};
  try {
    const parsed = JSON.parse(altText);
    if (parsed && typeof parsed === "object" && parsed.meta) {
      return parsed.meta as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}
