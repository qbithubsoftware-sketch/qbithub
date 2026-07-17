"use client";

/**
 * ProductResourceUploadCenter — V4 Product Resource Management System.
 *
 * Replaces the old single-purpose Upload Master (which only had Driver
 * Upload) with a complete 9-card resource management UI.
 *
 * CARDS:
 *   1. Windows Drivers       — upload .zip/.exe/.msi, version, supported Windows, release notes
 *   2. Windows Software      — upload EXE/MSI/ZIP, version, description, release date
 *   3. Android Software      — upload APK/ZIP or Play Store link, version, min Android, description
 *   4. Firmware Files        — upload BIN/HEX, version, compatible models, release notes
 *   5. User Manuals          — upload PDF/DOC, name, language (User Manual, Quick Start, etc.)
 *   6. Troubleshooting Docs  — upload PDF/ZIP/Excel (Common Error Guide, Error Code List, etc.)
 *   7. Installation Videos   — upload video or paste YouTube URL, title, thumbnail, duration, category
 *   8. Product Gallery       — upload images (Front, Back, Side, Ports, Inside, Packaging)
 *   9. Resource Summary      — live preview of product card + all linked resources + counters
 *
 * ADMIN FEATURES (per resource):
 *   - Search Resources
 *   - Edit Resource
 *   - Replace File
 *   - Delete File
 *   - Download Test
 *   - Preview PDF / Image / Video
 *
 * API:
 *   - GET    /api/admin/products/[id]/resources — list all
 *   - POST   /api/admin/products/[id]/resources — create
 *   - PUT    /api/admin/products/[id]/resources/[resourceId] — update
 *   - DELETE /api/admin/products/[id]/resources/[resourceId] — delete
 *
 * Used by /portal admin sidebar → "Upload Master" (any upload-* screen).
 * Reads the current screen ID to pre-select the product category.
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
interface ProductOption {
  id: string;
  name: string;
  brand: string;
  model: string;
  slug: string;
  category: string | null;
  imageUrl: string | null;
  sku: string | null;
  serialPattern: string | null;
  warrantyDuration: string | null;
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

interface ResourceGroup {
  [type: string]: ProductMedia[];
}

interface ResourcesResponse {
  product: ProductOption;
  resources: ProductMedia[];
  grouped: ResourceGroup;
  counters: Record<string, number>;
  total: number;
}

// ====================== Card Config ======================
interface CardConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  mediaType: string;
  acceptTypes: string; // ".zip,.exe" | "url" | "image/*"
  allowUrl?: boolean;
  fields: Array<{
    name: string;
    label: string;
    required?: boolean;
    type?: "text" | "number" | "date" | "textarea" | "select";
    options?: string[];
    placeholder?: string;
  }>;
}

const RESOURCE_CARDS: CardConfig[] = [
  {
    id: "windows_drivers",
    title: "Windows Drivers",
    subtitle: "Upload Windows drivers (.zip, .exe, .msi)",
    icon: "memory",
    color: "bg-qbit-primary/10 text-qbit-primary",
    mediaType: "windows_driver",
    acceptTypes: ".zip,.exe,.msi,.inf",
    fields: [
      { name: "driverName", label: "Driver Name", required: true, placeholder: "Windows 11 Driver" },
      { name: "version", label: "Driver Version", required: true, placeholder: "v2.4.1" },
      {
        name: "supportedWindows",
        label: "Supported Windows",
        type: "select",
        options: ["Windows 11", "Windows 10", "Windows 8", "Windows 7", "Windows 11 + 10", "All Windows"],
      },
      { name: "releaseNotes", label: "Release Notes", type: "textarea", placeholder: "What changed in this version?" },
    ],
  },
  {
    id: "windows_software",
    title: "Windows Software",
    subtitle: "Upload Windows utilities and tools (EXE, MSI, ZIP)",
    icon: "apps",
    color: "bg-qbit-secondary/10 text-qbit-secondary",
    mediaType: "windows_software",
    acceptTypes: ".exe,.msi,.zip",
    fields: [
      { name: "softwareName", label: "Software Name", required: true, placeholder: "POS Utility" },
      { name: "version", label: "Version", required: true, placeholder: "v1.0.0" },
      { name: "releaseDate", label: "Release Date", type: "date" },
      { name: "description", label: "Description", type: "textarea", placeholder: "What does this software do?" },
    ],
  },
  {
    id: "android_software",
    title: "Android Software",
    subtitle: "Upload Android apps (APK, ZIP) or Play Store link",
    icon: "phone_android",
    color: "bg-qbit-tertiary/10 text-qbit-tertiary",
    mediaType: "android_software",
    acceptTypes: ".apk,.zip",
    allowUrl: true,
    fields: [
      { name: "appName", label: "App Name", required: true, placeholder: "Barcode Scanner App" },
      { name: "version", label: "Version", required: true, placeholder: "v1.2.0" },
      { name: "minAndroidVersion", label: "Minimum Android Version", placeholder: "Android 8.0 (Oreo)" },
      { name: "playStoreLink", label: "Play Store Link (optional)", placeholder: "https://play.google.com/store/apps/..." },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    id: "firmware",
    title: "Firmware Files",
    subtitle: "Upload firmware binaries (.bin, .hex)",
    icon: "upgrade",
    color: "bg-qbit-warning/15 text-qbit-warning",
    mediaType: "firmware",
    acceptTypes: ".bin,.hex,.img",
    fields: [
      { name: "firmwareName", label: "Firmware Name", required: true, placeholder: "P80UE Firmware v1.8.0" },
      { name: "version", label: "Firmware Version", required: true, placeholder: "v1.8.0" },
      { name: "compatibleModels", label: "Compatible Models", placeholder: "P80UE, P80 Beta, P80 Alpha" },
      { name: "releaseNotes", label: "Release Notes", type: "textarea" },
    ],
  },
  {
    id: "manuals",
    title: "User Manuals",
    subtitle: "Upload manuals (PDF, DOC)",
    icon: "menu_book",
    color: "bg-qbit-tertiary/10 text-qbit-tertiary",
    mediaType: "manual",
    acceptTypes: ".pdf,.doc,.docx",
    fields: [
      { name: "manualName", label: "Manual Name", required: true, placeholder: "User Manual" },
      {
        name: "manualType",
        label: "Manual Type",
        type: "select",
        options: ["User Manual", "Quick Start Guide", "Installation Guide", "Warranty Guide", "Maintenance Guide", "Cleaning Guide"],
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
    id: "troubleshooting",
    title: "Troubleshooting Documents",
    subtitle: "Upload troubleshooting PDFs, ZIPs, Excel sheets",
    icon: "build",
    color: "bg-qbit-error/10 text-qbit-error",
    mediaType: "troubleshooting",
    acceptTypes: ".pdf,.zip,.xlsx,.xls,.csv",
    fields: [
      { name: "docName", label: "Document Name", required: true, placeholder: "Common Error Guide" },
      {
        name: "docType",
        label: "Document Type",
        type: "select",
        options: ["Common Error Guide", "Error Code List", "Repair Guide", "FAQ", "Service Manual"],
      },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    id: "videos",
    title: "Installation Videos",
    subtitle: "Upload video or paste YouTube URL",
    icon: "videocam",
    color: "bg-qbit-error/10 text-qbit-error",
    mediaType: "video",
    acceptTypes: "url",
    allowUrl: true,
    fields: [
      { name: "videoTitle", label: "Video Title", required: true, placeholder: "P80UE Installation Walkthrough" },
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
    subtitle: "Upload product images (Front, Back, Side, Ports, Inside, Packaging)",
    icon: "photo_library",
    color: "bg-qbit-primary/10 text-qbit-primary",
    mediaType: "gallery_image",
    acceptTypes: "image/*",
    fields: [
      { name: "imageName", label: "Image Name", required: true, placeholder: "Front View" },
      {
        name: "viewType",
        label: "View Type",
        type: "select",
        options: ["Front", "Back", "Side", "Ports", "Inside View", "Packaging", "Other"],
      },
      { name: "altText", label: "Alt Text (for accessibility)", placeholder: "P80UE front view showing control panel" },
    ],
  },
];

// ====================== Component ======================
export function ProductResourceUploadCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentScreen = useNavigation((s) => s.current);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Resources for the selected product
  const [resources, setResources] = useState<ProductMedia[]>([]);
  const [grouped, setGrouped] = useState<ResourceGroup>({});
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);

  // Per-card open forms (track which card has its upload form expanded)
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  // Edit modal state
  const [editingResource, setEditingResource] = useState<ProductMedia | null>(null);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // ===== Fetch products =====
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/admin/products?limit=500", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const items: ProductOption[] = (data.items ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        brand: p.brand as string,
        model: p.model as string,
        slug: p.slug as string,
        category: (p.category as string | null) ?? null,
        imageUrl: (p.imageUrl as string | null) ?? null,
        sku: (p.sku as string | null) ?? null,
        serialPattern: (p.serialPattern as string | null) ?? null,
        warrantyDuration: (p.warrantyDuration as string | null) ?? null,
      }));
      setProducts(items);

      // Auto-select first product if none selected
      if (items.length > 0 && !selectedProductId) {
        setSelectedProductId(items[0].id);
      }
    } catch {
      toast({ title: "Failed to load products", variant: "destructive" });
    } finally {
      setProductsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // ===== Fetch resources for selected product =====
  const fetchResources = useCallback(async () => {
    if (!selectedProductId) return;
    setResourcesLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${selectedProductId}/resources`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data: ResourcesResponse = await res.json();
      setResources(data.resources);
      setGrouped(data.grouped ?? {});
      setCounters(data.counters ?? {});
      setSelectedProduct(data.product);
    } catch {
      toast({ title: "Failed to load resources", variant: "destructive" });
      setResources([]);
      setGrouped({});
      setCounters({});
    } finally {
      setResourcesLoading(false);
    }
  }, [selectedProductId, toast]);

  useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  // Filtered products by search query
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Product Resource Center", icon: "folder_open" }}
      navItems={ADMIN_NAV}
      activeScreen={currentScreen}
      user={{ name: userName, role: "Administrator", initials }}
      topBar={{ searchPlaceholder: "Search resources…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-qbit-on-surface">
              <Icon name="folder_open" className="text-[28px] text-qbit-primary" />
              Product Resource Upload Center
            </h2>
            <p className="mt-1 text-sm text-qbit-on-surface-variant">
              Manage all product resources in one place — drivers, software, Android apps, firmware, manuals, videos, gallery, and more.
            </p>
          </div>
          {/* Resource counters badges */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            {Object.entries(counters).filter(([, n]) => n > 0).map(([type, n]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-full bg-qbit-primary/10 px-2.5 py-1 text-[11px] font-semibold text-qbit-primary"
              >
                <Icon name={iconForType(type)} className="text-[14px]" />
                {prettyType(type)}: {n}
              </span>
            ))}
          </div>
        </div>

        {/* ===== Step 1: Select Product ===== */}
        <SurfaceCard className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="inventory_2" className="text-[20px] text-qbit-primary" />
            Select Product
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search + select */}
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Search products by name, model, brand…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
              {productsLoading ? (
                <p className="text-xs text-qbit-on-surface-variant">Loading products…</p>
              ) : (
                <div className="max-h-60 overflow-y-auto rounded-lg border border-qbit-outline-variant">
                  {filteredProducts.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-qbit-on-surface-variant">No products found.</p>
                  ) : (
                    <ul className="divide-y divide-qbit-outline-variant/30">
                      {filteredProducts.slice(0, 100).map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedProductId(p.id)}
                            className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                              selectedProductId === p.id
                                ? "bg-qbit-primary/10"
                                : "hover:bg-qbit-surface-container-low"
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
                              <p className="truncate text-[11px] text-qbit-on-surface-variant">
                                {p.brand} · {p.model} · {p.category ?? "—"}
                              </p>
                            </div>
                            {selectedProductId === p.id && (
                              <Icon name="check_circle" className="text-[18px] text-qbit-primary" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Product preview */}
            {selectedProduct && (
              <div className="rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  Selected Product
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-qbit-outline-variant bg-white">
                    {selectedProduct.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-full w-full object-cover" />
                    ) : (
                      <Icon name="inventory_2" className="text-[24px] text-qbit-on-surface-variant" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-qbit-on-surface">{selectedProduct.name}</p>
                    <p className="text-[11px] text-qbit-on-surface-variant">
                      Model: <span className="font-mono">{selectedProduct.model}</span>
                    </p>
                    <p className="text-[11px] text-qbit-on-surface-variant">
                      Category: {selectedProduct.category ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <p className="text-qbit-on-surface-variant">SKU</p>
                    <p className="font-mono font-medium text-qbit-on-surface">{selectedProduct.sku ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-qbit-on-surface-variant">Warranty</p>
                    <p className="font-medium text-qbit-on-surface">{selectedProduct.warrantyDuration ?? "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SurfaceCard>

        {/* ===== 9 Resource Cards ===== */}
        {!selectedProductId ? (
          <SurfaceCard className="p-12 text-center">
            <Icon name="arrow_upward" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
            <p className="mt-3 text-sm font-medium text-qbit-on-surface">Select a product above to manage its resources.</p>
          </SurfaceCard>
        ) : resourcesLoading ? (
          <SurfaceCard className="p-12 text-center">
            <Icon name="progress_activity" className="mx-auto animate-spin text-[40px] text-qbit-primary" />
            <p className="mt-3 text-sm text-qbit-on-surface-variant">Loading resources…</p>
          </SurfaceCard>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {RESOURCE_CARDS.map((card) => (
                <ResourceCard
                  key={card.id}
                  card={card}
                  resources={grouped[card.mediaType] ?? []}
                  isOpen={openCardId === card.id}
                  onToggle={() => setOpenCardId(openCardId === card.id ? null : card.id)}
                  productId={selectedProductId}
                  onResourceCreated={() => void fetchResources()}
                  onEdit={(r) => setEditingResource(r)}
                  onDelete={async (r) => {
                    if (!confirm(`Delete "${r.title}"?`)) return;
                    try {
                      const res = await fetch(`/api/admin/products/${selectedProductId}/resources/${r.id}`, { method: "DELETE" });
                      if (!res.ok) throw new Error("Failed");
                      toast({ title: "Resource deleted" });
                      void fetchResources();
                    } catch {
                      toast({ title: "Delete failed", variant: "destructive" });
                    }
                  }}
                />
              ))}
            </div>

            {/* ===== Resource Summary (Card 9) ===== */}
            <ResourceSummary
              product={selectedProduct}
              grouped={grouped}
              counters={counters}
              total={resources.length}
            />
          </>
        )}

        {/* ===== Edit Resource Modal ===== */}
        {editingResource && selectedProductId && (
          <EditResourceModal
            resource={editingResource}
            productId={selectedProductId}
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

// ====================== Resource Card ======================
function ResourceCard({
  card,
  resources,
  isOpen,
  onToggle,
  productId,
  onResourceCreated,
  onEdit,
  onDelete,
}: {
  card: CardConfig;
  resources: ProductMedia[];
  isOpen: boolean;
  onToggle: () => void;
  productId: string;
  onResourceCreated: () => void;
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
    // Validate required fields
    for (const field of card.fields) {
      if (field.required && !formData[field.name]) {
        toast({ title: `${field.label} is required`, variant: "destructive" });
        return;
      }
    }

    let url = urlInput.trim();
    if (card.acceptTypes !== "url" && !useUrlMode) {
      if (!selectedFile) {
        toast({ title: "Please select a file to upload", variant: "destructive" });
        return;
      }
      // In production, this would upload to cloud storage (S3/Vercel Blob)
      // and return a URL. For demo, we generate a placeholder URL.
      url = `https://qbithub.vercel.app/uploads/${card.mediaType}/${productId}/${encodeURIComponent(selectedFile.name)}`;
    }

    if (!url) {
      toast({ title: "URL is required", variant: "destructive" });
      return;
    }

    // Determine title from form (driverName, softwareName, appName, etc.)
    const titleField = card.fields.find((f) => f.required) ?? card.fields[0];
    const title = formData[titleField.name] || selectedFile?.name || url;

    setUploading(true);
    try {
      // Build meta object from form fields
      const meta: Record<string, string> = {};
      for (const field of card.fields) {
        if (formData[field.name]) meta[field.name] = formData[field.name];
      }
      meta["uploadedFileName"] = selectedFile?.name ?? "";

      const res = await fetch(`/api/admin/products/${productId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: card.mediaType,
          title,
          url,
          mimeType: selectedFile?.type ?? (card.acceptTypes === "url" ? "video/external" : null),
          fileSize: selectedFile?.size ?? null,
          visibility: "public",
          meta,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }

      toast({ title: "Resource added!", description: `${card.title}: ${title}` });
      resetForm();
      onResourceCreated();
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
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-qbit-outline-variant/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
            <Icon name={card.icon} className="text-[20px]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-qbit-on-surface">{card.title}</h3>
            <p className="text-[11px] text-qbit-on-surface-variant">{card.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {resources.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-qbit-primary/10 px-2 py-0.5 text-[11px] font-bold text-qbit-primary">
              {resources.length}
            </span>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 rounded-lg border border-qbit-outline-variant px-3 py-1.5 text-xs font-semibold text-qbit-on-surface hover:bg-qbit-surface-container-low transition-colors"
          >
            <Icon name={isOpen ? "expand_less" : "add"} className="text-[16px]" />
            {isOpen ? "Close" : "Add"}
          </button>
        </div>
      </div>

      {/* Existing resources list */}
      {resources.length > 0 && (
        <div className="border-b border-qbit-outline-variant/30 bg-qbit-surface-container-low/30 px-5 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
            Existing Resources ({resources.length})
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
                      {meta.supportedWindows || meta.manualType || meta.docType || meta.viewType || meta.category || ""}
                      {meta.language ? ` · ${meta.language}` : ""}
                      {r.mimeType ? ` · ${r.mimeType}` : ""}
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

      {/* Upload form (collapsible) */}
      {isOpen && (
        <div className="px-5 py-4">
          {/* URL mode toggle (for cards that allow URL input) */}
          {card.allowUrl && card.acceptTypes !== "url" && (
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

          {/* File input OR URL input */}
          {card.acceptTypes === "url" || useUrlMode ? (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                URL
              </label>
              <Input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
              />
            </div>
          ) : (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                File ({card.acceptTypes})
              </label>
              <div className="rounded-lg border border-dashed border-qbit-outline-variant bg-qbit-surface-container-low/30 p-4">
                <input
                  type="file"
                  accept={card.acceptTypes}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-qbit-on-surface-variant file:mr-3 file:rounded-md file:border-0 file:bg-qbit-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-qbit-on-primary hover:file:bg-qbit-primary-container"
                />
                {selectedFile && (
                  <p className="mt-2 text-[11px] text-qbit-on-surface-variant">
                    <Icon name="attach_file" className="text-[14px] inline" /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Dynamic fields */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {card.fields.map((field) => (
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
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
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

          {/* Upload button */}
          <div className="mt-4 flex justify-end gap-2">
            <QbitButton variant="ghost" size="sm" onClick={() => { resetForm(); onToggle(); }}>
              Cancel
            </QbitButton>
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
      )}
    </SurfaceCard>
  );
}

// ====================== Resource Summary (Card 9) ======================
function ResourceSummary({
  product,
  grouped,
  counters,
  total,
}: {
  product: ProductOption | null;
  grouped: ResourceGroup;
  counters: Record<string, number>;
  total: number;
}) {
  if (!product) return null;

  const summarySections = [
    { type: "windows_driver", label: "Windows Drivers", icon: "memory" },
    { type: "windows_software", label: "Windows Software", icon: "apps" },
    { type: "android_software", label: "Android Software", icon: "phone_android" },
    { type: "firmware", label: "Firmware", icon: "upgrade" },
    { type: "manual", label: "Manuals", icon: "menu_book" },
    { type: "troubleshooting", label: "Troubleshooting", icon: "build" },
    { type: "video", label: "Videos", icon: "videocam" },
    { type: "gallery_image", label: "Gallery Images", icon: "photo_library" },
  ];

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="border-b border-qbit-outline-variant/50 bg-gradient-to-r from-qbit-primary/10 to-transparent px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon name="preview" className="text-[20px] text-qbit-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">Resource Summary</h3>
          <span className="ml-auto rounded-full bg-qbit-primary px-2.5 py-0.5 text-[11px] font-bold text-qbit-on-primary">
            {total} Total
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Product preview card */}
        <div className="mb-5 flex items-center gap-4 rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-low p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-qbit-outline-variant bg-white">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Icon name="inventory_2" className="text-[32px] text-qbit-on-surface-variant" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-qbit-primary">{product.brand}</p>
            <h4 className="truncate text-base font-bold text-qbit-on-surface">{product.name}</h4>
            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-qbit-on-surface-variant sm:grid-cols-4">
              <p>Category: <span className="font-medium text-qbit-on-surface">{product.category ?? "—"}</span></p>
              <p>Model: <span className="font-mono font-medium text-qbit-on-surface">{product.model}</span></p>
              <p>SKU: <span className="font-mono font-medium text-qbit-on-surface">{product.sku ?? "—"}</span></p>
              <p>Warranty: <span className="font-medium text-qbit-on-surface">{product.warrantyDuration ?? "—"}</span></p>
            </div>
          </div>
        </div>

        {/* Linked resources by type */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {summarySections.map((section) => {
            const items = grouped[section.type] ?? [];
            return (
              <div
                key={section.type}
                className={`rounded-xl border p-3 ${
                  items.length > 0
                    ? "border-qbit-primary/30 bg-qbit-primary/5"
                    : "border-qbit-outline-variant/50 bg-qbit-surface-container-low/30"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name={section.icon} className="text-[18px] text-qbit-primary" />
                    <p className="text-xs font-bold text-qbit-on-surface">{section.label}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    items.length > 0 ? "bg-qbit-primary text-qbit-on-primary" : "bg-qbit-surface-container-high text-qbit-on-surface-variant"
                  }`}>
                    {items.length}
                  </span>
                </div>
                {items.length > 0 ? (
                  <ul className="space-y-1">
                    {items.map((r) => {
                      const meta = parseMeta(r.altText);
                      return (
                        <li key={r.id} className="flex items-start gap-1.5 text-[11px]">
                          <Icon name="check_circle" className="text-[12px] text-qbit-success mt-0.5 shrink-0" />
                          <span className="text-qbit-on-surface-variant">
                            {r.title}
                            {meta.version && <span className="text-qbit-on-surface-variant/70"> · v{meta.version}</span>}
                            {meta.language && <span className="text-qbit-on-surface-variant/70"> · {meta.language}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[10px] italic text-qbit-on-surface-variant/60">No {section.label.toLowerCase()} uploaded yet.</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {total === 0 && (
          <div className="mt-5 rounded-xl border border-dashed border-qbit-outline-variant p-6 text-center">
            <Icon name="info" className="mx-auto text-[28px] text-qbit-on-surface-variant/40" />
            <p className="mt-2 text-sm font-medium text-qbit-on-surface">No resources uploaded yet for this product.</p>
            <p className="mt-1 text-xs text-qbit-on-surface-variant">
              Use the cards above to add drivers, software, manuals, videos, and more.
            </p>
          </div>
        )}
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

  async function handleReplaceFile() {
    // In production, this would open a file picker, upload to cloud storage,
    // and update the resource URL. For demo, prompt for new URL.
    const newUrl = prompt("Enter new file URL:", url);
    if (newUrl && newUrl !== url) {
      setUrl(newUrl);
      toast({ title: "File URL updated (click Save to commit)" });
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
              onClick={handleReplaceFile}
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

          {/* Meta fields (read-only display) */}
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

          {/* Preview */}
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
                <Icon name="image" className="text-[14px]" /> Preview Image
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
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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
