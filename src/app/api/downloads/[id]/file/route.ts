/**
 * GET /api/downloads/[id]/file — serve the actual download file (legacy Download model)
 *
 * Flow:
 *  1. Validate the download token (HMAC signature + expiry)
 *  2. Look up the Download record by ID
 *  3. Enforce visibility
 *  4. Increment the download count (single source of truth)
 *  5. Serve the file via the unified serveResourceFile handler
 *
 * Uses the unified download handler for consistent error handling —
 * never returns HTML where JSON is expected.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateDownloadToken, findResourceForDownload, serveResourceFile } from "@/lib/resource-download";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import type { Role } from "@/lib/rbac/roles";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  // Validate token is present and properly signed
  if (!token) {
    return NextResponse.json(
      { error: "Missing download token" },
      { status: 401 },
    );
  }

  if (!validateDownloadToken(token, id)) {
    return NextResponse.json(
      { error: "Invalid or expired download token" },
      { status: 401 },
    );
  }

  try {
    const resource = await findResourceForDownload(id, "download");
    if (!resource) {
      return NextResponse.json(
        { error: "Download not found", downloadId: id },
        { status: 404 },
      );
    }

    // Visibility enforcement
    if (resource.visibility === "internal" || resource.visibility === "restricted") {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (resource.visibility === "restricted") {
        const role = session.user.role as Role;
        if (role !== "administrator" && role !== "installation_engineer") {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }

    // Serve the file using the unified handler
    // incrementCount is true by default in serveResourceFile
    return serveResourceFile(resource, { modelName: "download" });
  } catch (error) {
    console.error("[API ERROR] GET /api/downloads/[id]/file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
