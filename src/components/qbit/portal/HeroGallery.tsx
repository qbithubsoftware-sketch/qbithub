"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * HeroGallery — product image gallery with thumbnails, fullscreen modal,
 * zoom, and lazy loading.
 *
 * Reuses the existing Dialog primitive for the fullscreen viewer.
 */
export function HeroGallery({
  images,
  productName,
}: {
  images: { url: string; alt: string }[];
  productName: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(false);

  const handlePrev = useCallback(() => {
    setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  if (images.length === 0) return null;

  const active = images[activeIdx];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative aspect-4/3 rounded-2xl overflow-hidden border border-qbit-outline-variant bg-qbit-surface-container-low group cursor-pointer"
        onClick={() => setFullscreen(true)}
      >
        {/* Lazy-loaded image with placeholder icon */}
        <div className={cn("absolute inset-0 flex items-center justify-center transition-transform duration-500", zoom ? "scale-150" : "scale-100")}>
          <img
            src={active.url}
            alt={active.alt}
            loading="lazy"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-qbit-on-surface/0 group-hover:bg-qbit-on-surface/5 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white/90 rounded-full px-4 py-2 shadow-lg">
            <Icon name="fullscreen" className="text-[18px] text-qbit-primary" />
            <span className="text-xs font-semibold text-qbit-primary">Click to view fullscreen</span>
          </div>
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-qbit-on-surface hover:bg-white shadow-md transition-colors"
            >
              <Icon name="chevron_left" className="text-[20px]" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-qbit-on-surface hover:bg-white shadow-md transition-colors"
            >
              <Icon name="chevron_right" className="text-[20px]" />
            </button>
          </>
        )}

        {/* Zoom toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setZoom((z) => !z); }}
          aria-label={zoom ? "Zoom out" : "Zoom in"}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-qbit-on-surface hover:bg-white shadow-md transition-colors"
        >
          <Icon name={zoom ? "zoom_out" : "zoom_in"} className="text-[18px]" />
        </button>

        {/* Counter */}
        <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">
          {activeIdx + 1} / {images.length}
        </span>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={cn(
                "relative h-16 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                idx === activeIdx
                  ? "border-qbit-primary shadow-md"
                  : "border-qbit-outline-variant opacity-60 hover:opacity-100",
              )}
            >
              <img
                src={img.url}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-contain bg-qbit-surface-container-low"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen modal */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 bg-black">
          <DialogTitle className="sr-only">{productName} — Fullscreen Gallery</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={active.url}
              alt={active.alt}
              className="max-w-full max-h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  aria-label="Previous"
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <Icon name="chevron_left" className="text-[24px]" />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next"
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <Icon name="chevron_right" className="text-[24px]" />
                </button>
              </>
            )}
            <span className="absolute bottom-4 right-4 text-xs font-bold text-white bg-black/60 px-2 py-1 rounded">
              {activeIdx + 1} / {images.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
