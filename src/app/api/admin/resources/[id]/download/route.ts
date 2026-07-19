/**
 * GET /api/admin/resources/[id]/download
 *
 * PUBLIC download endpoint for resources (moved here from /api/resources/[id]/download
 * because Vercel's catch-all route was intercepting the /api/resources/ path).
 *
 * This endpoint is PUBLIC for resources with visibility="public".
 * Non-public resources require admin auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { StorageService } from "@/lib/storage/storage";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const resource = await db.resource.findUnique({
      where: { id },
      select: { id: true, name: true, url: true, mimeType: true, status: true, visibility: true },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    // Check visibility (RBAC)
    if (resource.visibility !== "public") {
      const session = await requireSuperAdminOrAdmin();
      if (!session) {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }
    }

    // Handle data URLs (legacy base64)
    if (resource.url.startsWith("data:")) {
      const base64Data = resource.url.split(",")[1];
      if (!base64Data) return NextResponse.json({ error: "Invalid file data." }, { status: 500 });
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = resource.name.replace(/[^a-zA-Z0-9-_]/g, "_") || "download";
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": resource.mimeType ?? "application/octet-stream",
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    // Handle external URLs (YouTube etc.)
    if (resource.url.startsWith("http://") || resource.url.startsWith("https://")) {
      return NextResponse.redirect(resource.url, { status: 302 });
    }

    // Download from Storage Service
    try {
      const downloadResult = await StorageService.download(resource.url);
      const fileName = resource.name.replace(/[^a-zA-Z0-9-_\.]/g, "_");
      const uint8Array = new Uint8Array(downloadResult.buffer);
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": downloadResult.mimeType,
          "Content-Length": downloadResult.fileSize.toString(),
          "Cache-Control": "no-cache",
        },
      });
    } catch {
      return NextResponse.json({ error: "File not found in storage." }, { status: 404 });
    }
  } catch (error) {
    console.error("[API ERROR] download:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
