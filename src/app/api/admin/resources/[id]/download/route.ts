/**
 * GET /api/admin/resources/[id]/download
 *
 * Public download endpoint for resources.
 * Moved here from /api/resources/[id]/download because Vercel's
 * catch-all route was intercepting the /api/resources/ path.
 *
 * Uses the unified serveResourceFile handler — never returns HTML
 * where JSON is expected, never returns 404 without explanation.
 */

import { NextRequest, NextResponse } from "next/server";
import { findResourceForDownload, serveResourceFile } from "@/lib/resource-download";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const resource = await findResourceForDownload(id, "resource");
    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found.", resourceId: id },
        { status: 404 },
      );
    }

    // Visibility enforcement
    if (resource.visibility !== "public") {
      const session = await requireSuperAdminOrAdmin();
      if (!session) {
        return NextResponse.json(
          { error: "Access denied. This resource is not public." },
          { status: 403 },
        );
      }
    }

    return serveResourceFile(resource, { modelName: "resource" });
  } catch (error) {
    console.error("[API ERROR] GET /api/admin/resources/[id]/download:", error);
    return NextResponse.json(
      { error: "Internal server error during download." },
      { status: 500 },
    );
  }
}
