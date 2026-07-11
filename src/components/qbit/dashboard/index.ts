/**
 * Barrel export for all dashboard section components.
 *
 * Import from here: `import { WelcomeHero, QuickAccess } from "@/components/qbit/dashboard"`.
 */

export { WelcomeHero } from "./WelcomeHero";
export { UniversalSearch } from "./UniversalSearch";
export { SystemStatus } from "./SystemStatus";
export { QuickAccess } from "./QuickAccess";
export { FeaturedProducts } from "./FeaturedProducts";
export { ContinueWorking } from "./ContinueWorking";
export { SystemUpdates } from "./SystemUpdates";
export { PopularDownloads } from "./PopularDownloads";
export { Bookmarks } from "./Bookmarks";
export { PinnedResources } from "./PinnedResources";
export { Announcements } from "./Announcements";
export { RecentActivity } from "./RecentActivity";
export { AIAssistant } from "./AIAssistant";
export { DashboardSkeleton } from "./DashboardSkeleton";
export { EmptyState } from "./EmptyState";
export { SectionHeader, CarouselNav } from "./SectionHeader";

export type {
  SystemStatusItem,
  QuickAccessItem,
  FeaturedProduct,
  ContinueWorkingItem,
  SystemUpdateItem,
  PopularDownload,
  BookmarkItem,
  PinnedResource,
  Announcement,
  ActivityEntry,
} from "./types";
