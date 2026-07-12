"use client";

import { Icon } from "@/components/qbit/primitives/Icon";
import { NewsletterSignup } from "./NewsletterSignup";

/**
 * PublicFooter — marketing footer for public-facing pages.
 *
 * Features:
 * - Dark background (bg-qbit-on-background)
 * - 4-column layout: Brand + Newsletter + Products + Resources
 * - Copyright row with Privacy / Terms / Cookie links
 */
export function PublicFooter() {
  return (
    <footer className="bg-qbit-on-background text-white">
      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-qbit-primary-container">
                <Icon name="terminal" className="text-white" filled />
              </div>
              <span className="text-lg font-semibold">QBIT Hub</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-sm">
              Empowering the world&apos;s leading enterprises with precision-engineered
              hardware solutions for over two decades.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Twitter" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Icon name="share" className="text-[18px]" />
              </a>
              <a href="#" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Icon name="play_circle" className="text-[18px]" />
              </a>
              <a href="#" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Icon name="group" className="text-[18px]" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-white/90">Products</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">T-Series Terminals</a></li>
              <li><a href="#" className="hover:text-white transition-colors">S-Series Scanners</a></li>
              <li><a href="#" className="hover:text-white transition-colors">P-Series Printers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Custom OEM</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-white/90">Resources</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Developer SDK</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
              <li><a href="#" className="hover:text-white transition-colors">White Papers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pt-8 border-t border-white/10">
          <div>
            <h4 className="text-sm font-semibold mb-1 text-white/90">Subscribe to our newsletter</h4>
            <p className="text-xs text-white/60">Get product updates, firmware releases, and enterprise tips.</p>
          </div>
          <NewsletterSignup compact />
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
          <p>© 2024 QBIT Hub Technology Group. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
