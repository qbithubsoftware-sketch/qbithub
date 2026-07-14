"use client";

/**
 * ProductEditDrawer — full-detail admin editor for a QbitProduct.
 *
 * Opens when the admin clicks "Manage" on a product row in
 * ProductManagementPage. Lets the admin edit every field exposed by
 * the public detail page:
 *
 *   - Identity (name, brand, manufacturer, model, slug, sku, category, deviceType)
 *   - Pricing + badge + status + flags
 *   - Image URL + Gallery (JSON {url,alt} array)
 *   - Short + Long description
 *   - Specifications (structured {property,value,group}[])
 *   - Features (structured {icon,title,description}[])
 *   - Operating Systems (structured {osName,osIcon,minVersion}[])
 *   - Media files (brochure/datasheet/warranty/sdk/utility/video/driver/manual/firmware/image)
 *   - Resource URLs (driver, manual, installation guide, KB, brochure, datasheet, warranty, sdk, utility)
 *   - Videos (JSON {title,url,provider,externalId}[])
 *   - Related Products (multi-select from other products)
 *   - SEO (title, description, keywords)
 *   - Tags + Compatible Devices
 *   - Dr. QBIT / AI Diagnostics flags
 *   - Latest Driver / Firmware version strings
 *   - QR Code URL (auto-generated from slug)
 *
 * Visible only to administrators (parent page already enforces this).
 */

import { useEffect, useState, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { Icon } from "@/components/qbit/primitives/Icon";
import { TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { useToast } from "@/hooks/use-toast";

const DEVICE_TYPES = [
  { value: "thermal_printer", label: "Thermal Printer", slug: "thermal-printer" },
  { value: "barcode_scanner", label: "Barcode Scanner", slug: "barcode-scanner" },
  { value: "windows_pos", label: "Windows POS", slug: "windows-pos" },
  { value: "android_pos", label: "Android POS", slug: "android-pos" },
  { value: "cash_drawer", label: "Cash Drawer", slug: "cash-drawer" },
  { value: "customer_display", label: "Customer Display", slug: "customer-display" },
  { value: "label_printer", label: "Label Printer", slug: "label-printer" },
  { value: "kitchen_printer", label: "Kitchen Printer", slug: "kitchen-printer" },
  { value: "kiosk", label: "Kiosk", slug: "kiosk" },
  { value: "weighing_scale", label: "Weighing Scale", slug: "weighing-scale" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "coming_soon", label: "Coming Soon" },
  { value: "deprecated", label: "Deprecated" },
  { value: "discontinued", label: "Discontinued" },
];

interface Spec { property: string; value: string; group?: string; }
interface Feature { icon: string; title: string; description: string; }
interface OS { osName: string; osIcon?: string; minVersion?: string; }
interface MediaFile {
  type: string; title: string; url: string; mimeType?: string;
  altText?: string; provider?: string; externalId?: string; isPrimary?: boolean;
}
interface Video { title: string; url: string; provider?: string; externalId?: string; }
interface GalleryImage { url: string; alt: string; }

interface FullProduct {
  id: string;
  name: string; brand: string; manufacturer: string | null;
  model: string; slug: string; sku: string | null;
  deviceType: string; category: string | null;
  description: string | null; longDescription: string | null;
  imageUrl: string | null; galleryImages: string | null;
  startingPrice: string | null; badgeLabel: string | null;
  isFeatured: boolean; isTrending: boolean;
  status: string; tags: string | null; compatibleDevices: string | null;
  driverDownloadUrl: string | null; manualUrl: string | null;
  installationGuideUrl: string | null; knowledgeBaseUrl: string | null;
  brochureUrl: string | null; datasheetUrl: string | null;
  warrantyUrl: string | null; sdkUrl: string | null; utilityUrl: string | null;
  qrCodeUrl: string | null;
  seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null;
  aiDiagnosticsSupported: boolean; drQbitSupported: boolean;
  latestDriverVersion: string | null; latestFirmwareVersion: string | null;
  specifications: string | null; features: string | null;
  operatingSystems: string | null; videos: string | null;
  specEntries?: Spec[]; featureEntries?: Feature[]; productOS?: OS[]; mediaFiles?: MediaFile[];
  relatedProducts?: { related: { id: string; name: string; slug: string; } }[];
}

function safeParse<T>(v: string | null | undefined, fallback: T): T {
  if (!v) return fallback;
  try { return JSON.parse(v) as T; } catch { return fallback; }
}

function toCsv(arr: string[] | null | undefined): string {
  return arr ? arr.join(", ") : "";
}

function fromCsv(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

interface Props {
  productId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductEditDrawer({ productId, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [allProducts, setAllProducts] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [selectedRelated, setSelectedRelated] = useState<Set<string>>(new Set());

  // Editable arrays
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [osList, setOsList] = useState<OS[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  // Editable form fields
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load product");
      const data = await res.json();
      const p: FullProduct = data.product;
      setProduct(p);
      // Prefer structured child rows, fall back to JSON fields
      setSpecs(p.specEntries ?? safeParse<Spec[]>(p.specifications, []));
      setFeatures(p.featureEntries ?? safeParse<Feature[]>(p.features, []));
      setOsList(p.productOS ?? safeParse<OS[]>(p.operatingSystems, []));
      setMedia(p.mediaFiles ?? []);
      setVideos(safeParse<Video[]>(p.videos, []));
      setGallery(safeParse<GalleryImage[]>(p.galleryImages, []));
      setSelectedRelated(new Set((p.relatedProducts ?? []).map((r) => r.related.id)));
      setForm({
        name: p.name, brand: p.brand, manufacturer: p.manufacturer ?? "",
        model: p.model, slug: p.slug, sku: p.sku ?? "",
        deviceType: p.deviceType, category: p.category ?? "",
        description: p.description ?? "", longDescription: p.longDescription ?? "",
        imageUrl: p.imageUrl ?? "", startingPrice: p.startingPrice ?? "",
        badgeLabel: p.badgeLabel ?? "", status: p.status,
        tags: toCsv(p.tags ? p.tags.split(",") : []),
        compatibleDevices: toCsv(p.compatibleDevices ? p.compatibleDevices.split(",") : []),
        driverDownloadUrl: p.driverDownloadUrl ?? "", manualUrl: p.manualUrl ?? "",
        installationGuideUrl: p.installationGuideUrl ?? "", knowledgeBaseUrl: p.knowledgeBaseUrl ?? "",
        brochureUrl: p.brochureUrl ?? "", datasheetUrl: p.datasheetUrl ?? "",
        warrantyUrl: p.warrantyUrl ?? "", sdkUrl: p.sdkUrl ?? "", utilityUrl: p.utilityUrl ?? "",
        qrCodeUrl: p.qrCodeUrl ?? "",
        seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "",
        seoKeywords: p.seoKeywords ?? "",
        latestDriverVersion: p.latestDriverVersion ?? "",
        latestFirmwareVersion: p.latestFirmwareVersion ?? "",
        isFeatured: p.isFeatured, isTrending: p.isTrending,
        aiDiagnosticsSupported: p.aiDiagnosticsSupported,
        drQbitSupported: p.drQbitSupported,
        isActive: true,
      });
    } catch (e) {
      toast({ title: "Load failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  // Fetch all products for the Related Products multi-select
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/products?includeInactive=true&limit=500", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setAllProducts(
            (data.items as Array<{ id: string; name: string; slug: string }>)
              .filter((p) => p.id !== productId)
          );
        }
      } catch { /* ignore */ }
    })();
  }, [productId]);

  useEffect(() => {
    if (productId) void fetchProduct();
    else {
      setProduct(null);
      setSpecs([]); setFeatures([]); setOsList([]); setMedia([]); setVideos([]); setGallery([]);
      setSelectedRelated(new Set());
      setForm({});
    }
  }, [productId, fetchProduct]);

  const setField = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: fromCsv(form.tags as string),
        compatibleDevices: fromCsv(form.compatibleDevices as string),
        seoKeywords: (form.seoKeywords as string).split(",").map((s) => s.trim()).filter(Boolean).join(","),
        specifications: specs,
        features,
        operatingSystems: osList,
        mediaFiles: media,
        videos,
        galleryImages: gallery,
        relatedProductIds: Array.from(selectedRelated),
      };
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Update failed");
      }
      toast({ title: "Product updated", description: form.name as string });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const open = !!productId;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Icon name="edit_document" className="text-[24px] text-qbit-primary" />
            Manage Product
            {product && (
              <TagBadge variant="neutral" >{product.slug}</TagBadge>
            )}
          </DialogTitle>
          <DialogDescription>
            Edit identity, gallery, specs, features, OS, downloads, videos, related products, and SEO.
          </DialogDescription>
        </DialogHeader>

        {loading || !product ? (
          <div className="py-12 text-center">
            <Icon name="progress_activity" className="mx-auto animate-spin text-[32px] text-qbit-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* IDENTITY */}
            <Section title="Identity" icon="badge">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Product Name *">
                  <Input value={form.name as string} onChange={(e) => setField("name", e.target.value)} />
                </Field>
                <Field label="Brand">
                  <Input value={form.brand as string} onChange={(e) => setField("brand", e.target.value)} />
                </Field>
                <Field label="Manufacturer">
                  <Input value={form.manufacturer as string} onChange={(e) => setField("manufacturer", e.target.value)} />
                </Field>
                <Field label="Model *">
                  <Input value={form.model as string} onChange={(e) => setField("model", e.target.value)} />
                </Field>
                <Field label="Slug (URL)" hint="Auto-derived from Model if left empty. Used as /products/[slug].">
                  <Input value={form.slug as string} onChange={(e) => setField("slug", e.target.value)} />
                </Field>
                <Field label="SKU">
                  <Input value={form.sku as string} onChange={(e) => setField("sku", e.target.value)} />
                </Field>
                <Field label="Device Type">
                  <select
                    value={form.deviceType as string}
                    onChange={(e) => {
                      const dt = DEVICE_TYPES.find((d) => d.value === e.target.value);
                      setField("deviceType", e.target.value);
                      if (dt) setField("category", dt.slug);
                    }}
                    className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
                  >
                    {DEVICE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Category (slug)">
                  <Input value={form.category as string} onChange={(e) => setField("category", e.target.value)} placeholder="thermal-printer" />
                </Field>
                <Field label="Status">
                  <select
                    value={form.status as string}
                    onChange={(e) => setField("status", e.target.value)}
                    className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Starting Price">
                  <Input value={form.startingPrice as string} onChange={(e) => setField("startingPrice", e.target.value)} placeholder="₹18,500" />
                </Field>
                <Field label="Badge Label">
                  <Input value={form.badgeLabel as string} onChange={(e) => setField("badgeLabel", e.target.value)} placeholder="Most Downloaded" />
                </Field>
              </div>

              <div className="mt-3 flex flex-wrap gap-4">
                <CheckboxToggle label="Featured" checked={!!form.isFeatured} onChange={(v) => setField("isFeatured", v)} />
                <CheckboxToggle label="Trending" checked={!!form.isTrending} onChange={(v) => setField("isTrending", v)} />
                <CheckboxToggle label="Dr. QBIT Supported" checked={!!form.drQbitSupported} onChange={(v) => setField("drQbitSupported", v)} />
                <CheckboxToggle label="AI Diagnostics Supported" checked={!!form.aiDiagnosticsSupported} onChange={(v) => setField("aiDiagnosticsSupported", v)} />
                <CheckboxToggle label="Active" checked={!!form.isActive} onChange={(v) => setField("isActive", v)} />
              </div>
            </Section>

            {/* DESCRIPTIONS */}
            <Section title="Descriptions" icon="description">
              <Field label="Short Description">
                <Input value={form.description as string} onChange={(e) => setField("description", e.target.value)} placeholder="One-liner shown on product cards" />
              </Field>
              <Field label="Long Description" hint="Supports line breaks. Shown in the detail page's 'About this product' section.">
                <Textarea rows={5} value={form.longDescription as string} onChange={(e) => setField("longDescription", e.target.value)} />
              </Field>
            </Section>

            {/* IMAGES + GALLERY */}
            <Section title="Images & Gallery" icon="image">
              <Field label="Primary Image URL" hint="Used as the cover image on product cards and detail page hero.">
                <Input value={form.imageUrl as string} onChange={(e) => setField("imageUrl", e.target.value)} placeholder="https://…" />
              </Field>
              <GalleryEditor
                items={gallery}
                onChange={setGallery}
                onPromote={(idx) => {
                  if (gallery[idx]) setField("imageUrl", gallery[idx].url);
                }}
              />
            </Section>

            {/* SPECIFICATIONS */}
            <Section title="Technical Specifications" icon="list_alt">
              <ArrayEditor
                items={specs}
                onChange={setSpecs}
                blank={{ property: "", value: "", group: "" }}
                columns={[
                  { key: "property", label: "Property", span: "col-span-3" },
                  { key: "value", label: "Value", span: "col-span-4" },
                  { key: "group", label: "Group", span: "col-span-3" },
                ]}
              />
            </Section>

            {/* FEATURES */}
            <Section title="Features" icon="stars">
              <ArrayEditor
                items={features}
                onChange={setFeatures}
                blank={{ icon: "shield", title: "", description: "" }}
                columns={[
                  { key: "icon", label: "Material Icon", span: "col-span-2" },
                  { key: "title", label: "Title", span: "col-span-3" },
                  { key: "description", label: "Description", span: "col-span-5" },
                ]}
              />
            </Section>

            {/* OPERATING SYSTEMS */}
            <Section title="Operating Systems" icon="devices">
              <ArrayEditor
                items={osList}
                onChange={setOsList}
                blank={{ osName: "", osIcon: "desktop_windows", minVersion: "" }}
                columns={[
                  { key: "osName", label: "OS Name", span: "col-span-4" },
                  { key: "osIcon", label: "Material Icon", span: "col-span-3" },
                  { key: "minVersion", label: "Min Version", span: "col-span-3" },
                ]}
              />
            </Section>

            {/* RESOURCE URLS */}
            <Section title="Resource URLs" icon="link">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Driver Download URL"><Input value={form.driverDownloadUrl as string} onChange={(e) => setField("driverDownloadUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="Manual URL"><Input value={form.manualUrl as string} onChange={(e) => setField("manualUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="Installation Guide URL"><Input value={form.installationGuideUrl as string} onChange={(e) => setField("installationGuideUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="Knowledge Base URL"><Input value={form.knowledgeBaseUrl as string} onChange={(e) => setField("knowledgeBaseUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="Brochure URL"><Input value={form.brochureUrl as string} onChange={(e) => setField("brochureUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="Datasheet URL"><Input value={form.datasheetUrl as string} onChange={(e) => setField("datasheetUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="Warranty PDF URL"><Input value={form.warrantyUrl as string} onChange={(e) => setField("warrantyUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="SDK URL"><Input value={form.sdkUrl as string} onChange={(e) => setField("sdkUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="Utility URL"><Input value={form.utilityUrl as string} onChange={(e) => setField("utilityUrl", e.target.value)} placeholder="https://…" /></Field>
                <Field label="Latest Driver Version"><Input value={form.latestDriverVersion as string} onChange={(e) => setField("latestDriverVersion", e.target.value)} placeholder="v2.4.1" /></Field>
                <Field label="Latest Firmware Version"><Input value={form.latestFirmwareVersion as string} onChange={(e) => setField("latestFirmwareVersion", e.target.value)} placeholder="v1.8.0" /></Field>
              </div>
            </Section>

            {/* MEDIA MANAGER */}
            <Section title="Media Manager" icon="attach_file" hint="Add brochure, datasheet, warranty, SDK, utility, image, or video files. Each file is shown as a download card on the detail page.">
              <MediaEditor items={media} onChange={setMedia} />
            </Section>

            {/* VIDEOS */}
            <Section title="Videos" icon="videocam" hint="YouTube URLs are auto-embedded; other URLs open in a new tab.">
              <ArrayEditor
                items={videos}
                onChange={setVideos}
                blank={{ title: "", url: "", provider: "youtube", externalId: "" }}
                columns={[
                  { key: "title", label: "Title", span: "col-span-3" },
                  { key: "url", label: "URL", span: "col-span-4" },
                  { key: "provider", label: "Provider", span: "col-span-2" },
                  { key: "externalId", label: "External ID", span: "col-span-3" },
                ]}
              />
            </Section>

            {/* RELATED PRODUCTS */}
            <Section title="Related Products" icon="hub" hint="Select products to show in the 'Related Products' section of the detail page.">
              <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-qbit-outline-variant p-3 md:grid-cols-3">
                {allProducts.length === 0 ? (
                  <p className="col-span-full py-4 text-center text-xs text-qbit-on-surface-variant">No other products to relate.</p>
                ) : (
                  allProducts.map((p) => (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                        selectedRelated.has(p.id)
                          ? "border-qbit-primary bg-qbit-primary/5 text-qbit-primary"
                          : "border-qbit-outline-variant text-qbit-on-surface-variant"
                      }`}
                    >
                      <Checkbox
                        checked={selectedRelated.has(p.id)}
                        onCheckedChange={(v) => {
                          setSelectedRelated((prev) => {
                            const next = new Set(prev);
                            if (v) next.add(p.id); else next.delete(p.id);
                            return next;
                          });
                        }}
                      />
                      <span className="truncate">{p.name}</span>
                    </label>
                  ))
                )}
              </div>
            </Section>

            {/* SEO */}
            <Section title="SEO" icon="search">
              <Field label="SEO Title">
                <Input value={form.seoTitle as string} onChange={(e) => setField("seoTitle", e.target.value)} />
              </Field>
              <Field label="SEO Description">
                <Textarea rows={2} value={form.seoDescription as string} onChange={(e) => setField("seoDescription", e.target.value)} />
              </Field>
              <Field label="SEO Keywords (comma-separated)">
                <Input value={form.seoKeywords as string} onChange={(e) => setField("seoKeywords", e.target.value)} />
              </Field>
            </Section>

            {/* TAGS + COMPATIBLE */}
            <Section title="Tags & Compatibility" icon="sell">
              <Field label="Tags (comma-separated)">
                <Input value={form.tags as string} onChange={(e) => setField("tags", e.target.value)} />
              </Field>
              <Field label="Compatible Devices (comma-separated)">
                <Input value={form.compatibleDevices as string} onChange={(e) => setField("compatibleDevices", e.target.value)} />
              </Field>
            </Section>

            {/* QR + URL PREVIEW */}
            <Section title="QR Code & Public URL" icon="qr_code">
              <Field label="QR Code URL" hint="Auto-generated from the slug. Scan the QR to open the public detail page.">
                <Input value={form.qrCodeUrl as string} onChange={(e) => setField("qrCodeUrl", e.target.value)} readOnly />
              </Field>
              {product.slug && (
                <a
                  href={`/products/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-qbit-primary hover:underline"
                >
                  Open public page <Icon name="open_in_new" className="text-[14px]" />
                </a>
              )}
            </Section>
          </div>
        )}

        <DialogFooter className="gap-2">
          <QbitButton variant="ghost" onClick={onClose}>Cancel</QbitButton>
          <QbitButton variant="primary" icon={saving ? "progress_activity" : "save"} disabled={saving || loading} onClick={handleSave}>
            {saving ? "Saving…" : "Save Changes"}
          </QbitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Helper sub-components                                              */
/* ------------------------------------------------------------------ */

function Section({ title, icon, hint, children }: { title: string; icon: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-qbit-outline-variant/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon name={icon} className="text-[20px] text-qbit-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">{title}</h3>
      </div>
      {hint && <p className="mb-3 text-xs text-qbit-on-surface-variant">{hint}</p>}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-qbit-on-surface-variant">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-qbit-on-surface-variant/70">{hint}</p>}
    </div>
  );
}

function CheckboxToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-qbit-on-surface-variant">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      {label}
    </label>
  );
}

interface Column {
  key: string;
  label: string;
  span: string;
}

function ArrayEditor<T>({
  items, onChange, blank, columns,
}: {
  items: T[]; onChange: (items: T[]) => void; blank: T; columns: Column[];
}) {
  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="rounded-md border border-dashed border-qbit-outline-variant px-3 py-3 text-center text-xs text-qbit-on-surface-variant">
          No entries yet. Click "Add row" below.
        </p>
      )}
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-md border border-qbit-outline-variant/50 p-2">
          {columns.map((c) => (
            <div key={c.key} className={c.span}>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">{c.label}</label>
              <Input
                value={String((item as Record<string, unknown>)[c.key] ?? "")}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...item, [c.key]: e.target.value } as T;
                  onChange(next);
                }}
                className="h-8 text-xs"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="col-span-12 flex items-center justify-center rounded-md border border-qbit-error/30 py-1 text-xs text-qbit-error hover:bg-qbit-error/5"
            aria-label="Remove row"
          >
            <Icon name="delete" className="text-[16px]" />
          </button>
        </div>
      ))}
      <QbitButton
        variant="outline"
        size="sm"
        icon="add"
        onClick={() => onChange([...items, { ...blank }])}
      >
        Add row
      </QbitButton>
    </div>
  );
}

function GalleryEditor({
  items, onChange, onPromote,
}: {
  items: GalleryImage[]; onChange: (items: GalleryImage[]) => void; onPromote: (idx: number) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((img, i) => (
        <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-md border border-qbit-outline-variant/50 p-2">
          <div className="col-span-9">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Image URL</label>
            <Input
              value={img.url}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...img, url: e.target.value };
                onChange(next);
              }}
              className="h-8 text-xs"
            />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Alt text</label>
            <Input
              value={img.alt}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...img, alt: e.target.value };
                onChange(next);
              }}
              className="h-8 text-xs"
            />
          </div>
          <div className="col-span-12 flex gap-2">
            <button
              type="button"
              onClick={() => onPromote(i)}
              className="flex items-center gap-1 rounded-md border border-qbit-outline-variant px-2 py-1 text-xs text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"
            >
              <Icon name="star" className="text-[14px]" /> Set as cover
            </button>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="flex items-center gap-1 rounded-md border border-qbit-error/30 px-2 py-1 text-xs text-qbit-error hover:bg-qbit-error/5"
            >
              <Icon name="delete" className="text-[14px]" /> Remove
            </button>
          </div>
        </div>
      ))}
      <QbitButton
        variant="outline"
        size="sm"
        icon="add"
        onClick={() => onChange([...items, { url: "", alt: "" }])}
      >
        Add image
      </QbitButton>
    </div>
  );
}

function MediaEditor({ items, onChange }: { items: MediaFile[]; onChange: (items: MediaFile[]) => void }) {
  const types = ["image", "brochure", "datasheet", "warranty", "sdk", "utility", "video", "manual", "firmware", "driver", "other"];
  return (
    <div className="space-y-2">
      {items.map((m, i) => (
        <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-md border border-qbit-outline-variant/50 p-2">
          <div className="col-span-3">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Type</label>
            <select
              value={m.type}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...m, type: e.target.value };
                onChange(next);
              }}
              className="h-8 w-full rounded-md border border-qbit-outline-variant bg-white px-2 text-xs"
            >
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="col-span-4">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Title</label>
            <Input value={m.title} onChange={(e) => { const n = [...items]; n[i] = { ...m, title: e.target.value }; onChange(n); }} className="h-8 text-xs" />
          </div>
          <div className="col-span-5">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">URL</label>
            <Input value={m.url} onChange={(e) => { const n = [...items]; n[i] = { ...m, url: e.target.value }; onChange(n); }} className="h-8 text-xs" />
          </div>
          <div className="col-span-4">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">MIME</label>
            <Input value={m.mimeType ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...m, mimeType: e.target.value }; onChange(n); }} className="h-8 text-xs" placeholder="application/pdf" />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Alt text</label>
            <Input value={m.altText ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...m, altText: e.target.value }; onChange(n); }} className="h-8 text-xs" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Provider</label>
            <Input value={m.provider ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...m, provider: e.target.value }; onChange(n); }} className="h-8 text-xs" placeholder="youtube" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">Ext. ID</label>
            <Input value={m.externalId ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...m, externalId: e.target.value }; onChange(n); }} className="h-8 text-xs" />
          </div>
          <div className="col-span-1">
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="flex h-8 w-full items-center justify-center rounded-md border border-qbit-error/30 text-qbit-error hover:bg-qbit-error/5"
              aria-label="Remove media"
            >
              <Icon name="delete" className="text-[16px]" />
            </button>
          </div>
        </div>
      ))}
      <QbitButton
        variant="outline"
        size="sm"
        icon="add"
        onClick={() => onChange([...items, { type: "brochure", title: "", url: "" }])}
      >
        Add media file
      </QbitButton>
    </div>
  );
}
