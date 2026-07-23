/**
 * GET /api/admin/dashboard — aggregated dashboard data for the admin home page.
 *
 * Returns: KPIs, new releases, popular downloads, pinned resources,
 * bookmarks, recent activity, announcements, and featured products.
 *
 * SECURITY: Super Admin or Administrator only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    // 1. KPI counts
    const productCount = await db.qbitProduct.count({ where: { status: "published" } });
    const userCount = await db.user.count();
    const driverCount = await db.resource.count({ where: { type: { in: ["driver", "windows_driver", "scanner_driver", "printer_driver", "opos", "javapos"] } } });
    const manualCount = await db.resource.count({ where: { type: { in: ["manual", "user_manual", "quick_start", "installation_guide"] } } });
    const firmwareCount = await db.resource.count({ where: { type: "firmware" } });

    // 2. New Releases — latest 8 resources sorted by createdAt desc
    const newReleases = await db.resource.findMany({
      where: { status: "published", visibility: "public" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, name: true, type: true, version: true, fileSize: true,
        downloadCount: true, createdAt: true,
      },
    });

    // 3. Popular Downloads — top 8 by downloadCount
    const popularDownloads = await db.resource.findMany({
      where: { status: "published", visibility: "public", downloadCount: { gt: 0 } },
      orderBy: { downloadCount: "desc" },
      take: 8,
      select: {
        id: true, name: true, type: true, version: true, fileSize: true,
        downloadCount: true, createdAt: true,
      },
    });

    // 4. Pinned Resources — resources linked to featured products
    const pinnedMappings = await db.productResourceMapping.findMany({
      where: { product: { isFeatured: true, status: "published" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, resourceId: true, productId: true,
        resource: { select: { id: true, name: true, type: true, version: true } },
        product: { select: { id: true, name: true, badgeLabel: true } },
      },
    });

    // 5. Bookmarks — user's bookmarked resources
    const userId = session.user.id;
    const bookmarks = await db.articleBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, articleId: true, bookmarkType: true, createdAt: true },
    });

    // 6. Recent Activity — from ActivityFeed table
    const recentActivity = await db.activityFeed.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true, userName: true, action: true, entity: true, entityName: true,
        icon: true, dotColor: true, createdAt: true,
      },
    });

    // If no real activity exists, provide minimal demo entries
    const activityEntries = recentActivity.length > 0 ? recentActivity.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })) : [
      { id: "demo-1", userName: "System", action: "initialized", entity: "platform", entityName: "QBIT Hub", icon: "rocket_launch", dotColor: "primary", createdAt: new Date().toISOString() },
    ];

    // 7. Announcements — active announcements
    const now = new Date();
    const announcements = await db.announcement.findMany({
      where: {
        active: true,
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        startsAt: { lte: now },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, body: true, type: true, severity: true, createdAt: true },
    });

    // 8. Featured Products
    const featuredProducts = await db.qbitProduct.findMany({
      where: { status: "published", isFeatured: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, name: true, slug: true, badgeLabel: true, isTrending: true, updatedAt: true },
    });

    return NextResponse.json({
      kpis: {
        totalProducts: productCount,
        activeUsers: userCount,
        totalDrivers: driverCount,
        totalManuals: manualCount,
        totalFirmware: firmwareCount,
      },
      newReleases: newReleases.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), fileSize: r.fileSize })),
      popularDownloads: popularDownloads.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), fileSize: r.fileSize })),
      pinnedResources: pinnedMappings.map(m => ({
        id: m.id,
        name: m.resource.name,
        type: m.resource.type,
        version: m.resource.version,
        badgeLabel: m.product.badgeLabel,
        createdAt: new Date().toISOString(),
      })),
      bookmarks: bookmarks.map(b => ({ ...b, createdAt: b.createdAt.toISOString() })),
      recentActivity: activityEntries,
      announcements: announcements.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
      featuredProducts: featuredProducts.map(p => ({ ...p, updatedAt: p.updatedAt?.toISOString() ?? new Date().toISOString() })),
    });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/dashboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
