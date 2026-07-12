"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WiringDiagram } from "@/lib/installation/types";

/**
 * WiringDiagramViewer — grid of wiring diagram thumbnails with zoom,
 * fullscreen, and download support.  Clicking a thumbnail opens a
 * fullscreen modal viewer.
 */
export function WiringDiagramViewer({ diagrams }: { diagrams: WiringDiagram[] }) {
  const [fullscreen, setFullscreen] = useState<WiringDiagram | null>(null);
  const [zoom, setZoom] = useState(1);

  return (
    <>
      <SurfaceCard className="p-5">
        <h4 className="text-sm font-semibold text-qbit-on-surface flex items-center gap-2 mb-4">
          <Icon name="account_tree" className="text-[18px] text-qbit-primary" />
          Wiring Diagrams
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {diagrams.map((diagram) => (
            <button
              key={diagram.id}
              onClick={() => {
                setFullscreen(diagram);
                setZoom(1);
              }}
              className="group relative rounded-xl overflow-hidden border border-qbit-outline-variant hover:border-qbit-primary transition-colors text-left"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-qbit-surface-container-low flex items-center justify-center relative">
                <Icon name="schema" className="text-[40px] text-qbit-outline" />
                <div className="absolute inset-0 bg-qbit-primary/0 group-hover:bg-qbit-primary/10 transition-colors flex items-center justify-center">
                  <Icon
                    name="fullscreen"
                    className="text-[24px] text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                  />
                </div>
              </div>
              {/* Label */}
              <div className="p-3">
                <p className="text-xs font-semibold text-qbit-on-surface truncate">{diagram.title}</p>
                {diagram.resolution && (
                  <p className="text-[10px] text-qbit-on-surface-variant mt-0.5">{diagram.resolution}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </SurfaceCard>

      {/* Fullscreen viewer */}
      <Dialog open={!!fullscreen} onOpenChange={(o) => !o && setFullscreen(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 bg-qbit-surface-container-lowest">
          {fullscreen && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-qbit-outline-variant">
                <div>
                  <DialogTitle className="text-base font-semibold text-qbit-on-surface">
                    {fullscreen.title}
                  </DialogTitle>
                  {fullscreen.description && (
                    <p className="text-xs text-qbit-on-surface-variant mt-0.5">
                      {fullscreen.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                    aria-label="Zoom out"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container"
                  >
                    <Icon name="zoom_out" className="text-[18px]" />
                  </button>
                  <span className="flex h-9 items-center px-2 text-xs font-bold text-qbit-on-surface-variant">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                    aria-label="Zoom in"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container"
                  >
                    <Icon name="zoom_in" className="text-[18px]" />
                  </button>
                  <button
                    onClick={() => setZoom(1)}
                    aria-label="Reset zoom"
                    className="flex h-9 items-center px-2 rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container text-xs font-bold"
                  >
                    Reset
                  </button>
                  <QbitButton size="sm" variant="outline" icon="download" className="ml-2">
                    Download
                  </QbitButton>
                </div>
              </div>
              {/* Viewer */}
              <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center bg-qbit-surface-container-low p-4">
                <div
                  className="flex items-center justify-center bg-white rounded-lg shadow-lg transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <Icon name="schema" className="text-[200px] text-qbit-outline" />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
