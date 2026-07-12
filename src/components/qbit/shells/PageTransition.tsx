"use client";

import { cn } from "@/lib/utils";

/**
 * PageTransition — wraps page content with a subtle fade + slide-up
 * animation when the page mounts or changes.
 *
 * Uses the CSS animation `qbit-fade-in-up` (250ms ease-out) defined
 * in globals.css.  No layout shift — the animation is transform-only.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("animate-qbit-fade-in-up", className)}>
      {children}
    </div>
  );
}
