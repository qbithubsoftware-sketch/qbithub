"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type QbitButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "surface" | "primary-container";
type QbitButtonSize = "sm" | "md" | "lg" | "icon";

export interface QbitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: QbitButtonVariant;
  size?: QbitButtonSize;
  icon?: string;
  iconRight?: string;
  iconFilled?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<QbitButtonVariant, string> = {
  primary:
    "bg-qbit-primary text-qbit-on-primary hover:bg-qbit-primary-container hover:shadow-md hover:shadow-qbit-primary/20 active:scale-[0.98]",
  "primary-container":
    "bg-qbit-primary-container text-qbit-on-primary-container hover:brightness-110 hover:shadow-md active:scale-[0.98]",
  secondary:
    "bg-qbit-secondary-container text-qbit-on-secondary-container hover:brightness-110 hover:shadow-md active:scale-[0.98]",
  outline:
    "border border-qbit-outline-variant/60 bg-transparent text-qbit-on-surface hover:bg-qbit-surface-container hover:border-qbit-outline active:scale-[0.98]",
  danger:
    "bg-qbit-error text-qbit-on-error hover:brightness-110 hover:shadow-md hover:shadow-qbit-error/20 active:scale-[0.98]",
  ghost:
    "text-qbit-on-surface-variant hover:bg-qbit-surface-container hover:text-qbit-on-surface active:scale-[0.98]",
  surface:
    "bg-qbit-surface-container-low text-qbit-on-surface hover:bg-qbit-surface-container border border-qbit-outline-variant/50 active:scale-[0.98]",
};

const SIZE_CLASS: Record<QbitButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

export function QbitButton({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  iconFilled,
  fullWidth,
  className,
  children,
  ...rest
}: QbitButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} className={size === "sm" ? "text-[14px]" : "text-[18px]"} filled={iconFilled} />}
      {children}
      {iconRight && <Icon name={iconRight} className={size === "sm" ? "text-[14px]" : "text-[18px]"} />}
    </button>
  );
}
