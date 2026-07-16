"use client";

/**
 * ProductMasterCreatePage — full-page product creation screen.
 *
 * Replaces the old popup dialog with a dedicated full-page experience
 * similar to Shopify / Zoho Inventory / Odoo.
 *
 * Reuses the same AppShell + surface cards + inputs as ProductMasterPage.
 * No design changes — same colors, typography, spacing.
 */

import { useState } from "react";
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

export function ProductMasterCreatePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigation((s) => s.navigate);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", brand: "QBIT", manufacturer: "", model: "", deviceType: "thermal_printer",
    description: "", longDescription: "", subCategory: "", productSeries: "",
    highlights: "",
    driverDownloadUrl: "", manualUrl: "", installationGuideUrl: "", knowledgeBaseUrl: "",
    brochureUrl: "", datasheetUrl: "", warrantyUrl: "", sdkUrl: "", utilityUrl: "",
    installationInstructions: "", installationTime: "", difficultyLevel: "",
    seoTitle: "", seoDescription: "", seoKeywords: "",
    warrantyDuration: "",
    isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: false,
    isDraft: false, amcAvailable: false,
    status: "active",
  });

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  async function handleSave(saveAsDraft = false) {
    if (!form.name || !form.model) {
      toast({ title: "Product Name and Model are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const categoryForCreate = DEVICE_TYPES.find((t) => t.value === form.deviceType)?.slug ?? "";
      const payload = {
        ...form,
        isDraft: saveAsDraft,
        category: categoryForCreate,
        manufacturer: form.manufacturer || null,
        description: form.description || null,
        longDescription: form.longDescription || null,
        driverDownloadUrl: form.driverDownloadUrl || null,
        manualUrl: form.manualUrl || null,
        installationGuideUrl: form.installationGuideUrl || null,
        knowledgeBaseUrl: form.knowledgeBaseUrl || null,
        brochureUrl: form.brochureUrl || null,
        datasheetUrl: form.datasheetUrl || null,
        warrantyUrl: form.warrantyUrl || null,
        sdkUrl: form.sdkUrl || null,
        utilityUrl: form.utilityUrl || null,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Create failed");
      }
      toast({ title: saveAsDraft ? "Draft saved" : "Product created", description: form.name });
      navigate("product-master");
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Create Product", icon: "add_circle" }}
      navItems={ADMIN_NAV}
      activeScreen="product-master-create"
      user={{ name: userName, role: "Administrator", initials }}
      cta={{ label: "Back", icon: "arrow_back", onClick: () => navigate("product-master") }}
      topBar={{ searchPlaceholder: "Search…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-qbit-on-surface">
              <Icon name="add_circle" className="text-[28px] text-qbit-primary" />
              Create New Product
            </h2>
            <p className="mt-1 text-sm text-qbit-on-surface-variant">
              Fill in the product information below. Use the Manage button later for images, drivers, and full details.
            </p>
          </div>
        </div>

        {/* Section 1 — Basic Information */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="info" className="text-[20px] text-qbit-primary" /> Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Product Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="QBIT T-800 Thermal Printer" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Brand</label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="QBIT" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Model Number</label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="T-800" />
              <p className="mt-1 text-[11px] text-qbit-on-surface-variant">Not required to be unique — multiple products may share model naming.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Manufacturer</label>
              <Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="QBIT Technologies" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Device Type</label>
              <select value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm">
                {DEVICE_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Sub Category</label>
              <Input value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} placeholder="Receipt Printer" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Product Series</label>
              <Input value={form.productSeries} onChange={(e) => setForm({ ...form, productSeries: e.target.value })} placeholder="T-Series" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Short Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="High-speed 80mm thermal receipt printer with auto-cutter" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Full Description</label>
              <Textarea rows={4} value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} placeholder="Detailed product description…" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Product Highlights (one per line)</label>
              <Textarea rows={3} value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} placeholder="250mm/s print speed&#10;Auto-cutter&#10;Multi-interface" />
            </div>
          </div>

          {/* Status flags */}
          <div className="mt-4 flex flex-wrap gap-4 border-t border-qbit-outline-variant/50 pt-3">
            <label className="flex items-center gap-2 text-xs font-medium"><Checkbox checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: !!v })} /> Featured</label>
            <label className="flex items-center gap-2 text-xs font-medium"><Checkbox checked={form.isTrending} onCheckedChange={(v) => setForm({ ...form, isTrending: !!v })} /> Trending</label>
            <label className="flex items-center gap-2 text-xs font-medium"><Checkbox checked={form.isBestSeller} onCheckedChange={(v) => setForm({ ...form, isBestSeller: !!v })} /> Best Seller</label>
            <label className="flex items-center gap-2 text-xs font-medium"><Checkbox checked={form.isNewArrival} onCheckedChange={(v) => setForm({ ...form, isNewArrival: !!v })} /> New Arrival</label>
            <label className="flex items-center gap-2 text-xs font-medium"><Checkbox checked={form.amcAvailable} onCheckedChange={(v) => setForm({ ...form, amcAvailable: !!v })} /> AMC Available</label>
          </div>
        </SurfaceCard>

        {/* Section 2 — Downloads & Resources */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="download" className="text-[20px] text-qbit-primary" /> Downloads & Resources
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium">Driver URL</label><Input value={form.driverDownloadUrl} onChange={(e) => setForm({ ...form, driverDownloadUrl: e.target.value })} placeholder="https://…" /></div>
            <div><label className="mb-1 block text-sm font-medium">Manual URL</label><Input value={form.manualUrl} onChange={(e) => setForm({ ...form, manualUrl: e.target.value })} placeholder="https://…" /></div>
            <div><label className="mb-1 block text-sm font-medium">Brochure URL</label><Input value={form.brochureUrl} onChange={(e) => setForm({ ...form, brochureUrl: e.target.value })} placeholder="https://…" /></div>
            <div><label className="mb-1 block text-sm font-medium">Datasheet URL</label><Input value={form.datasheetUrl} onChange={(e) => setForm({ ...form, datasheetUrl: e.target.value })} placeholder="https://…" /></div>
            <div><label className="mb-1 block text-sm font-medium">SDK URL</label><Input value={form.sdkUrl} onChange={(e) => setForm({ ...form, sdkUrl: e.target.value })} placeholder="https://…" /></div>
            <div><label className="mb-1 block text-sm font-medium">Utility URL</label><Input value={form.utilityUrl} onChange={(e) => setForm({ ...form, utilityUrl: e.target.value })} placeholder="https://…" /></div>
            <div><label className="mb-1 block text-sm font-medium">Warranty PDF URL</label><Input value={form.warrantyUrl} onChange={(e) => setForm({ ...form, warrantyUrl: e.target.value })} placeholder="https://…" /></div>
            <div><label className="mb-1 block text-sm font-medium">Installation Guide URL</label><Input value={form.installationGuideUrl} onChange={(e) => setForm({ ...form, installationGuideUrl: e.target.value })} placeholder="https://…" /></div>
          </div>
          <p className="mt-3 rounded-lg bg-qbit-surface-container-low p-3 text-xs text-qbit-on-surface-variant">
            <Icon name="info" className="mr-1 inline text-[14px] text-qbit-primary" />
            After creating the product, use the <strong>Manage</strong> button to upload files directly (drivers, manuals, images, videos) via the Media Manager.
          </p>
        </SurfaceCard>

        {/* Section 3 — Installation Resources */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="build" className="text-[20px] text-qbit-primary" /> Installation Resources
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Installation Instructions</label>
              <Textarea rows={3} value={form.installationInstructions} onChange={(e) => setForm({ ...form, installationInstructions: e.target.value })} placeholder="Step-by-step instructions…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Installation Time</label>
              <Input value={form.installationTime} onChange={(e) => setForm({ ...form, installationTime: e.target.value })} placeholder="15 minutes" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Difficulty Level</label>
              <select value={form.difficultyLevel} onChange={(e) => setForm({ ...form, difficultyLevel: e.target.value })} className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm">
                <option value="">Select…</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>
        </SurfaceCard>

        {/* Section 4 — SEO */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="search" className="text-[20px] text-qbit-primary" /> SEO
          </h3>
          <div className="space-y-4">
            <div><label className="mb-1 block text-sm font-medium">SEO Title</label><Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} /></div>
            <div><label className="mb-1 block text-sm font-medium">SEO Description</label><Textarea rows={2} value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} /></div>
            <div><label className="mb-1 block text-sm font-medium">SEO Keywords (comma-separated)</label><Input value={form.seoKeywords} onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })} /></div>
          </div>
        </SurfaceCard>

        {/* Section 5 — Warranty */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="verified_user" className="text-[20px] text-qbit-primary" /> Warranty
          </h3>
          <div>
            <label className="mb-1 block text-sm font-medium">Warranty Duration</label>
            <Input value={form.warrantyDuration} onChange={(e) => setForm({ ...form, warrantyDuration: e.target.value })} placeholder="12 months" />
          </div>
        </SurfaceCard>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-xl border border-qbit-outline-variant bg-white/95 p-4 shadow-lg backdrop-blur">
          <QbitButton variant="ghost" icon="arrow_back" onClick={() => navigate("product-master")}>Cancel</QbitButton>
          <QbitButton variant="outline" icon="edit_note" disabled={saving} onClick={() => handleSave(true)}>Save as Draft</QbitButton>
          <QbitButton variant="primary" icon={saving ? "progress_activity" : "check"} disabled={saving} onClick={() => handleSave(false)}>
            {saving ? "Saving…" : "Create Product"}
          </QbitButton>
        </div>
      </div>
    </AppShell>
  );
}
