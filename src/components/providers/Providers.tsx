"use client";

/**
 * Client-side providers wrapper.
 *
 * Bundles NextAuth SessionProvider and next-themes ThemeProvider so the
 * root layout only needs to mount a single component.  Theme is persisted
 * to localStorage and respects the user's `prefers-color-scheme` when set
 * to "system".
 */

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { TourProvider } from "@/lib/tour/tour-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        storageKey="qbit-theme"
      >
        <TourProvider>
          {children}
        </TourProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
