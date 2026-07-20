/**
 * Secure download endpoint — `/api/downloads/[id]`.
 *
 * Flow:
 *  1. Look up the Download row by id.
 *  2. Enforce visibility:
 *       - "public"    → anyone can download
 *       - "internal"  → requires authenticated session
 *       - "restricted"→ requires authenticated session + admin/engineer role
 *  3. Create a DownloadHistory entry (if authenticated).
 *  4. Return a secure, short-lived signed URL to the file-serving
 *     endpoint.  The raw `storagePath` is NEVER sent to the client.
 *
 * Note: download count is incremented ONLY in the /file endpoint,
 * ensuring it counts only successful file deliveries.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import type { Role } from "@/lib/rbac/roles";
import crypto from "crypto";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const download = await db.download.findUnique({
    where: { id },
    include: { category: true, operatingSystems: { include: { os: true } } },
  });

  if (!download) {
    return NextResponse.json({ error: "Download not found" }, { status: 404 });
  }

  // ---- Visibility enforcement ----
  if (download.visibility !== "public") {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (download.visibility === "restricted") {
      const role = session.user.role as Role;
      if (role !== "administrator" && role !== "installation_engineer") {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
    }
  }

  // ---- Record download history (if authenticated) ----
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await db.downloadHistory.create({
        data: {
          downloadId: download.id,
          userId: session.user.id,
        },
      });
    }
  } catch {
    // Non-critical — history logging should not block downloads
  }

  // ---- Generate a secure signed URL ----
  const secureUrl = `/api/downloads/${id}/file?token=${generateToken(download.id)}`;

  return NextResponse.json({
    id: download.id,
    name: download.name,
    version: download.version,
    fileSize: download.fileSize,
    checksum: download.checksum,
    secureUrl,
    expiresIn: 300, // 5 minutes
  });
}

/** Generate a short-lived opaque token (HMAC-signed for tamper resistance). */
function generateToken(downloadId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "download-token-secret";
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
  const payload = `${downloadId}:${expiry}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}
