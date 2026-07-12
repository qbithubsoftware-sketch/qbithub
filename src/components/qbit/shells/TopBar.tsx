"use client";

import { cn } from "@/lib/utils";
import { Icon } from "../primitives/Icon";
import { ScreenSwitcher } from "./ScreenSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";

export interface TopBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onSearchFocus?: () => void;
  showSearchKbd?: boolean;
  title?: string;
  navItems?: { label: string; active?: boolean; onClick?: () => void }[];
  user?: {
    name?: string;
    role?: string;
    initials?: string;
    avatar?: string;
  };
  rightExtras?: React.ReactNode;
  showMobileMenu?: boolean;
  onMobileMenu?: () => void;
  rightText?: string;
  rightTextIcon?: string;
}

export function TopBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  onSearchFocus,
  showSearchKbd = false,
  title,
  navItems = [],
  user,
  rightExtras,
  showMobileMenu = false,
  onMobileMenu,
  rightText,
  rightTextIcon,
}: TopBarProps) {
  return (
    <header className="fixed top-0 right-0 z-30 flex h-16 items-center gap-3 border-b border-qbit-outline-variant/50 bg-qbit-surface-container-lowest/80 px-4 backdrop-blur-xl md:px-6"
      style={{ left: "var(--sidebar-width, 256px)" }}
    >
      {/* Mobile menu */}
      {showMobileMenu && (
        <button
          onClick={onMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container md:hidden"
        >
          <Icon name="menu" className="text-[22px]" />
        </button>
      )}

      {/* Title (optional) */}
      {title && (
        <h1 className="hidden lg:block text-[15px] font-semibold text-qbit-on-surface whitespace-nowrap">
          {title}
        </h1>
      )}

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-qbit-on-surface-variant"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          onFocus={onSearchFocus}
          placeholder={searchPlaceholder}
          className="w-full rounded-full border border-transparent bg-qbit-surface-container/70 py-2 pl-10 pr-3 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/60 transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-qbit-primary/20 focus:border-qbit-primary focus:shadow-sm"
        />
        {showSearchKbd && (
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-qbit-outline-variant bg-white px-1.5 py-0.5 text-[10px] font-bold text-qbit-on-surface-variant">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Nav items */}
      {navItems.length > 0 && (
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                item.active
                  ? "bg-qbit-surface-container text-qbit-primary"
                  : "text-qbit-on-surface-variant hover:bg-qbit-surface-container-low",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      {/* Right text */}
      {rightText && (
        <div className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-qbit-on-surface-variant border-l border-qbit-outline-variant pl-3">
          {rightTextIcon && <Icon name={rightTextIcon} className="text-[14px]" filled />}
          {rightText}
        </div>
      )}

      {/* Right extras */}
      <div className="flex items-center gap-1">
        {rightExtras}
        {/* Standard action icons — all h-9 w-9 for consistent touch targets */}
        <button aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-all duration-200 hover:text-qbit-on-surface">
          <Icon name="notifications" className="text-[20px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-qbit-error ring-2 ring-qbit-surface-container-lowest" />
        </button>
        <button aria-label="Help" className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-all duration-200 hover:text-qbit-on-surface">
          <Icon name="help" className="text-[20px]" />
        </button>
        <ThemeToggle />
        <ScreenSwitcher />
        {user && (
          <div className="pl-1 ml-1 border-l border-qbit-outline-variant/40">
            <ProfileMenu />
          </div>
        )}
      </div>
    </header>
  );
}
