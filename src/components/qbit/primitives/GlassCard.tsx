"use client";

import { cn } from "@/lib/utils";

/** Glass-card surface used across the QBIT Hub design. */
export function GlassCard({
  className,
  children,
  hover = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl shadow-sm",
        hover && "card-hover-lift",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Solid surface card (no glass blur) — used for higher-contrast blocks. */
export function SurfaceCard({
  className,
  children,
  hover = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "bg-qbit-surface-container-lowest border border-qbit-outline-variant/60 rounded-xl shadow-sm transition-all duration-200",
        hover && "hover:shadow-md hover:border-qbit-outline-variant",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Decorative pill label. */
export function Pill({
  children,
  className,
  icon,
}: {
  children: React.ReactNode;
  className?: string;
  icon?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        "bg-qbit-surface-container-low text-qbit-on-surface-variant border border-qbit-outline-variant/60",
        className,
      )}
    >
      {icon && (
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
      )}
      {children}
    </span>
  );
}
