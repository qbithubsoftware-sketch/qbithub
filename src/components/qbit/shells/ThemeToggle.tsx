"use client";

/**
 * Theme toggle — Light / Dark / System cycle button for the top bar.
 *
 * Renders the same Material Symbols icon slot the original Stitch top bar
 * uses (`dark_mode`), but cycles between light → dark → system on click.
 * Persists the choice via next-themes (localStorage key `qbit-theme`).
 *
 * Implementation note: we avoid the `useEffect + setState` mounted pattern
 * (forbidden by react-hooks/set-state-in-effect) by suppressing hydration
 * warnings on the icon span and reading `theme` directly — next-themes
 * updates `theme` after mount, so the icon naturally updates post-hydration.
 */

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/qbit/primitives/Icon";

type ThemeChoice = "light" | "dark" | "system";

const ORDER: ThemeChoice[] = ["dark", "light", "system"];

const LABEL: Record<ThemeChoice, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const ICON: Record<ThemeChoice, string> = {
  light: "light_mode",
  dark: "dark_mode",
  system: "desktop_windows",
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  // `theme` is undefined on first client render (before next-themes resolves
  // localStorage) — default to "system" so the SSR + initial client render
  // agree, then the icon swaps to the persisted choice after hydration.
  const current: ThemeChoice = (theme as ThemeChoice) ?? "system";

  function cycle() {
    const idx = ORDER.indexOf(current);
    const next = ORDER[(idx + 1) % ORDER.length];
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[current]}. Click to switch.`}
      title={`Theme: ${LABEL[current]}`}
      suppressHydrationWarning
      className={cn(
        "hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors",
        className,
      )}
    >
      <Icon name={ICON[current]} className="text-[20px]" />
    </button>
  );
}
