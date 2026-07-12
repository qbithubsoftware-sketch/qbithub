"use client";

import { cn } from "@/lib/utils";

/**
 * QRCodeCard — generates a QR code for the given URL.
 *
 * Uses the free api.qrserver.com API which renders QR codes server-side
 * and returns a PNG.  No client-side QR library needed.
 *
 * In production, this would be replaced with a self-hosted QR generator
 * (e.g. `qrcode` npm package) to avoid external API dependencies.
 */
export function QRCodeCard({
  url,
  size = 200,
  className,
  productName,
}: {
  url: string;
  size?: number;
  className?: string;
  productName?: string;
}) {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=141b2b&bgcolor=ffffff&margin=8&qzone=2`;

  return (
    <div
      className={cn("rounded-xl overflow-hidden border border-qbit-outline-variant bg-white p-3", className)}
      style={{ width: size + 24, height: size + 24 }}
    >
      <img
        src={qrApiUrl}
        alt={`QR code for ${productName ?? url}`}
        width={size}
        height={size}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

/**
 * QRCodeButton — compact button that opens a modal with the QR code.
 * Used in the product page header.
 */
export function QRCodeButton({
  url,
  productName,
  onClick,
}: {
  url: string;
  productName: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Show QR code"
      title="Show QR code"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-qbit-outline-variant text-qbit-on-surface-variant hover:bg-qbit-surface-container hover:text-qbit-primary transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm9-2h3v3h-3v-3zm5 0h2v2h-2v-2zm-5 5h3v2h-3v-2zm5 0h2v2h-2v-2zm0-3h2v2h-2v-2z"/>
      </svg>
    </button>
  );
}
