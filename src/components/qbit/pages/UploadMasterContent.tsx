"use client";

/**
 * UploadMasterContent — renders the upload form + file list in the main
 * content area based on which Upload Master category was selected from
 * the sidebar tree.
 *
 * The sidebar tree (in Sidebar.tsx) navigates to upload-* screen IDs.
 * The /portal switch routes all upload-* screens to this component.
 * It reads the current screen ID from the navigation store and renders
 * the appropriate form + file list.
 *
 * NO separate Upload Master page — everything is inline in the main
 * content area, exactly like Synology DSM or Microsoft 365 Admin Center.
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

// Category config per upload screen
const UPLOAD_CONFIG: Record<string, {
  title: string;
  categoryLabel: string;
  icon: string;
  fileType: string;
  acceptTypes: string;
  fields: { name: string; label: string; required?: boolean }[];
}> = {
  "upload-driver": {
    title: "Driver Upload",
    categoryLabel: "Driver",
    icon: "memory",
    fileType: "driver",
    acceptTypes: ".zip,.rar,.exe,.msi,.inf,.bin",
    fields: [
      { name: "driverName", label: "Driver Name", required: true },
      { name: "driverVersion", label: "Driver Version", required: true },
      { name: "driverDescription", label: "Driver Description" },
    ],
  },
  "upload-manual": {
    title: "User Manual Upload",
    categoryLabel: "Manual",
    icon: "menu_book",
    fileType: "manual",
    acceptTypes: ".pdf,.doc,.docx",
    fields: [
      { name: "manualName", label: "Manual Name", required: true },
      { name: "manualVersion", label: "Manual Version" },
      { name: "manualDescription", label: "Manual Description" },
    ],
  },
  "upload-guide": {
    title: "Installation Guide Upload",
    categoryLabel: "Guide",
    icon: "menu_book",
    fileType: "manual",
    acceptTypes: ".pdf,.doc,.docx",
    fields: [
      { name: "guideName", label: "Guide Name", required: true },
      { name: "guideVersion", label: "Guide Version" },
      { name: "guideDescription", label: "Guide Description" },
    ],
  },
  "upload-firmware": {
    title: "Firmware Upload",
    categoryLabel: "Firmware",
    icon: "upgrade",
    fileType: "firmware",
    acceptTypes: ".bin,.img,.iso,.zip",
    fields: [
      { name: "firmwareName", label: "Firmware Name", required: true },
      { name: "firmwareVersion", label: "Firmware Version", required: true },
      { name: "firmwareDescription", label: "Firmware Description" },
    ],
  },
  "upload-sdk": {
    title: "SDK Upload",
    categoryLabel: "SDK",
    icon: "code",
    fileType: "sdk",
    acceptTypes: ".zip,.rar,.tar,.gz",
    fields: [
      { name: "sdkName", label: "SDK Name", required: true },
      { name: "sdkVersion", label: "SDK Version", required: true },
      { name: "sdkDescription", label: "SDK Description" },
    ],
  },
  "upload-brochure": {
    title: "Brochure Upload",
    categoryLabel: "Brochure",
    icon: "picture_as_pdf",
    fileType: "brochure",
    acceptTypes: ".pdf,.jpg,.png",
    fields: [
      { name: "brochureName", label: "Brochure Name", required: true },
      { name: "brochureDescription", label: "Brochure Description" },
    ],
  },
  "upload-datasheet": {
    title: "Datasheet Upload",
    categoryLabel: "Datasheet",
    icon: "article",
    fileType: "datasheet",
    acceptTypes: ".pdf,.doc,.docx",
    fields: [
      { name: "datasheetName", label: "Datasheet Name", required: true },
      { name: "datasheetDescription", label: "Datasheet Description" },
    ],
  },
  "upload-warranty": {
    title: "Warranty PDF Upload",
    categoryLabel: "Warranty",
    icon: "verified_user",
    fileType: "warranty",
    acceptTypes: ".pdf",
    fields: [
      { name: "warrantyName", label: "Warranty Document Name", required: true },
      { name: "warrantyDescription", label: "Warranty Description" },
    ],
  },
  "upload-video": {
    title: "Video Upload",
    categoryLabel: "Video",
    icon: "videocam",
    fileType: "video",
    acceptTypes: "url",
    fields: [
      { name: "videoTitle", label: "Video Title", required: true },
      { name: "videoUrl", label: "Video URL (YouTube/Vimeo)", required: true },
      { name: "videoDescription", label: "Video Description" },
    ],
  },
  "upload-certificate": {
    title: "Certificates Upload",
    categoryLabel: "Certificate",
    icon: "workspace_premium",
    fileType: "other",
    acceptTypes: ".pdf,.jpg,.png",
    fields: [
      { name: "certName", label: "Certificate Name", required: true },
      { name: "certDescription", label: "Certificate Description" },
    ],
  },
};

const PRODUCT_CATEGORIES = [
  "Printer", "Barcode Scanner", "POS Machine", "Android POS", "Windows POS",
  "Thermal Printer", "Label Printer", "Cash Drawer", "Customer Display",
  "Kitchen Display", "Touch Monitor", "Weighing Scale", "Accessories",
  "Network Device", "Other",
];

const OS_OPTIONS = [
  "Windows 11", "Windows 10", "Windows 8", "Windows 7",
  "Linux", "Ubuntu", "Android", "MacOS", "Other",
];

const SAMPLE_MODELS = [
  "P80", "P58", "LP220", "QBIT POS Lite", "QBIT POS Pro",
  "KDS1500", "Scanner X10", "T-800", "HUB-X Pro", "CD-410",
];

export function UploadMasterContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentScreen = useNavigation((s) => s.current);

  const config = UPLOAD_CONFIG[currentScreen] ?? UPLOAD_CONFIG["upload-driver"];

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [selectedOS, setSelectedOS] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  function toggleModel(model: string) {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(model)) next.delete(model); else next.add(model);
      return next;
    });
  }

  function toggleOS(os: string) {
    setSelectedOS((prev) => {
      const next = new Set(prev);
      if (next.has(os)) next.delete(os); else next.add(os);
      return next;
    });
  }

  async function handleUpload() {
    // Validate required fields
    for (const field of config.fields) {
      if (field.required && !formData[field.name]) {
        toast({ title: `${field.label} is required`, variant: "destructive" });
        return;
      }
    }
    if (config.acceptTypes !== "url" && !selectedFile) {
      toast({ title: "Please select a file to upload", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // In production, this would upload to cloud storage and create a
      // ProductMedia record linked to selected models. For now, show success.
      await new Promise((r) => setTimeout(r, 1500)); // simulate upload
      toast({
        title: "Upload complete!",
        description: `${config.title} — ${formData[config.fields[0].name] ?? "File"} uploaded successfully.`,
      });
      // Reset form
      setFormData({});
      setSelectedModels(new Set());
      setSelectedOS(new Set());
      setSelectedCategory("");
      setSelectedFile(null);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Upload Master", icon: "folder_open" }}
      navItems={ADMIN_NAV}
      activeScreen={currentScreen}
      user={{ name: userName, role: "Administrator", initials }}
      topBar={{ searchPlaceholder: `Search ${config.title}…`, user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-qbit-on-surface">
            <Icon name={config.icon} className="text-[28px] text-qbit-primary" />
            {config.title}
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Upload {config.categoryLabel.toLowerCase()} files. Select compatible product models and operating systems for auto-linking.
          </p>
        </div>

        {/* Upload form */}
        <SurfaceCard className="p-6">
          {/* Basic fields */}
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="info" className="text-[20px] text-qbit-primary" /> {config.categoryLabel} Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {config.fields.map((field) => (
              <div key={field.name} className={field.name.includes("Description") ? "col-span-2" : ""}>
                <label className="mb-1 block text-sm font-medium">
                  {field.label}{field.required && <span className="text-qbit-error"> *</span>}
                </label>
                {field.name.includes("Description") ? (
                  <Textarea
                    rows={2}
                    value={formData[field.name] ?? ""}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}…`}
                  />
                ) : (
                  <Input
                    value={formData[field.name] ?? ""}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}…`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Category dropdown */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-qbit-outline-variant bg-white px-3 py-2 text-sm"
            >
              <option value="">Select category…</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Model compatibility */}
          <div className="mt-4 border-t border-qbit-outline-variant/50 pt-4">
            <label className="mb-2 block text-sm font-medium">Model Compatibility (multi-select)</label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_MODELS.map((model) => (
                <label
                  key={model}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedModels.has(model)
                      ? "border-qbit-primary bg-qbit-primary/10 text-qbit-primary"
                      : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"
                  }`}
                >
                  <Checkbox checked={selectedModels.has(model)} onCheckedChange={() => toggleModel(model)} />
                  {model}
                </label>
              ))}
            </div>
          </div>

          {/* Operating System */}
          <div className="mt-4 border-t border-qbit-outline-variant/50 pt-4">
            <label className="mb-2 block text-sm font-medium">Operating System (multi-select)</label>
            <div className="flex flex-wrap gap-2">
              {OS_OPTIONS.map((os) => (
                <label
                  key={os}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedOS.has(os)
                      ? "border-qbit-primary bg-qbit-primary/10 text-qbit-primary"
                      : "border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"
                  }`}
                >
                  <Checkbox checked={selectedOS.has(os)} onCheckedChange={() => toggleOS(os)} />
                  {os}
                </label>
              ))}
            </div>
          </div>

          {/* File upload */}
          {config.acceptTypes !== "url" && (
            <div className="mt-4 border-t border-qbit-outline-variant/50 pt-4">
              <label className="mb-2 block text-sm font-medium">File Upload</label>
              <div className="rounded-xl border-2 border-dashed border-qbit-outline-variant p-6 text-center transition-colors hover:border-qbit-primary/40">
                <input
                  type="file"
                  accept={config.acceptTypes}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Icon name="cloud_upload" className="mx-auto text-[48px] text-qbit-on-surface-variant/40" />
                  <p className="mt-2 text-sm font-medium text-qbit-on-surface">
                    {selectedFile ? selectedFile.name : "Click to select file"}
                  </p>
                  <p className="mt-1 text-xs text-qbit-on-surface-variant">
                    Supported: {config.acceptTypes}
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Sticky action bar */}
          <div className="mt-6 flex justify-end gap-3">
            <QbitButton
              variant="primary"
              icon={uploading ? "progress_activity" : "cloud_upload"}
              disabled={uploading}
              onClick={handleUpload}
            >
              {uploading ? "Uploading…" : `Upload ${config.categoryLabel}`}
            </QbitButton>
          </div>
        </SurfaceCard>

        {/* Uploaded files list (placeholder) */}
        <SurfaceCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-qbit-on-surface">
            <Icon name="folder_open" className="text-[20px] text-qbit-primary" /> Uploaded {config.categoryLabel}s
          </h3>
          <div className="rounded-xl border border-dashed border-qbit-outline-variant px-6 py-8 text-center">
            <Icon name="folder_off" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
            <p className="mt-2 text-sm font-medium text-qbit-on-surface">No {config.categoryLabel.toLowerCase()}s uploaded yet.</p>
            <p className="mt-1 text-xs text-qbit-on-surface-variant">Upload a file above to see it listed here.</p>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
