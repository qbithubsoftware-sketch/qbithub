/**
 * Placeholder data for the CMS module.
 *
 * ALL ARRAYS ARE EMPTY — no demo data in production.
 */

import type {
  ImportJobEntry,
  ImportPreviewRow,
  ContentVersionEntry,
  MediaFileEntry,
  SEOConfigEntry,
  QRMappingEntry,
  ExportJobEntry,
} from "./types";

export const IMPORT_JOBS: ImportJobEntry[] = [];
export const IMPORT_PREVIEW: ImportPreviewRow[] = [];
export const CONTENT_VERSIONS: ContentVersionEntry[] = [];
export const MEDIA_FILES: MediaFileEntry[] = [];
export const SEO_CONFIGS: SEOConfigEntry[] = [];
export const QR_MAPPINGS: QRMappingEntry[] = [];
export const EXPORT_JOBS: ExportJobEntry[] = [];

export const MEDIA_FOLDERS = [
  { id: "all", name: "All Files", icon: "folder" },
  { id: "products", name: "Products", icon: "inventory_2" },
  { id: "documents", name: "Documents", icon: "description" },
  { id: "icons", name: "Icons", icon: "star" },
  { id: "banners", name: "Banners", icon: "view_carousel" },
  { id: "general", name: "General", icon: "folder_open" },
] as const;

export const IMPORT_TYPES = [
  { id: "product", label: "Products", icon: "inventory_2", description: "Bulk import products from Excel/CSV", accept: ".xlsx,.csv" },
  { id: "driver", label: "Drivers & Firmware", icon: "settings_input_component", description: "Import driver/firmware metadata", accept: ".csv" },
  { id: "manual", label: "Manuals & Documents", icon: "menu_book", description: "Upload PDF manuals in bulk (ZIP)", accept: ".zip" },
  { id: "category", label: "Categories", icon: "category", description: "Create product categories in bulk", accept: ".csv" },
  { id: "youtube", label: "YouTube Videos", icon: "videocam", description: "Import YouTube URLs/playlist", accept: ".csv" },
  { id: "image", label: "Images", icon: "image", description: "Bulk upload product images (ZIP)", accept: ".zip" },
] as const;

export const EXPORT_TYPES = [
  { id: "products", label: "Products", icon: "inventory_2" },
  { id: "drivers", label: "Drivers", icon: "settings_input_component" },
  { id: "manuals", label: "Manuals", icon: "menu_book" },
  { id: "articles", label: "Knowledge Articles", icon: "library_books" },
  { id: "categories", label: "Categories", icon: "category" },
  { id: "users", label: "Users", icon: "group" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
] as const;
