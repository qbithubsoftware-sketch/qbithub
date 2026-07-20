/**
 * POST /api/admin/resources/upload
 *
 * Enterprise-grade file upload endpoint.
 *
 * Flow:
 *  1. Authenticate (requireSuperAdminOrAdmin)
 *  2. Validate file presence
 *  3. Validate MIME type against allowlist
 *  4. Validate file size (max 50MB)
 *  5. Compute SHA-256 checksum
 *  6. Store file via StorageService
 *  7. Return metadata (storageKey, checksum, mimeType, etc.)
 *
 * The frontend then uses this metadata when creating/updating a Resource
 * via POST/PUT /api/admin/resources.
 *
 * Security: requireSuperAdminOrAdmin
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminOrAdmin } from "@/lib/notifications/auth";
import { StorageService } from "@/lib/storage/storage";

/** Blocked extensions — never allow these even if MIME type is valid */
const BLOCKED_EXTENSIONS = new Set([
  ".bat", ".cmd", ".ps1", ".vbs", ".vbe", ".wsf", ".wsh",
  ".scr", ".pif", ".com", ".hta", ".cpl", ".inf",
  ".sh", ".bash", ".zsh", ".fish",
  ".php", ".asp", ".aspx", ".jsp", ".cgi",
]);

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

export async function POST(req: NextRequest) {
  const session = await requireSuperAdminOrAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "Administrator access required" },
      { status: 403 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Use multipart/form-data with field 'file'." },
        { status: 400 },
      );
    }

    // Extension blocklist check
    const ext = getExtension(file.name);
    if (ext && BLOCKED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Blocked file extension: ${ext}. This file type is not allowed for security reasons.` },
        { status: 400 },
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload via Storage Service (validates MIME, size, computes SHA-256)
    const result = await StorageService.upload(
      buffer,
      file.name,
      file.type || "application/octet-stream",
    );

    console.log(
      `[ResourceUpload] ${file.name} → ${result.storageKey} (${result.fileSize} bytes, SHA256: ${result.checksum?.slice(0, 16)}…)`,
    );

    return NextResponse.json({
      success: true,
      storageKey: result.storageKey,
      fileName: result.fileName,
      originalFileName: result.originalFileName,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
      checksum: result.checksum,
      urlType: "storage_key",
    });
  } catch (error) {
    console.error("[API ERROR] POST /api/admin/resources/upload:", error);
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
