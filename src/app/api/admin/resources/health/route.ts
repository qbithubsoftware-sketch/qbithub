/**
 * GET /api/admin/resources/health
 *
 * Enterprise Resource Health Checker — scans database and storage for inconsistencies.
 *
 * Uses the new auditResourceHealth() and autoFixResourceRecords() from resource-service.ts.
 *
 * Query params:
 *   ?fix=true — auto-fix detectable issues (urlType mismatches, storageKey/publicUrl swaps)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { auditResourceHealth, autoFixResourceRecords, getStorageProvider as getStorageProviderFn } from "@/lib/resource-service";
import { getStorageDiagnostics } from "@/lib/storage/provider";

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const url = new URL(req.url);
  const shouldFix = url.searchParams.get("fix") === "true";

  const provider = getStorageProviderFn();
  const diagnostics = getStorageDiagnostics();
  const audit = await auditResourceHealth();

  let fixResult = null;
  if (shouldFix) {
    fixResult = await autoFixResourceRecords();
  }

  return NextResponse.json({
    healthy: audit.issues.filter(i => i.severity === "critical").length === 0,
    stats: {
      totalResources: audit.totalResources,
      healthyResources: audit.healthyResources,
      criticalIssues: audit.issues.filter(i => i.severity === "critical").length,
      warnings: audit.issues.filter(i => i.severity === "warning").length,
      storageProvider: diagnostics.activeProvider,
      storageDiagnostics: diagnostics,
    },
    issues: audit.issues,
    fix: fixResult,
    generatedAt: new Date().toISOString(),
  });
}
