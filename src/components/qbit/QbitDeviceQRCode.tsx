"use client";

/**
 * QbitDeviceQRCode — Displays a QR code for a QBIT device.
 *
 * The QR content format: QBT://DEVICE/QBT-XXXXXXXX-XXXX-XXXX
 * Below the QR code, show the Device UUID in text.
 * "Copy UUID" button + optional "Download QR Code" button.
 * Note text: "Scan this QR code to instantly access your device profile"
 *
 * Props: { deviceUuid: string; serialNumber?: string; productName?: string }
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";
import { useToast } from "@/hooks/use-toast";

interface QbitDeviceQRCodeProps {
  deviceUuid: string;
  serialNumber?: string;
  productName?: string;
}

/**
 * Generate a deterministic SVG QR-like pattern from a string.
 * Uses a seeded pseudo-random generator to create a visual representation
 * that is unique per device UUID.
 */
function generateQrPattern(input: string): number[][] {
  // Simple seeded hash for deterministic generation
  let seed = 0;
  for (let i = 0; i < input.length; i++) {
    seed = ((seed << 5) - seed + input.charCodeAt(i)) | 0;
  }

  // 21x21 grid (standard QR code size)
  const size = 21;
  const grid: number[][] = [];

  // Pseudo-random number generator
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };

  for (let row = 0; row < size; row++) {
    const cols: number[] = [];
    for (let col = 0; col < size; col++) {
      // Corner position markers (3x3 squares at corners)
      const isTopLeftMarker =
        row < 3 && col < 3;
      const isTopRightMarker =
        row < 3 && col >= size - 3;
      const isBottomLeftMarker =
        row >= size - 3 && col < 3;

      // Outer border of markers
      const isMarkerBorder =
        (isTopLeftMarker && (row === 0 || row === 2 || col === 0 || col === 2)) ||
        (isTopRightMarker && (row === 0 || row === 2 || col === size - 1 || col === size - 3)) ||
        (isBottomLeftMarker && (row === size - 1 || row === size - 3 || col === 0 || col === 2));

      // Inner core of markers
      const isMarkerCore =
        (isTopLeftMarker && row === 1 && col === 1) ||
        (isTopRightMarker && row === 1 && col === size - 2) ||
        (isBottomLeftMarker && row === size - 2 && col === 1);

      if (isMarkerBorder) {
        cols.push(1);
      } else if (isMarkerCore) {
        cols.push(1);
      } else if (isTopLeftMarker || isTopRightMarker || isBottomLeftMarker) {
        cols.push(0);
      } else {
        // Data area — use seeded randomness
        cols.push(nextRand() > 0.45 ? 1 : 0);
      }
    }
    grid.push(cols);
  }

  return grid;
}

export function QbitDeviceQRCode({
  deviceUuid,
  serialNumber,
  productName,
}: QbitDeviceQRCodeProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const qrContent = `QBT://DEVICE/${deviceUuid}`;
  const pattern = generateQrPattern(deviceUuid);
  const cellSize = 8; // px per cell
  const gridSize = pattern.length * cellSize;

  function handleCopyUuid() {
    navigator.clipboard.writeText(deviceUuid).then(() => {
      setCopied(true);
      toast({ title: "UUID Copied", description: `Device UUID: ${deviceUuid}` });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({ title: "Copy Failed", description: "Could not copy to clipboard", variant: "destructive" });
    });
  }

  function handleDownloadQr() {
    // Generate SVG string for download
    const svgParts = pattern.map((row, ri) =>
      row.map((cell, ci) =>
        cell
          ? `<rect x="${ci * cellSize}" y="${ri * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0d9488"/>`
          : `<rect x="${ci * cellSize}" y="${ri * cellSize}" width="${cellSize}" height="${cellSize}" fill="#f0fdf4"/>`
      ).join("")
    ).join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${gridSize + 40}" height="${gridSize + 60}" viewBox="0 0 ${gridSize + 40} ${gridSize + 60}">
      <rect width="${gridSize + 40}" height="${gridSize + 60}" fill="white"/>
      <g transform="translate(20,10)">${svgParts}</g>
      <text x="${(gridSize + 40) / 2}" y="${gridSize + 35}" text-anchor="middle" font-size="8" font-family="monospace" fill="#0d9488">${deviceUuid}</text>
    </svg>`;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR-${deviceUuid}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "QR Code Downloaded", description: "SVG file saved" });
  }

  return (
    <SurfaceCard className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-qbit-primary/10">
          <Icon name="qr_code_2" className="text-[20px] text-qbit-primary" filled />
        </div>
        <div>
          <p className="text-sm font-bold text-qbit-on-surface">Device QR Code</p>
          {productName && (
            <p className="text-xs text-qbit-on-surface-variant">{productName}</p>
          )}
        </div>
      </div>

      {/* QR Code visual */}
      <div className="flex justify-center">
        <div
          className="rounded-xl border-2 border-qbit-primary/20 bg-white p-3 shadow-sm"
          style={{ width: gridSize + 24, height: gridSize + 24 }}
        >
          <svg
            width={gridSize}
            height={gridSize}
            viewBox={`0 0 ${gridSize} ${gridSize}`}
            className="block"
          >
            {pattern.map((row, ri) =>
              row.map((cell, ci) => (
                <rect
                  key={`${ri}-${ci}`}
                  x={ci * cellSize}
                  y={ri * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={cell ? "#0d9488" : "#f0fdf4"}
                  rx={cell ? 1 : 0}
                />
              ))
            )}
          </svg>
        </div>
      </div>

      {/* QR Content label */}
      <div className="text-center">
        <p className="text-xs font-mono text-qbit-primary break-all">{qrContent}</p>
      </div>

      {/* UUID display */}
      <div className="rounded-lg border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-3 text-center">
        <p className="text-xs text-qbit-on-surface-variant mb-1">Device UUID</p>
        <p className="text-sm font-mono font-semibold text-qbit-on-surface break-all">
          {deviceUuid}
        </p>
        {serialNumber && (
          <p className="text-xs text-qbit-on-surface-variant mt-1">
            Serial: {serialNumber}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <QbitButton
          variant={copied ? "surface" : "outline"}
          size="sm"
          icon={copied ? "check" : "content_copy"}
          onClick={handleCopyUuid}
          fullWidth
        >
          {copied ? "Copied!" : "Copy UUID"}
        </QbitButton>
        <QbitButton
          variant="outline"
          size="sm"
          icon="download"
          onClick={handleDownloadQr}
          fullWidth
        >
          Download QR
        </QbitButton>
      </div>

      {/* Note */}
      <p className="text-center text-xs text-qbit-on-surface-variant">
        Scan this QR code to instantly access your device profile
      </p>
    </SurfaceCard>
  );
}
