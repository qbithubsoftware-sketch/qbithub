/**
 * Barrel export for all Installation Center components.
 */

export { InstallationHeader } from "./InstallationHeader";
export { GuideStep } from "./GuideStep";
export { InstallationTimeline } from "./InstallationTimeline";
export { ProgressTrackerNav } from "./ProgressTrackerNav";
export { Checklist } from "./Checklist";
export { RequiredTools } from "./RequiredTools";
export { WiringDiagramViewer } from "./WiringDiagramViewer";
export { RelatedDownloads } from "./RelatedDownloads";
export { RelatedVideos } from "./RelatedVideos";
export { TroubleshootingSection } from "./TroubleshootingSection";
export { InstallationFAQ } from "./InstallationFAQ";
export { GuideCard } from "./GuideCard";

export type {
  InstallationGuide,
  InstallationStep,
  RequiredTool,
  SafetyInstruction,
  ConfigurationGuideEntry,
  WiringDiagram,
  ChecklistItem,
  InstallationFAQEntry,
  TroubleshootingEntry,
  QuickAccessCard,
  ProductCategoryCard,
  GuideCardItem,
  RecentGuideEntry,
  RelatedVideo,
  GuideDifficulty,
} from "@/lib/installation/types";
