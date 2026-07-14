/**
 * /dr-qbit — public Dr. QBIT landing page.
 *
 * Two options:
 *   1. Auto Detect Hardware (WebUSB scanner — reuses existing WebUsbScanner component)
 *   2. Manual Model Search (search box → /products?search=…)
 *
 * After detection/search, the user is routed to /products/[slug] which shows
 * all the resources (driver, firmware, manual, video, downloads). Warranty
 * info is only visible after login (handled by the product detail page).
 */

import Link from "next/link";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { PublicDrQbitClient } from "@/components/qbit/public/PublicDrQbitClient";

export const dynamic = "force-dynamic";

const EXAMPLE_MODELS = ["T800", "BS550", "LD300", "CD200", "HUB-X Pro", "KDS-1500"];

export default async function DrQbitPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-qbit-secondary/10 px-3 py-1 text-xs font-semibold text-qbit-secondary mb-3">
            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            Dr. QBIT AI Diagnostics
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-qbit-on-surface">
            Find drivers, firmware, and manuals in seconds
          </h1>
          <p className="mt-3 text-base text-qbit-on-surface-variant">
            Auto-detect your connected hardware, or search by model number.
          </p>
        </div>

        {/* Two options */}
        <PublicDrQbitClient exampleModels={EXAMPLE_MODELS} />

        {/* What happens next */}
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
            {" "}— this protects device ownership privacy.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Dr. QBIT — QBIT Hub",
    description: "Auto-detect your QBIT hardware and get instant access to drivers, firmware, manuals, and videos.",
  };
}
