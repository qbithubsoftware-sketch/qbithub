"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";
import { ScreenSwitcher } from "@/components/qbit/shells/ScreenSwitcher";
import { useNavigation } from "@/lib/navigation/store";

/**
 * PublicHeader — transparent marketing header for public-facing pages.
 *
 * Features:
 * - Transparent on top, solid on scroll (backdrop-blur)
 * - Logo + search + nav links (Products, Downloads, Support, Contact)
 * - Theme toggle + Screen Switcher
 * - Responsive: collapses to hamburger on mobile
 */
export function PublicHeader({
  onNavigate,
}: {
  onNavigate?: (screen: string) => void;
}) {
  const navigate = useNavigation((s) => s.navigate);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleNav(screen: string) {
    onNavigate?.(screen);
    navigate(screen as never);
    setMobileMenuOpen(false);
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-[72px] items-center px-4 transition-all duration-300 md:px-8",
        scrolled
          ? "border-b border-qbit-outline-variant/30 bg-white/95 shadow-md backdrop-blur-md"
          : "border-b border-transparent bg-white/80 backdrop-blur-md",
      )}
    >
      {/* Logo */}
      <button onClick={() => handleNav("product-overview")} className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary-container">
          <Icon name="terminal" className="text-white" filled />
        </div>
        <span className="text-[20px] font-semibold tracking-tight text-qbit-on-surface">QBIT Hub</span>
      </button>

      {/* Center nav (desktop) */}
      <nav className="ml-8 hidden items-center gap-6 text-sm font-medium text-qbit-on-surface-variant lg:flex">
        <button onClick={() => handleNav("product-overview")} className="hover:text-qbit-primary transition-colors">Products</button>
        <button onClick={() => handleNav("driver-download-center")} className="hover:text-qbit-primary transition-colors">Downloads</button>
        <button onClick={() => handleNav("support-tickets")} className="hover:text-qbit-primary transition-colors">Support</button>
        <button onClick={() => handleNav("installation-center")} className="hover:text-qbit-primary transition-colors">Guides</button>
        <button onClick={() => handleNav("fsm-customer-tracking")} className="inline-flex items-center gap-1 text-qbit-primary hover:underline">
          <Icon name="track_changes" className="text-[16px]" />
          Track Service
        </button>
      </nav>

      {/* Search (desktop, hidden on scroll for cleanliness) */}
      <div className="ml-auto hidden md:flex max-w-xs flex-1 mx-4">
        <div className="relative w-full">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-qbit-outline" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full rounded-full border-none bg-qbit-surface-container-low py-2 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-qbit-primary/20"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <button
          onClick={() => handleNav("login")}
          className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-qbit-primary hover:underline"
        >
          <Icon name="login" className="text-[18px]" />
          Sign In
        </button>
        <ScreenSwitcher />
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container lg:hidden"
          aria-label="Toggle menu"
        >
          <Icon name={mobileMenuOpen ? "close" : "menu"} className="text-[22px]" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-[72px] left-0 right-0 bg-white border-b border-qbit-outline-variant shadow-lg lg:hidden">
          <nav className="flex flex-col p-4 gap-1">
            <button onClick={() => handleNav("product-overview")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container">
              <Icon name="inventory_2" className="text-[20px]" /> Products
            </button>
            <button onClick={() => handleNav("driver-download-center")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container">
              <Icon name="download" className="text-[20px]" /> Downloads
            </button>
            <button onClick={() => handleNav("support-tickets")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container">
              <Icon name="support_agent" className="text-[20px]" /> Support
            </button>
            <button onClick={() => handleNav("installation-center")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-qbit-on-surface-variant hover:bg-qbit-surface-container">
              <Icon name="build" className="text-[20px]" /> Guides
            </button>
            <button onClick={() => handleNav("login")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-qbit-primary hover:bg-qbit-primary/5">
              <Icon name="login" className="text-[20px]" /> Sign In
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
