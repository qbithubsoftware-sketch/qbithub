"use client";

/**
 * Offline fallback page — shown when the service worker can't reach the network
 * and no cached navigation is available.
 */

import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";
import { useNavigation } from "@/lib/navigation/store";

export default function OfflinePage() {
  const navigate = useNavigation((s) => s.navigate);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-qbit-surface px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-qbit-error/10 text-qbit-error">
        <Icon name="cloud_off" className="text-[48px]" filled />
      </div>
      <h1 className="text-2xl font-bold text-qbit-on-surface">You're Offline</h1>
      <p className="mt-2 max-w-sm text-sm text-qbit-on-surface-variant">
        The QBIT Engineer app needs an internet connection to load fresh data.
        Any changes you've made while offline are saved locally and will sync
        automatically when you reconnect.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <QbitButton
          variant="primary"
          icon="refresh"
          onClick={() => window.location.reload()}
        >
          Try Again
        </QbitButton>
        <QbitButton
          variant="outline"
          icon="home"
          onClick={() => navigate("mobile-engineer")}
        >
          Go to Home (Cached)
        </QbitButton>
      </div>
      <p className="mt-8 text-xs text-qbit-on-surface-variant">
        Need help? Call QBIT Support at <span className="font-semibold text-qbit-primary">1800-123-4567</span>
      </p>
    </div>
  );
}
