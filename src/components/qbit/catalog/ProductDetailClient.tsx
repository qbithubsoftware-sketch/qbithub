"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { StatusBadge, TagBadge } from "@/components/qbit/primitives/StatusBadge";
import { SurfaceCard } from "@/components/qbit/primitives/GlassCard";

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

export function ProductDetailClient({ product }: { product: ProductDetail }) {
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"specs" | "features" | "downloads" | "videos">("specs");

  // Build gallery: prefer product.galleryImages, fall back to imageUrl, fall back to icon placeholder.
  const gallery = useMemo(() => {
    const imgs: { url: string; alt: string }[] = [];
    if (product.galleryImages.length > 0) {
      imgs.push(...product.galleryImages);
    } else if (product.imageUrl) {
      imgs.push({ url: product.imageUrl, alt: product.name });
    }
    // Also include any media files of type "image"
    for (const m of product.mediaFiles) {
      if (m.type === "image" && !imgs.some((i) => i.url === m.url)) {
        imgs.push({ url: m.url, alt: m.altText ?? product.name });
      }
    }
    return imgs;
  }, [product]);

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
    if (typeof window !== "undefined") {
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

  const currentImage = gallery[activeImage];
  const iconName = DEVICE_TYPE_ICON[product.deviceType] ?? "inventory_2";
  const publicUrl = `https://hub.qbit.com/products/${product.slug}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publicUrl)}`;

  return (
    <div className="min-h-screen bg-qbit-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-qbit-outline-variant/50 bg-qbit-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link
            href="/products"
            className="flex items-center gap-2 text-sm font-medium text-qbit-on-surface-variant hover:text-qbit-primary"
          >
            <Icon name="arrow_back" className="text-[20px]" />
            All Products
          </Link>
          <span className="text-qbit-outline-variant">/</span>
          {product.category && (
            <>
              <Link
                href={`/products?category=${product.category}`}
                className="text-sm font-medium text-qbit-on-surface-variant hover:text-qbit-primary capitalize"
              >
                {product.category.replace(/-/g, " ")}
              </Link>
              <span className="text-qbit-outline-variant">/</span>
            </>
          )}
          <span className="truncate text-sm font-semibold text-qbit-on-surface">{product.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* ------------------- HERO ------------------- */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-qbit-outline-variant bg-white shadow-sm">
              {currentImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImage.url}
                  alt={currentImage.alt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-qbit-surface-container-low via-white to-qbit-surface-container-high">
                  <Icon name={iconName} className="text-[120px] text-qbit-primary/70" filled />
                </div>
              )}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur">
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
                    onClick={() => setActiveImage(i)}
                    className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      i === activeImage
                        ? "border-qbit-primary ring-2 ring-qbit-primary/20"
                        : "border-qbit-outline-variant hover:border-qbit-primary/40"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
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
              <StatPill icon="visibility" label="Views" value={product.viewCount} />
              <StatPill icon="download" label="Downloads" value={product.downloadCount} />
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

            {/* Primary actions */}
            <div className="flex flex-wrap gap-3 border-t border-qbit-outline-variant/50 pt-4">
              {product.driverDownloadUrl && (
                <QbitButton
                  variant="primary"
                  icon="download"
                  onClick={() => handleDownload(product.driverDownloadUrl!, "Driver")}
                >
                  Download Driver{product.latestDriverVersion ? ` ${product.latestDriverVersion}` : ""}
                </QbitButton>
              )}
              {product.manualUrl && (
                <QbitButton
                  variant="outline"
                  icon="menu_book"
                  onClick={() => handleDownload(product.manualUrl!, "Manual")}
                >
                  View Manual
                </QbitButton>
              )}
              <QbitButton
                variant="ghost"
                icon={copied ? "check" : "share"}
                onClick={handleShare}
              >
                {copied ? "Link Copied" : "Share"}
              </QbitButton>
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

              {availableDownloads.length === 0 && !hasFirmwareCard && product.mediaFiles.length === 0 && (
                <EmptyState icon="download" message="No downloads available for this product yet." />
              )}
            </div>
          )}

          {/* Videos */}
          {activeTab === "videos" && (
            <div className="space-y-6">
              {product.videos.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {product.videos.map((v, i) => {
                    const ytId = v.provider === "youtube" || v.url.includes("youtu")
                      ? (v.externalId ?? getYouTubeId(v.url))
                      : null;
                    return (
                      <SurfaceCard key={i} className="overflow-hidden">
                        {ytId ? (
                          <div className="aspect-video w-full">
                            <iframe
                              src={`https://www.youtube.com/embed/${ytId}`}
                              title={v.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="h-full w-full"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video w-full bg-qbit-surface-container">
                            <div className="flex h-full w-full items-center justify-center">
                              <a
                                href={v.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 text-qbit-primary"
                              >
                                <Icon name="play_circle" className="text-[64px]" filled />
                                <span className="text-sm font-medium">Open video in new tab</span>
                              </a>
                            </div>
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="text-sm font-bold text-qbit-on-surface">{v.title}</h4>
                        </div>
                      </SurfaceCard>
                    );
                  })}
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
            <span>{product.viewCount} views · {product.downloadCount} downloads</span>
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
