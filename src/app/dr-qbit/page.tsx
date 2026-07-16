/**
 * /dr-qbit — Serial Number based Customer Device Portal.
 *
 * MAJOR REDESIGN (V4): Replaces the old DrQbitWorkflow (model-number based,
 * multi-mode guest/customer/engineer/admin) with a single, simple, secure
 * customer-facing portal that searches ONLY by Serial Number.
 *
 * Flow:
 *   1. Customer enters their device serial number (or scans QR code)
 *   2. System searches the Device Registration Database
 *   3. If found: animated Support Card expands inline with 5 sections:
 *        - Product Card (image + name + serial + warranty badge)
 *        - Warranty Premium Card (large remaining days + progress bar)
 *        - Downloads (public resources only — RBAC filtered)
 *        - Registered Device (customer + purchase + warranty details)
 *        - Support (raise ticket, contact, WhatsApp)
 *   4. If not found: amber "No registered device found" card
 *   5. If invalid format: red "Invalid Serial Number" card
 *
 * RBAC (Role-Based Access Control):
 *   This page is for GUESTS and CUSTOMERS. Engineer/admin/internal resources
 *   are filtered out at the API level (visibility field on ProductMedia).
 *   Engineer Tools, Admin Tools, Internal Utilities, Testing Files, Factory
 *   Software, Debug Files, Production Tools, Security Tools, Private
 *   Downloads — NEVER visible here.
 *
 *   Staff (engineers/admins) can use /portal → "Device Lookup" which calls
 *   the admin /api/admin/device-lookup endpoint that returns ALL resources
 *   based on their authenticated role.
 */

import { PublicLayout } from "@/components/qbit/public/PublicLayout";
import { CustomerPortal } from "@/components/qbit/public/CustomerPortal";

export const dynamic = "force-dynamic";

export default async function DrQbitPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-qbit-primary/10 px-3 py-1 text-xs font-semibold text-qbit-primary mb-3">
            <span className="material-symbols-outlined text-[14px]">fingerprint</span>
            Customer Device Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-qbit-on-surface">
            Find your device by Serial Number
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-qbit-on-surface-variant">
            Enter your device serial number to instantly access drivers, manuals,
            warranty status, and support resources. Your serial number is unique
            to your device — even customers with the same model have different serials.
          </p>
        </div>

        {/* ===== Customer Portal (serial search + animated result) ===== */}
        <CustomerPortal />

        {/* ===== What you'll see ===== */}
        <div className="mt-12 rounded-2xl border border-qbit-outline-variant/50 bg-qbit-surface-container-low p-6">
          <h2 className="mb-4 text-base font-bold text-qbit-on-surface">What you'll see after lookup</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "inventory_2", label: "Product Info", desc: "Image, name, model, category" },
              { icon: "verified_user", label: "Warranty Card", desc: "Status, expiry, remaining days" },
              { icon: "download", label: "Public Downloads", desc: "Drivers, manuals, firmware, guides" },
              { icon: "person_pin", label: "Registered Device", desc: "Customer + purchase details" },
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
          <p className="mt-4 rounded-lg border border-qbit-success/20 bg-qbit-success/5 p-3 text-xs text-qbit-on-surface-variant">
            <span className="font-semibold text-qbit-success">🔒 Privacy & Security:</span>{" "}
            Engineer tools, admin tools, internal utilities, testing files, and other
            internal resources are <span className="font-semibold">never visible</span> on this
            portal. Only public resources assigned to your product will appear.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Customer Device Portal — QBIT Hub",
    description: "Enter your device serial number to access drivers, manuals, warranty status, and support resources for your registered QBIT device.",
  };
}
