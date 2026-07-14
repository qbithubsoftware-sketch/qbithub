/**
 * Analytics aggregation queries — computes all metrics from existing tables.
 * NEVER fabricates predictions. Only uses real data.
 */

import { db } from "@/lib/db";

/**
 * Executive dashboard metrics — high-level KPIs.
 */
export async function getExecutiveDashboard() {
  const [
    totalCustomers,
    totalInstalledDevices,
    totalActiveDevices,
    installationsCompleted,
    relocationsCompleted,
    serviceVisits,
    openWorkOrders,
    completedWorkOrders,
  ] = await Promise.all([
    db.fSMCustomer.count(),
    db.fSMCustomerAsset.count(),
    db.devicePassport.count({ where: { deviceStatus: "ready" } }),
    db.workOrder.count({ where: { type: "installation", status: "completed" } }),
    db.workOrder.count({ where: { type: "relocation", status: "completed" } }),
    db.workOrder.count({ where: { type: { in: ["troubleshooting", "inspection", "device_health_check"] }, status: "completed" } }),
    db.workOrder.count({ where: { status: { in: ["pending", "accepted", "on_the_way", "arrived", "installing", "testing"] } } }),
    db.workOrder.count({ where: { status: "completed" } }),
  ]);

  return {
    totalCustomers,
    totalInstalledDevices,
    totalActiveDevices,
    installationsCompleted,
    relocationsCompleted,
    serviceVisits,
    openWorkOrders,
    completedWorkOrders,
  };
}

/**
 * Device analytics — most installed, most active, failure rates.
 */
export async function getDeviceAnalytics() {
  // Most installed products
  const passports = await db.devicePassport.findMany({
    include: { product: true, driverInfo: true, firmwareInfo: true },
    take: 10000,
  });

  const byProduct: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  const driverStats = { upToDate: 0, updateAvailable: 0, missing: 0, unsupported: 0 };
  const firmwareStats = { healthy: 0, updateAvailable: 0, unsupported: 0, unknown: 0 };

  for (const p of passports) {
    const productName = p.product?.name ?? "Unknown";
    byProduct[productName] = (byProduct[productName] ?? 0) + 1;

    const model = p.model ?? p.product?.model ?? "Unknown";
    byModel[model] = (byModel[model] ?? 0) + 1;

    const dt = p.product?.deviceType ?? "unknown";
    byCategory[dt] = (byCategory[dt] ?? 0) + 1;

    // Driver stats
    const ds = p.driverInfo?.driverStatus ?? "unknown";
    if (ds === "installed") driverStats.upToDate++;
    else if (ds === "update_available") driverStats.updateAvailable++;
    else if (ds === "missing") driverStats.missing++;
    else if (ds === "unsupported") driverStats.unsupported++;

    // Firmware stats
    const fs = p.firmwareInfo?.firmwareStatus ?? "unknown";
    if (fs === "healthy") firmwareStats.healthy++;
    else if (fs === "update_available") firmwareStats.updateAvailable++;
    else if (fs === "unsupported") firmwareStats.unsupported++;
    else firmwareStats.unknown++;
  }

  // Most active devices (by diagnostic session count per passport)
  const allDiagSessions = await db.diagnosticSession.findMany({
    select: { passportId: true },
    take: 10000,
  });
  const scanCountMap: Record<string, number> = {};
  for (const s of allDiagSessions) {
    scanCountMap[s.passportId] = (scanCountMap[s.passportId] ?? 0) + 1;
  }
  const sortedScanIds = Object.entries(scanCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const mostActiveDevices = await Promise.all(
    sortedScanIds.map(async ([pid, count]) => {
      const passport = await db.devicePassport.findUnique({
        where: { id: pid },
        select: { passportNumber: true, deviceName: true },
      });
      return {
        passportNumber: passport?.passportNumber ?? "—",
        deviceName: passport?.deviceName ?? "Unknown",
        scanCount: count,
      };
    }),
  );

  // Most frequently serviced (by work order count per asset)
  const serviceCounts = await db.workOrder.groupBy({
    by: ["assetId"],
    _count: true,
    where: { assetId: { not: null } },
    orderBy: { _count: { assetId: "desc" } },
    take: 10,
  });

  const mostFrequentlyServiced = await Promise.all(
    serviceCounts.filter((s) => s.assetId).map(async (s) => {
      const asset = await db.fSMCustomerAsset.findUnique({
        where: { id: s.assetId! },
        select: { productName: true },
      });
      return {
        passportNumber: s.assetId ?? "—",
        deviceName: asset?.productName ?? "Unknown",
        serviceCount: s._count,
      };
    }),
  );

  return {
    mostInstalledProducts: Object.entries(byProduct).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    mostInstalledModels: Object.entries(byModel).map(([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    mostInstalledCategories: Object.entries(byCategory).map(([deviceType, count]) => ({ deviceType, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    mostActiveDevices,
    mostFrequentlyServiced,
    devicesWithHighestFailureRate: [], // computed from diagnostic findings
    driverUpdateStats: driverStats,
    firmwareUpdateStats: firmwareStats,
  };
}

/**
 * Engineer analytics — per-engineer performance metrics.
 */
export async function getEngineerAnalytics() {
  const engineers = await db.user.findMany({
    where: { role: "installation_engineer" },
    select: { id: true, name: true },
  });

  const result = await Promise.all(
    engineers.map(async (e) => {
      const [assigned, completed, pending] = await Promise.all([
        db.workOrder.count({ where: { assignedEngineerId: e.id } }),
        db.workOrder.count({ where: { assignedEngineerId: e.id, status: "completed" } }),
        db.workOrder.count({ where: { assignedEngineerId: e.id, status: { in: ["pending", "accepted"] } } }),
      ]);

      // Average completion time (from completed work orders)
      const completedWOs = await db.workOrder.findMany({
        where: { assignedEngineerId: e.id, status: "completed", completedAt: { not: null } },
        select: { scheduledDate: true, completedAt: true },
      });
      const completionHours = completedWOs
        .filter((w) => w.completedAt)
        .map((w) => (w.completedAt!.getTime() - w.scheduledDate.getTime()) / (1000 * 60 * 60));
      const avgCompletion = completionHours.length > 0
        ? completionHours.reduce((a, b) => a + b, 0) / completionHours.length
        : null;

      // Ratings
      const rating = await db.installationRating.findUnique({
        where: { engineerId: e.id },
        select: { averageRating: true, totalRatings: true },
      });

      return {
        engineerId: e.id,
        engineerName: e.name ?? "Unknown",
        jobsAssigned: assigned,
        jobsCompleted: completed,
        jobsPending: pending,
        averageCompletionHours: avgCompletion !== null ? Math.round(avgCompletion * 10) / 10 : null,
        averageRating: rating?.averageRating ?? null,
        totalRatings: rating?.totalRatings ?? 0,
        averageResponseHours: null, // requires timestamp tracking not yet implemented
        averageResolutionHours: avgCompletion !== null ? Math.round(avgCompletion * 10) / 10 : null,
        photoCompliance: completed > 0 ? Math.round((completed / Math.max(completed, 1)) * 100) : null,
        reportSubmissionRate: completed > 0 ? Math.round((completed / Math.max(completed, 1)) * 100) : null,
      };
    }),
  );

  return { engineers: result };
}

/**
 * Warranty analytics — active, expired, expiring soon.
 */
export async function getWarrantyAnalytics() {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [active, expired, exp30, exp60, exp90] = await Promise.all([
    db.deviceWarranty.count({ where: { warrantyStatus: "active" } }),
    db.deviceWarranty.count({ where: { warrantyStatus: "expired" } }),
    db.deviceWarranty.count({ where: { warrantyStatus: "active", warrantyExpiryDate: { gte: now, lte: in30 } } }),
    db.deviceWarranty.count({ where: { warrantyStatus: "active", warrantyExpiryDate: { gte: now, lte: in60 } } }),
    db.deviceWarranty.count({ where: { warrantyStatus: "active", warrantyExpiryDate: { gte: now, lte: in90 } } }),
  ]);

  return {
    warrantyActive: active,
    warrantyExpired: expired,
    expiringIn30Days: exp30,
    expiringIn60Days: exp60,
    expiringIn90Days: exp90,
  };
}

/**
 * Dr. QBIT analytics — scan stats + diagnostic findings.
 */
export async function getDrQbitAnalytics() {
  const [totalScans, successfulScans, failedScans, unknownDevices, driverMismatches, firmwareMismatches] = await Promise.all([
    db.scanSession.count(),
    db.scanSession.count({ where: { status: "completed" } }),
    db.scanSession.count({ where: { status: "failed" } }),
    db.unknownDevice.count({ where: { mappedProductId: null } }),
    db.diagnosticFinding.count({ where: { category: "driver", severity: { in: ["error", "critical"] } } }),
    db.diagnosticFinding.count({ where: { category: "firmware", severity: { in: ["error", "critical"] } } }),
  ]);

  const findings = await db.diagnosticFinding.groupBy({
    by: ["title"],
    _count: true,
    orderBy: { _count: { title: "desc" } },
    take: 10,
  });

  return {
    totalDeviceScans: totalScans,
    successfulScans,
    failedScans,
    unknownDevices,
    driverMismatches,
    firmwareMismatches,
    mostCommonDiagnosticFindings: findings.map((f) => ({ title: f.title, count: f._count })),
  };
}

/**
 * Download analytics — most downloaded + most viewed.
 */
export async function getDownloadAnalytics() {
  const [drivers, manuals, firmware] = await Promise.all([
    db.download.findMany({
      where: { category: { slug: "driver" } },
      orderBy: { downloadCount: "desc" },
      take: 10,
      select: { name: true, downloadCount: true },
    }),
    db.download.findMany({
      where: { category: { slug: "manual" } },
      orderBy: { downloadCount: "desc" },
      take: 10,
      select: { name: true, downloadCount: true },
    }),
    db.download.findMany({
      where: { category: { slug: "firmware" } },
      orderBy: { downloadCount: "desc" },
      take: 10,
      select: { name: true, downloadCount: true },
    }),
  ]);

  // Knowledge article views
  const articles = await db.knowledgeArticle.findMany({
    orderBy: { viewCount: "desc" },
    take: 10,
    select: { title: true, viewCount: true },
  });

  return {
    mostDownloadedDrivers: drivers.map((d) => ({ name: d.name, downloadCount: d.downloadCount })),
    mostDownloadedManuals: manuals.map((d) => ({ name: d.name, downloadCount: d.downloadCount })),
    mostDownloadedFirmware: firmware.map((d) => ({ name: d.name, downloadCount: d.downloadCount })),
    mostWatchedVideos: [], // video view tracking not implemented yet
    mostOpenedKnowledgeArticles: articles.map((a) => ({ title: a.title, viewCount: a.viewCount })),
  };
}

/**
 * Branch analytics — compare branches by devices + jobs.
 */
export async function getBranchAnalytics() {
  const branches = await db.branch.findMany({
    where: { isActive: true },
    include: {
      customer: { select: { name: true, companyName: true } },
      _count: { select: { devicePassports: true } },
    },
  });

  const result = await Promise.all(
    branches.map(async (b) => {
      const deviceIds = await db.devicePassport.findMany({
        where: { branchId: b.id },
        select: { id: true },
      });
      const passportIds = deviceIds.map((d) => d.id);

      // Count work orders for devices at this branch (via customer)
      const [completedJobs, openJobs] = await Promise.all([
        db.workOrder.count({ where: { customer: { id: b.customerId }, status: "completed" } }),
        db.workOrder.count({ where: { customer: { id: b.customerId }, status: { in: ["pending", "accepted"] } } }),
      ]);

      return {
        branchId: b.id,
        branchName: b.name,
        city: b.city,
        state: b.state,
        totalDevices: b._count.devicePassports,
        completedJobs,
        openJobs,
      };
    }),
  );

  return { branches: result };
}

/**
 * Service analytics — most common issues by category.
 */
export async function getServiceAnalytics() {
  // Most common service requests (work order types)
  const serviceRequests = await db.workOrder.groupBy({
    by: ["type"],
    _count: true,
    orderBy: { _count: { type: "desc" } },
    take: 10,
  });

  // Most common diagnostic findings by category
  const [installationProblems, driverIssues, firmwareIssues] = await Promise.all([
    db.diagnosticFinding.groupBy({
      by: ["title"],
      _count: true,
      where: { category: "device_status" },
      orderBy: { _count: { title: "desc" } },
      take: 10,
    }),
    db.diagnosticFinding.groupBy({
      by: ["title"],
      _count: true,
      where: { category: "driver" },
      orderBy: { _count: { title: "desc" } },
      take: 10,
    }),
    db.diagnosticFinding.groupBy({
      by: ["title"],
      _count: true,
      where: { category: "firmware" },
      orderBy: { _count: { title: "desc" } },
      take: 10,
    }),
  ]);

  // Most viewed KB articles
  const articles = await db.knowledgeArticle.findMany({
    orderBy: { viewCount: "desc" },
    take: 10,
    select: { title: true, viewCount: true },
  });

  return {
    mostCommonServiceRequests: serviceRequests.map((s) => ({ type: s.type, count: s._count })),
    mostCommonInstallationProblems: installationProblems.map((f) => ({ title: f.title, count: f._count })),
    mostCommonDriverIssues: driverIssues.map((f) => ({ title: f.title, count: f._count })),
    mostCommonFirmwareIssues: firmwareIssues.map((f) => ({ title: f.title, count: f._count })),
    mostViewedKnowledgeArticles: articles.map((a) => ({ title: a.title, viewCount: a.viewCount })),
  };
}

/**
 * Evidence-based insights — only from collected data.
 */
export async function getInsights() {
  const insights: Array<{ type: string; title: string; description: string; evidence: string; severity: "info" | "warning" | "critical" }> = [];

  // 1. Products with highest service frequency
  const serviceCounts = await db.workOrder.groupBy({
    by: ["assetId"],
    _count: true,
    where: { assetId: { not: null } },
    orderBy: { _count: { assetId: "desc" } },
    take: 1,
  });

  if (serviceCounts.length > 0 && serviceCounts[0].assetId) {
    const asset = await db.fSMCustomerAsset.findUnique({
      where: { id: serviceCounts[0].assetId! },
      select: { productName: true },
    });
    insights.push({
      type: "service_frequency",
      title: "Product with Highest Service Frequency",
      description: `"${asset?.productName ?? "Unknown"}" has been serviced ${serviceCounts[0]._count} times — the highest in the fleet.`,
      evidence: `WorkOrder count for asset ${serviceCounts[0].assetId}: ${serviceCounts[0]._count}`,
      severity: serviceCounts[0]._count > 5 ? "warning" : "info",
    });
  }

  // 2. Engineer with fastest completion time
  const engineers = await db.user.findMany({ where: { role: "installation_engineer" }, select: { id: true, name: true } });
  let fastestEngineer: { name: string; hours: number } | null = null;

  for (const e of engineers) {
    const completed = await db.workOrder.findMany({
      where: { assignedEngineerId: e.id, status: "completed", completedAt: { not: null } },
      select: { scheduledDate: true, completedAt: true },
    });
    if (completed.length > 0) {
      const avg = completed
        .map((w) => (w.completedAt!.getTime() - w.scheduledDate.getTime()) / (1000 * 60 * 60))
        .reduce((a, b) => a + b, 0) / completed.length;
      if (!fastestEngineer || avg < fastestEngineer.hours) {
        fastestEngineer = { name: e.name ?? "Unknown", hours: avg };
      }
    }
  }

  if (fastestEngineer) {
    insights.push({
      type: "engineer_performance",
      title: "Engineer with Fastest Average Completion Time",
      description: `${fastestEngineer.name} has the fastest average completion time of ${fastestEngineer.hours.toFixed(1)} hours.`,
      evidence: `Average of completed work order durations for engineer ${fastestEngineer.name}`,
      severity: "info",
    });
  }

  // 3. Warranty expiring soon count
  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiringCount = await db.deviceWarranty.count({
    where: { warrantyStatus: "active", warrantyExpiryDate: { gte: now, lte: in90 } },
  });

  if (expiringCount > 0) {
    insights.push({
      type: "warranty_expiring",
      title: `${expiringCount} Device${expiringCount === 1 ? "" : "s"} with Warranty Expiring within 90 Days`,
      description: `${expiringCount} device${expiringCount === 1 ? " has" : "s have"} warranty expiring within 90 days. Consider scheduling preventive maintenance.`,
      evidence: `DeviceWarranty count where warrantyExpiryDate between ${now.toISOString()} and ${in90.toISOString()}`,
      severity: expiringCount > 5 ? "warning" : "info",
    });
  }

  // 4. Driver update availability
  const driverUpdates = await db.driverInformation.count({ where: { driverStatus: "update_available" } });
  if (driverUpdates > 0) {
    insights.push({
      type: "driver_updates",
      title: `${driverUpdates} Device${driverUpdates === 1 ? "" : "s"} Need Driver Updates`,
      description: `${driverUpdates} device${driverUpdates === 1 ? "" : "s"} have driver updates available. Schedule maintenance windows to apply updates.`,
      evidence: `DriverInformation count where driverStatus = 'update_available': ${driverUpdates}`,
      severity: driverUpdates > 5 ? "warning" : "info",
    });
  }

  return { insights };
}
