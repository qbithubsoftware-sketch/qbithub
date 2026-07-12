"use client";

import { cn } from "@/lib/utils";
import { Icon } from "../primitives/Icon";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";

export type SidebarVariant = "engineer" | "admin" | "field" | "ai-support" | "instalcore";

export interface NavItem {
  label: string;
  icon: string;
  screen?: ScreenId;
  badge?: string;
}

export interface SidebarProps {
  variant: SidebarVariant;
  brand: {
    title: string;
    tagline: string;
    icon?: string;
  };
  items: NavItem[];
  activeScreen: ScreenId;
  user: {
    name: string;
    role: string;
    initials?: string;
    avatar?: string;
    meta?: string;
  };
  cta?: {
    label: string;
    icon: string;
    onClick?: () => void;
  };
  footerItems?: NavItem[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function Sidebar({
  variant,
  brand,
  items,
  activeScreen,
  user,
  cta,
  footerItems = [],
  collapsed = false,
  onToggleCollapse,
  className,
}: SidebarProps) {
  const navigate = useNavigation((s) => s.navigate);

  const brandIcon = brand.icon ?? "dataset";
  const brandIconBg =
    variant === "field"
      ? "bg-qbit-primary-container text-qbit-on-primary-container"
      : variant === "admin"
        ? "bg-qbit-secondary-container text-qbit-on-secondary-container"
        : "bg-qbit-primary text-qbit-on-primary";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-qbit-outline-variant bg-qbit-surface-container-lowest shadow-sm transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        className,
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-qbit-outline-variant/60">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            brandIconBg,
          )}
        >
          <Icon name={brandIcon} className="text-[22px]" filled />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-bold leading-tight text-qbit-on-surface">
              {brand.title}
            </h2>
            <p className="truncate text-[11px] font-medium text-qbit-on-surface-variant">
              {brand.tagline}
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      {cta && !collapsed && (
        <div className="px-4 pt-4">
          <button
            onClick={cta.onClick}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-qbit-primary px-4 py-2.5 text-sm font-semibold text-qbit-on-primary transition-all hover:bg-qbit-primary-container active:scale-95"
          >
            <Icon name={cta.icon} className="text-[18px]" />
            {cta.label}
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = item.screen === activeScreen;
            return (
              <li key={item.label}>
                <button
                  onClick={() => item.screen && navigate(item.screen)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    collapsed && "justify-center px-0",
                    active
                      ? "sidebar-active-indicator bg-qbit-primary-container/10 text-qbit-primary font-semibold"
                      : "text-qbit-on-surface-variant hover:bg-qbit-surface-container-high",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    name={item.icon}
                    className={cn("text-[20px] shrink-0", active && "filled")}
                  />
                  {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="rounded-full bg-qbit-error px-1.5 py-0.5 text-[10px] font-bold text-qbit-on-error">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-qbit-outline-variant/60 px-3 py-3">
        {footerItems.length > 0 && (
          <ul className="mb-2 space-y-1">
            {footerItems.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => item.screen && navigate(item.screen)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-qbit-on-surface-variant transition-all hover:bg-qbit-surface-container-high",
                    collapsed && "justify-center px-0",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} className="text-[20px] shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-qbit-surface-container-high transition-colors">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-qbit-primary text-sm font-bold text-qbit-on-primary">
              {user.initials ?? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-qbit-on-surface">{user.name}</p>
              <p className="truncate text-[11px] text-qbit-on-surface-variant">
                {user.meta ?? user.role}
              </p>
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="text-qbit-on-surface-variant hover:text-qbit-primary"
                title="Collapse sidebar"
              >
                <Icon name="menu_open" className="text-[18px]" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
