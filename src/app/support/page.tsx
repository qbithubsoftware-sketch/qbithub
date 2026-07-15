/**
 * /support — public support center landing page.
 *
 * Offers multiple support channels: Dr. QBIT diagnostics, knowledge base,
 * contact form, video tutorials. No login required.
 */

import Link from "next/link";
import { PublicLayout } from "@/components/qbit/public/PublicLayout";

export const dynamic = "force-dynamic";

const SUPPORT_OPTIONS = [
  {
    icon: "smart_toy",
    title: "Dr. QBIT AI Diagnostics",
    desc: "Auto-detect your hardware and get instant driver, firmware, and manual recommendations.",
    href: "/dr-qbit",
    cta: "Run Diagnostics",
    color: "bg-qbit-primary/10 text-qbit-primary",
  },
  {
    icon: "menu_book",
    title: "Knowledge Base",
    desc: "Browse articles, FAQs, and step-by-step troubleshooting guides written by our engineers.",
    href: "/knowledge-base",
    cta: "Search Articles",
    color: "bg-qbit-secondary/10 text-qbit-secondary",
  },
  {
    icon: "videocam",
    title: "Video Tutorials",
    desc: "Watch installation walkthroughs, training sessions, and troubleshooting videos.",
    href: "/videos",
    cta: "Watch Videos",
    color: "bg-qbit-tertiary/10 text-qbit-tertiary",
  },
  {
    icon: "download",
    title: "Download Center",
    desc: "Get the latest drivers, firmware, manuals, SDKs, and utilities — no login required.",
    href: "/downloads",
    cta: "Browse Downloads",
    color: "bg-qbit-primary/10 text-qbit-primary",
  },
  {
    icon: "mail",
    title: "Contact Support",
    desc: "Reach our enterprise support team for sales, partnerships, or technical issues.",
    href: "/contact",
    cta: "Contact Us",
    color: "bg-qbit-secondary/10 text-qbit-secondary",
  },
  {
    icon: "account_circle",
    title: "Customer Login",
    desc: "Access your registered devices, warranty status, and service history.",
    href: "/accounts/login",
    cta: "Sign In",
    color: "bg-qbit-tertiary/10 text-qbit-tertiary",
  },
];

export default function SupportPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-qbit-primary/10 px-3 py-1 text-xs font-semibold text-qbit-primary mb-3">
            <span className="material-symbols-outlined text-[14px]">support_agent</span>
            Support Center
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-qbit-on-surface">How can we help?</h1>
          <p className="mt-2 text-base text-qbit-on-surface-variant">
            Pick a support channel below — or run Dr. QBIT for instant diagnostics.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SUPPORT_OPTIONS.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              className="group flex flex-col rounded-2xl border border-qbit-outline-variant/50 bg-white p-6 transition-all hover:border-qbit-primary/30 hover:shadow-lg"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${opt.color}`}>
                <span className="material-symbols-outlined text-[24px]">{opt.icon}</span>
              </div>
              <h2 className="text-base font-bold text-qbit-on-surface group-hover:text-qbit-primary">{opt.title}</h2>
              <p className="mt-1 flex-1 text-sm text-qbit-on-surface-variant">{opt.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary">
                {opt.cta}
                <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">arrow_forward</span>
              </span>
            </Link>
          ))}
        </div>

        {/* Featured: Dr. QBIT band */}
        <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-qbit-primary to-qbit-secondary p-8 text-center text-white md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold">Try Dr. QBIT first</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/90">
            Most support issues are solved instantly by Dr. QBIT — auto-detect your
            hardware, get the right driver + firmware + manual in one click.
          </p>
          <Link
            href="/dr-qbit"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-qbit-primary hover:bg-white/90"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            Run Dr. QBIT Now
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Support — QBIT Hub",
    description: "Get support for QBIT hardware: Dr. QBIT diagnostics, knowledge base, video tutorials, downloads, and contact.",
  };
}
