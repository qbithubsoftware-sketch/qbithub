"use client";

import { cn } from "@/lib/utils";
import { Icon } from "../primitives/Icon";
import { ScreenSwitcher } from "./ScreenSwitcher";

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
    <header className="fixed top-0 right-0 z-40 flex h-16 items-center gap-3 border-b border-qbit-outline-variant bg-qbit-surface-container-lowest/80 px-4 backdrop-blur-md md:px-6"
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
          className="w-full rounded-full border border-qbit-outline-variant/60 bg-qbit-surface-container-low py-2 pl-10 pr-3 text-sm text-qbit-on-surface placeholder:text-qbit-on-surface-variant/70 transition-all focus:bg-white focus:ring-2 focus:ring-qbit-primary/40 focus:border-qbit-primary"
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
      <div className="flex items-center gap-1.5">
        {rightExtras}
        {/* Standard action icons */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors">
          <Icon name="notifications" className="text-[20px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-qbit-error" />
        </button>
        <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors">
          <Icon name="help" className="text-[20px]" />
        </button>
        <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-qbit-on-surface-variant hover:bg-qbit-surface-container transition-colors">
          <Icon name="dark_mode" className="text-[20px]" />
        </button>
        <ScreenSwitcher />
        {user && (
          <div className="flex items-center gap-2 pl-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-qbit-primary text-xs font-bold text-qbit-on-primary ring-2 ring-white">
              {user.initials ?? user.name?.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            {user.name && (
              <div className="hidden lg:block min-w-0">
                <p className="truncate text-xs font-semibold text-qbit-on-surface">{user.name}</p>
                {user.role && (
                  <p className="truncate text-[10px] text-qbit-on-surface-variant">{user.role}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
