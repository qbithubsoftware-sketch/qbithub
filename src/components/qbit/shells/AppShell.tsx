"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar, type SidebarVariant, type NavItem } from "./Sidebar";
import { TopBar, type TopBarProps } from "./TopBar";
import { PageTransition } from "./PageTransition";
import { PremiumCommandPalette } from "./PremiumCommandPalette";
import { TourOverlay } from "@/components/qbit/tour/TourOverlay";
import { WelcomeScreen } from "@/components/qbit/tour/WelcomeScreen";
import { HelpCenter } from "@/components/qbit/tour/HelpCenter";
import type { ScreenId } from "@/lib/navigation/store";

export interface AppShellProps {
  variant: SidebarVariant;
  brand: {
    title: string;
    tagline: string;
    icon?: string;
  };
  navItems: NavItem[];
  activeScreen: ScreenId;
  user: {
    name: string;
    role: string;
    initials?: string;
    meta?: string;
  };
  cta?: { label: string; icon: string; onClick?: () => void };
  footerItems?: NavItem[];
  topBar: TopBarProps;
  children: React.ReactNode;
  /** Maximum width for main content. Defaults to "max-w-container-max". */
  mainMaxWidth?: string;
  mainClassName?: string;
}

export function AppShell({
  variant,
  brand,
  navItems,
  activeScreen,
  user,
  cta,
  footerItems,
  topBar,
  children,
  mainMaxWidth = "max-w-container-max",
  mainClassName,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Set the CSS var consumed by TopBar for left offset.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "80px" : "256px",
    );
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-qbit-background">
      <Sidebar
        variant={variant}
        brand={brand}
        items={navItems}
        activeScreen={activeScreen}
        user={user}
        cta={cta}
        footerItems={footerItems}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <TopBar {...topBar} />
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          collapsed ? "ml-20" : "ml-64",
        )}
      >
        <div className={cn("mx-auto p-4 md:p-6 lg:p-8", mainMaxWidth, mainClassName)}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>

      {/* Premium Command Palette (Ctrl+K) */}
      <PremiumCommandPalette />

      {/* Interactive Product Tour */}
      <WelcomeScreen />
      <TourOverlay />

      {/* Help Center (floating button) */}
      <HelpCenter />
    </div>
  );
}
