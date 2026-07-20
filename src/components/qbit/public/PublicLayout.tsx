"use client";

/**
 * PublicLayout — V3 architecture wrapper for all public-facing Next.js routes.
 *
 * Renders a premium header (logo + nav: Products/Drivers/Downloads/KB/Support/
 * Videos/Dr.QBIT/Contact + Login + Search) and the marketing footer, with
 * main content in between. Reuses the existing Stitch design language:
 *   - qbit-primary-container logo background
 *   - Material Symbols icons
 *   - Surface container palette
 *   - 72px header height with scroll-aware backdrop blur
 *
 * This component is for routes OUTSIDE the /portal Zustand app — i.e. /, /drivers,
 * /downloads, /knowledge-base, /support, /videos, /dr-qbit, /contact, /products,
 * /products/[slug], /accounts/login.
 *
 * For the legacy Zustand-driven screens (Dashboard, Engineer workspace, Admin
 * Product Center, etc.) the existing AppShell + AuthGuard pipeline at /portal
 * is unchanged.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";

const NAV_ITEMS: ReadonlyArray<{ label: string; href: string; icon: string }> = [
  { label: "Products", href: "/products", icon: "inventory_2" },
  { label: "Drivers", href: "/drivers", icon: "memory" },
  { label: "Knowledge Base", href: "/knowledge-base", icon: "menu_book" },
  { label: "Support", href: "/support", icon: "support_agent" },
  { label: "Videos", href: "/videos", icon: "videocam" },
  { label: "Dr. QBIT", href: "/dr-qbit", icon: "smart_toy" },
  { label: "Contact", href: "/contact", icon: "mail" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <div className="flex min-h-screen flex-col bg-qbit-background">
      {/* HEADER */}
      <header
        className={cn(
          "sticky top-0 left-0 right-0 z-50 flex h-[72px] items-center px-4 transition-all duration-300 md:px-8",
          scrolled
            ? "border-b border-qbit-outline-variant/30 bg-white/95 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-white/80 backdrop-blur-md",
        )}
      >
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary-container">
            <Icon name="terminal" className="text-[24px] text-qbit-on-primary-container" filled />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-base font-bold text-qbit-on-surface">QBIT Hub</span>
            <span className="text-[10px] uppercase tracking-wider text-qbit-on-surface-variant">Support Portal</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-8 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-qbit-primary-container text-qbit-on-primary-container"
                  : "text-qbit-on-surface-variant hover:bg-qbit-surface-container-high hover:text-qbit-on-surface",
              )}
            >
              <Icon name={item.icon} className="text-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-qbit-on-surface-variant transition-colors hover:bg-qbit-surface-container-high"
          >
            <Icon name="search" className="text-[22px]" />
          </button>
          <Link
            href="/accounts/login"
            className="hidden md:flex items-center gap-1.5 rounded-lg bg-qbit-primary px-4 py-2 text-sm font-semibold text-qbit-on-primary transition-colors hover:bg-qbit-primary-container"
          >
            <Icon name="account_circle" className="text-[18px]" />
            Login
          </Link>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container-high"
          >
            <Icon name={mobileOpen ? "close" : "menu"} className="text-[24px]" />
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="sticky top-[72px] z-40 border-b border-qbit-outline-variant/30 bg-white/95 backdrop-blur-md">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-qbit-on-surface-variant" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, drivers, manuals, model numbers…"
                className="w-full rounded-xl border border-qbit-outline-variant bg-qbit-surface-container-lowest py-3 pl-12 pr-4 text-sm text-qbit-on-surface focus:border-qbit-primary focus:outline-none focus:ring-2 focus:ring-qbit-primary/30"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-qbit-on-surface-variant hover:text-qbit-on-surface"
                aria-label="Close search"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </form>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[72px] z-40 bg-white">
          <nav className="flex flex-col p-4 gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-qbit-primary-container text-qbit-on-primary-container"
                    : "text-qbit-on-surface-variant hover:bg-qbit-surface-container-high",
                )}
              >
                <Icon name={item.icon} className="text-[22px]" />
                {item.label}
              </Link>
            ))}
            <Link
              href="/accounts/login"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-qbit-primary px-4 py-3 text-sm font-semibold text-qbit-on-primary"
            >
              <Icon name="account_circle" className="text-[20px]" />
              Login
            </Link>
          </nav>
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1">{children}</main>

      {/* FOOTER */}
      <footer className="bg-qbit-on-background text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary-container">
                  <Icon name="terminal" className="text-[24px] text-qbit-on-primary-container" filled />
                </div>
                <span className="text-lg font-semibold">QBIT Hub</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed max-w-sm">
                Enterprise-grade POS, printer, scanner, and kiosk hardware with
                precision support. Drivers, manuals, firmware, and Dr. QBIT
                diagnostics — all in one place.
              </p>
              <div className="flex gap-3 mt-4">
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <Icon name="play_circle" className="text-[18px]" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <Icon name="group" className="text-[18px]" />
                </a>
                <Link href="/contact" aria-label="Contact" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <Icon name="mail" className="text-[18px]" />
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-white/90">Products</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="/products?category=window-pos" className="hover:text-white transition-colors">Window POS</Link></li>
                <li><Link href="/products?category=android-pos" className="hover:text-white transition-colors">Android POS</Link></li>
                <li><Link href="/products?category=handy-pos" className="hover:text-white transition-colors">Handy POS</Link></li>
                <li><Link href="/products?category=thermal-printer" className="hover:text-white transition-colors">Thermal Printers</Link></li>
                <li><Link href="/products?category=portable-printer" className="hover:text-white transition-colors">Portable Printers</Link></li>
                <li><Link href="/products?category=barcode-printer" className="hover:text-white transition-colors">Barcode Printers</Link></li>
                <li><Link href="/products?category=barcode-scanner" className="hover:text-white transition-colors">Barcode Scanners</Link></li>
                <li><Link href="/products?category=cash-drawer" className="hover:text-white transition-colors">Cash Drawers</Link></li>
                <li><Link href="/products?category=customer-side-display" className="hover:text-white transition-colors">Customer Displays</Link></li>
                <li><Link href="/products?category=self-ordering-kiosk" className="hover:text-white transition-colors">Self-Ordering Kiosks</Link></li>
                <li><Link href="/products?category=digital-standee" className="hover:text-white transition-colors">Digital Standees</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-white/90">Support</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="/drivers" className="hover:text-white transition-colors">Drivers</Link></li>
                <li><Link href="/downloads" className="hover:text-white transition-colors">Downloads</Link></li>
                <li><Link href="/knowledge-base" className="hover:text-white transition-colors">Knowledge Base</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60">
            <span>© {new Date().getFullYear()} QBIT Hub Technology Group. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/support" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/support" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/support" className="hover:text-white transition-colors">Warranty Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
