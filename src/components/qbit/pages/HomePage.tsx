"use client";

import { AppShell } from "@/components/qbit/shells/AppShell";
import {
  WelcomeHero,
  UniversalSearch,
  SystemStatus,
  QuickAccess,
  FeaturedProducts,
  ContinueWorking,
  SystemUpdates,
  PopularDownloads,
  Bookmarks,
  PinnedResources,
  Announcements,
  RecentActivity,
  AIAssistant,
} from "@/components/qbit/dashboard";
import { ADMIN_NAV } from "@/lib/navigation/nav-config";
import {
  SYSTEM_STATUS,
  QUICK_ACCESS,
  FEATURED_PRODUCTS,
  CONTINUE_WORKING,
  SYSTEM_UPDATES,
  POPULAR_DOWNLOADS,
  BOOKMARKS,
  PINNED_RESOURCES,
  ANNOUNCEMENTS,
  RECENT_ACTIVITY,
} from "@/components/qbit/dashboard/placeholder-data";

/**
 * HomePage — the first screen after login.
 *
 * Composed entirely of reusable dashboard section components.  Each
 * section is independently importable and can be dropped into any
 * other dashboard (Engineer, Admin, etc.) with different data.
 */
export function HomePage() {
  return (
    <AppShell
      variant="admin"
      brand={{ title: "QBIT Hub", tagline: "Control Center", icon: "bolt" }}
      navItems={ADMIN_NAV}
      activeScreen="home"
      user={{ name: "Alex Rivera", role: "Admin Access", initials: "AR" }}
      topBar={{
        title: "QBIT Hub Admin",
        searchPlaceholder: "Global search...",
        user: { name: "Alex Rivera", role: "Admin Access", initials: "AR" },
      }}
    >
      <div className="flex flex-col gap-6">
        {/* 1. Welcome Hero */}
        <WelcomeHero userName="Alex" greeting="Good Morning" />

        {/* 2. Universal Search (overlaps hero) */}
        <UniversalSearch />

        {/* 3. System Status KPIs */}
        <SystemStatus items={SYSTEM_STATUS} />

        {/* 4. Main 3-col layout: Quick Access + Featured (2 cols) | Sidebar (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <QuickAccess items={QUICK_ACCESS} />
            <FeaturedProducts items={FEATURED_PRODUCTS} />
          </div>

          {/* Right 1/3 */}
          <div className="flex flex-col gap-6">
            <ContinueWorking items={CONTINUE_WORKING} />
            <SystemUpdates items={SYSTEM_UPDATES} />
          </div>
        </div>

        {/* 5. Popular Downloads */}
        <PopularDownloads items={POPULAR_DOWNLOADS} />

        {/* 6. Pinned Resources */}
        <PinnedResources items={PINNED_RESOURCES} />

        {/* 7. Bookmarks + Recent Activity (2 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Bookmarks items={BOOKMARKS} />
          <RecentActivity items={RECENT_ACTIVITY} />
        </div>

        {/* 8. Announcements */}
        <Announcements items={ANNOUNCEMENTS} />

        {/* 9. Floating AI Assistant */}
        <AIAssistant userName="Alex" />
      </div>
    </AppShell>
  );
}
