/**
 * Typed interfaces for the Installation Center.
 *
 * These mirror the Prisma models but are UI-friendly.  The API layer
 * will map Prisma rows → these types before sending them to the client.
 */

/** Difficulty level for an installation guide. */
export type GuideDifficulty = "Beginner" | "Intermediate" | "Expert";

/** A single step in an installation guide. */
export interface InstallationStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
  estimatedTime: number; // minutes
  warning?: string;
  tip?: string;
  requiredTool?: RequiredTool;
  relatedDownloadId?: string;
  relatedManualId?: string;
  relatedVideoUrl?: string; // YouTube URL
  status?: "completed" | "active" | "pending";
}

/** A tool required for an installation. */
export interface RequiredTool {
  id: string;
  name: string;
  icon: string;
  description?: string;
  included: boolean; // true = in-box, false = bring your own
}

/** Safety instruction entry. */
export interface SafetyInstruction {
  id: string;
  text: string;
  severity: "info" | "warning" | "danger";
}

/** Configuration guide entry. */
export interface ConfigurationGuideEntry {
  id: string;
  title: string;
  description: string;
  configType: "network" | "os" | "peripheral" | "security";
}

/** Wiring diagram image. */
export interface WiringDiagram {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  resolution?: string;
}

/** Checklist item for installation verification. */
export interface ChecklistItem {
  id: string;
  group: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}

/** FAQ entry. */
export interface InstallationFAQEntry {
  id: string;
  question: string;
  answer: string;
}

/** Troubleshooting entry — common problem, cause, solution. */
export interface TroubleshootingEntry {
  id: string;
  problem: string;
  causes: string[];
  solutions: string[];
  relatedAsset?: string;
  relatedVideoUrl?: string;
}

/** Master installation guide record. */
export interface InstallationGuide {
  id: string;
  title: string;
  slug: string;
  product: string;
  category: string;
  estimatedTime: number; // minutes
  difficulty: GuideDifficulty;
  version: string;
  description: string;
  featured: boolean;
  latest: boolean;
  viewCount: number;
  viewCountLabel: string;
  completionCount: number;
  steps: InstallationStep[];
  tools: RequiredTool[];
  safetyInstructions: SafetyInstruction[];
  configurationGuides: ConfigurationGuideEntry[];
  wiringDiagrams: WiringDiagram[];
  checklist: ChecklistItem[];
  faqs: InstallationFAQEntry[];
  troubleshooting: TroubleshootingEntry[];
  relatedDownloadIds: string[];
  relatedVideoUrls: string[];
}

/** Quick-access card for the installation center landing page. */
export interface QuickAccessCard {
  title: string;
  description: string;
  icon: string;
  screen?: import("@/lib/navigation/store").ScreenId;
}

/** Product category card for the landing page. */
export interface ProductCategoryCard {
  label: string;
  title: string;
  icon: string;
  gradient: string;
}

/** Guide card for the latest/popular guides grid. */
export interface GuideCardItem {
  id: string;
  title: string;
  product: string;
  category: string;
  estimatedTime: number;
  difficulty: GuideDifficulty;
  version: string;
  icon: string;
  gradient: string;
  featured?: boolean;
  latest?: boolean;
  viewCountLabel: string;
}

/** Recently-viewed guide entry (with progress). */
export interface RecentGuideEntry {
  id: string;
  title: string;
  section: string;
  status: "active" | "review" | "complete";
  statusLabel: string;
  progress: number;
  progressVariant: "primary" | "warning" | "success";
  icon: string;
  ctaLabel: string;
  ctaVariant: "primary" | "outline";
  dimmed?: boolean;
}

/** Related video entry (YouTube). */
export interface RelatedVideo {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
  thumbnail: string;
}
