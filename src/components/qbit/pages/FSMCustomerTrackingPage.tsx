"use client";

/**
 * FSMCustomerTrackingPage — public tracking page.
 *
 * No auth required. Reuses PublicHeader / PublicFooter from the portal layer.
 * Customer enters tracking code or job number → sees live status.
 */

import { PublicHeader } from "@/components/qbit/portal/PublicHeader";
import { PublicFooter } from "@/components/qbit/portal/PublicFooter";
import { ScreenSwitcher } from "@/components/qbit/shells/ScreenSwitcher";
import { CustomerTracking } from "@/components/qbit/fsm";
import { useNavigation } from "@/lib/navigation/store";

export function FSMCustomerTrackingPage() {
  const params = useNavigation((s) => s.params);
  const navigate = useNavigation((s) => s.navigate);

  // If navigated with a tracking code, pre-seed it.
  const initialData = params.trackingCode ? null : null;

  return (
    <div className="flex min-h-screen flex-col bg-white text-qbit-on-surface">
      <div className="fixed top-4 right-4 z-[100]">
        <ScreenSwitcher />
      </div>
      <PublicHeader />
      <main className="flex-1 pt-[72px]">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-qbit-on-surface md:text-4xl">
              Track Your QBIT Service
            </h1>
            <p className="mt-2 text-sm text-qbit-on-surface-variant md:text-base">
              Real-time status of your installation, relocation, or service visit.
            </p>
          </div>
          <CustomerTracking initialData={initialData} />
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate("product-overview")}
              className="text-sm font-medium text-qbit-primary hover:underline"
            >
              ← Back to QBIT Hub
            </button>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
