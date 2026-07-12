/**
 * Placeholder data for the CMS module.
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

export const IMPORT_JOBS: ImportJobEntry[] = [
  { id: "ij-1", type: "product", fileName: "products_batch_oct2024.xlsx", fileSize: "245 KB", status: "completed", totalRows: 48, successCount: 46, errorCount: 2, startedBy: "Alex Rivera", startedAt: "Oct 24, 2023 14:00", completedAt: "Oct 24, 2023 14:02", createdAt: "Oct 24, 2023" },
  { id: "ij-2", type: "driver", fileName: "drivers_update_v2.4.csv", fileSize: "12 KB", status: "completed", totalRows: 12, successCount: 12, errorCount: 0, startedBy: "Sarah Chen", startedAt: "Nov 05, 2023 09:30", completedAt: "Nov 05, 2023 09:31", createdAt: "Nov 05, 2023" },
  { id: "ij-3", type: "youtube", fileName: "youtube_playlist_import.csv", fileSize: "3 KB", status: "failed", totalRows: 24, successCount: 18, errorCount: 6, errors: ["Invalid URL at row 7", "Duplicate video ID at row 12", "Private video at row 19"], startedBy: "Alex Rivera", startedAt: "Nov 10, 2023 16:00", completedAt: "Nov 10, 2023 16:01", createdAt: "Nov 10, 2023" },
  { id: "ij-4", type: "manual", fileName: "manuals_q4_2024.zip", fileSize: "128 MB", status: "importing", totalRows: 8, successCount: 3, errorCount: 0, startedBy: "Maria Garcia", startedAt: "Nov 15, 2023 11:00", createdAt: "Nov 15, 2023" },
];

export const IMPORT_PREVIEW: ImportPreviewRow[] = [
  { rowNumber: 1, status: "valid", data: { name: "QBIT T-800", model: "T800-ENT-2024", category: "Windows POS", description: "Flagship Enterprise POS" } },
  { rowNumber: 2, status: "valid", data: { name: "HUB-X Pro", model: "HUBX-PRO", category: "Thermal Printer", description: "Thermal Printer Pro Series" } },
  { rowNumber: 3, status: "warning", message: "Category not found — will create new", data: { name: "Scanner Q-300", model: "SQ-300", category: "3D Scanner", description: "3D barcode scanner" } },
  { rowNumber: 4, status: "error", message: "Missing required field: model", data: { name: "Aura G3", model: "", category: "Windows POS", description: "Advanced POS Interface" } },
  { rowNumber: 5, status: "valid", data: { name: "Kiosk K-100", model: "KK-100", category: "Kiosk", description: "Self-Service Kiosk" } },
];

export const CONTENT_VERSIONS: ContentVersionEntry[] = [
  { id: "cv-1", entityType: "product", entityId: "qbit-t800", version: 4, changedBy: "Alex Rivera", changeSummary: "Updated specifications: RAM 16GB → 32GB option", createdAt: "Nov 20, 2023 14:30", canRestore: true },
  { id: "cv-2", entityType: "product", entityId: "qbit-t800", version: 3, changedBy: "Sarah Chen", changeSummary: "Added new gallery image", createdAt: "Nov 15, 2023 10:15", canRestore: true },
  { id: "cv-3", entityType: "product", entityId: "qbit-t800", version: 2, changedBy: "Alex Rivera", changeSummary: "Updated description and features", createdAt: "Oct 24, 2023 09:00", canRestore: true },
  { id: "cv-4", entityType: "product", entityId: "qbit-t800", version: 1, changedBy: "Admin", changeSummary: "Initial creation", createdAt: "Oct 15, 2023 12:00", canRestore: false },
];

export const MEDIA_FILES: MediaFileEntry[] = [
  { id: "mf-1", fileName: "t800_front.jpg", originalName: "T800_front_view.jpg", mimeType: "image/jpeg", fileSize: "2.4 MB", folder: "products", tags: ["t-800", "front"], usageCount: 3, uploadedBy: "Alex Rivera", createdAt: "Oct 15, 2023", thumbnailUrl: "/qbit-hero-illustration.png", icon: "image" },
  { id: "mf-2", fileName: "t800_rear.jpg", originalName: "T800_rear_ports.jpg", mimeType: "image/jpeg", fileSize: "1.8 MB", folder: "products", tags: ["t-800", "rear"], usageCount: 2, uploadedBy: "Alex Rivera", createdAt: "Oct 15, 2023", thumbnailUrl: "/qbit-hero-illustration.png", icon: "image" },
  { id: "mf-3", fileName: "user_manual_v4.pdf", originalName: "T-800_User_Manual_v4.0.pdf", mimeType: "application/pdf", fileSize: "5.8 MB", folder: "documents", tags: ["manual", "t-800"], usageCount: 5, uploadedBy: "Sarah Chen", createdAt: "Oct 24, 2023", icon: "picture_as_pdf" },
  { id: "mf-4", fileName: "hubx_diagram.png", originalName: "HUBX_wiring_diagram.png", mimeType: "image/png", fileSize: "845 KB", folder: "documents", tags: ["hub-x", "wiring"], usageCount: 1, uploadedBy: "Maria Garcia", createdAt: "Nov 01, 2023", thumbnailUrl: "/qbit-hero-illustration.png", icon: "schema" },
  { id: "mf-5", fileName: "brand_banner.png", originalName: "qbit_brand_banner_2024.png", mimeType: "image/png", fileSize: "1.2 MB", folder: "banners", tags: ["brand", "banner"], usageCount: 2, uploadedBy: "Admin", createdAt: "Jan 01, 2024", thumbnailUrl: "/qbit-hero-illustration.png", icon: "image" },
  { id: "mf-6", fileName: "icon_pos_terminal.svg", originalName: "pos_terminal_icon.svg", mimeType: "image/svg+xml", fileSize: "12 KB", folder: "icons", tags: ["icon", "pos"], usageCount: 8, uploadedBy: "Admin", createdAt: "Oct 10, 2023", icon: "image" },
];

export const SEO_CONFIGS: SEOConfigEntry[] = [
  { id: "seo-1", entityType: "product", entityId: "qbit-t800", slug: "qbit-t-800", title: "QBIT T-800 — Enterprise POS Terminal | QBIT Hub", description: "The QBIT T-800 is our flagship enterprise POS terminal with Intel Core i5, 16GB RAM, IP54 rating, and 3-year warranty.", keywords: ["qbit t-800", "pos terminal", "enterprise pos", "windows pos"], canonicalUrl: "https://hub.qbit.com/products/qbit-t-800", autoGenerated: true },
  { id: "seo-2", entityType: "product", entityId: "hubx-pro", slug: "hub-x-pro", title: "HUB-X Pro Thermal Printer | QBIT Hub", description: "Professional 80mm thermal receipt printer with USB, serial, and network connectivity.", keywords: ["hub-x pro", "thermal printer", "receipt printer"], canonicalUrl: "https://hub.qbit.com/products/hub-x-pro", autoGenerated: false },
];

export const QR_MAPPINGS: QRMappingEntry[] = [
  { id: "qr-1", entityType: "product", entityId: "qbit-t800", qrType: "product_page", targetUrl: "https://hub.qbit.com/products/qbit-t-800", qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://hub.qbit.com/products/qbit-t-800", downloadCount: 124, createdAt: "Oct 15, 2023" },
  { id: "qr-2", entityType: "driver", entityId: "thermal-v2-4-0", qrType: "driver_download", targetUrl: "https://hub.qbit.com/downloads/thermal-v2-4-0", qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://hub.qbit.com/downloads/thermal-v2-4-0", downloadCount: 89, createdAt: "Oct 12, 2023" },
  { id: "qr-3", entityType: "manual", entityId: "t800-manual", qrType: "manual_view", targetUrl: "https://hub.qbit.com/manuals/t800-manual", qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://hub.qbit.com/manuals/t800-manual", downloadCount: 45, createdAt: "Oct 24, 2023" },
];

export const EXPORT_JOBS: ExportJobEntry[] = [
  { id: "ej-1", type: "Products", format: "csv", rowCount: 124, fileSize: "45 KB", status: "completed", createdBy: "Alex Rivera", createdAt: "Nov 20, 2023", downloadUrl: "#" },
  { id: "ej-2", type: "Drivers", format: "xlsx", rowCount: 342, fileSize: "128 KB", status: "completed", createdBy: "Sarah Chen", createdAt: "Nov 18, 2023", downloadUrl: "#" },
  { id: "ej-3", type: "Knowledge Articles", format: "csv", rowCount: 248, fileSize: "82 KB", status: "completed", createdBy: "Alex Rivera", createdAt: "Nov 15, 2023", downloadUrl: "#" },
  { id: "ej-4", type: "Users", format: "xlsx", rowCount: 856, fileSize: "215 KB", status: "completed", createdBy: "Admin", createdAt: "Nov 10, 2023", downloadUrl: "#" },
];

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
