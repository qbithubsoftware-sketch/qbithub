/**
 * GET /api/admin/resources/health
 *
 * Resource Health Checker — scans database and storage for inconsistencies.
 *
 * Checks:
 *  1. Resources with storage_key URLs where the physical file is missing
 *  2. Resources with data_url that have no actual data
 *  3. Database records with null/empty url field
 *  4. Resources missing checksum
 *  5. Resources with urlType mismatch
 *  6. Orphan files in storage (not referenced by any resource)
 *
 * Security: requireSuperAdminOrAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { StorageService } from "@/lib/storage/storage";
import { detectUrlType } from "@/lib/resource-download";
import fs from "fs/promises";
import path from "path";

interface HealthIssue {
  resourceId: string;
  resourceName: string;
  issue: string;
  severity: "critical" | "warning" | "info";
  details: string;
  autoFixable: boolean;
}

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const issues: HealthIssue[] = [];
  const stats = {
    totalResources: 0,
    healthyResources: 0,
    criticalIssues: 0,
    warnings: 0,
    storageKeysChecked: 0,
    dataUrlsChecked: 0,
  };

  try {
    const resources = await db.resource.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        urlType: true,
        checksum: true,
      },
    });

    stats.totalResources = resources.length;

    for (const r of resources) {
      let healthy = true;
      const urlType = r.urlType || detectUrlType(r.url);

      // Check 1: Empty/null URL
      if (!r.url || r.url.trim() === "") {
        issues.push({
          resourceId: r.id,
          resourceName: r.name,
          issue: "EMPTY_URL",
          severity: "critical",
          details: "Resource has no URL — it cannot be downloaded.",
          autoFixable: false,
        });
        healthy = false;
        continue;
      }

      // Check 2: urlType mismatch
      if (r.urlType && r.urlType !== urlType) {
        issues.push({
          resourceId: r.id,
          resourceName: r.name,
          issue: "URL_TYPE_MISMATCH",
          severity: "warning",
          details: `Stored urlType="${r.urlType}" but actual URL pattern indicates "${urlType}".`,
          autoFixable: true,
        });
        healthy = false;
      }

      // Check 3: Storage key — file missing
      if (urlType === "storage_key") {
        stats.storageKeysChecked++;
        const exists = await StorageService.exists(r.url).catch(() => false);
        if (!exists) {
          issues.push({
            resourceId: r.id,
            resourceName: r.name,
            issue: "FILE_MISSING_IN_STORAGE",
            severity: "critical",
            details: `Physical file not found at storage key: "${r.url}". Re-upload required.`,
            autoFixable: false,
          });
          healthy = false;
        }
      }

      // Check 4: Data URL — no actual base64 data
      if (urlType === "data_url") {
        stats.dataUrlsChecked++;
        const base64Data = r.url.split(",")[1];
        if (!base64Data || base64Data.length < 10) {
          issues.push({
            resourceId: r.id,
            resourceName: r.name,
            issue: "INVALID_DATA_URL",
            severity: "critical",
            details: "Data URL has no base64 payload or it's too small.",
            autoFixable: false,
          });
          healthy = false;
        }
      }

      // Check 5: Missing checksum
      if (urlType === "storage_key" && !r.checksum) {
        issues.push({
          resourceId: r.id,
          resourceName: r.name,
          issue: "MISSING_CHECKSUM",
          severity: "warning",
          details: "Resource was uploaded without SHA-256 checksum. Integrity cannot be verified on download.",
          autoFixable: false,
        });
        healthy = false;
      }

      if (healthy) stats.healthyResources++;
    }

    // Check 6: Orphan files in local storage
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "resources");
      const files = await fs.readdir(uploadDir).catch(() => [] as string[]);
      const storageKeys = new Set(
        resources
          .filter((r) => (r.urlType || detectUrlType(r.url)) === "storage_key")
          .map((r) => r.url),
      );

      for (const file of files) {
        const key = `/uploads/resources/${file}`;
        if (!storageKeys.has(key)) {
          issues.push({
            resourceId: "N/A",
            resourceName: `Orphan file: ${file}`,
            issue: "ORPHAN_FILE_IN_STORAGE",
            severity: "warning",
            details: `File "${key}" exists in storage but is not referenced by any resource.`,
            autoFixable: true,
          });
        }
      }
    } catch {
      // Storage directory doesn't exist — that's fine
    }

    stats.criticalIssues = issues.filter((i) => i.severity === "critical").length;
    stats.warnings = issues.filter((i) => i.severity === "warning").length;

    return NextResponse.json({
      healthy: stats.criticalIssues === 0,
      stats,
      issues,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/resources/health:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
