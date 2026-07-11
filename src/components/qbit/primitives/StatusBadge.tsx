"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "primary"
  | "neutral";

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-800",
  info: "bg-qbit-primary/10 text-qbit-primary",
  primary: "bg-qbit-primary text-white",
  neutral: "bg-qbit-surface-container-highest text-qbit-on-surface-variant",
};

export function StatusBadge({
  variant = "neutral",
  children,
  icon,
  className,
  dot = false,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: string;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        VARIANT_CLASS[variant],
        className,
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {icon && <Icon name={icon} className="text-[12px]" filled />}
      {children}
    </span>
  );
}

/** Solid pill badge (e.g. NEW RELEASE, POPULAR). */
export function TagBadge({
  children,
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "neutral" | "error";
}) {
  const variants = {
    primary: "bg-qbit-primary text-qbit-on-primary",
    secondary: "bg-qbit-secondary-container text-qbit-on-secondary-container",
    neutral: "bg-qbit-surface-container-highest text-qbit-on-surface-variant",
    error: "bg-qbit-error text-qbit-on-error",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
