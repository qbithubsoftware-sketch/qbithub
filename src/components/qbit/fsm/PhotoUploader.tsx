"use client";

/**
 * PhotoUploader — multi-category photo capture for a work order.
 *
 * Categories: before, setup, cables, after, issue.
 * Uses native <input type="file" accept="image/*" capture="environment"> so
 * mobile devices open the camera directly. Photos are uploaded as base64
 * data URLs (simple — no cloud storage dependency).
 */

import { useRef, useState } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge } from "@/components/qbit/primitives/StatusBadge";
import { type PhotoCategory } from "@/lib/fsm/types";

interface PhotoEntry {
  id: string;
  category: string;
  storagePath: string;
  caption: string | null;
  capturedAt: string;
}

interface PhotoUploaderProps {
  workOrderId: string;
  photos: PhotoEntry[];
  onUploaded?: (photo: PhotoEntry) => void;
  onError?: (message: string) => void;
}

const CATEGORIES: Array<{ id: PhotoCategory; label: string; icon: string }> = [
  { id: "before", label: "Before Installation", icon: "history_edu" },
  { id: "setup", label: "Printer Setup", icon: "settings" },
  { id: "cables", label: "Cable Connections", icon: "cable" },
  { id: "after", label: "Final Setup", icon: "verified" },
  { id: "issue", label: "Issue / Damage", icon: "report_problem" },
];

export function PhotoUploader({
  workOrderId,
  photos,
  onUploaded,
  onError,
}: PhotoUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState<PhotoCategory>("before");
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      onError?.("Image too large. Max 3MB.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await fetch(`/api/fsm/work-orders/${workOrderId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: activeCategory,
          dataUrl,
          caption: file.name,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Upload failed");
      }
      const { photo } = await res.json();
      onUploaded?.(photo);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const photosForCategory = photos.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategory(c.id)}
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
              (activeCategory === c.id
                ? "border-qbit-primary bg-qbit-primary text-qbit-on-primary"
                : "border-qbit-outline-variant bg-white text-qbit-on-surface-variant hover:bg-qbit-surface-container-low")
            }
          >
            <Icon name={c.icon} className="text-[14px]" />
            {c.label}
            {photos.filter((p) => p.category === c.id).length > 0 && (
              <span
                className={
                  "ml-1 rounded-full px-1.5 text-[10px] font-bold " +
                  (activeCategory === c.id
                    ? "bg-white/20 text-white"
                    : "bg-qbit-primary/10 text-qbit-primary")
                }
              >
                {photos.filter((p) => p.category === c.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Upload button */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <QbitButton
        variant="outline"
        size="sm"
        icon={uploading ? "progress_activity" : "add_a_photo"}
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? "Uploading…" : `Capture ${CATEGORIES.find((c) => c.id === activeCategory)?.label}`}
      </QbitButton>

      {/* Existing photos grid */}
      {photosForCategory.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photosForCategory.map((p) => (
            <a
              key={p.id}
              href={p.storagePath}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.storagePath}
                alt={p.caption ?? p.category}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                <p className="truncate text-[10px] text-white">{p.caption ?? p.category}</p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-qbit-outline-variant bg-qbit-surface-container-low/40 px-4 py-6 text-center">
          <Icon name="image" className="mx-auto text-[32px] text-qbit-on-surface-variant/40" />
          <p className="mt-2 text-xs text-qbit-on-surface-variant">
            No photos captured yet for this category.
          </p>
        </div>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export { StatusBadge };
