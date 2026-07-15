/**
 * /knowledge-base — public knowledge base / FAQ / troubleshooting articles.
 *
 * NOTE: The Article Prisma model does not currently exist in the schema.
 * This page renders a curated static knowledge base that links to existing
 * resources (Dr. QBIT, Support, Videos, Downloads). When the Article model
 * is added in a future iteration, this page will switch to fetching from DB.
 */

import Link from "next/link";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";

export const dynamic = "force-dynamic";

const STATIC_ARTICLES = [
  {
    title: "How to install QBIT T-800 Thermal Printer on Windows 11",
    excerpt: "Step-by-step driver installation guide for Windows 11. Covers USB, LAN, and Bluetooth connectivity options.",
    category: "Installation",
    icon: "print",
    href: "/products/t800",
  },
  {
    title: "Dr. QBIT — How auto-detect works",
    excerpt: "Understand how Dr. QBIT scans USB/COM/LAN devices and matches them to QBIT product catalog entries.",
    category: "Dr. QBIT",
    icon: "smart_toy",
    href: "/dr-qbit",
  },
  {
    title: "Firmware update guide for HUB-X Pro",
    excerpt: "Walkthrough of the firmware update process for HUB-X Pro, including rollback procedures.",
    category: "Firmware",
    icon: "upgrade",
    href: "/products/hub-x-pro",
  },
  {
    title: "Common barcode scanner issues and fixes",
    excerpt: "Troubleshooting guide for ScanMaster Elite — covers connectivity, scan failures, and configuration resets.",
    category: "Troubleshooting",
    icon: "barcode_scanner",
    href: "/products/scanmaster-elite",
  },
  {
    title: "Setting up cash drawer with RJ11 trigger",
    excerpt: "How to wire a CD-410 cash drawer to your POS printer and test the trigger pulse.",
    category: "Installation",
    icon: "point_of_sale",
    href: "/products/cd-410",
  },
  {
    title: "POS software integration via QBIT SDK",
    excerpt: "Quickstart guide for integrating QBIT printers and scanners into your POS software using the official SDK.",
    category: "SDK",
    icon: "code",
    href: "/downloads",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Installation: "bg-qbit-primary/10 text-qbit-primary",
  "Dr. QBIT": "bg-qbit-secondary/10 text-qbit-secondary",
  Firmware: "bg-qbit-tertiary/10 text-qbit-tertiary",
  Troubleshooting: "bg-qbit-error/10 text-qbit-error",
  SDK: "bg-qbit-primary/10 text-qbit-primary",
};

export default function KnowledgeBasePage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-qbit-primary/10 px-3 py-1 text-xs font-semibold text-qbit-primary mb-3">
            <span className="material-symbols-outlined text-[14px]">menu_book</span>
            Knowledge Base
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-qbit-on-surface">Knowledge Base</h1>
          <p className="mt-2 text-base text-qbit-on-surface-variant">
            Articles, FAQs, and troubleshooting guides for every QBIT product.
          </p>
        </div>

        {/* Search hint */}
        <div className="mb-8 rounded-2xl border border-qbit-primary/30 bg-qbit-primary/5 p-5 text-center">
          <p className="text-sm font-semibold text-qbit-on-surface">Looking for something specific?</p>
          <p className="mt-1 text-xs text-qbit-on-surface-variant">
            Use the search bar at the top of the page, or{" "}
            <Link href="/dr-qbit" className="font-semibold text-qbit-primary hover:underline">run Dr. QBIT</Link>
            {" "}to auto-detect your device.
          </p>
        </div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STATIC_ARTICLES.map((a, i) => (
            <Link
              key={i}
              href={a.href}
              className="group flex flex-col rounded-2xl border border-qbit-outline-variant bg-white p-5 shadow-sm transition-all hover:border-qbit-primary/30 hover:shadow-lg"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[a.category] ?? "bg-qbit-surface-container-high text-qbit-on-surface-variant"}`}>
                  {a.category}
                </span>
                <span className={`material-symbols-outlined text-[24px] text-qbit-primary`}>
                  {a.icon}
                </span>
              </div>
              <h3 className="text-sm font-bold text-qbit-on-surface group-hover:text-qbit-primary line-clamp-2">{a.title}</h3>
              <p className="mt-2 flex-1 text-xs text-qbit-on-surface-variant line-clamp-3">{a.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary">
                Read article
                <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">arrow_forward</span>
              </span>
            </Link>
          ))}
        </div>

        {/* Help CTA */}
        <div className="mt-12 rounded-2xl border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-6 text-center">
          <h2 className="text-base font-bold text-qbit-on-surface">Can&apos;t find what you need?</h2>
          <p className="mt-1 text-sm text-qbit-on-surface-variant">Our support team is here to help.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 rounded-lg bg-qbit-primary px-4 py-2 text-xs font-semibold text-qbit-on-primary"
            >
              <span className="material-symbols-outlined text-[16px]">support_agent</span>
              Support Center
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-lg border border-qbit-outline-variant px-4 py-2 text-xs font-semibold text-qbit-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">mail</span>
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Knowledge Base — QBIT Hub",
    description: "Articles, FAQs, and troubleshooting guides for QBIT hardware.",
  };
}
