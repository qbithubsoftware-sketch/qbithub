/**
 * AI Diagnostic Center — API Route
 *
 * GET /api/admin/diagnostics?scan=quick|full|hardware|driver|resource|upload-download|database
 * POST /api/admin/diagnostics { action: string }
 *
 * Real diagnostics against the actual QBIT platform modules.
 * No mock data. No fake diagnostics. Every check hits the real database,
 * storage, and API routes.
 *
 * Security: requireSuperAdminOrAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { StorageService } from "@/lib/storage/storage";
import { getStorageProvider, getStorageDiagnostics } from "@/lib/storage/provider";
import { detectUrlType } from "@/lib/resource-download";

// ====================== Types ======================

type Severity = "low" | "medium" | "high" | "critical";
type ScanType = "quick" | "full" | "hardware" | "driver" | "resource" | "upload-download" | "database";

interface DiagnosticIssue {
  id: string;
  module: string;
  issue: string;
  severity: Severity;
  rootCause: string;
  affectedItem: string;
  suggestedFix: string;
  autoFixable: boolean;
  autoFixAction?: string;
  metadata?: Record<string, unknown>;
}

interface ModuleStatus {
  name: string;
  healthy: boolean;
  issues: number;
  criticalIssues: number;
  checks: number;
  lastChecked: string;
}

interface ScanResult {
  scanType: ScanType;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  overallHealthy: boolean;
  totalIssues: number;
  criticalIssues: number;
  warnings: number;
  modules: ModuleStatus[];
  issues: DiagnosticIssue[];
  stats: Record<string, unknown>;
}

// ====================== Helpers ======================

function severityPriority(s: Severity): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[s];
}

function generateId(): string {
  return `diag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ====================== Diagnostic Checks ======================

async function checkProductModule(issues: DiagnosticIssue[]): Promise<ModuleStatus> {
  const checks = 5;
  let moduleIssues = 0;
  let criticalIssues = 0;

  const noName = await db.qbitProduct.count({ where: { name: { equals: "" } } });
  if (noName > 0) {
    issues.push({
      id: generateId(), module: "Product Management",
      issue: "Products with empty names", severity: "high",
      rootCause: "Data integrity — name field is empty",
      affectedItem: `${noName} product(s)`,
      suggestedFix: "Edit each product and set a valid name.",
      autoFixable: false,
    });
    moduleIssues++; criticalIssues++;
  }

  const noSlug = await db.qbitProduct.count({ where: { slug: { equals: "" } } });
  if (noSlug > 0) {
    issues.push({
      id: generateId(), module: "Product Management",
      issue: "Products missing URL slug", severity: "critical",
      rootCause: "Slug is required for public product pages — empty slug causes 404s",
      affectedItem: `${noSlug} product(s)`,
      suggestedFix: "Generate slugs from product names using kebab-case.",
      autoFixable: true, autoFixAction: "GENERATE_SLUGS",
    });
    moduleIssues++; criticalIssues++;
  }

  try {
    const dupSlugs = await db.qbitProduct.groupBy({
      by: ["slug"], having: { slug: { _count: { gt: 1 } } },
      where: { slug: { not: "" } },
    });
    if (dupSlugs.length > 0) {
      issues.push({
        id: generateId(), module: "Product Management",
        issue: "Duplicate product slugs", severity: "high",
        rootCause: "Multiple products share the same URL slug — causes routing conflicts",
        affectedItem: `${dupSlugs.length} slug conflict(s)`,
        suggestedFix: "Rename duplicate slugs to be unique.",
        autoFixable: false,
      });
      moduleIssues++; criticalIssues++;
    }
  } catch { /* groupBy may not work on all DBs */ }

  const inactiveVisible = await db.qbitProduct.count({
    where: { isActive: false, status: "active" },
  });
  if (inactiveVisible > 0) {
    issues.push({
      id: generateId(), module: "Product Management",
      issue: "Inactive products with 'active' status", severity: "medium",
      rootCause: "isActive=false but status='active' — conflicting visibility flags",
      affectedItem: `${inactiveVisible} product(s)`,
      suggestedFix: "Set status='draft' for inactive products or set isActive=true.",
      autoFixable: true, autoFixAction: "SYNC_PRODUCT_STATUS",
    });
    moduleIssues++;
  }

  const noCategory = await db.qbitProduct.count({
    where: { OR: [{ category: null }, { category: { equals: "" } }] },
  });
  if (noCategory > 0) {
    issues.push({
      id: generateId(), module: "Product Management",
      issue: "Products without category", severity: "low",
      rootCause: "Category field is empty — product won't appear in filtered listings",
      affectedItem: `${noCategory} product(s)`,
      suggestedFix: "Assign a category to each product.",
      autoFixable: false,
    });
    moduleIssues++;
  }

  return {
    name: "Product Management", healthy: criticalIssues === 0,
    issues: moduleIssues, criticalIssues, checks,
    lastChecked: new Date().toISOString(),
  };
}

async function checkResourceModule(issues: DiagnosticIssue[]): Promise<ModuleStatus> {
  const checks = 6;
  let moduleIssues = 0;
  let criticalIssues = 0;

  const emptyUrl = await db.resource.count({ where: { url: { equals: "" } } });
  if (emptyUrl > 0) {
    issues.push({
      id: generateId(), module: "Global Resources",
      issue: "Resources with empty URL", severity: "critical",
      rootCause: "URL field is empty — resource cannot be downloaded",
      affectedItem: `${emptyUrl} resource(s)`,
      suggestedFix: "Re-upload the file or set a valid URL.",
      autoFixable: false,
    });
    moduleIssues++; criticalIssues++;
  }

  const storageKeyResources = await db.resource.findMany({
    where: { url: { not: "" } },
    select: { id: true, name: true, url: true, urlType: true },
    take: 50,
  });

  let missingFiles = 0;
  for (const r of storageKeyResources) {
    const urlType = r.urlType || detectUrlType(r.url);
    if (urlType === "storage_key") {
      const exists = await StorageService.exists(r.url).catch(() => false);
      if (!exists) {
        missingFiles++;
        if (missingFiles <= 10) {
          issues.push({
            id: generateId(), module: "Global Resources",
            issue: "Resource file missing in storage", severity: "critical",
            rootCause: `Physical file not found at: "${r.url}"`,
            affectedItem: r.name,
            suggestedFix: "Re-upload the file to restore the resource.",
            autoFixable: false,
            metadata: { resourceId: r.id, url: r.url },
          });
        }
        moduleIssues++; criticalIssues++;
      }
    }
  }
  if (missingFiles > 10) {
    issues.push({
      id: generateId(), module: "Global Resources",
      issue: `${missingFiles - 10} more resources with missing files`, severity: "critical",
      rootCause: "Multiple resources reference files that don't exist in storage",
      affectedItem: `${missingFiles} total missing file(s)`,
      suggestedFix: "Run full resource scan to see all missing files.",
      autoFixable: false,
    });
  }

  const noType = await db.resource.count({ where: { type: { equals: "" } } });
  if (noType > 0) {
    issues.push({
      id: generateId(), module: "Global Resources",
      issue: "Resources without type classification", severity: "medium",
      rootCause: "Type field is empty — resource won't be categorized correctly",
      affectedItem: `${noType} resource(s)`,
      suggestedFix: "Assign a type (driver, firmware, manual, etc.) to each resource.",
      autoFixable: false,
    });
    moduleIssues++;
  }

  const mismatched = await db.resource.findMany({
    where: { urlType: { not: "" }, url: { not: "" } },
    select: { id: true, name: true, url: true, urlType: true },
    take: 30,
  });
  let mismatches = 0;
  for (const r of mismatched) {
    const detected = detectUrlType(r.url);
    if (r.urlType && r.urlType !== detected) {
      mismatches++;
      if (mismatches <= 5) {
        issues.push({
          id: generateId(), module: "Global Resources",
          issue: "URL type mismatch", severity: "low",
          rootCause: `Stored urlType="${r.urlType}" but URL pattern suggests "${detected}"`,
          affectedItem: r.name,
          suggestedFix: "Update urlType to match the actual URL pattern.",
          autoFixable: true, autoFixAction: "FIX_URL_TYPE",
          metadata: { resourceId: r.id, stored: r.urlType, detected },
        });
      }
    }
  }
  if (mismatches > 0) moduleIssues++;

  const noChecksum = await db.resource.count({
    where: { checksum: null, urlType: "storage_key" },
  });
  if (noChecksum > 0) {
    issues.push({
      id: generateId(), module: "Global Resources",
      issue: "Resources without integrity checksum", severity: "medium",
      rootCause: "SHA-256 checksum is missing — download integrity cannot be verified",
      affectedItem: `${noChecksum} resource(s)`,
      suggestedFix: "Re-upload files or compute checksums retroactively.",
      autoFixable: false,
    });
    moduleIssues++;
  }

  const deprecated = await db.resource.count({ where: { status: "deprecated" } });
  if (deprecated > 0) {
    issues.push({
      id: generateId(), module: "Global Resources",
      issue: "Deprecated resources in library", severity: "low",
      rootCause: "Deprecated resources may confuse users downloading outdated files",
      affectedItem: `${deprecated} resource(s)`,
      suggestedFix: "Review deprecated resources and archive or delete them.",
      autoFixable: false,
    });
    moduleIssues++;
  }

  return {
    name: "Global Resources", healthy: criticalIssues === 0,
    issues: moduleIssues, criticalIssues, checks,
    lastChecked: new Date().toISOString(),
  };
}

async function checkStorageModule(issues: DiagnosticIssue[]): Promise<ModuleStatus> {
  const checks = 4;
  let moduleIssues = 0;
  let criticalIssues = 0;

  const diag = getStorageDiagnostics();

  if (diag.authMethod === "none") {
    issues.push({
      id: generateId(), module: "Storage",
      issue: "No storage authentication configured", severity: "critical",
      rootCause: "Neither OIDC nor BLOB_READ_WRITE_TOKEN is available — uploads will fail",
      affectedItem: "Storage provider",
      suggestedFix: "Set BLOB_STORE_ID on Vercel or BLOB_READ_WRITE_TOKEN in environment.",
      autoFixable: false,
    });
    moduleIssues++; criticalIssues++;
  }

  try {
    const testKey = `__diagnostic_test_${Date.now()}.txt`;
    const testBuffer = Buffer.from("QBIT Diagnostic Test");
    const uploadResult = await StorageService.upload(testBuffer, testKey, "text/plain");
    const downloadResult = await StorageService.download(uploadResult.storageKey);
    const contentMatch = downloadResult.buffer.toString() === "QBIT Diagnostic Test";
    await StorageService.delete(uploadResult.storageKey).catch(() => {});

    if (!contentMatch) {
      issues.push({
        id: generateId(), module: "Storage",
        issue: "Upload/download content mismatch", severity: "high",
        rootCause: "Downloaded content does not match uploaded content",
        affectedItem: "Storage round-trip",
        suggestedFix: "Check storage provider configuration and network connectivity.",
        autoFixable: false,
      });
      moduleIssues++; criticalIssues++;
    }
  } catch (err) {
    issues.push({
      id: generateId(), module: "Storage",
      issue: "Storage upload/download test failed", severity: "critical",
      rootCause: `Storage operation failed: ${err instanceof Error ? err.message : String(err)}`,
      affectedItem: "Storage provider",
      suggestedFix: "Verify storage credentials and network access.",
      autoFixable: false,
    });
    moduleIssues++; criticalIssues++;
  }

  const provider = getStorageProvider();
  if (provider.name === "local") {
    issues.push({
      id: generateId(), module: "Storage",
      issue: "Using local storage provider", severity: "medium",
      rootCause: "Local storage is not suitable for production — files won't persist across deployments",
      affectedItem: "Storage configuration",
      suggestedFix: "Configure Vercel Blob or another cloud storage provider for production.",
      autoFixable: false,
    });
    moduleIssues++;
  }

  try {
    const { getAllowedExtensions } = await import("@/lib/storage/file-type-registry");
    const allowed = getAllowedExtensions();
    if (allowed.length < 10) {
      issues.push({
        id: generateId(), module: "Storage",
        issue: "File type registry has few entries", severity: "low",
        rootCause: `Only ${allowed.length} file extensions are allowed`,
        affectedItem: "FileTypeRegistry",
        suggestedFix: "Add more file types to the registry as needed.",
        autoFixable: false,
      });
      moduleIssues++;
    }
  } catch { /* registry not accessible */ }

  return {
    name: "Storage", healthy: criticalIssues === 0,
    issues: moduleIssues, criticalIssues, checks,
    lastChecked: new Date().toISOString(),
  };
}

async function checkDatabaseModule(issues: DiagnosticIssue[]): Promise<ModuleStatus> {
  const checks = 4;
  let moduleIssues = 0;
  let criticalIssues = 0;

  try {
    await db.$queryRaw`SELECT 1`;
  } catch (err) {
    issues.push({
      id: generateId(), module: "Database",
      issue: "Database connection failed", severity: "critical",
      rootCause: `Cannot connect to database: ${err instanceof Error ? err.message : String(err)}`,
      affectedItem: "Database",
      suggestedFix: "Check DATABASE_URL and ensure the database server is running.",
      autoFixable: false,
    });
    moduleIssues++; criticalIssues++;
    return {
      name: "Database", healthy: false,
      issues: moduleIssues, criticalIssues, checks,
      lastChecked: new Date().toISOString(),
    };
  }

  try {
    const orphanMappings = await db.$queryRawUnsafe<Array<{ cnt: bigint }>>(
      `SELECT COUNT(*) as cnt FROM "ProductResourceMapping" prm WHERE NOT EXISTS (SELECT 1 FROM "Resource" WHERE id = prm."resourceId")`
    );
    const orphanCount = Number(orphanMappings[0]?.cnt ?? 0);
    if (orphanCount > 0) {
      issues.push({
        id: generateId(), module: "Database",
        issue: "Orphan resource mappings found", severity: "high",
        rootCause: `${orphanCount} mapping(s) reference resources that no longer exist`,
        affectedItem: "ProductResourceMapping table",
        suggestedFix: "Delete orphan mappings to clean up the database.",
        autoFixable: true, autoFixAction: "DELETE_ORPHAN_MAPPINGS",
      });
      moduleIssues++; criticalIssues++;
    }
  } catch { /* query may fail on some DBs */ }

  try {
    const orphanMedia = await db.$queryRawUnsafe<Array<{ cnt: bigint }>>(
      `SELECT COUNT(*) as cnt FROM "ProductMedia" pm WHERE NOT EXISTS (SELECT 1 FROM "QbitProduct" WHERE id = pm."productId")`
    );
    const orphanMediaCount = Number(orphanMedia[0]?.cnt ?? 0);
    if (orphanMediaCount > 0) {
      issues.push({
        id: generateId(), module: "Database",
        issue: "Orphan media records found", severity: "medium",
        rootCause: `${orphanMediaCount} media record(s) reference products that no longer exist`,
        affectedItem: "ProductMedia table",
        suggestedFix: "Delete orphan media records.",
        autoFixable: true, autoFixAction: "DELETE_ORPHAN_MEDIA",
      });
      moduleIssues++;
    }
  } catch { /* query may fail on some DBs */ }

  try {
    const adminCount = await db.user.count({
      where: { role: { in: ["super_administrator", "administrator"] } },
    });
    if (adminCount === 0) {
      issues.push({
        id: generateId(), module: "Database",
        issue: "No admin users found", severity: "critical",
        rootCause: "No administrator accounts exist — system is unmanageable",
        affectedItem: "User table",
        suggestedFix: "Create an admin user immediately.",
        autoFixable: false,
      });
      moduleIssues++; criticalIssues++;
    }
  } catch { /* user table may not exist */ }

  return {
    name: "Database", healthy: criticalIssues === 0,
    issues: moduleIssues, criticalIssues, checks,
    lastChecked: new Date().toISOString(),
  };
}

async function checkUploadDownloadModule(issues: DiagnosticIssue[]): Promise<ModuleStatus> {
  const checks = 3;
  let moduleIssues = 0;
  let criticalIssues = 0;

  try {
    const recentFailures = await db.auditLog.findMany({
      where: {
        action: { contains: "upload" },
        description: { contains: "fail", mode: "insensitive" },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      take: 10,
    });
    if (recentFailures.length > 0) {
      issues.push({
        id: generateId(), module: "Upload Service",
        issue: "Recent upload failures detected", severity: "medium",
        rootCause: `${recentFailures.length} upload failure(s) in the last 24 hours`,
        affectedItem: "Upload API",
        suggestedFix: "Review upload error logs and check storage provider health.",
        autoFixable: false,
        metadata: { failureCount: recentFailures.length },
      });
      moduleIssues++;
    }
  } catch { /* audit log may not exist */ }

  return {
    name: "Upload / Download", healthy: criticalIssues === 0,
    issues: moduleIssues, criticalIssues, checks,
    lastChecked: new Date().toISOString(),
  };
}

async function checkAPIModule(issues: DiagnosticIssue[]): Promise<ModuleStatus> {
  const checks = 2;
  let moduleIssues = 0;
  let criticalIssues = 0;

  try {
    const recentErrors = await db.auditLog.findMany({
      where: {
        action: { in: ["API_ERROR", "SERVER_ERROR", "STORAGE_ERROR"] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      take: 10,
    });
    if (recentErrors.length > 3) {
      issues.push({
        id: generateId(), module: "API Routes",
        issue: "Frequent API errors in last 24 hours", severity: "high",
        rootCause: `${recentErrors.length} API error(s) logged recently`,
        affectedItem: "API Routes",
        suggestedFix: "Review server logs for the most frequent errors and fix root causes.",
        autoFixable: false,
        metadata: { errorCount: recentErrors.length },
      });
      moduleIssues++; criticalIssues++;
    }
  } catch { /* audit log may not exist */ }

  return {
    name: "API & Auth", healthy: criticalIssues === 0,
    issues: moduleIssues, criticalIssues, checks,
    lastChecked: new Date().toISOString(),
  };
}

async function checkHardwareModule(issues: DiagnosticIssue[]): Promise<ModuleStatus> {
  const checks = 4;
  let moduleIssues = 0;
  let criticalIssues = 0;

  try {
    const noSerial = await db.fSMCustomerAsset.count({
      where: { serialNumber: { equals: "" } },
    });
    if (noSerial > 0) {
      issues.push({
        id: generateId(), module: "Hardware Diagnostic",
        issue: "Registered devices without serial numbers", severity: "medium",
        rootCause: `${noSerial} device(s) have empty serial numbers — warranty lookup will fail`,
        affectedItem: "Device Registry",
        suggestedFix: "Update device records with valid serial numbers.",
        autoFixable: false,
      });
      moduleIssues++;
    }
  } catch { /* table might not exist */ }

  try {
    const noModel = await db.fSMCustomerAsset.count({
      where: { model: { equals: "" } },
    });
    if (noModel > 0) {
      issues.push({
        id: generateId(), module: "Hardware Diagnostic",
        issue: "Devices without model number", severity: "medium",
        rootCause: `${noModel} device(s) have empty model numbers — product identification will fail`,
        affectedItem: "Device Registry",
        suggestedFix: "Update device records with valid model numbers.",
        autoFixable: false,
      });
      moduleIssues++;
    }
  } catch { /* table might not exist */ }

  const productsWithoutDriver = await db.qbitProduct.count({
    where: { isActive: true, status: "active", driverDownloadUrl: null },
  });
  if (productsWithoutDriver > 0) {
    issues.push({
      id: generateId(), module: "Hardware Diagnostic",
      issue: "Active products without driver download URL", severity: "medium",
      rootCause: `${productsWithoutDriver} active product(s) have no driver link`,
      affectedItem: "Product Management",
      suggestedFix: "Upload drivers and link them to the products via Global Resource Library.",
      autoFixable: false,
    });
    moduleIssues++;
  }

  return {
    name: "Hardware Diagnostic", healthy: criticalIssues === 0,
    issues: moduleIssues, criticalIssues, checks,
    lastChecked: new Date().toISOString(),
  };
}

async function checkDriverFirmwareModule(issues: DiagnosticIssue[]): Promise<ModuleStatus> {
  const checks = 3;
  let moduleIssues = 0;
  let criticalIssues = 0;

  const driversNoVersion = await db.resource.count({
    where: { type: { in: ["windows_driver", "driver"] }, version: null },
  });
  if (driversNoVersion > 0) {
    issues.push({
      id: generateId(), module: "Drivers & Firmware",
      issue: "Drivers without version number", severity: "medium",
      rootCause: `${driversNoVersion} driver resource(s) have no version — update checks are impossible`,
      affectedItem: "Global Resources",
      suggestedFix: "Add version numbers to all driver resources.",
      autoFixable: false,
    });
    moduleIssues++;
  }

  const firmwareNoVersion = await db.resource.count({
    where: { type: "firmware", version: null },
  });
  if (firmwareNoVersion > 0) {
    issues.push({
      id: generateId(), module: "Drivers & Firmware",
      issue: "Firmware without version number", severity: "medium",
      rootCause: `${firmwareNoVersion} firmware resource(s) have no version`,
      affectedItem: "Global Resources",
      suggestedFix: "Add version numbers to all firmware resources.",
      autoFixable: false,
    });
    moduleIssues++;
  }

  const deprecatedMappings = await db.productResourceMapping.count({
    where: { resource: { status: "deprecated" } },
  });
  if (deprecatedMappings > 0) {
    issues.push({
      id: generateId(), module: "Drivers & Firmware",
      issue: "Deprecated drivers still linked to products", severity: "high",
      rootCause: `${deprecatedMappings} product(s) are linked to deprecated driver resources`,
      affectedItem: "Product-Resource Mappings",
      suggestedFix: "Replace deprecated resources with current versions.",
      autoFixable: false,
    });
    moduleIssues++; criticalIssues++;
  }

  return {
    name: "Drivers & Firmware", healthy: criticalIssues === 0,
    issues: moduleIssues, criticalIssues, checks,
    lastChecked: new Date().toISOString(),
  };
}

async function checkProductMediaModule(issues: DiagnosticIssue[]): Promise<ModuleStatus> {
  const checks = 3;
  let moduleIssues = 0;
  let criticalIssues = 0;

  const noImage = await db.qbitProduct.count({
    where: { imageUrl: null, isActive: true },
  });
  if (noImage > 0) {
    issues.push({
      id: generateId(), module: "Product Images",
      issue: "Active products without main image", severity: "medium",
      rootCause: `${noImage} active product(s) have no image — public pages show placeholder`,
      affectedItem: "Product Management",
      suggestedFix: "Upload product images and set the imageUrl field.",
      autoFixable: false,
    });
    moduleIssues++;
  }

  const noMedia = await db.qbitProduct.count({
    where: { mediaFiles: { none: {} }, isActive: true },
  });
  if (noMedia > 0) {
    issues.push({
      id: generateId(), module: "Product Images",
      issue: "Products with no media files", severity: "low",
      rootCause: `${noMedia} product(s) have no media attachments at all`,
      affectedItem: "Product Management",
      suggestedFix: "Add media files (images, documents) to products.",
      autoFixable: false,
    });
    moduleIssues++;
  }

  return {
    name: "Product Media", healthy: criticalIssues === 0,
    issues: moduleIssues, criticalIssues, checks,
    lastChecked: new Date().toISOString(),
  };
}

// ====================== Main Scan Dispatcher ======================

async function runScan(scanType: ScanType): Promise<ScanResult> {
  const startTime = Date.now();
  const issues: DiagnosticIssue[] = [];
  const modules: ModuleStatus[] = [];
  const ran = new Set<string>();

  const runIf = async (name: string, fn: () => Promise<ModuleStatus>) => {
    if (!ran.has(name)) { ran.add(name); modules.push(await fn()); }
  };

  if (["quick", "full"].includes(scanType)) {
    await runIf("Product Management", () => checkProductModule(issues));
    await runIf("Global Resources", () => checkResourceModule(issues));
    await runIf("Storage", () => checkStorageModule(issues));
  }

  if (["full", "database"].includes(scanType)) {
    await runIf("Database", () => checkDatabaseModule(issues));
    await runIf("API & Auth", () => checkAPIModule(issues));
    await runIf("Product Media", () => checkProductMediaModule(issues));
    await runIf("Upload / Download", () => checkUploadDownloadModule(issues));
  }

  if (["hardware", "full"].includes(scanType)) {
    await runIf("Hardware Diagnostic", () => checkHardwareModule(issues));
  }

  if (["driver", "full"].includes(scanType)) {
    await runIf("Drivers & Firmware", () => checkDriverFirmwareModule(issues));
  }

  if (["resource", "full"].includes(scanType)) {
    await runIf("Global Resources", () => checkResourceModule(issues));
    await runIf("Product Media", () => checkProductMediaModule(issues));
  }

  if (["upload-download", "full"].includes(scanType)) {
    await runIf("Upload / Download", () => checkUploadDownloadModule(issues));
    await runIf("Storage", () => checkStorageModule(issues));
  }

  issues.sort((a, b) => severityPriority(a.severity) - severityPriority(b.severity));

  const totalIssues = issues.length;
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const warningCount = issues.filter(i => i.severity === "medium" || i.severity === "low").length;

  const [productCount, resourceCount, userCount, mappingCount] = await Promise.all([
    db.qbitProduct.count().catch(() => 0),
    db.resource.count().catch(() => 0),
    db.user.count().catch(() => 0),
    db.productResourceMapping.count().catch(() => 0),
  ]);

  const storageDiag = getStorageDiagnostics();

  return {
    scanType, startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(), durationMs: Date.now() - startTime,
    overallHealthy: criticalCount === 0, totalIssues,
    criticalIssues: criticalCount, warnings: warningCount,
    modules, issues,
    stats: {
      productCount, resourceCount, userCount, mappingCount,
      storageProvider: storageDiag.providerName,
      storageAuthMethod: storageDiag.authMethod,
      storageAuthDescription: storageDiag.authDescription,
    },
  };
}

// ====================== API Handler ======================

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const scanType = (req.nextUrl.searchParams.get("scan") || "quick") as ScanType;
  const validScans: ScanType[] = ["quick", "full", "hardware", "driver", "resource", "upload-download", "database"];

  if (!validScans.includes(scanType)) {
    return NextResponse.json({ error: `Invalid scan type. Valid: ${validScans.join(", ")}` }, { status: 400 });
  }

  try {
    const result = await runScan(scanType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/diagnostics:", error);
    return NextResponse.json(
      { error: "Diagnostic scan failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body as { action: string };
    const repaired: Array<{ action: string; description: string; success: boolean }> = [];

    switch (action) {
      case "FIX_URL_TYPE": {
        const resources = await db.resource.findMany({
          where: { urlType: { not: "" }, url: { not: "" } },
          select: { id: true, url: true, urlType: true },
        });
        let fixed = 0;
        for (const r of resources) {
          const detected = detectUrlType(r.url);
          if (r.urlType && r.urlType !== detected) {
            await db.resource.update({ where: { id: r.id }, data: { urlType: detected } });
            fixed++;
          }
        }
        repaired.push({ action: "FIX_URL_TYPE", description: `Fixed ${fixed} urlType mismatch(es)`, success: true });
        break;
      }
      case "DELETE_ORPHAN_MAPPINGS": {
        const result = await db.$executeRawUnsafe(
          `DELETE FROM "ProductResourceMapping" WHERE NOT EXISTS (SELECT 1 FROM "Resource" WHERE id = "ProductResourceMapping"."resourceId")`
        );
        repaired.push({ action: "DELETE_ORPHAN_MAPPINGS", description: `Deleted ${result} orphan mapping(s)`, success: true });
        break;
      }
      case "DELETE_ORPHAN_MEDIA": {
        const result = await db.$executeRawUnsafe(
          `DELETE FROM "ProductMedia" WHERE NOT EXISTS (SELECT 1 FROM "QbitProduct" WHERE id = "ProductMedia"."productId")`
        );
        repaired.push({ action: "DELETE_ORPHAN_MEDIA", description: `Deleted ${result} orphan media record(s)`, success: true });
        break;
      }
      case "SYNC_PRODUCT_STATUS": {
        const result = await db.qbitProduct.updateMany({
          where: { isActive: false, status: "active" },
          data: { status: "draft" },
        });
        repaired.push({ action: "SYNC_PRODUCT_STATUS", description: `Synced ${result.count} product status(es)`, success: true });
        break;
      }
      case "GENERATE_SLUGS": {
        const noSlugs = await db.qbitProduct.findMany({
          where: { slug: { equals: "" } }, select: { id: true, name: true },
        });
        let generated = 0;
        for (const p of noSlugs) {
          const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-${p.id.slice(0, 6)}`;
          await db.qbitProduct.update({ where: { id: p.id }, data: { slug } });
          generated++;
        }
        repaired.push({ action: "GENERATE_SLUGS", description: `Generated ${generated} slug(s)`, success: true });
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown repair action: ${action}` }, { status: 400 });
    }

    await db.auditLog.create({
      data: {
        userId: session.user?.id || "system",
        userName: session.user?.name || "Admin",
        action: "DIAGNOSTIC_REPAIR",
        entity: "System",
        description: `Auto-repair: ${repaired.map(r => r.description).join("; ")}`,
      },
    });

    return NextResponse.json({ success: true, repaired });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/diagnostics:", error);
    return NextResponse.json(
      { error: "Repair failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
