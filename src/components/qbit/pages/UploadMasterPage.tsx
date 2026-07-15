"use client";

/**
 * UploadMasterPage — organized resource library.
 *
 * Displays all uploaded resources (drivers, manuals, videos, documents)
 * in a tree-like expandable structure. Clicking a category shows all
 * files of that type across all products.
 *
 * Reuses existing AppShell + SurfaceCard + table pattern.
 */

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/qbit/shells/AppShell";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import { useAuth } from "@/lib/auth/use-auth";
import { useToast } from "@/hooks/use-toast";

interface MediaFile {
  id: string;
  type: string;
  title: string;
  url: string;
  mimeType: string | null;
  productId: string;
  productName: string;
  productModel: string;
  createdAt: string;
}

const TREE = [
  {
    label: "Drivers",
    icon: "memory",
    color: "bg-qbit-primary/10 text-qbit-primary",
    children: [
      { label: "Windows Driver", type: "driver", icon: "desktop_windows" },
      { label: "Windows 11 Driver", type: "driver", icon: "desktop_windows" },
      { label: "Windows 10 Driver", type: "driver", icon: "desktop_windows" },
      { label: "Android Driver", type: "driver", icon: "phone_android" },
      { label: "Linux Driver", type: "driver", icon: "terminal" },
      { label: "Mac Driver", type: "driver", icon: "laptop_mac" },
      { label: "Firmware", type: "firmware", icon: "upgrade" },
      { label: "SDK", type: "sdk", icon: "code" },
      { label: "Utility", type: "utility", icon: "build" },
      { label: "OPOS", type: "driver", icon: "point_of_sale" },
      { label: "JavaPOS", type: "driver", icon: "coffee" },
    ],
  },
  {
    label: "Manuals",
    icon: "menu_book",
    color: "bg-qbit-tertiary/10 text-qbit-tertiary",
    children: [
      { label: "User Manual", type: "manual", icon: "description" },
      { label: "Installation Guide", type: "manual", icon: "menu_book" },
      { label: "Quick Start Guide", type: "manual", icon: "flash_on" },
      { label: "Datasheet", type: "datasheet", icon: "article" },
      { label: "Warranty PDF", type: "warranty", icon: "verified_user" },
      { label: "Brochure", type: "brochure", icon: "picture_as_pdf" },
    ],
  },
  {
    label: "Videos",
    icon: "videocam",
    color: "bg-qbit-secondary/10 text-qbit-secondary",
    children: [
      { label: "Product Demo", type: "video", icon: "play_circle" },
      { label: "Installation Video", type: "video", icon: "build" },
      { label: "Training Video", type: "video", icon: "school" },
      { label: "YouTube Links", type: "video", icon: "smart_display" },
    ],
  },
  {
    label: "Documents",
    icon: "folder",
    color: "bg-qbit-primary/10 text-qbit-primary",
    children: [
      { label: "Certificates", type: "other", icon: "workspace_premium" },
      { label: "Compliance", type: "other", icon: "gavel" },
      { label: "Safety Documents", type: "other", icon: "health_and_safety" },
      { label: "Other Files", type: "other", icon: "attach_file" },
    ],
  },
];

export function UploadMasterPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["Drivers"]));
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);

  const userName = user?.name ?? "Admin";
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const fetchFiles = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media?type=${type}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setFiles(data.items ?? []);
    } catch {
      toast({ title: "Failed to load files", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  function toggleSection(label: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function selectType(type: string, label: string) {
    setSelectedType(label);
    void fetchFiles(type);
  }

  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Upload Master", icon: "folder_open" }}
      navItems={ADMIN_NAV}
      activeScreen="upload-master"
      user={{ name: userName, role: "Administrator", initials }}
      topBar={{ searchPlaceholder: "Search resources…", user: { name: userName, role: "Administrator", initials } }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-qbit-on-surface">
            <Icon name="folder_open" className="text-[28px] text-qbit-primary" />
            Upload Master
          </h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">
            Organized resource library — all uploaded drivers, manuals, videos, and documents across all products.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Tree menu (left) */}
          <div className="lg:col-span-1">
            <SurfaceCard className="p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-qbit-on-surface-variant">Resource Categories</h3>
              <div className="space-y-1">
                {TREE.map((section) => (
                  <div key={section.label}>
                    {/* Section header */}
                    <button
                      type="button"
                      onClick={() => toggleSection(section.label)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        expandedSections.has(section.label)
                          ? "bg-qbit-primary/10 text-qbit-primary"
                          : "text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
                      }`}
                    >
                      <Icon name={expandedSections.has(section.label) ? "expand_more" : "chevron_right"} className="text-[18px]" />
                      <Icon name={section.icon} className="text-[18px]" />
                      {section.label}
                      <span className="ml-auto rounded-full bg-qbit-surface-container-high px-2 py-0.5 text-[10px] font-bold text-qbit-on-surface-variant">{section.children.length}</span>
                    </button>
                    {/* Children */}
                    {expandedSections.has(section.label) && (
                      <div className="ml-6 mt-1 space-y-0.5 border-l border-qbit-outline-variant/30 pl-3">
                        {section.children.map((child) => (
                          <button
                            key={child.label}
                            type="button"
                            onClick={() => selectType(child.type, child.label)}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              selectedType === child.label
                                ? "bg-qbit-primary/10 text-qbit-primary"
                                : "text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
                            }`}
                          >
                            <Icon name={child.icon} className="text-[16px]" />
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>

          {/* File list (right) */}
          <div className="lg:col-span-2">
            {selectedType ? (
              <SurfaceCard className="overflow-hidden">
                <div className="border-b border-qbit-outline-variant/50 px-6 py-4">
                  <h3 className="text-base font-bold text-qbit-on-surface">{selectedType}</h3>
                  <p className="text-xs text-qbit-on-surface-variant">
                    {loading ? "Loading…" : `${files.length} files found`}
                  </p>
                </div>
                {loading ? (
                  <div className="px-6 py-12 text-center">
                    <Icon name="progress_activity" className="mx-auto animate-spin text-[28px] text-qbit-primary" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Icon name="folder_off" className="mx-auto text-[40px] text-qbit-on-surface-variant/40" />
                    <p className="mt-3 text-sm font-medium text-qbit-on-surface">No files uploaded yet for this category.</p>
                    <p className="mt-1 text-xs text-qbit-on-surface-variant">Upload files via the Product Master → Manage button.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-qbit-outline-variant/50 bg-qbit-surface-container-low text-left text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                          <th className="px-4 py-3">File Name</th>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Uploaded</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-qbit-outline-variant/30">
                        {files.map((f) => (
                          <tr key={f.id} className="hover:bg-qbit-surface-container-low/50">
                            <td className="px-4 py-3 text-sm font-medium">{f.title}</td>
                            <td className="px-4 py-3 text-xs">{f.productName} ({f.productModel})</td>
                            <td className="px-4 py-3"><span className="rounded-full bg-qbit-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase">{f.type}</span></td>
                            <td className="px-4 py-3 text-xs">{new Date(f.createdAt).toLocaleDateString("en-IN")}</td>
                            <td className="px-4 py-3 text-right">
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline">
                                <Icon name="download" className="text-[14px]" /> Download
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SurfaceCard>
            ) : (
              <SurfaceCard className="p-12 text-center">
                <Icon name="folder_open" className="mx-auto text-[48px] text-qbit-on-surface-variant/40" />
                <p className="mt-3 text-sm font-medium text-qbit-on-surface">Select a category from the left.</p>
                <p className="mt-1 text-xs text-qbit-on-surface-variant">Click any resource type to view all uploaded files across all products.</p>
              </SurfaceCard>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
