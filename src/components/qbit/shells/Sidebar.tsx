"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "../primitives/Icon";
import { useNavigation, type ScreenId } from "@/lib/navigation/store";

export type SidebarVariant = "engineer" | "admin" | "field" | "support" | "instalcore";

export interface NavChild {
  label: string;
  icon: string;
  screen?: ScreenId;
  badge?: string;
  children?: NavChild[];
}

export interface NavItem {
  label: string;
  icon: string;
  screen?: ScreenId;
  badge?: string;
  /** Collapsible children — renders as an expandable tree in the sidebar. */
  children?: NavChild[];
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

const STORAGE_KEY = "qbit-sidebar-expanded";

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

  // Load expanded state from localStorage on mount
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setExpandedMenus(new Set(JSON.parse(stored)));
      }
    } catch {
      // localStorage not available (SSR) — ignore
    }
  }, []);

  // Save expanded state to localStorage whenever it changes
  const persistExpanded = useCallback((expanded: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...expanded]));
    } catch {
      // ignore
    }
  }, []);

  function toggleMenu(label: string) {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      persistExpanded(next);
      return next;
    });
  }

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
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-qbit-outline-variant/50 bg-qbit-surface-container-lowest transition-all duration-300 ease-in-out",
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
            const hasChildren = !!item.children?.length;
            const isExpanded = expandedMenus.has(item.label);

            // Check if any child or grandchild is the active screen
            const childActive = hasChildren && item.children!.some(
              (c) => c.screen === activeScreen || c.children?.some((gc) => gc.screen === activeScreen)
            );

            return (
              <li key={item.label}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleMenu(item.label);
                    } else if (item.screen) {
                      navigate(item.screen);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-0",
                    active || childActive
                      ? "sidebar-active-indicator bg-qbit-primary-container/10 text-qbit-primary font-semibold"
                      : "text-qbit-on-surface-variant hover:bg-qbit-surface-container-low hover:text-qbit-on-surface",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    name={item.icon}
                    className={cn("text-[20px] shrink-0", (active || childActive) && "filled")}
                  />
                  {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="rounded-full bg-qbit-error px-1.5 py-0.5 text-[10px] font-bold text-qbit-on-error">
                      {item.badge}
                    </span>
                  )}
                  {!collapsed && hasChildren && (
                    <Icon
                      name={isExpanded ? "expand_more" : "chevron_right"}
                      className="text-[18px] shrink-0 text-qbit-on-surface-variant"
                    />
                  )}
                </button>

                {/* Children (level 1) */}
                {!collapsed && hasChildren && isExpanded && (
                  <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-qbit-outline-variant/30 pl-3">
                    {item.children!.map((child) => {
                      const childHasChildren = !!child.children?.length;
                      const childExpanded = expandedMenus.has(`${item.label}/${child.label}`);
                      const childIsActive = child.screen === activeScreen;
                      const grandchildActive = childHasChildren && child.children!.some((gc) => gc.screen === activeScreen);

                      return (
                        <li key={child.label}>
                          <button
                            onClick={() => {
                              if (childHasChildren) {
                                toggleMenu(`${item.label}/${child.label}`);
                              } else if (child.screen) {
                                navigate(child.screen);
                              }
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                              childIsActive || grandchildActive
                                ? "bg-qbit-primary/10 text-qbit-primary font-semibold"
                                : "text-qbit-on-surface-variant hover:bg-qbit-surface-container-high hover:text-qbit-on-surface",
                            )}
                          >
                            <Icon name={child.icon} className="text-[16px] shrink-0" />
                            <span className="flex-1 text-left truncate">{child.label}</span>
                            {childHasChildren && (
                              <Icon
                                name={childExpanded ? "expand_more" : "chevron_right"}
                                className="text-[14px] shrink-0"
                              />
                            )}
                          </button>

                          {/* Grandchildren (level 2) */}
                          {childHasChildren && childExpanded && (
                            <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-qbit-outline-variant/20 pl-2.5">
                              {child.children!.map((gc) => {
                                const gcActive = gc.screen === activeScreen;
                                return (
                                  <li key={gc.label}>
                                    <button
                                      onClick={() => gc.screen && navigate(gc.screen)}
                                      className={cn(
                                        "flex w-full items-center gap-2 rounded-lg px-2 py-1 text-[11px] font-medium transition-all",
                                        gcActive
                                          ? "bg-qbit-primary/10 text-qbit-primary font-semibold"
                                          : "text-qbit-on-surface-variant hover:bg-qbit-surface-container-high hover:text-qbit-on-surface",
                                      )}
                                    >
                                      <Icon name={gc.icon} className="text-[14px] shrink-0" />
                                      <span className="flex-1 text-left truncate">{gc.label}</span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
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
