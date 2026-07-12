/**
 * Typed interfaces for the Driver Download Center.
 *
 * These mirror the Prisma models but are UI-friendly (dates as strings,
 * JSON fields parsed into arrays, etc.).  The API layer will map Prisma
 * rows → these types before sending them to the client.
 */

/** Operating system lookup entry. */
export interface OSOption {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

/** Download category lookup entry. */
export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

/** Visibility level for a download. */
export type DownloadVisibility = "public" | "internal" | "restricted";

/** A single release note entry (one version). */
export interface ReleaseNoteEntry {
  id: string;
  version: string;
  releaseDate: string; // ISO date string
  changes: string[];
  bugFixes: string[];
  securityUpdates: string[];
  isCurrent: boolean;
}

/** A downloadable file (driver, firmware, SDK, utility, or manual). */
export interface DownloadItem {
  id: string;
  productId?: string;
  name: string;
  version: string;
  category: CategoryOption;
  operatingSystems: OSOption[];
  releaseDate: string; // human-readable, e.g. "Oct 12, 2023"
  fileSize: string; // human-readable, e.g. "12.4 MB"
  fileSizeBytes: number;
  storagePath: string; // never exposed to client — server uses this to generate a secure URL
  checksum?: string;
  visibility: DownloadVisibility;
  featured: boolean;
  latest: boolean;
  downloadCount: number;
  downloadCountLabel: string; // "24.1k"
  description?: string;
  installInstructions?: string;
  knownIssues?: string;
  supportedProducts?: string[];
  releaseNotes?: ReleaseNoteEntry[];
  /** Icon + color for the card (Material Symbol name + Tailwind text-color class). */
  deviceIcon: string;
  deviceColor: string;
  /** Badge shown on the card (e.g. "Verified Official", "Critical Update"). */
  badge?: { label: string; variant: "info" | "error" | "neutral" | "success" | "warning" };
  /** Previous versions of this download (for the version-history timeline). */
  previousVersions?: DownloadVersionEntry[];
}

/** A previous-version entry for the version-history timeline. */
export interface DownloadVersionEntry {
  version: string;
  releaseDate: string;
  changes: string[];
  bugFixes?: string[];
  securityUpdates?: string[];
  isCurrent?: boolean;
}

/** Featured bento card (Latest Driver / Recommended Firmware / Most Downloaded). */
export interface FeaturedDownloadCard {
  id: string;
  label: string; // "NEW RELEASE"
  title: string; // "Latest Driver"
  description: string;
  icon: string;
  iconFilled?: boolean;
  surface: string; // Tailwind bg class
  muted: string; // Tailwind text class for muted text on the colored surface
  ctaLabel: string;
  downloadId?: string;
}

/** Download-history entry (recent downloads). */
export interface DownloadHistoryEntry {
  id: string;
  downloadId: string;
  downloadName: string;
  version: string;
  downloadedAt: string; // "2 hours ago"
  icon: string;
  tone: "primary" | "neutral";
}

/** Filter state for the search/filters panel. */
export interface DownloadFilters {
  query: string;
  osSlug: string; // "all" | "win11" | "win10" | "ubuntu-2204" | "android-13" | "macos"
  categorySlug: string; // "all" | "driver" | "firmware" | "sdk" | "utility" | "manual"
  productCategory: string; // "All Products" | "Windows POS" | "Thermal Printer" | …
  releaseYear: number;
  latestOnly: boolean;
  sortBy: "newest" | "popular" | "az";
}

/** Manual document entry. */
export interface ManualItem {
  id: string;
  title: string;
  type: "quick-start" | "installation-guide" | "user-manual" | "warranty-card" | "datasheet";
  typeLabel: string;
  description: string;
  fileSize: string;
  pages: number;
  icon: string;
  downloadId?: string;
  pdfUrl?: string; // for the PDF preview (public manuals only)
}
