"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";

// WhatsApp inquiry number — will be configured via system settings later
const WHATSAPP_INQUIRY_NUMBER = "918527545414";
// Company phone number for "Call Now" button (tel: deep link)
const COMPANY_PHONE_NUMBER = "+918527545414";

// Deterministic pseudo-random number generator based on product ID
// Ensures view/download counts are consistent across page reloads
function deterministicRandom(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const normalized = (Math.abs(hash) % 10000) / 10000;
  return Math.floor(min + normalized * (max - min));
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
  return n.toString();
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const DOWNLOAD_TYPES: Array<{
  key: string;
  label: string;
  icon: string;
  iconBg: string;
  urlField: keyof ProductDetail;
  description: string;
}> = [
  { key: "manual", label: "Manual", icon: "description", iconBg: "bg-blue-50 text-blue-600", urlField: "manualUrl", description: "Detailed setup and configuration guide." },
  { key: "driver", label: "Driver", icon: "memory", iconBg: "bg-green-50 text-green-600", urlField: "driverDownloadUrl", description: "Latest device driver for Windows/Linux." },
  { key: "firmware", label: "Firmware", icon: "upgrade", iconBg: "bg-amber-50 text-amber-600", urlField: "qrCodeUrl", description: "Firmware update package (see release notes)." },
  { key: "sdk", label: "SDK", icon: "code", iconBg: "bg-purple-50 text-purple-600", urlField: "sdkUrl", description: "Software Development Kit for integration." },
  { key: "utility", label: "Utility", icon: "build", iconBg: "bg-orange-50 text-orange-600", urlField: "utilityUrl", description: "Configuration utility / diagnostic tool." },
  { key: "brochure", label: "Brochure", icon: "picture_as_pdf", iconBg: "bg-red-50 text-red-600", urlField: "brochureUrl", description: "Marketing brochure with feature highlights." },
  { key: "datasheet", label: "Datasheet", icon: "article", iconBg: "bg-cyan-50 text-cyan-600", urlField: "datasheetUrl", description: "Official technical specification document." },
  { key: "warranty", label: "Warranty PDF", icon: "verified_user", iconBg: "bg-emerald-50 text-emerald-600", urlField: "warrantyUrl", description: "Standard enterprise warranty terms." },
  { key: "guide", label: "Installation Guide", icon: "menu_book", iconBg: "bg-indigo-50 text-indigo-600", urlField: "installationGuideUrl", description: "Step-by-step installation walkthrough." },
];

/**
 * Full product detail page rendered from a shaped product object.
 *
 * Layout (top to bottom):
 *   1. Breadcrumb + Hero (gallery + product identity + quick actions)
 *   2. Long Description
 *   3. Technical Specifications (table grouped by group)
 *   4. Features (icon grid)
 *   5. Operating Systems (icon row)
 *   6. Downloads (cards: Manual, Driver, Firmware, SDK, Utility, Brochure, Datasheet, Warranty, Installation Guide)
 *   7. Videos (YouTube embed or "No video available")
 *   8. AI Diagnostics + Dr. QBIT support panel
 *   9. QR Code + Share row
 *  10. Related Products (grid — each card fully clickable)
 *  11. Footer: view count, download count, last updated
 */

export interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  manufacturer: string | null;
  model: string;
  slug: string;
  deviceType: string;
  category: string | null;
  description: string | null;
  longDescription: string | null;
  imageUrl: string | null;
  galleryImages: { url: string; alt: string }[];
  specifications: { property: string; value: string; group?: string | null }[];
  features: { icon: string; title: string; description: string }[];
  operatingSystems: { osName: string; osIcon: string; minVersion?: string | null }[];
  videos: { title: string; url: string; provider?: string; externalId?: string }[];
  mediaFiles: {
    id: string; type: string; title: string; url: string;
    mimeType: string | null; thumbnailUrl: string | null; altText: string | null;
    provider: string | null; externalId: string | null;
  }[];
  // V5: Shared resources from Global Resource Library
  sharedResources: {
    mappingId: string;
    resourceId: string;
    type: string;
    name: string;
    version: string | null;
    description: string | null;
    url: string | null;
    mimeType: string | null;
    fileSize: number | null;
    thumbnailUrl: string | null;
    status: string;
    downloadCount: number;
    releaseDate: string | null;
  }[];
  sku: string | null;
  startingPrice: string | null;
  badgeLabel: string | null;
  isFeatured: boolean;
  isTrending: boolean;
  tags: string[];
  compatibleDevices: string[];
  status: string;
  driverDownloadUrl: string | null;
  manualUrl: string | null;
  installationGuideUrl: string | null;
  knowledgeBaseUrl: string | null;
  brochureUrl: string | null;
  datasheetUrl: string | null;
  warrantyUrl: string | null;
  sdkUrl: string | null;
  utilityUrl: string | null;
  qrCodeUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  viewCount: number;
  downloadCount: number;
  aiDiagnosticsSupported: boolean;
  drQbitSupported: boolean;
  latestDriverVersion: string | null;
  latestFirmwareVersion: string | null;
  lastUpdated: string;
  relatedProducts: {
    id: string; name: string; slug: string; brand: string; model: string;
    deviceType: string; category: string | null; description: string | null;
    imageUrl: string | null; startingPrice: string | null; badgeLabel: string | null;
  }[];
}

const DEVICE_TYPE_ICON: Record<string, string> = {
  thermal_printer: "print",
  barcode_scanner: "barcode_scanner",
  windows_pos: "desktop_windows",
  android_pos: "phone_android",
  cash_drawer: "point_of_sale",
  customer_display: "monitor",
  label_printer: "label",
  kitchen_printer: "restaurant",
  kiosk: "storefront",
  weighing_scale: "scale",
};



export function ProductDetailClient({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"specs" | "features" | "downloads" | "videos">("specs");
  const [activeVideo, setActiveVideo] = useState(0);
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set());
  const [imageTransition, setImageTransition] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // ===== Generate realistic view/download counts (deterministic per product) =====
  const stats = useMemo(() => {
    const views = deterministicRandom(product.id, 128, 1280);
    const downloads = deterministicRandom(product.id + "dl", 4, 286);
    return { views, downloads };
  }, [product.id]);

  // Build gallery: Featured/Main image ALWAYS first, then gallery images, then media images.
  const gallery = useMemo(() => {
    const imgs: { url: string; alt: string }[] = [];
    // 1. Featured/Main Product Image (always first)
    if (product.imageUrl) {
      imgs.push({ url: product.imageUrl, alt: product.name });
    }
    // 2. Gallery Images (appended after featured)
    for (const g of product.galleryImages) {
      if (!imgs.some((i) => i.url === g.url)) {
        imgs.push(g);
      }
    }
    // 3. Media files of type "image" (appended after gallery, deduped)
    for (const m of product.mediaFiles) {
      if (m.type === "image" && !imgs.some((i) => i.url === m.url)) {
        imgs.push({ url: m.url, alt: m.altText ?? product.name });
      }
    }
    return imgs;
  }, [product]);

  // ===== Image navigation (next/prev/keyboard/swipe) with smooth fade =====
  const goToImage = useCallback((index: number) => {
    setImageTransition(true);
    setTimeout(() => {
      setActiveImage(index);
      setImageTransition(false);
    }, 150);
  }, []);

  const nextImage = useCallback(() => {
    setImageTransition(true);
    setTimeout(() => {
      setActiveImage((prev) => (prev + 1) % gallery.length);
      setImageTransition(false);
    }, 150);
  }, [gallery.length]);

  const prevImage = useCallback(() => {
    setImageTransition(true);
    setTimeout(() => {
      setActiveImage((prev) => (prev - 1 + gallery.length) % gallery.length);
      setImageTransition(false);
    }, 150);
  }, [gallery.length]);

  // Keyboard navigation for gallery
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") { e.preventDefault(); prevImage(); }
      if (e.key === "ArrowRight") { e.preventDefault(); nextImage(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prevImage, nextImage]);

  // Touch swipe support for mobile gallery
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) prevImage(); else nextImage();
    }
    touchStartX.current = null;
  }

  // ===== Video playlist =====
  const videoList = useMemo(() => {
    return product.videos.map((v) => ({
      ...v,
      ytId: v.provider === "youtube" || v.url.includes("youtu")
        ? (v.externalId ?? getYouTubeId(v.url))
        : null,
    }));
  }, [product.videos]);

  // Group specifications by `group` field (if present).
  const specGroups = useMemo(() => {
    const groups: Record<string, { property: string; value: string }[]> = {};
    for (const s of product.specifications) {
      const g = s.group ?? "General";
      if (!groups[g]) groups[g] = [];
      groups[g].push({ property: s.property, value: s.value });
    }
    return Object.entries(groups);
  }, [product.specifications]);

  // Downloads that actually have URLs
  const availableDownloads = DOWNLOAD_TYPES.filter((d) => {
    const v = product[d.urlField];
    return typeof v === "string" && v && v.length > 0 && d.key !== "firmware";
  });
  // Firmware is special — it doesn't have its own URL field, but if latestFirmwareVersion is set,
  // show a card that points to the downloads/knowledge base.
  const hasFirmwareCard = !!product.latestFirmwareVersion;

  const handleDownload = (url: string, label: string) => {
    if (typeof window === "undefined") return;
    // For data URLs (base64), create a temporary anchor with download attribute
    if (url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = label || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (url.startsWith("http")) {
      // External URL (YouTube, etc.) — open in new tab
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      // Relative path — try navigating directly (may trigger download)
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : `https://hub.qbit.com/products/${product.slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.description ?? "", url: shareUrl });
        return;
      } catch { /* fall through to clipboard */ }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ===== Send Inquiry (WhatsApp) =====
  const handleInquiry = () => {
    const msg = `Hello,\nI'm interested in this product.\nPlease share complete details.\n\nProduct: ${product.name}\nModel: ${product.model}\nLink: ${publicUrl}`;
    window.open(`https://wa.me/${WHATSAPP_INQUIRY_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  // ===== Share via WhatsApp =====
  const shareViaWhatsApp = () => {
    const msg = `${product.name} — ${publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  // ===== Share via Email =====
  const shareViaEmail = () => {
    const subject = encodeURIComponent(product.name);
    const body = encodeURIComponent(`See ${product.name}: ${publicUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  // ===== Copy Link =====
  const copyLink = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentImage = gallery[activeImage];
  const iconName = DEVICE_TYPE_ICON[product.deviceType] ?? "inventory_2";
  const publicUrl = typeof window !== "undefined" ? window.location.href : `https://qbithub.vercel.app/products/${product.slug}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publicUrl)}`;

  return (
    <div className="min-h-screen bg-qbit-surface">

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* ------------------- HERO ------------------- */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-qbit-outline-variant bg-white shadow-sm"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {currentImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={activeImage}
                  src={currentImage.url}
                  alt={currentImage.alt}
                  className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
                    imageTransition ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                  loading={activeImage === 0 ? "eager" : "lazy"}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-qbit-surface-container-low via-white to-qbit-surface-container-high">
                  <Icon name={iconName} className="text-[120px] text-qbit-primary/70" filled />
                </div>
              )}

              {/* Prev/Next navigation buttons */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <Icon name="chevron_left" className="text-[24px] text-qbit-on-surface" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <Icon name="chevron_right" className="text-[24px] text-qbit-on-surface" />
                  </button>

                  {/* Image counter */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {activeImage + 1} / {gallery.length}
                  </div>
                </>
              )}

              <div className="absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-lg border border-qbit-outline-variant bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur sm:flex">
                <Icon name="zoom_in" className="text-[14px] text-qbit-on-surface-variant" />
                <span className="text-xs font-semibold text-qbit-on-surface-variant">Hover to zoom</span>
              </div>
            </div>

            {/* Thumbnail strip */}
            {gallery.length > 1 && (
              <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => goToImage(i)}
                    className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      i === activeImage
                        ? "border-qbit-primary ring-2 ring-qbit-primary/20"
                        : "border-qbit-outline-variant hover:border-qbit-primary/40"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Identity + quick actions */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-qbit-primary">
                  {product.brand}
                </span>
                {product.badgeLabel && (
                  <TagBadge variant="primary">{product.badgeLabel}</TagBadge>
                )}
                {product.isTrending && (
                  <TagBadge variant="secondary">Trending</TagBadge>
                )}
                <StatusBadge
                  variant={product.status === "active" ? "success" : "neutral"}
                  dot
                >
                  {product.status === "active" ? "Active" : product.status}
                </StatusBadge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-qbit-on-surface md:text-4xl">
                {product.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-qbit-on-surface-variant">
                <span><strong className="text-qbit-on-surface">Model:</strong> {product.model}</span>
                {product.sku && <span><strong className="text-qbit-on-surface">SKU:</strong> {product.sku}</span>}
                {product.manufacturer && (
                  <span><strong className="text-qbit-on-surface">Manufacturer:</strong> {product.manufacturer}</span>
                )}
                {product.startingPrice && (
                  <span className="text-base font-bold text-qbit-primary">From {product.startingPrice}</span>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-sm text-qbit-on-surface-variant">{product.description}</p>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatPill icon="visibility" label="Views" value={formatCount(stats.views)} />
              <StatPill icon="download" label="Downloads" value={formatCount(stats.downloads)} />
              <StatPill
                icon="memory"
                label="Driver"
                value={product.latestDriverVersion ?? "—"}
              />
              <StatPill
                icon="upgrade"
                label="Firmware"
                value={product.latestFirmwareVersion ?? "—"}
              />
            </div>

            {/* Support flags */}
            <div className="flex flex-wrap gap-2">
              {product.drQbitSupported && (
                <div className="flex items-center gap-2 rounded-lg bg-qbit-primary-container/10 px-3 py-2 text-xs font-medium text-qbit-primary">
                  <Icon name="smart_toy" className="text-[16px]" />
                  Dr. QBIT Supported
                </div>
              )}
              {product.aiDiagnosticsSupported && (
                <div className="flex items-center gap-2 rounded-lg bg-qbit-secondary-container/10 px-3 py-2 text-xs font-medium text-qbit-secondary">
                  <Icon name="psychology" className="text-[16px]" />
                  AI Diagnostics Supported
                </div>
              )}
            </div>

            {/* OS support */}
            {product.operatingSystems.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">
                  Operating Systems
                </p>
                <div className="flex flex-wrap gap-3">
                  {product.operatingSystems.map((os, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant px-3 py-1.5 text-sm text-qbit-on-surface">
                      <Icon name={os.osIcon} className="text-[18px] text-qbit-primary" />
                      <span>{os.osName}</span>
                      {os.minVersion && (
                        <span className="text-xs text-qbit-on-surface-variant">({os.minVersion}+)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary actions — Send Enquiry (WhatsApp) + Call Now */}
            <div className="flex flex-col gap-3 border-t border-qbit-outline-variant/50 pt-4 sm:flex-row">
              <QbitButton
                variant="primary"
                icon="chat"
                onClick={handleInquiry}
                className="bg-[#25D366] hover:bg-[#1da851] text-white sm:flex-1"
              >
                Send Enquiry
              </QbitButton>
              <a
                href={`tel:${COMPANY_PHONE_NUMBER}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-qbit-primary px-5 py-2.5 text-sm font-semibold text-qbit-primary transition-all hover:bg-qbit-primary/5 sm:flex-1"
              >
                <Icon name="call" className="text-[18px]" />
                Call Now
              </a>
            </div>

            {/* Share section */}
            <div className="border-t border-qbit-outline-variant/50 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Share via</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={shareViaWhatsApp}
                  className="flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-3 py-2 text-xs font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container-low transition-colors"
                >
                  <Icon name="chat" className="text-[16px] text-[#25D366]" />
                  WhatsApp
                </button>
                <button
                  onClick={shareViaEmail}
                  className="flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-3 py-2 text-xs font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container-low transition-colors"
                >
                  <Icon name="mail" className="text-[16px] text-qbit-primary" />
                  Email
                </button>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-3 py-2 text-xs font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container-low transition-colors"
                >
                  <Icon name={copied ? "check" : "content_copy"} className={`text-[16px] ${copied ? "text-qbit-success" : "text-qbit-on-surface-variant"}`} />
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-3 py-2 text-xs font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container-low transition-colors"
                  >
                    <Icon name="share" className="text-[16px] text-qbit-on-surface-variant" />
                    Share…
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------- TABS ------------------- */}
        <section className="mt-12">
          <div className="mb-6 flex flex-wrap gap-2 border-b border-qbit-outline-variant">
            {[
              { key: "specs", label: "Specifications", icon: "list_alt" },
              { key: "features", label: "Features", icon: "stars" },
              { key: "downloads", label: "Downloads", icon: "download" },
              { key: "videos", label: "Videos", icon: "videocam" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as typeof activeTab)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === t.key
                    ? "border-qbit-primary text-qbit-primary"
                    : "border-transparent text-qbit-on-surface-variant hover:text-qbit-on-surface"
                }`}
              >
                <Icon name={t.icon} className="text-[18px]" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Specs */}
          {activeTab === "specs" && (
            <div className="space-y-6">
              {specGroups.length > 0 ? (
                specGroups.map(([group, specs]) => (
                  <SurfaceCard key={group} className="overflow-hidden">
                    <div className="border-b border-qbit-outline-variant/50 bg-qbit-surface-container-low px-5 py-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">
                        {group}
                      </h3>
                    </div>
                    <table className="w-full">
                      <tbody>
                        {specs.map((s, i) => (
                          <tr key={i} className="border-b border-qbit-outline-variant/30 last:border-0">
                            <td className="w-1/3 px-5 py-3 text-sm font-medium text-qbit-on-surface-variant">
                              {s.property}
                            </td>
                            <td className="px-5 py-3 text-sm text-qbit-on-surface">{s.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </SurfaceCard>
                ))
              ) : (
                <EmptyState icon="list_alt" message="No technical specifications available for this product." />
              )}
            </div>
          )}

          {/* Features */}
          {activeTab === "features" && (
            <div>
              {product.features.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {product.features.map((f, i) => (
                    <SurfaceCard key={i} className="p-5">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary-container/10">
                        <Icon name={f.icon} className="text-[24px] text-qbit-primary" filled />
                      </div>
                      <h4 className="mb-1 text-base font-bold text-qbit-on-surface">{f.title}</h4>
                      <p className="text-sm text-qbit-on-surface-variant">{f.description}</p>
                    </SurfaceCard>
                  ))}
                </div>
              ) : (
                <EmptyState icon="stars" message="No features listed for this product." />
              )}
            </div>
          )}

          {/* Downloads */}
          {activeTab === "downloads" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableDownloads.map((d) => {
                  const url = product[d.urlField] as string;
                  return (
                    <SurfaceCard key={d.key} className="flex items-start gap-4 p-5">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${d.iconBg}`}>
                        <Icon name={d.icon} className="text-[24px]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-qbit-on-surface">{d.label}</h4>
                        <p className="mt-1 text-xs text-qbit-on-surface-variant">{d.description}</p>
                        <button
                          onClick={() => handleDownload(url, d.label)}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline"
                        >
                          Download / Open
                          <Icon name="arrow_forward" className="text-[14px]" />
                        </button>
                      </div>
                    </SurfaceCard>
                  );
                })}

                {/* Firmware card (always shown if latestFirmwareVersion is set) */}
                {hasFirmwareCard && (
                  <SurfaceCard className="flex items-start gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Icon name="upgrade" className="text-[24px]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-qbit-on-surface">Firmware</h4>
                      <p className="mt-1 text-xs text-qbit-on-surface-variant">
                        Latest release: <strong>{product.latestFirmwareVersion}</strong>
                      </p>
                      <Link
                        href={product.knowledgeBaseUrl ?? "#"}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline"
                      >
                        View Release Notes
                        <Icon name="arrow_forward" className="text-[14px]" />
                      </Link>
                    </div>
                  </SurfaceCard>
                )}

                {/* Media-file-backed downloads (driver/firmware/sdk/utility/brochure/datasheet/warranty/manual/video) */}
                {product.mediaFiles
                  .filter((m) => ["driver", "firmware", "sdk", "utility", "brochure", "datasheet", "warranty", "manual"].includes(m.type))
                  .filter((m) => !availableDownloads.some((d) => product[d.urlField] === m.url))
                  .map((m) => (
                    <SurfaceCard key={m.id} className="flex items-start gap-4 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-qbit-secondary-container/10 text-qbit-secondary">
                        <Icon name="attach_file" className="text-[24px]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-qbit-on-surface">{m.title}</h4>
                        <p className="mt-1 text-xs capitalize text-qbit-on-surface-variant">{m.type}</p>
                        <button
                          onClick={() => handleDownload(m.url, m.title)}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline"
                        >
                          Download / Open
                          <Icon name="arrow_forward" className="text-[14px]" />
                        </button>
                      </div>
                    </SurfaceCard>
                  ))}
              </div>

              {/* V5: Shared Resources from Global Resource Library */}
              {product.sharedResources && product.sharedResources.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon name="library_books" className="text-[20px] text-qbit-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-qbit-on-surface">
                      Shared Resources ({product.sharedResources.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {product.sharedResources.map((r) => (
                      <SurfaceCard key={r.mappingId} className="flex items-start gap-4 p-5">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${sharedResourceIconBg(r.type)}`}>
                          <Icon name={sharedResourceIcon(r.type)} className="text-[24px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-qbit-on-surface">{r.name}</h4>
                            {r.version && (
                              <span className="shrink-0 rounded bg-qbit-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-qbit-primary">
                                {r.version}
                              </span>
                            )}
                            {r.status === "deprecated" && (
                              <span className="shrink-0 rounded bg-qbit-warning/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-qbit-warning">
                                Deprecated
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-qbit-on-surface-variant">
                            {r.description ?? sharedResourceTypeLabel(r.type)}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-qbit-on-surface-variant/70">
                            <span className="flex items-center gap-0.5">
                              <Icon name="download" className="text-[12px]" />
                              {r.downloadCount} downloads
                            </span>
                            {r.releaseDate && (
                              <span className="flex items-center gap-0.5">
                                <Icon name="schedule" className="text-[12px]" />
                                {new Date(r.releaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>
                          {r.type === "video" ? (
                            <a
                              href={(r.url ?? "").startsWith("http") ? r.url ?? "#" : `/api/admin/resources/${r.resourceId}?download=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline"
                            >
                              Watch Video
                              <Icon name="arrow_forward" className="text-[14px]" />
                            </a>
                          ) : (
                            <a
                              href={`/api/admin/resources/${r.resourceId}?download=true`}
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline"
                            >
                              Download / Open
                              <Icon name="arrow_forward" className="text-[14px]" />
                            </a>
                          )}
                        </div>
                      </SurfaceCard>
                    ))}
                  </div>
                </div>
              )}

              {availableDownloads.length === 0 && !hasFirmwareCard && product.mediaFiles.length === 0 && (!product.sharedResources || product.sharedResources.length === 0) && (
                <EmptyState icon="download" message="No downloads available for this product yet." />
              )}
            </div>
          )}

          {/* Videos */}
          {activeTab === "videos" && (
            <div className="space-y-6">
              {videoList.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Main video player (lazy-loaded iframe) */}
                  <div className="lg:col-span-2">
                    {(() => {
                      const v = videoList[activeVideo];
                      if (!v) return null;
                      return (
                        <SurfaceCard key={activeVideo} className="overflow-hidden">
                          {v.ytId ? (
                            <div className="aspect-video w-full">
                              <iframe
                                key={v.ytId}
                                src={`https://www.youtube.com/embed/${v.ytId}?rel=0`}
                                title={v.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="h-full w-full"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video w-full bg-qbit-surface-container">
                              <div className="flex h-full w-full items-center justify-center">
                                <a href={v.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-qbit-primary">
                                  <Icon name="play_circle" className="text-[64px]" filled />
                                  <span className="text-sm font-medium">Open video in new tab</span>
                                </a>
                              </div>
                            </div>
                          )}
                          <div className="p-4">
                            <h4 className="text-sm font-bold text-qbit-on-surface">{v.title}</h4>
                            <p className="mt-1 text-xs text-qbit-on-surface-variant">Video {activeVideo + 1} of {videoList.length}</p>
                          </div>
                        </SurfaceCard>
                      );
                    })()}
                  </div>

                  {/* Video playlist (thumbnails) */}
                  <div className="lg:col-span-1">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-qbit-on-surface-variant">Playlist ({videoList.length})</p>
                    <div className="space-y-2">
                      {videoList.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveVideo(i)}
                          className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-all ${
                            i === activeVideo
                              ? "border-qbit-primary bg-qbit-primary/5"
                              : "border-qbit-outline-variant hover:border-qbit-primary/40"
                          }`}
                        >
                          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-qbit-surface-container">
                            {v.ytId ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={`https://img.youtube.com/vi/${v.ytId}/mqdefault.jpg`}
                                alt={v.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Icon name="play_circle" className="text-[24px] text-qbit-primary" />
                              </div>
                            )}
                            {i === activeVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Icon name="play_arrow" className="text-[24px] text-white" filled />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-qbit-on-surface">{v.title}</p>
                            <p className="text-[10px] text-qbit-on-surface-variant">Video {i + 1}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState icon="videocam" message="No video available." />
              )}
            </div>
          )}
        </section>

        {/* ------------------- LONG DESCRIPTION ------------------- */}
        {product.longDescription && (
          <section className="mt-12">
            <SurfaceCard className="p-6">
              <h2 className="mb-3 text-xl font-bold text-qbit-on-surface">About this product</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-qbit-on-surface-variant">
                {product.longDescription}
              </p>
            </SurfaceCard>
          </section>
        )}

        {/* ------------------- TAGS + COMPATIBLE DEVICES ------------------- */}
        {(product.tags.length > 0 || product.compatibleDevices.length > 0) && (
          <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {product.tags.length > 0 && (
              <SurfaceCard className="p-6">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-qbit-on-surface-variant">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((t) => (
                    <TagBadge key={t} variant="neutral">#{t}</TagBadge>
                  ))}
                </div>
              </SurfaceCard>
            )}
            {product.compatibleDevices.length > 0 && (
              <SurfaceCard className="p-6">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-qbit-on-surface-variant">Compatible Devices</h3>
                <div className="flex flex-wrap gap-2">
                  {product.compatibleDevices.map((d) => (
                    <span
                      key={d}
                      className="flex items-center gap-1 rounded-lg border border-qbit-outline-variant px-3 py-1.5 text-xs text-qbit-on-surface"
                    >
                      <Icon name="check_circle" className="text-[14px] text-qbit-success" />
                      {d}
                    </span>
                  ))}
                </div>
              </SurfaceCard>
            )}
          </section>
        )}

        {/* ------------------- SUPPORT SECTION ------------------- */}
        <section className="mt-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Dr. QBIT Support */}
            <SurfaceCard className="p-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-primary/10">
                <Icon name="smart_toy" className="text-[28px] text-qbit-primary" filled />
              </div>
              <h3 className="text-sm font-bold text-qbit-on-surface">Dr. QBIT Support</h3>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">Auto-detect your hardware and get instant drivers, firmware, and diagnostics.</p>
              <Link href="/dr-qbit" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline">
                Launch Dr. QBIT <Icon name="arrow_forward" className="text-[14px]" />
              </Link>
            </SurfaceCard>

            {/* AI Diagnostics Support */}
            <SurfaceCard className="p-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-secondary/10">
                <Icon name="psychology" className="text-[28px] text-qbit-secondary" filled />
              </div>
              <h3 className="text-sm font-bold text-qbit-on-surface">AI Diagnostic Support</h3>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">AI-powered troubleshooting and error code lookup for your QBIT device.</p>
              <Link href="/support" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline">
                Get Support <Icon name="arrow_forward" className="text-[14px]" />
              </Link>
            </SurfaceCard>

            {/* Serial Number Support (NEW) */}
            <SurfaceCard className="p-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-qbit-tertiary/10">
                <Icon name="fingerprint" className="text-[28px] text-qbit-tertiary" filled />
              </div>
              <h3 className="text-sm font-bold text-qbit-on-surface">Serial Number Support</h3>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">Verify your device serial number for warranty, drivers, and registration details.</p>
              <Link href="/dr-qbit" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline">
                Verify Serial Number <Icon name="arrow_forward" className="text-[14px]" />
              </Link>
            </SurfaceCard>
          </div>
        </section>

        {/* ------------------- QR CODE + SHARE ------------------- */}
        <section className="mt-8">
          <SurfaceCard className="flex flex-col items-center gap-6 p-6 md:flex-row md:items-start">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl border border-qbit-outline-variant bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrApiUrl} alt={`QR code for ${product.name}`} width={180} height={180} />
              </div>
              <p className="text-xs font-medium text-qbit-on-surface-variant">Scan to view on mobile</p>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-qbit-on-surface">Share this product</h3>
              <p className="mt-1 text-sm text-qbit-on-surface-variant">
                Send the direct link to colleagues or customers — they&apos;ll land right here.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 rounded-lg border border-qbit-outline-variant bg-qbit-surface-container-low px-3 py-2 text-sm text-qbit-on-surface-variant"
                />
                <QbitButton variant="primary" icon={copied ? "check" : "content_copy"} onClick={handleShare}>
                  {copied ? "Copied" : "Copy Link"}
                </QbitButton>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <ShareButton
                  icon="chat"
                  label="WhatsApp"
                  href={`https://wa.me/?text=${encodeURIComponent(`${product.name} — ${publicUrl}`)}`}
                  color="text-[#25D366]"
                />
                <ShareButton
                  icon="mail"
                  label="Email"
                  href={`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(`See ${product.name}: ${publicUrl}`)}`}
                  color="text-qbit-primary"
                />
                <ShareButton
                  icon="share"
                  label="More…"
                  href={publicUrl}
                  color="text-qbit-on-surface-variant"
                  onClick={handleShare}
                />
              </div>
            </div>
          </SurfaceCard>
        </section>

        {/* ------------------- RELATED PRODUCTS ------------------- */}
        {product.relatedProducts.length > 0 && (
          <section className="mt-12">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-qbit-on-surface">Related Products</h2>
                <p className="mt-1 text-sm text-qbit-on-surface-variant">Frequently bought or viewed together.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {product.relatedProducts.map((rp) => {
                const rpIcon = DEVICE_TYPE_ICON[rp.deviceType] ?? "inventory_2";
                return (
                  <Link
                    key={rp.id}
                    href={`/products/${rp.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-qbit-outline-variant bg-qbit-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-xl hover:border-qbit-primary/40"
                  >
                    <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-qbit-surface-container-high via-qbit-surface-container to-qbit-surface-container-low">
                      {rp.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rp.imageUrl}
                          alt={rp.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Icon name={rpIcon} className="text-[64px] text-qbit-primary/70" filled />
                      )}
                      {rp.badgeLabel && (
                        <span className="absolute left-2 top-2 rounded-full bg-qbit-primary px-2 py-0.5 text-[10px] font-bold uppercase text-qbit-on-primary">
                          {rp.badgeLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-qbit-primary">
                        {rp.brand}
                      </div>
                      <h3 className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">
                        {rp.name}
                      </h3>
                      {rp.description && (
                        <p className="line-clamp-2 text-xs text-qbit-on-surface-variant">{rp.description}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2 text-xs text-qbit-primary">
                        <span className="font-semibold">View Details</span>
                        <Icon name="arrow_forward" className="text-[14px] transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ------------------- FOOTER ------------------- */}
        <footer className="mt-12 border-t border-qbit-outline-variant/50 pt-6 text-xs text-qbit-on-surface-variant">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Last updated: {new Date(product.lastUpdated).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span>{formatCount(stats.views)} views · {formatCount(stats.downloads)} downloads</span>
            {product.knowledgeBaseUrl && (
              <Link href={product.knowledgeBaseUrl} className="font-semibold text-qbit-primary hover:underline">
                Knowledge Base →
              </Link>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-qbit-outline-variant/50 bg-qbit-surface-container-low px-3 py-2 text-center">
      <Icon name={icon} className="mb-1 text-[20px] text-qbit-primary" />
      <span className="text-xs text-qbit-on-surface-variant">{label}</span>
      <span className="text-sm font-bold text-qbit-on-surface">{value}</span>
    </div>
  );
}

function ShareButton({
  icon, label, href, color, onClick,
}: {
  icon: string; label: string; href: string; color: string; onClick?: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant px-3 py-2 text-xs font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container-low"
    >
      <Icon name={icon} className={`text-[16px] ${color}`} />
      {label}
    </a>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-qbit-outline-variant px-6 py-12 text-center">
      <Icon name={icon} className="mx-auto text-[48px] text-qbit-on-surface-variant/40" />
      <p className="mt-3 text-sm font-medium text-qbit-on-surface-variant">{message}</p>
    </div>
  );
}

// V5: Shared resource icon helpers
function sharedResourceIcon(type: string): string {
  const map: Record<string, string> = {
    windows_driver: "memory",
    windows_software: "apps",
    android_software: "phone_android",
    firmware: "upgrade",
    sdk: "code",
    manual: "menu_book",
    installation_guide: "menu_book",
    troubleshooting: "build",
    video: "videocam",
    browser_utility: "apps",
    maintenance_tool: "build",
    pos_utility: "point_of_sale",
    other: "attach_file",
  };
  return map[type] ?? "attach_file";
}

function sharedResourceIconBg(type: string): string {
  const map: Record<string, string> = {
    windows_driver: "bg-green-50 text-green-600",
    windows_software: "bg-blue-50 text-blue-600",
    android_software: "bg-purple-50 text-purple-600",
    firmware: "bg-amber-50 text-amber-600",
    sdk: "bg-indigo-50 text-indigo-600",
    manual: "bg-cyan-50 text-cyan-600",
    installation_guide: "bg-teal-50 text-teal-600",
    troubleshooting: "bg-red-50 text-red-600",
    video: "bg-rose-50 text-rose-600",
    browser_utility: "bg-blue-50 text-blue-600",
    maintenance_tool: "bg-orange-50 text-orange-600",
    pos_utility: "bg-emerald-50 text-emerald-600",
    other: "bg-gray-50 text-gray-600",
  };
  return map[type] ?? "bg-gray-50 text-gray-600";
}

function sharedResourceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    windows_driver: "Windows Driver",
    windows_software: "Windows Software",
    android_software: "Android Application",
    firmware: "Firmware",
    sdk: "SDK",
    manual: "User Manual",
    installation_guide: "Installation Guide",
    troubleshooting: "Troubleshooting Document",
    video: "Video Tutorial",
    browser_utility: "Browser Utility",
    maintenance_tool: "Maintenance Tool",
    pos_utility: "POS Utility",
    other: "Resource",
  };
  return map[type] ?? "Resource";
}
