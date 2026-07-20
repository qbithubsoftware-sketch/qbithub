"use client";

/**
 * GlobalResourceLibrary — V5 centralized shared resource library.
 *
 * MASTER STORAGE for every downloadable resource. Resources exist ONCE here
 * and are linked to products via ProductResourceMapping (many-to-many).
 *
 * FEATURES:
 *   - List all resources (searchable, filterable by type)
 *   - Create new resource (with client-side image compression for thumbnails)
 *   - Edit resource (update name, version, file URL, description, etc.)
 *   - Delete resource (cascade-deletes product mappings)
 *   - Usage info: "Used by N products" + view linked products
 *   - Duplicate protection (name + version must be unique)
 *   - Download count, release date, status, visibility per resource
 *
 * WORKFLOW:
 *   1. Admin uploads a resource ONCE (e.g. "4Barcode APK v2.4")
 *   2. Resource appears in the library
 *   3. Admin opens Product Master → Edit Product → Resource Mapping section
 *   4. Multi-select dropdown shows all library resources (filtered by type + category)
 *   5. Admin selects resources → they're linked to the product
 *   6. If resource version changes → update ONCE in library → ALL linked products get the update
 */

import { useCallback, useEffect, useState, useRef } from "react";
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
import { compressImageToDataUrl, validateImageFile, formatFileSize } from "@/lib/images/compress";

interface GlobalResource {
  id: string;
  name: string;
  type: string;
  version: string | null;
  description: string | null;
  supportedCategories: string | null;
  url: string;
  mimeType: string | null;
  fileSize: number | null;
  thumbnailUrl: string | null;
  releaseDate: string | null;
  status: string;
  downloadCount: number;
  createdBy: string | null;
  updatedBy: string | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  usedByCount: number;
}

const RESOURCE_TYPES = [
  { value: "windows_driver", label: "Windows Drivers", icon: "memory" },
  { value: "windows_software", label: "Windows Software", icon: "apps" },
  { value: "android_software", label: "Android APKs", icon: "phone_android" },
  { value: "firmware", label: "Firmware", icon: "upgrade" },
  { value: "sdk", label: "SDK", icon: "code" },
  { value: "manual", label: "User Manuals", icon: "menu_book" },
  { value: "installation_guide", label: "Installation Guides", icon: "menu_book" },
  { value: "troubleshooting", label: "Troubleshooting Docs", icon: "build" },
  { value: "video", label: "Videos", icon: "videocam" },
  { value: "browser_utility", label: "Browser Utilities", icon: "apps" },
  { value: "maintenance_tool", label: "Maintenance Tools", icon: "build" },
  { value: "pos_utility", label: "POS Utilities", icon: "point_of_sale" },
  { value: "other", label: "Other", icon: "attach_file" },
];

function iconForType(type: string): string {
  return RESOURCE_TYPES.find((t) => t.value === type)?.icon ?? "attach_file";
}

function labelForType(type: string): string {
  return RESOURCE_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function GlobalResourceLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentScreen = useNavigation((s) => s.current);

  const [resources, setResources] = useState<GlobalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingResource, setEditingResource] = useState<GlobalResource | null>(null);
  const [viewingUsage, setViewingUsage] = useState<GlobalResource | null>(null);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/admin/resources?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResources(data.items ?? []);
    } catch {
      toast({ title: "Failed to load resources", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, toast]);

  useEffect(() => { void fetchResources(); }, [fetchResources]);

  async function handleDelete(r: GlobalResource) {
    if (!confirm(`Delete "${r.name}"? This will unlink it from ${r.usedByCount} product(s).`)) return;
    try {
      const res = await fetch(`/api/admin/resources/${r.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Resource deleted", description: r.name });
      void fetchResources();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  const filtered = resources.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || (r.version ?? "").toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  // Group by type for display
  const grouped: Record<string, GlobalResource[]> = {};
  for (const r of filtered) {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  }

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Global Resource Library", icon: "library_books" }}
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
              <Icon name="library_books" className="text-[28px] text-qbit-primary" />
              Global Resource Library
            </h2>
            <p className="mt-1 text-sm text-qbit-on-surface-variant">
              Master storage for all downloadable resources. Upload once, link to unlimited products.
            </p>
          </div>
          <div className="flex gap-2">
            {resources.length > 0 && (
              <QbitButton variant="ghost" icon="delete_sweep" onClick={async () => {
                if (!confirm(`Delete ALL ${resources.length} resources from the library? This will unlink them from all products. This cannot be undone.`)) return;
                try {
                  let deleted = 0;
                  for (const r of resources) {
                    const res = await fetch(`/api/admin/resources/${r.id}`, { method: "DELETE" });
                    if (res.ok) deleted++;
                  }
                  toast({ title: `Deleted ${deleted} resources`, description: "Library is now empty. Add real resources to start fresh." });
                  void fetchResources();
                } catch {
                  toast({ title: "Bulk delete failed", variant: "destructive" });
                }
              }}>
                Delete All
              </QbitButton>
            )}
            <QbitButton variant="primary" icon="add_circle" onClick={() => setShowCreate(true)}>
              Add Resource
            </QbitButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-qbit-outline-variant/50 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Total Resources</p>
            <p className="mt-1 text-2xl font-bold text-qbit-on-surface">{resources.length}</p>
          </div>
          <div className="rounded-xl border border-qbit-outline-variant/50 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Resource Types</p>
            <p className="mt-1 text-2xl font-bold text-qbit-on-surface">{Object.keys(grouped).length}</p>
          </div>
          <div className="rounded-xl border border-qbit-outline-variant/50 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Total Mappings</p>
            <p className="mt-1 text-2xl font-bold text-qbit-on-surface">{resources.reduce((a, r) => a + r.usedByCount, 0)}</p>
          </div>
          <div className="rounded-xl border border-qbit-outline-variant/50 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Total Downloads</p>
            <p className="mt-1 text-2xl font-bold text-qbit-on-surface">{resources.reduce((a, r) => a + r.downloadCount, 0)}</p>
          </div>
        </div>

        {/* Search + Filter */}
        <SurfaceCard className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input type="text" placeholder="Search by name, version, or description…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm">
                <option value="">All types ({resources.length})</option>
                {RESOURCE_TYPES.map((t) => {
                  const count = resources.filter((r) => r.type === t.value).length;
                  return count > 0 ? <option key={t.value} value={t.value}>{t.label} ({count})</option> : null;
                })}
              </select>
            </div>
          </div>
        </SurfaceCard>

        {/* Resource list grouped by type */}
        {loading ? (
          <SurfaceCard className="p-12 text-center">
            <Icon name="progress_activity" className="mx-auto animate-spin text-[40px] text-qbit-primary" />
          </SurfaceCard>
        ) : filtered.length === 0 ? (
          <SurfaceCard className="p-12 text-center">
            <Icon name="library_books" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
            <p className="mt-3 text-sm font-medium text-qbit-on-surface">No resources in the library yet.</p>
            <p className="mt-1 text-xs text-qbit-on-surface-variant">Click "Add Resource" to upload your first shared resource.</p>
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([type, items]) => (
              <SurfaceCard key={type} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-qbit-outline-variant/50 bg-qbit-surface-container-low/50 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name={iconForType(type)} className="text-[20px] text-qbit-primary" />
                    <h3 className="text-sm font-bold text-qbit-on-surface">{labelForType(type)}</h3>
                  </div>
                  <span className="rounded-md bg-qbit-primary/10 px-2 py-0.5 text-[11px] font-bold text-qbit-primary">{items.length}</span>
                </div>
                <div className="divide-y divide-qbit-outline-variant/30">
                  {items.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-qbit-surface-container-low/30">
                      <Icon name={iconForType(r.type)} className="text-[20px] text-qbit-on-surface-variant shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-qbit-on-surface">{r.name}</p>
                          {r.version && <span className="shrink-0 rounded bg-qbit-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-qbit-primary">{r.version}</span>}
                          {r.status === "deprecated" && <span className="shrink-0 rounded bg-qbit-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-qbit-warning">Deprecated</span>}
                        </div>
                        {r.description && <p className="truncate text-[11px] text-qbit-on-surface-variant">{r.description}</p>}
                        <div className="mt-0.5 flex items-center gap-3 text-[10px] text-qbit-on-surface-variant/70">
                          <span className="flex items-center gap-0.5"><Icon name="link" className="text-[12px]" /> {r.usedByCount} product{r.usedByCount !== 1 ? "s" : ""}</span>
                          <span className="flex items-center gap-0.5"><Icon name="download" className="text-[12px]" /> {r.downloadCount} downloads</span>
                          {r.fileSize && <span>{formatFileSize(r.fileSize)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewingUsage(r)} className="rounded p-1.5 text-qbit-on-surface-variant hover:bg-qbit-surface-container-high" title="View linked products">
                          <Icon name="visibility" className="text-[18px]" />
                        </button>
                        <button onClick={() => setEditingResource(r)} className="rounded p-1.5 text-qbit-on-surface-variant hover:bg-qbit-surface-container-high" title="Edit">
                          <Icon name="edit" className="text-[18px]" />
                        </button>
                        <a
                          href={`/api/admin/resources/${r.id}?download=true`}
                          className="rounded p-1.5 text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
                          title="Download"
                        >
                          <Icon name={r.type === "video" ? "open_in_new" : "download"} className="text-[18px]" />
                        </a>
                        <button onClick={() => handleDelete(r)} className="rounded p-1.5 text-qbit-error hover:bg-qbit-error/10" title="Delete">
                          <Icon name="delete" className="text-[18px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}

        {/* Create/Edit modal */}
        {showCreate && (
          <ResourceFormModal
            resource={null}
            onClose={() => setShowCreate(false)}
            onSaved={() => { setShowCreate(false); void fetchResources(); }}
          />
        )}
        {editingResource && (
          <ResourceFormModal
            resource={editingResource}
            onClose={() => setEditingResource(null)}
            onSaved={() => { setEditingResource(null); void fetchResources(); }}
          />
        )}

        {/* Usage viewer modal */}
        {viewingUsage && (
          <ResourceUsageModal resource={viewingUsage} onClose={() => setViewingUsage(null)} />
        )}
      </div>
    </AppShell>
  );
}

// ====================== Resource Form Modal (Create/Edit) ======================
function ResourceFormModal({ resource, onClose, onSaved }: { resource: GlobalResource | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: resource?.name ?? "",
    type: resource?.type ?? "windows_driver",
    version: resource?.version ?? "",
    description: resource?.description ?? "",
    supportedCategories: resource?.supportedCategories ?? "",
    url: resource?.url ?? "",
    urlType: (resource as Record<string, unknown> | null)?.urlType as string ?? "storage_key",
    mimeType: resource?.mimeType ?? "",
    fileSize: resource?.fileSize ?? 0,
    originalFileName: (resource as Record<string, unknown> | null)?.originalFileName as string ?? "",
    checksum: (resource as Record<string, unknown> | null)?.checksum as string ?? "",
    thumbnailUrl: resource?.thumbnailUrl ?? "",
    releaseDate: resource?.releaseDate ? resource.releaseDate.split("T")[0] : "",
    status: resource?.status ?? "active",
    visibility: resource?.visibility ?? "public",
  });
  const [uploading, setUploading] = useState(false);

  // ===== Category multi-select state =====
  const [allCategories, setAllCategories] = useState<Array<{ slug: string; label: string }>>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const catDropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await fetch("/api/admin/product-categories", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setAllCategories(data.categories ?? []);
      } catch { /* silent */ }
    }
    void fetchCats();
  }, []);

  // Parse existing supportedCategories (comma-separated string) into array
  const selectedCategorySlugs = form.supportedCategories
    ? form.supportedCategories.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  function toggleCategory(slug: string) {
    const current = selectedCategorySlugs;
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    setForm({ ...form, supportedCategories: next.join(",") });
  }

  // Click outside to close category dropdown
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    }
    if (catDropdownOpen) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [catDropdownOpen]);

  const filteredCategories = allCategories.filter((c) =>
    !catSearch || c.label.toLowerCase().includes(catSearch.toLowerCase()) || c.slug.includes(catSearch.toLowerCase())
  );

  const isVideoType = form.type === "video";

  // Auto-fetch YouTube thumbnail from URL
  function extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  function handleVideoUrlChange(url: string) {
    const newForm = { ...form, url, mimeType: "video/youtube" };
    // Auto-fetch thumbnail from YouTube
    const ytId = extractYouTubeId(url);
    if (ytId) {
      newForm.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
    setForm(newForm);
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      // ===== Upload via Storage Service API =====
      // POST file to /api/admin/resources/upload — returns storageKey + checksum
      const formData = new FormData();
      formData.append("file", file);

      console.log(`[FRONTEND-UPLOAD] Sending file: name="${file.name}", type="${file.type}", size=${file.size}`);
      console.log(`[FRONTEND-UPLOAD] FormData keys: [${[...formData.keys()]}]`);

      const res = await fetch("/api/admin/resources/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        // Structured field-level error response:
        //   { success, code, field, expected, received, message, stage, details }
        const errorCode = data?.code ?? "UNKNOWN";
        const errorMsg = data?.message ?? data?.error ?? "Upload failed";
        const errorStage = data?.stage ?? "unknown";
        const errorField = data?.field ?? "";
        const errorExpected = data?.expected ?? "";
        const errorReceived = data?.received ?? "";

        // Build a human-readable error with field-level detail
        let detail = errorMsg;
        if (errorField && errorExpected && errorReceived) {
          detail = `${errorMsg} (field: "${errorField}", expected: ${errorExpected}, received: ${errorReceived})`;
        }
        console.error(`[FRONTEND-UPLOAD] Upload failed: [${errorCode}] ${detail} (at ${errorStage})`);
        console.error(`[FRONTEND-UPLOAD] Full error response:`, data);
        throw new Error(`[${errorCode}] ${detail} (at ${errorStage})`);
      }
      // Store the storageKey + metadata in the form
      setForm({
        ...form,
        url: data.storageKey,
        urlType: data.urlType || "storage_key",
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        originalFileName: data.originalFileName,
        checksum: data.checksum,
      });
      toast({
        title: "File uploaded",
        description: `${file.name} (${formatFileSize(file.size)})`,
      });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.url.trim()) {
      toast({ title: "Name and File URL are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        version: form.version || null,
        description: form.description || null,
        supportedCategories: form.supportedCategories || null,
        url: form.url,
        urlType: form.urlType || "storage_key",
        mimeType: form.mimeType || null,
        fileSize: form.fileSize || null,
        originalFileName: form.originalFileName || null,
        checksum: form.checksum || null,
        thumbnailUrl: form.thumbnailUrl || null,
        releaseDate: form.releaseDate || null,
        status: form.status,
        visibility: form.visibility,
      };
      const res = resource
        ? await fetch(`/api/admin/resources/${resource.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/admin/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      if (res.status === 409) {
        const err = await res.json();
        toast({ title: "Duplicate resource", description: err.error, variant: "destructive" });
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Use structured error if available
        const errMsg = err.message ?? err.error ?? "Save failed";
        const errField = err.field ?? "";
        const errCode = err.code ?? "";
        if (errField) {
          throw new Error(`[${errCode}] ${errMsg} (field: "${errField}")`);
        }
        throw new Error(errMsg);
      }
      toast({ title: resource ? "Resource updated" : "Resource created!", description: form.name });
      onSaved();
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 border-b border-qbit-outline-variant bg-white px-5 py-4">
          <h3 className="text-base font-bold text-qbit-on-surface">{resource ? "Edit Resource" : "Add New Resource"}</h3>
          <p className="text-[11px] text-qbit-on-surface-variant">Upload once — link to unlimited products via Product Master</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Resource Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 4Barcode APK" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Resource Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm">
                {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Version</label>
              <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v2.4.1" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Description</label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description…" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Supported Categories</label>
              <p className="mb-2 text-[10px] text-qbit-on-surface-variant">Select product categories where this resource should appear. Leave empty for universal (all categories).</p>

              {/* Selected category chips */}
              {selectedCategorySlugs.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {selectedCategorySlugs.map((slug) => {
                    const cat = allCategories.find((c) => c.slug === slug);
                    return (
                      <span
                        key={slug}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-primary/30 bg-qbit-primary/5 px-2 py-1"
                      >
                        <span className="text-[11px] font-semibold text-qbit-on-surface">{cat?.label ?? slug}</span>
                        <button
                          type="button"
                          onClick={() => toggleCategory(slug)}
                          className="text-qbit-on-surface-variant hover:text-qbit-error"
                        >
                          <Icon name="close" className="text-[14px]" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Dropdown trigger */}
              <div ref={catDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setCatDropdownOpen((o) => !o)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-left transition-all hover:border-qbit-primary/40 ${
                    catDropdownOpen ? "border-qbit-primary ring-2 ring-qbit-primary/20" : "border-qbit-outline-variant"
                  }`}
                >
                  <span className="text-sm text-qbit-on-surface-variant">
                    {selectedCategorySlugs.length === 0 ? "Select categories (empty = universal)…" : `${selectedCategorySlugs.length} selected`}
                  </span>
                  <Icon name={catDropdownOpen ? "expand_less" : "expand_more"} className="text-[18px] text-qbit-on-surface-variant shrink-0" />
                </button>

                {catDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-qbit-outline-variant bg-white shadow-2xl">
                    {/* Search */}
                    <div className="border-b border-qbit-outline-variant/50 p-2">
                      <div className="relative">
                        <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-qbit-on-surface-variant" />
                        <input
                          type="text"
                          value={catSearch}
                          onChange={(e) => setCatSearch(e.target.value)}
                          placeholder="Search categories…"
                          className="w-full rounded-md border border-qbit-outline-variant bg-qbit-surface-container-low py-2 pl-8 pr-3 text-sm focus:border-qbit-primary focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Options */}
                    <ul className="max-h-48 overflow-y-auto py-1">
                      {filteredCategories.length === 0 ? (
                        <li className="px-3 py-3 text-center text-xs text-qbit-on-surface-variant">No categories found.</li>
                      ) : (
                        filteredCategories.map((c) => {
                          const isSelected = selectedCategorySlugs.includes(c.slug);
                          return (
                            <li key={c.slug}>
                              <button
                                type="button"
                                onClick={() => toggleCategory(c.slug)}
                                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                                  isSelected ? "bg-qbit-primary/5" : "hover:bg-qbit-surface-container-low"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="h-4 w-4 rounded border-qbit-outline-variant text-qbit-primary"
                                />
                                <span className="text-sm font-medium text-qbit-on-surface">{c.label}</span>
                                <span className="ml-auto text-[10px] text-qbit-on-surface-variant/60">{c.slug}</span>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>

                    {/* Footer */}
                    <div className="border-t border-qbit-outline-variant/50 bg-qbit-surface-container-low/50 px-3 py-1.5 text-[10px] text-qbit-on-surface-variant">
                      {selectedCategorySlugs.length} selected · Leave empty for universal
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                {isVideoType ? "YouTube Video URL *" : "File *"}
              </label>
              {isVideoType ? (
                <div className="space-y-2">
                  <Input
                    type="url"
                    value={form.url}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-[10px] text-qbit-on-surface-variant">
                    Videos are NOT uploaded to the server — only the YouTube URL is stored.
                    Thumbnail is auto-fetched from YouTube.
                  </p>
                  {form.thumbnailUrl && (
                    <div className="flex items-center gap-2 rounded-md border border-qbit-success/30 bg-qbit-success/5 px-2 py-1.5">
                      <div className="h-10 w-16 shrink-0 overflow-hidden rounded">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.thumbnailUrl} alt="Video thumbnail" className="h-full w-full object-cover" />
                      </div>
                      <p className="text-[10px] text-qbit-on-surface-variant">YouTube thumbnail auto-fetched</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f); }} className="block w-full text-xs text-qbit-on-surface-variant file:mr-3 file:rounded-md file:border-0 file:bg-qbit-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-qbit-on-primary hover:file:bg-qbit-primary-container" />
                  {form.url && (
                    <p className="mt-1.5 flex items-center gap-1 rounded-md border border-qbit-success/30 bg-qbit-success/5 px-2 py-1 text-[10px] text-qbit-on-surface-variant">
                      <Icon name="check_circle" className="text-[12px] text-qbit-success" />
                      File linked ({form.mimeType || "unknown type"}{form.fileSize ? `, ${formatFileSize(form.fileSize)}` : ""})
                    </p>
                  )}
                  {uploading && <p className="mt-1 text-[10px] text-qbit-primary"><Icon name="progress_activity" className="inline animate-spin text-[12px]" /> Processing…</p>}
                </>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Release Date</label>
              <Input type="date" value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm">
                <option value="active">Active</option>
                <option value="deprecated">Deprecated</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Visibility (RBAC)</label>
              <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm">
                <option value="public">Public (everyone)</option>
                <option value="employee">Employee only</option>
                <option value="engineer">Engineer + Admin</option>
                <option value="admin">Admin only</option>
              </select>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-qbit-outline-variant bg-white px-5 py-4">
          <QbitButton variant="ghost" size="sm" onClick={onClose}>Cancel</QbitButton>
          <QbitButton variant="primary" size="sm" icon={saving ? "progress_activity" : "save"} disabled={saving || !form.name || !form.url} onClick={handleSave}>
            {saving ? "Saving…" : resource ? "Update Resource" : "Create Resource"}
          </QbitButton>
        </div>
      </div>
    </div>
  );
}

// ====================== Resource Usage Modal ======================
function ResourceUsageModal({ resource, onClose }: { resource: GlobalResource; onClose: () => void }) {
  const [products, setProducts] = useState<Array<{ id: string; name: string; model: string; brand: string; category: string | null; imageUrl: string | null; slug: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`/api/admin/resources/${resource.id}/products`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setProducts(data.products ?? []);
      } catch { /* ignore */ } finally { setLoading(false); }
    }
    void fetchProducts();
  }, [resource.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-qbit-outline-variant px-5 py-4">
          <h3 className="text-base font-bold text-qbit-on-surface">Linked Products</h3>
          <p className="text-[11px] text-qbit-on-surface-variant">{resource.name} {resource.version && `(${resource.version})`}</p>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="py-8 text-center"><Icon name="progress_activity" className="mx-auto animate-spin text-[28px] text-qbit-primary" /></div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center">
              <Icon name="link_off" className="mx-auto text-[32px] text-qbit-on-surface-variant/40" />
              <p className="mt-2 text-sm text-qbit-on-surface-variant">This resource is not linked to any product yet.</p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs font-semibold text-qbit-on-surface-variant">Used by {products.length} product{products.length !== 1 ? "s" : ""}:</p>
              <ul className="space-y-2">
                {products.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-lg border border-qbit-outline-variant/50 bg-white p-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-qbit-primary/10">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Icon name="inventory_2" className="text-[16px] text-qbit-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-qbit-on-surface">{p.name}</p>
                      <p className="text-[10px] text-qbit-on-surface-variant">{p.brand} · {p.model}</p>
                    </div>
                    <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-qbit-primary hover:underline">
                      <Icon name="open_in_new" className="text-[16px]" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="flex justify-end border-t border-qbit-outline-variant px-5 py-4">
          <QbitButton variant="ghost" size="sm" onClick={onClose}>Close</QbitButton>
        </div>
      </div>
    </div>
  );
}
