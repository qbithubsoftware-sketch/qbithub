/**
 * /contact — public contact page.
 *
 * Reuses the existing ContactForm component (which submits to /api/public/contact).
 * No login required.
 */

import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { ContactForm } from "@/components/qbit/portal/ContactForm";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-qbit-primary/10 px-3 py-1 text-xs font-semibold text-qbit-primary mb-3">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            Contact
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-qbit-on-surface">Contact Us</h1>
          <p className="mt-2 text-base text-qbit-on-surface-variant">
            Sales, partnerships, technical support — we&apos;ll get back to you within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Contact form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-qbit-outline-variant bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-4 text-lg font-bold text-qbit-on-surface">Send us a message</h2>
              <ContactForm />
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-qbit-outline-variant bg-white p-5">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-qbit-primary/10 text-qbit-primary">
                <span className="material-symbols-outlined text-[20px]">phone</span>
              </div>
              <h3 className="text-sm font-bold text-qbit-on-surface">Phone</h3>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">Mon–Fri, 9:00 AM – 6:00 PM IST</p>
              <a href="tel:+918000000000" className="mt-1 block text-sm font-semibold text-qbit-primary hover:underline">+91 80 0000 0000</a>
            </div>

            <div className="rounded-2xl border border-qbit-outline-variant bg-white p-5">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-qbit-secondary/10 text-qbit-secondary">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <h3 className="text-sm font-bold text-qbit-on-surface">Email</h3>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">Response within 24 hours</p>
              <a href="mailto:support@qbit.com" className="mt-1 block text-sm font-semibold text-qbit-primary hover:underline">support@qbit.com</a>
            </div>

            <div className="rounded-2xl border border-qbit-outline-variant bg-white p-5">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-qbit-tertiary/10 text-qbit-tertiary">
                <span className="material-symbols-outlined text-[20px]">location_on</span>
              </div>
              <h3 className="text-sm font-bold text-qbit-on-surface">Office</h3>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">Corporate Headquarters</p>
              <p className="mt-1 text-xs text-qbit-on-surface">QBIT Hub Technology Group<br />Bengaluru, Karnataka, India</p>
            </div>

            <div className="rounded-2xl border border-qbit-primary/30 bg-qbit-primary/5 p-5">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-qbit-primary text-qbit-on-primary">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <h3 className="text-sm font-bold text-qbit-on-surface">Try Dr. QBIT first</h3>
              <p className="mt-1 text-xs text-qbit-on-surface-variant">Most issues are solved instantly by auto-detection.</p>
              <a href="/dr-qbit" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-qbit-primary hover:underline">
                Run Dr. QBIT
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Contact — QBIT Hub",
    description: "Contact QBIT Hub for sales, partnerships, and technical support.",
  };
}
