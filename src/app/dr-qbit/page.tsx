/**
 * /dr-qbit — public Dr. QBIT diagnostic page (V3).
 *
 * STAYS INSIDE /dr-qbit for the entire workflow. NEVER redirects guests to
 * /portal, /admin, or /dashboard.
 *
 * Three operating modes (auto-detected from session):
 *   1. Guest    (no login)     — public product info + downloads + basic diagnostics
 *   2. Customer (logged in)    — guest fields + own warranty + own history
 *   3. Engineer (logged in)    — customer fields + deep diagnostics + service tools
 *   4. Admin    (logged in)    — engineer fields + management tools
 *
 * Flow:
 *   - User enters a model number OR clicks "Launch Scanner"
 *   - Scanner panel opens inline (no redirect, no page refresh)
 *   - Loading animation + scan progress
 *   - Results appear inline: device image, product name, model, category,
 *     OS, compatible driver, latest driver, firmware, manual, datasheet,
 *     brochure, videos, KB, downloads, support contact, related products
 *   - Guest users see lock icons on warranty/history/customer-details fields.
 *     Clicking a locked field opens the LoginModal (NEVER redirects).
 *
 * SECURITY: Guest users never see customer name, mobile, purchase date,
 * invoice, warranty, installation/service history, engineer name, AMC,
 * registered device details, asset ID, QR activation, internal/admin notes.
 */

import Link from "next/link";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { DrQbitWorkflow } from "@/components/qbit/public/DrQbitWorkflow";

export const dynamic = "force-dynamic";

export default async function DrQbitPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-qbit-secondary/10 px-3 py-1 text-xs font-semibold text-qbit-secondary mb-3">
            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            Dr. QBIT AI Diagnostics
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-qbit-on-surface">
            Find drivers, firmware, and manuals in seconds
          </h1>
          <p className="mt-3 text-base text-qbit-on-surface-variant">
            Auto-detect your connected hardware, or search by model number.
            No login required for public downloads.
          </p>
        </div>

        {/* ===== Workflow (handles all 3 modes + scan + results) ===== */}
        <DrQbitWorkflow />

        {/* ===== What Dr. QBIT shows you ===== */}
        <div className="mt-12 rounded-2xl border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-6">
          <h2 className="mb-4 text-base font-bold text-qbit-on-surface">What Dr. QBIT shows you</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "memory", label: "Latest Driver", desc: "Windows / Linux / Android" },
              { icon: "upgrade", label: "Firmware", desc: "Latest + previous versions" },
              { icon: "menu_book", label: "Manual", desc: "User guide PDF" },
              { icon: "videocam", label: "Videos", desc: "Install + setup walkthroughs" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-qbit-outline-variant/50 bg-white p-4">
                <span className="material-symbols-outlined text-[24px] text-qbit-primary">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-qbit-on-surface">{item.label}</p>
                  <p className="text-[11px] text-qbit-on-surface-variant">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-qbit-on-surface-variant">
            <span className="font-semibold">Warranty information</span> is only visible after you{" "}
            <Link href="/accounts/login" className="text-qbit-primary hover:underline">sign in</Link>
            {" "}— this protects device ownership privacy. Guest users can still download all
            public resources (drivers, firmware, manuals, videos, SDKs).
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Dr. QBIT — QBIT Hub",
    description: "Auto-detect your QBIT hardware and get instant access to drivers, firmware, manuals, and videos. No login required for public downloads.",
  };
}
