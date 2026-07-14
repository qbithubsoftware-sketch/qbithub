/**
 * Enterprise Analytics — type definitions.
 *
 * All types are derived from real data — no fabricated predictions.
 */

/** Analytics tab/section type. */
export type AnalyticsTab =
  | "executive" | "device" | "engineer" | "service"
  | "customer" | "warranty" | "drqbit" | "download" | "branch" | "insights";

/** Executive dashboard DTO. */
export interface ExecutiveDashboardDTO {
  totalCustomers: number;
  totalInstalledDevices: number;
  totalActiveDevices: number;
  installationsCompleted: number;
  relocationsCompleted: number;
  serviceVisits: number;
  openWorkOrders: number;
  completedWorkOrders: number;
}

/** Device analytics DTO. */
export interface DeviceAnalyticsDTO {
  mostInstalledProducts: Array<{ name: string; count: number }>;
  mostInstalledModels: Array<{ model: string; count: number }>;
  mostInstalledCategories: Array<{ deviceType: string; count: number }>;
  mostActiveDevices: Array<{ passportNumber: string; deviceName: string; scanCount: number }>;
  mostFrequentlyServiced: Array<{ passportNumber: string; deviceName: string; serviceCount: number }>;
  devicesWithHighestFailureRate: Array<{ passportNumber: string; deviceName: string; failureCount: number }>;
  driverUpdateStats: { upToDate: number; updateAvailable: number; missing: number; unsupported: number };
  firmwareUpdateStats: { healthy: number; updateAvailable: number; unsupported: number; unknown: number };
}

/** Engineer analytics DTO. */
export interface EngineerAnalyticsDTO {
  engineers: Array<{
    engineerId: string;
    engineerName: string;
    jobsAssigned: number;
    jobsCompleted: number;
    jobsPending: number;
    averageCompletionHours: number | null;
    averageRating: number | null;
    totalRatings: number;
    averageResponseHours: number | null;
    averageResolutionHours: number | null;
    photoCompliance: number | null;
    reportSubmissionRate: number | null;
  }>;
}

/** Service analytics DTO. */
export interface ServiceAnalyticsDTO {
  mostCommonServiceRequests: Array<{ type: string; count: number }>;
  mostCommonInstallationProblems: Array<{ title: string; count: number }>;
  mostCommonDriverIssues: Array<{ title: string; count: number }>;
  mostCommonFirmwareIssues: Array<{ title: string; count: number }>;
  mostViewedKnowledgeArticles: Array<{ title: string; viewCount: number }>;
}

/** Warranty analytics DTO. */
export interface WarrantyAnalyticsDTO {
  warrantyActive: number;
  warrantyExpired: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
}

/** Dr. QBIT analytics DTO. */
export interface DrQbitAnalyticsDTO {
  totalDeviceScans: number;
  successfulScans: number;
  failedScans: number;
  unknownDevices: number;
  driverMismatches: number;
  firmwareMismatches: number;
  mostCommonDiagnosticFindings: Array<{ title: string; count: number }>;
}

/** Download analytics DTO. */
export interface DownloadAnalyticsDTO {
  mostDownloadedDrivers: Array<{ name: string; downloadCount: number }>;
  mostDownloadedManuals: Array<{ name: string; downloadCount: number }>;
  mostDownloadedFirmware: Array<{ name: string; downloadCount: number }>;
  mostWatchedVideos: Array<{ title: string; viewCount: number }>;
  mostOpenedKnowledgeArticles: Array<{ title: string; viewCount: number }>;
}

/** Branch analytics DTO. */
export interface BranchAnalyticsDTO {
  branches: Array<{
    branchId: string;
    branchName: string;
    city: string | null;
    state: string | null;
    totalDevices: number;
    completedJobs: number;
    openJobs: number;
  }>;
}

/** Insights DTO — evidence-based only. */
export interface InsightsDTO {
  insights: Array<{
    type: string;
    title: string;
    description: string;
    evidence: string;
    severity: "info" | "warning" | "critical";
  }>;
}

/** Analytics filters. */
export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  branchId?: string;
  engineerId?: string;
  deviceType?: string;
  search?: string;
}

/** Material Symbol icon per analytics tab. */
export const ANALYTICS_TAB_ICONS: Record<AnalyticsTab, string> = {
  executive: "dashboard",
  device: "devices",
  engineer: "engineering",
  service: "build",
  customer: "person",
  warranty: "verified_user",
  drqbit: "smart_toy",
  download: "download",
  branch: "store",
  insights: "lightbulb",
};

/** Human-readable label per analytics tab. */
export const ANALYTICS_TAB_LABELS: Record<AnalyticsTab, string> = {
  executive: "Executive Dashboard",
  device: "Device Analytics",
  engineer: "Engineer Performance",
  service: "Service Analytics",
  customer: "Customer Analytics",
  warranty: "Warranty Analytics",
  drqbit: "Dr. QBIT Analytics",
  download: "Download Analytics",
  branch: "Branch Analytics",
  insights: "Insights",
};
