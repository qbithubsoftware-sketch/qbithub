/**
 * / — QBIT Hub Public Support Portal homepage (V3).
 *
 * Server component. No login required. Reuses the existing Stitch design
 * language (qbit-primary palette, Material Symbols, SurfaceCard patterns).
 *
 * Sections (top to bottom):
 *   1. Hero — large headline + sub-copy + SERIAL NUMBER SEARCH BAR
 *      (primary search method — no model number entry on homepage)
 *   2. Dr. QBIT card — Auto Detect Hardware only (model search removed)
 *   3. Browse Categories — category tiles linking to /products?category=<slug>
 *   4. Featured Products — product grid pulled from DB (isFeatured=true)
 *   5. Video Center preview — 3-up YouTube gallery
 *   6. Download Center preview — drivers / firmware / manuals / SDK / utilities
 *   7. Support CTA band — links to /support, /knowledge-base, /contact
 *
 * The SerialLookupSection renders the search bar AND the animated result card
 * below it. No page reload, no popup — HP/Dell/Lenovo-style support portal UX.
 */

import Link from "next/link";
import { db } from "@/lib/db";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { PublicHomepageClient } from "@/components/qbit/public/PublicHomepageClient";
import { SerialLookupSection } from "@/components/qbit/public/SerialLookupSection";

export const dynamic = "force-dynamic";

const CATEGORIES: ReadonlyArray<{ name: string; slug: string; icon: string; description: string }> = [
  { name: "Window POS", slug: "window-pos", icon: "desktop_windows", description: "All-in-one touch terminals" },
  { name: "Android POS", slug: "android-pos", icon: "phone_android", description: "Mobile & handheld POS" },
  { name: "Handy POS", slug: "handy-pos", icon: "phone_android", description: "Pocket-sized mobile POS" },
  { name: "Thermal Printer", slug: "thermal-printer", icon: "print", description: "Receipt printers" },
  { name: "Portable Printer", slug: "portable-printer", icon: "print", description: "Bluetooth mobile printers" },
  { name: "Barcode Printer", slug: "barcode-printer", icon: "label", description: "Shipping & label printers" },
  { name: "Barcode Scanner", slug: "barcode-scanner", icon: "barcode_scanner", description: "1D / 2D wired & wireless" },
  { name: "Cash Drawer", slug: "cash-drawer", icon: "point_of_sale", description: "RJ11 cash drawers" },
  { name: "Customer Side Display", slug: "customer-side-display", icon: "monitor", description: "Customer-facing displays" },
  { name: "Self Ordering Kiosk", slug: "self-ordering-kiosk", icon: "storefront", description: "Self-service kiosks" },
  { name: "Digital Standee", slug: "digital-standee", icon: "monitor", description: "Digital signage displays" },
];

const DOWNLOAD_CATEGORIES: ReadonlyArray<{ label: string; icon: string; href: string; description: string; color: string }> = [
  { label: "Drivers", icon: "memory", href: "/downloads?type=driver", description: "Windows / Linux / Android drivers", color: "bg-qbit-primary/10 text-qbit-primary" },
  { label: "Firmware", icon: "upgrade", href: "/downloads?type=firmware", description: "Latest firmware releases", color: "bg-qbit-secondary/10 text-qbit-secondary" },
  { label: "Manuals", icon: "menu_book", href: "/downloads?type=manual", description: "User manuals & setup guides", color: "bg-qbit-tertiary/10 text-qbit-tertiary" },
  { label: "SDK", icon: "code", href: "/downloads?type=sdk", description: "Integration SDKs & APIs", color: "bg-qbit-primary/10 text-qbit-primary" },
  { label: "Utilities", icon: "build", href: "/downloads?type=utility", description: "Config & diagnostic tools", color: "bg-qbit-secondary/10 text-qbit-secondary" },
  { label: "Brochures", icon: "picture_as_pdf", href: "/downloads?type=brochure", description: "Product brochures (PDF)", color: "bg-qbit-tertiary/10 text-qbit-tertiary" },
];

export default async function PublicHomePage() {
  // Fetch featured products for the grid
  const featuredProducts = await db.qbitProduct.findMany({
    where: { isActive: true, status: "active", isFeatured: true },
    orderBy: [{ isTrending: "desc" }, { viewCount: "desc" }],
    take: 8,
    select: {
      id: true, name: true, brand: true, model: true, slug: true,
      deviceType: true, category: true, description: true, imageUrl: true,
      startingPrice: true, badgeLabel: true, isTrending: true,
      latestDriverVersion: true, viewCount: true, downloadCount: true,
    },
  });

  // Also fetch trending (in case featured is sparse — fall back to trending)
  let productsToShow = featuredProducts;
  if (productsToShow.length < 4) {
    const more = await db.qbitProduct.findMany({
      where: { isActive: true, status: "active", isTrending: true },
      take: 8 - productsToShow.length,
      select: {
        id: true, name: true, brand: true, model: true, slug: true,
        deviceType: true, category: true, description: true, imageUrl: true,
        startingPrice: true, badgeLabel: true, isTrending: true,
        latestDriverVersion: true, viewCount: true, downloadCount: true,
      },
    });
    productsToShow = [...productsToShow, ...more];
  }

  return (
    <PublicLayout>
      {/* ====== HERO ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-qbit-surface-container-low via-qbit-surface to-qbit-surface-container-high">
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-qbit-primary/20 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-96 w-96 rounded-full bg-qbit-secondary/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-qbit-primary/30 bg-qbit-primary/5 px-4 py-1.5 text-xs font-semibold text-qbit-primary mb-6">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            Enterprise Support Portal · Version 3
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-qbit-on-surface mb-4">
            Precision Support for
            <br />
            <span className="bg-gradient-to-r from-qbit-primary to-qbit-secondary bg-clip-text text-transparent">
              Enterprise Hardware
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base md:text-lg text-qbit-on-surface-variant mb-10">
            Enter your device serial number to instantly access drivers, manuals,
            warranty status, and support resources — all in one place.
          </p>

          {/* Serial Number Search Bar — primary search method */}
          <SerialLookupSection />
        </div>
      </section>

      {/* ====== DR. QBIT SECTION ====== */}
      <section className="border-y border-qbit-outline-variant/30 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-qbit-secondary/10 px-3 py-1 text-xs font-semibold text-qbit-secondary mb-4">
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                Dr. QBIT AI Diagnostics
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-qbit-on-surface mb-3">
                Auto-detect your hardware
                <br />
                with Dr. QBIT
              </h2>
              <p className="text-base text-qbit-on-surface-variant mb-6">
                Let Dr. QBIT scan your connected devices and instantly fetch the
                right driver, firmware, manual, and warranty information. No
                serial number needed — just plug in and scan.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dr-qbit"
                  className="inline-flex items-center gap-2 rounded-xl bg-qbit-primary px-6 py-3 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">memory</span>
                  Scan Hardware Now
                </Link>
              </div>
            </div>

            {/* Result preview card */}
            <div className="rounded-2xl border border-qbit-outline-variant/50 bg-qbit-surface-container-lowest p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary-container">
                  <span className="material-symbols-outlined text-[28px] text-qbit-on-primary-container">smart_toy</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-qbit-on-surface">Dr. QBIT Device Detection</p>
                  <p className="text-xs text-qbit-on-surface-variant">Auto-identifies connected hardware in seconds</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Driver", value: "Auto-fetch", icon: "memory" },
                  { label: "Firmware", value: "Latest", icon: "upgrade" },
                  { label: "Manual", value: "PDF", icon: "menu_book" },
                  { label: "Video", value: "Available", icon: "videocam" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2 rounded-lg border border-qbit-outline-variant/50 bg-white p-3">
                    <span className="material-symbols-outlined text-[20px] text-qbit-primary">{row.icon}</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-qbit-on-surface-variant">{row.label}</p>
                      <p className="text-sm font-semibold text-qbit-on-surface">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/dr-qbit"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-qbit-primary px-4 py-3 text-sm font-semibold text-qbit-on-primary hover:bg-qbit-primary-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                Launch Dr. QBIT
              </Link>
              <p className="mt-2 text-center text-[11px] text-qbit-on-surface-variant">
                Or use the serial number search above
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== BROWSE CATEGORIES ====== */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-qbit-on-surface">Browse Categories</h2>
          <p className="mt-2 text-sm text-qbit-on-surface-variant">Jump straight to a hardware family.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center rounded-2xl border border-qbit-outline-variant/50 bg-white p-6 text-center transition-all hover:border-qbit-primary/30 hover:shadow-lg"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-qbit-primary-container/10 transition-colors group-hover:bg-qbit-primary-container/20">
                <span className={`material-symbols-outlined text-[32px] text-qbit-primary`}>
                  {cat.icon}
                </span>
              </div>
              <span className="text-sm font-semibold text-qbit-on-surface">{cat.name}</span>
              <span className="mt-1 text-xs text-qbit-on-surface-variant">{cat.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ====== FEATURED PRODUCTS ====== */}
      <section className="bg-qbit-surface-container-low border-y border-qbit-outline-variant/30">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-qbit-on-surface">Featured Products</h2>
              <p className="mt-2 text-sm text-qbit-on-surface-variant">The most accessed hardware this month.</p>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-qbit-primary hover:underline"
            >
              View all products
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          <PublicHomepageClient products={productsToShow} />
        </div>
      </section>

      {/* ====== DOWNLOAD CENTER ====== */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-qbit-on-surface">Download Center</h2>
          <p className="mt-2 text-sm text-qbit-on-surface-variant">Anyone can download — no login required.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {DOWNLOAD_CATEGORIES.map((d) => (
            <Link
              key={d.label}
              href={d.href}
              className="group flex flex-col items-center rounded-2xl border border-qbit-outline-variant/50 bg-white p-5 text-center transition-all hover:border-qbit-primary/30 hover:shadow-lg"
            >
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${d.color}`}>
                <span className="material-symbols-outlined text-[24px]">{d.icon}</span>
              </div>
              <span className="text-sm font-semibold text-qbit-on-surface">{d.label}</span>
              <span className="mt-1 text-[11px] text-qbit-on-surface-variant">{d.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ====== VIDEO CENTER PREVIEW ====== */}
      <section className="bg-qbit-surface-container-low border-y border-qbit-outline-variant/30">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-qbit-on-surface">Video Center</h2>
              <p className="mt-2 text-sm text-qbit-on-surface-variant">Installation, training, and troubleshooting videos.</p>
            </div>
            <Link
              href="/videos"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-qbit-primary hover:underline"
            >
              All videos
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: "T-800 Thermal Printer — Installation Walkthrough", desc: "Step-by-step setup guide", id: "dQw4w9WgXcQ" },
              { title: "HUB-X Pro — Overview & First Boot", desc: "Feature tour + initial configuration", id: "dQw4w9WgXcQ" },
              { title: "Dr. QBIT — How Auto-Detect Works", desc: "Scan connected devices in seconds", id: "dQw4w9WgXcQ" },
            ].map((v, i) => (
              <Link
                key={i}
                href="/videos"
                className="group overflow-hidden rounded-2xl border border-qbit-outline-variant bg-white transition-all hover:shadow-lg"
              >
                <div className="relative aspect-video bg-qbit-on-background">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                    alt={v.title}
                    className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-qbit-primary shadow-lg transition-transform group-hover:scale-110">
                      <span className="material-symbols-outlined text-[28px]">play_arrow</span>
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary">{v.title}</h3>
                  <p className="mt-1 text-xs text-qbit-on-surface-variant">{v.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== SUPPORT CTA ====== */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: "support_agent", title: "Support Center", desc: "Get help from our enterprise support team.", href: "/support" },
            { icon: "menu_book", title: "Knowledge Base", desc: "Browse articles, FAQs, and troubleshooting guides.", href: "/knowledge-base" },
            { icon: "mail", title: "Contact Us", desc: "Reach out for sales, partnerships, or technical issues.", href: "/contact" },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-qbit-outline-variant/50 bg-white p-6 transition-all hover:border-qbit-primary/30 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-qbit-primary/10 text-qbit-primary">
                <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
              </div>
              <h3 className="text-base font-bold text-qbit-on-surface group-hover:text-qbit-primary">{card.title}</h3>
              <p className="mt-1 text-sm text-qbit-on-surface-variant">{card.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary">
                Learn more
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "QBIT Hub — Enterprise Support Portal",
    description: "Drivers, firmware, manuals, videos, and Dr. QBIT diagnostics for every QBIT enterprise hardware product. Apple + Microsoft quality support portal.",
    openGraph: {
      title: "QBIT Hub — Enterprise Support Portal",
      description: "Drivers, firmware, manuals, videos, and Dr. QBIT diagnostics for every QBIT enterprise hardware product.",
      type: "website",
    },
  };
}
