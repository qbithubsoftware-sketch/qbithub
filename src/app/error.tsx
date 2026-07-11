"use client";

/**
 * Global error boundary — catches unexpected runtime errors that escape
 * any route segment.  Mirrors the Stitch error aesthetic.
 */

import { useEffect } from "react";
import { Icon } from "@/components/qbit/primitives/Icon";
import { QbitButton } from "@/components/qbit/primitives/QbitButton";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would forward to an error reporter.
    console.error("QBIT Hub runtime error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-qbit-background p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-qbit-error-container text-qbit-on-error-container">
        <Icon name="error" className="text-[40px]" filled />
      </div>
      <p className="mt-6 text-5xl font-bold text-qbit-on-surface">Error</p>
      <h1 className="mt-2 text-xl font-semibold text-qbit-on-surface">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-qbit-on-surface-variant">
        An unexpected error occurred while rendering this page. You can try
        again, or refresh the page if the problem persists.
      </p>
      {error.digest && (
        <p className="mt-4 rounded bg-qbit-surface-container px-2 py-1 text-[10px] font-mono text-qbit-on-surface-variant">
          Ref: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <QbitButton variant="primary" icon="refresh" onClick={reset}>
          Try Again
        </QbitButton>
      </div>
    </div>
  );
}
