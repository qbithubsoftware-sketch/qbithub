"use client";

/**
 * ProductMasterPage — Enterprise Product Information Management (PIM).
 *
 * Reuses the EXACT same UI pattern as ProductManagementPage:
 *   - AppShell (admin variant) with ADMIN_NAV
 *   - KpiCard stats row
 *   - SurfaceCard with search + filter + Export CSV
 *   - Table with product rows
 *   - Dialog for create/edit
 *   - ProductEditDrawer for full-detail editing
 *
 * Differences from ProductManagementPage:
 *   - This is the PIM (Product Master) — no customer/installation/warranty fields
 *   - Model Number is the unique key (duplicate detection)
 *   - Additional PIM sections: pricing, SEO, specs builder, related products,
 *     documents, QR/barcode, share center, AI content, analytics, activity
 *   - Bulk operations: import/export CSV, bulk delete, soft delete + restore
 *
 * Visible ONLY to super_administrator + administrator.
 */

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { KpiCard } from "@/components/qbit/primitives/KpiCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductEditDrawer } from "@/components/qbit/admin/ProductEditDrawer";

interface Product {
  id: string;
  name: string;
  brand: string;
  manufacturer: string | null;
  model: string;
  slug?: string;
  category?: string | null;
  deviceType: string;
  description: string | null;
  imageUrl?: string | null;
  status?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isDraft?: boolean;
  isPublished?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  startingPrice?: string | null;
  badgeLabel?: string | null;
  driverDownloadUrl: string | null;
  manualUrl: string | null;
  installationGuideUrl: string | null;
  knowledgeBaseUrl: string | null;
  brochureUrl?: string | null;
  datasheetUrl?: string | null;
  warrantyUrl?: string | null;
  sdkUrl?: string | null;
  utilityUrl?: string | null;
  qrCodeUrl?: string | null;
  viewCount?: number;
  downloadCount?: number;
  driverDownloadCount?: number;
  manualDownloadCount?: number;
  qrScanCount?: number;
  shareCount?: number;
  latestDriverVersion?: string | null;
  latestFirmwareVersion?: string | null;
  lastUpdated?: string | null;
  isActive: boolean;
  signatureCount: number;
  createdAt: string;
  updatedAt: string;
}

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

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "success" },
  { value: "draft", label: "Draft", color: "neutral" },
  { value: "deprecated", label: "Deprecated", color: "warning" },
  { value: "discontinued", label: "Discontinued", color: "error" },
  { value: "coming_soon", label: "Coming Soon", color: "info" },
];

export function ProductMasterPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showInactive, setShowInactive] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "draft" | "published">("all");

  // Dialog state
  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [drawerProductId, setDrawerProductId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "", brand: "QBIT", manufacturer: "", model: "", deviceType: "thermal_printer",
    description: "", longDescription: "", subCategory: "", productSeries: "", productType: "",
    highlights: "",
    driverDownloadUrl: "", manualUrl: "", installationGuideUrl: "", knowledgeBaseUrl: "",
    brochureUrl: "", datasheetUrl: "", warrantyUrl: "", sdkUrl: "", utilityUrl: "",
    installationInstructions: "", requiredSoftware: "", requiredDrivers: "", requiredAccessories: "",
    installationTime: "", difficultyLevel: "",
    canonicalUrl: "", openGraphImage: "", twitterCard: "",
    seoTitle: "", seoDescription: "", seoKeywords: "",
    purchasePrice: "", dealerPrice: "", distributorPrice: "", mrp: "", sellingPrice: "",
    gstRate: "", hsnCode: "", warrantyDuration: "",
    upgradedModel: "", previousModel: "",
    isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: false,
    isDraft: false, amcAvailable: false,
    status: "active",
  });

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const showInactiveDerived = statusFilter !== "active";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "active") params.set("includeInactive", "true");
      const res = await fetch(`/api/admin/products?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const items = data.items ?? [];
      const filtered = statusFilter === "inactive" ? items.filter((p: Product) => !p.isActive) :
                       statusFilter === "draft" ? items.filter((p: Product) => p.isDraft) :
                       statusFilter === "published" ? items.filter((p: Product) => p.isPublished) :
                       items;
      setProducts(filtered);
    } catch {
      toast({ title: "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  // --- Create/Edit handlers ---
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "", brand: "QBIT", manufacturer: "", model: "", deviceType: "thermal_printer",
      description: "", longDescription: "", subCategory: "", productSeries: "", productType: "",
      highlights: "",
      driverDownloadUrl: "", manualUrl: "", installationGuideUrl: "", knowledgeBaseUrl: "",
      brochureUrl: "", datasheetUrl: "", warrantyUrl: "", sdkUrl: "", utilityUrl: "",
      installationInstructions: "", requiredSoftware: "", requiredDrivers: "", requiredAccessories: "",
      installationTime: "", difficultyLevel: "",
      canonicalUrl: "", openGraphImage: "", twitterCard: "",
      seoTitle: "", seoDescription: "", seoKeywords: "",
      purchasePrice: "", dealerPrice: "", distributorPrice: "", mrp: "", sellingPrice: "",
      gstRate: "", hsnCode: "", warrantyDuration: "",
      upgradedModel: "", previousModel: "",
      isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: false,
      isDraft: false, amcAvailable: false,
      status: "active",
    });
    setShowCreateEdit(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, brand: product.brand, manufacturer: product.manufacturer ?? "",
      model: product.model, deviceType: product.deviceType, description: product.description ?? "",
      longDescription: "", subCategory: "", productSeries: "", productType: "",
      highlights: "",
      driverDownloadUrl: product.driverDownloadUrl ?? "", manualUrl: product.manualUrl ?? "",
      installationGuideUrl: product.installationGuideUrl ?? "", knowledgeBaseUrl: product.knowledgeBaseUrl ?? "",
      brochureUrl: product.brochureUrl ?? "", datasheetUrl: product.datasheetUrl ?? "",
      warrantyUrl: product.warrantyUrl ?? "", sdkUrl: product.sdkUrl ?? "", utilityUrl: product.utilityUrl ?? "",
      installationInstructions: "", requiredSoftware: "", requiredDrivers: "", requiredAccessories: "",
      installationTime: "", difficultyLevel: "",
      canonicalUrl: "", openGraphImage: "", twitterCard: "",
      seoTitle: "", seoDescription: "", seoKeywords: "",
      purchasePrice: "", dealerPrice: "", distributorPrice: "", mrp: "", sellingPrice: "",
      gstRate: "", hsnCode: "", warrantyDuration: "",
      upgradedModel: "", previousModel: "",
      isFeatured: product.isFeatured ?? false, isTrending: product.isTrending ?? false,
      isBestSeller: product.isBestSeller ?? false, isNewArrival: product.isNewArrival ?? false,
      isDraft: product.isDraft ?? false, amcAvailable: false,
      status: product.status ?? "active",
    });
    setShowCreateEdit(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.model) {
      toast({ title: "Name and Model are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const categoryForCreate = DEVICE_TYPES.find((t) => t.value === formData.deviceType)?.slug ?? "";
      const payload = {
        ...formData,
        category: editingProduct?.category ?? categoryForCreate,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
        dealerPrice: formData.dealerPrice ? parseFloat(formData.dealerPrice) : null,
        distributorPrice: formData.distributorPrice ? parseFloat(formData.distributorPrice) : null,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
        gstRate: formData.gstRate ? parseFloat(formData.gstRate) : null,
        manufacturer: formData.manufacturer || null,
        description: formData.description || null,
        longDescription: formData.longDescription || null,
        driverDownloadUrl: formData.driverDownloadUrl || null,
        manualUrl: formData.manualUrl || null,
        installationGuideUrl: formData.installationGuideUrl || null,
        knowledgeBaseUrl: formData.knowledgeBaseUrl || null,
        brochureUrl: formData.brochureUrl || null,
        datasheetUrl: formData.datasheetUrl || null,
        warrantyUrl: formData.warrantyUrl || null,
        sdkUrl: formData.sdkUrl || null,
        utilityUrl: formData.utilityUrl || null,
      };

      if (editingProduct) {
        const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Update failed");
        }
        toast({ title: "Product updated", description: formData.name });
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Create failed");
        }
        toast({ title: "Product created", description: formData.name });
      }
      setShowCreateEdit(false);
      void fetchProducts();
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // --- Delete handler ---
  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Delete failed");
      }
      toast({ title: "Product deleted", description: `${deleteTarget.name} moved to inactive list` });
      setDeleteTarget(null);
      void fetchProducts();
    } catch (e) {
      toast({ title: "Delete failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  // --- Hard Delete ---
  const handleHardDeleteProduct = async () => {
    if (!hardDeleteTarget) return;
    try {
      const res = await fetch(`/api/admin/products/${hardDeleteTarget.id}?hard=true`, { method: "DELETE" });
      if (!res.ok) throw new Error("Permanent delete failed");
      toast({ title: "Product permanently deleted", description: hardDeleteTarget.name, variant: "destructive" });
      setHardDeleteTarget(null);
      void fetchProducts();
    } catch (e) {
      toast({ title: "Permanent delete failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  // --- Bulk Delete ---
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      const hard = showInactiveDerived ? "?hard=true" : "";
      const res = await fetch(`/api/admin/products/bulk-delete${hard}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      const data = await res.json();
      const count = data.deleted ?? data.deactivated ?? 0;
      toast({ title: `Bulk delete complete`, description: `${count} products processed` });
      setSelected(new Set());
      void fetchProducts();
    } catch (e) {
      toast({ title: "Bulk delete failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setBulkBusy(false);
    }
  };

  // --- Export CSV ---
  const handleExportCSV = () => {
    window.open("/api/admin/products/export", "_blank", "noopener,noreferrer");
  };

  // --- Bulk Restore (only relevant when filter = inactive) ---
  const handleBulkRestore = async () => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/products/bulk-restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Bulk restore failed");
      const data = await res.json();
      toast({ title: "Bulk restore complete", description: `${data.reactivated} products reactivated` });
      setSelected(new Set());
      void fetchProducts();
    } catch (e) {
      toast({ title: "Bulk restore failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setBulkBusy(false);
    }
  };

  // --- Restore single product ---
  const handleRestoreProduct = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}/restore`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Restore failed");
      }
      toast({ title: "Product restored", description: `${product.name} is now active` });
      void fetchProducts();
    } catch (e) {
      toast({ title: "Restore failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  // --- Selection ---
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Product Master", icon: "database" }}
      navItems={ADMIN_NAV}
      activeScreen="product-master"
      user={{ name: userName, role: "Administrator", initials }}
      cta={{ label: "Refresh", icon: "refresh", onClick: () => void fetchProducts() }}
      topBar={{ searchPlaceholder: "Search product master…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-qbit-on-surface">
              <Icon name="database" className="text-[28px] text-qbit-primary" />
              Product Master
            </h2>
            <p className="mt-1 text-sm text-qbit-on-surface-variant">
              Enterprise Product Information Management — model-number-unique product catalog. No customer/installation/warranty fields.
            </p>
          </div>
          <QbitButton variant="primary" icon="add" size="lg" onClick={handleAddProduct}>
            Add Product
          </QbitButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total Products" value={products.length.toString()} icon="inventory_2" iconBg="bg-qbit-primary/10 text-qbit-primary" />
          <KpiCard label="Active" value={products.filter((p) => p.isActive).length.toString()} icon="check_circle" iconBg="bg-qbit-success/10 text-qbit-success" />
          <KpiCard label="Drafts" value={products.filter((p) => p.isDraft).length.toString()} icon="edit_note" iconBg="bg-qbit-warning/10 text-qbit-warning" />
          <KpiCard label="Best Sellers" value={products.filter((p) => p.isBestSeller).length.toString()} icon="trending_up" iconBg="bg-qbit-secondary/10 text-qbit-secondary" />
        </div>

        {/* Search + Bulk Actions */}
        <SurfaceCard className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="search" className="ml-2 text-[20px] text-qbit-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
              placeholder="Search by name, model, brand…"
              className="flex-1 border-0 bg-transparent px-2 py-2 text-sm focus:outline-none"
            />
            {/* 3-way status filter */}
            <div className="flex items-center gap-1 rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low p-1">
              {([
                { key: "all", label: "All", icon: "inventory_2", count: products.length },
                { key: "active", label: "Active", icon: "check_circle", count: products.filter((p) => p.isActive).length },
                { key: "inactive", label: "Inactive", icon: "block", count: products.filter((p) => !p.isActive).length },
                { key: "draft", label: "Drafts", icon: "edit_note", count: products.filter((p) => p.isDraft).length },
                { key: "published", label: "Published", icon: "publish", count: products.filter((p) => p.isPublished).length },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatusFilter(opt.key)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === opt.key
                      ? "bg-qbit-primary text-qbit-on-primary"
                      : "text-qbit-on-surface-variant hover:text-qbit-on-surface"
                  }`}
                >
                  <Icon name={opt.icon} className="text-[14px]" />
                  {opt.label}
                  <span className="ml-0.5 rounded-full bg-black/10 px-1.5 text-[10px] font-bold">{opt.count}</span>
                </button>
              ))}
            </div>
            {selected.size > 0 && (
              <>
                <QbitButton variant="danger" size="sm" icon="delete" disabled={bulkBusy} onClick={handleBulkDelete}>
                  {showInactiveDerived ? `Permanently Delete (${selected.size})` : `Bulk Delete (${selected.size})`}
                </QbitButton>
                {showInactiveDerived && (
                  <QbitButton variant="outline" size="sm" icon="restore" disabled={bulkBusy} onClick={handleBulkRestore}>
                    Restore ({selected.size})
                  </QbitButton>
                )}
                <button onClick={() => setSelected(new Set())} className="text-xs text-qbit-on-surface-variant hover:text-qbit-error">
                  Clear
                </button>
              </>
            )}
            <QbitButton variant="outline" size="sm" icon="file_download" onClick={handleExportCSV}>
              Export CSV
            </QbitButton>
          </div>
        </SurfaceCard>

        {/* Products Table */}
        {loading ? (
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-4 py-12 text-center">
            <Icon name="progress_activity" className="mx-auto text-[28px] animate-spin text-qbit-primary" />
          </div>
        ) : products.length === 0 ? (
          <SurfaceCard className="p-8 text-center">
            <Icon name="inventory_2" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
            <p className="mt-2 text-sm text-qbit-on-surface-variant">No products found.</p>
            <QbitButton variant="outline" size="sm" icon="add" className="mt-3" onClick={handleAddProduct}>
              Add First Product
            </QbitButton>
          </SurfaceCard>
        ) : (
          <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selected.size === products.length && products.length > 0} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className={selected.has(product.id) ? "bg-qbit-primary/5" : ""}>
                      <TableCell>
                        <Checkbox checked={selected.has(product.id)} onCheckedChange={() => toggleSelect(product.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-qbit-primary/10 text-qbit-primary">
                            <Icon name="inventory_2" className="text-[16px]" />
                          </div>
                          <div>
                            <p className="font-medium text-qbit-on-surface">{product.name}</p>
                            <p className="text-xs text-qbit-on-surface-variant">{product.brand}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.model}</TableCell>
                      <TableCell>
                        <TagBadge variant="neutral">{product.deviceType.replace(/_/g, " ")}</TagBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={product.isActive ? "success" : "neutral"} dot>
                          {product.isActive ? "Active" : "Inactive"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.isFeatured && <TagBadge variant="primary">Featured</TagBadge>}
                          {product.isTrending && <TagBadge variant="secondary">Trending</TagBadge>}
                          {product.isBestSeller && <TagBadge variant="secondary">Best Seller</TagBadge>}
                          {product.isNewArrival && <TagBadge variant="primary">New</TagBadge>}
                          {product.isDraft && <TagBadge variant="error">Draft</TagBadge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{product.downloadCount ?? 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {showInactiveDerived && !product.isActive ? (
                            <>
                              <button
                                type="button"
                                aria-label={`Restore ${product.name}`}
                                onClick={() => handleRestoreProduct(product)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-success transition-colors hover:bg-qbit-success/10"
                              >
                                <Icon name="restore" className="text-[20px]" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Permanently delete ${product.name}`}
                                onClick={() => setHardDeleteTarget(product)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-error transition-colors hover:bg-qbit-error/10"
                              >
                                <Icon name="delete_forever" className="text-[20px]" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                aria-label={`Manage ${product.name}`}
                                title="Manage full product details"
                                onClick={() => setDrawerProductId(product.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-primary transition-colors hover:bg-qbit-primary/10"
                              >
                                <Icon name="tune" className="text-[20px]" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Edit ${product.name}`}
                                title="Quick edit"
                                onClick={() => handleEditProduct(product)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high"
                              >
                                <Icon name="edit" className="text-[20px]" />
                              </button>
                              {product.slug && (
                                <a
                                  href={`/products/${product.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Open public page for ${product.name}`}
                                  title="Open public product page"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high"
                                >
                                  <Icon name="open_in_new" className="text-[20px]" />
                                </a>
                              )}
                              <button
                                type="button"
                                aria-label={`Delete ${product.name}`}
                                onClick={() => setDeleteTarget(product)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-error transition-colors hover:bg-qbit-error/10"
                              >
                                <Icon name="delete" className="text-[20px]" />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SurfaceCard>
        )}
      </div>

      {/* Create/Edit Dialog — Extended with PIM fields */}
      <Dialog open={showCreateEdit} onOpenChange={setShowCreateEdit}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? `Update ${editingProduct.name}` : "Create a new product in the master catalog"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Section 1 — Basic Information */}
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-qbit-primary">Basic Information</label>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Product Name *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="QBIT T-800 Thermal Printer" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Brand</label>
              <Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="QBIT" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Model Number * (Unique)</label>
              <Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="T-800" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Manufacturer</label>
              <Input value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} placeholder="QBIT Technologies" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Device Type</label>
              <select
                value={formData.deviceType}
                onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
              >
                {DEVICE_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Sub Category</label>
              <Input value={formData.subCategory} onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })} placeholder="Receipt Printer" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Product Series</label>
              <Input value={formData.productSeries} onChange={(e) => setFormData({ ...formData, productSeries: e.target.value })} placeholder="T-Series" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Short Description</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="High-speed 80mm thermal receipt printer" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Full Description</label>
              <Textarea rows={3} value={formData.longDescription} onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })} placeholder="Detailed product description…" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Product Highlights (one per line)</label>
              <Textarea rows={2} value={formData.highlights} onChange={(e) => setFormData({ ...formData, highlights: e.target.value })} placeholder="250mm/s print speed&#10;Auto-cutter&#10;Multi-interface" />
            </div>

            {/* Status flags */}
            <div className="col-span-2 flex flex-wrap gap-4 border-t border-qbit-outline-variant/50 pt-3">
              <label className="flex items-center gap-2 text-xs font-medium">
                <Checkbox checked={formData.isFeatured} onCheckedChange={(v) => setFormData({ ...formData, isFeatured: !!v })} /> Featured
              </label>
              <label className="flex items-center gap-2 text-xs font-medium">
                <Checkbox checked={formData.isTrending} onCheckedChange={(v) => setFormData({ ...formData, isTrending: !!v })} /> Trending
              </label>
              <label className="flex items-center gap-2 text-xs font-medium">
                <Checkbox checked={formData.isBestSeller} onCheckedChange={(v) => setFormData({ ...formData, isBestSeller: !!v })} /> Best Seller
              </label>
              <label className="flex items-center gap-2 text-xs font-medium">
                <Checkbox checked={formData.isNewArrival} onCheckedChange={(v) => setFormData({ ...formData, isNewArrival: !!v })} /> New Arrival
              </label>
              <label className="flex items-center gap-2 text-xs font-medium">
                <Checkbox checked={formData.isDraft} onCheckedChange={(v) => setFormData({ ...formData, isDraft: !!v })} /> Draft
              </label>
              <label className="flex items-center gap-2 text-xs font-medium">
                <Checkbox checked={formData.amcAvailable} onCheckedChange={(v) => setFormData({ ...formData, amcAvailable: !!v })} /> AMC Available
              </label>
            </div>

            {/* Section 3 — Downloads */}
            <div className="col-span-2 mt-2 border-t border-qbit-outline-variant/50 pt-3">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-qbit-primary">Downloads & Resources</label>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Driver URL</label>
              <Input value={formData.driverDownloadUrl} onChange={(e) => setFormData({ ...formData, driverDownloadUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Manual URL</label>
              <Input value={formData.manualUrl} onChange={(e) => setFormData({ ...formData, manualUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Brochure URL</label>
              <Input value={formData.brochureUrl} onChange={(e) => setFormData({ ...formData, brochureUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Datasheet URL</label>
              <Input value={formData.datasheetUrl} onChange={(e) => setFormData({ ...formData, datasheetUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">SDK URL</label>
              <Input value={formData.sdkUrl} onChange={(e) => setFormData({ ...formData, sdkUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Utility URL</label>
              <Input value={formData.utilityUrl} onChange={(e) => setFormData({ ...formData, utilityUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Warranty PDF URL</label>
              <Input value={formData.warrantyUrl} onChange={(e) => setFormData({ ...formData, warrantyUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Installation Guide URL</label>
              <Input value={formData.installationGuideUrl} onChange={(e) => setFormData({ ...formData, installationGuideUrl: e.target.value })} placeholder="https://…" />
            </div>

            {/* Section 4 — Installation */}
            <div className="col-span-2 mt-2 border-t border-qbit-outline-variant/50 pt-3">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-qbit-primary">Installation Resources</label>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Installation Instructions</label>
              <Textarea rows={2} value={formData.installationInstructions} onChange={(e) => setFormData({ ...formData, installationInstructions: e.target.value })} placeholder="Step-by-step instructions…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Installation Time</label>
              <Input value={formData.installationTime} onChange={(e) => setFormData({ ...formData, installationTime: e.target.value })} placeholder="15 minutes" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Difficulty Level</label>
              <select
                value={formData.difficultyLevel}
                onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            {/* Section 9 — SEO */}
            <div className="col-span-2 mt-2 border-t border-qbit-outline-variant/50 pt-3">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-qbit-primary">SEO</label>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">SEO Title</label>
              <Input value={formData.seoTitle} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">SEO Description</label>
              <Textarea rows={2} value={formData.seoDescription} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">SEO Keywords (comma-separated)</label>
              <Input value={formData.seoKeywords} onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })} />
            </div>

            {/* Section 13 — Pricing */}
            <div className="col-span-2 mt-2 border-t border-qbit-outline-variant/50 pt-3">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-qbit-primary">Pricing</label>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Purchase Price (₹)</label>
              <Input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} placeholder="15000" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Dealer Price (₹)</label>
              <Input type="number" value={formData.dealerPrice} onChange={(e) => setFormData({ ...formData, dealerPrice: e.target.value })} placeholder="17000" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">MRP (₹)</label>
              <Input type="number" value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: e.target.value })} placeholder="22000" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Selling Price (₹)</label>
              <Input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} placeholder="18500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">GST Rate (%)</label>
              <Input type="number" value={formData.gstRate} onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })} placeholder="18" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">HSN Code</label>
              <Input value={formData.hsnCode} onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })} placeholder="84433200" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Warranty Duration</label>
              <Input value={formData.warrantyDuration} onChange={(e) => setFormData({ ...formData, warrantyDuration: e.target.value })} placeholder="12 months" />
            </div>
          </div>

          <DialogFooter>
            <QbitButton variant="ghost" onClick={() => setShowCreateEdit(false)}>Cancel</QbitButton>
            <QbitButton variant="primary" icon={saving ? "progress_activity" : "check"} disabled={saving} onClick={handleSaveProduct}>
              {saving ? "Saving…" : editingProduct ? "Update Product" : "Create Product"}
            </QbitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? It will be moved to the inactive list and can be restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <QbitButton variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</QbitButton>
            <QbitButton variant="danger" icon="delete" onClick={handleDeleteProduct}>Delete</QbitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete */}
      <Dialog open={!!hardDeleteTarget} onOpenChange={(open) => !open && setHardDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-qbit-error">Permanent Delete</DialogTitle>
            <DialogDescription>
              <span className="block">Are you sure you want to <strong>permanently delete</strong> &ldquo;{hardDeleteTarget?.name}&rdquo;?</span>
              <span className="mt-2 block text-qbit-error">This action is irreversible.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <QbitButton variant="ghost" onClick={() => setHardDeleteTarget(null)}>Cancel</QbitButton>
            <QbitButton variant="danger" icon="delete_forever" onClick={handleHardDeleteProduct}>Permanently Delete</QbitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-detail editor drawer */}
      <ProductEditDrawer
        productId={drawerProductId}
        onClose={() => setDrawerProductId(null)}
        onSaved={() => void fetchProducts()}
      />
    </AppShell>
  );
}
