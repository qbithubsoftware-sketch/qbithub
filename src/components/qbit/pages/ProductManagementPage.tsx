"use client";

/**
 * ProductManagementPage — Admin product CRUD with real API.
 *
 * Features:
 *   - Fetch products from /api/admin/products
 *   - Add Product button → opens create dialog
 *   - Edit button → opens edit dialog
 *   - Delete button → confirmation + soft delete
 *   - Bulk Delete → bulk soft delete
 *   - Export CSV → downloads CSV file
 *   - Search + pagination
 *
 * RCA fixes: RCA-001, RCA-002, RCA-003, RCA-006, RCA-015, RCA-016
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Product {
  id: string;
  name: string;
  brand: string;
  manufacturer: string | null;
  model: string;
  deviceType: string;
  description: string | null;
  driverDownloadUrl: string | null;
  manualUrl: string | null;
  installationGuideUrl: string | null;
  knowledgeBaseUrl: string | null;
  isActive: boolean;
  signatureCount: number;
  detectedCount: number;
  passportCount: number;
  createdAt: string;
  updatedAt: string;
}

const DEVICE_TYPES = [
  { value: "thermal_printer", label: "Thermal Printer" },
  { value: "barcode_scanner", label: "Barcode Scanner" },
  { value: "windows_pos", label: "Windows POS" },
  { value: "android_pos", label: "Android POS" },
  { value: "cash_drawer", label: "Cash Drawer" },
  { value: "customer_display", label: "Customer Display" },
  { value: "label_printer", label: "Label Printer" },
  { value: "kitchen_printer", label: "Kitchen Printer" },
  { value: "kiosk", label: "Kiosk" },
  { value: "weighing_scale", label: "Weighing Scale" },
];

const DEVICE_TYPE_ICONS: Record<string, string> = {
  thermal_printer: "print", barcode_scanner: "barcode_scanner", windows_pos: "desktop_windows",
  android_pos: "phone_android", cash_drawer: "point_of_sale", customer_display: "monitor",
  label_printer: "label", kitchen_printer: "restaurant", kiosk: "storefront", weighing_scale: "scale",
};

export function ProductManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showInactive, setShowInactive] = useState(false);

  // Dialog state
  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "", brand: "QBIT", manufacturer: "", model: "", deviceType: "thermal_printer",
    description: "", driverDownloadUrl: "", manualUrl: "", installationGuideUrl: "", knowledgeBaseUrl: "",
  });

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (showInactive) params.set("includeInactive", "true");
      const res = await fetch(`/api/admin/products?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setProducts(data.items ?? []);
    } catch {
      toast({ title: "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, showInactive, toast]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // --- Create/Edit handlers ---
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "", brand: "QBIT", manufacturer: "", model: "", deviceType: "thermal_printer",
      description: "", driverDownloadUrl: "", manualUrl: "", installationGuideUrl: "", knowledgeBaseUrl: "",
    });
    setShowCreateEdit(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, brand: product.brand, manufacturer: product.manufacturer ?? "",
      model: product.model, deviceType: product.deviceType, description: product.description ?? "",
      driverDownloadUrl: product.driverDownloadUrl ?? "", manualUrl: product.manualUrl ?? "",
      installationGuideUrl: product.installationGuideUrl ?? "", knowledgeBaseUrl: product.knowledgeBaseUrl ?? "",
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
      const payload = {
        ...formData,
        manufacturer: formData.manufacturer || null,
        description: formData.description || null,
        driverDownloadUrl: formData.driverDownloadUrl || null,
        manualUrl: formData.manualUrl || null,
        installationGuideUrl: formData.installationGuideUrl || null,
        knowledgeBaseUrl: formData.knowledgeBaseUrl || null,
      };

      if (editingProduct) {
        // Update
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
        // Create
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

  // --- Soft Delete handler (default — deactivates, reversible) ---
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

  // --- Permanent Delete handler (irreversible — removes from DB) ---
  const handleHardDeleteProduct = async () => {
    if (!hardDeleteTarget) return;
    try {
      const res = await fetch(`/api/admin/products/${hardDeleteTarget.id}?hard=true`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Permanent delete failed");
      }
      toast({ title: "Product permanently deleted", description: hardDeleteTarget.name, variant: "destructive" });
      setHardDeleteTarget(null);
      void fetchProducts();
    } catch (e) {
      toast({ title: "Permanent delete failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  // --- Restore handler (reactivates a soft-deleted product) ---
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

  // --- Bulk Delete (soft by default, hard when showInactive is on) ---
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      const hard = showInactive ? "?hard=true" : "";
      const res = await fetch(`/api/admin/products/bulk-delete${hard}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Bulk delete failed");
      }
      const data = await res.json();
      const count = data.deleted ?? data.deactivated ?? 0;
      const action = showInactive ? "permanently deleted" : "deactivated";
      toast({ title: `Bulk ${action}`, description: `${count} products ${action}` });
      setSelected(new Set());
      void fetchProducts();
    } catch (e) {
      toast({ title: "Bulk delete failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setBulkBusy(false);
    }
  };

  // --- Bulk Restore (only relevant when showInactive is on) ---
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

  // --- Export CSV ---
  const handleExportCSV = () => {
    window.open("/api/admin/products/export", "_blank", "noopener,noreferrer");
  };

  // --- Selection ---
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
      brand={{ title: "QBIT Hub", tagline: "Product Management", icon: "inventory_2" }}
      navItems={ADMIN_NAV}
      activeScreen="product-management"
      user={{ name: userName, role: "Administrator", initials }}
      cta={{ label: "Refresh", icon: "refresh", onClick: () => void fetchProducts() }}
      topBar={{ searchPlaceholder: "Search products…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">Product Management</h2>
            <p className="mt-1 text-sm text-qbit-on-surface-variant">Manage product catalog, models, and device types.</p>
          </div>
          <QbitButton variant="primary" icon="add" size="lg" onClick={handleAddProduct}>
            Add Product
          </QbitButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total Products" value={products.length.toString()} icon="inventory_2" iconBg="bg-qbit-primary/10 text-qbit-primary" />
          <KpiCard label="Active" value={products.filter((p) => p.isActive).length.toString()} icon="check_circle" iconBg="bg-qbit-success/10 text-qbit-success" />
          <KpiCard label="With Signatures" value={products.filter((p) => p.signatureCount > 0).length.toString()} icon="fingerprint" iconBg="bg-qbit-secondary/10 text-qbit-secondary" />
          <KpiCard label="Detected Devices" value={products.reduce((sum, p) => sum + p.detectedCount, 0).toString()} icon="devices" iconBg="bg-qbit-tertiary/10 text-qbit-tertiary" />
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
            <button
              type="button"
              onClick={() => setShowInactive((v) => !v)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                showInactive
                  ? "bg-qbit-warning/15 text-qbit-warning"
                  : "bg-qbit-surface-container-high text-qbit-on-surface-variant hover:text-qbit-on-surface"
              }`}
            >
              <Icon name={showInactive ? "visibility" : "visibility_off"} className="text-[16px]" />
              {showInactive ? "Showing Inactive" : "Show Inactive"}
            </button>
            {selected.size > 0 && (
              <>
                <QbitButton variant="danger" size="sm" icon="delete" disabled={bulkBusy} onClick={handleBulkDelete}>
                  {showInactive ? `Permanently Delete (${selected.size})` : `Bulk Delete (${selected.size})`}
                </QbitButton>
                {showInactive && (
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
                    <TableHead>Signatures</TableHead>
                    <TableHead>Status</TableHead>
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
                            <Icon name={DEVICE_TYPE_ICONS[product.deviceType] ?? "inventory_2"} className="text-[16px]" />
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
                        <span className="text-sm font-medium">{product.signatureCount}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={product.isActive ? "success" : "neutral"} dot>
                          {product.isActive ? "Active" : "Inactive"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {showInactive && !product.isActive ? (
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
                                aria-label={`Edit ${product.name}`}
                                onClick={() => handleEditProduct(product)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high"
                              >
                                <Icon name="edit" className="text-[20px]" />
                              </button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateEdit} onOpenChange={setShowCreateEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? `Update ${editingProduct.name}` : "Create a new product in the catalog"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Product Name *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="QBIT T-800 Thermal Printer" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Brand</label>
              <Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="QBIT" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Model *</label>
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
                {DEVICE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="Product description…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Driver URL</label>
              <Input value={formData.driverDownloadUrl} onChange={(e) => setFormData({ ...formData, driverDownloadUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Manual URL</label>
              <Input value={formData.manualUrl} onChange={(e) => setFormData({ ...formData, manualUrl: e.target.value })} placeholder="https://…" />
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

      {/* Delete Confirmation Dialog (Soft Delete — default) */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete “{deleteTarget?.name}”? It will be moved to the inactive list and can be restored later from the “Show Inactive” view.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <QbitButton variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</QbitButton>
            <QbitButton variant="danger" icon="delete" onClick={handleDeleteProduct}>Delete</QbitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog (Irreversible) */}
      <Dialog open={!!hardDeleteTarget} onOpenChange={(open) => !open && setHardDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-qbit-error">Permanent Delete</DialogTitle>
            <DialogDescription>
              <span className="block">
                Are you sure you want to <strong>permanently delete</strong> “{hardDeleteTarget?.name}”?
              </span>
              <span className="mt-2 block text-qbit-error">
                This action is irreversible. The product and all its hardware signatures will be removed from the database.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <QbitButton variant="ghost" onClick={() => setHardDeleteTarget(null)}>Cancel</QbitButton>
            <QbitButton variant="danger" icon="delete_forever" onClick={handleHardDeleteProduct}>Permanently Delete</QbitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
