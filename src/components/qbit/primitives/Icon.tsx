"use client";

import { cn } from "@/lib/utils";

/**
 * Material Symbols Outlined icon wrapper.
 *
 * Usage: <Icon name="dashboard" className="text-[20px]" filled />
 */
export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  filled?: boolean;
}

export function Icon({ name, filled, className, style, ...rest }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "material-symbols-outlined select-none",
        filled && "filled",
        className,
      )}
      style={{
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        ...style,
      }}
      {...rest}
    >
      {name}
    </span>
  );
}
